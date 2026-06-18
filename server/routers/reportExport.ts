import { Router, Request, Response } from "express";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { sdk } from "../_core/sdk";
import { getUserByOpenId, getEstablishmentByUserId } from "../db";
import { getDRE, getProductsABC } from "./reportHelpers";
import * as planSubDb from "../planSubscriptionDb";
import * as adminDb from "../adminDb";

// ============ AUTH HELPER ============
async function authenticateExportRequest(req: Request, res: Response) {
  const token =
    req.cookies?.app_session_id ||
    req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  let payload;
  try {
    payload = await sdk.verifySession(token);
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
  if (!payload?.openId) {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
  const user = await getUserByOpenId(payload.openId);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return null;
  }
  const establishment = await getEstablishmentByUserId(user.id);
  if (!establishment) {
    res.status(404).json({ error: "Establishment not found" });
    return null;
  }
  return { user, establishment };
}

function parsePeriodParams(req: Request) {
  const period = (req.query.period as string) || "month";
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  return { period, startDate, endDate };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

// ============ DRE PDF ============
async function exportDREPdf(req: Request, res: Response) {
  try {
    const auth = await authenticateExportRequest(req, res);
    if (!auth) return;
    const { establishment } = auth;
    const { period, startDate, endDate } = parsePeriodParams(req);

    const dre = await getDRE(establishment.id, period, startDate, endDate);

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="DRE_${establishment.name?.replace(/\s+/g, "_") || "restaurante"}_${formatDate(dre.period.start).replace(/\//g, "-")}.pdf"`
    );
    doc.pipe(res);

    // Header
    doc.fontSize(20).font("Helvetica-Bold").text("DRE — Demonstrativo de Resultado", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(11).font("Helvetica").fillColor("#666666").text(
      `${establishment.name || "Restaurante"} — Período: ${formatDate(dre.period.start)} a ${formatDate(dre.period.end)}`,
      { align: "center" }
    );
    doc.moveDown(1.5);

    // Table helper
    const leftCol = 60;
    const rightCol = 430;
    const rowHeight = 28;
    let y = doc.y;

    const drawRow = (label: string, value: string, opts?: { bold?: boolean; bg?: string; valueColor?: string; indent?: boolean }) => {
      if (opts?.bg) {
        doc.save();
        doc.rect(leftCol - 10, y - 4, rightCol - leftCol + 80, rowHeight).fill(opts.bg);
        doc.restore();
      }
      const fontSize = opts?.indent ? 9 : 11;
      const fontName = opts?.bold ? "Helvetica-Bold" : "Helvetica";
      const x = opts?.indent ? leftCol + 20 : leftCol;
      doc.fontSize(fontSize).font(fontName).fillColor("#1a1a1a").text(label, x, y + 4);
      doc.fontSize(fontSize).font(fontName).fillColor(opts?.valueColor || "#1a1a1a").text(value, rightCol, y + 4, { align: "right", width: 90 });
      y += rowHeight;
    };

    // DRE rows
    drawRow("(+) Receita Bruta", formatCurrency(dre.grossRevenue), { bold: true, bg: "#ecfdf5" });

    if (dre.cancellations > 0) {
      drawRow("(-) Cancelamentos", formatCurrency(dre.cancellations), { valueColor: "#dc2626" });
    }

    drawRow("(=) Receita Líquida", formatCurrency(dre.netRevenue), { bold: true, bg: "#eff6ff" });

    drawRow(`(-) CMV (${dre.cmvPercentage.toFixed(1)}%)`, formatCurrency(dre.totalCMV), { valueColor: "#dc2626" });

    drawRow(`(=) Lucro Bruto (${dre.grossMargin.toFixed(1)}%)`, formatCurrency(dre.grossProfit), { bold: true, bg: "#ecfdf5", valueColor: "#15803d" });

    // Despesas operacionais header
    drawRow("(-) Despesas Operacionais", formatCurrency(dre.totalExpenses), { bold: true, valueColor: "#dc2626" });

    // Despesas por categoria
    for (const exp of dre.expensesByCategory) {
      const pct = dre.netRevenue > 0 ? ((exp.amount / dre.netRevenue) * 100).toFixed(1) : "0.0";
      drawRow(`${exp.category} (${pct}%)`, formatCurrency(exp.amount), { indent: true, valueColor: "#dc2626" });
    }

    if (dre.expensesByCategory.length === 0) {
      drawRow("Nenhuma despesa registrada", "R$ 0,00", { indent: true, valueColor: "#999999" });
    }

    // Resultado operacional
    const resColor = dre.operatingResult >= 0 ? "#15803d" : "#dc2626";
    const resBg = dre.operatingResult >= 0 ? "#dcfce7" : "#fef2f2";
    drawRow(
      `(=) Resultado Operacional (${dre.operatingMargin.toFixed(1)}%)`,
      formatCurrency(dre.operatingResult),
      { bold: true, bg: resBg, valueColor: resColor }
    );

    // Indicadores
    y += 20;
    doc.fontSize(14).font("Helvetica-Bold").fillColor("#1a1a1a").text("Indicadores de Margem", leftCol, y);
    y += 30;

    const indicators = [
      { label: "Margem Bruta", value: dre.grossMargin, meta: 65, unit: "%" },
      { label: "Margem Líquida", value: dre.operatingMargin, meta: 15, unit: "%" },
      { label: "CMV / Receita", value: dre.cmvPercentage, meta: 35, unit: "%" },
    ];

    for (const ind of indicators) {
      doc.fontSize(10).font("Helvetica").fillColor("#666666").text(ind.label, leftCol, y);
      doc.fontSize(12).font("Helvetica-Bold").fillColor("#1a1a1a").text(
        `${ind.value.toFixed(1)}${ind.unit}`,
        leftCol + 150,
        y
      );
      doc.fontSize(9).font("Helvetica").fillColor("#999999").text(`Meta: ${ind.meta}${ind.unit}`, leftCol + 250, y + 1);
      y += 22;
    }

    // Footer
    doc.fontSize(8).font("Helvetica").fillColor("#999999").text(
      `Gerado em ${new Date().toLocaleString("pt-BR")} — Mindi`,
      leftCol,
      doc.page.height - 50,
      { align: "center", width: doc.page.width - 100 }
    );

    doc.end();
  } catch (error) {
    console.error("[Export DRE PDF] Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Erro ao gerar PDF do DRE" });
    }
  }
}

// ============ DRE EXCEL ============
async function exportDREExcel(req: Request, res: Response) {
  try {
    const auth = await authenticateExportRequest(req, res);
    if (!auth) return;
    const { establishment } = auth;
    const { period, startDate, endDate } = parsePeriodParams(req);

    const dre = await getDRE(establishment.id, period, startDate, endDate);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Mindi";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("DRE");

    // Column widths
    sheet.columns = [
      { width: 40 },
      { width: 20 },
      { width: 15 },
    ];

    // Title
    const titleRow = sheet.addRow(["DRE — Demonstrativo de Resultado"]);
    titleRow.font = { bold: true, size: 16 };
    sheet.mergeCells("A1:C1");
    titleRow.alignment = { horizontal: "center" };

    const subtitleRow = sheet.addRow([
      `${establishment.name || "Restaurante"} — Período: ${formatDate(dre.period.start)} a ${formatDate(dre.period.end)}`,
    ]);
    subtitleRow.font = { size: 10, color: { argb: "FF666666" } };
    sheet.mergeCells("A2:C2");
    subtitleRow.alignment = { horizontal: "center" };

    sheet.addRow([]);

    // Header row
    const headerRow = sheet.addRow(["Descrição", "Valor (R$)", "% Receita"]);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
    headerRow.border = {
      bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
    };

    // Data rows
    const addDreRow = (label: string, value: number, pct?: number, opts?: { bold?: boolean; green?: boolean; red?: boolean }) => {
      const row = sheet.addRow([label, value, pct != null ? pct : ""]);
      if (opts?.bold) row.font = { bold: true };
      const valCell = row.getCell(2);
      valCell.numFmt = '#,##0.00';
      if (opts?.green) valCell.font = { bold: true, color: { argb: "FF15803D" } };
      if (opts?.red) valCell.font = { bold: true, color: { argb: "FFDC2626" } };
      if (pct != null) {
        const pctCell = row.getCell(3);
        pctCell.numFmt = '0.0"%"';
      }
      return row;
    };

    addDreRow("(+) Receita Bruta", dre.grossRevenue, 100, { bold: true, green: true });
    if (dre.cancellations > 0) {
      addDreRow("(-) Cancelamentos", dre.cancellations, undefined, { red: true });
    }
    addDreRow("(=) Receita Líquida", dre.netRevenue, undefined, { bold: true });
    addDreRow(`(-) CMV`, dre.totalCMV, dre.cmvPercentage, { red: true });
    addDreRow(`(=) Lucro Bruto`, dre.grossProfit, dre.grossMargin, { bold: true, green: true });
    addDreRow("(-) Despesas Operacionais", dre.totalExpenses, undefined, { bold: true, red: true });

    for (const exp of dre.expensesByCategory) {
      const pct = dre.netRevenue > 0 ? Math.round((exp.amount / dre.netRevenue) * 1000) / 10 : 0;
      addDreRow(`    ${exp.category}`, exp.amount, pct, { red: true });
    }

    const resultRow = addDreRow("(=) Resultado Operacional", dre.operatingResult, dre.operatingMargin, {
      bold: true,
      green: dre.operatingResult >= 0,
      red: dre.operatingResult < 0,
    });
    resultRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: dre.operatingResult >= 0 ? "FFDCFCE7" : "FFFEF2F2" },
    };

    // Indicators sheet
    const indSheet = workbook.addWorksheet("Indicadores");
    indSheet.columns = [{ width: 25 }, { width: 15 }, { width: 15 }];
    const indHeader = indSheet.addRow(["Indicador", "Valor (%)", "Meta (%)"]);
    indHeader.font = { bold: true };
    indHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };

    indSheet.addRow(["Margem Bruta", dre.grossMargin, 65]);
    indSheet.addRow(["Margem Líquida", dre.operatingMargin, 15]);
    indSheet.addRow(["CMV / Receita", dre.cmvPercentage, 35]);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="DRE_${establishment.name?.replace(/\s+/g, "_") || "restaurante"}_${formatDate(dre.period.start).replace(/\//g, "-")}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("[Export DRE Excel] Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Erro ao gerar Excel do DRE" });
    }
  }
}

// ============ ABC PDF ============
async function exportABCPdf(req: Request, res: Response) {
  try {
    const auth = await authenticateExportRequest(req, res);
    if (!auth) return;
    const { establishment } = auth;
    const { period, startDate, endDate } = parsePeriodParams(req);

    const abc = await getProductsABC(establishment.id, period, startDate, endDate);

    // Calculate total items to decide layout
    const itemCount = abc.items.length;
    // Use landscape for many items, portrait for few
    const useLandscape = itemCount > 30;
    const doc = new PDFDocument({ 
      size: "A4", 
      margin: 35, 
      layout: useLandscape ? "landscape" : "portrait",
      autoFirstPage: true,
      bufferPages: true,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Curva_ABC_${establishment.name?.replace(/\s+/g, "_") || "restaurante"}_${formatDate(abc.period.start).replace(/\//g, "-")}.pdf"`
    );
    doc.pipe(res);

    const pageW = doc.page.width;
    const marginH = 35;
    const contentW = pageW - marginH * 2;

    // Header
    doc.fontSize(16).font("Helvetica-Bold").text("Curva ABC de Produtos", { align: "center" });
    doc.moveDown(0.2);
    doc.fontSize(9).font("Helvetica").fillColor("#666666").text(
      `${establishment.name || "Restaurante"} — Período: ${formatDate(abc.period.start)} a ${formatDate(abc.period.end)}`,
      { align: "center" }
    );
    doc.moveDown(0.8);

    // Summary boxes
    const summaryY = doc.y;
    const boxWidth = Math.min(160, (contentW - 20) / 3);
    const boxGap = (contentW - boxWidth * 3) / 2;
    const startX = marginH;

    const classes = [
      { label: "Classe A — Essenciais", data: abc.summary.classA, color: "#22c55e" },
      { label: "Classe B — Intermediários", data: abc.summary.classB, color: "#f59e0b" },
      { label: "Classe C — Baixo impacto", data: abc.summary.classC, color: "#ef4444" },
    ];

    for (let i = 0; i < classes.length; i++) {
      const x = startX + i * (boxWidth + boxGap);
      doc.save();
      doc.roundedRect(x, summaryY, boxWidth, 45, 5).fill("#f9fafb");
      doc.restore();
      doc.fontSize(7).font("Helvetica-Bold").fillColor(classes[i].color).text(classes[i].label, x + 8, summaryY + 6);
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#1a1a1a").text(`${classes[i].data.percentage}%`, x + 8, summaryY + 18);
      doc.fontSize(7).font("Helvetica").fillColor("#666666").text(
        `${classes[i].data.count} produto${classes[i].data.count !== 1 ? "s" : ""} — ${formatCurrency(classes[i].data.revenue)}`,
        x + 8,
        summaryY + 34
      );
    }

    doc.y = summaryY + 55;

    // Table header
    const tableLeft = marginH;
    const colWidths = useLandscape
      ? [25, 200, 45, 50, 85, 60, 60]
      : [25, 160, 40, 45, 75, 55, 55];
    const colLabels = ["#", "Produto", "Classe", "Qtd", "Receita", "% Receita", "% Acum."];
    const colPositions: number[] = [];
    let cx = tableLeft;
    for (const w of colWidths) {
      colPositions.push(cx);
      cx += w;
    }
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);

    let y = doc.y;
    const rowH = 18;

    // Draw table header
    doc.save();
    doc.rect(tableLeft, y - 3, tableWidth, 20).fill("#f3f4f6");
    doc.restore();
    for (let c = 0; c < colLabels.length; c++) {
      doc.fontSize(7).font("Helvetica-Bold").fillColor("#374151").text(colLabels[c], colPositions[c] + 2, y + 2, { width: colWidths[c] - 4 });
    }
    y += 22;

    // Table rows
    const classColors: Record<string, string> = { A: "#22c55e", B: "#f59e0b", C: "#ef4444" };

    for (let i = 0; i < abc.items.length; i++) {
      const item = abc.items[i];

      // Page break if needed
      if (y > doc.page.height - 50) {
        doc.addPage();
        y = 40;
        doc.save();
        doc.rect(tableLeft, y - 3, tableWidth, 20).fill("#f3f4f6");
        doc.restore();
        for (let c = 0; c < colLabels.length; c++) {
          doc.fontSize(7).font("Helvetica-Bold").fillColor("#374151").text(colLabels[c], colPositions[c] + 2, y + 2, { width: colWidths[c] - 4 });
        }
        y += 22;
      }

      // Zebra stripe
      if (i % 2 === 0) {
        doc.save();
        doc.rect(tableLeft, y - 2, tableWidth, rowH).fill("#fafafa");
        doc.restore();
      }

      const maxNameLen = useLandscape ? 35 : 25;
      doc.fontSize(7).font("Helvetica").fillColor("#6b7280").text(`${i + 1}`, colPositions[0] + 2, y + 1, { width: colWidths[0] - 4 });
      doc.fontSize(7).font("Helvetica").fillColor("#1a1a1a").text(
        item.productName.length > maxNameLen ? item.productName.substring(0, maxNameLen - 2) + "…" : item.productName,
        colPositions[1] + 2, y + 1, { width: colWidths[1] - 4 }
      );
      doc.fontSize(8).font("Helvetica-Bold").fillColor(classColors[item.classification]).text(item.classification, colPositions[2] + 8, y + 1, { width: colWidths[2] - 4 });
      doc.fontSize(7).font("Helvetica").fillColor("#1a1a1a").text(`${item.quantity}`, colPositions[3] + 2, y + 1, { width: colWidths[3] - 4, align: "right" });
      doc.fontSize(7).font("Helvetica").fillColor("#1a1a1a").text(formatCurrency(item.revenue), colPositions[4] + 2, y + 1, { width: colWidths[4] - 4, align: "right" });
      doc.fontSize(7).font("Helvetica").fillColor("#6b7280").text(`${item.percentage.toFixed(1)}%`, colPositions[5] + 2, y + 1, { width: colWidths[5] - 4, align: "right" });

      const accumColor = item.accumulatedPercentage <= 80 ? "#15803d" : item.accumulatedPercentage <= 95 ? "#d97706" : "#6b7280";
      doc.fontSize(7).font("Helvetica-Bold").fillColor(accumColor).text(`${item.accumulatedPercentage.toFixed(1)}%`, colPositions[6] + 2, y + 1, { width: colWidths[6] - 4, align: "right" });

      y += rowH;
    }

    // Footer - only on last page, positioned just below content or at bottom
    const footerY = Math.min(y + 15, doc.page.height - 35);
    doc.fontSize(7).font("Helvetica").fillColor("#999999").text(
      `Gerado em ${new Date().toLocaleString("pt-BR")} — Mindi`,
      marginH,
      footerY,
      { align: "center", width: contentW }
    );

    doc.end();
  } catch (error) {
    console.error("[Export ABC PDF] Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Erro ao gerar PDF da Curva ABC" });
    }
  }
}

