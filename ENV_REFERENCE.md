# Variáveis de Ambiente - Referência

Este documento lista todas as variáveis de ambiente necessárias para rodar o projeto.
**Nunca commite valores reais no repositório.**

---

## ⚠️ Ação Necessária no Deploy — WhatsApp Meta Cloud API

Esta versão introduz a integração com a API Oficial do WhatsApp (Meta Cloud API).
Para ativar, o servidor precisa das seguintes variáveis de ambiente adicionadas à configuração de produção:

| Variável | Valor Esperado |
|---|---|
| `META_APP_ID` | ID numérico do app Mindi2 (Meta Developer Portal) |
| `META_APP_SECRET` | App Secret do app Mindi2 |
| `META_CONFIG_ID` | ID da configuração Embedded Signup (Facebook Login for Business) |
| `WHATSAPP_VERIFY_TOKEN` | String aleatória segura — qualquer valor (ex: `mindi_wh_prod_2025`) |

Adicionalmente, executar o seguinte SQL no banco de produção (uma única vez):

```sql
ALTER TABLE `whatsappConfig`
  ADD COLUMN `provider` ENUM('uazapi','official') NOT NULL DEFAULT 'uazapi' AFTER `webhookSecret`,
  ADD COLUMN `wabaId` VARCHAR(100) AFTER `provider`,
  ADD COLUMN `phoneNumberId` VARCHAR(100) AFTER `wabaId`,
  ADD COLUMN `accessToken` TEXT AFTER `phoneNumberId`,
  ADD COLUMN `businessId` VARCHAR(100) AFTER `accessToken`,
  ADD COLUMN `metaWebhookSecret` VARCHAR(128) AFTER `businessId`;
```

> Todos os estabelecimentos existentes mantêm `provider = 'uazapi'` por padrão. Nenhum dado existente é alterado.

---

## Database
| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string MySQL/TiDB |

## Auth / Session
| Variável | Descrição |
|---|---|
| `JWT_SECRET` | Secret para assinar cookies de sessão |
| `OAUTH_SERVER_URL` | URL base do OAuth Manus |
| `OWNER_OPEN_ID` | OpenID do dono da plataforma |
| `OWNER_NAME` | Nome do dono |

## Manus App
| Variável | Descrição |
|---|---|
| `VITE_APP_ID` | ID da aplicação Manus |
| `VITE_APP_TITLE` | Título da aplicação |
| `VITE_APP_LOGO` | URL do logo |
| `VITE_OAUTH_PORTAL_URL` | URL do portal de login Manus |

## Manus Built-in APIs
| Variável | Descrição |
|---|---|
| `BUILT_IN_FORGE_API_URL` | URL das APIs internas Manus |
| `BUILT_IN_FORGE_API_KEY` | API key do servidor |
| `VITE_FRONTEND_FORGE_API_URL` | URL das APIs para o frontend |
| `VITE_FRONTEND_FORGE_API_KEY` | API key do frontend |

## S3 Storage (Mindi)
| Variável | Descrição |
|---|---|
| `MINDI_S3_BUCKET` | Nome do bucket S3 |
| `MINDI_S3_REGION` | Região do bucket |
| `MINDI_S3_ACCESS_KEY` | Access key S3 |
| `MINDI_S3_SECRET_KEY` | Secret key S3 |

## Stripe (Pagamentos)
| Variável | Descrição |
|---|---|
| `STRIPE_SECRET_KEY` | Chave secreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret do webhook Stripe |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Chave pública Stripe |

## iFood Integration
| Variável | Descrição |
|---|---|
| `IFOOD_CLIENT_ID` | Client ID iFood |
| `IFOOD_CLIENT_SECRET` | Client Secret iFood |

## WhatsApp (UAZAPI)
| Variável | Descrição |
|---|---|
| `UAZAPI_BASE_URL` | URL da instância UAZAPI |
| `UAZAPI_ADMIN_TOKEN` | Token admin UAZAPI |

## WhatsApp (Meta Cloud API Oficial)
| Variável | Descrição | Onde obter |
|---|---|---|
| `META_APP_ID` | ID do app Mindi2 no Bigteck Business Portfolio | developers.facebook.com → Mindi2 → App Settings → Basic |
| `META_APP_SECRET` | Secret do app Mindi2 | developers.facebook.com → Mindi2 → App Settings → Basic → Show |
| `META_CONFIG_ID` | ID da configuração Embedded Signup (60-day token) | Mindi2 → Facebook Login for Business → Configurations |
| `WHATSAPP_VERIFY_TOKEN` | Token livre para verificação do webhook | Qualquer string aleatória segura — defina você mesmo |

> **Nota:** As credenciais anteriores do app Mindi (Assini BM) estão aposentadas.
> O app ativo agora é o **Mindi2** dentro do **Bigteck Business Portfolio** (Tech Provider verificado).

## SMS (DisparoPro)
| Variável | Descrição |
|---|---|
| `DISPAROPRO_PARCEIRO_ID` | ID do parceiro DisparoPro |
| `DISPAROPRO_TOKEN` | Token DisparoPro |

## Analytics
| Variável | Descrição |
|---|---|
| `VITE_ANALYTICS_ENDPOINT` | Endpoint de analytics |
| `VITE_ANALYTICS_WEBSITE_ID` | ID do website analytics |

## Impressora (opcional)
| Variável | Descrição |
|---|---|
| `PRINTER_ALLOWED_ORIGINS` | Origens permitidas para impressora (separadas por vírgula) |
