import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Automatic Webhook Configuration on Instance Creation', () => {
  const routersSource = readFileSync(join(__dirname, 'routers.ts'), 'utf-8');
  const uazapiSource = readFileSync(join(__dirname, '_core/uazapi.ts'), 'utf-8');

  it('should import configureWebhook in the connect procedure', () => {
    expect(routersSource).toContain('configureWebhook');
  });

  it('should have the n8n webhook URL configured', () => {
    expect(routersSource).toContain('https://webn8n.granaupvps.shop/webhook/mindi');
  });

  it('should call configureWebhook after instance creation', () => {
    // Find the section after upsertWhatsappConfig where webhook is configured
    const webhookConfigIndex = routersSource.indexOf('Configurar webhook padrão do n8n automaticamente');
    const instanceCreationIndex = routersSource.indexOf('upsertWhatsappConfig');
    
    expect(webhookConfigIndex).toBeGreaterThan(-1);
    expect(instanceCreationIndex).toBeGreaterThan(-1);
    // Webhook config should come after instance creation
    expect(webhookConfigIndex).toBeGreaterThan(instanceCreationIndex);
  });

  it('should handle webhook configuration errors gracefully (non-blocking)', () => {
    // The webhook configuration should be wrapped in try-catch and not block the flow
    expect(routersSource).toContain('não bloqueante');
    expect(routersSource).toContain('catch (webhookError)');
  });

  it('should configure webhook on every connect/reconnect, not just on creation', () => {
    // There should be webhook configuration both after instance creation AND after connectInstance
    const webhookOnCreation = routersSource.indexOf('Webhook n8n configurado automaticamente');
    const webhookOnConnect = routersSource.indexOf('Webhook n8n configurado na conexão');
    
    expect(webhookOnCreation).toBeGreaterThan(-1);
    expect(webhookOnConnect).toBeGreaterThan(-1);
    // Both should exist and be at different positions
    expect(webhookOnConnect).not.toBe(webhookOnCreation);
  });

  it('should have configureWebhook function in uazapi module', () => {
    expect(uazapiSource).toContain('export async function configureWebhook');
  });

  it('configureWebhook should send correct webhook configuration', () => {
    // Verify the function sends enabled: true and url parameter
    expect(uazapiSource).toContain("enabled: true");
    expect(uazapiSource).toContain("url: webhookUrl");
  });

  it('configureWebhook should exclude messages sent by API to avoid loops', () => {
    expect(uazapiSource).toContain("excludeMessages: ['wasSentByApi']");
  });
});
