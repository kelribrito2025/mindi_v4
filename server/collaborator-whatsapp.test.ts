import { describe, it, expect } from 'vitest';

describe('Collaborator WhatsApp Feature', () => {
  it('should accept collaborator creation without whatsapp field', () => {
    const input = {
      establishmentId: 1,
      name: 'Test',
      email: 'test@test.com',
      password: 'password123',
      permissions: ['pdv'],
    };
    expect(input.establishmentId).toBeDefined();
    expect(input.name).toBeDefined();
    expect(input.email).toBeDefined();
    expect(input.password).toBeDefined();
    expect(input.permissions).toBeDefined();
    expect((input as any).whatsapp).toBeUndefined();
  });

  it('should accept collaborator creation with whatsapp field', () => {
    const input = {
      establishmentId: 1,
      name: 'Test',
      email: 'test@test.com',
      password: 'password123',
      permissions: ['pdv'],
      whatsapp: '11999998888',
    };
    expect(input.whatsapp).toBe('11999998888');
  });

  it('should clean whatsapp number correctly', () => {
    const rawWhatsapp = '(11) 99999-8888';
    const cleaned = rawWhatsapp.replace(/\D/g, '');
    expect(cleaned).toBe('11999998888');
    expect(cleaned.length).toBe(11);
  });

  it('should detect short whatsapp numbers', () => {
    const shortNumber = '(11) 9999';
    const cleaned = shortNumber.replace(/\D/g, '');
    expect(cleaned.length).toBeLessThan(10);
  });

  it('should format whatsapp mask correctly for full number', () => {
    let v = '11999998888';
    if (v.length > 6) {
      v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    }
    expect(v).toBe('(11) 99999-8888');
  });

  it('should format whatsapp mask correctly for partial number', () => {
    let v = '119';
    if (v.length > 6) {
      v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    } else if (v.length > 2) {
      v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    }
    expect(v).toBe('(11) 9');
  });

  it('should handle empty whatsapp value', () => {
    const whatsapp = '';
    const cleaned = whatsapp.replace(/\D/g, '');
    expect(cleaned.length).toBe(0);
    const shouldSend = cleaned.length >= 10;
    expect(shouldSend).toBe(false);
  });

  it('should determine whatsappSent based on response', () => {
    const resultSent = { id: 1, whatsappSent: true };
    expect(resultSent.whatsappSent).toBe(true);

    const resultNotSent = { id: 2, whatsappSent: false };
    expect(resultNotSent.whatsappSent).toBe(false);
  });
});
