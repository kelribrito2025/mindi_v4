import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getEstablishmentByUserId: vi.fn(),
  createEstablishment: vi.fn(),
  updateEstablishment: vi.fn(),
  toggleEstablishmentOpen: vi.fn(),
  getCategoriesByEstablishment: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  reorderCategories: vi.fn(),
  getProductsByEstablishment: vi.fn(),
  getProductById: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  toggleProductStatus: vi.fn(),
  duplicateProduct: vi.fn(),
  getLowStockProducts: vi.fn(),
  getComplementGroupsByProduct: vi.fn(),
  getComplementItemsByGroup: vi.fn(),
  createComplementGroup: vi.fn(),
  updateComplementGroup: vi.fn(),
  deleteComplementGroup: vi.fn(),
  createComplementItem: vi.fn(),
  updateComplementItem: vi.fn(),
  deleteComplementItem: vi.fn(),
  getOrdersByEstablishment: vi.fn(),
  getOrderById: vi.fn(),
  getOrderItems: vi.fn(),
  createOrder: vi.fn(),
  updateOrderStatus: vi.fn(),
  getDashboardStats: vi.fn(),
  getWeeklyStats: vi.fn(),
  getRecentOrders: vi.fn(),
  saveBusinessHours: vi.fn(),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Establishment Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("establishment.get", () => {
    it("returns establishment for authenticated user", async () => {
      const mockEstablishment = {
        id: 1,
        userId: 1,
        name: "Test Restaurant",
        isOpen: true,
        acceptsCash: true,
        acceptsCard: true,
        acceptsPix: false,
        acceptsBoleto: false,
        allowsDelivery: true,
        allowsPickup: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getEstablishmentByUserId).mockResolvedValue(mockEstablishment as any);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.establishment.get();

      expect(result).toEqual(mockEstablishment);
      expect(db.getEstablishmentByUserId).toHaveBeenCalledWith(1);
    });

    it("returns undefined when no establishment exists", async () => {
      vi.mocked(db.getEstablishmentByUserId).mockResolvedValue(undefined);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.establishment.get();

      expect(result).toBeUndefined();
    });
  });

  describe("establishment.create", () => {
    it("creates a new establishment", async () => {
      vi.mocked(db.createEstablishment).mockResolvedValue(1);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.establishment.create({
        name: "New Restaurant",
        street: "Test Street",
        city: "Test City",
      });

      expect(result).toEqual({ id: 1 });
      expect(db.createEstablishment).toHaveBeenCalledWith({
        name: "New Restaurant",
        street: "Test Street",
        city: "Test City",
        userId: 1,
      });
    });
  });

  describe("establishment.toggleOpen", () => {
    it("toggles establishment open status", async () => {
      vi.mocked(db.toggleEstablishmentOpen).mockResolvedValue(undefined);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.establishment.toggleOpen({
        id: 1,
        isOpen: true,
      });

      expect(result).toEqual({ success: true });
      expect(db.toggleEstablishmentOpen).toHaveBeenCalledWith(1, true);
    });
  });
});

