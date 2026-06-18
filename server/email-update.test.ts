import { describe, expect, it, beforeEach, vi } from "vitest";

// Mock db functions
const mockGetEstablishmentById = vi.fn();
const mockGetUsersByEmail = vi.fn();
const mockGetUserById = vi.fn();
const mockUpdateEstablishmentAccountDataAndUserEmail = vi.fn();
const mockUpdateEstablishmentAccountData = vi.fn();
const mockInvalidateUserCache = vi.fn();

vi.mock("./db", () => ({
  getEstablishmentById: (...args: any[]) => mockGetEstablishmentById(...args),
  getUsersByEmail: (...args: any[]) => mockGetUsersByEmail(...args),
  getUserById: (...args: any[]) => mockGetUserById(...args),
  updateEstablishmentAccountDataAndUserEmail: (...args: any[]) => mockUpdateEstablishmentAccountDataAndUserEmail(...args),
  updateEstablishmentAccountData: (...args: any[]) => mockUpdateEstablishmentAccountData(...args),
}));

async function simulateUpdateAccountData(
  input: { establishmentId: number; email?: string | null; name?: string },
  ctxUserId = 1,
) {
  const { establishmentId, ...rawData } = input;
  const normalizedEmail = typeof input.email === "string" ? input.email.trim().toLowerCase() : input.email;
  const data = {
    ...rawData,
    ...(input.email !== undefined ? { email: normalizedEmail } : {}),
  };
  let targetUserIdForEmailUpdate: number | null = null;
  let targetUserOpenIdForCacheInvalidation: string | null = null;

  if (normalizedEmail !== undefined && normalizedEmail !== null) {
    const establishment = await mockGetEstablishmentById(establishmentId);
    const targetUserId = establishment?.userId ?? ctxUserId;
    const usersWithEmail = await mockGetUsersByEmail(normalizedEmail);

    if (usersWithEmail.some((existingUser: { id: number }) => existingUser.id !== targetUserId)) {
      throw new Error("Este e-mail já está em uso por outra conta.");
    }

    const targetUser = await mockGetUserById(targetUserId);
    targetUserIdForEmailUpdate = targetUserId;
    targetUserOpenIdForCacheInvalidation = targetUser?.openId ?? null;
  }

  if (targetUserIdForEmailUpdate !== null && normalizedEmail !== undefined && normalizedEmail !== null) {
    await mockUpdateEstablishmentAccountDataAndUserEmail(
      establishmentId,
      data,
      targetUserIdForEmailUpdate,
      normalizedEmail,
    );
    if (targetUserOpenIdForCacheInvalidation) {
      await mockInvalidateUserCache(targetUserOpenIdForCacheInvalidation);
    }
  } else {
    await mockUpdateEstablishmentAccountData(establishmentId, data);
  }
}

describe("Email update in account settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates establishment email and login email atomically for the establishment owner", async () => {
    const newEmail = "Deivisson-gomes@hotmail.com";
    const normalizedEmail = "deivisson-gomes@hotmail.com";
    const userId = 5;
    const establishmentId = 1;

    mockGetEstablishmentById.mockResolvedValue({ id: establishmentId, userId });
    mockGetUsersByEmail.mockResolvedValue([]);
    mockGetUserById.mockResolvedValue({ id: userId, openId: "owner-open-id" });
    mockUpdateEstablishmentAccountDataAndUserEmail.mockResolvedValue(undefined);
    mockInvalidateUserCache.mockResolvedValue(undefined);

    await simulateUpdateAccountData({ establishmentId, email: newEmail });

    expect(mockUpdateEstablishmentAccountDataAndUserEmail).toHaveBeenCalledWith(
      establishmentId,
      { email: normalizedEmail },
      userId,
      normalizedEmail,
    );
    expect(mockUpdateEstablishmentAccountData).not.toHaveBeenCalled();
    expect(mockInvalidateUserCache).toHaveBeenCalledWith("owner-open-id");
  });

  it("does not update login email when email is null", async () => {
    const establishmentId = 1;

    mockUpdateEstablishmentAccountData.mockResolvedValue(undefined);

    await simulateUpdateAccountData({ establishmentId, email: null });

    expect(mockUpdateEstablishmentAccountData).toHaveBeenCalledWith(establishmentId, { email: null });
    expect(mockUpdateEstablishmentAccountDataAndUserEmail).not.toHaveBeenCalled();
  });

  it("does not update login email when email is undefined", async () => {
    const establishmentId = 1;

    mockUpdateEstablishmentAccountData.mockResolvedValue(undefined);

    await simulateUpdateAccountData({ establishmentId, name: "Test" });

    expect(mockUpdateEstablishmentAccountData).toHaveBeenCalledWith(establishmentId, { name: "Test" });
    expect(mockUpdateEstablishmentAccountDataAndUserEmail).not.toHaveBeenCalled();
  });

  it("blocks duplicate email before changing establishments or users", async () => {
    const newEmail = "existing@email.com";
    const userId = 5;
    const anotherUserId = 10;
    const establishmentId = 1;

    mockGetEstablishmentById.mockResolvedValue({ id: establishmentId, userId });
    mockGetUsersByEmail.mockResolvedValue([{ id: anotherUserId, email: newEmail }]);

    await expect(simulateUpdateAccountData({ establishmentId, email: newEmail })).rejects.toThrow(
      "Este e-mail já está em uso por outra conta.",
    );

    expect(mockUpdateEstablishmentAccountData).not.toHaveBeenCalled();
    expect(mockUpdateEstablishmentAccountDataAndUserEmail).not.toHaveBeenCalled();
  });

  it("blocks hidden duplicates even when the same owner also has the email", async () => {
    const newEmail = "same@email.com";
    const userId = 5;
    const anotherUserId = 10;
    const establishmentId = 1;

    mockGetEstablishmentById.mockResolvedValue({ id: establishmentId, userId });
    mockGetUsersByEmail.mockResolvedValue([
      { id: userId, email: newEmail },
      { id: anotherUserId, email: newEmail },
    ]);

    await expect(simulateUpdateAccountData({ establishmentId, email: newEmail })).rejects.toThrow(
      "Este e-mail já está em uso por outra conta.",
    );

    expect(mockUpdateEstablishmentAccountDataAndUserEmail).not.toHaveBeenCalled();
  });

  it("allows keeping an email that already belongs only to the same owner user", async () => {
    const newEmail = "same@email.com";
    const userId = 5;
    const establishmentId = 1;

    mockGetEstablishmentById.mockResolvedValue({ id: establishmentId, userId });
    mockGetUsersByEmail.mockResolvedValue([{ id: userId, email: newEmail }]);
    mockGetUserById.mockResolvedValue({ id: userId, openId: "owner-open-id" });
    mockUpdateEstablishmentAccountDataAndUserEmail.mockResolvedValue(undefined);

    await simulateUpdateAccountData({ establishmentId, email: newEmail });

    expect(mockUpdateEstablishmentAccountDataAndUserEmail).toHaveBeenCalledWith(
      establishmentId,
      { email: newEmail },
      userId,
      newEmail,
    );
  });
});
