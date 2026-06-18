/**
 * Safe JSON fetch helper - previne o erro "string did not match the expected pattern" do Safari.
 *
 * Causa raiz: Safari lança esse SyntaxError genérico quando response.json() recebe
 * conteúdo não-JSON (ex: HTML de página de erro 502, redirect, etc.).
 * Chrome dá uma mensagem mais clara como "unexpected token < in JSON at position 0".
 *
 * Solução: verificar Content-Type antes de chamar .json() e tratar o caso de forma explícita.
 */

/**
 * Verifica se a resposta contém JSON válido baseado no Content-Type
 */
function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json");
}

/**
 * Faz parse seguro de JSON de uma Response.
 * Lança erro descritivo em vez do genérico do Safari.
 */
export async function safeJsonParse<T = unknown>(response: Response): Promise<T> {
  if (!isJsonResponse(response)) {
    const text = await response.text();
    throw new Error(
      `Resposta inesperada do servidor (${response.status}). ` +
      `Esperado JSON, recebido: ${text.substring(0, 100)}`
    );
  }
  try {
    return await response.json();
  } catch (err) {
    // Fallback: tentar ler como texto e fazer parse manual
    // Isso acontece raramente, mas cobre o caso de Content-Type correto mas body inválido
    const text = await response.clone().text().catch(() => "[unreadable]");
    throw new Error(
      `Erro ao processar resposta JSON (${response.status}): ${text.substring(0, 100)}`
    );
  }
}

/**
 * Fetch wrapper que faz parse JSON seguro.
 * Drop-in replacement para `fetch(...).then(res => res.json())`
 */
export async function safeFetch<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);
  return safeJsonParse<T>(response);
}
