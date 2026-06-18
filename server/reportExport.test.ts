import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the dependencies before importing the module
vi.mock("./_core/sdk", () => ({
  sdk: {
    verifySession: vi.fn(),
  },
}));

vi.mock("./db", () => ({
  getUserByOpenId: vi.fn(),
  getEstablishmentByUserId: vi.fn(),
}));

vi.mock("./routers/reportHelpers", () => ({
  getDRE: vi.fn(),
  getProductsABC: vi.fn(),
}));

import { createReportExportRouter } from "./routers/reportExport";
import { sdk } from "./_core/sdk";
import { getUserByOpenId, getEstablishmentByUserId } from "./db";
import { getDRE, getProductsABC } from "./routers/reportHelpers";
import express from "express";
import request from "supertest";

// Create a test app with the export router
function createTestApp() {
  const app = express();
  app.use(require("cookie-parser")());
  app.use("/api/export", createReportExportRouter());
  return app;
}

const mockUser = {
  id: 1,
  openId: "test-user-open-id",
  email: "test@example.com",
  name: "Test User",
  role: "admin",
  loginMethod: "manus",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const mockEstablishment = {
  id: 42,
  name: "Restaurante Teste",
  slug: "restaurante-teste",
};

const mockDREData = {
  grossRevenue: 50000,
  cancellations: 1500,
  netRevenue: 48500,
  orderCount: 320,
  totalCMV: 15000,
  cmvPercentage: 30.9,
  grossProfit: 33500,
  grossMargin: 69.1,
  totalExpenses: 12000,
  expensesByCategory: [
    { category: "Aluguel", color: "#ef4444", amount: 5000 },
    { category: "Funcionários", color: "#f59e0b", amount: 4500 },
    { category: "Energia", color: "#3b82f6", amount: 2500 },
  ],
  operatingResult: 21500,
  operatingMargin: 44.3,
  period: {
    start: "2026-03-01T00:00:00.000Z",
    end: "2026-03-28T23:59:59.000Z",
    label: "month",
  },
};

const mockABCData = {
  items: [
    {
      productId: 1,
      productName: "X-Burguer",
      categoryName: "Lanches",
      quantity: 150,
      revenue: 7500,
      percentage: 37.5,
      accumulatedPercentage: 37.5,
      classification: "A" as const,
    },
    {
      productId: 2,
      productName: "Pizza Margherita",
      categoryName: "Pizzas",
      quantity: 100,
      revenue: 5000,
      percentage: 25.0,
      accumulatedPercentage: 62.5,
      classification: "A" as const,
    },
    {
      productId: 3,
      productName: "Coca-Cola",
      categoryName: "Bebidas",
      quantity: 200,
      revenue: 2000,
      percentage: 10.0,
      accumulatedPercentage: 72.5,
      classification: "A" as const,
    },
    {
      productId: 4,
      productName: "Batata Frita",
      categoryName: "Porções",
      quantity: 80,
      revenue: 1600,
      percentage: 8.0,
      accumulatedPercentage: 80.5,
      classification: "B" as const,
    },
    {
      productId: 5,
      productName: "Suco Natural",
      categoryName: "Bebidas",
      quantity: 60,
      revenue: 900,
      percentage: 4.5,
      accumulatedPercentage: 85.0,
      classification: "B" as const,
    },
  ],
  summary: {
    totalProducts: 5,
    totalRevenue: 20000,
    totalQuantity: 590,
    classA: { count: 3, revenue: 14500, percentage: 72.5 },
    classB: { count: 2, revenue: 2500, percentage: 12.5 },
    classC: { count: 0, revenue: 0, percentage: 0 },
  },
  period: {
    start: "2026-03-01T00:00:00.000Z",
    end: "2026-03-28T23:59:59.000Z",
    label: "month",
  },
};

function setupAuthMocks() {
  (sdk.verifySession as any).mockResolvedValue({ openId: mockUser.openId });
  (getUserByOpenId as any).mockResolvedValue(mockUser);
  (getEstablishmentByUserId as any).mockResolvedValue(mockEstablishment);
}

describe("Report Export Endpoints", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe("Authentication", () => {
    it("returns 401 when no session cookie is provided", async () => {
      const res = await request(app).get("/api/export/dre/pdf?period=month");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Unauthorized");
    });

    it("returns 401 when session token is invalid", async () => {
      (sdk.verifySession as any).mockRejectedValue(new Error("Invalid token"));
      const res = await request(app)
        .get("/api/export/dre/pdf?period=month")
        .set("Cookie", "app_session_id=invalid-token");
      expect(res.status).toBe(401);
    });

    it("returns 401 when user is not found", async () => {
      (sdk.verifySession as any).mockResolvedValue({ openId: "unknown" });
      (getUserByOpenId as any).mockResolvedValue(null);
      const res = await request(app)
        .get("/api/export/dre/pdf?period=month")
        .set("Cookie", "app_session_id=valid-token");
      expect(res.status).toBe(401);
    });

    it("returns 404 when establishment is not found", async () => {
      (sdk.verifySession as any).mockResolvedValue({ openId: mockUser.openId });
      (getUserByOpenId as any).mockResolvedValue(mockUser);
      (getEstablishmentByUserId as any).mockResolvedValue(null);
      const res = await request(app)
        .get("/api/export/dre/pdf?period=month")
        .set("Cookie", "app_session_id=valid-token");
      expect(res.status).toBe(404);
    });
  });

  describe("DRE PDF Export", () => {
    it("generates a PDF file with correct content type and disposition", async () => {
      setupAuthMocks();
      (getDRE as any).mockResolvedValue(mockDREData);

      const res = await request(app)
        .get("/api/export/dre/pdf?period=month")
        .set("Cookie", "app_session_id=valid-token")
        .buffer(true);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("application/pdf");
      expect(res.headers["content-disposition"]).toContain("DRE_");
      expect(res.headers["content-disposition"]).toContain(".pdf");
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("passes correct period params to getDRE", async () => {
      setupAuthMocks();
      (getDRE as any).mockResolvedValue(mockDREData);

      await request(app)
        .get("/api/export/dre/pdf?period=custom&startDate=2026-01-01&endDate=2026-01-31")
        .set("Cookie", "app_session_id=valid-token")
        .buffer(true);

      expect(getDRE).toHaveBeenCalledWith(42, "custom", "2026-01-01", "2026-01-31");
    });
  });

  describe("DRE Excel Export", () => {
    it("generates an Excel file with correct content type", async () => {
      setupAuthMocks();
      (getDRE as any).mockResolvedValue(mockDREData);

      const res = await request(app)
        .get("/api/export/dre/excel?period=month")
        .set("Cookie", "app_session_id=valid-token")
        .buffer(true)
        .parse((res, callback) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => callback(null, Buffer.concat(chunks)));
        });

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      expect(res.headers["content-disposition"]).toContain(".xlsx");
      expect(Buffer.isBuffer(res.body)).toBe(true);
      expect((res.body as Buffer).length).toBeGreaterThan(0);
    });
  });

  describe("ABC PDF Export", () => {
    it("generates a PDF file with correct content type", async () => {
      setupAuthMocks();
      (getProductsABC as any).mockResolvedValue(mockABCData);

      const res = await request(app)
        .get("/api/export/abc/pdf?period=month")
        .set("Cookie", "app_session_id=valid-token")
        .buffer(true);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("application/pdf");
      expect(res.headers["content-disposition"]).toContain("Curva_ABC_");
      expect(res.headers["content-disposition"]).toContain(".pdf");
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("passes correct period params to getProductsABC", async () => {
      setupAuthMocks();
      (getProductsABC as any).mockResolvedValue(mockABCData);

      await request(app)
        .get("/api/export/abc/pdf?period=last_month")
        .set("Cookie", "app_session_id=valid-token")
        .buffer(true);

      expect(getProductsABC).toHaveBeenCalledWith(42, "last_month", undefined, undefined);
    });
  });

  describe("ABC Excel Export", () => {
    it("generates an Excel file with correct content type", async () => {
      setupAuthMocks();
      (getProductsABC as any).mockResolvedValue(mockABCData);

      const res = await request(app)
        .get("/api/export/abc/excel?period=month")
        .set("Cookie", "app_session_id=valid-token")
        .buffer(true)
        .parse((res, callback) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => callback(null, Buffer.concat(chunks)));
        });

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      expect(res.headers["content-disposition"]).toContain("Curva_ABC_");
      expect(res.headers["content-disposition"]).toContain(".xlsx");
      expect(Buffer.isBuffer(res.body)).toBe(true);
      expect((res.body as Buffer).length).toBeGreaterThan(0);
    });
  });

  describe("Default period handling", () => {
    it("defaults to 'month' period when not specified", async () => {
      setupAuthMocks();
      (getDRE as any).mockResolvedValue(mockDREData);

      await request(app)
        .get("/api/export/dre/pdf")
        .set("Cookie", "app_session_id=valid-token")
        .buffer(true);

      expect(getDRE).toHaveBeenCalledWith(42, "month", undefined, undefined);
    });
  });
});
