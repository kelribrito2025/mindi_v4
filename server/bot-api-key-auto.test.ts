import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Auto API Key Creation on WhatsApp Connect', () => {
  const routersSource = readFileSync(join(__dirname, 'routers.ts'), 'utf-8');
  const botPageSource = readFileSync(join(__dirname, '../client/src/pages/BotWhatsApp.tsx'), 'utf-8');

  it('should auto-create global API key after instance creation', () => {
    expect(routersSource).toContain('Criar API Key global automaticamente se não existir');
  });

  it('should check for existing global key before creating', () => {
    expect(routersSource).toContain('existingGlobalKey');
    expect(routersSource).toContain('eq(botApiKeys.isGlobal, true)');
  });

  it('should only create global key if none exists', () => {
    expect(routersSource).toContain('existingGlobalKey.length === 0');
  });

  it('should use bot_global_ prefix for auto-created keys', () => {
    // Find the auto-creation section
    const autoCreateSection = routersSource.indexOf('Criar API Key global automaticamente');
    const nextSection = routersSource.indexOf('config = await db.getWhatsappConfig', autoCreateSection);
    const section = routersSource.substring(autoCreateSection, nextSection);
    
    expect(section).toContain('bot_global_');
  });

  it('should handle API key creation errors gracefully (non-blocking)', () => {
    expect(routersSource).toContain('catch (apiKeyError)');
    expect(routersSource).toContain('Erro ao criar API Key global (não bloqueante)');
  });

  it('should name the auto-created key with establishment name', () => {
    expect(routersSource).toContain('`Bot ${establishment.name}`');
  });
});

describe('BotWhatsApp Page Simplification', () => {
  const botPageSource = readFileSync(join(__dirname, '../client/src/pages/BotWhatsApp.tsx'), 'utf-8');

  it('should NOT have API Keys list section', () => {
    expect(botPageSource).not.toContain('API Keys');
    expect(botPageSource).not.toContain('chave cadastrada');
    expect(botPageSource).not.toContain('Nova API Key');
  });

  it('should NOT have create key dialog', () => {
    expect(botPageSource).not.toContain('showCreateDialog');
    expect(botPageSource).not.toContain('Criar Nova API Key');
    expect(botPageSource).not.toContain('DialogTrigger');
  });

  it('should NOT have delete key dialog', () => {
    expect(botPageSource).not.toContain('deleteKeyId');
    expect(botPageSource).not.toContain('Excluir API Key');
    expect(botPageSource).not.toContain('AlertDialog');
  });

  it('should still have the bot toggle', () => {
    expect(botPageSource).toContain('Bot Ativo');
    expect(botPageSource).toContain('Bot Inativo');
    expect(botPageSource).toContain('toggleBotMutation');
    expect(botPageSource).toContain('whatsappBotEnabled');
  });

  it('should still have endpoints documentation', () => {
    expect(botPageSource).toContain('Como integrar');
    expect(botPageSource).toContain('/api/bot/establishment');
    expect(botPageSource).toContain('/api/bot/menu');
    expect(botPageSource).toContain('/api/bot/orders');
    expect(botPageSource).toContain('/api/bot/bot-status');
  });

  it('should mention that API key is auto-generated', () => {
    expect(botPageSource).toContain('gerada automaticamente');
  });
});
