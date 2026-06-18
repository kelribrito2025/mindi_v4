/**
 * Módulo de Audit Logging
 *
 * Registra eventos de segurança relevantes como JSON estruturado no stdout.
 * Pode ser capturado por qualquer sistema de log (CloudWatch, Datadog, Loki, etc.).
 *
 * NUNCA inclua dados sensíveis (senhas, tokens, endereços) nos metadados.
 */

export type AuditEventType =
  | "auth.login.success"
  | "auth.login.failure"
  | "auth.logout"
  | "auth.register"
  | "auth.register.failure"
  | "establishment.toggle_open"
  | "establishment.set_manual_close"
  | "establishment.update"
  | "product.create"
  | "product.update"
  | "product.delete"
  | "api_key.create"
  | "api_key.delete"
  | "api_key.toggle"
  | "collaborator.create"
  | "collaborator.delete"
  | "collaborator.login.success"
  | "collaborator.login.failure"
  | "auth.password_reset.requested"
  | "auth.password_reset.completed"
  | "auth.google.login"
  | "auth.google.register"
  | "auth.google.link"
  | "auth.google.unlink";

export interface AuditEventPayload {
  type: AuditEventType;
  userId?: number;
  establishmentId?: number;
  /** IP da requisição — nunca adicione dados de PII aqui */
  ip?: string;
  /** Metadados contextuais sem PII (ex: { action: "open", productId: 42 }) */
  metadata?: Record<string, string | number | boolean | null>;
}

/**
 * Registra um evento de auditoria. Escreve JSON estruturado para stdout.
 * @example
 * auditLog({ type: "auth.login.success", userId: 1, ip: req.ip });
 */
export function auditLog(event: AuditEventPayload): void {
  const entry = {
    level: "audit",
    timestamp: new Date().toISOString(),
    ...event,
  };
  // JSON em uma linha para facilitar parsing por ferramentas de log
  process.stdout.write(JSON.stringify(entry) + "\n");
}
