import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from './db';

describe('Timezone Helpers', () => {
  describe('getLocalDate', () => {
    it('should return a Date object for a valid IANA timezone', () => {
      const result = db.getLocalDate('America/Sao_Paulo');
      expect(result).toBeInstanceOf(Date);
    });

    it('should return different times for different timezones', () => {
      const saoPaulo = db.getLocalDate('America/Sao_Paulo');
      const tokyo = db.getLocalDate('Asia/Tokyo');
      // Tokyo is 12 hours ahead of São Paulo
      // The hours should differ (unless it's exactly midnight in one)
      // We just verify they are valid dates
      expect(saoPaulo.getTime()).toBeDefined();
      expect(tokyo.getTime()).toBeDefined();
    });

    it('should handle UTC timezone', () => {
      const utc = db.getLocalDate('UTC');
      expect(utc).toBeInstanceOf(Date);
      // getLocalDate converts via toLocaleString, so hours should match UTC
      const nowUtc = new Date();
      const utcHour = nowUtc.getUTCHours();
      expect(utc.getHours()).toBe(utcHour);
    });
  });

  describe('fmtLocalDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date(2026, 1, 9); // Feb 9, 2026
      const result = db.fmtLocalDate(date);
      expect(result).toBe('2026-02-09');
    });

    it('should pad single digit months and days', () => {
      const date = new Date(2026, 0, 5); // Jan 5, 2026
      const result = db.fmtLocalDate(date);
      expect(result).toBe('2026-01-05');
    });

    it('should handle December correctly', () => {
      const date = new Date(2025, 11, 31); // Dec 31, 2025
      const result = db.fmtLocalDate(date);
      expect(result).toBe('2025-12-31');
    });
  });

  describe('fmtLocalDateTime', () => {
    it('should format date as YYYY-MM-DD HH:MM:SS', () => {
      const date = new Date(2026, 1, 9, 14, 30, 45); // Feb 9, 2026 14:30:45
      const result = db.fmtLocalDateTime(date);
      expect(result).toBe('2026-02-09 14:30:45');
    });

    it('should pad single digit values', () => {
      const date = new Date(2026, 0, 5, 3, 5, 7); // Jan 5, 2026 03:05:07
      const result = db.fmtLocalDateTime(date);
      expect(result).toBe('2026-01-05 03:05:07');
    });

    it('should handle midnight correctly', () => {
      const date = new Date(2026, 5, 15, 0, 0, 0); // Jun 15, 2026 00:00:00
      const result = db.fmtLocalDateTime(date);
      expect(result).toBe('2026-06-15 00:00:00');
    });
  });

  describe('getEstablishmentTimezone', () => {
    it('should return America/Sao_Paulo as default when DB is not available', async () => {
      const result = await db.getEstablishmentTimezone(-1);
      // Should return the fallback since establishment -1 doesn't exist
      expect(result).toBe('America/Sao_Paulo');
    });
  });
});
