import { describe, expect, it } from "vitest";

/**
 * Testes para:
 * 1. Badge de contagem de pedidos agendados pendentes na sidebar
 * 2. Diferenciação de notificação para pedidos agendados vs normais
 */

// ============ HELPERS DE CONTAGEM DE PENDENTES ============

interface ScheduledOrder {
  id: number;
  status: string;
  isScheduled: boolean;
  movedToQueue: boolean;
  scheduledAt: Date | null;
}

/**
 * Conta pedidos agendados pendentes (não movidos para fila)
 * Replica a lógica de getScheduledPendingCount em db.ts
 */
function getScheduledPendingCount(orders: ScheduledOrder[]): number {
  return orders.filter(o =>
    o.isScheduled === true &&
    o.status === 'scheduled' &&
    o.movedToQueue === false
  ).length;
}

// ============ HELPERS DE NOTIFICAÇÃO ============

interface OrderNotificationData {
  id: number;
  isScheduled?: boolean;
  scheduledAt?: string | null;
  source?: string;
}

/**
 * Determina o tipo de notificação baseado no pedido
 * Replica a lógica do AdminLayout handleNewOrderNotification
 */
function getNotificationInfo(order: OrderNotificationData): {
  title: string;
  buttonLabel: string;
  redirectPath: string;
  duration: number;
} {
  const isScheduled = order.isScheduled === true;

  if (isScheduled) {
    return {
      title: "Novo pedido agendado!",
      buttonLabel: "Ver pedido agendado",
      redirectPath: "/agendados",
      duration: 8000,
    };
  }

  return {
    title: "Novo pedido recebido!",
    buttonLabel: "Ver pedidos",
    redirectPath: "/pedidos",
    duration: 5000,
  };
}

/**
 * Formata a descrição da notificação de pedido agendado
 */
function formatScheduledNotificationDescription(scheduledAt: string | null | undefined): string {
  if (!scheduledAt) return "Um pedido agendado acabou de chegar.";
  const date = new Date(scheduledAt);
  const formatted = date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `Um pedido agendado acabou de chegar. Agendado para ${formatted}`;
}

// ============ HELPERS DE BADGE ============

/**
 * Calcula o badge total para o menu pai "Pedidos" na sidebar
 * Replica a lógica do AdminLayout (childScheduledBadge)
 */
function getParentMenuBadge(menuHref: string, scheduledPendingCount: number, reviewCount: number): number {
  const childReviewBadge = menuHref === '/menu-parent' ? reviewCount : 0;
  const childScheduledBadge = menuHref === '/pedidos' ? scheduledPendingCount : 0;
  return childReviewBadge + childScheduledBadge;
}

/**
 * Calcula o badge para um item filho do menu
 */
function getChildMenuBadge(childHref: string, scheduledPendingCount: number, reviewCount: number, reviewsEnabled: boolean): number {
  if (childHref === '/avaliacoes' && reviewsEnabled && reviewCount > 0) return reviewCount;
  if (childHref === '/agendados' && scheduledPendingCount > 0) return scheduledPendingCount;
  return 0;
}

// ============ TESTES ============

