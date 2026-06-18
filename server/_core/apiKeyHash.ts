import crypto from "crypto";

/**
 * Gera hash SHA-256 de uma API key para armazenamento seguro.
 *
 * Usamos SHA-256 (e não bcrypt) porque:
 * - API keys são strings aleatórias longas (64+ chars), resistentes a brute force
 * - SHA-256 é determinístico, permitindo busca direta via WHERE hash = ?
 * - bcrypt é lento por design e não-determinístico, inviável para lookup por query
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}
