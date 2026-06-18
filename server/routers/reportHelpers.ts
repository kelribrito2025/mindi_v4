import { getDb, getEstablishmentTimezone, getLocalDate, fmtLocalDate, fmtLocalDateTime } from "../db";
import { orders, orderItems, products, categories, expenses, expenseCategories } from "../../drizzle/schema";
import { eq, and, gte, lte, sql, ne, inArray } from "drizzle-orm";

// ============ PERIOD HELPERS ============

function getPeriodRange(period: string, localNow: Date, startDate?: string, endDate?: string) {
  let start: Date;
  let end: Date;

  switch (period) {
    case "today": {
      start = new Date(localNow);
      start.setHours(0, 0, 0, 0);
      end = new Date(localNow);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "week": {
      start = new Date(localNow);
      const dayOfWeek = start.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start.setDate(start.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      end = new Date(localNow);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "last_month": {
      start = new Date(localNow.getFullYear(), localNow.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(localNow.getFullYear(), localNow.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "custom": {
      if (startDate && endDate) {
        start = new Date(startDate + "T00:00:00");
        end = new Date(endDate + "T23:59:59");
      } else {
        start = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(localNow);
        end.setHours(23, 59, 59, 999);
      }
      break;
    }
    case "month":
    default: {
      start = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(localNow);
      end.setHours(23, 59, 59, 999);
      break;
    }
  }

  return { start, end };
}

function getPreviousPeriodRange(start: Date, end: Date) {
  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - duration);
  return { start: prevStart, end: prevEnd };
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ============ MAIN FUNCTION ============

export async function getReportKPIs(
  establishmentId: number,
  period: string,
  startDate?: string,
  endDate?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);
  const { start, end } = getPeriodRange(period, localNow, startDate, endDate);
  const prev = getPreviousPeriodRange(start, end);

  const startStr = fmtLocalDateTime(start);
  const endStr = fmtLocalDateTime(end);
  const prevStartStr = fmtLocalDateTime(prev.start);
  const prevEndStr = fmtLocalDateTime(prev.end);

  // Execute both period queries in parallel (2 queries instead of 4)
  const [currentResult, prevResult] = await Promise.all([
    // Current period: stats + unique customers in a single query
    db
      .select({
        totalOrders: sql<number>`COUNT(${orders.id})`,
        totalRevenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
        totalProducts: sql<number>`COALESCE(SUM(${orders.subtotal}), 0)`,
        totalDeliveryFee: sql<number>`COALESCE(SUM(${orders.deliveryFee}), 0)`,
        avgTicket: sql<number>`COALESCE(AVG(${orders.total}), 0)`,
        uniqueCustomers: sql<number>`COUNT(DISTINCT CASE WHEN ${orders.customerPhone} IS NOT NULL AND ${orders.customerPhone} != '' THEN ${orders.customerPhone} END)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.establishmentId, establishmentId),
          ne(orders.status, "cancelled"),
          sql`${orders.createdAt} >= ${startStr}`,
          sql`${orders.createdAt} <= ${endStr}`
        )
      ),

    // Previous period: stats + unique customers in a single query
    db
      .select({
        totalOrders: sql<number>`COUNT(${orders.id})`,
        totalRevenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
        avgTicket: sql<number>`COALESCE(AVG(${orders.total}), 0)`,
        uniqueCustomers: sql<number>`COUNT(DISTINCT CASE WHEN ${orders.customerPhone} IS NOT NULL AND ${orders.customerPhone} != '' THEN ${orders.customerPhone} END)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.establishmentId, establishmentId),
          ne(orders.status, "cancelled"),
          sql`${orders.createdAt} >= ${prevStartStr}`,
          sql`${orders.createdAt} <= ${prevEndStr}`
        )
      ),
  ]);

  const currentStats = currentResult[0];
  const prevStats = prevResult[0];

  const revenue = Number(currentStats.totalRevenue ?? 0);
  const ordersCount = Number(currentStats.totalOrders ?? 0);
  const avgTicket = Number(currentStats.avgTicket ?? 0);
  const customers = Number(currentStats.uniqueCustomers ?? 0);

  const prevRevenue = Number(prevStats.totalRevenue ?? 0);
  const prevOrdersCount = Number(prevStats.totalOrders ?? 0);
  const prevAvgTicket = Number(prevStats.avgTicket ?? 0);
  const prevCustomersCount = Number(prevStats.uniqueCustomers ?? 0);

  return {
    revenue,
    revenueChange: calcChange(revenue, prevRevenue),
    ordersCount,
    ordersChange: calcChange(ordersCount, prevOrdersCount),
    avgTicket,
    avgTicketChange: calcChange(avgTicket, prevAvgTicket),
    customers,
    customersChange: calcChange(customers, prevCustomersCount),
    totalProducts: Number(currentStats.totalProducts ?? 0),
    totalDeliveryFee: Number(currentStats.totalDeliveryFee ?? 0),
    period: {
      start: start.toISOString(),
      end: end.toISOString(),
      label: period,
    },
  };
}


// ============ CURVA ABC DE PRODUTOS ============

export async function getProductsABC(
  establishmentId: number,
  period: string,
  startDate?: string,
  endDate?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);
  const { start, end } = getPeriodRange(period, localNow, startDate, endDate);

  const startStr = fmtLocalDateTime(start);
  const endStr = fmtLocalDateTime(end);

  // Query: agrupar itens de pedidos concluídos por produto
  const result = await db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      categoryName: sql<string>`COALESCE(${categories.name}, 'Sem categoria')`,
      totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
      totalRevenue: sql<number>`SUM(${orderItems.totalPrice})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .leftJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(orders.establishmentId, establishmentId),
        ne(orders.status, "cancelled"),
        sql`${orders.createdAt} >= ${startStr}`,
        sql`${orders.createdAt} <= ${endStr}`
      )
    )
    .groupBy(orderItems.productId, orderItems.productName, categories.name)
    .orderBy(sql`SUM(${orderItems.totalPrice}) DESC`);

  // Calcular totais
  const totalRevenue = result.reduce((sum, r) => sum + Number(r.totalRevenue), 0);
  const totalQuantity = result.reduce((sum, r) => sum + Number(r.totalQuantity), 0);

  // Classificar ABC com percentual acumulado
  let accumulated = 0;
  const items = result.map((r) => {
    const revenue = Number(r.totalRevenue);
    const quantity = Number(r.totalQuantity);
    const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
    accumulated += percentage;

    let classification: "A" | "B" | "C";
    if (accumulated <= 80) {
      classification = "A";
    } else if (accumulated <= 95) {
      classification = "B";
    } else {
      classification = "C";
    }

    return {
      productId: r.productId,
      productName: r.productName,
      categoryName: r.categoryName,
      quantity,
      revenue,
      percentage: Math.round(percentage * 10) / 10,
      accumulatedPercentage: Math.round(accumulated * 10) / 10,
      classification,
    };
  });

  // Resumo por classe
  const classA = items.filter((i) => i.classification === "A");
  const classB = items.filter((i) => i.classification === "B");
  const classC = items.filter((i) => i.classification === "C");

  return {
    items,
    summary: {
      totalProducts: items.length,
      totalRevenue,
      totalQuantity,
      classA: {
        count: classA.length,
        revenue: classA.reduce((s, i) => s + i.revenue, 0),
        percentage: totalRevenue > 0 ? Math.round((classA.reduce((s, i) => s + i.revenue, 0) / totalRevenue) * 100 * 10) / 10 : 0,
      },
      classB: {
        count: classB.length,
        revenue: classB.reduce((s, i) => s + i.revenue, 0),
        percentage: totalRevenue > 0 ? Math.round((classB.reduce((s, i) => s + i.revenue, 0) / totalRevenue) * 100 * 10) / 10 : 0,
      },
      classC: {
        count: classC.length,
        revenue: classC.reduce((s, i) => s + i.revenue, 0),
        percentage: totalRevenue > 0 ? Math.round((classC.reduce((s, i) => s + i.revenue, 0) / totalRevenue) * 100 * 10) / 10 : 0,
      },
    },
    period: {
      start: start.toISOString(),
      end: end.toISOString(),
      label: period,
    },
  };
}


// ============ PERFORMANCE SEMANAL ============

export async function getWeeklyPerformance(
  establishmentId: number,
  period: string,
  startDate?: string,
  endDate?: string
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);
  const { start, end } = getPeriodRange(period, localNow, startDate, endDate);

  // Calcular as últimas 4 semanas completas dentro do período selecionado
  // Partimos do final do período e voltamos 4 semanas
  const endDate_ = new Date(end);
  const weeks: { weekStart: Date; weekEnd: Date; label: string }[] = [];

  // Encontrar o domingo (fim de semana) mais recente a partir do end
  const currentDay = endDate_.getDay(); // 0=Dom, 1=Seg...
  // Voltar para o sábado mais recente (fim da semana, considerando Seg-Dom)
  const lastSunday = new Date(endDate_);
  lastSunday.setDate(lastSunday.getDate() - currentDay);
  lastSunday.setHours(23, 59, 59, 999);

  // Semana atual (parcial): de segunda até hoje
  const currentWeekStart = new Date(lastSunday);
  currentWeekStart.setDate(currentWeekStart.getDate() + 1); // segunda
  currentWeekStart.setHours(0, 0, 0, 0);

  // Se estamos no meio da semana, incluir a semana parcial
  if (endDate_.getTime() >= currentWeekStart.getTime()) {
    weeks.unshift({
      weekStart: currentWeekStart,
      weekEnd: endDate_,
      label: "Atual",
    });
  }

  // Agora adicionar semanas completas anteriores até ter 4 no total
  let refSunday = new Date(lastSunday);
  let weekCount = 1;
  while (weeks.length < 4) {
    const wEnd = new Date(refSunday);
    wEnd.setHours(23, 59, 59, 999);
    const wStart = new Date(refSunday);
    wStart.setDate(wStart.getDate() - 6); // segunda anterior
    wStart.setHours(0, 0, 0, 0);

    // Não incluir semanas antes do início do período
    if (wEnd.getTime() < start.getTime()) break;

    weeks.unshift({
      weekStart: wStart < start ? start : wStart,
      weekEnd: wEnd,
      label: `Sem ${weekCount}`,
    });
    weekCount++;

    // Voltar mais uma semana
    refSunday.setDate(refSunday.getDate() - 7);
  }

  // Renumerar labels sequencialmente
  weeks.forEach((w, i) => {
    if (i < weeks.length - 1 || w.label !== "Atual") {
      w.label = `Sem ${i + 1}`;
    }
  });

  // Buscar faturamento e pedidos para cada semana em paralelo
  const weekQueries = weeks.map((w) => {
    const wStartStr = fmtLocalDateTime(w.weekStart);
    const wEndStr = fmtLocalDateTime(w.weekEnd);

    return db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
        totalOrders: sql<number>`COUNT(${orders.id})`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.establishmentId, establishmentId),
          ne(orders.status, "cancelled"),
          sql`${orders.createdAt} >= ${wStartStr}`,
          sql`${orders.createdAt} <= ${wEndStr}`
        )
      );
  });

  // Buscar meta semanal do estabelecimento
  const goalQuery = db.execute(
    sql`SELECT targetRevenue FROM weeklyGoals WHERE establishmentId = ${establishmentId} AND isActive = 1 ORDER BY updatedAt DESC LIMIT 1`
  );

  const [weekResults, goalResult] = await Promise.all([
    Promise.all(weekQueries),
    goalQuery,
  ]);

  // Montar dados das semanas
  const weeklyData = weeks.map((w, i) => ({
    name: w.label,
    faturamento: Number(weekResults[i][0]?.totalRevenue ?? 0),
    pedidos: Number(weekResults[i][0]?.totalOrders ?? 0),
    startDate: fmtLocalDate(w.weekStart),
    endDate: fmtLocalDate(w.weekEnd),
  }));

  // Meta semanal
  const goalRows = goalResult as any;
  const targetRevenue = goalRows?.[0]?.targetRevenue
    ? Number(goalRows[0].targetRevenue)
    : null;

  // Cálculos derivados
  const totalFaturamento = weeklyData.reduce((s, w) => s + w.faturamento, 0);
  const totalPedidos = weeklyData.reduce((s, w) => s + w.pedidos, 0);
  const ticketMedio = totalPedidos > 0 ? totalFaturamento / totalPedidos : 0;
  const melhorSemana = weeklyData.reduce(
    (best, w) => (w.faturamento > best.faturamento ? w : best),
    weeklyData[0] || { name: "-", faturamento: 0 }
  );

  // Crescimento entre última e penúltima semana
  let crescimento = 0;
  if (weeklyData.length >= 2) {
    const last = weeklyData[weeklyData.length - 1].faturamento;
    const prev = weeklyData[weeklyData.length - 2].faturamento;
    crescimento = prev > 0 ? Math.round(((last - prev) / prev) * 100) : last > 0 ? 100 : 0;
  }

  return {
    weeks: weeklyData,
    targetRevenue,
    totalFaturamento,
    totalPedidos,
    ticketMedio: Math.round(ticketMedio * 100) / 100,
    melhorSemana: {
      name: melhorSemana.name,
      faturamento: melhorSemana.faturamento,
    },
    crescimento,
    period: {
      start: start.toISOString(),
      end: end.toISOString(),
      label: period,
    },
  };
}


// ============ MAPA DE SAZONALIDADE ============

export async function getSeasonalityMap(
  establishmentId: number,
  period: string,
  startDate?: string,
  endDate?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);
  const { start, end } = getPeriodRange(period, localNow, startDate, endDate);

  const startStr = fmtLocalDateTime(start);
  const endStr = fmtLocalDateTime(end);

  // Query: contar pedidos agrupados por dia da semana e hora
  // DAYOFWEEK retorna 1=Dom, 2=Seg, ..., 7=Sáb
  // HOUR retorna 0-23
  const rawResult = await db.execute(
    sql`SELECT DAYOFWEEK(${orders.createdAt}) as dayOfWeek, HOUR(${orders.createdAt}) as hourOfDay, COUNT(${orders.id}) as orderCount FROM ${orders} WHERE ${orders.establishmentId} = ${establishmentId} AND ${orders.status} != 'cancelled' AND ${orders.createdAt} >= ${startStr} AND ${orders.createdAt} <= ${endStr} GROUP BY dayOfWeek, hourOfDay`
  );
  // db.execute() returns [rows, fields] — extract rows
  const rows = Array.isArray(rawResult) && Array.isArray(rawResult[0]) ? rawResult[0] : rawResult;
  const result = (rows as any[]).map((r: any) => ({
    dayOfWeek: Number(r.dayOfWeek),
    hourOfDay: Number(r.hourOfDay),
    orderCount: Number(r.orderCount),
  }));

  // Montar matriz 17 horas (8h-0h) x 7 dias (Dom-Sáb)
  // Índices: rows = horas (8,9,...,23,0), cols = dias (0=Dom,...,6=Sáb)
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];
  const heatmap: number[][] = hours.map(() => [0, 0, 0, 0, 0, 0, 0]);

  for (const row of result) {
    const dayIdx = row.dayOfWeek - 1; // 0=Dom, 1=Seg, ..., 6=Sáb
    const hour = row.hourOfDay;
    const hourIdx = hours.indexOf(hour);
    if (hourIdx !== -1 && dayIdx >= 0 && dayIdx <= 6) {
      heatmap[hourIdx][dayIdx] = row.orderCount;
    }
  }

  const maxValue = Math.max(...heatmap.flat(), 1);

  // Calcular número de semanas no período para média
  const periodMs = end.getTime() - start.getTime();
  const weeksInPeriod = Math.max(1, Math.round(periodMs / (7 * 24 * 60 * 60 * 1000)));

  return {
    days: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
    hours: hours.map(h => `${h}h`),
    heatmap,
    maxValue,
    weeksInPeriod,
    period: {
      start: start.toISOString(),
      end: end.toISOString(),
      label: period,
    },
  };
}


// ============ DRE (Demonstrativo de Resultado do Exercício) ============

export async function getDRE(establishmentId: number, period: string, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const tz = await getEstablishmentTimezone(establishmentId);
  const localNow = getLocalDate(tz);
  const { start, end } = getPeriodRange(period, localNow, startDate, endDate);
  const startStr = fmtLocalDateTime(start);
  const endStr = fmtLocalDateTime(end);

  // 1. RECEITA BRUTA — total de pedidos completed/delivered
  const revenueResult = await db.execute(
    sql`SELECT 
      COALESCE(SUM(CASE WHEN ${orders.status} != 'cancelled' THEN ${orders.total} ELSE 0 END), 0) as grossRevenue,
      COALESCE(SUM(CASE WHEN ${orders.status} = 'cancelled' THEN ${orders.total} ELSE 0 END), 0) as cancellations,
      COUNT(CASE WHEN ${orders.status} != 'cancelled' THEN 1 END) as orderCount
    FROM ${orders}
    WHERE ${orders.establishmentId} = ${establishmentId}
      AND ${orders.createdAt} >= ${startStr}
      AND ${orders.createdAt} <= ${endStr}`
  );
  const revRows = Array.isArray(revenueResult) && Array.isArray(revenueResult[0]) ? revenueResult[0] : revenueResult;
  const rev = (revRows as any[])[0] || { grossRevenue: 0, cancellations: 0, orderCount: 0 };
  const grossRevenue = Number(rev.grossRevenue) || 0;
  const cancellations = Number(rev.cancellations) || 0;
  const orderCount = Number(rev.orderCount) || 0;

  // 2. CMV — Custo de Mercadoria Vendida (orderItems.quantity × products.cost)
  const cmvResult = await db.execute(
    sql`SELECT COALESCE(SUM(${orderItems.quantity} * ${products.cost}), 0) as totalCMV
    FROM ${orderItems}
    INNER JOIN ${orders} ON ${orders.id} = ${orderItems.orderId}
    INNER JOIN ${products} ON ${products.id} = ${orderItems.productId}
    WHERE ${orders.establishmentId} = ${establishmentId}
      AND ${orders.status} != 'cancelled'
      AND ${orders.createdAt} >= ${startStr}
      AND ${orders.createdAt} <= ${endStr}
      AND ${products.cost} IS NOT NULL
      AND ${products.cost} > 0`
  );
  const cmvRows = Array.isArray(cmvResult) && Array.isArray(cmvResult[0]) ? cmvResult[0] : cmvResult;
  const totalCMV = Number((cmvRows as any[])[0]?.totalCMV) || 0;

  // 3. DESPESAS OPERACIONAIS — agrupadas por categoria
  const expResult = await db.execute(
    sql`SELECT 
      ${expenseCategories.name} as categoryName,
      ${expenseCategories.color} as categoryColor,
      COALESCE(SUM(${expenses.amount}), 0) as totalAmount
    FROM ${expenses}
    INNER JOIN ${expenseCategories} ON ${expenseCategories.id} = ${expenses.categoryId}
    WHERE ${expenses.establishmentId} = ${establishmentId}
      AND ${expenses.date} >= ${startStr}
      AND ${expenses.date} <= ${endStr}
    GROUP BY ${expenses.categoryId}, ${expenseCategories.name}, ${expenseCategories.color}
    ORDER BY totalAmount DESC`
  );
  const expRows = Array.isArray(expResult) && Array.isArray(expResult[0]) ? expResult[0] : expResult;
  const expensesByCategory = (expRows as any[]).map((r: any) => ({
    category: String(r.categoryName),
    color: String(r.categoryColor || "#6b7280"),
    amount: Number(r.totalAmount) || 0,
  }));
  const totalExpenses = expensesByCategory.reduce((sum, e) => sum + e.amount, 0);

  // 4. CÁLCULOS DO DRE
  const netRevenue = grossRevenue - cancellations; // Receita Líquida (após cancelamentos)
  const grossProfit = netRevenue - totalCMV; // Lucro Bruto
  const operatingResult = grossProfit - totalExpenses; // Resultado Operacional

  // 5. MARGENS
  const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;
  const operatingMargin = netRevenue > 0 ? (operatingResult / netRevenue) * 100 : 0;
  const cmvPercentage = netRevenue > 0 ? (totalCMV / netRevenue) * 100 : 0;

  return {
    // Receita
    grossRevenue,
    cancellations,
    netRevenue,
    orderCount,
    // CMV
    totalCMV,
    cmvPercentage: Math.round(cmvPercentage * 10) / 10,
    // Lucro Bruto
    grossProfit,
    grossMargin: Math.round(grossMargin * 10) / 10,
    // Despesas
    totalExpenses,
    expensesByCategory,
    // Resultado Operacional
    operatingResult,
    operatingMargin: Math.round(operatingMargin * 10) / 10,
    // Período
    period: {
      start: start.toISOString(),
      end: end.toISOString(),
      label: period,
    },
  };
}
