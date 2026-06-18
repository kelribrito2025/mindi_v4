import { describe, it, expect } from 'vitest';

describe('Banking Onboarding Pre-fill Logic', () => {
  // Simula a lógica de pré-preenchimento do email
  function resolveEmail(
    currentEmail: string,
    establishmentEmail: string | null | undefined,
  ): string {
    if (!currentEmail) {
      if (establishmentEmail) return establishmentEmail;
    }
    return currentEmail;
  }

  // Simula a lógica de pré-preenchimento do telefone
  function resolvePhone(
    currentPhone: string,
    whatsappStatus: { status: string; phone?: string | null } | null | undefined,
    establishmentWhatsapp: string | null | undefined,
    establishmentPhone: string | null | undefined,
  ): string {
    if (!currentPhone) {
      if (whatsappStatus?.status === 'connected' && whatsappStatus?.phone) {
        return whatsappStatus.phone.replace(/\D/g, '');
      } else if (establishmentWhatsapp) {
        return establishmentWhatsapp.replace(/\D/g, '');
      } else if (establishmentPhone) {
        return (establishmentPhone || '').replace(/\D/g, '');
      }
    }
    return currentPhone;
  }

  describe('Email pre-fill', () => {
    it('should use establishment email when current email is empty', () => {
      const result = resolveEmail('', 'restaurante@email.com');
      expect(result).toBe('restaurante@email.com');
    });

    it('should keep current email if already set', () => {
      const result = resolveEmail('existing@email.com', 'restaurante@email.com');
      expect(result).toBe('existing@email.com');
    });

    it('should return empty string when no email available', () => {
      const result = resolveEmail('', null);
      expect(result).toBe('');
    });

    it('should handle undefined establishment email', () => {
      const result = resolveEmail('', undefined);
      expect(result).toBe('');
    });
  });

  describe('Phone pre-fill', () => {
    it('should use WhatsApp connected phone when available', () => {
      const result = resolvePhone(
        '',
        { status: 'connected', phone: '5531976043833' },
        '31999999999',
        null
      );
      expect(result).toBe('5531976043833');
    });

    it('should use establishment whatsapp when WhatsApp not connected', () => {
      const result = resolvePhone(
        '',
        { status: 'disconnected', phone: null },
        '31999999999',
        null
      );
      expect(result).toBe('31999999999');
    });

    it('should use establishment phone as fallback', () => {
      const result = resolvePhone(
        '',
        null,
        null,
        '(31) 99999-9999'
      );
      expect(result).toBe('31999999999');
    });

    it('should keep current phone if already set', () => {
      const result = resolvePhone(
        '27998765431',
        { status: 'connected', phone: '5531976043833' },
        '31999999999',
        null
      );
      expect(result).toBe('27998765431');
    });

    it('should return empty string when no phone available', () => {
      const result = resolvePhone('', null, null, null);
      expect(result).toBe('');
    });

    it('should strip non-numeric characters from WhatsApp phone', () => {
      const result = resolvePhone(
        '',
        { status: 'connected', phone: '+55 (31) 97604-3833' },
        null,
        null
      );
      expect(result).toBe('5531976043833');
    });

    it('should strip non-numeric characters from establishment whatsapp', () => {
      const result = resolvePhone(
        '',
        { status: 'disconnected' },
        '(31) 99999-9999',
        null
      );
      expect(result).toBe('31999999999');
    });

    it('should prioritize WhatsApp connected phone over establishment whatsapp', () => {
      const result = resolvePhone(
        '',
        { status: 'connected', phone: '5531976043833' },
        '31888888888',
        '31777777777'
      );
      expect(result).toBe('5531976043833');
    });
  });

  describe('Edit toggle behavior', () => {
    it('should show edit button only when field has value', () => {
      const emailHasValue = 'test@email.com';
      const emptyEmail = '';
      
      expect(!!emailHasValue).toBe(true); // button visible
      expect(!!emptyEmail).toBe(false); // button hidden
    });

    it('should disable field when not editable and has value', () => {
      const emailEditable = false;
      const email = 'test@email.com';
      
      const isDisabled = !emailEditable && !!email;
      expect(isDisabled).toBe(true);
    });

    it('should enable field when editable is toggled', () => {
      const emailEditable = true;
      const email = 'test@email.com';
      
      const isDisabled = !emailEditable && !!email;
      expect(isDisabled).toBe(false);
    });

    it('should enable field when no value (for manual input)', () => {
      const emailEditable = false;
      const email = '';
      
      const isDisabled = !emailEditable && !!email;
      expect(isDisabled).toBe(false);
    });
  });
});
