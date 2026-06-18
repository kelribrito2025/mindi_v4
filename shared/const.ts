export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

/**
 * Lista de timezones IANA suportados pelo sistema, organizados por região.
 * Usada tanto no frontend (Configurações, Onboarding) quanto no backend (validação).
 */
export const SUPPORTED_TIMEZONES = [
  // Brasil
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)', group: 'Brasil' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)', group: 'Brasil' },
  { value: 'America/Cuiaba', label: 'Cuiabá (GMT-4)', group: 'Brasil' },
  { value: 'America/Belem', label: 'Belém (GMT-3)', group: 'Brasil' },
  { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)', group: 'Brasil' },
  { value: 'America/Recife', label: 'Recife (GMT-3)', group: 'Brasil' },
  { value: 'America/Bahia', label: 'Salvador (GMT-3)', group: 'Brasil' },
  { value: 'America/Campo_Grande', label: 'Campo Grande (GMT-4)', group: 'Brasil' },
  { value: 'America/Porto_Velho', label: 'Porto Velho (GMT-4)', group: 'Brasil' },
  { value: 'America/Boa_Vista', label: 'Boa Vista (GMT-4)', group: 'Brasil' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)', group: 'Brasil' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (GMT-2)', group: 'Brasil' },
  // Portugal
  { value: 'Europe/Lisbon', label: 'Lisboa (GMT+0)', group: 'Portugal' },
  { value: 'Atlantic/Azores', label: 'Açores (GMT-1)', group: 'Portugal' },
  { value: 'Atlantic/Madeira', label: 'Madeira (GMT+0)', group: 'Portugal' },
  // Outros
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)', group: 'Outros' },
  { value: 'America/Montevideo', label: 'Montevidéu (GMT-3)', group: 'Outros' },
  { value: 'America/Santiago', label: 'Santiago (GMT-4)', group: 'Outros' },
  { value: 'America/Bogota', label: 'Bogotá (GMT-5)', group: 'Outros' },
  { value: 'America/Lima', label: 'Lima (GMT-5)', group: 'Outros' },
  { value: 'America/New_York', label: 'Nova York (GMT-5)', group: 'Outros' },
  { value: 'America/Chicago', label: 'Chicago (GMT-6)', group: 'Outros' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)', group: 'Outros' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1)', group: 'Outros' },
  { value: 'Europe/Paris', label: 'Paris (GMT+1)', group: 'Outros' },
  { value: 'Europe/London', label: 'Londres (GMT+0)', group: 'Outros' },
  { value: 'Asia/Tokyo', label: 'Tóquio (GMT+9)', group: 'Outros' },
] as const;

/**
 * Mapeia um timezone IANA detectado pelo navegador para o timezone suportado mais próximo.
 * Se o timezone detectado já estiver na lista, retorna-o diretamente.
 * Caso contrário, tenta encontrar o mais próximo pelo offset UTC.
 */
export function detectBestTimezone(browserTimezone?: string): string {
  const detected = browserTimezone || 'America/Sao_Paulo';
  
  // Se o timezone detectado já está na lista suportada, usar diretamente
  if (SUPPORTED_TIMEZONES.some(tz => tz.value === detected)) {
    return detected;
  }
  
  // Calcular o offset UTC do timezone detectado
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: detected,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find(p => p.type === 'timeZoneName')?.value || '';
    // Parse offset like "GMT-3" or "GMT+5:30"
    const match = tzPart.match(/GMT([+-]?)(\d+)(?::(\d+))?/);
    if (match) {
      const sign = match[1] === '-' ? -1 : 1;
      const hours = parseInt(match[2]) || 0;
      const minutes = parseInt(match[3]) || 0;
      const detectedOffset = sign * (hours * 60 + minutes);
      
      // Encontrar o timezone suportado com o offset mais próximo
      let bestMatch = 'America/Sao_Paulo';
      let bestDiff = Infinity;
      
      for (const tz of SUPPORTED_TIMEZONES) {
        const tzFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tz.value,
          hour: 'numeric',
          minute: 'numeric',
          hour12: false,
          timeZoneName: 'shortOffset',
        });
        const tzParts = tzFormatter.formatToParts(now);
        const tzOffset = tzParts.find(p => p.type === 'timeZoneName')?.value || '';
        const tzMatch = tzOffset.match(/GMT([+-]?)(\d+)(?::(\d+))?/);
        if (tzMatch) {
          const tzSign = tzMatch[1] === '-' ? -1 : 1;
          const tzHours = parseInt(tzMatch[2]) || 0;
          const tzMinutes = parseInt(tzMatch[3]) || 0;
          const supportedOffset = tzSign * (tzHours * 60 + tzMinutes);
          const diff = Math.abs(detectedOffset - supportedOffset);
          if (diff < bestDiff) {
            bestDiff = diff;
            bestMatch = tz.value;
          }
        }
      }
      return bestMatch;
    }
  } catch {
    // Se falhar, retornar o default
  }
  
  return 'America/Sao_Paulo';
}
