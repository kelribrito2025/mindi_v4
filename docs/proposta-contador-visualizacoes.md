# Proposta de Implementação: Contador de Visualizações do Cardápio

**Documento de Apresentação**  
**Data:** 01 de Fevereiro de 2026  
**Autor:** Manus AI

---

## 1. Introdução

Este documento apresenta a proposta técnica para implementação de um contador de visualizações em tempo real no painel administrativo do restaurante. A funcionalidade permitirá que o gestor visualize quantas pessoas estão acessando o cardápio digital no momento, fornecendo insights valiosos sobre o fluxo de clientes.

---

## 2. Objetivo

Exibir no Dashboard do admin do restaurante a quantidade de pessoas que estão visualizando o cardápio no momento, utilizando uma abordagem simples e eficiente que não sobrecarrega o sistema.

---

## 3. Requisitos Funcionais

| Requisito | Descrição |
|-----------|-----------|
| **RF01** | Contar sessões únicas que acessaram o cardápio nos últimos 3 minutos |
| **RF02** | Não utilizar WebSocket para a contagem |
| **RF03** | Atualizar o número apenas quando a página do admin for carregada |
| **RF04** | Reaproveitar ou criar registros simples de sessão |

---

## 4. Solução Técnica Proposta

### 4.1 Arquitetura

A solução utiliza uma abordagem baseada em **heartbeat passivo**, onde cada sessão do cardápio público registra sua presença no banco de dados. O admin consulta a contagem de sessões ativas ao carregar a página.

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Cardápio Público  │────▶│   Banco de Dados    │◀────│   Admin Dashboard   │
│   (Cliente Final)   │     │   (menu_sessions)   │     │   (Restaurante)     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
        │                           │                           │
        │  1. Registra sessão       │                           │
        │  2. Atualiza timestamp    │                           │
        │                           │  3. Conta sessões ativas  │
        │                           │     (últimos 3 min)       │
```

### 4.2 Estrutura de Dados

Nova tabela `menu_sessions`:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT | Chave primária auto-incremento |
| `session_id` | VARCHAR(64) | Identificador único da sessão do navegador |
| `establishment_id` | INT | ID do estabelecimento/restaurante |
| `updated_at` | DATETIME | Timestamp da última atividade |

**Índices recomendados:**
- `idx_establishment_updated` em (`establishment_id`, `updated_at`) para consultas rápidas

### 4.3 Fluxo de Funcionamento

**No Cardápio Público (Cliente Final):**

1. Ao carregar o cardápio, o sistema verifica se existe um `session_id` no localStorage
2. Se não existir, gera um UUID único e armazena
3. Envia uma requisição para o backend registrando/atualizando a sessão
4. Opcionalmente, atualiza o timestamp a cada navegação dentro do cardápio

**No Admin (Dashboard do Restaurante):**

1. Ao carregar o Dashboard, faz uma consulta para contar sessões ativas
2. A query conta registros com `updated_at` >= (agora - 3 minutos)
3. Exibe o número no card do Dashboard
4. Não há polling - atualiza apenas no refresh da página

---

## 5. Implementação Detalhada

### 5.1 Schema do Banco de Dados

```typescript
// drizzle/schema.ts
export const menuSessions = mysqlTable('menu_sessions', {
  id: int('id').primaryKey().autoincrement(),
  sessionId: varchar('session_id', { length: 64 }).notNull(),
  establishmentId: int('establishment_id').notNull(),
  updatedAt: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  establishmentUpdatedIdx: index('idx_establishment_updated')
    .on(table.establishmentId, table.updatedAt),
  sessionEstablishmentIdx: uniqueIndex('idx_session_establishment')
    .on(table.sessionId, table.establishmentId),
}));
```

### 5.2 Procedures do Backend

```typescript
// server/routers.ts

// Procedure pública para registrar sessão do cardápio
registerMenuSession: publicProcedure
  .input(z.object({
    sessionId: z.string(),
    establishmentId: z.number(),
  }))
  .mutation(async ({ input }) => {
    await db.insert(menuSessions)
      .values({
        sessionId: input.sessionId,
        establishmentId: input.establishmentId,
        updatedAt: new Date(),
      })
      .onDuplicateKeyUpdate({
        set: { updatedAt: new Date() },
      });
    return { success: true };
  }),

