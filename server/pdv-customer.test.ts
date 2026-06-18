import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("pdvCustomer", () => {
  const { ctx } = createAuthContext();
  const caller = appRouter.createCaller(ctx);
  const testPhone = "88999990001";
  const testEstablishmentId = 999999; // Use a unique ID to avoid conflicts

  it("findByPhone returns null for non-existent customer", async () => {
    const result = await caller.pdvCustomer.findByPhone({
      establishmentId: testEstablishmentId,
      phone: testPhone,
    });
    expect(result).toBeNull();
  });

  it("upsert creates a new customer", async () => {
    const result = await caller.pdvCustomer.upsert({
      establishmentId: testEstablishmentId,
      phone: testPhone,
      name: "João Teste",
      street: "Rua das Flores",
      number: "123",
      complement: "Apto 4",
      neighborhood: "Centro",
      reference: "Próximo à praça",
    });
    expect(result).toBeDefined();
    expect(result.phone).toBe(testPhone);
    expect(result.name).toBe("João Teste");
    expect(result.street).toBe("Rua das Flores");
    expect(result.number).toBe("123");
    expect(result.neighborhood).toBe("Centro");
    expect(result.reference).toBe("Próximo à praça");
  });

  it("findByPhone returns the created customer", async () => {
    const result = await caller.pdvCustomer.findByPhone({
      establishmentId: testEstablishmentId,
      phone: testPhone,
    });
    expect(result).not.toBeNull();
    expect(result!.name).toBe("João Teste");
    expect(result!.street).toBe("Rua das Flores");
    expect(result!.number).toBe("123");
    expect(result!.complement).toBe("Apto 4");
    expect(result!.neighborhood).toBe("Centro");
    expect(result!.reference).toBe("Próximo à praça");
  });

  it("upsert updates existing customer data", async () => {
    const result = await caller.pdvCustomer.upsert({
      establishmentId: testEstablishmentId,
      phone: testPhone,
      name: "João Atualizado",
      street: "Rua Nova",
      number: "456",
      neighborhood: "Bairro Novo",
    });
    expect(result).toBeDefined();
    expect(result.name).toBe("João Atualizado");
    expect(result.street).toBe("Rua Nova");
    expect(result.number).toBe("456");
    expect(result.neighborhood).toBe("Bairro Novo");
  });

  it("findByPhone returns updated data", async () => {
    const result = await caller.pdvCustomer.findByPhone({
      establishmentId: testEstablishmentId,
      phone: testPhone,
    });
    expect(result).not.toBeNull();
    expect(result!.name).toBe("João Atualizado");
    expect(result!.street).toBe("Rua Nova");
    expect(result!.number).toBe("456");
    expect(result!.neighborhood).toBe("Bairro Novo");
  });

  it("findByPhone does not return customer from different establishment", async () => {
    const result = await caller.pdvCustomer.findByPhone({
      establishmentId: testEstablishmentId + 1,
      phone: testPhone,
    });
    expect(result).toBeNull();
  });

  it("rejects phone with less than 8 digits", async () => {
    await expect(
      caller.pdvCustomer.findByPhone({
        establishmentId: testEstablishmentId,
        phone: "1234567", // 7 digits
      })
    ).rejects.toThrow();
  });
});
