import { describe, it, expect } from "vitest";

/**
 * Testa a lógica de mapeamento de status do Banking KYC.
 * Replica a lógica do checkKycStatus em server/routers/paytime.ts
 */

function mapBankingStatus(bankingStatus: string | null | undefined): "not_started" | "waiting_kyc" | "pending" | "approved" | "rejected" {
  let kycStatus: "not_started" | "waiting_kyc" | "pending" | "approved" | "rejected" = "pending";
  const upperStatus = (bankingStatus || "").toUpperCase();
  if (upperStatus === "APPROVED" || upperStatus === "ACTIVE") {
    kycStatus = "approved";
  } else if (upperStatus === "REJECTED" || upperStatus === "DENIED" || upperStatus === "DENIED_KYC" || upperStatus === "REPROVED" || upperStatus === "BLOCKED" || upperStatus === "CANCELLED") {
    kycStatus = "rejected";
  } else if (upperStatus === "WAITING_KYC" || upperStatus === "WAITING_DOCUMENTS" || upperStatus === "DOCUMENTS_PENDING") {
    kycStatus = "waiting_kyc";
  } else if (upperStatus === "PENDING" || upperStatus === "WAITING" || upperStatus === "ANALYZING" || upperStatus === "IN_ANALYSIS" || upperStatus === "PROCESSING") {
    kycStatus = "pending";
  } else {
    kycStatus = "pending";
  }
  return kycStatus;
}

describe("Banking KYC Status Mapping", () => {
  it("should map APPROVED to approved", () => {
    expect(mapBankingStatus("APPROVED")).toBe("approved");
  });

  it("should map ACTIVE to approved", () => {
    expect(mapBankingStatus("ACTIVE")).toBe("approved");
  });

  it("should map REJECTED to rejected", () => {
    expect(mapBankingStatus("REJECTED")).toBe("rejected");
  });

  it("should map DENIED to rejected", () => {
    expect(mapBankingStatus("DENIED")).toBe("rejected");
  });

  it("should map DENIED_KYC to rejected", () => {
    expect(mapBankingStatus("DENIED_KYC")).toBe("rejected");
  });

  it("should map REPROVED to rejected", () => {
    expect(mapBankingStatus("REPROVED")).toBe("rejected");
  });

  it("should map BLOCKED to rejected", () => {
    expect(mapBankingStatus("BLOCKED")).toBe("rejected");
  });

  it("should map CANCELLED to rejected", () => {
    expect(mapBankingStatus("CANCELLED")).toBe("rejected");
  });

  it("should map PENDING to pending", () => {
    expect(mapBankingStatus("PENDING")).toBe("pending");
  });

  it("should map WAITING to pending", () => {
    expect(mapBankingStatus("WAITING")).toBe("pending");
  });

  it("should map ANALYZING to pending", () => {
    expect(mapBankingStatus("ANALYZING")).toBe("pending");
  });

  it("should map WAITING_KYC to waiting_kyc", () => {
    expect(mapBankingStatus("WAITING_KYC")).toBe("waiting_kyc");
  });

  it("should map document-waiting statuses to waiting_kyc", () => {
    expect(mapBankingStatus("WAITING_DOCUMENTS")).toBe("waiting_kyc");
    expect(mapBankingStatus("DOCUMENTS_PENDING")).toBe("waiting_kyc");
  });

  it("should map IN_ANALYSIS to pending", () => {
    expect(mapBankingStatus("IN_ANALYSIS")).toBe("pending");
  });

  it("should map PROCESSING to pending", () => {
    expect(mapBankingStatus("PROCESSING")).toBe("pending");
  });

  it("should be case-insensitive", () => {
    expect(mapBankingStatus("approved")).toBe("approved");
    expect(mapBankingStatus("Rejected")).toBe("rejected");
    expect(mapBankingStatus("waiting_kyc")).toBe("waiting_kyc");
  });

  it("should map unknown status to pending", () => {
    expect(mapBankingStatus("UNKNOWN_STATUS")).toBe("pending");
    expect(mapBankingStatus("SOMETHING_ELSE")).toBe("pending");
  });

  it("should handle null/undefined as pending", () => {
    expect(mapBankingStatus(null)).toBe("pending");
    expect(mapBankingStatus(undefined)).toBe("pending");
    expect(mapBankingStatus("")).toBe("pending");
  });
});