// Procedure protegida para contar visualizações ativas
getActiveViewers: protectedProcedure
  .query(async ({ ctx }) => {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    const result = await db
      .select({ count: sql<number>`COUNT(DISTINCT session_id)` })
      .from(menuSessions)
      .where(and(
        eq(menuSessions.establishmentId, ctx.user.establishmentId),
        gte(menuSessions.updatedAt, threeMinutesAgo)
      ));
    return { activeViewers: result[0]?.count || 0 };
  }),
```

### 5.3 Frontend - Cardápio Público

```typescript
// client/src/pages/PublicMenu.tsx

// Hook para registrar sessão
const useMenuSession = (establishmentId: number) => {
  const registerSession = trpc.registerMenuSession.useMutation();
  
  useEffect(() => {
    // Gera ou recupera session_id do localStorage
    let sessionId = localStorage.getItem('menu_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('menu_session_id', sessionId);
    }
    
    // Registra a sessão
    registerSession.mutate({ sessionId, establishmentId });
  }, [establishmentId]);
};
```

### 5.4 Frontend - Dashboard Admin

```typescript
// client/src/pages/Dashboard.tsx

// Exibição do contador
const { data: viewersData } = trpc.getActiveViewers.useQuery();

// No JSX, adicionar card:
<StatCard
  title="VISUALIZANDO AGORA"
  value={viewersData?.activeViewers || 0}
  icon={<Eye className="h-5 w-5" />}
  color="purple"
/>
```

---

## 6. Vantagens da Solução

| Vantagem | Descrição |
|----------|-----------|
| **Simplicidade** | Não requer WebSocket ou infraestrutura adicional |
| **Baixo custo** | Utiliza apenas queries simples no banco existente |
| **Escalabilidade** | A tabela pode ser limpa periodicamente (registros > 1 hora) |
| **Precisão** | Janela de 3 minutos oferece boa aproximação de "tempo real" |
| **Performance** | Índices otimizados garantem consultas rápidas |

---

## 7. Considerações de Performance

A solução foi projetada para ter impacto mínimo no sistema:

1. **Escrita (INSERT/UPDATE):** Operação única por sessão, com ON DUPLICATE KEY UPDATE para evitar duplicatas
2. **Leitura (COUNT):** Query indexada que conta apenas registros recentes
3. **Limpeza:** Recomenda-se criar um job diário para remover registros com mais de 24 horas

**Query de limpeza sugerida:**
```sql
DELETE FROM menu_sessions WHERE updated_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

---

## 8. Cronograma de Implementação

| Etapa | Descrição | Tempo Estimado |
|-------|-----------|----------------|
| 1 | Criar tabela no schema | 5 minutos |
| 2 | Executar migração (`pnpm db:push`) | 2 minutos |
| 3 | Implementar procedures no backend | 15 minutos |
| 4 | Implementar hook no cardápio público | 10 minutos |
| 5 | Adicionar card no Dashboard | 10 minutos |
| 6 | Testes e ajustes | 10 minutos |
| **Total** | | **~50 minutos** |

---

## 9. Mockup Visual

O contador será exibido como um novo card no Dashboard, seguindo o padrão visual existente:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Dashboard                                                          │
│  Visão geral do seu estabelecimento                                │
├─────────────┬─────────────┬─────────────┬─────────────┬────────────┤
│ PEDIDOS     │ FATURAMENTO │ TICKET      │ ITENS EM    │ VISUALI-   │
│ HOJE        │ HOJE        │ MÉDIO       │ FALTA       │ ZANDO      │
│             │             │             │             │ AGORA      │
│ ● 12        │ ● R$ 856,40 │ ● R$ 71,37  │ ● 3         │ 👁 8       │
│ 📦          │ 💰          │ 📈          │ ⚠️          │            │
└─────────────┴─────────────┴─────────────┴─────────────┴────────────┘
```

---

## 10. Conclusão

A implementação do contador de visualizações do cardápio é uma funcionalidade de alto valor agregado com baixo custo de desenvolvimento. A solução proposta é simples, eficiente e não requer infraestrutura adicional, utilizando apenas os recursos já disponíveis no sistema.

**Benefícios para o restaurante:**
- Visibilidade do interesse dos clientes em tempo real
- Auxílio na tomada de decisões (ex: promoções relâmpago)
- Indicador de performance do cardápio digital

---

## 11. Próximos Passos

Após aprovação desta proposta:

1. ✅ Confirmar implementação
2. 🔄 Desenvolver a funcionalidade (~50 minutos)
3. 🧪 Testar em ambiente de desenvolvimento
4. 🚀 Deploy para produção

---

**Documento preparado por Manus AI**  
**Para: Equipe Mindi**
