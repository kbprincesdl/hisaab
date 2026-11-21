import { describe, expect, it } from 'vitest';
import { isCloudSetupError } from './cloud';

describe('cloud setup detection', () => {
  it('recognises a missing Supabase table', () => {
    expect(
      isCloudSetupError(
        "Could not find the table 'public.shops' in the schema cache"
      )
    ).toBe(true);
    expect(isCloudSetupError('PGRST205')).toBe(true);
  });

  it('does not treat network failures as setup errors', () => {
    expect(isCloudSetupError('Failed to fetch')).toBe(false);
    expect(isCloudSetupError(null)).toBe(false);
  });
});
