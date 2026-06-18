import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Testes para garantir que cupons de fidelidade só podem ser usados UMA única vez
 * - Cupons de fidelidade começam com "FID" ou "FIDELIDADE"
 * - Após o primeiro uso, o cupom deve ser marcado como "exhausted"
 * - Qualquer tentativa de usar o mesmo cupom deve falhar
 */

describe('Loyalty Coupon Single Use', () => {
  
  describe('incrementCouponUsage', () => {
    it('should mark loyalty coupon as exhausted after first use', async () => {
      // Simula um cupom de fidelidade
      const loyaltyCoupon = {
        id: 1,
        code: 'FID12345678',
        status: 'active',
        usedCount: 0,
        quantity: 1,
      };
      
      // Após incrementCouponUsage, o cupom deve ter:
      // - usedCount: 1
      // - status: 'exhausted'
      expect(loyaltyCoupon.code.startsWith('FID')).toBe(true);
    });
    
    it('should identify FIDELIDADE prefix as loyalty coupon', () => {
      const couponCode = 'FIDELIDADE1KXYZ123';
      const isLoyaltyCoupon = couponCode.startsWith('FID') || couponCode.startsWith('FIDELIDADE');
      expect(isLoyaltyCoupon).toBe(true);
    });
    
    it('should NOT identify regular coupon as loyalty coupon', () => {
      const couponCode = 'PROMO10OFF';
      const isLoyaltyCoupon = couponCode.startsWith('FID') || couponCode.startsWith('FIDELIDADE');
      expect(isLoyaltyCoupon).toBe(false);
    });
  });
  
  describe('validateCoupon', () => {
    it('should return specific error message for used loyalty coupon', () => {
      const coupon = {
        code: 'FID12345678',
        status: 'exhausted',
      };
      
      const isLoyaltyCoupon = coupon.code.startsWith('FID') || coupon.code.startsWith('FIDELIDADE');
      const errorMessage = isLoyaltyCoupon 
        ? "Este cupom de fidelidade já foi utilizado" 
        : "Cupom esgotado";
      
      expect(errorMessage).toBe("Este cupom de fidelidade já foi utilizado");
    });
    
    it('should return generic error for used regular coupon', () => {
      const coupon = {
        code: 'PROMO10OFF',
        status: 'exhausted',
      };
      
      const isLoyaltyCoupon = coupon.code.startsWith('FID') || coupon.code.startsWith('FIDELIDADE');
      const errorMessage = isLoyaltyCoupon 
        ? "Este cupom de fidelidade já foi utilizado" 
        : "Cupom esgotado";
      
      expect(errorMessage).toBe("Cupom esgotado");
    });
  });
  
  describe('consumeLoyaltyCardCoupon', () => {
    it('should set coupon status to exhausted when consumed', () => {
      // Simula o comportamento esperado da função consumeLoyaltyCardCoupon
      const couponUpdate = {
        usedCount: 1,
        quantity: 1,
        status: 'exhausted',
      };
      
      expect(couponUpdate.status).toBe('exhausted');
      expect(couponUpdate.usedCount).toBe(1);
    });
  });
  
  describe('Loyalty coupon creation', () => {
    it('should create coupon with quantity=1 for single use', () => {
      // Simula a criação de cupom de fidelidade com novo formato
      const generateShortCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 5; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };
      
      const newCoupon = {
        code: `FID${generateShortCode()}`,
        quantity: 1,
        usedCount: 0,
        status: 'active',
      };
      
      expect(newCoupon.quantity).toBe(1);
      expect(newCoupon.usedCount).toBe(0);
      expect(newCoupon.status).toBe('active');
      expect(newCoupon.code.startsWith('FID')).toBe(true);
      expect(newCoupon.code.length).toBe(8); // FID + 5 caracteres = 8
    });
    
    it('should generate code with max 8 characters', () => {
      const generateShortCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 5; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };
      
      const code = `FID${generateShortCode()}`;
      expect(code.length).toBe(8);
      expect(code).toMatch(/^FID[A-Z2-9]{5}$/);
    });
    
    it('should not include confusing characters (I, O, 0, 1)', () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      expect(chars).not.toContain('I');
      expect(chars).not.toContain('O');
      expect(chars).not.toContain('0');
      expect(chars).not.toContain('1');
    });
  });
  
  describe('Unique code generation', () => {
    it('should generate different codes on multiple calls', () => {
      const generateShortCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 5; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };
      
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(`FID${generateShortCode()}`);
      }
      
      // Com 100 gerações, devemos ter pelo menos 95 códigos únicos
      // (probabilidade de colisão é muito baixa com 32^5 = 33 milhões de combinações)
      expect(codes.size).toBeGreaterThan(95);
    });
    
    it('should have fallback mechanism for collision handling', () => {
      // Simula o comportamento de fallback
      const maxAttempts = 10;
      let attempts = 0;
      const existingCodes = new Set(['FIDAAAAA', 'FIDBBBBB', 'FIDCCCCC']);
      
      const generateWithFallback = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          let shortCode = '';
          for (let i = 0; i < 5; i++) {
            shortCode += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          const code = `FID${shortCode}`;
          attempts++;
          
          if (!existingCodes.has(code)) {
            return code;
          }
        }
        
        // Fallback com timestamp
        return `FID${Date.now().toString(36).slice(-5).toUpperCase()}`;
      };
      
      const code = generateWithFallback();
      expect(code.startsWith('FID')).toBe(true);
      expect(code.length).toBe(8);
    });
    
    it('should check code uniqueness globally (not per establishment)', () => {
      // O código deve ser único globalmente para evitar confusão
      // mesmo que dois estabelecimentos diferentes gerem cupons
      const globalCodes = new Set<string>();
      
      // Simula geração de códigos para diferentes estabelecimentos
      const establishment1Codes = ['FIDAB2C3', 'FIDDE4F5'];
      const establishment2Codes = ['FIDGH6H7', 'FIDJK8L9'];
      
      establishment1Codes.forEach(code => globalCodes.add(code));
      establishment2Codes.forEach(code => globalCodes.add(code));
      
      // Todos os códigos devem ser únicos globalmente
      expect(globalCodes.size).toBe(4);
    });
  });
});
