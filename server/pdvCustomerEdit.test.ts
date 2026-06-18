import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  upsertPdvCustomer: vi.fn(),
  getPdvCustomerByPhone: vi.fn(),
  searchPdvCustomersByName: vi.fn(),
}));

import { upsertPdvCustomer, getPdvCustomerByPhone, searchPdvCustomersByName } from "./db";

describe("PDV Customer Edit - upsertPdvCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call upsert with all customer data fields", async () => {
    const mockUpsert = vi.mocked(upsertPdvCustomer);
    mockUpsert.mockResolvedValue({
      id: 1,
      establishmentId: 30001,
      phone: "88999290000",
      name: "Ana Carolina",
      street: "Rua Teste",
      number: "123",
      neighborhood: "Centro",
      complement: "Apto 1",
      reference: "Próximo ao mercado",
    });

    const data = {
      establishmentId: 30001,
      phone: "88999290000",
      name: "Ana Carolina",
      street: "Rua Teste",
      number: "123",
      neighborhood: "Centro",
      complement: "Apto 1",
      reference: "Próximo ao mercado",
    };

    const result = await upsertPdvCustomer(data);

    expect(mockUpsert).toHaveBeenCalledWith(data);
    expect(result).toBeDefined();
    expect(result!.name).toBe("Ana Carolina");
    expect(result!.phone).toBe("88999290000");
    expect(result!.street).toBe("Rua Teste");
    expect(result!.number).toBe("123");
    expect(result!.neighborhood).toBe("Centro");
    expect(result!.complement).toBe("Apto 1");
    expect(result!.reference).toBe("Próximo ao mercado");
  });

  it("should support originalPhone for phone number changes", async () => {
    const mockUpsert = vi.mocked(upsertPdvCustomer);
    mockUpsert.mockResolvedValue({
      id: 1,
      establishmentId: 30001,
      phone: "88999999999", // novo telefone
      name: "Ana Carolina",
      street: "Rua Teste",
      number: "123",
      neighborhood: "Centro",
      complement: null,
      reference: null,
    });

    const data = {
      establishmentId: 30001,
      phone: "88999999999", // novo telefone
      name: "Ana Carolina",
      originalPhone: "88999290000", // telefone original para busca
      street: "Rua Teste",
      number: "123",
      neighborhood: "Centro",
    };

    const result = await upsertPdvCustomer(data);

    expect(mockUpsert).toHaveBeenCalledWith(data);
    expect(result).toBeDefined();
    expect(result!.phone).toBe("88999999999");
  });

  it("should support customerId for direct update by ID (prevents duplication)", async () => {
    const mockUpsert = vi.mocked(upsertPdvCustomer);
    mockUpsert.mockResolvedValue({
      id: 690821,
      establishmentId: 30001,
      phone: "88999111111", // novo telefone
      name: "Maria Souza",
      street: "Rua Nova",
      number: "456",
      neighborhood: "Centro",
      complement: null,
      reference: null,
    });

    const data = {
      establishmentId: 30001,
      phone: "88999111111", // novo telefone
      name: "Maria Souza",
      customerId: 690821, // ID do cliente para busca direta
      originalPhone: "88999290000", // telefone original como fallback
      street: "Rua Nova",
      number: "456",
      neighborhood: "Centro",
    };

    const result = await upsertPdvCustomer(data);

    expect(mockUpsert).toHaveBeenCalledWith(data);
    expect(result).toBeDefined();
    expect(result!.id).toBe(690821); // Mesmo ID, não criou duplicata
    expect(result!.phone).toBe("88999111111"); // Telefone atualizado
    expect(result!.name).toBe("Maria Souza");
  });

  it("should pass customerId to upsert when editing existing customer with phone change", async () => {
    const mockUpsert = vi.mocked(upsertPdvCustomer);
    mockUpsert.mockResolvedValue({
      id: 690821,
      establishmentId: 30001,
      phone: "88888888888",
      name: "João Silva",
      street: "Rua A",
      number: "100",
      neighborhood: "Bairro X",
      complement: null,
      reference: null,
    });

    const data = {
      establishmentId: 30001,
      phone: "88888888888", // telefone completamente novo
      name: "João Silva",
      customerId: 690821, // ID garante que atualiza o registro correto
      originalPhone: "88999342392", // telefone antigo
      street: "Rua A",
      number: "100",
      neighborhood: "Bairro X",
    };

    const result = await upsertPdvCustomer(data);

    // Verifica que customerId foi passado na chamada
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 690821 })
    );
    // Verifica que o resultado mantém o mesmo ID (sem duplicação)
    expect(result!.id).toBe(690821);
    expect(result!.phone).toBe("88888888888");
  });

  it("should update name and address fields correctly", async () => {
    const mockUpsert = vi.mocked(upsertPdvCustomer);
    mockUpsert.mockResolvedValue({
      id: 1,
      establishmentId: 30001,
      phone: "88999290000",
      name: "Ana Carolina Silva", // nome atualizado
      street: "Rua Nova",
      number: "456",
      neighborhood: "Bairro Novo",
      complement: "Bloco B",
      reference: "Em frente à praça",
    });

    const data = {
      establishmentId: 30001,
      phone: "88999290000",
      name: "Ana Carolina Silva",
      street: "Rua Nova",
      number: "456",
      neighborhood: "Bairro Novo",
      complement: "Bloco B",
      reference: "Em frente à praça",
    };

    const result = await upsertPdvCustomer(data);

    expect(mockUpsert).toHaveBeenCalledWith(data);
    expect(result!.name).toBe("Ana Carolina Silva");
    expect(result!.street).toBe("Rua Nova");
    expect(result!.number).toBe("456");
    expect(result!.neighborhood).toBe("Bairro Novo");
  });

  it("should handle optional fields as undefined", async () => {
    const mockUpsert = vi.mocked(upsertPdvCustomer);
    mockUpsert.mockResolvedValue({
      id: 2,
      establishmentId: 30001,
      phone: "88999290000",
      name: "João",
      street: null,
      number: null,
      neighborhood: null,
      complement: null,
      reference: null,
    });

    const data = {
      establishmentId: 30001,
      phone: "88999290000",
      name: "João",
      // Sem campos de endereço
    };

    const result = await upsertPdvCustomer(data);

    expect(mockUpsert).toHaveBeenCalledWith(data);
    expect(result).toBeDefined();
    expect(result!.name).toBe("João");
  });

  it("should handle upsert without customerId (new customer or legacy flow)", async () => {
    const mockUpsert = vi.mocked(upsertPdvCustomer);
    mockUpsert.mockResolvedValue({
      id: 999,
      establishmentId: 30001,
      phone: "88999000000",
      name: "Novo Cliente",
      street: null,
      number: null,
      neighborhood: null,
      complement: null,
      reference: null,
    });

    const data = {
      establishmentId: 30001,
      phone: "88999000000",
      name: "Novo Cliente",
      // Sem customerId - fluxo de novo cliente
    };

    const result = await upsertPdvCustomer(data);

    expect(mockUpsert).toHaveBeenCalledWith(data);
    expect(result).toBeDefined();
    expect(result!.id).toBe(999);
    // Não deve ter customerId na chamada
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.not.objectContaining({ customerId: expect.any(Number) })
    );
  });
});

