# UAZAPI - Envio de Mensagens com Botões Interativos

## Endpoint: POST /send/menu

Este endpoint oferece uma interface unificada para envio de quatro tipos principais de mensagens interativas:
- Botões: Para ações rápidas e diretas
- Carrosel de Botões: Para uma lista horizontal de botões com imagens
- Listas: Para menus organizados em seções
- Enquetes: Para coleta de opiniões e votações

## Estrutura Base do Payload

```json
{
  "number": "5511999999999",
  "type": "button|list|poll|carousel",
  "text": "Texto principal da mensagem",
  "choices": ["opções baseadas no tipo escolhido"],
  "footerText": "Texto do rodapé (opcional para botões e listas)",
  "listButton": "Texto do botão (para listas)",
  "selectableCount": "Número de opções selecionáveis (apenas para enquetes)"
}
```

## 1. Botões (type: "button")

Cria botões interativos com diferentes funcionalidades de ação.

### Formatos de Botões

Cada botão pode ser configurado usando `|` (pipe) ou `\n` (quebra de linha) como separadores:

- **Botão de Resposta**: `"texto|id"` ou `"texto\nid"` ou `"texto"` (ID será igual ao texto)
- **Botão de Cópia**: `"texto|copy:código"` ou `"texto\ncopy:código"`
- **Botão de Chamada**: `"texto|call:+5511999999999"` ou `"texto\ncall:+5511999999999"`
- **Botão de URL**: `"texto|https://exemplo.com"` ou `"texto|url:https://exemplo.com"`

### Exemplo Completo

```json
{
  "number": "5511999999999",
  "type": "button",
  "text": "Como podemos ajudar?",
  "choices": [
    "Suporte Técnico|suporte",
    "Fazer Pedido|pedido",
    "Nosso Site|https://exemplo.com",
    "Falar Conosco|call:+5511999999999"
  ],
  "footerText": "Escolha uma das opções abaixo"
}
```

## Importante para o Fluxo de Confirmação de Pedido

Para o fluxo de confirmação de pedido, usaremos **botões de resposta** simples:

```json
{
  "number": "5511999999999",
  "type": "button",
  "text": "Olá {{customerName}}! 👋🏻 {{greeting}}, Tudo bem?\n\nSeu pedido {{orderNumber}} foi recebido!\n\n{{itensPedido}}\n\n💰 Total: R$ {{total}}\n\n🔔 Você será notificado por aqui em cada atualização.",
  "choices": [
    "✅ Ok, pode fazer o pedido|confirm_order",
    "❌ Não quero mais|cancel_order"
  ],
  "footerText": "Clique em uma opção para confirmar"
}
```

Quando o cliente clicar em um botão, receberemos um webhook com a resposta contendo o ID do botão clicado (confirm_order ou cancel_order).

## Webhook de Resposta

Quando o cliente clica em um botão, o webhook recebido terá a estrutura:

```json
{
  "event": "message",
  "message": {
    "type": "button_response",
    "buttonId": "confirm_order",
    "buttonText": "✅ Ok, pode fazer o pedido"
  }
}
```