describe("Scheduling Badge - Contagem de Pendentes", () => {
  it("conta corretamente pedidos agendados pendentes", () => {
    const orders: ScheduledOrder[] = [
      { id: 1, status: 'scheduled', isScheduled: true, movedToQueue: false, scheduledAt: new Date("2026-02-15T14:00:00") },
      { id: 2, status: 'scheduled', isScheduled: true, movedToQueue: false, scheduledAt: new Date("2026-02-15T15:00:00") },
      { id: 3, status: 'scheduled', isScheduled: true, movedToQueue: true, scheduledAt: new Date("2026-02-15T12:00:00") },
      { id: 4, status: 'new', isScheduled: true, movedToQueue: true, scheduledAt: new Date("2026-02-15T11:00:00") },
      { id: 5, status: 'cancelled', isScheduled: true, movedToQueue: false, scheduledAt: new Date("2026-02-15T16:00:00") },
    ];
    expect(getScheduledPendingCount(orders)).toBe(2);
  });

  it("retorna 0 quando não há pedidos agendados", () => {
    const orders: ScheduledOrder[] = [
      { id: 1, status: 'new', isScheduled: false, movedToQueue: false, scheduledAt: null },
      { id: 2, status: 'preparing', isScheduled: false, movedToQueue: false, scheduledAt: null },
    ];
    expect(getScheduledPendingCount(orders)).toBe(0);
  });

  it("retorna 0 quando todos os pedidos agendados já foram movidos", () => {
    const orders: ScheduledOrder[] = [
      { id: 1, status: 'scheduled', isScheduled: true, movedToQueue: true, scheduledAt: new Date("2026-02-15T14:00:00") },
      { id: 2, status: 'new', isScheduled: true, movedToQueue: true, scheduledAt: new Date("2026-02-15T15:00:00") },
    ];
    expect(getScheduledPendingCount(orders)).toBe(0);
  });

  it("retorna 0 quando todos os pedidos agendados foram cancelados", () => {
    const orders: ScheduledOrder[] = [
      { id: 1, status: 'cancelled', isScheduled: true, movedToQueue: false, scheduledAt: new Date("2026-02-15T14:00:00") },
      { id: 2, status: 'cancelled', isScheduled: true, movedToQueue: false, scheduledAt: new Date("2026-02-15T15:00:00") },
    ];
    expect(getScheduledPendingCount(orders)).toBe(0);
  });

  it("ignora pedidos não agendados mesmo com status 'scheduled'", () => {
    const orders: ScheduledOrder[] = [
      { id: 1, status: 'scheduled', isScheduled: false, movedToQueue: false, scheduledAt: null },
    ];
    expect(getScheduledPendingCount(orders)).toBe(0);
  });

  it("conta corretamente com grande volume de pedidos", () => {
    const orders: ScheduledOrder[] = [];
    for (let i = 0; i < 100; i++) {
      orders.push({
        id: i,
        status: i % 3 === 0 ? 'scheduled' : (i % 3 === 1 ? 'new' : 'cancelled'),
        isScheduled: true,
        movedToQueue: i % 2 === 0,
        scheduledAt: new Date(`2026-02-15T${String(10 + (i % 12)).padStart(2, '0')}:00:00`),
      });
    }
    // status='scheduled' (i%3===0): i=0,3,6,9,...,99 → 34 pedidos
    // movedToQueue=false (i%2!==0): i=1,3,5,...,99 → 50 pedidos
    // Intersecção: i%3===0 AND i%2!==0 → i=3,9,15,21,27,33,39,45,51,57,63,69,75,81,87,93,99 → 17 pedidos
    const count = getScheduledPendingCount(orders);
    expect(count).toBe(17);
  });
});

describe("Scheduling Badge - Badge do Menu Pai", () => {
  it("mostra contagem de agendados pendentes no menu Pedidos", () => {
    expect(getParentMenuBadge('/pedidos', 5, 3)).toBe(5);
  });

  it("mostra contagem de reviews no menu Menu", () => {
    expect(getParentMenuBadge('/menu-parent', 5, 3)).toBe(3);
  });

  it("retorna 0 quando não há pendentes no menu Pedidos", () => {
    expect(getParentMenuBadge('/pedidos', 0, 3)).toBe(0);
  });

  it("retorna 0 para menus sem badges", () => {
    expect(getParentMenuBadge('/estoque', 5, 3)).toBe(0);
  });
});

describe("Scheduling Badge - Badge do Submenu Agendados", () => {
  it("mostra badge no submenu Agendados quando há pendentes", () => {
    expect(getChildMenuBadge('/agendados', 5, 0, true)).toBe(5);
  });

  it("não mostra badge no submenu Agendados quando contagem é 0", () => {
    expect(getChildMenuBadge('/agendados', 0, 0, true)).toBe(0);
  });

  it("mostra badge de reviews no submenu Avaliações", () => {
    expect(getChildMenuBadge('/avaliacoes', 0, 3, true)).toBe(3);
  });

  it("não mostra badge de reviews quando desabilitado", () => {
    expect(getChildMenuBadge('/avaliacoes', 0, 3, false)).toBe(0);
  });

  it("retorna 0 para submenus sem badges", () => {
    expect(getChildMenuBadge('/catalogo', 5, 3, true)).toBe(0);
  });
});

describe("Scheduling Notification - Diferenciação de Pedidos", () => {
  it("identifica pedido agendado e redireciona para /agendados", () => {
    const info = getNotificationInfo({ id: 1, isScheduled: true, scheduledAt: "2026-02-15T14:00:00" });
    expect(info.title).toBe("Novo pedido agendado!");
    expect(info.buttonLabel).toBe("Ver pedido agendado");
    expect(info.redirectPath).toBe("/agendados");
    expect(info.duration).toBe(8000);
  });

  it("identifica pedido normal e redireciona para /pedidos", () => {
    const info = getNotificationInfo({ id: 2, isScheduled: false });
    expect(info.title).toBe("Novo pedido recebido!");
    expect(info.buttonLabel).toBe("Ver pedidos");
    expect(info.redirectPath).toBe("/pedidos");
    expect(info.duration).toBe(5000);
  });

  it("trata pedido sem campo isScheduled como normal", () => {
    const info = getNotificationInfo({ id: 3 });
    expect(info.title).toBe("Novo pedido recebido!");
    expect(info.redirectPath).toBe("/pedidos");
  });

  it("trata isScheduled=undefined como pedido normal", () => {
    const info = getNotificationInfo({ id: 4, isScheduled: undefined });
    expect(info.redirectPath).toBe("/pedidos");
  });

  it("pedido agendado tem duração maior (8s vs 5s)", () => {
    const scheduled = getNotificationInfo({ id: 1, isScheduled: true });
    const normal = getNotificationInfo({ id: 2, isScheduled: false });
    expect(scheduled.duration).toBeGreaterThan(normal.duration);
  });
});