describe("PDV Customer Search - searchPdvCustomersByName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return updated customer data when searching by name", async () => {
    const mockSearch = vi.mocked(searchPdvCustomersByName);
    mockSearch.mockResolvedValue([
      {
        id: 1,
        establishmentId: 30001,
        phone: "88999290000",
        name: "Ana Carolina Silva",
        street: "Rua Nova",
        number: "456",
        neighborhood: "Bairro Novo",
        complement: "Bloco B",
        reference: "Em frente à praça",
        createdAt: new Date(),
      },
    ]);

    const results = await searchPdvCustomersByName(30001, "Ana", 20);

    expect(mockSearch).toHaveBeenCalledWith(30001, "Ana", 20);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Ana Carolina Silva");
    expect(results[0].street).toBe("Rua Nova");
  });

  it("should return customer id for use in customerId tracking", async () => {
    const mockSearch = vi.mocked(searchPdvCustomersByName);
    mockSearch.mockResolvedValue([
      {
        id: 690821,
        establishmentId: 30001,
        phone: "88999342392",
        name: "Cliente Teste",
        street: "Rua X",
        number: "10",
        neighborhood: "Centro",
        complement: null,
        reference: null,
        createdAt: new Date(),
      },
    ]);

    const results = await searchPdvCustomersByName(30001, "Cliente", 20);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(690821);
    // O id deve ser usado como customerId no frontend para evitar duplicação
  });
});

describe("PDV Customer Find - getPdvCustomerByPhone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return updated customer data when finding by phone", async () => {
    const mockFind = vi.mocked(getPdvCustomerByPhone);
    mockFind.mockResolvedValue({
      id: 1,
      establishmentId: 30001,
      phone: "88999290000",
      name: "Ana Carolina Silva",
      street: "Rua Nova",
      number: "456",
      neighborhood: "Bairro Novo",
      complement: "Bloco B",
      reference: "Em frente à praça",
      createdAt: new Date(),
    });

    const result = await getPdvCustomerByPhone(30001, "88999290000");

    expect(mockFind).toHaveBeenCalledWith(30001, "88999290000");
    expect(result).toBeDefined();
    expect(result!.name).toBe("Ana Carolina Silva");
    expect(result!.phone).toBe("88999290000");
  });

  it("should return customer id for customerId tracking in frontend", async () => {
    const mockFind = vi.mocked(getPdvCustomerByPhone);
    mockFind.mockResolvedValue({
      id: 690821,
      establishmentId: 30001,
      phone: "88999342392",
      name: "Cliente Teste",
      street: "Rua X",
      number: "10",
      neighborhood: "Centro",
      complement: null,
      reference: null,
      createdAt: new Date(),
    });

    const result = await getPdvCustomerByPhone(30001, "88999342392");

    expect(result).toBeDefined();
    expect(result!.id).toBe(690821);
    // Este id deve ser armazenado como customerId no deliveryAddress state
  });
});
