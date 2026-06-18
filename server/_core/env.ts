export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? process.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
  // Google Gemini Image / Nano Banana Pro para Mindi Vision
  googleImagenApiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? process.env.GOOGLE_GENAI_API_KEY ?? "",
  googleImagenModel: process.env.GOOGLE_GEMINI_IMAGE_MODEL ?? process.env.GEMINI_IMAGE_MODEL ?? process.env.GOOGLE_IMAGEN_MODEL ?? process.env.IMAGEN_MODEL ?? "gemini-3-pro-image-preview",
  googleImagenVisionModel: process.env.GOOGLE_IMAGEN_VISION_MODEL ?? "gemini-2.5-flash",
  mindiImageProvider: process.env.MINDI_IMAGE_PROVIDER ?? "google-gemini-image",
  // S3 próprio do usuário
  mindiS3Bucket: process.env.MINDI_S3_BUCKET ?? "",
  mindiS3Region: process.env.MINDI_S3_REGION ?? "",
  mindiS3AccessKey: process.env.MINDI_S3_ACCESS_KEY ?? "",
  mindiS3SecretKey: process.env.MINDI_S3_SECRET_KEY ?? "",
  // iFood Integration
  ifoodClientId: process.env.IFOOD_CLIENT_ID ?? "",
  ifoodClientSecret: process.env.IFOOD_CLIENT_SECRET ?? "",
  // Admin JWT secret (independente do cookieSecret)
  adminJwtSecret: process.env.ADMIN_JWT_SECRET ?? "",
  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  // Mandrill (Mailchimp Transactional) — DEPRECATED, migrado para Resend
  mandrillApiKey: process.env.MANDRILL_API_KEY ?? "",
  mandrillFromEmail: process.env.MANDRILL_FROM_EMAIL ?? "noreply@v2.mindi.com.br",
  mandrillFromName: process.env.MANDRILL_FROM_NAME ?? "Mindi",
  // Resend (Email transacional)
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "noreply@mindi.com.br",
  // Scheduled internal tasks
  scheduledTaskToken: process.env.SCHEDULED_TASK_TOKEN ?? "",
  // Paytime Payment Gateway
  paytimeBaseUrl: process.env.PAYTIME_BASE_URL ?? "https://api.sandbox.paytime.com.br",
  paytimeIntegrationKey: process.env.PAYTIME_INTEGRATION_KEY ?? "",
  paytimeAuthenticationKey: process.env.PAYTIME_AUTHENTICATION_KEY ?? "",
  paytimeXToken: process.env.PAYTIME_X_TOKEN ?? "",
  paytimeEstablishmentId: process.env.PAYTIME_ESTABLISHMENT_ID ?? "",
  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  // Telegram Bot
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  // Origens permitidas para o app de impressora (separadas por vírgula)
  // Ex: PRINTER_ALLOWED_ORIGINS=https://impressora.meusite.com,https://app.impressora.com
  printerAllowedOrigins: (process.env.PRINTER_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map(o => o.trim())
    .filter(Boolean),
  // WhatsApp Cloud API (Meta) — credenciais da plataforma
  // Cada estabelecimento guarda seu próprio token/WABA no banco (whatsappConfig.accessToken)
  metaAppId: process.env.META_APP_ID ?? "",
  metaAppSecret: process.env.META_APP_SECRET ?? "",
  metaConfigId: process.env.META_CONFIG_ID ?? "",       // Facebook Login for Business config
  metaGraphVersion: process.env.META_GRAPH_VERSION ?? "v19.0",
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "", // webhook hub.verify_token
};

/**
 * Validação de variáveis de ambiente críticas no startup.
 * Variáveis fatais (JWT_SECRET, DATABASE_URL) impedem o startup se ausentes.
 * Variáveis importantes emitem warnings mas permitem continuar.
 */
export function validateCriticalEnvVars(): void {
  // Variáveis FATAIS — servidor NÃO pode iniciar sem elas
  const fatal: Array<{ key: string; value: string; label: string }> = [
    { key: "JWT_SECRET", value: ENV.cookieSecret, label: "Secret para cookies/JWT" },
    { key: "DATABASE_URL", value: ENV.databaseUrl, label: "Conexão com banco de dados" },
  ];

  const missingFatal = fatal.filter(c => !c.value);

  if (missingFatal.length > 0) {
    console.error("╔══════════════════════════════════════════════════════════╗");
    console.error("║  🚨 FATAL: VARIÁVEIS OBRIGATÓRIAS NÃO CONFIGURADAS     ║");
    console.error("╠══════════════════════════════════════════════════════════╣");
    for (const m of missingFatal) {
      console.error(`║  ❌ ${m.key.padEnd(20)} — ${m.label.padEnd(33)}║`);
    }
    console.error("╠══════════════════════════════════════════════════════════╣");
    console.error("║  O servidor NÃO pode iniciar sem essas variáveis.      ║");
    console.error("║  Configure-as antes de fazer deploy.                   ║");
    console.error("╚══════════════════════════════════════════════════════════╝");
    throw new Error(
      `FATAL: Variáveis de ambiente obrigatórias ausentes: ${missingFatal.map(m => m.key).join(", ")}`
    );
  }

  // Variáveis importantes — emitem warning mas não impedem startup
  const important: Array<{ key: string; value: string; label: string }> = [
    { key: "VITE_APP_ID", value: ENV.appId, label: "ID da aplicação OAuth" },
    { key: "OAUTH_SERVER_URL", value: ENV.oAuthServerUrl, label: "URL do servidor OAuth" },
  ];

  const missingImportant = important.filter(c => !c.value);

  if (missingImportant.length > 0) {
    console.warn("╔══════════════════════════════════════════════════════════╗");
    console.warn("║  ⚠️  VARIÁVEIS DE AMBIENTE IMPORTANTES NÃO CONFIGURADAS║");
    console.warn("╠══════════════════════════════════════════════════════════╣");
    for (const m of missingImportant) {
      console.warn(`║  ⚠️  ${m.key.padEnd(20)} — ${m.label.padEnd(32)}║`);
    }
    console.warn("╠══════════════════════════════════════════════════════════╣");
    console.warn("║  Algumas funcionalidades podem não operar corretamente. ║");
    console.warn("╚══════════════════════════════════════════════════════════╝");
  }

  // Warnings opcionais (não críticas, mas recomendadas)
  const recommended: Array<{ key: string; value: string; label: string }> = [
    { key: "OWNER_OPEN_ID", value: ENV.ownerOpenId, label: "ID do proprietário" },
    { key: "BUILT_IN_FORGE_API_KEY", value: ENV.forgeApiKey, label: "API key do Forge (LLM)" },
    { key: "GOOGLE_MAPS_API_KEY", value: ENV.googleMapsApiKey, label: "API key própria do Google Maps" },
  ];

  const missingRecommended = recommended.filter(r => !r.value);
  if (missingRecommended.length > 0) {
    for (const m of missingRecommended) {
      console.warn(`[ENV] ⚠️  ${m.key} não configurado — ${m.label} pode não funcionar.`);
    }
  }
}
