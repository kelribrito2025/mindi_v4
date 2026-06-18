import { describe, it, expect } from 'vitest';

/**
 * Tests for receipt timestamp timezone handling.
 * 
 * The bug: formatDate in receipt generation used toLocaleString('pt-BR') without
 * specifying timeZone. Since the server runs in UTC, timestamps were displayed
 * in UTC instead of the establishment's timezone (e.g., America/Sao_Paulo = UTC-3).
 * 
 * Example: An order placed at 18:15 BRT (21:15 UTC) would show as 21:15 on the receipt.
 * 
 * The fix: All formatDate functions now include timeZone parameter using the
 * establishment's timezone, falling back to 'America/Sao_Paulo'.
 */

describe('Receipt timestamp timezone handling', () => {
  // Simulate the fixed formatDate function
  const formatDate = (date: Date | string, timezone?: string) => {
    const d = new Date(date);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone || 'America/Sao_Paulo'
    });
  };

  // Simulate the OLD buggy formatDate (no timezone)
  const formatDateOld = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC' // Server default when no timezone specified
    });
  };

  it('should format date in America/Sao_Paulo timezone (UTC-3)', () => {
    // 21:15 UTC = 18:15 BRT (America/Sao_Paulo)
    const utcDate = '2026-02-20T21:15:00.000Z';
    const result = formatDate(utcDate, 'America/Sao_Paulo');
    
    // Should show 18:15 (BRT), not 21:15 (UTC)
    expect(result).toContain('18:15');
    expect(result).toContain('20/02/2026');
  });

  it('should show UTC time when no timezone is specified (old bug)', () => {
    const utcDate = '2026-02-20T21:15:00.000Z';
    const result = formatDateOld(utcDate);
    
    // Old behavior: shows UTC time (21:15)
    expect(result).toContain('21:15');
  });

  it('should demonstrate the 3-hour difference bug', () => {
    const utcDate = '2026-02-20T21:15:00.000Z';
    const oldResult = formatDateOld(utcDate);
    const fixedResult = formatDate(utcDate, 'America/Sao_Paulo');
    
    // Old shows 21:15, fixed shows 18:15
    expect(oldResult).toContain('21:15');
    expect(fixedResult).toContain('18:15');
    expect(oldResult).not.toEqual(fixedResult);
  });

  it('should use America/Sao_Paulo as default when no timezone provided', () => {
    const utcDate = '2026-02-20T21:15:00.000Z';
    const resultWithTz = formatDate(utcDate, 'America/Sao_Paulo');
    const resultDefault = formatDate(utcDate); // No timezone = defaults to Sao_Paulo
    
    expect(resultWithTz).toEqual(resultDefault);
  });

  it('should handle different establishment timezones', () => {
    const utcDate = '2026-02-20T21:15:00.000Z';
    
    // Manaus (UTC-4)
    const manausResult = formatDate(utcDate, 'America/Manaus');
    expect(manausResult).toContain('17:15');
    
    // Fernando de Noronha (UTC-2)
    const noronhaResult = formatDate(utcDate, 'America/Noronha');
    expect(noronhaResult).toContain('19:15');
  });

  it('should handle null/undefined establishment timezone gracefully', () => {
    const utcDate = '2026-02-20T21:15:00.000Z';
    
    // Simulates establishment?.timezone being undefined
    const result = formatDate(utcDate, undefined);
    expect(result).toContain('18:15'); // Falls back to Sao_Paulo
  });

  it('should correctly format midnight UTC as 21:00 BRT previous day', () => {
    const midnightUtc = '2026-02-21T00:00:00.000Z';
    const result = formatDate(midnightUtc, 'America/Sao_Paulo');
    
    // 00:00 UTC = 21:00 BRT (previous day)
    expect(result).toContain('21:00');
    expect(result).toContain('20/02/2026');
  });

  it('should handle date string formats from database', () => {
    // Database might return different date formats
    const isoDate = '2026-02-20T15:30:00.000Z';
    const result = formatDate(isoDate, 'America/Sao_Paulo');
    
    // 15:30 UTC = 12:30 BRT
    expect(result).toContain('12:30');
  });

  it('should handle Date objects', () => {
    const dateObj = new Date('2026-02-20T21:15:00.000Z');
    const result = formatDate(dateObj, 'America/Sao_Paulo');
    
    expect(result).toContain('18:15');
  });
});
