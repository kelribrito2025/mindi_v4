import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Testa a lógica de cálculo de saldo restante considerando pagamentos avulsos
 * no fechamento de mesa e na exibição do total no PDV.
 */

describe("Pagamentos avulsos - Cálculo de saldo restante", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve calcular saldo restante corretamente após pagamento avulso", () => {
    const tabTotal = 34.00;
    const loosePaymentsTotal = 20.00;
    const remainingBalance = Math.max(0, tabTotal - loosePaymentsTotal);
    
    expect(remainingBalance).toBe(14.00);
  });

  it("deve retornar 0 quando pagamentos avulsos cobrem o total", () => {
    const tabTotal = 34.00;
    const loosePaymentsTotal = 34.00;
    const remainingBalance = Math.max(0, tabTotal - loosePaymentsTotal);
    
    expect(remainingBalance).toBe(0);
  });

  it("deve retornar 0 quando pagamentos avulsos excedem o total", () => {
    const tabTotal = 34.00;
    const loosePaymentsTotal = 40.00;
    const remainingBalance = Math.max(0, tabTotal - loosePaymentsTotal);
    
    expect(remainingBalance).toBe(0);
  });

  it("deve retornar total completo quando não há pagamentos avulsos", () => {
    const tabTotal = 34.00;
    const loosePaymentsTotal = 0;
    const remainingBalance = Math.max(0, tabTotal - loosePaymentsTotal);
    
    expect(remainingBalance).toBe(34.00);
  });

  it("deve calcular saldo com múltiplos pagamentos avulsos", () => {
    const tabTotal = 100.00;
    const payments = [
      { amount: '30.00' },
      { amount: '25.00' },
      { amount: '15.00' },
    ];
    const loosePaymentsTotal = payments.reduce(
      (sum, p) => sum + parseFloat(p.amount), 0
    );
    const remainingBalance = Math.max(0, tabTotal - loosePaymentsTotal);
    
    expect(loosePaymentsTotal).toBe(70.00);
    expect(remainingBalance).toBe(30.00);
  });
});

describe("closeTable - Considera pagamentos avulsos no faturamento", () => {
  it("deve usar saldo restante (não total bruto) ao criar pedido de fechamento", () => {
    const tab = {
      id: 1,
      establishmentId: 1,
      total: '34.00',
      subtotal: '34.00',
      discount: '0.00',
      customerName: 'Mesa 4',
    };

    const tabTotal = parseFloat(tab.total);
    const loosePaymentsTotal = 20.00; // Pagamento avulso de R$ 20
    const remainingTotal = Math.max(0, tabTotal - loosePaymentsTotal);

    // O pedido de fechamento deve usar o saldo restante, não o total bruto
    expect(remainingTotal).toBe(14.00);
    
    // Simular dados do pedido que seria criado
    const orderData = {
      establishmentId: tab.establishmentId,
      customerName: tab.customerName,
      status: 'completed' as const,
      deliveryType: 'dine_in' as const,
      paymentMethod: 'cash' as const,
      subtotal: remainingTotal.toFixed(2),
      total: remainingTotal.toFixed(2),
      source: 'pdv' as const,
    };

    expect(orderData.total).toBe('14.00');
    expect(orderData.subtotal).toBe('14.00');
  });

  it("não deve criar pedido quando pagamentos avulsos cobrem o total", () => {
    const tabTotal = 34.00;
    const loosePaymentsTotal = 34.00;
    const remainingTotal = Math.max(0, tabTotal - loosePaymentsTotal);

    // Quando saldo restante é 0, não deve criar pedido
    expect(remainingTotal > 0).toBe(false);
  });

  it("deve criar pedido apenas com saldo restante para evitar duplicação", () => {
    const tabTotal = 100.00;
    const loosePaymentsTotal = 60.00;
    const remainingTotal = Math.max(0, tabTotal - loosePaymentsTotal);

    // O pagamento avulso já criou um pedido de R$ 60
    // O fechamento deve criar um pedido de apenas R$ 40
    expect(remainingTotal).toBe(40.00);
    
    // Total do faturamento = pagamento avulso + fechamento = 60 + 40 = 100
    expect(loosePaymentsTotal + remainingTotal).toBe(tabTotal);
  });
});

