export function createSafeRandomId(prefix = "id"): string {
  const cryptoObject = globalThis.crypto;

  if (cryptoObject && typeof cryptoObject.randomUUID === "function") {
    try {
      return cryptoObject.randomUUID();
    } catch {
      // Continua para os fallbacks abaixo quando o browser não permitir randomUUID neste contexto.
    }
  }

  if (cryptoObject && typeof cryptoObject.getRandomValues === "function") {
    try {
      const bytes = new Uint8Array(16);
      cryptoObject.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
      return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
    } catch {
      // Continua para fallback final não criptográfico.
    }
  }

  const randomPart = Math.random().toString(36).slice(2);
  const timePart = Date.now().toString(36);
  return `${prefix}_${timePart}_${randomPart}`;
}
