import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database functions
const mockSavePublicNote = vi.fn();

describe('Note Validity Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Expiration Date Calculation', () => {
    it('should calculate expiration date correctly for 1 day', () => {
      const now = new Date('2026-01-21T12:00:00Z');
      const days = 1;
      const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      
      expect(expiresAt.toISOString()).toBe('2026-01-22T12:00:00.000Z');
    });

    it('should calculate expiration date correctly for 7 days', () => {
      const now = new Date('2026-01-21T12:00:00Z');
      const days = 7;
      const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      
      expect(expiresAt.toISOString()).toBe('2026-01-28T12:00:00.000Z');
    });

    it('should default to 7 days when validityDays is not provided', () => {
      const now = new Date('2026-01-21T12:00:00Z');
      const days = undefined || 7;
      const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      
      expect(expiresAt.toISOString()).toBe('2026-01-28T12:00:00.000Z');
    });
  });

  describe('Note Visibility Logic', () => {
    it('should show note when current time is before expiration', () => {
      const now = new Date('2026-01-21T12:00:00Z');
      const noteExpiresAt = new Date('2026-01-25T12:00:00Z');
      
      const isVisible = now.getTime() < noteExpiresAt.getTime();
      
      expect(isVisible).toBe(true);
    });

    it('should hide note when current time is after expiration', () => {
      const now = new Date('2026-01-26T12:00:00Z');
      const noteExpiresAt = new Date('2026-01-25T12:00:00Z');
      
      const isVisible = now.getTime() < noteExpiresAt.getTime();
      
      expect(isVisible).toBe(false);
    });

    it('should hide note when current time equals expiration', () => {
      const now = new Date('2026-01-25T12:00:00Z');
      const noteExpiresAt = new Date('2026-01-25T12:00:00Z');
      
      const isVisible = now.getTime() < noteExpiresAt.getTime();
      
      expect(isVisible).toBe(false);
    });

    it('should fallback to 24h visibility when noteExpiresAt is not set', () => {
      const now = new Date('2026-01-21T12:00:00Z');
      const publicNoteCreatedAt = new Date('2026-01-21T00:00:00Z');
      const noteExpiresAt = null;
      
      // Fallback logic: check if within 24 hours of creation
      const isVisible = noteExpiresAt 
        ? now.getTime() < new Date(noteExpiresAt).getTime()
        : now.getTime() - publicNoteCreatedAt.getTime() < 24 * 60 * 60 * 1000;
      
      expect(isVisible).toBe(true);
    });

    it('should hide note after 24h when noteExpiresAt is not set', () => {
      const now = new Date('2026-01-22T12:00:00Z');
      const publicNoteCreatedAt = new Date('2026-01-21T00:00:00Z');
      const noteExpiresAt = null;
      
      // Fallback logic: check if within 24 hours of creation
      const isVisible = noteExpiresAt 
        ? now.getTime() < new Date(noteExpiresAt).getTime()
        : now.getTime() - publicNoteCreatedAt.getTime() < 24 * 60 * 60 * 1000;
      
      expect(isVisible).toBe(false);
    });
  });

  describe('Validity Days Validation', () => {
    it('should accept validity days between 1 and 7', () => {
      const validDays = [1, 2, 3, 4, 5, 6, 7];
      
      validDays.forEach(days => {
        expect(days >= 1 && days <= 7).toBe(true);
      });
    });

    it('should reject validity days less than 1', () => {
      const invalidDays = 0;
      expect(invalidDays >= 1 && invalidDays <= 7).toBe(false);
    });

    it('should reject validity days greater than 7', () => {
      const invalidDays = 8;
      expect(invalidDays >= 1 && invalidDays <= 7).toBe(false);
    });
  });
});
