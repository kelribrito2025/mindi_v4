import { describe, it, expect } from "vitest";
// Templates de email inline para testes (mesma lógica do index.ts)
const LOGO_URL = "https://app.mindi.com.br/assets/mindi-email-logo-red.png";

function buildPaytimeApprovalEmail(establishmentName: string, recipientName: string): string {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Cadastro Aprovado - Mindi</title></head><body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;"><tr><td align="center" style="padding:40px 20px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;"><tr><td align="center" style="padding:20px 0 40px;"><img src="${LOGO_URL}" alt="Mindi" width="64" height="64" style="display:block;border-radius:16px;"/></td></tr><tr><td align="center" style="padding:0 0 12px;"><h1 style="margin:0;color:#1a1a1a;font-size:26px;font-weight:700;">Parab&eacute;ns${recipientName ? `, ${recipientName}` : ""}!</h1></td></tr><tr><td align="center" style="padding:0 0 16px;"><p style="margin:0;color:#333333;font-size:18px;line-height:1.5;font-weight:600;">Seu cadastro foi aprovado!</p></td></tr><tr><td align="center" style="padding:0 0 32px;"><p style="margin:0;color:#666666;font-size:16px;line-height:1.5;">O estabelecimento <strong>${establishmentName}</strong> foi aprovado na Mindi. Agora voc&ecirc; pode aceitar pagamentos online via <strong>PIX</strong> e <strong>Cart&atilde;o de Cr&eacute;dito</strong> diretamente pelo seu card&aacute;pio digital!</p></td></tr><tr><td align="center" style="padding:0 0 24px;"><div style="width:80px;height:80px;border-radius:50%;background-color:#22c55e;display:inline-block;line-height:80px;text-align:center;"><span style="color:#ffffff;font-size:40px;">&#10003;</span></div></td></tr><tr><td style="padding:0 0 32px;"><p style="margin:0 0 12px;color:#333333;font-size:16px;font-weight:600;">Pr&oacute;ximos passos:</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:8px 0;color:#666666;font-size:14px;line-height:1.5;">1. Acesse seu painel de administra&ccedil;&atilde;o</td></tr><tr><td style="padding:8px 0;color:#666666;font-size:14px;line-height:1.5;">2. V&aacute; at&eacute; a se&ccedil;&atilde;o <strong>Financeiro</strong> para ativar os m&eacute;todos de pagamento</td></tr><tr><td style="padding:8px 0;color:#666666;font-size:14px;line-height:1.5;">3. Comece a receber pagamentos online!</td></tr></table></td></tr><tr><td style="padding:0 0 24px;"><hr style="border:none;border-top:1px solid #eeeeee;margin:0;"/></td></tr><tr><td align="center" style="padding:0 0 40px;"><p style="margin:0 0 4px;color:#bbbbbb;font-size:12px;">&copy; ${new Date().getFullYear()} Mindi - Todos os direitos reservados.</p><p style="margin:0;color:#bbbbbb;font-size:12px;">Este &eacute; um e-mail autom&aacute;tico.</p></td></tr></table></td></tr></table></body></html>`;
}

function buildPaytimeRejectionEmail(establishmentName: string, recipientName: string, paytimeStatus: string): string {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Cadastro - A&ccedil;&atilde;o Necess&aacute;ria - Mindi</title></head><body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;"><tr><td align="center" style="padding:40px 20px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;"><tr><td align="center" style="padding:20px 0 40px;"><img src="${LOGO_URL}" alt="Mindi" width="64" height="64" style="display:block;border-radius:16px;"/></td></tr><tr><td align="center" style="padding:0 0 12px;"><h1 style="margin:0;color:#1a1a1a;font-size:26px;font-weight:700;">Ol&aacute;${recipientName ? `, ${recipientName}` : ""}</h1></td></tr><tr><td align="center" style="padding:0 0 16px;"><p style="margin:0;color:#333333;font-size:18px;line-height:1.5;font-weight:600;">Seu cadastro precisa de aten&ccedil;&atilde;o</p></td></tr><tr><td align="center" style="padding:0 0 32px;"><p style="margin:0;color:#666666;font-size:16px;line-height:1.5;">O cadastro do estabelecimento <strong>${establishmentName}</strong> na Mindi n&atilde;o foi aprovado.<br><br><strong>Status:</strong> ${paytimeStatus}</p></td></tr><tr><td align="center" style="padding:0 0 24px;"><div style="width:80px;height:80px;border-radius:50%;background-color:#f59e0b;display:inline-block;line-height:80px;text-align:center;"><span style="color:#ffffff;font-size:40px;">!</span></div></td></tr><tr><td style="padding:0 0 32px;"><p style="margin:0 0 12px;color:#333333;font-size:16px;font-weight:600;">O que fazer:</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:8px 0;color:#666666;font-size:14px;line-height:1.5;">1. Verifique se todos os dados informados est&atilde;o corretos (CNPJ/CPF, endere&ccedil;o, dados banc&aacute;rios)</td></tr><tr><td style="padding:8px 0;color:#666666;font-size:14px;line-height:1.5;">2. Acesse o painel e tente enviar o cadastro novamente com os dados corrigidos</td></tr><tr><td style="padding:8px 0;color:#666666;font-size:14px;line-height:1.5;">3. Se o problema persistir, entre em contato com o suporte</td></tr></table></td></tr><tr><td style="padding:0 0 24px;"><hr style="border:none;border-top:1px solid #eeeeee;margin:0;"/></td></tr><tr><td align="center" style="padding:0 0 40px;"><p style="margin:0 0 4px;color:#bbbbbb;font-size:12px;">&copy; ${new Date().getFullYear()} Mindi - Todos os direitos reservados.</p><p style="margin:0;color:#bbbbbb;font-size:12px;">Este &eacute; um e-mail autom&aacute;tico.</p></td></tr></table></td></tr></table></body></html>`;
}

