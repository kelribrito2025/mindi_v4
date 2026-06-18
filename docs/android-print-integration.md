# Integração com ESC POS Wifi Print Service

## App Android
- **Nome:** ESC POS Wifi Print Service
- **Google Play:** https://play.google.com/store/apps/details?id=com.loopedlabs.netprintservice
- **Documentação:** https://loopedlabs.com/esc-pos-network-print-service/

## Como Funciona

O app responde a links especiais no formato `print://` que podem ser chamados diretamente do navegador Android.

### Formato do Link de Impressão

```html
<a href="print://escpos.org/escpos/net/print?srcTp=uri&srcObj=html&numCopies=1&src='URL_DO_RECIBO'">
  Imprimir
</a>
```

### Parâmetros:
- `srcTp=uri` - Tipo de fonte (uri)
- `srcObj=html` - Tipo de objeto (html, pdf, image)
- `numCopies=1` - Número de cópias
- `src='URL'` - URL do conteúdo a ser impresso

### HTML Dinâmico

```javascript
function printReceipt(htmlContent) {
  let printUrl = "print://escpos.org/escpos/net/print?srcTp=uri&srcObj=html&src='data:text/html,";
  printUrl += encodeURIComponent(htmlContent);
  printUrl += "'";
  window.location.href = printUrl;
}
```

## Arquitetura da Solução

### Fluxo:
1. Pedido é criado no sistema
2. Sistema gera página HTML do recibo (URL pública)
3. Usuário clica em "Imprimir" no app/painel
4. Sistema abre link `print://` com URL do recibo
5. App ESC POS captura e envia para impressora

### Endpoints Necessários:
1. `GET /api/print/receipt/:orderId` - Retorna HTML do recibo formatado para impressão térmica
2. Botão de impressão no painel que gera o link `print://`

## Configuração no App Android

1. Instalar "ESC POS Wifi Print Service" da Google Play
2. Abrir o app e configurar:
   - IP da impressora: 192.168.68.100
   - Porta: 9100
   - Tipo de impressora: 58mm ou 80mm
3. Testar conexão no app
4. Acessar o painel do cardápio pelo navegador Android
5. Clicar em "Imprimir" nos pedidos

## Vantagens
- Não precisa desenvolver app Android
- Impressão funciona offline (rede local)
- Configuração simples
- Suporta múltiplas impressoras