describe("Category Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("category.list", () => {
    it("returns categories for establishment", async () => {
      const mockCategories = [
        { id: 1, name: "Lanches", establishmentId: 1, sortOrder: 0 },
        { id: 2, name: "Bebidas", establishmentId: 1, sortOrder: 1 },
      ];

      vi.mocked(db.getCategoriesByEstablishment).mockResolvedValue(mockCategories as any);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.category.list({ establishmentId: 1 });

      expect(result).toEqual(mockCategories);
      expect(db.getCategoriesByEstablishment).toHaveBeenCalledWith(1);
    });
  });

  describe("category.create", () => {
    it("creates a new category", async () => {
      vi.mocked(db.createCategory).mockResolvedValue(1);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.category.create({
        establishmentId: 1,
        name: "Sobremesas",
      });

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("category.delete", () => {
    it("deletes a category", async () => {
      vi.mocked(db.deleteCategory).mockResolvedValue(undefined);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.category.delete({ id: 1 });

      expect(result).toEqual({ success: true });
      expect(db.deleteCategory).toHaveBeenCalledWith(1);
    });
  });
});

describe("Product Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("product.list", () => {
    it("returns products with filters", async () => {
      const mockProducts = {
        products: [
          { id: 1, name: "X-Burger", price: "25.00", status: "active" },
          { id: 2, name: "X-Salada", price: "28.00", status: "active" },
        ],
        total: 2,
      };

      vi.mocked(db.getProductsByEstablishment).mockResolvedValue(mockProducts as any);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.product.list({
        establishmentId: 1,
        status: "active",
      });

      expect(result).toEqual(mockProducts);
    });
  });

  describe("product.create", () => {
    it("creates a new product", async () => {
      vi.mocked(db.createProduct).mockResolvedValue(1);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.product.create({
        establishmentId: 1,
        name: "X-Bacon",
        price: "32.00",
      });

      expect(result).toEqual({ id: 1 });
    });
  });

  describe("product.toggleStatus", () => {
    it("toggles product status", async () => {
      vi.mocked(db.toggleProductStatus).mockResolvedValue(undefined);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.product.toggleStatus({
        id: 1,
        status: "paused",
      });

      expect(result).toEqual({ success: true });
      expect(db.toggleProductStatus).toHaveBeenCalledWith(1, "paused");
    });
  });

  describe("product.duplicate", () => {
    it("duplicates a product", async () => {
      vi.mocked(db.duplicateProduct).mockResolvedValue(2);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.product.duplicate({ id: 1 });

      expect(result).toEqual({ id: 2 });
      expect(db.duplicateProduct).toHaveBeenCalledWith(1);
    });
  });
});

describe("Order Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("order.list", () => {
    it("returns orders by status", async () => {
      const mockOrders = [
        { id: 1, orderNumber: "001", status: "new", total: "50.00" },
        { id: 2, orderNumber: "002", status: "new", total: "75.00" },
      ];

      vi.mocked(db.getOrdersByEstablishment).mockResolvedValue(mockOrders as any);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.order.list({
        establishmentId: 1,
        status: "new",
      });

      expect(result).toEqual(mockOrders);
    });
  });

  describe("order.updateStatus", () => {
    it("updates order status", async () => {
      vi.mocked(db.updateOrderStatus).mockResolvedValue(undefined);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.order.updateStatus({
        id: 1,
        status: "preparing",
      });

      expect(result).toEqual({ success: true });
      expect(db.updateOrderStatus).toHaveBeenCalledWith(1, "preparing");
    });
  });
});

describe("Dashboard Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("dashboard.stats", () => {
    it("returns dashboard statistics", async () => {
      const mockStats = {
        ordersCount: 10,
        revenue: 500,
        avgTicket: 50,
        lowStockCount: 2,
        ordersChange: 0,
        revenueChange: 0,
        avgTicketChange: 0,
        lowStockChange: 0,
        recurringCustomers: 5,
        recurringPercentage: 25,
        recurringChange: 10,
      };

      vi.mocked(db.getDashboardStats).mockResolvedValue(mockStats);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.dashboard.stats({ establishmentId: 1 });

      expect(result).toEqual(mockStats);
      expect(db.getDashboardStats).toHaveBeenCalledWith(1, 'today');
    });
  });

  describe("dashboard.recentOrders", () => {
    it("returns recent orders", async () => {
      const mockOrders = [
        { id: 1, orderNumber: "001", status: "completed" },
        { id: 2, orderNumber: "002", status: "preparing" },
      ];

      vi.mocked(db.getRecentOrders).mockResolvedValue(mockOrders as any);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.dashboard.recentOrders({
        establishmentId: 1,
        limit: 5,
      });

      expect(result).toEqual(mockOrders);
      expect(db.getRecentOrders).toHaveBeenCalledWith(1, 5);
    });
  });
});