describe("Scheduling Notification - Formatação de Descrição", () => {
  it("formata descrição com data/hora quando scheduledAt existe", () => {
    const desc = formatScheduledNotificationDescription("2026-02-15T14:00:00");
    expect(desc).toContain("Um pedido agendado acabou de chegar.");
    expect(desc).toContain("Agendado para");
    expect(desc).toContain("15/02");
    expect(desc).toContain("14:00");
  });

  it("retorna descrição simples quando scheduledAt é null", () => {
    const desc = formatScheduledNotificationDescription(null);
    expect(desc).toBe("Um pedido agendado acabou de chegar.");
  });

  it("retorna descrição simples quando scheduledAt é undefined", () => {
    const desc = formatScheduledNotificationDescription(undefined);
    expect(desc).toBe("Um pedido agendado acabou de chegar.");
  });
});

describe("Scheduling Notification - Dados do Evento CustomEvent", () => {
  it("inclui isScheduled no detalhe do evento para pedidos agendados", () => {
    const order = { id: 1, isScheduled: true, scheduledAt: "2026-02-15T14:00:00" };
    const eventDetail = {
      order,
      timestamp: Date.now(),
      isIfood: false,
      isScheduled: (order as any)?.isScheduled === true,
      scheduledAt: (order as any)?.scheduledAt,
    };
    expect(eventDetail.isScheduled).toBe(true);
    expect(eventDetail.scheduledAt).toBe("2026-02-15T14:00:00");
  });

  it("inclui isScheduled=false para pedidos normais", () => {
    const order = { id: 2, isScheduled: false };
    const eventDetail = {
      order,
      timestamp: Date.now(),
      isIfood: false,
      isScheduled: (order as any)?.isScheduled === true,
      scheduledAt: (order as any)?.scheduledAt,
    };
    expect(eventDetail.isScheduled).toBe(false);
    expect(eventDetail.scheduledAt).toBeUndefined();
  });

  it("trata pedido sem isScheduled como não agendado", () => {
    const order = { id: 3 };
    const eventDetail = {
      order,
      timestamp: Date.now(),
      isIfood: false,
      isScheduled: (order as any)?.isScheduled === true,
      scheduledAt: (order as any)?.scheduledAt,
    };
    expect(eventDetail.isScheduled).toBe(false);
  });

  it("preserva dados do pedido iFood no evento", () => {
    const order = { id: 4, source: 'ifood', isScheduled: false };
    const isIfoodOrder = (order as any)?.source === 'ifood';
    const eventDetail = {
      order,
      timestamp: Date.now(),
      isIfood: isIfoodOrder,
      isScheduled: (order as any)?.isScheduled === true,
      scheduledAt: (order as any)?.scheduledAt,
    };
    expect(eventDetail.isIfood).toBe(true);
    expect(eventDetail.isScheduled).toBe(false);
  });
});

// ============ HELPERS DE VISIBILIDADE DO MENU ============

interface NavChild {
  href: string;
  label: string;
}

interface NavItem {
  href: string;
  label: string;
  isParent?: boolean;
  children?: NavChild[];
}

/**
 * Filtra filhos visíveis de um menu pai, baseado nas configurações do estabelecimento.
 * Replica a lógica do AdminLayout para filtrar children.
 */
function getVisibleChildren(
  children: NavChild[],
  schedulingEnabled: boolean,
  reviewsEnabled: boolean
): NavChild[] {
  return children.filter(child => {
    if (child.href === '/avaliacoes' && !reviewsEnabled) return false;
    if (child.href === '/agendados' && !schedulingEnabled) return false;
    return true;
  });
}

/**
 * Determina se um menu pai deve ser renderizado como link direto (sem submenu)
 * quando todos os filhos estão ocultos.
 */
function shouldRenderAsDirectLink(item: NavItem, schedulingEnabled: boolean, reviewsEnabled: boolean): boolean {
  if (!item.isParent || !item.children) return false;
  const visibleChildren = getVisibleChildren(item.children, schedulingEnabled, reviewsEnabled);
  return visibleChildren.length === 0 && !!item.href && !item.href.endsWith('-parent');
}

