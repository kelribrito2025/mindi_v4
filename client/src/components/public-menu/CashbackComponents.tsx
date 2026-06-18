import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  X, ChevronRight, Wallet, Zap, Phone, Loader2, Eye, Check,
  ArrowUpRight, ArrowDownLeft, Percent, Clock, Info
} from "lucide-react";
import { toast } from "sonner";

export function CashbackIntroSheet({ onClose, onContinue }: { onClose: () => void; onContinue: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center md:justify-center px-0 md:px-4">
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full md:max-w-md bg-white rounded-t-[30px] md:rounded-[30px] shadow-2xl overflow-hidden min-h-[87dvh] max-h-[90dvh] flex flex-col animate-in slide-in-from-bottom md:zoom-in-95 duration-300">
        <div className="relative h-[47dvh] min-h-[310px] max-h-[450px] overflow-hidden rounded-t-[30px]">
          <img
            src="/assets/cashback-intro.jpg?v=baseline-20260519"
            alt="Cliente usando o celular para acompanhar o programa de cashback"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar introdução do programa de cashback"
            className="absolute right-5 top-5 h-11 w-11 rounded-full bg-slate-900/70 text-white shadow-lg backdrop-blur-sm flex items-center justify-center hover:bg-slate-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative -mt-12 flex flex-1 flex-col px-6 pb-5 text-center bg-gradient-to-b from-white/0 via-white to-white">
          <div className="self-center inline-flex items-center gap-1.5 rounded-full bg-blue-50/95 px-3.5 py-1.5 text-[12px] font-bold text-blue-600 shadow-sm border border-blue-100/80">
            <Wallet className="h-3.5 w-3.5" />
            Programa de Cashback
          </div>
          <h2 className="mt-4 text-[22px] font-black tracking-tight text-gray-950 leading-tight">
            Ganhe cashback a cada pedido!
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
            Faça seus pedidos, acumule <strong className="text-blue-600 font-black">saldo de cashback</strong> e use o valor disponível para economizar nas próximas compras.
          </p>
          <div className="mt-5 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-start gap-3">
            <div className="flex flex-col items-center gap-2">
              <div className="h-11 w-11 rounded-full bg-sky-50/95 flex items-center justify-center text-sky-500 shadow-[0_8px_24px_rgba(14,165,233,0.16)]">
                <Wallet className="h-[22px] w-[22px]" />
              </div>
              <span className="text-[11px] font-medium text-gray-500">Peça</span>
            </div>
            <div className="mt-[22px] h-px w-10 bg-gray-200" />
            <div className="flex flex-col items-center gap-2">
              <div className="h-11 w-11 rounded-full bg-blue-50/95 flex items-center justify-center text-blue-600 shadow-[0_8px_24px_rgba(37,99,235,0.16)]">
                <Percent className="h-[22px] w-[22px]" />
              </div>
              <span className="text-[11px] font-medium text-gray-500">Receba</span>
            </div>
            <div className="mt-[22px] h-px w-10 bg-gray-200" />
            <div className="flex flex-col items-center gap-2">
              <div className="h-11 w-11 rounded-full bg-emerald-50/95 flex items-center justify-center text-emerald-500 shadow-[0_8px_24px_rgba(16,185,129,0.16)]">
                <ArrowDownLeft className="h-[22px] w-[22px]" />
              </div>
              <span className="text-[11px] font-medium text-gray-500">Use</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="mt-auto w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.99] transition-transform flex items-center justify-center gap-2"
          >
            Continuar
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function CashbackLoginForm({
  phone,
  setPhone,
  password,
  setPassword,
  error,
  isLoading,
  onLogin,
  onGoToRegister,
}: {
  phone: string;
  setPhone: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  error: string;
  isLoading: boolean;
  onLogin: () => void;
  onGoToRegister: () => void;
}) {
  // Formatar telefone (aceita 10 ou 11 dígitos)
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Wallet className="h-8 w-8 text-blue-500 animate-wallet-jiggle" />
        </div>
        <h3 className="font-bold text-gray-900 text-lg">Acessar Carteira</h3>
        <p className="text-sm text-gray-500 mt-1">
          Entre com seu telefone para ver seu saldo de cashback
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Telefone
          </label>
          <input
            type="tel"
            value={formatPhone(phone)}
            onChange={e =>
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
            }
            placeholder="(00) 00000-0000"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            maxLength={15}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Senha (4 dígitos)
          </label>
          <input
            type="password"
            value={password}
            onChange={e =>
              setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="••••"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-[0.5em] text-gray-900"
            maxLength={4}
            autoComplete="new-password"
            name="cashback-password-login"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <button
        onClick={onLogin}
        disabled={isLoading || phone.length < 10 || password.length < 4}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors"
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Não tem conta?{" "}
        <button
          onClick={onGoToRegister}
          className="text-blue-600 font-semibold"
        >
          Cadastre-se
        </button>
      </p>
    </div>
  );
}

export function CashbackRegisterForm({
  phone,
  setPhone,
  password,
  setPassword,
  name,
  setName,
  error,
  isLoading,
  onRegister,
  onGoToLogin,
}: {
  phone: string;
  setPhone: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  error: string;
  isLoading: boolean;
  onRegister: () => void;
  onGoToLogin: () => void;
}) {
  // Formatar telefone (aceita 10 ou 11 dígitos)
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Wallet className="h-8 w-8 text-blue-500 animate-wallet-jiggle" />
        </div>
        <h3 className="font-bold text-gray-900 text-lg">Criar Conta</h3>
        <p className="text-sm text-gray-500 mt-1">
          Cadastre-se para começar a acumular cashback
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Nome (opcional)
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Seu nome"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Telefone
          </label>
          <input
            type="tel"
            value={formatPhone(phone)}
            onChange={e =>
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
            }
            placeholder="(00) 00000-0000"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            maxLength={15}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Senha (4 dígitos)
          </label>
          <input
            type="password"
            value={password}
            onChange={e =>
              setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="••••"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-[0.5em] text-gray-900"
            maxLength={4}
            autoComplete="new-password"
            name="cashback-password-register"
          />
          <p className="text-xs text-gray-500 mt-1">Use apenas números</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <button
        onClick={onRegister}
        disabled={isLoading || phone.length < 10 || password.length < 4}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors"
      >
        {isLoading ? "Cadastrando..." : "Cadastrar"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Já tem conta?{" "}
        <button onClick={onGoToLogin} className="text-blue-600 font-semibold">
          Entrar
        </button>
      </p>
    </div>
  );
}

export function CashbackWalletView({
  balance,
  transactions,
  isLoading,
  cashbackPercent,
  onLogout,
}: {
  balance:
    | { balance: string; totalEarned: string; totalUsed: string }
    | null
    | undefined;
  transactions: Array<{
    id: number;
    type: string;
    amount: string;
    orderNumber: string | null;
    description: string | null;
    balanceBefore: string;
    balanceAfter: string;
    createdAt: Date | string;
  }>;
  isLoading: boolean;
  cashbackPercent: number;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"balance" | "history">("balance");

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `R$ ${num.toFixed(2).replace(".", ",")}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Saldo Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white">
        <p className="text-blue-100 text-sm font-medium">Saldo disponível</p>
        <p className="text-3xl font-bold mt-1">
          {formatCurrency(balance?.balance || "0")}
        </p>
        <div className="flex gap-4 mt-3 text-sm">
          <div>
            <p className="text-blue-200 text-xs">Total ganho</p>
            <p className="font-semibold">
              {formatCurrency(balance?.totalEarned || "0")}
            </p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">Total usado</p>
            <p className="font-semibold">
              {formatCurrency(balance?.totalUsed || "0")}
            </p>
          </div>
        </div>
        {cashbackPercent > 0 && (
          <div className="mt-3 bg-white/20 rounded-lg px-3 py-1.5 inline-block">
            <p className="text-xs font-medium">
              Você ganha {cashbackPercent}% de cashback a cada pedido
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("balance")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors",
            activeTab === "balance"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          Resumo
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors",
            activeTab === "history"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          Histórico
        </button>
      </div>

      {activeTab === "balance" && (
        <div className="space-y-3">
          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              Como funciona
            </h4>
            <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">✓</span>A cada pedido
                concluído, você ganha {cashbackPercent}% de cashback
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">✓</span>O saldo pode ser
                usado como desconto em pedidos futuros
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">✓</span>
                Ao finalizar o pedido, marque a opção "Usar cashback"
              </li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {transactions.length > 0 ? (
            transactions.map(tx => (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    tx.type === "credit" ? "bg-green-100" : "bg-red-100"
                  )}
                >
                  {tx.type === "credit" ? (
                    <ArrowDownLeft className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {tx.description ||
                      (tx.type === "credit"
                        ? "Cashback recebido"
                        : "Cashback utilizado")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={cn(
                    "font-semibold text-sm shrink-0",
                    tx.type === "credit" ? "text-green-600" : "text-red-500"
                  )}
                >
                  {tx.type === "credit" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-6">
              Nenhuma movimentação ainda
            </p>
          )}
        </div>
      )}
    </div>
  );
}


