import { describe, it, expect } from 'vitest';

/**
 * CPF validation algorithm (same as in uazapi.ts)
 * Used to distinguish CPF keys from phone numbers when both have 11 digits
 */
function isValidCPF(cpf: string): boolean {
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

/**
 * PIX key type detection (same logic as in uazapi.ts sendPixButton)
 */
function detectPixKeyType(pixKey: string): string {
  const cleanKey = pixKey.replace(/\D/g, '');
  if (pixKey.includes('@')) {
    return 'EMAIL';
  } else if (cleanKey.length === 11 && !pixKey.includes('+')) {
    return isValidCPF(cleanKey) ? 'CPF' : 'PHONE';
  } else if (cleanKey.length === 14) {
    return 'CNPJ';
  } else if (cleanKey.length === 10 && !pixKey.includes('+')) {
    return 'PHONE';
  } else if (cleanKey.length === 13 && cleanKey.startsWith('55')) {
    return 'PHONE';
  } else if (cleanKey.length === 12 && cleanKey.startsWith('55')) {
    return 'PHONE';
  } else if (pixKey.startsWith('+')) {
    return 'PHONE';
  } else {
    return 'EVP';
  }
}

describe('PIX Key Type Detection', () => {
  describe('isValidCPF', () => {
    it('should validate known valid CPFs', () => {
      expect(isValidCPF('52998224725')).toBe(true);
      expect(isValidCPF('11144477735')).toBe(true);
    });

    it('should reject phone numbers that look like CPF (11 digits)', () => {
      // Real phone numbers from the database
      expect(isValidCPF('34996425484')).toBe(false); // Pica Pau Lanches - the reported bug
      expect(isValidCPF('88997904278')).toBe(false); // Sushi Haruno
      expect(isValidCPF('34997813557')).toBe(false); // Sr. Macarrão
      expect(isValidCPF('98991660471')).toBe(false); // Açai Roxedo
    });

    it('should reject all-same-digit patterns', () => {
      expect(isValidCPF('00000000000')).toBe(false);
      expect(isValidCPF('11111111111')).toBe(false);
      expect(isValidCPF('99999999999')).toBe(false);
    });

    it('should reject strings with wrong length', () => {
      expect(isValidCPF('1234567890')).toBe(false);  // 10 digits
      expect(isValidCPF('123456789012')).toBe(false); // 12 digits
    });
  });

  describe('detectPixKeyType', () => {
    it('should detect EMAIL keys', () => {
      expect(detectPixKeyType('pix@burgerhouse.com.br')).toBe('EMAIL');
      expect(detectPixKeyType('user@example.com')).toBe('EMAIL');
    });

    it('should detect PHONE keys (11 digits - mobile)', () => {
      // The main bug fix: these were incorrectly detected as CPF
      expect(detectPixKeyType('34996425484')).toBe('PHONE'); // Pica Pau Lanches
      expect(detectPixKeyType('88997904278')).toBe('PHONE'); // Sushi Haruno
      expect(detectPixKeyType('34997813557')).toBe('PHONE'); // Sr. Macarrão
      expect(detectPixKeyType('98991660471')).toBe('PHONE'); // Açai Roxedo
    });

    it('should detect PHONE keys with formatting', () => {
      expect(detectPixKeyType('2799503-5451')).toBe('PHONE');  // Palácio do Açai
      expect(detectPixKeyType('34 99778-6737')).toBe('PHONE'); // Potim Açai
      expect(detectPixKeyType('(34) 99642-5484')).toBe('PHONE');
    });

    it('should detect PHONE keys with + prefix', () => {
      expect(detectPixKeyType('+5534996425484')).toBe('PHONE');
      expect(detectPixKeyType('+5511999999999')).toBe('PHONE');
    });

    it('should detect PHONE keys with country code (13 digits)', () => {
      expect(detectPixKeyType('5534996425484')).toBe('PHONE');
      expect(detectPixKeyType('5511999999999')).toBe('PHONE');
    });

    it('should detect PHONE keys - landline (10 digits)', () => {
      expect(detectPixKeyType('3432221234')).toBe('PHONE');
    });

    it('should detect PHONE keys - landline with country code (12 digits)', () => {
      expect(detectPixKeyType('553432221234')).toBe('PHONE');
    });

    it('should detect CPF keys (valid CPF with 11 digits)', () => {
      expect(detectPixKeyType('52998224725')).toBe('CPF');
      expect(detectPixKeyType('11144477735')).toBe('CPF');
    });

    it('should detect CNPJ keys (14 digits)', () => {
      expect(detectPixKeyType('34002837000191')).toBe('CNPJ'); // Big Norte
      expect(detectPixKeyType('44119631000108')).toBe('CNPJ'); // Wood Restaurante
      expect(detectPixKeyType('04827355000100')).toBe('CNPJ'); // Tchê Restaurante
    });

    it('should detect EVP (random/UUID) keys', () => {
      expect(detectPixKeyType('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe('EVP');
    });
  });

  describe('Regression: Pica Pau Lanches (ID 210006)', () => {
    it('should detect "34996425484" as PHONE, not CPF', () => {
      // This was the reported bug: the key 34996425484 is a phone number
      // (DDD 34 + 99642-5484) but was being classified as CPF
      const result = detectPixKeyType('34996425484');
      expect(result).toBe('PHONE');
      expect(result).not.toBe('CPF');
    });
  });
});
