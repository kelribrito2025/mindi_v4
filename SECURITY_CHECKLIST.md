# Checklist de Correções de Segurança

Baseado na auditoria do PR #2. Itens organizados por prioridade e complexidade.

---

## Correções Já Aplicadas

| # | Item | Status | Data |
|---|------|--------|------|
| P01 | Remover credenciais de banco hardcoded em `check-order-240.mjs` | Feito | 20/03/2026 |
| P02 | Remover credenciais admin hardcoded em `seedAdmin.mjs` | Feito | 20/03/2026 |
| P03 | Adicionar `.manus/db/` ao `.gitignore` | Feito | 20/03/2026 |
| P30 | Criar referência de variáveis de ambiente (`ENV_REFERENCE.md`) | Feito | 20/03/2026 |

---

## Correções Pendentes — Segurança Crítica

| # | Item | Complexidade | Risco se não corrigir |
|---|------|-------------|----------------------|
| P04 | ~~Adicionar rate limiting ao webhook iFood~~ | Feito | 20/03/2026 |
| P05 | ~~Webhook Stripe retornar 401 em assinatura inválida (hoje retorna 200 OK)~~ | Feito | 20/03/2026 |

---

## Correções Pendentes — Alta Severidade

| # | Item | Complexidade | Risco se não corrigir |
|---|------|-------------|----------------------|
| P06 | ~~JWT admin com secret independente via `ADMIN_JWT_SECRET`~~ | Feito | 20/03/2026 |
| P07 | ~~Rate limiter para consulta de pedidos por telefone (20 req/15min)~~ | Feito | 20/03/2026 |
| P11 | ~~Senha mínima mais forte: mínimo 8 caracteres~~ | Feito | 20/03/2026 |
| P13 | ~~Header HSTS adicionado ao Helmet~~ | Feito | 20/03/2026 |
| P14 | ~~Bloquear path traversal (`../`) no upload S3~~ | Feito | 20/03/2026 |
| P16 | ~~Rate limiter para validação de cupons (15 req/15min)~~ | Feito | 20/03/2026 |

---

## Correções Pendentes — Melhorias (Não Urgentes)

| # | Item | Complexidade | Benefício |
|---|------|-------------|-----------|
| P25 | ~~Substituir ~55 console.logs sensíveis por logger condicional~~ | Feito | 20/03/2026 |
| P29 | ~~Mover 32 scripts da raiz para `/scripts`~~ | Feito | 20/03/2026 |

---

## Refatorações Arquiteturais (Futuro)

Estas mudanças são benéficas mas arriscadas. Devem ser feitas com cuidado e em momentos de baixa atividade.

| # | Item | Complexidade | Benefício |
|---|------|-------------|-----------|
| P21 | Dividir `PublicMenu.tsx` (9.310 linhas) em sub-componentes | Alta | Manutenibilidade, performance |
| P23 | Dividir `db.ts` (13.520 linhas) em módulos por domínio | Alta | Manutenibilidade, organização |
| P26 | ~~Dividir `routers.ts` (7.328 linhas) em 37 routers separados~~ | Feito | 20/03/2026 |

---

## Ação Pós-Correção (Importante)

| Item | Descrição |
|------|-----------|
| Rotacionar credenciais TiDB | Trocar senha do banco de dados, pois a antiga foi exposta no código |
| Rotacionar senha admin | Trocar senha do admin, pois `290819943` estava hardcoded no `seedAdmin.mjs` |

---

**Total:** 15 feitos / 0 pendentes de segurança / 0 melhorias pendentes / 2 refatorações futuras