// ============ TESTES DE VISIBILIDADE DO MENU ============

describe("Scheduling Menu Visibility - Filtragem de Filhos", () => {
  const pedidosChildren: NavChild[] = [
    { href: '/agendados', label: 'Agendados' },
  ];

  const menuChildren: NavChild[] = [
    { href: '/catalogo', label: 'Cardápio' },
    { href: '/complementos', label: 'Grupos' },
    { href: '/avaliacoes', label: 'Avaliações' },
  ];

  it("oculta Agendados quando schedulingEnabled=false", () => {
    const visible = getVisibleChildren(pedidosChildren, false, true);
    expect(visible).toHaveLength(0);
    expect(visible.find(c => c.href === '/agendados')).toBeUndefined();
  });

  it("mostra Agendados quando schedulingEnabled=true", () => {
    const visible = getVisibleChildren(pedidosChildren, true, true);
    expect(visible).toHaveLength(1);
    expect(visible[0].href).toBe('/agendados');
  });

  it("oculta Avaliações quando reviewsEnabled=false", () => {
    const visible = getVisibleChildren(menuChildren, true, false);
    expect(visible).toHaveLength(2);
    expect(visible.find(c => c.href === '/avaliacoes')).toBeUndefined();
  });

  it("mostra Avaliações quando reviewsEnabled=true", () => {
    const visible = getVisibleChildren(menuChildren, true, true);
    expect(visible).toHaveLength(3);
    expect(visible.find(c => c.href === '/avaliacoes')).toBeDefined();
  });

  it("Cardápio e Grupos sempre visíveis independente das flags", () => {
    const visible = getVisibleChildren(menuChildren, false, false);
    expect(visible).toHaveLength(2);
    expect(visible[0].href).toBe('/catalogo');
    expect(visible[1].href).toBe('/complementos');
  });
});

describe("Scheduling Menu Visibility - Renderização como Link Direto", () => {
  const pedidosItem: NavItem = {
    href: '/pedidos',
    label: 'Pedidos',
    isParent: true,
    children: [{ href: '/agendados', label: 'Agendados' }],
  };

  const menuItem: NavItem = {
    href: '/menu-parent',
    label: 'Menu',
    isParent: true,
    children: [
      { href: '/catalogo', label: 'Cardápio' },
      { href: '/complementos', label: 'Grupos' },
      { href: '/avaliacoes', label: 'Avaliações' },
    ],
  };

  it("Pedidos renderiza como link direto quando schedulingEnabled=false", () => {
    expect(shouldRenderAsDirectLink(pedidosItem, false, true)).toBe(true);
  });

  it("Pedidos renderiza como submenu quando schedulingEnabled=true", () => {
    expect(shouldRenderAsDirectLink(pedidosItem, true, true)).toBe(false);
  });

  it("Menu não renderiza como link direto (tem href '-parent')", () => {
    // Menu tem href '/menu-parent' que termina em '-parent', então a condição
    // !item.href.endsWith('-parent') é false, logo retorna false (não renderiza como link direto)
    expect(shouldRenderAsDirectLink(menuItem, false, false)).toBe(false);
  });

  it("Menu com filhos visíveis não renderiza como link direto", () => {
    expect(shouldRenderAsDirectLink(menuItem, true, true)).toBe(false);
  });

  it("Item sem isParent não é afetado", () => {
    const regularItem: NavItem = { href: '/estoque', label: 'Estoque' };
    expect(shouldRenderAsDirectLink(regularItem, false, false)).toBe(false);
  });

  it("Item sem children não é afetado", () => {
    const noChildItem: NavItem = { href: '/entregadores', label: 'Entregadores', isParent: true };
    expect(shouldRenderAsDirectLink(noChildItem, false, false)).toBe(false);
  });
});

describe("Scheduling Menu Visibility - Query pendingCount condicional", () => {
  /**
   * Simula a lógica de habilitar/desabilitar a query de pendingCount
   * baseado no schedulingEnabled do estabelecimento
   */
  function shouldQueryPendingCount(establishmentId: number | undefined, schedulingEnabled: boolean): boolean {
    return !!establishmentId && schedulingEnabled;
  }

  it("habilita query quando establishment existe e scheduling ativado", () => {
    expect(shouldQueryPendingCount(30001, true)).toBe(true);
  });

  it("desabilita query quando scheduling desativado", () => {
    expect(shouldQueryPendingCount(30001, false)).toBe(false);
  });

  it("desabilita query quando establishment não existe", () => {
    expect(shouldQueryPendingCount(undefined, true)).toBe(false);
  });

  it("desabilita query quando ambos inválidos", () => {
    expect(shouldQueryPendingCount(undefined, false)).toBe(false);
  });
});