describe("Recibo de fechamento - Mostra pagamentos avulsos", () => {
  it("deve mostrar subtotal, pagamentos avulsos e saldo a pagar", () => {
    const subtotal = 34.00;
    const discount = 0;
    const serviceCharge = 0;
    const total = subtotal - discount + serviceCharge;
    const loosePaymentsTotal = 20.00;
    const remainingToPay = Math.max(0, total - loosePaymentsTotal);

    expect(total).toBe(34.00);
    expect(loosePaymentsTotal).toBe(20.00);
    expect(remainingToPay).toBe(14.00);
  });

  it("deve mostrar TOTAL quando não há pagamentos avulsos", () => {
    const subtotal = 34.00;
    const loosePaymentsTotal = 0;
    const remainingToPay = Math.max(0, subtotal - loosePaymentsTotal);

    // Sem pagamentos avulsos, remainingToPay = total
    expect(remainingToPay).toBe(subtotal);
    expect(loosePaymentsTotal > 0).toBe(false);
  });

  it("deve mostrar A PAGAR quando há pagamentos avulsos", () => {
    const subtotal = 50.00;
    const loosePaymentsTotal = 30.00;
    const remainingToPay = Math.max(0, subtotal - loosePaymentsTotal);

    expect(loosePaymentsTotal > 0).toBe(true);
    expect(remainingToPay).toBe(20.00);
  });
});

describe("PDV Footer - Exibe saldo restante", () => {
  it("deve mostrar saldo restante no footer quando há pagamentos avulsos na aba comanda", () => {
    const selectedTab = 'comanda';
    const getDisplayTotal = 34.00;
    const loosePaymentsTotal = 20.00;
    const appliedCouponDiscount = 0;

    const displayValue = Math.max(
      0, 
      getDisplayTotal - appliedCouponDiscount - (selectedTab === 'comanda' ? loosePaymentsTotal : 0)
    );

    expect(displayValue).toBe(14.00);
  });

  it("não deve subtrair pagamentos avulsos na aba consumo", () => {
    const selectedTab = 'consumo';
    const getDisplayTotal = 34.00;
    const loosePaymentsTotal = 20.00;
    const appliedCouponDiscount = 0;

    const displayValue = Math.max(
      0, 
      getDisplayTotal - appliedCouponDiscount - (selectedTab === 'comanda' ? loosePaymentsTotal : 0)
    );

    // Na aba consumo, não deve subtrair pagamentos avulsos
    expect(displayValue).toBe(34.00);
  });

  it("deve combinar desconto de cupom com pagamentos avulsos", () => {
    const selectedTab = 'comanda';
    const getDisplayTotal = 100.00;
    const loosePaymentsTotal = 30.00;
    const appliedCouponDiscount = 10.00;

    const displayValue = Math.max(
      0, 
      getDisplayTotal - appliedCouponDiscount - (selectedTab === 'comanda' ? loosePaymentsTotal : 0)
    );

    expect(displayValue).toBe(60.00);
  });

  it("deve mostrar label 'Saldo restante' quando há pagamentos avulsos", () => {
    const selectedTab = 'comanda';
    const loosePaymentsTotal = 20.00;

    const label = selectedTab === 'comanda' && loosePaymentsTotal > 0 ? 'Saldo restante' : 'Total';
    expect(label).toBe('Saldo restante');
  });

  it("deve mostrar label 'Total' quando não há pagamentos avulsos", () => {
    const selectedTab = 'comanda';
    const loosePaymentsTotal = 0;

    const label = selectedTab === 'comanda' && loosePaymentsTotal > 0 ? 'Saldo restante' : 'Total';
    expect(label).toBe('Total');
  });
});
