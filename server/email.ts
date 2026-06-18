/**
 * Email Service — Resend
 * 
 * Migrado de Mandrill (Mailchimp Transactional) para Resend.
 * A interface exportada (sendEmail, buildPasswordResetEmail) permanece idêntica
 * para manter compatibilidade com os routers existentes.
 */
import { Resend } from "resend";
import { ENV } from "./_core/env";
import { logger } from "./_core/logger";

interface EmailRecipient {
  email: string;
  name?: string;
  type?: "to" | "cc" | "bcc";
}

interface SendEmailOptions {
  to: EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  tags?: string[];
}

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    if (!ENV.resendApiKey) {
      throw new Error("RESEND_API_KEY não configurada");
    }
    resendClient = new Resend(ENV.resendApiKey);
  }
  return resendClient;
}

export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, text, tags } = options;

  if (!ENV.resendApiKey) {
    logger.error("[Email] RESEND_API_KEY não configurada");
    throw new Error("RESEND_API_KEY não configurada");
  }

  const resend = getResendClient();
  const fromEmail = ENV.resendFromEmail || "noreply@mindi.com.br";

  // Separar destinatários por tipo
  const toRecipients = to.filter(r => !r.type || r.type === "to").map(r => r.email);
  const ccRecipients = to.filter(r => r.type === "cc").map(r => r.email);
  const bccRecipients = to.filter(r => r.type === "bcc").map(r => r.email);

  try {
    const { data, error } = await resend.emails.send({
      from: `Mindi <${fromEmail}>`,
      to: toRecipients,
      ...(ccRecipients.length > 0 && { cc: ccRecipients }),
      ...(bccRecipients.length > 0 && { bcc: bccRecipients }),
      subject,
      html,
      ...(text && { text }),
      ...(tags && tags.length > 0 && { tags: tags.map(t => ({ name: t, value: "true" })) }),
    });

    if (error) {
      logger.error("[Email] Resend API error:", error);
      throw new Error(`Resend error: ${error.message || "Unknown error"}`);
    }

    logger.info(
      `[Email] Email enviado via Resend: subject="${subject}", to=${toRecipients.join(",")}, id=${data?.id}`
    );

    // Retornar no formato compatível com o antigo Mandrill
    return toRecipients.map(email => ({
      email,
      status: "sent",
      _id: data?.id || "",
    }));
  } catch (err: any) {
    logger.error("[Email] Erro ao enviar email via Resend:", err);
    throw err;
  }
}

