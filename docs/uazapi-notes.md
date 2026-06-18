# UAZAPI - Documentação de Integração

## Visão Geral
- API para gerenciamento de instâncias do WhatsApp
- Recomendado usar WhatsApp Business
- Autenticação via header 'token' (token da instância)
- Endpoints administrativos requerem header 'admintoken'

## Estados da Instância
- `disconnected`: Desconectado do WhatsApp
- `connecting`: Em processo de conexão
- `connected`: Conectado e autenticado com sucesso

## Endpoints Necessários

### 1. POST /instance/connect
Inicia o processo de conexão de uma instância ao WhatsApp.
- Requer token de autenticação da instância
- Se não passar campo `phone`: gera QR code
- Se passar campo `phone`: gera código de pareamento
- Timeout: 2 minutos para QRCode, 5 minutos para código de pareamento

**Request:**
```json
{
  "phone": "5511999999999"  // opcional
}
```

**URL:** https://{subdomain}.uazapi.com/instance/connect

### 2. GET /instance/status
Verificar status da instância (connected, connecting, disconnected)

### 3. POST /instance/disconnect
Desconectar instância

## Endpoints de Envio de Mensagem

### POST /send/text
Envia uma mensagem de texto para um contato ou grupo.

**Request:**
```json
{
  "number": "5511999999999",
  "text": "Olá! Como posso ajudar?"
}
```

**Parâmetros:**
- `number` (required): ID do chat (número internacional, ex: 5511999999999)
- `text` (required): Texto da mensagem
- `delay`: Atraso em ms antes do envio (mostra 'Digitando...')
- `readchat`: Marca conversa como lida após envio

**URL:** https://{subdomain}.uazapi.com/send/text

## Fluxo de Integração

1. Usuário configura subdomain e token da UAZAPI
2. Sistema chama POST /instance/connect (sem phone para gerar QR code)
3. Sistema exibe QR code para usuário escanear
4. Sistema faz polling em GET /instance/status para verificar conexão
5. Quando status = 'connected', WhatsApp está pronto
6. Para enviar mensagem: POST /send/text com number e text

## Configuração Necessária

- UAZAPI_SUBDOMAIN: Subdomínio da instância (ex: 'free')
- UAZAPI_TOKEN: Token de autenticação da instância
