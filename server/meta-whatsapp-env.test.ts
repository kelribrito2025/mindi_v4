import { describe, it, expect } from 'vitest';

describe('Meta WhatsApp Cloud API - Environment Variables', () => {
  it('META_APP_ID should be set and non-empty', () => {
    expect(process.env.META_APP_ID).toBeDefined();
    expect(process.env.META_APP_ID!.length).toBeGreaterThan(0);
  });

  it('META_APP_SECRET should be set and non-empty', () => {
    expect(process.env.META_APP_SECRET).toBeDefined();
    expect(process.env.META_APP_SECRET!.length).toBeGreaterThan(0);
  });

  it('META_CONFIG_ID should be set and non-empty', () => {
    expect(process.env.META_CONFIG_ID).toBeDefined();
    expect(process.env.META_CONFIG_ID!.length).toBeGreaterThan(0);
  });

  it('WHATSAPP_VERIFY_TOKEN should be set and non-empty', () => {
    expect(process.env.WHATSAPP_VERIFY_TOKEN).toBeDefined();
    expect(process.env.WHATSAPP_VERIFY_TOKEN!.length).toBeGreaterThan(0);
  });

  it('ENV object should expose metaAppId and metaAppSecret', async () => {
    const { ENV } = await import('./_core/env');
    expect(ENV.metaAppId).toBeDefined();
    expect(ENV.metaAppId.length).toBeGreaterThan(0);
    expect(ENV.metaAppSecret).toBeDefined();
    expect(ENV.metaAppSecret.length).toBeGreaterThan(0);
    expect(ENV.metaConfigId).toBeDefined();
    expect(ENV.metaConfigId.length).toBeGreaterThan(0);
  });
});