// ============ ABC EXCEL ============
async function exportABCExcel(req: Request, res: Response) {
  try {
    const auth = await authenticateExportRequest(req, res);
    if (!auth) return;
    const { establishment } = auth;
    const { period, startDate, endDate } = parsePeriodParams(req);

    const abc = await getProductsABC(establishment.id, period, startDate, endDate);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Mindi";
    workbook.created = new Date();

    // Summary sheet
    const summarySheet = workbook.addWorksheet("Resumo ABC");
    summarySheet.columns = [{ width: 25 }, { width: 15 }, { width: 20 }, { width: 15 }];

    const titleRow = summarySheet.addRow(["Curva ABC de Produtos"]);
    titleRow.font = { bold: true, size: 16 };
    summarySheet.mergeCells("A1:D1");
    titleRow.alignment = { horizontal: "center" };

    const subRow = summarySheet.addRow([
      `${establishment.name || "Restaurante"} — Período: ${formatDate(abc.period.start)} a ${formatDate(abc.period.end)}`,
    ]);
    subRow.font = { size: 10, color: { argb: "FF666666" } };
    summarySheet.mergeCells("A2:D2");
    subRow.alignment = { horizontal: "center" };

    summarySheet.addRow([]);

    const sHeader = summarySheet.addRow(["Classe", "Produtos", "Receita (R$)", "% Receita"]);
    sHeader.font = { bold: true };
    sHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };

    const classLabels: Record<string, string> = { classA: "A — Essenciais", classB: "B — Intermediários", classC: "C — Baixo impacto" };
    const classColors: Record<string, string> = { classA: "FF22C55E", classB: "FFF59E0B", classC: "FFEF4444" };

    for (const key of ["classA", "classB", "classC"] as const) {
      const d = abc.summary[key];
      const row = summarySheet.addRow([classLabels[key], d.count, d.revenue, d.percentage]);
      row.getCell(1).font = { bold: true, color: { argb: classColors[key] } };
      row.getCell(3).numFmt = '#,##0.00';
      row.getCell(4).numFmt = '0.0"%"';
    }

    summarySheet.addRow([]);
    const totalRow = summarySheet.addRow(["Total", abc.summary.totalProducts, abc.summary.totalRevenue, 100]);
    totalRow.font = { bold: true };
    totalRow.getCell(3).numFmt = '#,##0.00';

    // Detail sheet
    const detailSheet = workbook.addWorksheet("Produtos Detalhado");
    detailSheet.columns = [
      { width: 6 },
      { width: 35 },
      { width: 20 },
      { width: 10 },
      { width: 10 },
      { width: 18 },
      { width: 12 },
      { width: 12 },
    ];

    const dTitle = detailSheet.addRow(["Curva ABC — Detalhe por Produto"]);
    dTitle.font = { bold: true, size: 14 };
    detailSheet.mergeCells("A1:H1");
    dTitle.alignment = { horizontal: "center" };

    detailSheet.addRow([]);

    const dHeader = detailSheet.addRow(["#", "Produto", "Categoria", "Classe", "Qtd", "Receita (R$)", "% Receita", "% Acum."]);
    dHeader.font = { bold: true, size: 10 };
    dHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };

    for (let i = 0; i < abc.items.length; i++) {
      const item = abc.items[i];
      const row = detailSheet.addRow([
        i + 1,
        item.productName,
        item.categoryName,
        item.classification,
        item.quantity,
        item.revenue,
        item.percentage,
        item.accumulatedPercentage,
      ]);
      row.getCell(6).numFmt = '#,##0.00';
      row.getCell(7).numFmt = '0.0"%"';
      row.getCell(8).numFmt = '0.0"%"';

      // Color the class cell
      const classColor = item.classification === "A" ? "FF22C55E" : item.classification === "B" ? "FFF59E0B" : "FFEF4444";
      row.getCell(4).font = { bold: true, color: { argb: classColor } };
    }

    // Auto-filter
    detailSheet.autoFilter = { from: "A3", to: "H3" };

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Curva_ABC_${establishment.name?.replace(/\s+/g, "_") || "restaurante"}_${formatDate(abc.period.start).replace(/\//g, "-")}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("[Export ABC Excel] Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Erro ao gerar Excel da Curva ABC" });
    }
  }
}

