# Notas da Documentação: Integração de Impressora Térmica

## 1. Objetivo
Implementar impressão automática de novos pedidos no admin do restaurante usando impressora térmica GoldenSky GST80E com conexão de rede (RJ45).

## 2. Componentes Analisados

### 2.1. Impressora: GoldenSky Mini Printer GST80E
- **Conectividade**: Ethernet (RJ45) e USB
- **Protocolo**: ESC/POS (Epson Standard Code for POS)
- **Drivers e SDK**: Fornece drivers para Windows/Linux e um SDK
- **Porta padrão**: 9100

### 2.2. Sistema SaaS (cardapio-admin)
- Stack: React, Node.js (Express e tRPC), MySQL
- **Sistema de notificações em tempo real via SSE** já existente
- Arquivos relevantes: `server/notifications-sse.ts` e `server/notifications-manager.ts`
- Eventos SSE existentes: `pix_payment_confirmed`, `sms_received`

## 3. Arquitetura Recomendada

### 3.1. Impressão Automática via Print Server Local
A solução mais robusta é criar um **Print Server Local** - uma aplicação que roda no computador do estabelecimento, fazendo a ponte entre o SaaS na nuvem e a impressora na rede local.

### Fluxo de Comunicação:
1. Cliente faz pedido no cardápio público
2. Pedido é salvo no banco de dados
3. Backend dispara evento SSE `new_order_to_print` para o estabelecimento
4. Print Server Local (rodando no computador do restaurante) recebe o evento
5. Print Server envia comandos ESC/POS para a impressora via TCP na porta 9100

### Componentes a Desenvolver:

#### 1. Modificações no Backend do SaaS:
- **Gerenciamento de Impressoras**: Interface no painel admin + tabela `printers` no banco
- **Extensão do Sistema de Notificação**: Novo evento SSE `new_order_to_print`

#### 2. Print Server Local (Nova Aplicação):
- **Tecnologia**: Python com biblioteca `python-escpos`
- **Funcionalidades**: Serviço leve rodando em segundo plano, conecta via SSE ao SaaS, envia comandos para impressora

### 3.2. Alternativa: Impressão Manual via Browser
- Botão "Imprimir" na página de detalhes do pedido usando `window.print()`
- Folha de estilos CSS `@media print` para formatar cupom de 80mm
- **Limitações**: Não é automática, controle limitado de comandos ESC/POS

## 4. Conclusão
A integração é **altamente viável**. A abordagem recomendada é o **Print Server Local** que se comunica via SSE.

## 5. Implementação no Cardápio Admin

### Fase 1: Backend
1. Criar tabela `printers` no schema
2. Criar rotas tRPC para CRUD de impressoras
3. Adicionar evento SSE `new_order_to_print` quando pedido for confirmado
4. Criar endpoint para configuração de impressão

### Fase 2: Frontend Admin
1. Página de configuração de impressoras
2. Toggle para ativar/desativar impressão automática
3. Botão de impressão manual nos pedidos

### Fase 3: Print Server Local (separado)
1. Aplicação Python/Electron que roda no computador do restaurante
2. Conecta via SSE e imprime automaticamente
