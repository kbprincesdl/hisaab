import { createWorker } from 'tesseract.js';

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function compressImageToDataUrl(file: File, maxDim = 900): Promise<string> {
  const rawDataUrl = await readFileAsDataUrl(file);
  try {
    const img = await loadImageElement(rawDataUrl);
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return rawDataUrl;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return rawDataUrl;
  }
}

function buildOcrCanvas(img: HTMLImageElement): HTMLCanvasElement {
  // Upscale small screenshots for sharper character recognition
  const minWidth = 700;
  const scale = img.width < minWidth ? minWidth / img.width : Math.min(1.5, 1400 / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
  }
  return canvas;
}

export function parsePaymentAmountFromText(text: string): number | null {
  if (!text) return null;
  const normalized = text.replace(/\u20B9/g, '₹').replace(/\r/g, '\n');

  // Priority 1: Explicit currency symbols or payment keywords next to a number
  const currencyPatterns = [
    /(?:₹|Rs\.?|INR)\s*([0-9][0-9,]*(?:\.\d{1,2})?)/gi,
    /(?:Paid|Amount|Total|Received|Sent|Payment)\s*(?:of|:|-|to)?\s*(?:₹|Rs\.?|INR)?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/gi,
  ];

  const candidates: number[] = [];
  for (const regex of currencyPatterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(normalized)) !== null) {
      const cleaned = match[1].replace(/,/g, '');
      const val = parseFloat(cleaned);
      if (Number.isFinite(val) && val > 0 && val <= 500000) {
        candidates.push(Math.round(val * 100) / 100);
      }
    }
  }

  if (candidates.length > 0) {
    return candidates[0];
  }

  // Priority 2: Standalone numbers (excluding years like 2024-2029, 10+ digit phone/UTR numbers, time hh:mm)
  const sanitized = normalized
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ')
    .replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, ' ')
    .replace(/\b20[2-3]\d\b/g, ' ');

  const numberMatches = sanitized.match(/\b[1-9][0-9,]*(?:\.\d{1,2})?\b/g) ?? [];
  for (const raw of numberMatches) {
    const digitsOnly = raw.replace(/,/g, '');
    if (digitsOnly.replace('.', '').length >= 7) continue; // skip UTR/phone/ref numbers
    const val = parseFloat(digitsOnly);
    if (Number.isFinite(val) && val >= 1 && val <= 200000) {
      return Math.round(val * 100) / 100;
    }
  }

  return null;
}

export async function extractAmountFromImage(file: File): Promise<{ amount: number | null; rawText: string }> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImageElement(dataUrl);
  const canvas = buildOcrCanvas(img);

  const worker = await createWorker('eng', 1, {
    workerPath: '/tesseract/worker.min.js',
    corePath: '/tesseract',
    langPath: '/tesseract',
    workerBlobURL: false,
  });

  try {
    const result = await worker.recognize(canvas);
    const rawText = result.data?.text ?? '';
    const amount = parsePaymentAmountFromText(rawText);
    return { amount, rawText };
  } finally {
    await worker.terminate();
  }
}