// ============ PLAN RECEIPT PDF ============
async function exportPlanReceiptPdf(req: Request, res: Response) {
  try {
    const auth = await authenticateExportRequest(req, res);
    if (!auth) return;
    const { user, establishment } = auth;

    const subscriptionId = Number(req.params.subscriptionId);
    if (!Number.isFinite(subscriptionId) || subscriptionId <= 0) {
      res.status(400).json({ error: "Assinatura inválida" });
      return;
    }

    const subscription = await planSubDb.getSubscriptionById(subscriptionId);
    if (!subscription || subscription.establishmentId !== establishment.id) {
      res.status(404).json({ error: "Pagamento não encontrado" });
      return;
    }

    if (subscription.status !== "active" || subscription.amountCents <= 0) {
      res.status(422).json({ error: "Recibo disponível apenas para pagamentos aprovados" });
      return;
    }

    const planPrice = await adminDb.getPlanPrice(subscription.planId);
    const fallbackNames: Record<string, string> = {
      lite: "Plano Starter",
      basic: "Plano Essencial",
      pro: "Plano Pro",
    };
    const planName = planPrice?.displayName || fallbackNames[subscription.planId] || subscription.planId;
    const amount = subscription.amountCents / 100;
    const paidAt = subscription.lastPaymentAt || subscription.currentPeriodStart || subscription.updatedAt || subscription.createdAt;
    const validUntil = subscription.currentPeriodEnd || subscription.nextRenewalAt || subscription.gracePeriodEnd || subscription.updatedAt;
    const receiptNumber = `FAT-${String(subscription.id).padStart(6, "0")}`;
    const gatewayLabel = subscription.gateway === "paytime_pix"
      ? "PIX"
      : subscription.gateway === "paytime_card"
        ? "Cartão de crédito"
        : subscription.gateway === "stripe_card"
          ? "Cartão de crédito (Stripe)"
          : subscription.gateway;
    const transactionId = subscription.paytimeTransactionId || subscription.renewalPixTransactionId || subscription.stripeSubscriptionId || `plan-sub-${subscription.id}`;
    const payerName = establishment.name || (user as any).name || user.email || "Cliente Mindi";
    const payerContact = user.email || establishment.whatsapp || "Não informado";
    const recipientName = "MINDI SERVIÇOS DIGITAIS LTDA";
    const recipientDocument = "CNPJ: 55.516.684/0001-08";

    const doc = new PDFDocument({ size: "A4", margin: 42 });
    const safeFileName = receiptNumber.replace(/[^a-zA-Z0-9_-]/g, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Recibo_Mindi_${safeFileName}.pdf"`);
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const margin = 42;
    const contentWidth = pageWidth - margin * 2;
    const red = "#ef4444";
    const green = "#10b981";
    const text = "#111827";
    const muted = "#6b7280";
    const border = "#e5e7eb";
    const soft = "#f9fafb";

    const dateValue = (value: Date | string | null | undefined) => {
      if (!value) return "—";
      return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    };
    const dateTimeValue = (value: Date | string | null | undefined) => {
      if (!value) return "—";
      return new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    };
    const card = (x: number, y: number, w: number, h: number) => {
      doc.save().roundedRect(x, y, w, h, 14).fillAndStroke("#ffffff", border).restore();
    };
    const field = (label: string, value: string, x: number, y: number, width: number, opts?: { align?: "left" | "right"; valueColor?: string; bold?: boolean }) => {
      doc.font("Helvetica").fontSize(8).fillColor("#9ca3af").text(label.toUpperCase(), x, y, { width });
      doc.font(opts?.bold ? "Helvetica-Bold" : "Helvetica").fontSize(11).fillColor(opts?.valueColor || text).text(value, x, y + 15, { width, align: opts?.align || "left" });
    };

    // faixa superior e marca
    doc.save().rect(0, 0, pageWidth, 12).fill(red).restore();
    doc.save().roundedRect(margin, 34, 42, 42, 12).fill(red).restore();
    doc.font("Helvetica-Bold").fontSize(20).fillColor("#ffffff").text("M", margin, 45, { width: 42, align: "center" });
    doc.font("Helvetica-Bold").fontSize(18).fillColor(text).text("Mindi", margin + 54, 38);
    doc.font("Helvetica").fontSize(9).fillColor(muted).text("Recibo de assinatura digital", margin + 54, 60);

    doc.font("Helvetica-Bold").fontSize(24).fillColor(text).text(`Recibo ${receiptNumber}`, margin, 98, { align: "center", width: contentWidth });
    doc.roundedRect(pageWidth / 2 - 44, 132, 88, 22, 11).fill("#dcfce7");
    doc.circle(pageWidth / 2 - 28, 143, 3.5).fill(green);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#047857").text("Aprovado", pageWidth / 2 - 18, 136, { width: 60, align: "left" });
    doc.font("Helvetica").fontSize(11).fillColor(muted).text(payerName, margin, 166, { align: "center", width: contentWidth });

    // Cards principais
    const topY = 210;
    const gap = 18;
    const colW = (contentWidth - gap) / 2;
    card(margin, topY, colW, 210);
    card(margin + colW + gap, topY, colW, 210);

    doc.font("Helvetica-Bold").fontSize(15).fillColor(text).text("Detalhes do Pedido", margin + 18, topY + 24);
    field("Plano selecionado", planName, margin + 18, topY + 62, colW - 36, { align: "right", bold: true });
    field("Renovação", subscription.billingPeriod === "annual" ? "Anual" : "Mensal", margin + 18, topY + 100, colW - 36, { align: "right", bold: true });
    field("Créditos expiram em", dateValue(validUntil), margin + 18, topY + 138, colW - 36, { align: "right", bold: true });
    doc.moveTo(margin + 18, topY + 174).lineTo(margin + colW - 18, topY + 174).strokeColor(border).stroke();
    field("Empresa creditada", establishment.name || "Estabelecimento", margin + 18, topY + 185, colW - 36, { align: "right", bold: true });

    doc.font("Helvetica").fontSize(8).fillColor("#9ca3af").text("PAGADOR", margin + colW + gap + 18, topY + 44);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(text).text(payerName, margin + colW + gap + 18, topY + 62, { width: colW - 36 });
    doc.moveTo(margin + colW + gap + 18, topY + 96).lineTo(margin + contentWidth - 18, topY + 96).strokeColor(border).stroke();
    field("Detalhes do preço", "", margin + colW + gap + 18, topY + 118, colW - 36);
    doc.font("Helvetica").fontSize(11).fillColor(text).text("Valor do Plano", margin + colW + gap + 18, topY + 145, { width: colW - 70 });
    doc.font("Helvetica-Bold").fontSize(11).fillColor(text).text(formatCurrency(amount), margin + colW + gap + 18, topY + 145, { width: colW - 36, align: "right" });
    doc.moveTo(margin + colW + gap + 18, topY + 174).lineTo(margin + contentWidth - 18, topY + 174).strokeColor(border).stroke();
    doc.font("Helvetica-Bold").fontSize(13).fillColor(text).text("Total", margin + colW + gap + 18, topY + 190, { width: colW - 70 });
    doc.font("Helvetica-Bold").fontSize(14).fillColor(green).text(formatCurrency(amount), margin + colW + gap + 18, topY + 190, { width: colW - 36, align: "right" });

    // Card inferior com pagador/destinatário/método
    const bottomY = 448;
    card(margin, bottomY, contentWidth, 188);
    const halfW = contentWidth / 2;
    field("Pagador", payerName, margin + 20, bottomY + 28, halfW - 40, { bold: true });
    doc.font("Helvetica").fontSize(9).fillColor(muted).text(`Contato: ${payerContact}`, margin + 20, bottomY + 60, { width: halfW - 40 });
    field("Destinatário", recipientName, margin + 20, bottomY + 92, halfW - 40, { bold: true });
    doc.font("Helvetica").fontSize(9).fillColor(muted).text(recipientDocument, margin + 20, bottomY + 124, { width: halfW - 40 });

    field("Método de pagamento", gatewayLabel, margin + halfW + 20, bottomY + 28, halfW - 40, { bold: true });
    field("Identificador", transactionId, margin + halfW + 20, bottomY + 78, halfW - 40);
    field("Data do pagamento", dateTimeValue(paidAt), margin + halfW + 20, bottomY + 128, halfW - 40);

    doc.roundedRect(margin, 662, contentWidth, 36, 10).fill(soft);
    doc.font("Helvetica").fontSize(8).fillColor(muted).text(
      "Este recibo comprova o pagamento da assinatura Mindi indicada acima. Documento gerado automaticamente pelo painel administrativo.",
      margin + 18,
      674,
      { width: contentWidth - 36, align: "center" }
    );

    doc.font("Helvetica").fontSize(8).fillColor("#9ca3af").text(
      `Gerado em ${new Date().toLocaleString("pt-BR")} — Mindi`,
      margin,
      doc.page.height - 42,
      { align: "center", width: contentWidth }
    );

    doc.end();
  } catch (error) {
    console.error("[Export Plan Receipt PDF] Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Erro ao gerar recibo do pagamento" });
    }
  }
}

// ============ ROUTER ============
export function createReportExportRouter(): Router {
  const r = Router();
  r.get("/dre/pdf", exportDREPdf);
  r.get("/dre/excel", exportDREExcel);
  r.get("/abc/pdf", exportABCPdf);
  r.get("/abc/excel", exportABCExcel);
  r.get("/plans/receipt/:subscriptionId.pdf", exportPlanReceiptPdf);
  return r;
}
