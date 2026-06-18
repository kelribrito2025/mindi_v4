import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import * as db from "../db";
import { sendEmail } from "../email";

// Rate limiting simples em memória (por email)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase().trim();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60 * 1000 }); // 1 minuto
    return true;
  }

  if (entry.count >= 3) {
    return false; // Máximo 3 envios por minuto
  }

  entry.count++;
  return true;
}

function buildVerificationEmail(code: string): string {
  const logoUrl = "https://app.mindi.com.br/assets/mindi-email-logo-red.png";
  // Separar dígitos do código para exibir com espaçamento estilo iFood
  const codeDigits = code.split("").map(d => 
    `<span style="font-size:36px;font-weight:800;color:#1a1a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;padding:0 6px;">${d}</span>`
  ).join("");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verificação de Email - Mindi</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 20px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding:20px 0 40px;">
              <img src="${logoUrl}" alt="Mindi" width="64" height="64" style="display:block;border-radius:16px;" />
            </td>
          </tr>
          <!-- Greeting -->
          <tr>
            <td align="center" style="padding:0 0 12px;">
              <h1 style="margin:0;color:#1a1a1a;font-size:26px;font-weight:700;">Olá</h1>
            </td>
          </tr>
          <!-- Message -->
          <tr>
            <td align="center" style="padding:0 0 32px;">
              <p style="margin:0;color:#666666;font-size:16px;line-height:1.5;">
                Este é o código para verificar seu email:
              </p>
            </td>
          </tr>
          <!-- Code Box -->
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#fde8e8;border-radius:12px;">
                <tr>
                  <td style="padding:20px 32px;">
                    ${codeDigits}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Validity -->
          <tr>
            <td align="center" style="padding:0 0 48px;">
              <p style="margin:0;color:#999999;font-size:14px;line-height:1.5;">
                Este código é válido por 10 minutos, contados a partir do recebimento deste e-mail.
              </p>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 0 24px;">
              <hr style="border:none;border-top:1px solid #eeeeee;margin:0;" />
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:0 0 40px;">
              <p style="margin:0 0 4px;color:#bbbbbb;font-size:12px;">
                &copy; ${new Date().getFullYear()} Mindi - Todos os direitos reservados.
              </p>
              <p style="margin:0;color:#bbbbbb;font-size:12px;">
                Este é um e-mail automático.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export const emailVerificationRouter = router({
  // Enviar código de verificação para o email
  sendCode: publicProcedure
    .input(z.object({
      email: z.string().email("Email inválido"),
    }))
    .mutation(async ({ input }) => {
      const email = input.email.toLowerCase().trim();

      // Rate limiting
      if (!checkRateLimit(email)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Muitas tentativas. Aguarde 1 minuto antes de solicitar um novo código.",
        });
      }

      // Verificar se email já está cadastrado
      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este email já está cadastrado. Faça login.",
        });
      }

      // Gerar código
      const code = await db.createEmailVerificationCode(email);

      // Enviar email via Mandrill
      try {
        await sendEmail({
          to: [{ email }],
          subject: `${code} é seu código de verificação - Mindi`,
          html: buildVerificationEmail(code),
          tags: ["email-verification", "onboarding"],
        });
        logger.info(`[EmailVerification] Code sent to ${email}`);
      } catch (error) {
        logger.error("[EmailVerification] Failed to send email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao enviar email. Tente novamente.",
        });
      }

      return { success: true };
    }),

  // Verificar código
  verifyCode: publicProcedure
    .input(z.object({
      email: z.string().email("Email inválido"),
      code: z.string().length(5, "Código deve ter 5 dígitos"),
    }))
    .mutation(async ({ input }) => {
      const result = await db.verifyEmailCode(input.email, input.code);

      if (!result.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.reason || "Código inválido.",
        });
      }

      return { success: true, verified: true };
    }),
});