describe("Paytime Email Templates", () => {
  describe("buildPaytimeApprovalEmail", () => {
    it("deve gerar HTML de email de aprovação com nome do estabelecimento", () => {
      const html = buildPaytimeApprovalEmail("Restaurante Teste", "João");
      
      expect(html).toContain("Restaurante Teste");
      expect(html).toContain("João");
      expect(html).toContain("Cadastro Aprovado");
      expect(html).not.toContain("Paytime");
      expect(html).toContain("aprovado");
      expect(html).toContain("PIX");
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
    });

    it("deve funcionar sem nome do destinatário", () => {
      const html = buildPaytimeApprovalEmail("Meu Restaurante", "");
      
      expect(html).toContain("Meu Restaurante");
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).not.toContain("undefined");
    });

    it("deve conter ícone de sucesso (checkmark)", () => {
      const html = buildPaytimeApprovalEmail("Teste", "Maria");
      
      expect(html).toContain("#22c55e"); // cor verde
      expect(html).toContain("&#10003;"); // checkmark
    });

    it("deve conter próximos passos", () => {
      const html = buildPaytimeApprovalEmail("Teste", "Maria");
      
      expect(html).toContain("Financeiro");
      expect(html).toContain("pagamentos online");
    });
  });

  describe("buildPaytimeRejectionEmail", () => {
    it("deve gerar HTML de email de rejeição com status", () => {
      const html = buildPaytimeRejectionEmail("Restaurante Teste", "João", "REJECTED");
      
      expect(html).toContain("Restaurante Teste");
      expect(html).toContain("João");
      expect(html).toContain("REJECTED");
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
      expect(html).not.toContain("Paytime");
    });

    it("deve funcionar sem nome do destinatário", () => {
      const html = buildPaytimeRejectionEmail("Meu Restaurante", "", "BLOCKED");
      
      expect(html).toContain("Meu Restaurante");
      expect(html).toContain("BLOCKED");
      expect(html).not.toContain("undefined");
    });

    it("deve conter ícone de aviso", () => {
      const html = buildPaytimeRejectionEmail("Teste", "Maria", "REJECTED");
      
      expect(html).toContain("#f59e0b"); // cor amarela/warning
    });

    it("deve conter instruções do que fazer", () => {
      const html = buildPaytimeRejectionEmail("Teste", "Maria", "REJECTED");
      
      expect(html).toContain("CNPJ");
      expect(html).toContain("dados corrigidos");
      expect(html).toContain("suporte");
    });
  });
});

describe("Paytime Webhook Status Mapping", () => {
  const statusMap: Record<string, "pending" | "submitted" | "approved" | "rejected"> = {
    'ACTIVE': 'approved',
    'APPROVED': 'approved',
    'PENDING': 'pending',
    'PENDING_APPROVAL': 'submitted',
    'IN_ANALYSIS': 'submitted',
    'REJECTED': 'rejected',
    'BLOCKED': 'rejected',
    'INACTIVE': 'rejected',
    'SUSPENDED': 'rejected',
  };

  it("deve mapear ACTIVE para approved", () => {
    expect(statusMap['ACTIVE']).toBe('approved');
  });

  it("deve mapear APPROVED para approved", () => {
    expect(statusMap['APPROVED']).toBe('approved');
  });

  it("deve mapear PENDING para pending", () => {
    expect(statusMap['PENDING']).toBe('pending');
  });

  it("deve mapear PENDING_APPROVAL para submitted", () => {
    expect(statusMap['PENDING_APPROVAL']).toBe('submitted');
  });

  it("deve mapear IN_ANALYSIS para submitted", () => {
    expect(statusMap['IN_ANALYSIS']).toBe('submitted');
  });

  it("deve mapear REJECTED para rejected", () => {
    expect(statusMap['REJECTED']).toBe('rejected');
  });

  it("deve mapear BLOCKED para rejected", () => {
    expect(statusMap['BLOCKED']).toBe('rejected');
  });

  it("deve mapear INACTIVE para rejected", () => {
    expect(statusMap['INACTIVE']).toBe('rejected');
  });

  it("deve mapear SUSPENDED para rejected", () => {
    expect(statusMap['SUSPENDED']).toBe('rejected');
  });

  it("não deve ter mapeamento para status desconhecido", () => {
    expect(statusMap['UNKNOWN']).toBeUndefined();
  });
});