function escapeEmailHtml(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildPlanRenewalEmail(data: {
  recipientName?: string | null;
  establishmentName: string;
  planName: string;
  billingPeriod: string;
  amount: string;
  dueDate: string;
  paymentMethod: "PIX" | "Cartão de Crédito";
  status: "pix_generated" | "card_declined";
  pixEmv?: string | null;
}): string {
  const logoUrl = "https://app.mindi.com.br/assets/mindi-email-logo-red.png";
  const recipientName = escapeEmailHtml(data.recipientName || "");
  const establishmentName = escapeEmailHtml(data.establishmentName);
  const planName = escapeEmailHtml(data.planName);
  const billingPeriod = escapeEmailHtml(data.billingPeriod);
  const amount = escapeEmailHtml(data.amount);
  const dueDate = escapeEmailHtml(data.dueDate);
  const paymentMethod = escapeEmailHtml(data.paymentMethod);
  const pixEmv = escapeEmailHtml(data.pixEmv || "");
  const isPix = data.status === "pix_generated";

  const title = isPix ? "Renovação da sua assinatura" : "Não conseguimos renovar sua assinatura";
  const lead = isPix
    ? `Geramos a cobrança de renovação do plano <strong>${planName} (${billingPeriod})</strong> para o estabelecimento <strong>${establishmentName}</strong>.`
    : `Tentamos renovar automaticamente o plano <strong>${planName} (${billingPeriod})</strong> do estabelecimento <strong>${establishmentName}</strong>, mas a cobrança no cartão não foi aprovada.`;
  const action = isPix
    ? "Para manter o plano ativo, pague o PIX até a data indicada abaixo."
    : "Para manter o plano ativo, acesse o painel da Mindi e regularize a assinatura até a data indicada abaixo.";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Mindi</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 20px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding:20px 0 36px;">
              <img src="${logoUrl}" alt="Mindi" width="64" height="64" style="display:block;border-radius:16px;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 0 12px;">
              <h1 style="margin:0;color:#1a1a1a;font-size:26px;font-weight:700;">Olá${recipientName ? `, ${recipientName}` : ""}</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 0 22px;">
              <p style="margin:0;color:#666666;font-size:16px;line-height:1.5;">${lead}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f8f8;border-radius:12px;padding:18px;">
                <tr><td style="padding:6px 0;color:#333333;font-size:15px;"><strong>Plano:</strong> ${planName} (${billingPeriod})</td></tr>
                <tr><td style="padding:6px 0;color:#333333;font-size:15px;"><strong>Valor:</strong> R$ ${amount}</td></tr>
                <tr><td style="padding:6px 0;color:#333333;font-size:15px;"><strong>Vencimento / fim da carência:</strong> ${dueDate}</td></tr>
                <tr><td style="padding:6px 0;color:#333333;font-size:15px;"><strong>Forma de cobrança:</strong> ${paymentMethod}</td></tr>
              </table>
            </td>
          </tr>
          ${isPix && pixEmv ? `<tr><td style="padding:0 0 24px;"><p style="margin:0 0 10px;color:#333333;font-size:15px;font-weight:600;">Código PIX copia e cola:</p><div style="background-color:#f8f8f8;border:1px solid #eeeeee;border-radius:8px;padding:14px;color:#333333;font-family:Menlo,Consolas,monospace;font-size:12px;line-height:1.5;word-break:break-all;">${pixEmv}</div></td></tr>` : ""}
          <tr>
            <td align="center" style="padding:0 0 30px;">
              <p style="margin:0;color:#666666;font-size:15px;line-height:1.5;">${action} Após esse prazo, a assinatura poderá ser rebaixada para o plano trial automaticamente.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 24px;"><hr style="border:none;border-top:1px solid #eeeeee;margin:0;" /></td>
          </tr>
          <tr>
            <td align="center" style="padding:0 0 40px;">
              <p style="margin:0 0 4px;color:#bbbbbb;font-size:12px;">&copy; ${new Date().getFullYear()} Mindi - Todos os direitos reservados.</p>
              <p style="margin:0;color:#bbbbbb;font-size:12px;">Este é um e-mail automático.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// Password reset email template
export function buildPasswordResetEmail(
  userName: string,
  resetLink: string
): string {
  const logoUrl = "https://app.mindi.com.br/assets/mindi-email-logo-red.png";
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir Senha - Mindi</title>
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
              <h1 style="margin:0;color:#1a1a1a;font-size:26px;font-weight:700;">Olá${userName ? `, ${userName}` : ""}</h1>
            </td>
          </tr>
          <!-- Message -->
          <tr>
            <td align="center" style="padding:0 0 32px;">
              <p style="margin:0;color:#666666;font-size:16px;line-height:1.5;">
                Recebemos uma solicitação para redefinir a senha da sua conta.
              </p>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#ea1d2c;border-radius:8px;">
                    <a href="${resetLink}" target="_blank" style="display:inline-block;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 48px;border-radius:8px;">
                      Redefinir minha senha
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Validity -->
          <tr>
            <td align="center" style="padding:0 0 16px;">
              <p style="margin:0;color:#999999;font-size:14px;line-height:1.5;">
                Este link é válido por 1 hora.
              </p>
            </td>
          </tr>
          <!-- Fallback link -->
          <tr>
            <td align="center" style="padding:0 0 48px;">
              <p style="margin:0;color:#bbbbbb;font-size:12px;line-height:1.5;word-break:break-all;">
                Se o botão não funcionar, copie e cole este link:<br>
                <a href="${resetLink}" style="color:#ea1d2c;text-decoration:underline;font-size:12px;">${resetLink}</a>
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
                Se você não solicitou esta redefinição, ignore este email.
              </p>
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
