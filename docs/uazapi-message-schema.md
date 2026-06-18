# UAZAPI Message Schema

Representa uma mensagem trocada no sistema

## Properties

- `id` string - ID único interno da mensagem (formato r + 7 caracteres hex aleatórios)
- `messageid` string - ID original da mensagem no provedor
- `chatid` string - ID da conversa relacionada
- `sender` string - ID do remetente da mensagem
- `senderName` string - Nome exibido do remetente
- `isGroup` boolean - Indica se é uma mensagem de grupo
- `fromMe` boolean - Indica se a mensagem foi enviada pelo usuário
- `messageType` string - Tipo de conteúdo da mensagem
- `source` string - Plataforma de origem da mensagem
- `messageTimestamp` integer - Timestamp original da mensagem em milissegundos
- `status` string - Status do ciclo de vida da mensagem
- `text` string - Texto original da mensagem
- `quoted` string - ID da mensagem citada/respondida
- `edited` string - Histórico de edições da mensagem
- `reaction` string - ID da mensagem reagida
- `vote` string - Dados de votação de enquete e listas
- `convertOptions` string - Conversão de opções da mensagem, lista, enquete e botões
- **`buttonOrListid` string - ID do botão ou item de lista selecionado** (IMPORTANTE!)
- `owner` string - Dono da mensagem
- `error` string - Mensagem de erro caso o envio tenha falhado
- `content` object - Conteúdo bruto da mensagem (JSON serializado ou texto)
- `wasSentByApi` boolean - Indica se a mensagem foi enviada via API

## Nota Importante

O campo `buttonOrListid` contém o ID do botão clicado pelo usuário!
No nosso caso, o ID seria algo como: `confirm_order_#P441` ou `cancel_order_#P441`
