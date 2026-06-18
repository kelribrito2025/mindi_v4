import { TRPCError } from "@trpc/server";
import * as db from "../db";

// Security helper: verifica que o usuário autenticado tem acesso ao estabelecimento
// Usa user_establishments para suportar multi-estabelecimento
export async function assertEstablishmentOwnership(userId: number, establishmentId: number): Promise<void> {
  // Use the db function that checks user_establishments table
  const establishments = await db.getUserEstablishments(userId);
  const hasAccess = establishments.some(e => e.establishmentId === establishmentId);
  if (!hasAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso negado: você não tem permissão para acessar este estabelecimento.",
    });
  }
}
