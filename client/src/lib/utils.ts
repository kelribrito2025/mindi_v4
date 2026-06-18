import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Capitaliza a primeira letra de uma string
 * @param value - String a ser capitalizada
 * @returns String com a primeira letra maiúscula
 */
export function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Handler para capitalizar automaticamente a primeira letra em inputs
 * @param setter - Função setState para atualizar o valor
 * @returns Handler de onChange para o input
 */
export function handleCapitalizeInput(setter: (value: string) => void) {
  return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setter(capitalizeFirst(value));
  };
}

/**
 * Formata um valor numérico como moeda brasileira (R$)
 * @param value - Valor numérico ou string
 * @returns String formatada como moeda (ex: "R$ 10,50")
 */
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'R$ 0,00';
  return numValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Formata um valor de input como moeda brasileira (apenas números)
 * Remove caracteres não numéricos e formata como valor monetário
 * @param value - Valor do input
 * @returns Valor formatado para exibição (ex: "10,50")
 */
export function formatPriceInput(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Converte para centavos e depois para reais
  const cents = parseInt(numbers || '0', 10);
  const reais = cents / 100;
  
  // Formata com 2 casas decimais
  return reais.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte valor formatado de moeda para número decimal
 * Aceita formato brasileiro (vírgula como decimal: "10,50" ou "1.234,56")
 * e formato americano (ponto como decimal: "10.50" ou "1234.56")
 * @param value - Valor formatado em formato brasileiro ou americano
 * @returns Número decimal como string (ex: "10.5", "1234.56")
 */
export function parsePriceInput(value: string): string {
  if (!value) return '0';
  
  // Detectar formato: se tem vírgula, é formato brasileiro
  if (value.includes(',')) {
    // Formato brasileiro: remove pontos de milhar e substitui vírgula por ponto
    const normalized = value.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(normalized);
    return isNaN(num) ? '0' : num.toString();
  } else {
    // Formato americano ou número puro: ponto é separador decimal
    const num = parseFloat(value);
    return isNaN(num) ? '0' : num.toString();
  }
}
