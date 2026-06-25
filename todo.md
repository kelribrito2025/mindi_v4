# Cardápio Admin - TODO

## Layout e Navegação
- [x] Sidebar fixa com navegação (Dashboard, Catálogo, Pedidos, Estoque, Promoções/Cupons, Clientes, Relatórios, Configurações)
- [x] Topbar com busca global, toggle loja aberta/fechada, notificações e perfil
- [x] Layout responsivo (desktop, tablet, mobile)

## Dashboard
- [x] Cards KPI (pedidos hoje, faturamento, ticket médio, itens em falta)
- [x] Gráfico de pedidos/faturamento últimos 7 dias
- [x] Lista de pedidos recentes com status e tempo
- [x] Skeleton loading nos cards

## Catálogo de Produtos
- [x] Lista de produtos em tabela estilo iFood
- [x] Filtros (busca por nome, categoria, status, disponibilidade)
- [x] Ordenação (mais vendidos, nome, preço)
- [x] Ações (editar, duplicar, pausar, arquivar, excluir)
- [x] Toggle ativo/inativo direto na linha
- [x] Badges de status e estoque
- [x] Estados vazios com CTA
- [ ] Paginação

## Criar/Editar Produto
- [x] Formulário com nome, descrição, categoria, preço
- [x] Upload de fotos (via URL)
- [x] Disponibilidade (ativo/pausado)
- [x] Controle de estoque
- [x] Complementos/Adicionais com limites (mínimo/máximo)
- [x] Tempo de preparo
- [x] Preview do card do produto
- [x] Validação por campo
- [x] Botão Salvar sticky

## Categorias
- [x] Adicionar categoria
- [x] Reordenar categorias (drag and drop)
- [ ] Editar/Excluir categoria

## Gestão de Pedidos
- [x] Tabs por status (Novos, Em preparo, Prontos, Finalizados, Cancelados)
- [x] Cards de pedido com tempo, status, itens, valor
- [x] Ações (Aceitar, Iniciar preparo, Concluir, Cancelar)
- [x] Modal de detalhes do pedido
- [ ] Atualização em tempo real (WebSocket)

## Configurações do Estabelecimento
- [x] Nome do restaurante
- [x] Upload de logotipo (via URL)
- [x] Upload de imagem de capa (via URL)
- [x] Endereço completo (rua, número, complemento, bairro, cidade, estado)

## Configurações de Atendimento
- [x] Link do cardápio personalizado
- [x] WhatsApp para receber pedidos
- [x] Formas de pagamento (Dinheiro, Cartão, Pix, Boleto)
- [x] Tipos de entrega (Entrega, Retirada)

## Funcionalidades Futuras (Placeholder)
- [ ] Estoque (página dedicada)
- [ ] Promoções/Cupons
- [ ] Clientes
- [ ] Relatórios


## Atualização de UI/Estilo (Apenas Visual)
- [x] Atualizar tema global (cores, tipografia, variáveis CSS)
- [x] Redesenhar componentes compartilhados (cards, badges, botões)
- [x] Modernizar Sidebar com visual mais limpo
- [x] Atualizar Topbar com hierarquia visual melhor
- [x] Aplicar novo estilo ao Dashboard
- [x] Aplicar novo estilo ao Catálogo
- [x] Aplicar novo estilo aos Pedidos
- [x] Aplicar novo estilo às Configurações
- [x] Aplicar novo estilo ao ProductForm


## Bugs
- [x] Corrigir erro "establishment.get data is undefined" na página /catalogo
- [x] Renomear "Catálogo" para "Cardápio" no menu lateral
- [x] Corrigir erro 404 ao clicar em editar produto
- [x] Implementar upload de imagens real (selecionar arquivos do computador em vez de URL)
- [x] Corrigir badge "Sem estoque" mostrando incorretamente quando produto tem estoque
- [x] Alterar sidebar para cor escura com estilo degradê
- [x] Ajustar sidebar para tom mais claro puxado para vermelho com degradê
- [x] Ajustar sidebar para vermelho mais vibrante e adicionar efeito de sombra
- [x] Ajustar sidebar para tom cinza claro com degradê
- [x] Redesenhar sidebar com visual elegante e cinza muito claro (quase branco)
- [x] Adicionar botão toggle minimizar/maximizar na sidebar
- [x] Implementar estado minimizado (apenas ícones, sem textos)
- [x] Adicionar tooltips nos itens quando sidebar minimizada
- [x] Persistir estado no localStorage
- [x] Manter comportamento responsivo (drawer no mobile)
- [x] Mover botão minimizar/maximizar para a mesma linha do título Cardápio
- [x] Trocar ícone do botão toggle para algo mais adequado
## Drag & Drop no Cardápio

- [x] Adicionar campo sortOrder no schema de produtos e categorias
- [x] Criar endpoints de reordenação no backend
- [x] Implementar drag & drop para itens dentro de categorias
- [x] Adicionar drag handle (ícone grip) nos itens
- [x] Persistir ordem no banco com atualização otimista
- [x] Implementar modo "Reordenar Categorias" separado
- [x] Mostrar apenas categorias no modo de reordenação (sem produtos)
- [x] Botões Concluir/Cancelar no modo de reordenação
- [x] Desabilitar drag quando filtros ativos
- [x] Suporte para desktop e mobile (touch)


## Container Avaliação Gratuita na Sidebar
- [x] Adicionar container "Avaliação gratuita" no final da sidebar conforme design do Figma
- [x] Mover container "Avaliação gratuita" para o final da sidebar (após Estabelecimento)
- [x] Alterar gradiente do container de verde para vermelho
- [x] Fixar container "Avaliação gratuita" no fundo absoluto da sidebar (mt-auto)

## Card Acumulado da Semana na Dashboard
- [x] Criar endpoint para buscar faturamento semanal agrupado por dia
- [x] Criar componente WeeklyRevenueCard com gráfico de barras
- [x] Adicionar toggle "Esta semana / Semana passada"
- [x] Implementar tooltip ao passar o mouse nas barras
- [x] Calcular variação % vs semana anterior
- [x] Adicionar skeleton loading
- [x] Garantir responsividade no mobile
- [x] Integrar o card na Dashboard

## Dados de Teste para Gráfico Semanal
- [x] Criar e executar script SQL para inserir pedidos de teste nas últimas duas semanas

## Edição Inline de Categorias
- [x] Adicionar cursor pointer ao nome da categoria
- [x] Implementar campo editável ao clicar no nome
- [x] Adicionar botões de confirmar (✅) e cancelar (❌)
- [x] Salvar alteração ao confirmar e rollback ao cancelar

## Micro-efeito Visual na Edição de Categoria
- [x] Adicionar mudança sutil de cor de fundo ao hover no título da categoria
- [x] Adicionar ícone de lápis que aparece ao passar o mouse
- [x] Transição suave para reforçar possibilidade de edição

## Ícone de Minimizar/Maximizar Sidebar
- [x] Alterar ícone para painel lateral (PanelLeft/PanelLeftClose)

## Remoção do Container de Filtros
- [x] Remover container de filtros (busca, categoria, status, estoque, ordenação) do Catálogo

## Layout do Formulário de Produto
- [x] Colocar nome, categoria e preço na mesma linha no desktop

## Item da Lista Clicável para Edição
- [x] Tornar área do item (nome, imagem, descrição, preço) clicável para ir à página de edição
- [x] Remover botão de editar (ícone de lápis) da lista de produtos
- [x] Manter botões de toggle, duplicar e excluir

## Página de Controle de Estoque
- [x] Criar tabelas no banco: stockCategories, stockItems e stockMovements
- [x] Criar endpoints tRPC: list, create, update, delete para itens de estoque
- [x] Criar endpoints tRPC: addMovement, listMovements para histórico
- [x] Criar página de Estoque com listagem em cards/tabela
- [x] Implementar status visual (verde/amarelo/vermelho) com barras de progressão
- [x] Adicionar filtros por categoria, status e busca por nome
- [x] Criar modal para adicionar novo item
- [x] Criar modal para editar quantidade/adicionar estoque
- [x] Criar modal para ver histórico de movimentações
- [x] Implementar ação "Marcar como em falta"
- [x] Garantir responsividade (mobile/tablet/desktop)
- [x] Adicionar feedback visual após atualizações

## Bugs
- [x] Corrigir link do menu Estoque na sidebar que não carrega a página
- [ ] Bug: Pedido via WhatsApp captura nome e telefone do restaurante em vez do cliente real

## Estilo Visual dos Cards de Estoque
- [x] Ajustar cards da página de Estoque para seguir o mesmo estilo visual da Dashboard

## Remoção do Container de Filtros do Estoque
- [x] Remover container de filtros (busca, categorias, status) da página de Estoque

## Cards de Status na Página de Pedidos
- [x] Ajustar cards de status (Novos, Em Preparo, Pronto, Finalizado, Cancelado) para seguir estilo dos cards da página de Estoque

## Dados Mockados de Pedidos
- [x] Adicionar pedidos de teste para cada status (Novos, Em Preparo, Prontos, Finalizados, Cancelados)

## Card de Pedidos Recentes
- [x] Atualizar card de Pedidos Recentes na Dashboard com novo modelo (StatusBadge, layout compacto, ícone de relógio)

## Lista de Itens do Estoque
- [x] Implementar tabela com colunas: Item (nome+categoria), Estoque atual (qtd+min/max), Status, Custo unitário, Valor total, Última atualização, Ações

## Remoção de Páginas
- [x] Remover páginas e menus de Promoções, Clientes e Relatórios

## Redução de Tamanho do Layout
- [x] Reduzir tamanho da barra de menu lateral em 20%
- [x] Reduzir espaçamentos das páginas (Dashboard, Cardápio, Pedidos, Estoque, Configurações) em 20%

## Redução de Tamanho da Dashboard
- [x] Reduzir tamanho dos cards de métricas, gráficos, fontes e espaçamentos em 20%

## Redução de Tamanho das Páginas (Cardápio, Pedidos, Estoque)
- [x] Reduzir tamanhos na página de Cardápio em 20%
- [x] Reduzir tamanhos na página de Pedidos em 20%
- [x] Reduzir tamanhos na página de Estoque em 20%

## Redução de Tamanho da Página de Novo Produto
- [x] Reduzir tamanhos de fontes, espaçamentos, campos e botões em 20% na página /catalogo/novo

## Capitalização Automática
- [x] Criar função utilitária para capitalizar primeira letra
- [x] Aplicar capitalização em campos de nome de categoria
- [x] Aplicar capitalização em campos de nome de item/produto
- [x] Aplicar capitalização em campos de descrição
- [x] Aplicar capitalização em campos de nome de item de estoque

## Reorganização do Formulário de Produto
- [x] Mover campo "Tempo de preparo (minutos)" para o container de "Informações Básicas"

## Remoção do Menu Configurações
- [x] Remover item "Configurações" da barra lateral de navegação

## Redesenho do Modal de Detalhes do Pedido
- [x] Implementar novo layout com seções: Customer Info, Payment Details, Delivery Info, Order Items, Shipping Info
- [x] Adicionar botões de Imprimir Pedido e Mensagem no WhatsApp

## Sidebar de Detalhes do Pedido
- [x] Substituir Dialog por Sheet (sidebar) com animação de slide da direita para a esquerda

## Listagem de Estoque Compacta
- [x] Reduzir altura das linhas da tabela
- [x] Remover categoria abaixo do nome do item
- [x] Remover Min/Max da coluna de estoque atual
- [x] Aproximar nome e unidade na mesma linha

## Dados de Estoque
- [x] Adicionar 17 novos itens de estoque com diferentes categorias e quantidades

## Interação na Lista de Estoque
- [x] Fazer com que ao clicar em qualquer item da lista abra o modal de edição
- [x] Remover botão "Editar" do menu de ações

## Ajuste de Tamanho da Sidebar
- [x] Aumentar tamanho da barra de menu lateral em 15%

## Aumento de 15% nos Tamanhos das Páginas
- [x] Aumentar tamanhos na página Dashboard em 15%
- [x] Aumentar tamanhos na página Catálogo em 15%
- [x] Aumentar tamanhos na página Novo/Editar Produto em 15%
- [x] Aumentar tamanhos na página Pedidos em 15%
- [x] Aumentar tamanhos na página Estoque em 15%
- [x] Aumentar tamanhos na página Configurações em 15%

## Ajuste Adicional da Sidebar
- [x] Aumentar tamanho da barra lateral em mais 5%

## Verificação de Consistência de Tamanhos
- [x] Verificar e ajustar tamanhos da página Configurações para igualar Catálogo

## Verificação da Barra Superior (Topbar)
- [x] Verificar e restaurar tamanhos originais da topbar (busca, perfil, notificações) - CONFIRMADO: tamanhos estão iguais

## Fluxo de Autenticação (Login/Registro/Recuperação)
- [x] Criar componente AuthLayout com layout dividido (benefícios à esquerda, formulário à direita)
- [x] Criar página de Login com campos email/senha, lembrar-me, esqueceu senha
- [x] Criar página de Registro (Criar Conta) com campos nome, email, senha, confirmar senha
- [x] Criar página de Recuperação de Senha
- [x] Configurar rotas de autenticação no App.tsx
- [x] Implementar lógica de backend para registro e login com email/senha
- [x] Testar fluxo completo de autenticação

## Ajustes na Página de Criar Conta
- [x] Remover campo "Nome completo" da página de registro

## Correção do Fluxo de Login
- [x] Remover redirecionamento para autenticação Manus após login
- [x] Garantir que login redirecione diretamente para o dashboard
- [x] Testar fluxo completo: criar conta → login → dashboard

## Bug: Redirecionamento após Login
- [x] Investigar por que após login o usuário é redirecionado de volta para /login
- [x] Corrigir problema de autenticação/sessão

## Sistema de Cardápio Público
- [x] Analisar site de referência (mandinhoburgernh.saipos.com)
- [x] Adicionar campo slug ao schema de establishments com unicidade
- [x] Criar rotas públicas para buscar dados do cardápio por slug
- [x] Criar página pública do cardápio (/menu/{slug}) com categorias e produtos
- [x] Adicionar botão "Ver menu" no painel do restaurante
- [x] Atualizar página de configurações para editar slug
- [x] Validar unicidade do slug ao salvar
- [x] Testar fluxo completo

## Popular Catálogo com Dados de Hamburgueria
- [x] Criar 9 categorias de hamburgueria
- [x] Adicionar 4 produtos em cada categoria (36 produtos total)

## Popular Catálogo da conta admin@admin.com
- [x] Criar 9 categorias e 36 produtos para a conta admin@admin.com

## Redesign da Página Pública do Cardápio
- [x] Header com logo + busca + menu (Início/Pedidos/Perfil)
- [x] Foto de capa full width arredondada
- [x] Bloco de informações com foto de perfil circular sobreposta
- [x] Status aberto/fechado com horário
- [x] Barra de categorias horizontal deslizante
- [x] Lista de produtos por categoria com cards

## Correção: Categorias e Produtos para usuário 180577
- [x] Verificar establishment do usuário 180577
- [x] Criar 9 categorias de hamburgueria
- [x] Adicionar 4 produtos em cada categoria (36 produtos total)

## Adicionar Fotos aos Produtos do Usuário 180577
- [x] Buscar imagens para todos os 36 produtos
- [x] Atualizar produtos com URLs das imagens no banco de dados

## Ajustes na Seleção de Categorias do Cardápio Público
- [x] Categoria selecionada deve ficar em vermelho
- [x] Seleção dinâmica conforme o scroll (sincronização automática)
- [x] Scroll suave ao clicar na categoria
- [x] Scroll automático da barra de categorias para acompanhar categoria ativa

## Redesign da Página de Configurações - Preview do Perfil Público
- [x] Criar preview visual do perfil público na página de Configurações
- [x] Adicionar funcionalidade de upload de logo do restaurante
- [x] Adicionar funcionalidade de upload de capa do restaurante
- [x] Mostrar preview em tempo real das alterações

## Sistema de Avaliações na Página Pública
- [x] Adicionar campos de avaliação no schema do banco (rating, reviewCount)
- [x] Exibir estrela amarela, nota (0-5) e quantidade de avaliações ao lado do nome

## Bug: Efeito Fantasma no Drag and Drop de Itens
- [x] Verificar efeito de drag and drop nas categorias
- [x] Aplicar o mesmo efeito fantasma nos itens/produtos do catálogo

## Sacola no Menu Público
- [x] Seção "Calcular taxa de entrega" com ícone de localização e seta
- [x] Título "Sua sacola" com ícone de sacola vazia
- [x] Exibição de Subtotal, Taxa de entrega e Total
- [x] Seção "Tem um cupom?" com ícone e seta
- [x] Botão "Sacola vazia" (ou "Finalizar pedido" quando tiver itens)

## Modal Mais Informações no Menu Público
- [x] Criar modal ao clicar em "Mais informações"
- [x] Exibir horários de funcionamento de segunda a domingo
- [x] Destacar o dia atual (ex: Sexta-feira 18:00 às 23:00)
- [x] Exibir formas de pagamento aceitas pelo estabelecimento

## Ajuste Layout Formas de Pagamento
- [x] Colocar as 3 formas de pagamento na mesma linha (flex)

## Ícone Pulsante Status Aberto/Fechado
- [x] Adicionar ícone pulsante verde ao lado de "Aberto agora"
- [x] Adicionar ícone pulsante vermelho ao lado de "Fechado"

## Ajuste Botão Informações
- [x] Alterar "Mais informações" para "Informações"
- [x] Adicionar ícone (i) ao lado do texto

## Ícone de Alfinete no Endereço
- [x] Adicionar ícone MapPin ao lado do endereço do restaurante

## Ícones WhatsApp e Instagram no Menu Público
- [x] Adicionar ícone de WhatsApp na linha do status
- [x] Adicionar ícone de Instagram na linha do status

## Ajuste Posição Ícones Redes Sociais
- [x] Posicionar ícones WhatsApp e Instagram mais à direita no card (ml-auto)
- [x] Adicionar Instagram de teste no banco de dados

## Campo Instagram nas Configurações
- [x] Adicionar campo para cadastrar @ do Instagram no painel de configurações

## Botão Compartilhar no Menu Público
- [x] Adicionar ícone de compartilhar ao lado do WhatsApp

## Mover Ícones para Canto Superior Direito
- [x] Remover botão "Calcular taxa de entrega"
- [x] Mover ícones de compartilhar, WhatsApp e Instagram para o canto superior direito do card

## Bug: Ícone Instagram não aparece
- [x] Verificar se o campo instagram está sendo retornado na API pública (campo estava vazio no banco)

## Otimização Cards do Cardápio Público
- [x] Reduzir padding interno dos cards (p-4 para p-3)
- [x] Reduzir espaço vertical entre título, descrição e preço (mt-0.5 e mt-1.5)
- [x] Diminuir altura máxima da imagem (w-20 h-20 / w-24 h-24)
- [x] Compactar textos (text-sm, text-xs, leading-tight)
- [x] Diminuir espaço entre título da categoria e primeiro card (mb-4 para mb-2)
- [x] Ajustar margens verticais entre cards (gap-4 para gap-2, mb-8 para mb-5)
- [x] Simplificar visual (removido shadow, apenas border com hover)

## Lazy Loading Imagens do Cardápio
- [x] Adicionar loading="lazy" e decoding="async" nas imagens do ProductCard

## Correção Preview Perfil Público em Configurações
- [x] Comparar preview em /configuracoes com a página /menu/:slug original
- [x] Corrigir diferenças visuais: estrela amarela, avaliações, ícone pulsante, ícones sociais, ícone alfinete

## Mover Botão Ver Menu
- [x] Remover botão "Ver menu" da sidebar lateral
- [x] Adicionar botão "Ver menu" na topbar ao lado do botão Aberto

## Ajustes em /configuracoes
- [x] Remover container "Informações Básicas"
- [x] Adicionar ícone de editar ao lado do nome do restaurante no Preview do Perfil Público
- [x] Tornar o nome editável diretamente no Preview
- [x] Adicionar botão "Salvar Alterações" no Preview

## Bug: Ícone de Editar Distante do Nome
- [x] Ajustar posicionamento do ícone de editar para ficar próximo ao nome do restaurante (gap-1, inline-flex)

## Correção Ícone Editar Nome do Restaurante
- [x] Fazer o ícone de editar dar foco no input ao clicar (ref + onClick)
- [x] Adicionar hover vermelho no nome do restaurante (group-hover:text-primary)

## Estilo de Edição do Nome do Restaurante
- [x] Implementar hover igual às categorias do catálogo (group-hover:text-primary, hover:bg-muted/50)
- [x] Ao editar, mostrar botões check (confirmar) e X (cancelar)
- [x] Input com borda ao editar igual ao catálogo

## Ícone Editar Sempre Visível
- [x] Remover opacity-0 do ícone de editar para ficar sempre visível

## Container Aberto/Fechado no Menu do Perfil
- [x] Adicionar container de Aberto/Fechado no menu dropdown do perfil
- [x] Posicionar acima do botão de Configurações

## Remoção Container Aberto/Fechado da Topbar
- [x] Remover container de Aberto/Fechado da topbar (já está no menu do perfil)

## URL de Produção do Cardápio
- [x] Alterar link do cardápio nas configurações para usar URL de produção (mindi.manus.space)

## Layout Campos de Atendimento
- [x] Colocar campos WhatsApp e Instagram na mesma linha do link do cardápio

## Alinhamento Menus Topbar Perfil Público
- [x] Alinhar menus Início, Pedidos e Perfil no final da topbar para alinhar com o final da imagem da capa

## Layout Formulário Novo Produto
- [x] Colocar campos preço, categoria e tempo de preparo na mesma linha do nome
- [x] Fazer todos os campos ocuparem a largura disponível sem espaço em branco

## Ajuste Campo Nome do Produto
- [x] Aumentar tamanho do campo Nome do produto para ocupar espaço restante

## Remover Campo Tempo de Preparo
- [x] Remover campo tempo de preparo do formulário de produto
- [x] Remover campo prepTime do schema do banco de dados
- [x] Migrar banco de dados

## Máscara de Moeda no Campo de Preço
- [x] Implementar máscara de moeda (R$) no campo de preço do formulário de produto

## Container de Ícones Sociais no Menu Público
- [x] Criar container separado para ícones de compartilhar, WhatsApp e Instagram
- [x] Posicionar abaixo do nome, status "Aberto agora" e badges de Entrega/Retirada

## Reposicionar Ícone de Compartilhar
- [x] Mover ícone de compartilhar para a mesma linha das avaliações (no final)
- [x] Quando nome for muito grande, ícone vai para o container de WhatsApp/Instagram (via flex-wrap)

## Dropdown para Ícones Sociais
- [x] Substituir exibição direta de WhatsApp/Instagram por uma setinha
- [x] Ao clicar na setinha, mostrar dropdown com ícones de WhatsApp e Instagram

## Corrigir Quebra de Linha do Ícone de Compartilhar
- [x] Evitar que o ícone de compartilhar quebre de linha em telas menores

## Ocultar Número de Avaliações em Mobile
- [x] Remover número de avaliações ao lado da nota em mobile
- [x] Mostrar total de avaliações ao clicar na estrela/nota (tooltip)

## Reduzir Altura do Banner
- [x] Diminuir altura da capa/banner em 17% (h-48→h-40, h-64→h-52, h-72→h-60)
- [x] Diminuir altura da capa/banner em mais 5% (h-40→h-36, h-52→h-48, h-60→h-56)

## Salvamento Automático no Preview do Perfil Público
- [x] Remover botão de salvar do container de Preview do Perfil Público
- [x] Implementar salvamento automático ao alterar foto, nome ou outros campos

## Reorganizar Campos de Endereço
- [x] Linha 1: Rua, Número e Bairro
- [x] Linha 2: Complemento, Cidade, Estado e CEP

## Formas de Pagamento em Linha Horizontal
- [x] Colocar as 4 formas de pagamento em uma linha horizontal (grid 4 colunas)

## Reduzir Largura dos Campos WhatsApp e Instagram
- [x] Diminuir largura dos campos WhatsApp e Instagram em 20% (maxWidth: 80%)

## Aumentar Largura do Campo Link do Cardápio
- [x] Fazer o campo Link do cardápio ocupar todo o espaço restante (linha própria com largura total)

## Remover Descrição do Card Pedidos Recentes
- [x] Remover texto "Últimas atualizações" do card Pedidos Recentes no Dashboard

## Exibir Nome e Foto do Restaurante no Header
- [x] Substituir texto "Cardápio" pelo nome do restaurante
- [x] Substituir ícone padrão pela foto do perfil do restaurante

## Trocar Ícone de Maximizar Menu
- [x] Substituir ícone PanelLeft por ChevronRight (menor) quando menu estiver minimizado

## Corrigir Proporções das Abas de Navegação
- [x] Verificar e corrigir proporções das abas Estabelecimento e Atendimento (padding px-4 py-2, min-w-[140px])

## Remover Botão de Atualizar em /pedidos
- [x] Remover o botão de atualizar da página de pedidos

## Remover Descrições dos Cards em /configuracoes
- [x] Remover descrição "Veja como seu restaurante aparecerá para os clientes" do card Preview
- [x] Remover descrição "Usado como endereço de retirada" do card Endereço

## Ajustar Visual do Card Avaliação Gratuita
- [x] Modificar estilo do card "Avaliação gratuita" na sidebar para ficar consistente com o sistema

## Página de Planos
- [x] Criar página /planos com identidade visual do sistema
- [x] Implementar 3 cards: Gratuito, Lite, Pro
- [x] Cada card com: título, lista de recursos, preço, botão de assinatura
- [x] Destaque especial no plano Pro (cor primária, badge "Mais popular")
- [x] Adicionar item "Planos" no dropdown do perfil (abaixo de Configurações)
- [x] Adicionar rota /planos no App.tsx
- [x] Garantir responsividade da página (grid 1-3 colunas)

## Remover Container de Estabelecimento da Sidebar
- [x] Remover o container "ESTABELECIMENTO / Restaurante Doca Iracema" da barra lateral

## Modal de Adicionar Item ao Carrinho
- [x] Criar modal com foto do item em destaque no topo
- [x] Exibir título e descrição do item
- [x] Adicionar campo de observação (texto livre)
- [x] Implementar controle de quantidade (-, número, +)
- [x] Adicionar botão "Adicionar" com estilo visual padrão
- [x] Abrir modal ao clicar em qualquer item do cardápio
- [x] Quantidade mínima: 1
- [x] Atualizar sacola imediatamente ao clicar em Adicionar
- [x] Fechar modal após adicionar

## Grupos de Complementos no Modal
- [x] Buscar dados dos complementos associados ao produto
- [x] Exibir grupos de complementos no modal (nome do grupo, mínimo/máximo)
- [x] Listar itens de cada grupo com nome e preço adicional
- [x] Implementar seleção de complementos (checkbox/radio conforme regras)
- [x] Calcular preço total incluindo complementos selecionados
- [x] Incluir complementos selecionados ao adicionar à sacola

## Complementos no X-Tudo e Correção do Carrinho
- [x] Adicionar grupos de complementos ao produto X-Tudo (Adicionais, Ponto da carne, Bebida)
- [x] Corrigir exibição da sacola para mostrar itens adicionados dinamicamente
- [x] Corrigir cálculo de subtotal e total na sacola
- [x] Corrigir botão "Adicionar" para adicionar item ao carrinho corretamente

## Funcionalidade de Remover Itens da Sacola
- [ ] Adicionar botão de remover item na sacola
- [ ] Implementar função para remover item do carrinho
- [ ] Atualizar totais após remoção


## Funcionalidade de Remover Itens da Sacola
- [x] Adicionar botão de remover item na sacola
- [x] Implementar função para remover item do carrinho
- [x] Atualizar totais após remoção


## Ajuste Visual da Sacola
- [x] Remover fotos dos itens na sacola


## Modal de Cupom no Menu Público
- [x] Criar modal de cupom ao clicar em "Tem um cupom?"
- [x] Adicionar campo de texto para digitar o cupom
- [x] Adicionar botão "Aplicar cupom" ao lado do campo
- [x] Validar se sacola está vazia e exibir mensagem de feedback
- [x] Manter modal aberto após validação


## Ajuste Altura Modal de Adicionar Item
- [x] Reduzir altura máxima do modal em 20%
- [x] Garantir responsividade para várias telas (mobile, tablet, desktop)


## Correção Botão Adicionar Cortado
- [x] Garantir que o footer do modal fique sempre visível
- [x] Ajustar estrutura do modal para não cortar o botão


## Borda Lateral nos Cards de Produtos
- [x] Adicionar borda esquerda vermelha nos cards de produtos

- [x] Mudar borda vermelha da lateral esquerda para a parte inferior dos cards

- [x] Reverter borda para lateral esquerda com 3px de espessura


## Fluxo de Finalização de Pedido
- [x] Modal 1: Resumo dos itens, complementos, subtotal, taxa, total e observações
- [x] Modal 2: Forma de entrega (retirar/entrega) e forma de pagamento (dinheiro/cartão/pix)
- [x] Modal 2: Campos de endereço condicionais para entrega
- [x] Modal 2: Campo de troco condicional para pagamento em dinheiro
- [x] Modal 3: Resumo final completo do pedido
- [x] Modal 4: Identificação do cliente (nome e telefone com máscara)
- [x] Modal 5: Confirmação final com mensagem e botões Voltar/Enviar pedido
- [x] Navegação sequencial entre modais com botão voltar
- [x] Responsividade em todos os modais


## Melhorias no Fluxo de Finalização
- [x] Adicionar indicador de progresso no topo dos modais (5 etapas)
- [x] Implementar salvamento de endereço do cliente no localStorage
- [x] Criar feedback de carregamento no botão enviar pedido (3 segundos)


## Ajuste Largura Menu Público Desktop
- [x] Aumentar largura do container do menu público em 20% na versão desktop


## Correção Visual do Modal de Checkout
- [x] Integrar indicador de progresso ao modal de resumo do pedido em um único bloco


## Confirmação de Pedido e Acompanhamento
- [x] Exibir mensagem "Pedido enviado com sucesso!" no mesmo modal após clicar em Enviar
- [x] Adicionar botão "Acompanhar pedido" abaixo da mensagem de sucesso
- [x] Criar modal de acompanhamento com timeline de status
- [x] Implementar status: Enviado, Aceito, Saiu para entrega, Entregue
- [x] Status atual em cor primária, futuros em cinza, concluídos em verde
- [x] Modal responsivo e reutilizável


## Ajuste Sacola no Mobile
- [x] Substituir ícone de perfil pelo ícone de sacola no menu mobile
- [x] Ao clicar, abrir o modal/drawer da sacola
- [x] Manter comportamento do desktop inalterado


## Menu de Pedidos no Cardápio Público
- [x] Criar estrutura de armazenamento de pedidos no localStorage
- [x] Salvar pedido enviado com todos os dados (itens, endereço, pagamento, status)
- [x] Implementar modal de Pedidos com histórico e pedidos atuais
- [x] Exibir pedidos em andamento com status atual
- [x] Exibir histórico de pedidos anteriores
- [x] Integrar botão Pedidos do menu mobile com a nova funcionalidade
- [x] Permitir abrir modal de acompanhamento a partir de um pedido


## Ajuste Visual Modal Resumo do Pedido
- [x] Remover fotos dos itens no modal de resumo do pedido


## Substituir Perfil por Sacola no Desktop
- [x] Substituir botão Perfil pelo botão Sacola no header desktop
- [x] Adicionar badge de quantidade de itens no carrinho


## Correção Posição Campo de Troco
- [x] Mover campo "Precisa de troco" para logo abaixo do card Dinheiro


## Correção Modal Sacola Desktop
- [x] Corrigir modal da sacola para aparecer na versão desktop


## Integração Backend Pedidos
- [ ] Criar tabelas orders e orderItems no banco de dados
- [ ] Criar rotas tRPC para criar pedido (público) e listar/atualizar pedidos (admin)
- [ ] Atualizar cardápio público para enviar pedidos ao backend
- [ ] Remover dados mockados da página de pedidos do admin
- [ ] Implementar listagem de pedidos em tempo real no admin
- [ ] Implementar atualização de status do pedido pelo admin


## Integração de Pedidos com Backend
- [x] Criar campo changeAmount no schema de orders para troco
- [x] Criar funções de banco de dados para pedidos públicos (createPublicOrder, getPublicOrderByNumber, getOrdersByPhone, getAllOrdersByEstablishment, getActiveOrdersByEstablishment)
- [x] Criar rotas tRPC para criar pedido público (publicMenu.createOrder)
- [x] Criar rotas tRPC para buscar pedido por número (publicMenu.getOrderByNumber)
- [x] Criar rotas tRPC para buscar pedidos por telefone (publicMenu.getOrdersByPhone)
- [x] Criar router orders para admin (list, get, getActive, updateStatus)
- [x] Atualizar PublicMenu.tsx para enviar pedidos via API em vez de localStorage
- [x] Atualizar página Pedidos.tsx do admin para usar as novas rotas
- [x] Implementar polling de 10 segundos para atualização automática de pedidos
- [x] Criar testes unitários para as funções de pedidos


## Integração de Pedidos com Backend (Solicitação do Usuário)

- [x] Criar rotas públicas para criar pedidos via API
- [x] Integrar cardápio público com backend para salvar pedidos
- [x] Remover dados mockados da página de pedidos do admin
- [x] Implementar atualização em tempo real dos pedidos (polling a cada 30s)
- [x] Permitir que o restaurante atualize status dos pedidos


## Migração de Polling para SSE (Server-Sent Events)

- [x] Criar endpoint SSE no backend para streaming de pedidos por estabelecimento
- [x] Implementar sistema de emissão de eventos quando pedidos são criados
- [x] Implementar sistema de emissão de eventos quando status de pedidos são atualizados
- [x] Atualizar página de pedidos do admin para usar SSE
- [x] Manter polling como fallback caso conexão SSE falhe
- [x] Testar latência e funcionamento em tempo real


## Página de Gerenciamento de Cupons

### Backend
- [x] Criar tabela coupons no schema do banco de dados
- [x] Adicionar campos: code, type, value, maxDiscount, minOrderValue, quantity, usedCount
- [x] Adicionar campos de disponibilidade: startDate, endDate, activeDays, validOrigins, startTime, endTime
- [x] Criar endpoints tRPC: list, create, update, delete, toggleStatus

### Listagem de Cupons
- [x] Criar página /cupons com tabela de cupons
- [x] Exibir colunas: código, tipo, valor, valor máximo, mínimo pedido, validade, dias ativos, origem, status, quantidade, ações
- [x] Adicionar botão "Criar novo cupom"
- [x] Adicionar campo de busca por código
- [x] Implementar ações: Editar, Desativar, Excluir

### Formulário Criar/Editar Cupom
- [x] Campo código do cupom (máx 15 caracteres)
- [x] Toggle tipo de desconto (Percentual / Valor Fixo)
- [x] Campo valor do desconto (dinâmico conforme tipo)
- [x] Campo valor máximo do desconto
- [x] Campo valor mínimo do pedido
- [x] Campo quantidade total de cupons
- [x] Seção Disponibilidade: período de validade (data inicial/final)
- [x] Checkboxes dias da semana (Dom-Sáb)
- [x] Checkboxes origem válida (Retirada, Delivery, Autoatendimento)
- [x] Campos horário disponível (início/fim)
- [x] Botão Criar/Salvar com validações
- [x] Feedbacks de erro e sucesso

### Responsividade e UX
- [x] Garantir responsividade desktop/mobile
- [x] Seguir padrão visual do Mindi (inputs, botões, cards, espaçamentos)


## Integração de Cupons no Checkout do Cardápio Público

- [x] Criar rota pública para validar cupom (publicMenu.validateCoupon)
- [x] Atualizar modal de cupom no PublicMenu para validar via API
- [x] Exibir desconto aplicado na sacola após validação
- [x] Integrar desconto do cupom no cálculo do total
- [x] Atualizar criação de pedido para incluir cupom e desconto
- [x] Incrementar usedCount do cupom ao criar pedido
- [x] Testar fluxo completo de aplicação de cupom


## Correção Visual dos Cards de Cupons

- [x] Ajustar cards da página de cupons para seguir o mesmo padrão da página de estoque


## Bug: Cupom SEG10 retornando "Cupom inválido"

- [x] Investigar causa do erro na validação do cupom (problema na comparação de datas - endDate era comparado com meia-noite em vez do final do dia)
- [x] Corrigir o bug identificado (ajustado endDate para 23:59:59 antes da comparação)


## Erros na Página de Pedidos

- [x] Corrigir erro de establishmentId null na query de pedidos (já estava tratado com enabled: !!establishmentId)
- [x] Corrigir erro de conexão SSE (cookie name estava errado: manus_session -> app_session_id)


## Ajuste Mobile - Página de Catálogo

- [x] Ocultar fotos dos itens na versão mobile da página /catalogo

- [x] Substituir ícones de duplicar e lixeira por menu dropdown (três pontinhos) na versão mobile


## Ajuste Visual - Página de Estoque

- [x] Ajustar lista de itens da página de estoque para seguir o mesmo visual da página de cupons


## Bug: Cupom SEG10 retornando "Cupom inválido" no checkout

- [x] Verificar dados do cupom SEG10 no banco de dados
- [x] Analisar lógica de validação e identificar o problema (formato do input tRPC estava incorreto - faltava a chave "json")
- [x] Corrigir o bug identificado (adicionada chave "json" no input e extração do resultado)


## Ajuste Mobile - Ocultar Descrição no Catálogo

- [x] Ocultar descrição dos itens na versão mobile da página /catalogo


## Bug: Modal de Acompanhamento não atualiza status em tempo real

- [x] Analisar como o modal de acompanhamento busca o status do pedido
- [x] Implementar atualização em tempo real do status no modal (polling a cada 5s com getOrderByNumber)


## Ajuste Visual - Badge de Pedidos no Cardápio Público

- [x] Ajustar posição do badge de pedidos para não sobrepor a letra 's'


## Ajuste Visual - Badge da Sacola no Cardápio Público

- [x] Aplicar o mesmo ajuste de posicionamento do badge no ícone da sacola


## Badge de Contagem de Pedidos Novos no Menu Admin

- [x] Criar contexto global para gerenciar contagem de pedidos novos (NewOrdersContext)
- [x] Integrar contagem com SSE para atualização em tempo real
- [x] Adicionar badge no menu Pedidos do AdminLayout
- [x] Implementar lógica de zerar badge ao entrar na página de pedidos
- [x] Badge deve aparecer apenas quando houver pedidos com status "new"


## Bug: Modal de Acompanhar Pedido reseta status ao reabrir

- [x] Corrigir modal para buscar status atual do banco ao abrir (adicionado refetchOnMount e staleTime: 0)
- [x] Não usar estado local/cache para o status do pedido (removido setOrderStatus no onClick)
- [x] Modal deve sempre exibir o status real do pedido (força refetch ao abrir modal)


## Bloquear Pedidos com Loja Fechada

- [x] Verificar horário de funcionamento no cardápio público
- [x] Bloquear botão de adicionar quando loja fechada
- [x] Exibir mensagem "Restaurante fechado" no botão
- [x] Bloquear botão "Finalizar pedido" na sacola quando loja fechada
- [x] Bloquear botão "Enviar pedido" no checkout quando loja fechada


## Botão Avaliar Restaurante no Modal de Acompanhar Pedido

- [x] Adicionar botão "Avaliar restaurante" no modal de acompanhamento
- [x] Botão só aparece quando status for "entregue"
- [x] Criar modal simples de avaliação (preparado para campos futuros)
- [x] Seguir estilo visual dos botões do cardápio público


## Badge de Contagem de Pedidos - Mostrar apenas não entregues

- [x] Ajustar badge para contar apenas pedidos não entregues
- [x] Badge deve diminuir quando pedido mudar para status "entregue"


## Sistema de Avaliação por Estrelas

- [x] Adicionar seletor de estrelas de 1 a 5 no modal de avaliação
- [x] Adicionar campo de comentário/texto para avaliação
- [x] Estrelas devem ser clicáveis e mostrar seleção visual


## Sistema Completo de Avaliações

- [x] Criar tabela de reviews no banco de dados
- [x] Criar endpoint para salvar avaliação (createReview)
- [x] Criar endpoint para listar avaliações (getReviews)
- [x] Criar modal de avaliações que abre ao clicar na estrela/nota
- [x] Exibir nome do cliente, estrelas, comentário e data
- [x] Integrar botão "Enviar avaliação" com o backend


## Bug: Envio de Avaliação não Funciona

- [x] Investigar e corrigir problema no envio de avaliação
- [x] Adicionar tela de confirmação de sucesso após envio


## Bug: Erro ao Enviar Avaliação

- [x] Investigar erro no envio de avaliação
- [x] Corrigir problema identificado (tratamento de valores null no cálculo de média)


## Correção da Média de Avaliações e Estrelas Parciais

- [x] Corrigir exibição da média de avaliações (MySQL retornava string)
- [x] Implementar estrelas parciais (ex: 4,5 = 4 cheias + 1 meia)


## Reorganizar Modal do Fluxo do Pedido

- [x] Mover título para acima das etapas (1, 2, 3, 4, 5)
- [x] Etapas devem ficar abaixo do título
- [x] Remover headers duplicados dos modais 2, 3, 4 e 5


## Motivo de Cancelamento de Pedido

- [x] Adicionar campo cancellationReason na tabela orders
- [x] Adicionar campo de texto no modal de cancelar pedido (admin)
- [x] Atualizar endpoint de cancelamento para salvar o motivo
- [x] Exibir status "Cancelado" e motivo no modal de Acompanhar Pedido (público)


## Botão Ver Menu na Versão Mobile

- [x] Adicionar botão "Ver menu" na topbar mobile do painel admin


## Texto "Ver menu" na Versão Mobile

- [x] Adicionar texto "Ver menu" junto com o ícone na versão mobile (igual desktop)


## Edição do Status "Aceito" no Modal de Acompanhar Pedido

- [x] Alterar título de "Aceito" para "Pedido aceito"
- [x] Alterar descrição de "O restaurante aceitou seu pedido" para "Iniciamos o preparo do seu pedido."


## Ícone de Moto no Status "Saiu para entrega"

- [x] Trocar ícone do carro para ícone de moto no status "Saiu para entrega"


## Chave Pix no Checkout

- [x] Adicionar campo pixKey no schema de establishments
- [x] Criar campo para inserir chave Pix na página de Configurações (Formas de pagamento)
- [x] Exibir chave Pix com botão copiar quando Pix for selecionado no modal de checkout


## Status Condicional para Retirada no Local

- [x] Alterar status "Saiu para entrega" para "Pedido Finalizado" quando tipo de entrega for retirada
- [x] Alterar descrição para "Tudo certo! Seu pedido já está disponível para retirada."


## Badge Condicional no Modal Meus Pedidos

- [x] Corrigir badge para exibir "Pedido Finalizado" em vez de "Saiu para entrega" quando for retirada no local


## Navegação de Voltar no Fluxo de Pedido

- [x] Adicionar seta de voltar no título do modal (a partir da etapa 2)
- [x] Permitir clicar nas etapas anteriores já concluídas para voltar


## Loading no Botão Enviar Pedido

- [x] Adicionar estado de loading com delay de 3 segundos no botão Enviar pedido
- [x] Exibir ícone de loading enquanto o pedido está sendo processado


## Validação Obrigatória de Endereço para Entrega

- [x] Tornar campos Rua, Número e Bairro obrigatórios quando tipo de entrega for Entrega
- [x] Bloquear botão Próximo se campos obrigatórios não estiverem preenchidos
- [x] Exibir indicador visual de campos obrigatórios


## Sistema de Avaliação do Restaurante

- [ ] Criar tabela de avaliações no banco de dados (ratings)
- [ ] Criar endpoint para verificar se cliente pode avaliar (última avaliação > 30 dias)
- [ ] Criar endpoint para enviar avaliação
- [ ] Implementar modal de avaliação no frontend
- [ ] Exibir modal apenas quando pedido atingir status "entregue" e cliente puder avaliar
- [ ] Armazenar avaliação com data para controle de 30 dias


## Sistema de Avaliação do Restaurante (30 dias)

- [x] Criar tabela de avaliações com campo customerPhone para identificar cliente
- [x] Criar endpoint para verificar se cliente pode avaliar (30 dias)
- [x] Criar endpoint para criar avaliação com validação de 30 dias
- [x] Exibir modal de avaliação apenas quando pedido atingir status "entregue" E última avaliação > 30 dias
- [x] Ocultar botão de avaliar se cliente já avaliou nos últimos 30 dias


## Tratamento de Erro Detalhado no Envio de Pedidos

- [x] Adicionar logs detalhados no backend ao criar pedido
- [x] Melhorar mensagem de erro no frontend com detalhes do problema
- [x] Adicionar try-catch com tratamento específico de erros



## Bug de Login - Duas Tentativas

- [x] Investigar fluxo de autenticação na página /login
- [x] Identificar problema de sincronização de estado ou redirecionamento
- [x] Corrigir o bug para login funcionar na primeira tentativa



## Balão de Nota Temporária no Cardápio Público

- [x] Adicionar campos public_note e public_note_created_at no schema
- [x] Criar endpoints para salvar e remover nota
- [x] Adicionar seção de configuração com campo de texto e sugestões
- [x] Implementar botões Salvar Nota e Remover Nota
- [x] Exibir balão de nota no cardápio público acima da foto de perfil
- [x] Implementar lógica de expiração automática de 24h



## Ajustes no Balão de Nota

- [x] Posicionar balão corretamente acima da foto de perfil (canto superior esquerdo)
- [x] Adicionar quebra de linha para textos longos
- [x] Reduzir tamanho do balão e texto em 20%
- [x] Mudar modelo do balão para estilo com seta no canto inferior esquerdo



## Efeito de Animação no Balão de Nota

- [x] Adicionar efeito de animação suave no balão (float/pulse)

- [x] Balão de nota com bico em formato de gota arredondada (estilo imagem de referência)
- [x] Adicionar segundo círculo menor ao balão para efeito de balão de pensamento
- [x] Ajustar posição dos círculos do balão para ficarem centralizados na parte inferior
- [x] Mover círculos do balão para o lado esquerdo
- [x] Inverter posição dos círculos: maior à esquerda, menor à direita
- [x] Atualizar preview do perfil público nas configurações para incluir balão de nota
- [x] Adicionar dropdown de Redes Sociais com separador no preview das configurações
- [x] Adicionar menu dropdown completo com ícones de WhatsApp e Instagram no preview
- [x] Corrigir dropdown de Redes Sociais cortado - abrir para cima
- [x] Diminuir altura do campo de observações em 25%
- [x] Diminuir altura do campo de observação no modal de Resumo do Pedido em 25%
- [x] Remover espaço vazio grande abaixo do botão Acompanhar pedido no modal de Enviar Pedido
- [x] Mover botão Acompanhar pedido para o footer do modal de Enviar Pedido
- [x] Alterar cor do botão Acompanhar pedido para vermelho
- [x] Verificar e corrigir o fluxo de modais de checkout - modal de Confirmação
- [x] Remodelar card de pedidos no modal Meus Pedidos com dropdown expansível para itens
- [x] Corrigir clique no card de pedidos para fazer dropdown em vez de ir para Acompanhar Pedido
- [x] Implementar atualização automática do status dos pedidos no modal Meus Pedidos
- [x] Corrigir lógica de avaliação: não exibir botão quando já avaliou nos últimos 30 dias e corrigir erro ao enviar
- [x] Corrigir erro 'Cannot access data before initialization' no PublicMenu
- [x] Reorganizar modal Confirmar Endereço com ícones em círculos coloridos e cards com fundo claro
- [x] Implementar SSE única por usuário para atualização em tempo real do status no modal Meus Pedidos


## Correção SSE - Usar IDs de Pedidos em vez de Telefone

- [x] Alterar formato do número do pedido para #P00000 (5 dígitos)
- [x] Modificar endpoint SSE para aceitar lista de IDs de pedidos
- [x] Atualizar funções de notificação SSE para usar orderNumber
- [x] Refatorar conexão SSE no frontend para usar IDs de pedidos do localStorage
- [x] Garantir atualização automática do modal Meus Pedidos sem clique
- [x] Testar fluxo completo de atualização em tempo real


## Bug Fix - establishmentId null na página /pedidos

- [x] Corrigir erro onde establishmentId é passado como null na query de pedidos


## Bug Fix - Cardápio não encontrado no menu público

- [x] Investigar e corrigir erro "Cardápio não encontrado" após últimas alterações
- [x] Corrigir erro de establishmentId null nas queries de Pedidos.tsx


## Bug Fix - Versão publicada fora do ar

- [x] Investigar e corrigir problema na versão publicada (mindi.manus.space)
- [x] Corrigir erro de Rate Limiting (429) no SSE do menu público - SSE desabilitado temporariamente


## SSE Singleton - Conexão única por cliente

- [x] Criar singleton SSE global para gerenciar conexão única
- [x] SSE deve iniciar somente após criação do pedido (não antes)
- [x] Tratamento silencioso de erro 429 com reconexão (backoff exponencial: 3s, 6s, 12s...)
- [x] Reutilizar conexão existente em vez de abrir nova


## Bug Fix - canReview causando ERR_INSUFFICIENT_RESOURCES

- [x] Corrigir chamadas excessivas de publicMenu.canReview (usar chave única para evitar duplicação)
- [x] Esconder botão de avaliar quando usuário já avaliou (lógica já existia, corrigido para não chamar múltiplas vezes)


## Bug Fix - Erro 400 na API publicMenu e status não atualiza

- [x] Investigar e corrigir erro 400 na API publicMenu (adicionado polling a cada 10s)
- [x] Garantir atualização do status no modal Meus Pedidos (sincronização automática)


## Bug Fix - ERR_INSUFFICIENT_RESOURCES persistente no canReview

- [x] Eliminar todas as chamadas duplicadas de canReview (removido userOrders das dependências)
- [x] Garantir que canReview seja chamado apenas UMA vez por pedido (usando ref em vez de estado)


## Bug Fix - Botão de avaliar aparecendo quando já avaliou

- [x] Corrigir verificação de canReview para esconder botão quando já avaliou nos últimos 30 dias (adicionado orderStatus como dependência)


## Bug Fix - Rate Exceeded ao enviar pedido

- [x] Investigar e corrigir erro de Rate Exceeded ao enviar pedido (removido polling de 5s, aumentado intervalo de sync para 30s)


## Bug Fix - SSE múltiplas conexões na página /pedidos

- [x] Criar conexão SSE única por estabelecimento (singleton global com globalSSE)
- [x] Inicializar SSE apenas uma vez (useEffect com dependências mínimas)
- [x] Cancelar SSE ao sair da página (cleanup automático quando não há listeners)
- [x] Remover reconexões agressivas (só reconecta quando CLOSED, backoff exponencial)
- [x] SSE por establishmentId (passado como parâmetro do hook)


## SSE Multi-Tab - Compartilhar conexão entre abas

- [x] Implementar sistema de líder/seguidor com BroadcastChannel
- [x] Aba líder mantém a conexão SSE real
- [x] Outras abas recebem eventos via BroadcastChannel
- [x] Eleição automática de novo líder quando aba líder fecha (timeout 5s)
- [x] Garantir apenas 1 conexão SSE por restaurante por navegador


## Correção Completa SSE - Checklist

### A - Controle de Conexão SSE (líder/seguidor)
- [x] Verificar no mount se há líder ativo via BroadcastChannel
- [x] Apenas aba líder pode criar EventSource
- [x] Abas seguidoras NUNCA chamam /api/orders/stream
- [x] Quando líder fecha, outra aba assume em 5s (leader-closed broadcast)
- [x] Evitar múltiplas criações de SSE quando React remonta (mountedRef)
- [x] Criar singleton para conexão SSE (variáveis globais)

### B - Controle de Requisições TRPC
- [x] Garantir orders.list execute UMA vez no mount (initialFetchDone ref)
- [x] Verificar StrictMode não duplica effects (mountedRef)
- [x] Adicionar throttle/debounce se houver polling (staleTime: 30000)
- [x] Não chamar orders.list após SSE reconectar (removido do NewOrdersContext)
- [x] Remover refetchInterval de hooks (refetchInterval: false)

### C - Tratamento de Erros 429
- [x] Se "Rate exceeded" não dar retry imediato
- [x] Backoff exponencial: 1s, 2s, 5s, 10s, 20s (BACKOFF_DELAYS)
- [x] Tratar resposta de erro como texto, não JSON
- [x] Logar com tags [SSE-Error], [SSE-Leader], [SSE-Tab], [SSE-BC]

### D - Prevenção de Race Conditions
- [x] Garantir apenas 1 instância SSE por navegador (BroadcastChannel)
- [x] Reconexões só quando CLOSED + líder + retry habilitado
- [x] Broadcast ao trocar líder (leader-exists, leader-closed)


## Bug Fix - Erro 400 no Menu Público e SSE

### Investigação
- [x] Verificar payload enviado pelo menu público (establishmentId, items, price, etc)
- [x] Verificar endpoint TRPC publicMenu.createOrder e validação Zod (logs já existem)
- [x] Verificar formato dos IDs de pedidos (#P00006 - formato correto)

### Correções
- [x] Corrigir SSE singleton no menu público para evitar múltiplas conexões
- [x] Não abrir SSE se criação do pedido falhar (já implementado no onSuccess)
- [x] Adicionar logs no backend para diagnóstico (já existem)

### Validação
- [ ] Testar criação de 10 pedidos seguidos sem recarregar página


## Bug Fix - Erro 400 em TRPC publicMenu após primeiro pedido

- [x] Identificar qual query TRPC está causando erro 400 (URL contém tId%22%3A30001)
  - Problema: chamada fetch direta para API TRPC com JSON mal formatado na URL
  - Local: PublicMenu.tsx, função syncOrderStatuses (linha 418)
- [x] Corrigir parâmetros inválidos na query
  - Solução: substituir fetch direto por trpcUtils.client.publicMenu.getOrderByNumber.query()
  - Adicionado trpcUtils = trpc.useUtils() para chamadas imperativas


## Bug Fix - Erro de Inserção de Pedido no Banco de Dados

- [x] Analisar erro "Failed query: insert into orders" ao enviar pedido
  - Problema: campo changeAmount estava sendo enviado com formato brasileiro (vírgula como separador decimal: 100,00)
  - O banco de dados espera formato numérico com ponto (100.00)
- [x] Verificar schema da tabela orders e tipos de dados
  - changeAmount é decimal(10,2) que requer formato com ponto decimal
- [x] Corrigir código de criação de pedidos no frontend
  - Adicionado .replace(/\\./g, '').replace(',', '.') para converter formato brasileiro para numérico


## Validação de Valor de Troco

- [x] Validar que o valor do troco seja maior que o total do pedido
  - Validação em tempo real no onChange do campo
  - Validação adicional ao clicar no botão de enviar
- [x] Exibir mensagem de erro clara se o valor for menor que o total
  - Mensagem: "O valor do troco deve ser maior que o total do pedido (R$ X,XX)"
  - Ícone de alerta junto à mensagem
- [x] Adicionar feedback visual (borda vermelha, ícone de erro)
  - Borda vermelha no campo de input
  - Fundo vermelho claro (bg-red-50)
  - Ícone de erro dentro do campo
- [x] Bloquear envio do pedido se a validação falhar
  - Botão desabilitado quando há erro
  - Botão fica cinza para indicar estado desabilitado
- [x] Adicionar dica "Deixe em branco se não precisar de troco"


## Bug Fix - Limpar Sacola Após Enviar Pedido

- [x] Limpar sacola automaticamente após pedido ser enviado com sucesso
  - Adicionado setCart([]) no onSuccess da mutation createOrder
- [x] Resetar estados relacionados (cupom aplicado, observação, etc.)
  - setOrderObservation("")
  - setAppliedCoupon(null)
  - setChangeAmount("")
  - setChangeAmountError(null)
  - setCheckoutStep(0)


## Bug Fix - Segundo Pedido Pula Direto para Modal de Sucesso

- [x] Identificar estados que não estão sendo resetados após primeiro pedido
  - Problema: orderSent permanecia true após primeiro pedido
  - Quando usuário iniciava novo checkout, step 5 mostrava "Pedido enviado" direto
- [x] Resetar orderSent para false quando iniciar novo pedido
  - Adicionado setOrderSent(false) no botão "Finalizar pedido" (desktop)
  - Adicionado setOrderSent(false) no botão "Finalizar pedido" (mobile)
- [x] Garantir que o fluxo de checkout funcione corretamente para múltiplos pedidos
  - Agora cada novo checkout começa com orderSent=false


## Integração SMS DisparoPro

- [x] Acessar documentação da API DisparoPro
  - Endpoint: POST https://apihttp.disparopro.com.br:8433/mt
  - Autenticação: Bearer Token no header Authorization
- [x] Criar função utilitária para envio de SMS (server/_core/sms.ts)
  - sendSMS(): função genérica para envio
  - sendOrderReadySMS(): função específica para pedido pronto
  - normalizePhoneNumber(): normaliza telefone para formato 55DDDNNNNNNNNN
  - isValidPhoneNumber(): valida se telefone é válido
- [x] Normalizar telefone (DDD + número) antes de enviar
  - Remove caracteres especiais
  - Adiciona código do país 55 se necessário
  - Valida tamanho (12-13 dígitos)
- [x] Integrar envio de SMS no fluxo de atualização de status "ready"
  - Integrado em db.ts na função updateOrderStatus()
  - Busca nome do restaurante para mensagem personalizada
- [x] Garantir que SMS só seja enviado uma vez (quando status muda para "ready")
  - Condição: status === "ready"
- [x] Tratar erros silenciosamente (logar, não quebrar fluxo)
  - Envio assíncrono com .then().catch()
  - Logs de sucesso e erro no console
- [x] Ignorar envio se telefone não for válido
  - Validação com isValidPhoneNumber() antes de enviar
- [x] Solicitar token/config da DisparoPro via webdev_request_secrets
  - DISPAROPRO_TOKEN: Token de autenticação
  - DISPAROPRO_PARCEIRO_ID: ID do parceiro
- [x] Testes unitários criados (sms.test.ts, sms-credentials.test.ts)
  - 119 testes passando


## Bug Fix - Modal de Pedido Enviado Não Aparece

- [x] Investigar por que o modal de "Pedido enviado" não aparece após clicar em enviar
  - Problema: setCheckoutStep(0) estava sendo chamado no onSuccess
  - Isso fechava o modal antes do usuário ver a mensagem de sucesso
- [x] Verificar se orderSent está sendo setado corretamente
  - orderSent estava sendo setado para true corretamente
- [x] Corrigir o fluxo de exibição do modal
  - Removido setCheckoutStep(0) do onSuccess
  - Agora o modal permanece aberto mostrando "Pedido enviado com sucesso!"
  - checkoutStep só é resetado quando usuário clica em "Acompanhar pedido"


## Bug Fix - SMS Não Está Sendo Recebido

- [x] Verificar se o DDI +55 está sendo adicionado corretamente ao telefone
  - Confirmação: DDI 55 está sendo adicionado automaticamente
  - Exemplo: 88999290000 -> 5588999290000
- [x] Verificar logs do servidor para ver se o SMS está sendo enviado
  - Teste manual de envio de SMS funcionou corretamente
  - API DisparoPro retornou status "ACCEPTED" e "Message Sent"
- [x] Corrigir normalização do telefone se necessário
  - Não foi necessário - normalização já estava correta
- [x] Usuário confirmou recebimento do SMS de teste


## Configuração de Ativação/Desativação de SMS

- [x] Adicionar campo smsEnabled (boolean) no schema do estabelecimento
  - Campo adicionado em drizzle/schema.ts com default false
- [x] Executar migração do banco de dados
  - Coluna adicionada via ALTER TABLE
- [x] Criar seção de configuração de SMS na página de configurações
  - Nova seção "Notificações SMS" na tab Atendimento
- [x] Adicionar toggle para ativar/desativar SMS
  - Toggle switch com preview da mensagem quando ativado
- [x] Modificar lógica de envio de SMS para verificar se está habilitado
  - Verifica smsEnabled antes de enviar
  - Log informativo quando SMS está desativado
- [x] Testar ativação e desativação do SMS
  - 119 testes passando


## Bug Fix - Badge de Contagem de Pedidos Não Aparece

- [x] Investigar código do badge de contagem de pedidos na barra lateral
  - Problema: initialFetchDone.current impedia recalculação da contagem
  - O SSE só incrementava se não estivesse na página de pedidos
- [x] Verificar se a query de contagem de pedidos novos está funcionando
  - Query estava funcionando, mas a lógica de contagem estava incorreta
- [x] Corrigir o problema de exibição do badge
  - Removido initialFetchDone.current que bloqueava atualizações
  - SSE agora sempre incrementa a contagem quando novo pedido chega
  - Contagem inicial recalculada quando dados mudam
  - Logs de debug adicionados para acompanhamento

## Mensagem SMS Diferenciada por Tipo de Entrega

- [x] Modificar função sendOrderReadySMS para aceitar parâmetro deliveryType
  - Parâmetro opcional com default "delivery"
- [x] Mensagem para entrega: "{Nome}: Seu pedido está saindo para entrega."
- [x] Mensagem para retirada: "{Nome}: Seu pedido já está disponível para retirada."
- [x] Atualizar chamada de SMS no db.ts para passar o deliveryType do pedido
  - order.deliveryType passado como terceiro parâmetro
  - Log atualizado para mostrar tipo de entrega


## Simplificar Formato do Número do Pedido

- [x] Identificar onde o número do pedido é gerado (db.ts ou routers.ts)
  - Localizado em server/db.ts, função createPublicOrder, linha 1027
- [x] Mudar formato de #P00024 para #P24 (sem zeros à esquerda)
  - Removido .padStart(5, '0') da geração do número
  - Agora usa formato simples: `#P${nextNumber}`
- [x] Primeiro pedido de novo restaurante deve ser #P1
  - Lógica mantida: nextNumber começa em 1 se não houver pedidos anteriores
- [x] Testar criação de novos pedidos com formato simplificado
  - 119 testes passando

## Exibir Número do Pedido no Modal de Sucesso

- [x] Identificar onde o modal de "Pedido enviado com sucesso" é renderizado
  - Localizado em PublicMenu.tsx, linha 2364-2381
- [x] Adicionar exibição do número do pedido (ex: #P25) no modal
  - Adicionado parágrafo com "Número do pedido: {currentOrderNumber}"
  - Estilo destacado com cor primária
- [x] Garantir que o número do pedido seja obtido da resposta da mutation
  - Já existia currentOrderNumber sendo setado no onSuccess

## Bug Fix - Badge Invisível Quando Item Pedidos Está Selecionado

- [x] Identificar onde o badge de pedidos é renderizado na sidebar
  - Localizado em AdminLayout.tsx, linhas 230-249
- [x] Modificar estilo do badge para fundo branco e número vermelho quando selecionado
  - Quando isActive: bg-white text-primary
  - Quando não ativo: bg-red-500 text-white
- [x] Garantir contraste adequado em ambos os estados (selecionado e não selecionado)
  - Aplicado para ambos os badges (sidebar colapsada e expandida)

## Personalização de Cores Degradê para Balão de Nota

- [ ] Adicionar campo noteStyle no schema do estabelecimento
- [ ] Criar opções de estilos degradê pré-definidos
- [ ] Criar interface de seleção de estilos nas configurações
- [ ] Aplicar estilo selecionado no balão de nota do menu público
- [ ] Testar a personalização de cores


## Personalização de Cores Degradê para Balão de Nota

- [x] Adicionar campo noteStyle (string) no schema do estabelecimento
  - Campo adicionado em drizzle/schema.ts com default "default"
- [x] Executar migração do banco de dados para adicionar coluna
  - Coluna noteStyle adicionada via ALTER TABLE
- [x] Criar interface de seleção de estilos degradê nas configurações
  - 12 estilos disponíveis: Padrão, Pôr do Sol, Oceano, Floresta, Roxo, Fogo, Dourado, Noite, Doce, Menta, Pêssego, Real
  - Grid responsivo com preview de cada estilo
- [x] Implementar preview do balão com estilo selecionado
  - Preview atualiza em tempo real ao selecionar estilo
- [x] Aplicar estilo selecionado no balão de nota do menu público
  - Balão e bicos aplicam o estilo salvo
  - Texto ajusta cor automaticamente para contraste
- [x] Testar personalização de cores
  - 119 testes passando


## Validade da Nota do Restaurante (1-7 dias)

- [x] Adicionar campo noteExpiresAt (datetime) no schema do estabelecimento
  - Campo adicionado em drizzle/schema.ts como timestamp
- [x] Executar migração do banco de dados
  - Coluna noteExpiresAt já existe na tabela establishments
- [x] Criar interface de seleção de validade (1-7 dias) nas configurações
  - Botões de 1 a 7 dias com visual destacado para seleção
  - Texto informativo sobre duração da exibição
- [x] Calcular data de expiração ao salvar a nota
  - Função savePublicNote calcula expiresAt baseado nos dias selecionados
- [x] Atualizar lógica de exibição no menu público para verificar validade
  - Verifica noteExpiresAt se disponível, senão fallback para 24h
- [x] Ocultar nota automaticamente quando expirada
  - Nota não é exibida se data atual > noteExpiresAt
- [x] Todos os 119 testes passando


## Bugs Mobile - Menu Público

- [x] Corrigir pontos extras (.....) aparecendo no endereço na versão mobile
  - Adicionado truncate com max-width para cortar texto longo com elipsis (...)
  - Adicionado bairro e cidade na exibição do endereço
- [x] Corrigir placeholder do campo de busca cortado
  - Alterado placeholder de "Buscar no cardápio" para "Buscar..." (mais curto)
  - Adicionado min-w-0 para permitir que o campo encolha corretamente


## Sistema de Crop para Imagens (Perfil e Capa)

- [x] Instalar biblioteca react-easy-crop
- [x] Criar componente ImageCropModal reutilizável
- [x] Implementar modal de crop com zoom e movimentação
- [x] Integrar crop para foto de perfil (proporção 1:1, máscara circular)
- [x] Integrar crop para foto de capa (proporção 16:9)
- [x] Adicionar validação de tamanho máximo (8MB)
- [x] Adicionar validação de largura mínima (1200px para capa)
- [x] Comprimir imagem após recorte (JPEG 90%)
- [x] Atualizar preview imediatamente após confirmar
- [x] Testar funcionalidade completa - 130 testes passando


## Bug Desktop - Endereço Truncado

- [x] Corrigir endereço truncado na versão desktop do menu público
  - Aumentado max-width progressivo: 180px (mobile) → 400px (sm) → 500px (md) → sem limite (lg+)

## Campos de Endereço Obrigatórios

- [x] Tornar campos de endereço obrigatórios (exceto complemento)
  - Rua (obrigatório)
  - Número (obrigatório)
  - Bairro (obrigatório)
  - Cidade (obrigatório)
  - Estado (obrigatório)
  - CEP (obrigatório)
  - Complemento (opcional)
- [x] Adicionar indicador visual de campo obrigatório (*)
- [x] Validar antes de salvar com mensagem de erro listando campos faltantes


## Link do Endereço para Google Maps

- [x] Tornar endereço clicável no menu público para abrir no Google Maps
  - Endereço agora é um link que abre no Google Maps em nova aba
  - Efeito hover com underline e mudança de cor
  - Tooltip "Abrir no Google Maps"


## Bug - Badge de Pedidos Não Atualiza

- [x] Corrigir badge de pedidos que só conta o primeiro pedido via SSE
  - Problema: stale closure no callback do useOrdersSSE
  - Solução: usar useRef para manter contagem atualizada
- [x] Badge deve incrementar para cada novo pedido recebido
  - countRef.current mantém valor atualizado entre renders
- [x] Atualmente só atualiza após F5 (refresh da página)
  - Corrigido: agora atualiza em tempo real via SSE


## Bug - Status Cancelado Aparece como Entregue

- [x] Corrigir pedido cancelado que aparece como "entregue" no modal Meus Pedidos
  - Filtro de "Em andamento" agora exclui pedidos cancelados
  - Pedidos cancelados vão para o Histórico junto com entregues
- [x] Status deve mostrar "Cancelado" corretamente sem precisar clicar em "Acompanhar"
  - Texto "Cancelado" em vermelho
  - Borda lateral vermelha para pedidos cancelados


## Modais do Fluxo de Pedido - Não Fechar ao Tocar Fora

- [x] Impedir que modais do fluxo de pedido fechem ao tocar fora do modal
  - Modal de Informações
  - Modal de Cupom
  - Modal de Meus Pedidos
  - Modal de Acompanhar Pedido
  - Modal de Avaliações
- [x] Modais devem fechar apenas pelo botão X


## Bug - Placeholder do Campo de Busca Mobile

- [x] Corrigir placeholder do campo de busca no mobile para mostrar "Buscar no cardápio" completo


## Bug - Largura do Campo de Busca Mobile

- [x] Aumentar largura do campo de busca no mobile para mostrar placeholder "Buscar no cardápio" completo
  - Adicionado min-w-[180px] para garantir largura mínima
  - Removido truncate do placeholder
  - Spacer escondido no mobile para dar mais espaço ao campo


## Dropdown de Pré-visualização na Busca

- [x] Implementar dropdown com resultados da busca enquanto usuário digita
  - Mostra até 6 resultados com link "+ X outros resultados"
  - Ao clicar no item, abre o modal do produto
- [x] Exibir título, descrição e preço de cada item
  - Título em negrito, descrição em cinza abaixo
- [x] Preço na lateral direita, centralizado verticalmente
  - Preço em vermelho, fonte semibold
- [x] Botão X para limpar a busca
- [x] Mensagem "Nenhum produto encontrado" quando sem resultados


## Bug - Badge Conta Pedidos Cancelados

- [x] Corrigir badge de pedidos para não contar pedidos cancelados
  - Filtro atualizado para excluir status 'delivered' E 'cancelled'
- [x] Badge deve mostrar apenas pedidos em andamento (não entregues e não cancelados)
  - Corrigido no desktop e mobile


## Novo Comportamento da Sacola Mobile

- [x] Abrir sacola automaticamente apenas quando primeiro item é adicionado (sacola vazia)
  - Estado bagAutoOpenEnabled controla se auto-open está habilitado
- [x] Adicionar botão "Adicionar mais itens" no modal da sacola
  - Botão com borda vermelha e ícone de +
- [x] Ao clicar em "Adicionar mais itens", fechar modal e desativar auto-open
  - setBagAutoOpenEnabled(false) ao clicar
- [x] Sacola só abre manualmente após o primeiro item
  - Auto-open só funciona quando bagAutoOpenEnabled é true


## Alterar Exibição de Estrelas no Menu Público

- [x] Substituir 5 estrelas por apenas 1 ícone de estrela na exibição de avaliações
  - Removida lógica de estrelas cheias/vazias/meia
  - Agora exibe apenas 1 estrela amarela + nota numérica


## Modais de Checkout - Não Fechar ao Clicar Fora

- [x] Impedir que modais do fluxo de checkout fechem ao clicar fora
  - Resumo do Pedido
  - Tipo de Entrega
  - Confirmar Endereço
  - Seus Dados
  - Confirmação
  - Removido onClick do backdrop do modal unificado de checkout


## Modais de Checkout - Estilo Bottom Sheet

- [x] Alterar modais de checkout para estilo bottom sheet (de baixo para cima)
  - Container com items-end no mobile, items-center no desktop
  - Animação slide-in-from-bottom
  - Bordas arredondadas apenas no topo no mobile
- [x] Aplicar mesmo estilo do modal da sacola mobile


## Modal Acompanhar Pedido - Estilo Bottom Sheet

- [x] Alterar modal de acompanhar pedido para estilo bottom sheet
  - Container com items-end no mobile, items-center no desktop
  - Animação slide-in-from-bottom
  - Bordas arredondadas apenas no topo no mobile


## Modal Meus Pedidos - Estilo Bottom Sheet

- [x] Alterar modal de Meus Pedidos para estilo bottom sheet

## Texto Avaliações no Mobile

- [x] Restaurar texto "Avaliações" no botão de avaliações na versão mobile

## Bug: Scroll no Modal Meus Pedidos

- [x] Corrigir scroll do modal Meus Pedidos que está rolando a página de fundo em vez do conteúdo do modal

## Modal de Produto - Estilo Bottom Sheet

- [x] Alterar modal de detalhes do produto para estilo bottom sheet no mobile

## Ícone Loading no Modal Meus Pedidos

- [x] Adicionar ícone de loading animado ao lado do título "Em andamento"

## Altura da Foto no Modal de Produto

- [x] Aumentar altura da foto do produto em 40% no modal de detalhes do item

## Ajuste Adicional da Altura da Foto

- [x] Aumentar altura da foto do produto em 50% (do valor original)

## Visualização em Tela Cheia da Foto do Produto

- [x] Adicionar ícone de olho com transparência na foto do produto
- [x] Implementar modal de visualização em tela cheia ao clicar na foto

## Ajuste Altura da Foto Mobile

- [x] Aumentar altura da foto do produto em 40% apenas na versão mobile

## Bug: Categoria não selecionada ao editar item

- [x] Corrigir bug onde a categoria não fica selecionada ao editar item do cardápio, fazendo o item ir para "Sem categoria"

## Bug: Categoria ainda não selecionada ao editar item (continuação)

- [x] Investigar por que a categoria não está sendo selecionada ao editar item
- [x] Corrigir definitivamente o bug de categoria

## Arrastar Produtos Entre Categorias

- [x] Implementar drag-and-drop de produtos entre categorias diferentes
- [x] Atualizar categoryId do produto ao soltar em outra categoria
- [x] Adicionar feedback visual durante o arraste entre categorias

## Modal de Informações - Estilo Bottom Sheet

- [x] Alterar modal de informações do menu público para estilo bottom sheet no mobile

## Modais Bottom Sheet - Avaliações e Cupom

- [x] Alterar modal de avaliações para estilo bottom sheet no mobile
- [x] Alterar modal de cupom para estilo bottom sheet no mobile

## Bug: Scroll no Modal de Detalhes do Produto

- [x] Corrigir scroll do modal de detalhes do produto que está movendo a página de fundo

## Fechar Modal ao Clicar Fora

- [x] Adicionar funcionalidade de fechar modal de detalhes do item ao clicar no backdrop

## Bug: Badge de Pedidos não Atualiza em Tempo Real

- [x] Investigar por que o badge de contagem de pedidos não atualiza quando novo pedido chega
- [x] Corrigir a atualização em tempo real do badge de pedidos
- [x] Adicionar SSE ao Dashboard para atualizar pedidos recentes em tempo real

## Bug: Badge no Menu Lateral não Aparece

- [x] Investigar por que o badge no menu lateral não aparece quando novos pedidos chegam via SSE
- [x] Corrigir a atualização do badge no menu lateral em tempo real
- [x] Garantir que o badge apareça imediatamente quando um novo pedido chega

## Atualização em Tempo Real do Modal Acompanhar Pedido
- [x] Implementar listener SSE no modal de acompanhamento para receber atualizações de status
- [x] Atualizar status visual do pedido automaticamente sem fechar/abrir modal
- [x] Usar conexão SSE existente (sem criar novas conexões)

## Correção da Observação no Modal da Sacola
- [x] Exibir observação do item imediatamente no modal "Sua Sacola" após adicionar
- [x] Garantir que a observação apareça junto com o item na sacola

## Remover Botão Voltar do Modal de Confirmação
- [x] Remover botão "Voltar" do step 5 (Enviar) do modal de checkout
- [x] Manter apenas o botão "Enviar pedido"

## Correção do Erro de Validação ao Enviar Pedido
- [x] Investigar erro "The string did not match the expected pattern"
- [x] Corrigir validação que está causando o erro (removido type=tel que causava validação nativa do navegador)

## Correção do Sistema de Avaliação
- [x] Ocultar botão de avaliação quando cliente já avaliou nos últimos 30 dias
- [x] Corrigir verificação de avaliação existente antes de exibir formulário
- [x] Adicionar estado de loading enquanto verifica se pode avaliar
- [x] Melhorar tratamento de erro quando já avaliou

## Alteração da Cor do Drop Zone no Catálogo
- [x] Mudar cor da área de drop de vermelho para verde quando item estiver pronto para soltar
- [x] Manter vermelho apenas para estado inicial "Solte aqui para mover"

## Ícone Animado para Status "Saiu para Entrega"
- [x] Alterar ícone do status 'out_for_delivery' para Bike com animação bounce e ping
- [x] Usar cor violet-600 para o ícone principal e violet-400 para o ping
- [x] Alterar cor do texto do status para violet-600 quando estiver em entrega

## Verificação da Atualização em Tempo Real do Modal Acompanhar Pedido
- [x] Verificar implementação atual dos useEffects para atualização de status
- [x] Corrigir lógica de sincronização do orderStatus quando SSE atualiza userOrders
- [x] Adicionar ref para showTrackingModal para evitar problemas de closure
- [x] Usar callback no setOrderStatus para evitar stale closure

## Correção do Badge de Novos Pedidos no Menu Lateral
- [x] Investigar hook useOrdersSSE que bloqueia registro de múltiplos listeners
- [x] Permitir que cada componente (NewOrdersContext, Dashboard, Pedidos) registre seu próprio listener
- [x] Garantir que badge atualize imediatamente quando novo pedido chega via SSE

## Garantir Funcionamento Simultâneo de Badge e Modal Acompanhar Pedido
- [x] Verificar se refs showTrackingModalRef e currentOrderNumberRef estão implementadas
- [x] Garantir que atualização em tempo real do modal funcione junto com badge
- [x] Adicionar método updateCallback no orderSSE para substituir callbacks existentes
- [x] Adicionar useEffect para atualizar callbacks quando modal abre/fecha

## Correção Final do Badge de Novos Pedidos
- [ ] Investigar por que o badge não aparece após correções do modal
- [ ] Garantir que ambas funcionalidades (badge e modal) funcionem simultaneamente

## Correção do Modal Acompanhar Pedido (Atualização em Tempo Real)
- [x] Investigar por que o modal não atualiza quando status muda via página de pedidos
- [x] Corrigir lógica de atualização do modal via SSE
- [x] Separar useEffect de inicialização SSE do useEffect de atualização de callbacks
- [x] Garantir que cleanup só ocorra quando componente desmonta, não quando userOrders muda
- [x] Testado e verificado: SSE mantém conexão ativa e atualiza status em tempo real

## Correção Definitiva do SSE no Modal Acompanhar Pedido
- [ ] Analisar implementação atual do listener SSE no modal
- [ ] Garantir que o modal registre seu próprio listener no SSE
- [ ] Manter listener ativo enquanto modal está aberto
- [ ] Atualizar estado interno do modal sem depender de navegação
- [ ] Cleanup só deve rodar ao fechar o modal, não ao atualizar estado
- [ ] Testar com modal aberto enquanto status muda em outra máquina/aba

## Correção Definitiva do SSE no Modal Acompanhar Pedido (CONCLUÍDO)
- [x] O modal registra seu próprio listener no SSE via addCallback
- [x] O modal mantém o listener ativo enquanto está aberto
- [x] O listener atualiza o estado interno do modal sem depender de navegação
- [x] Cleanup só roda ao fechar o modal (não ao atualizar estado)
- [x] Testado com sucesso: modal atualiza em tempo real quando status muda em outra máquina

## Correção SSE após Refresh da Página (Em Progresso)
- [x] Identificado problema: addCallback não iniciava conexão SSE após refresh
- [x] Corrigido addCallback para sempre verificar e reconectar se necessário
- [ ] Testar correção com usuário

## Correção SSE - Modal Aberto Depois do Envio do Pedido
- [ ] Buscar status atual do pedido no backend ao abrir o modal
- [ ] Registrar listener SSE dedicado sempre que o modal abrir
- [ ] Garantir que SSE funcione independente de quando o pedido foi criado
- [ ] Testar fluxo: enviar pedido → não abrir modal → restaurante muda status → abrir modal depois

## Correção SSE - Modal Aberto Depois (Atualização em Tempo Real)
- [x] Servidor envia status atual de cada pedido quando cliente se conecta ao SSE
- [x] Modal mostra status correto mesmo quando aberto muito tempo depois do pedido
- [x] Atualização em tempo real quando status muda enquanto modal está aberto

## Bug: SSE para de funcionar após primeiros pedidos
- [x] Corrigir acúmulo de callbacks no orderSSE.ts
- [x] Garantir cleanup correto de listeners antigos quando modal fecha
- [x] Garantir que callbacks sejam associados ao pedido correto
- [x] Testar com múltiplos pedidos sequenciais

## Bug: Badge de pedidos novos não atualiza na sidebar
- [x] Badge não atualiza quando status do pedido muda de "Novo" para "Em preparo"
- [x] Invalidar query de contagem quando status do pedido é atualizado

## Bug: Regressão no SSE do modal de acompanhar pedido
- [ ] Modal de acompanhar pedido parou de atualizar em tempo real após correção do badge
- [ ] Investigar causa da regressão

## Ajuste visual: Cores do modal de acompanhar pedido
- [x] Status "Pedido Finalizado" deve ser verde (não roxo)
- [x] Ícone de check do "Pedido Finalizado" deve ser verde (não cinza)

## Bug: Sistema de avaliação não aparece para novos clientes
- [x] Botão "Avaliar restaurante" não aparece quando pedido é entregue para novos clientes
- [x] Investigar lógica de canReview e canReviewChecked
- [x] Melhorar tratamento de resposta da API canReview com fallback para permitir avaliar

## Bug: Erro 400 na API canReview por caracteres especiais no telefone
- [x] Normalizar telefone removendo caracteres especiais antes de enviar para API canReview
- [x] Corrigir formato do input para tRPC (wrapper json)
- [x] Corrigir parsing da resposta para formato tRPC com superjson
- [x] Buscar reviews tanto por telefone normalizado quanto original (compatibilidade)
- [x] Corrigir frontend para enviar telefone original (não normalizado) para API canReview

## Feature: Notificação sonora para novos pedidos
- [x] Adicionar arquivo de áudio de notificação
- [x] Implementar lógica para tocar som quando novo pedido chegar
- [x] Integrar com sistema SSE de novos pedidos
- [x] Adicionar opção para ativar/desativar som nas configurações
- [x] Corrigir notificação sonora no mobile (autoplay bloqueado)
- [x] Adicionar botão de ativação de som no header do admin

## Bug: Ícone de som não atualiza corretamente
- [x] Mobile: ícone permanece o mesmo ao ativar/desativar
- [x] Desktop: ícone de som ligado permanece após desativar
- [x] Solução: Adicionado estado local isSoundEnabled sincronizado com localStorage

## Bug: Container "Tem um cupom?" não aparece no mobile
- [x] Verificar classes de visibilidade do container de cupom
- [x] Corrigir para aparecer em todas as resoluções
- [x] Adicionar seção de cupom no modal da sacola mobile (showMobileBag)

## Bug: Som de notificação tocando no menu público
- [x] Som deve tocar apenas no painel administrativo
- [x] Remover/desabilitar som no menu público quando pedido é enviado
- [x] Solução: Verificar locationRef antes de tocar som (ignora rotas /menu/*)

## Bug: Modal de cupom aparece atrás do modal da sacola
- [x] Aumentar z-index do modal de cupom para aparecer na frente da sacola
- [x] Solução: Alterado z-index de z-[100] para z-[110]

## Feature: Botão "Pedir novamente" no modal de pedidos
- [x] Adicionar botão "Pedir novamente" no modal de detalhes do pedido
- [x] Ao clicar, adicionar itens do pedido à sacola
- [x] Abrir modal de resumo do pedido automaticamente
- [x] Botão adicionado em pedidos em andamento (ao lado de "Acompanhar")
- [x] Botão adicionado no histórico (exceto pedidos cancelados)

## Melhoria: Preencher dados do pedido anterior ao clicar em "Pedir novamente"
- [x] Preencher tipo de entrega (pickup/delivery)
- [x] Preencher forma de pagamento (cash/card/pix)
- [x] Preencher nome e telefone do cliente
- [x] Preencher endereço de entrega (se delivery)
- [x] Preencher observação do pedido

## Ajuste: Botão "Pedir novamente" apenas em pedidos finalizados
- [x] Remover botão dos pedidos em andamento
- [x] Manter botão apenas em pedidos entregues ou cancelados
- [x] Pedidos em andamento agora mostram apenas "Acompanhar pedido"

## Bug: Botão "Pedir novamente" não aparece em pedidos cancelados
- [x] Verificar condição que oculta o botão em pedidos cancelados
- [x] Corrigir para exibir botão em pedidos cancelados também
- [x] Removida condição order.status !== 'cancelled' do histórico

## Bug: Modal de Meus Pedidos ocupa tela toda no mobile
- [x] Adicionar altura máxima ao modal (max-h-[85vh])
- [x] Adicionar botão de fechar (X) no header do modal (já existia)
- [x] Garantir que área de clique para fechar fique visível
- [x] Solução: Adicionado padding p-4 pt-16 no container para deixar espaço no topo
- [x] Backdrop agora fecha o modal ao clicar

## Ajuste: Modal de Meus Pedidos como bottom sheet
- [x] Manter modal ancorado na parte inferior (bottom sheet)
- [x] Adicionar espaço no topo para área clicável de fechar (max-h-[80vh])
- [x] Manter altura máxima para não ocupar tela toda
- [x] Cantos arredondados apenas no topo no mobile (rounded-t-2xl)

## Bug: Observação do item não aparece no modal de Confirmar Endereço
- [x] Exibir observação do item (item.observation) na seção Itens do checkoutStep 3
- [x] Mostrar abaixo do nome do item, como no modal de Resumo
- [x] Adicionado "Obs: {item.observation}" em texto cinza claro

## Bug: Som toca mesmo quando ícone está desativado
- [x] Investigar sincronização entre estado visual e lógica de reprodução
- [x] Verificar se localStorage está sendo lido corretamente
- [x] Corrigir para respeitar a preferência do usuário
- [x] Solução: Adicionado método isSoundEnabled() no NotificationAudioManager
- [x] Verificação do localStorage antes de tocar pendingPlay
- [x] Limpa pendingPlay mesmo quando som está desabilitado

## Bug persistente: Som ainda toca quando desativado
- [x] Investigar todos os pontos onde playNotificationSound é chamado
- [x] Verificar se há outro lugar tocando o som além do NotificationAudioManager
- [x] Corrigir definitivamente
- [x] Causa: Pedidos.tsx tinha código duplicado tocando som diretamente sem verificar preferência
- [x] Solução: Removido código duplicado em Pedidos.tsx, som agora é gerenciado apenas pelo NewOrdersContext

## Ajuste: Modal de Detalhes do Pedido desktop igual ao mobile
- [x] Reduzir largura do modal no desktop (sm:max-w-md)
- [x] Reorganizar cards em layout vertical (um abaixo do outro)
- [x] Ordem: Info Cliente > Detalhes Pagamento > Info Entrega > Itens > Preço > Status

## Ajuste: Botões Imprimir e WhatsApp no modal de Detalhes do Pedido
- [x] Fixar footer na parte inferior do modal
- [x] Botões devem ficar sempre visíveis na parte de baixo
- [x] Solução: flex flex-col no SheetContent, flex-1 no conteúdo, mt-auto no footer

## Bug: Impressão do pedido imprime página toda
- [x] Criar função de impressão específica para o pedido
- [x] Imprimir apenas: número do pedido, itens, preços, total, dados do cliente
- [x] Formato de cupom/recibo para impressora térmica (300px largura, fonte Courier)

## Melhoria: Novo layout do recibo de impressão
- [x] Logo do estabelecimento no topo (Cardápio - Sistema de Pedidos)
- [x] Pedido # com data/hora
- [x] Itens com adicionais e observações individuais
- [x] Valores: subtotal, desconto, taxa entrega, total
- [x] Seção Observações gerais
- [x] Seção Entrega com endereço completo
- [x] Seção Forma de pagamento
- [x] Seção Cliente com nome e telefone
- [x] Footer com nome do sistema (manus.space)

## Bug: Cliente consegue fazer pedido com restaurante fechado
- [x] Adicionar validação no backend (orders.create) para verificar se restaurante está aberto
- [x] Adicionar validação no frontend para bloquear botão de finalizar quando fechado (já existia)
- [x] Mostrar mensagem clara para o cliente quando restaurante está fechado
- [x] Criar função getEstablishmentById no db.ts
- [x] Invalidar cache do estabelecimento quando erro de "fechado" ocorrer

## Ajuste: Nome do restaurante no topo do recibo
- [x] Substituir "Cardápio" pelo nome do estabelecimento no recibo de impressão

## Melhoria: Mensagem de restaurante fechado no modal
- [x] Substituir alert() por estado de erro no modal de confirmação
- [x] Exibir mensagem de "restaurante fechado" dentro do modal
- [x] Mostrar botão para voltar ao carrinho
- [x] Ícone XCircle vermelho para indicar erro
<<<<<<< Updated upstream

- [x] Corrigir bug do ícone de som que ativa automaticamente ao navegar entre páginas no painel administrativo
- [x] Corrigir exibição do número do pedido com dois ## (##P235 → #P235) no card e modal de detalhes
- [x] Ocultar card de pedidos cancelados na versão mobile (exibir apenas no desktop)
- [x] Adicionar ícone de lápis ao lado direito do nome das categorias na página de Catálogo
- [x] Adicionar funcionalidade de excluir categorias na página de Catálogo
- [x] Usar imagem placeholder igual à do perfil do restaurante para itens do catálogo sem foto
- [x] Aplicar mesmo estilo de placeholder de imagem do catálogo aos produtos sem foto no cardápio público
- [x] Aplicar placeholder de imagem no modal de detalhes do produto no cardápio público
- [x] Adicionar animação de pulso suave ao ícone do placeholder de produtos sem foto
- [x] Corrigir barra lateral minimizada para mostrar apenas ícone de abrir, sem a foto do restaurante
- [x] Adicionar animação de transição suave ao expandir e recolher a barra lateral
- [x] Corrigir exibição dos itens de complementos na página de edição do produto (itens não aparecem dentro dos grupos)
- [x] Corrigir salvamento de novos grupos de complementos ao editar produto (complementos não são persistidos)
- [x] Adicionar visualização dos grupos de complementos no container de Preview do ProductForm em tempo real
- [x] Remover container extra do preview do item para ocupar toda a largura
- [x] Implementar interação no preview para simular seleção de itens como o cliente
- [x] Calcular total dinâmico no preview conforme itens são selecionados
- [x] Adicionar scroll automático no preview quando o conteúdo for muito longo
- [x] Corrigir preço do produto no preview mostrando R$ 0,00 em vez do valor digitado
- [x] Implementar formatação automática de preço em centavos no campo de preço dos itens de complemento (500 → 5,00)

## Bug - Complementos não aparecem nos detalhes do pedido
- [x] Investigar estrutura de dados do pedido e complementos
- [x] Verificar salvamento dos complementos ao criar pedido no cardápio público
- [x] Corrigir exibição dos complementos nos detalhes do pedido (modal/sheet)
- [x] Confirmado: Novos pedidos exibem complementos corretamente (pedidos antigos não tinham dados salvos)

## Ocultar preço R$ 0,00
- [x] Ocultar preço quando for R$ 0,00 na lista de produtos do catálogo administrativo
- [x] Ocultar preço quando for R$ 0,00 no cardápio público


## Ocultar preço R$ 0,00 na sacola
- [x] Ocultar preço quando for R$ 0,00 na lista de itens da sacola do cardápio público


## Ocultar preço R$ 0,00 no modal de resumo do pedido
- [x] Ocultar preço quando for R$ 0,00 na lista de itens do modal de resumo do pedido
- [x] Ocultar preço quando for R$ 0,00 na lista de pedidos ativos e histórico


## Ocultar preço R$ 0,00 no modal Meus Pedidos
- [x] Ocultar preço quando for R$ 0,00 na lista de itens do modal Meus Pedidos
- [x] Ocultar preço quando for R$ 0,00 na etapa de confirmação do pedido (step 5)


## Exibir complementos no modal Meus Pedidos
- [x] Adicionar exibição dos complementos selecionados na lista de itens do modal Meus Pedidos (em andamento e histórico)


## Bloquear adição à sacola quando item tem preço zero sem complemento
- [x] Desabilitar botão "Adicionar" quando item tem preço zero e nenhum complemento foi selecionado
- [x] Exibir mensagem "Selecione uma opção" no botão quando bloqueado


## Incluir complementos na impressão do pedido
- [x] Adicionar complementos selecionados no recibo impresso do pedido


## Exibir preço dos complementos na impressão
- [x] Mostrar preço individual de cada complemento no recibo impresso


## Reorganizar modal de detalhes do pedido
- [x] Mover container "Itens do Pedido" para cima do container "Detalhes do Pagamento"


## Reorganizar modal de detalhes do pedido (v2)
- [x] Mover container "Itens do Pedido" para cima do container "Informações de Entrega"


## Ocultar preço unitário zero no modal de detalhes do pedido
- [x] Ocultar linha "R$ 0,00 x 1" quando o preço unitário do item for zero


## Adicionar cores aos containers do modal de detalhes do pedido
- [x] Informações do Cliente - cor azul clara (bg-blue-50/50)
- [x] Itens do Pedido - cor amarela/laranja clara (bg-amber-50/50)
- [x] Informações de Entrega - cor verde clara (bg-emerald-50/50)
- [x] Detalhes do Pagamento - cor roxa clara (bg-purple-50/50)
- [x] Status do Pedido - manter neutro


## Adicionar preços dos complementos no modal Meus Pedidos
- [x] Exibir valor unitário de cada complemento no modal Meus Pedidos do cardápio público (em andamento e histórico)


## Ocultar preço zero no modal de Preview da edição do item
- [x] Ocultar preço quando for R$ 0,00 no modal de Preview da página de edição do item


## Duplicar item com grupos e complementos
- [x] Modificar função de duplicação para copiar grupos de complementos
- [x] Modificar função de duplicação para copiar itens dos complementos


## Bug: Complementos desaparecem ao serem adicionados a um item
- [x] Corrigir bug onde complementos desapareciam ao serem adicionados a um item
- [x] Modificar função getComplementGroupsByProduct para incluir itens diretamente na resposta
- [x] Resolver conflito de merge no ProductForm.tsx


## Drag & Drop para Itens de Complemento
- [x] Implementar funcionalidade de arrastar e soltar para reordenar itens de complemento
- [x] Adicionar campo sortOrder na tabela complementItems (ordem baseada na posição do array)
- [x] Persistir ordem no banco de dados ao salvar

## Bug: Drag & Drop não mantém nova posição
- [x] Corrigir bug onde itens voltam para posição original após soltar

## Bug: Novos complementos adicionados no meio da lista
- [x] Corrigir para que novos complementos sejam adicionados no final da lista

## Melhoria: Permanecer na página de edição após salvar
- [x] Remover redirecionamento para /catalogo após salvar alterações de um produto

## Melhoria: Tooltip de informação no campo de Preço
- [x] Adicionar ícone de informação (i) ao lado do campo de Preço
- [x] Implementar tooltip com texto explicativo sobre itens com preço R$ 0,00

## Melhoria: Validação do campo Máx em complementos
- [x] Limitar campo Máx para não ser maior que a quantidade de itens no grupo

## Melhoria: Prefixo R$ no campo de preço dos complementos
- [x] Adicionar prefixo R$ ao campo de preço dos itens de complemento

#### Melhoria: Modal de visualização de fotos do item
- [x] Adicionar indicadores visuais de navegação (setas ou pontos) para mostrar que há mais fotos
- [x] Adicionar contador de fotos no canto inferior direito (ex: "1/3")
- [x] Adicionar suporte para arrastar/deslizar entre as fotos

## Foto nos Itens de Complemento
- [x] Adicionar campo imageUrl no schema de complementItems
- [x] Implementar upload de foto no formulário de complementos (admin)
- [x] Adicionar indicador minimalista na lista de complementos (check se tem foto, placeholder se não)
- [x] Exibir foto do complemento selecionado no modal do menu público
- [x] Fallback para foto do produto quando complemento não tiver foto


## Ajuste: Remover indicadores visuais de foto do complemento no menu público
- [x] Remover badge "Foto do complemento" da imagem do produto
- [x] Remover ícone de foto ao lado do item de complemento na seleção


## Bug: Nova categoria aparece no início da lista
- [x] Corrigir para que novas categorias sejam adicionadas no final da lista
- [x] Calcular sortOrder baseado na última categoria existente

## Ajuste: Aumentar tamanho dos títulos das categorias no menu público
- [x] Aumentar tamanho dos títulos das categorias na lista vertical em 20%

## Bug: Grupos de complementos duplicados ao salvar produto
- [x] Investigar duplicação de grupos no produto 120102
- [x] Corrigir lógica de salvamento para evitar duplicação
- [x] Atualizar estado local com IDs dos novos grupos após criação
- [x] Invalidar query para recarregar dados do servidor
- [x] Remover grupos duplicados do banco de dados


## Melhoria: Busca ignorando acentos no menu público
- [x] Implementar normalização de acentos na busca de produtos
- [x] Buscar "agua" deve encontrar "água" e vice-versa


## Ajuste: Botão de adicionar responsivo em telas pequenas
- [x] Ocultar texto "Adicionar" em telas pequenas (< 360px)
- [x] Manter apenas símbolo "+" e preço em dispositivos móveis


## Melhoria: Priorizar resultados de busca por início do nome
- [x] Priorizar itens cujo nome começa com o termo buscado
- [x] Ordenar: 1º nomes que começam com termo, 2º nomes que contém termo, 3º descrições que contém termo


## Bug: Avaliações aparecem mesmo após exclusão + formato da nota
- [x] Investigar por que nota e quantidade de avaliações continuam aparecendo após exclusão (dados cacheados na tabela establishments)
- [x] Atualizar rating e reviewCount para 0 no estabelecimento 30001
- [x] Mudar formato da nota de vírgula (5,0) para ponto (5.0)


## Restaurar modal bottom sheet ao clicar no endereço
- [x] Restaurar comportamento anterior com modal estilo bottom sheet
- [x] Exibir opções de navegação (Google Maps, Waze, Apple Maps) no modal
- [x] Adicionar botão para copiar endereço


## Seleção de endereço via Google Maps nas configurações
- [x] Adicionar campos latitude e longitude no schema de establishments
- [x] Criar componente AddressMapPicker com Google Maps
- [x] Integrar Places Autocomplete para busca de endereços
- [x] Preencher campos de endereço automaticamente ao selecionar no mapa
- [x] Salvar coordenadas para navegação precisa
- [x] Atualizar modal de navegação no menu público para usar coordenadas


## Bug: Scroll do modal de navegação afeta conteúdo de fundo
- [x] Bloquear scroll do body quando modal de navegação estiver aberto
- [x] Permitir scroll apenas dentro do modal


## Melhoria: Ícones oficiais no modal de navegação
- [ ] Adicionar ícone oficial do Google Maps
- [ ] Adicionar ícone oficial do Waze
- [ ] Adicionar ícone oficial do Apple Maps

## Ícones do Modal de Navegação
- [x] Substituir ícones genéricos pelos ícones oficiais do Google Maps, Waze e Apple Maps no modal de navegação

## Layout do Cabeçalho do Menu Público
- [x] Corrigir layout para que estrela/avaliações e ícone de compartilhar fiquem na mesma linha do nome do restaurante em telas menores (só quebrar linha quando nome for muito grande)

## Badge de Entrega e Retirada
- [x] Reposicionar badge "Entrega e Retirada" para o canto superior direito do card de informações no mobile, como destaque flutuante na borda
- [x] Redesenhar badge "Entrega e Retirada" como etiqueta/ribbon encaixada na borda direita do card no mobile (estilo tag parcialmente para fora)
- [x] Ajustar badge "Entrega e Retirada" para ficar como aba de pasta no topo direito do card (estilo folder tab)
- [x] Ajustar z-index do badge para parecer estar atrás do card (efeito de aba de pasta saindo por trás)
- [x] Ajustar posição vertical da aba para ficar perfeitamente alinhada com o topo do card
- [x] Ajustes visuais finos na aba de Entrega/Retirada (tamanho, padding, posição) via editor visual
- [x] Alterar texto "Entrega" para "Delivery" na aba de serviços
- [x] Ajustes finos de posicionamento da aba (marginTop: -29px, marginRight: -2px) via editor visual
- [x] Adicionar ícone de motocicleta ao lado esquerdo do texto "Delivery e Retirada" na aba do menu público
- [x] Adicionar animação sutil no ícone de motocicleta para chamar mais atenção
- [x] Ajustar posição do texto e ícone para ficarem mais para cima dentro do container da aba (paddingTop: 0px, paddingBottom: 10px)
- [x] Implementar lógica para exibir texto e ícone corretos baseado nas opções de atendimento (Somente Delivery com moto, Somente Retirada com caixa, ou ambos com moto)
- [x] Ajustes visuais no badge desktop (borderRadius: 8px, height: 21px) via editor visual
- [x] Alterar a foto ao lado do campo de busca para usar placeholder padrão (reservado para logo do restaurante)
- [x] Ajustes visuais no header: logo placeholder 37x37px e input de busca altura 37px via editor visual
- [x] Alterar texto "Loja fechada no momento" para "Fechado no momento" via editor visual

## Sistema de Horários de Funcionamento
- [x] Criar tabela no banco de dados para horários de funcionamento por dia da semana (businessHours)
- [x] Criar procedures no backend para salvar e buscar horários
- [x] Adicionar seção de horários na página de Configurações (aba Atendimento) com toggles e campos de horário
- [x] Implementar lógica dinâmica de mensagem no menu público (Aberto agora / Fechado - Abriremos hoje às X / Fechado hoje - Abriremos amanhã às X)

## Bug: establishmentId undefined ao salvar horários
- [x] Corrigir erro de establishmentId undefined ao salvar horários de funcionamento na página de configurações
- [x] Corrigir erro de query de horários de funcionamento (Invalid input: expected object, received undefined)
- [x] Corrigir lógica de verificação de status aberto/fechado no menu público (tabela business_hours não existia no banco de dados)

## Correção: Sistema de horários de funcionamento
- [x] Implementar lógica automática de verificação de horários no menu público (isCurrentlyOpen)
- [x] Substituir uso de establishment.isOpen por cálculo dinâmico baseado nos horários configurados

## Efeito Visual no Container Delivery/Retirada
- [x] Adicionar efeito pulsante no container de Delivery/Retirada no menu público (apenas versão mobile)

## Padronização de Ícones
- [x] Padronizar ícones de garfo e faca (UtensilsCrossed) em todo o menu público (header, placeholder de produtos, etc.)

## Correção de Z-Index
- [x] Corrigir z-index do dropdown de Redes Sociais para aparecer na frente do menu de categorias (mobile)

## Correção do Toggle de Status no Perfil
- [x] Modificar toggle de status no perfil para refletir automaticamente os horários de funcionamento configurados
- [x] Remover o switch manual e substituir por indicação "Automático" com tooltip explicativo

## Toggle de Fechamento Manual Forçado
- [x] Manter toggle no menu do usuário para forçar fechamento manual mesmo dentro do horário de funcionamento
- [x] Combinar lógica: se toggle desligado OU fora do horário = Fechado; se toggle ligado E dentro do horário = Aberto
- [x] Adicionar indicação "Fechado manualmente" quando forçado
- [x] Adicionar tooltip explicativo no toggle

## Card Tempo de Entrega (Configurações → Atendimento)
- [x] Adicionar campos no schema: deliveryTimeEnabled, deliveryTimeMin, deliveryTimeMax, minOrderEnabled, minOrderValue
- [x] Criar card com toggle ON/OFF e campos "De" e "Até" em minutos
- [x] Criar toggle de Pedido mínimo com campo de valor
- [x] Exibir no menu público: ícone relógio + tempo (ex: 20 - 60min) ao lado de "Aberto agora"
- [x] Exibir no menu público: ícone + "Pedi. Mínimo R$ X" ao lado do tempo de entrega

## Card Taxa de Entrega (Configurações → Atendimento)
- [x] Adicionar campos no schema: deliveryFeeType (free/fixed/byNeighborhood), deliveryFeeFixed
- [x] Criar tabela para bairros com taxas: neighborhoodFees (establishmentId, neighborhood, fee)
- [x] Criar card com 3 opções: Grátis, Fixa, Por Bairros
- [x] Opção Grátis: apenas exibir "Entrega grátis" no menu público
- [x] Opção Fixa: campo para digitar valor único
- [x] Opção Por Bairros: permitir adicionar vários bairros com preços


## Lógica Completa do Toggle Aberto/Fechado
- [ ] Adicionar campo manuallyClosed (boolean) no schema para indicar fechamento manual
- [ ] Adicionar campo manuallyClosedAt (timestamp) para saber quando foi fechado manualmente
- [ ] Implementar função para calcular próximo horário de abertura baseado nos horários conf## Lógica Completa do Toggle Aberto/Fechado
- [x] Toggle tem prioridade sobre horário automático
- [x] Fechado manualmente permanece até abrir manualmente OU até próximo horário de abertura
- [x] Reabertura automática quando chegar o próximo horário de funcionamento
- [x] Exibir mensagem "Fechado agora – Abriremos amanhã às XX:XX" no menu público
- [x] Atualizar AdminLayout com nova lógica do toggle
- [x] Adicionar campos manuallyClosed e manuallyClosedAt no schema
- [x] Criar mutation setManualClose no backend

## Ajustes Layout Mobile do Menu Público
- [x] Simplificar badge de pedido mínimo: remover texto "Min.", deixar só ícone + valor (ex: 🛒 R$30)
- [x] Mover avaliações para mesma linha do nome do restaurante (só quebrar se nome for muito longo)
- [x] Truncar nome do restaurante em telas pequenas (max-w-[180px])


## Ajustes na Sacola - Pedido Mínimo
- [x] Esconder botão "Adicionar mais itens" (vermelho vazado) quando pedido mínimo não for atingido
- [x] Mudar botão inferior para vermelho vazado quando pedido mínimo não for atingido
- [x] Mudar container de alerta de pedido mínimo para cor vermelha (combinar com botão)


## Validação de Pedido Mínimo na Sacola Desktop
- [ ] Adicionar alerta vermelho de pedido mínimo na sacola desktop
- [ ] Esconder botão "Adicionar mais itens" quando abaixo do mínimo
- [ ] Mudar botão inferior para vermelho vazado quando abaixo do mínimo


## Validação de Pedido Mínimo na Sacola Desktop
- [x] Adicionar alerta vermelho de pedido mínimo na sacola desktop
- [x] Mostrar apenas botão "Adicionar mais itens" vermelho vazado quando abaixo do mínimo
- [x] Bloquear botão "Finalizar pedido" quando abaixo do mínimo


## Sistema de Cartão Fidelidade
- [x] Criar tabela loyalty_cards no banco de dados
- [x] Criar tabela loyalty_stamps no banco de dados
- [x] Adicionar campos de fidelidade na tabela establishments
- [x] Criar endpoints tRPC para fidelidade (login, cadastro, progresso, histórico)
- [x] Criar card de configuração do Cartão Fidelidade no painel admin (Configurações)
- [x] Renomear menu "Início" para "Fidelidade" no menu público
- [x] Implementar modal bottom sheet de login/cadastro de fidelidade
- [x] Criar tela do Cartão Fidelidade com progresso visual (carimbos)
- [x] Exibir histórico de tickets ganhos
- [x] Exibir cupom disponível quando atingir meta
- [x] Integrar contagem automática de tickets ao finalizar pedido (status entregue)
- [x] Liberar cupom automaticamente ao atingir quantidade necessária


## Bug: Carimbo de Fidelidade Não Adicionado
- [ ] Investigar por que o carimbo não está sendo adicionado quando pedido é concluído
- [ ] Verificar a lógica de integração no updateOrderStatus
- [ ] Corrigir o bug e testar


## Bug: Carimbo de Fidelidade Não Aparecendo
- [x] Investigar por que o carimbo não estava sendo adicionado quando o pedido é concluído
- [x] Verificar a lógica de updateOrderStatus
- [x] Corrigir o bug (normalização de telefone e autocomplete)
- [x] Unificar cartões de fidelidade duplicados no banco de dados
- [x] Adicionar autocomplete="new-password" nos campos de senha


## Ajuste Visual do Card de Fidelidade
- [x] Mover texto "Faltam X pedidos" para dentro do card verde
- [x] Aplicar degradê no fundo do card de fidelidade
- [x] Unificar layout conforme imagem de referência


## Animações de Gamificação no Cartão Fidelidade
- [x] Adicionar efeito de pop no carimbo ao ganhar
- [x] Animar barra de progresso preenchendo
- [x] Implementar vibração suave no mobile
- [x] Criar sensação de conquista/dopamina


## Regulamento do Cartão Fidelidade
- [x] Adicionar link "Ver regulamento" discreto no card
- [x] Criar modal com regras do programa
- [x] Incluir: quantidade de carimbos necessários
- [x] Incluir: o que gera carimbo (pedidos concluídos)
- [x] Incluir: pedidos cancelados não contam
- [x] Incluir: validade do cupom


## Bug: Animações do Cartão Fidelidade
- [x] Animações só aparecem no primeiro login
- [x] Corrigir para aparecer sempre que o modal for aberto
- [x] Resetar estado de animação ao abrir modal


## Melhorias Visuais do Cartão Fidelidade
- [ ] Carimbos ativos com verde brilhante e check minimalista
- [ ] Animação de expansão + fade nos carimbos
- [ ] Layout especial de CUPOM LIBERADO com confetti
- [ ] Botões "Copiar código" e "Usar agora"
- [ ] Exibir validade do cupom


## Melhorias Visuais do Cartão Fidelidade (Carimbos)
- [x] Carimbos ativos com verde brilhante e check minimalista
- [x] Animação de expansão + fade nos carimbos
- [x] Confetti colorido ao redor dos carimbos ativos
- [x] Layout de CUPOM LIBERADO com confetti animado
- [x] Botões "Copiar código" e "Usar agora" no cupom


## Badge Verde Pulsante no Cartão Fidelidade
- [x] Adicionar ícone verde pulsante antes de "Fidelidade ativa"
- [x] Usar animação pulse do Tailwind


## Bug: Modal de CUPOM LIBERADO Não Aparece
- [x] Investigar estado do cartão e cupom no banco de dados
- [x] Verificar lógica de exibição do modal de cupom liberado
- [x] Corrigir bug para exibir modal com confetti quando completar carimbos
- [x] Criar cupom automaticamente ao completar cartão
- [x] Vincular cupom ao cartão via activeCouponId


## Redesign do Card de Cupom Liberado
- [x] Separar card de cupom do cartão de fidelidade
- [x] Aplicar visual laranja/dourado conforme referência
- [x] Header com "Parabéns! Cupom Liberado"
- [x] Código em destaque com borda tracejada laranja
- [x] Badge de presente no canto
- [x] Botões "Copiar Código" e "Usar Agora" em laranja
- [x] Texto "Válido para o seu próximo pedido"


## Ajuste de Altura do Card de Cupom
- [x] Reduzir altura do card de cupom liberado
- [x] Deixar mesma altura do cartão de fidelidade


## Ajuste de Tamanho dos Carimbos
- [x] Reduzir tamanho dos ícones de carimbo
- [x] Garantir que 10 carimbos caibam na mesma linha horizontal


## Efeito de Flip no Cartão de Fidelidade
- [ ] Implementar estrutura CSS de flip card com duas faces
- [ ] Adicionar botão "Ver cupom ganho" quando completar 100% dos carimbos
- [ ] Criar face traseira do card com código, descrição e validade do cupom
- [ ] Implementar animação de flip horizontal de 180° (300-400ms)
- [ ] Adicionar botões "Copiar código" e "Usar agora" na face traseira
- [ ] Adicionar botão/ícone para virar o cartão de volta
- [ ] Remover modal separado de "Parabéns! Cupom Liberado"
- [ ] Manter consistência visual (bordas arredondadas, sombras)

## Efeito Flip no Cartão de Fidelidade
- [x] Implementar animação de flip horizontal 180° (transform rotateY)
- [x] Adicionar botão "Ver cupom ganho" quando carimbos completos
- [x] Face frontal: carimbos e progresso
- [x] Face traseira: cupom com código, descrição, validade, botões "Copiar código" e "Usar agora"
- [x] Adicionar botão para voltar à face dos carimbos
- [x] Remover card laranja separado (cupom integrado no flip)
- [x] Animação suave de 300-400ms

## Ajuste de Altura do Modal de Fidelidade (Mobile)
- [x] Reduzir altura do cartão de fidelidade na versão mobile
- [x] Garantir que o modal não ocupe toda a altura da tela
- [x] Permitir que o usuário consiga fechar o modal facilmente

## Integração do Cupom de Fidelidade no Checkout
- [ ] Criar estado para armazenar cupom aplicado na sacola
- [ ] Implementar funcionalidade do botão "Usar agora" para aplicar cupom
- [ ] Calcular desconto baseado no tipo de cupom (percentual, fixo, frete grátis)
- [ ] Exibir cupom aplicado na sacola com opção de remover
- [ ] Validar cupom antes de aplicar (verificar se ainda é válido)
- [ ] Atualizar total do pedido com desconto aplicado

## Integração do Cupom de Fidelidade no Checkout
- [x] Conectar botão "Usar agora" com o sistema de cupons
- [x] Aplicar cupom automaticamente na sacola de compras
- [x] Fechar modal de fidelidade após aplicar cupom
- [x] Mostrar feedback visual de cupom aplicado

## Modal Bottom Sheet de Confirmação de Cupom Aplicado
- [x] Criar modal bottom sheet ao clicar em "Usar agora"
- [x] Exibir confirmação visual de cupom aplicado
- [x] Adicionar animação de entrada do bottom sheet
- [x] Fechar automaticamente após alguns segundos ou ao clicar

## Modal de Regulamento como Bottom Sheet
- [x] Converter modal de regulamento para estilo bottom sheet
- [x] Adicionar animação de entrada suave
- [x] Manter consistência visual com modal de cupom aplicado

## Correção do Scroll no Modal de Fidelidade
- [x] Bloquear scroll da página quando o modal está aberto
- [x] Evitar que a página de trás role ao rolar dentro do modal

## Correção Visual do Cartão de Fidelidade
- [x] Remover borda verde inferior do cartão
- [x] Restaurar visual original do card (sem tarja verde embaixo)

## Unificar Card de Fidelidade
- [x] Mover mensagem "Faltam X pedidos" para dentro do card principal
- [x] Remover card branco separado da mensagem
- [x] Manter visual igual à imagem de referência (card único com área cinza na parte inferior)

## Atualizar Estilo do Histórico no Cartão Fidelidade
- [x] Adicionar ícone de check verde ao lado esquerdo de cada item
- [x] Substituir o preço por "+1" (carimbo) no lado direito
- [x] Aplicar fundo cinza claro em cada item do histórico
- [x] Manter layout igual à imagem de referência

## Correção do Posicionamento da Área "Faltam X pedidos"
- [x] Mover a área cinza "Faltam X pedidos" para a parte inferior do card
- [x] Remover a área cinza de dentro do card verde
- [x] Criar estrutura de card único com duas seções (verde em cima, cinza embaixo)
- [x] Garantir que a área cinza fique colada aos carimbos, não no meio

## Consumo Automático do Cupom de Fidelidade
- [x] Adicionar parâmetro loyaltyCardId ao createOrder no backend
- [x] Implementar lógica para limpar activeCouponId do cartão após uso
- [x] Resetar os carimbos (stamps) do cartão para iniciar novo ciclo
- [x] Atualizar frontend para passar loyaltyCardId ao criar pedido
- [x] Testar fluxo completo de uso do cupom

## Ajuste de Espaçamento no Modal de Fidelidade
- [x] Reduzir espaço entre o card de fidelidade e o card de histórico

## Ajuste de Altura do Container do Card de Fidelidade
- [x] Reduzir altura fixa do container do card para eliminar espaço vazio
- [x] Garantir que o histórico fique próximo ao card de fidelidade

## Redesign do Cupom de Desconto (Estilo Voucher)
- [ ] Criar visual de voucher com duas seções (amarelo e escuro)
- [ ] Adicionar bordas serrilhadas estilo ticket
- [ ] Incluir ícones de talheres no centro
- [ ] Exibir porcentagem de desconto em destaque
- [ ] Mostrar data de validade

## Nome do Restaurante no Cupom de Desconto
- [x] Substituir "DESCONTO" pelo nome do restaurante no cupom
- [x] Dividir nome em duas linhas se for muito grande
- [x] Reduzir tamanho da fonte para nomes muito longos

## Correção das Bolinhas no Cupom
- [x] Mover recortes circulares para o lado esquerdo da seção escura

## Correção das Bolinhas no Cupom v2
- [x] Mover recortes circulares para o lado esquerdo da seção AMARELA (não da seção escura)

## Ícone de Talheres no Cupom
- [x] Substituir ícones de garfo e colher pelo ícone de talheres cruzados (garfo e faca) usado no placeholder de itens sem foto
- [x] Aplicar efeito marca d'água (transparência 20%) com animação pulsante

## Correção das Bolinhas no Cupom v3
- [x] Ajustar cor das bolinhas para a mesma cor do fundo do modal (branco) para criar efeito de recorte real

## Correção das Bolinhas no Cupom v4
- [x] Ajustar bolinhas para cor branca (cor do fundo do modal) para criar efeito visual de recorte

## Correção das Bolinhas no Cupom v5
- [x] Remover completamente as bolinhas brancas - cupom agora sem recortes circulares

## Borda Serrilhada no Cupom
- [x] Adicionar efeito de borda serrilhada ao voucher para simular cupom destacável (10 círculos brancos em cada lateral)

## Bolinhas Serrilhadas Transparentes
- [x] Ajustar bolinhas serrilhadas para serem transparentes usando técnica de máscara CSS (radial-gradient)

## Altura do Card do Cupom
- [x] Reduzir a altura do card do cupom em 16% (243px -> 204px, 280px -> 235px)

## Altura Separada para Cards de Fidelidade e Cupom
- [x] Aumentar altura do card de fidelidade (carimbos) em 16% mantendo cupom com altura atual
  - Card de carimbos: 237px/273px (mobile/desktop)
  - Card de cupom: 204px/235px (mobile/desktop)
  - Transição animada de 400ms entre os dois estados

## Ocultar Código do Cupom
- [x] Ocultar o código do cupom mantendo o espaço vazio no lugar (sem mover outros elementos)

## Serrilhado Central do Cupom
- [x] Aumentar quantidade de serrilhados na linha central do cupom (12 círculos brancos)
- [x] Remover cor verde - substituída linha tracejada por círculos brancos sólidos

## Reverter Linha Central do Cupom
- [x] Reverter para linha tracejada original (remover círculos brancos)

## Remover Efeito Verde do Cupom
- [x] Identificar e remover o efeito verde que aparece atrás do cartão de cupom (adicionado bg-white na face traseira)

## Cor das Bordas Serrilhadas do Cupom
- [x] Ajustar bordas serrilhadas (parte amarela e escura) para ficarem com a mesma cor do fundo do modal (bg-gray-100)

## Tamanho do Texto OFF no Cupom
- [x] Ajustar tamanho do texto OFF para ser igual ao tamanho do texto R$10 (text-3xl md:text-4xl)

## Bug: Botão Ver Cupom Ganho
- [x] Investigado: comportamento está CORRETO - o cliente tem 1/2 carimbos no ciclo ATUAL, mas possui um cupom ativo de um ciclo ANTERIOR que ainda não foi usado (activeCouponId = 60001)
- [x] O botão aparece corretamente porque o cliente TEM um cupom disponível para usar

## Navegação entre Múltiplos Cupons
- [x] Modificar schema para suportar múltiplos cupons ativos por cliente (coluna activeCouponIds JSON array)
- [x] Atualizar backend para retornar lista de cupons ativos (activeCoupons array)
- [x] Criar cupons adicionais para cliente de teste (88999290000) - 2 cupons: R$10 OFF e 15% OFF
- [x] Implementar setas de navegação (esquerda/direita) no modal de cupom
- [x] Mostrar indicador de quantidade de cupons (bolinhas de posição)

## Stack Visual de Cupons (Estilo Apple Wallet/Tinder)
- [x] Exibir "camadas" de cupons quando houver 2+ cupons (borda lateral direita discreta)
- [x] Implementar estrutura CouponsStack com CupomAtivo (z-index maior) e CupomSecundário (z-index menor com offset)
- [x] Animação de troca estilo card stack:
  - Cupom atual vai para trás com scale (1 → 0.92) e fade (1 → 0.7)
  - Próximo cupom vem para frente com animação inversa
  - Duração 220ms com ease-in-out
- [x] Suporte a swipe/arrastar para trocar cupons (touch events)
- [x] Apenas 1 cupom = visual limpo sem bordas ou stack


## Bugs no Modal de Cartão Fidelidade
- [x] Mover "Ver regulamento" para ficar abaixo do cartão de fidelidade (antes do histórico)
- [x] Corrigir número do pedido duplicado (##P261 → #P261) - lógica para verificar se já começa com #

## Stack Visual de Cupons v2 (Bordas Empilhadas)
- [x] Exibir bordas dos cupons atrás quando houver 2+ cupons
- [x] Deslocamento no eixo X (10px e 16px) para cada cupom atrás
- [x] Z-index menor e opacity 0.7/0.5 para cupons de trás
- [x] Mostrar 1-2 bordas atrás do cupom principal (2ª e 3ª camada)
- [x] Com 1 cupom = sem bordas atrás (stack desativado)
- [x] Com 2+ cupons = sempre mostrar bordas independente da posição atual


## Bug: Container Externo Visível na Animação do Cupom
- [x] Remover container externo (bg-gray-100) que aparece durante a animação de troca de cupons
- [x] Deixar cupom renderizado diretamente sobre o fundo do modal bottom sheet (overflow-visible)


## Remover Botões de Seta Externos do Modal de Cupons
- [x] Remover botões de seta laterais externos (fora do cupom)
- [x] Manter apenas as setas internas dentro do cupom (esquerda no lado amarelo, direita no lado escuro)


## Bug: Botão 'Ver cupom ganho' Aparece Durante Troca de Cupons
- [x] Ocultar botão 'Ver cupom ganho' quando já está visualizando os cupons (isFlipped=true)
- [x] Botão só deve aparecer quando mostrando o cartão de carimbos


## Ajuste na Pilha de Cupons - Stack Vertical
- [x] Remover borda lateral direita dos cupons atrás
- [x] Mostrar apenas borda superior (~8px) dos cupons atrás
- [x] Criar efeito de "stack" vertical indicando cupons extras
- [x] Manter animação de troca funcionando corretamente


## Remover Bordas dos Cupons Atrás
- [x] Remover completamente as bordas/tabs dos cupons que estão atrás
- [x] Manter apenas o cupom principal visível sem indicação de pilha


## Corrigir Recortes Circulares Transparentes do Voucher (v2)
- [x] Analisar toda a hierarquia de containers do cupom
- [x] Alterar fundo do modal para bg-gray-200 para melhor contraste
- [x] Implementar recortes usando círculos sobrepostos com cor do fundo (bg-gray-200)
- [x] Adicionar sombra interna nos círculos para dar profundidade
- [x] Testar e confirmar que os recortes funcionam corretamente


## Adicionar Mais Recortes Circulares ao Cupom
- [x] Aumentar de 1 para 9 recortes circulares de cada lado do cupom
- [x] Distribuir os recortes verticalmente ao longo de toda a altura do cupom (6% a 94%)
- [x] Criar efeito de borda serrilhada estilo ticket


## Remover Botão de Voltar do Cupom
- [x] Remover o botão de seta esquerda (voltar) do cupom
- [x] Manter apenas o botão de próximo (seta direita) para navegação


## Adicionar Borda no Cabeçalho do Modal de Fidelidade
- [x] Adicionar borda inferior no cabeçalho do modal (abaixo de "Cartão Fidelidade")
- [x] Separar visualmente o título do conteúdo do modal (border-gray-300)


## Mover Botão de Voltar ao Cartão Fidelidade
- [x] Mover o ícone de voltar (RotateCcw) do canto superior esquerdo para o lado esquerdo do cupom
- [x] Posicionar centralizado verticalmente (top-1/2 -translate-y-1/2)


## Padronizar Modais Bottom Sheet do Sistema
- [x] Adicionar borda inferior (border-gray-300) no cabeçalho de todos os modais
- [x] Adicionar ícone com container redondo em todos os modais (estilo do Cartão Fidelidade)
- [x] Diferenciar background do body (bg-gray-200) do header (bg-white)
- [x] Aplicar em: Informações, Cupom, Acompanhar Pedido, Avaliações, Como Chegar, Fidelidade


## Padronizar Modal Meus Pedidos
- [x] Aplicar cabeçalho branco com borda inferior (border-gray-300)
- [x] Adicionar ícone com container redondo roxo (ClipboardList purple)
- [x] Diferenciar background do body (bg-gray-200) do header (bg-white)


## Padronizar Modal de Sacola
- [x] Aplicar cabeçalho branco com borda inferior (border-gray-300)
- [x] Adicionar ícone com container redondo vermelho (ShoppingBag red)
- [x] Diferenciar background do body (#f5f5f5) do header (bg-white)


## Corrigir Modal Meus Pedidos no Desktop
- [x] Modal bottom sheet no mobile, centralizado no desktop (já estava correto com md:items-center md:justify-center)
- [x] Aplicar background #f5f5f5 consistente com outros modais
- [x] Ajustar rounded-t-2xl md:rounded-t-2xl no header


## Corrigir Modal Meus Pedidos Desktop (v2)
- [x] Modal já está centralizado corretamente no desktop (md:items-center md:justify-center)
- [x] Aplicar rounded-2xl completo no desktop (md:rounded-2xl)
- [x] Modal funcionando como modal normal no desktop com ícone e cabeçalho padronizado


## Corrigir Modal Meus Pedidos Desktop (v3)
- [ ] Modal ainda está com estilo bottom sheet no desktop (rounded apenas no topo)
- [ ] Aplicar rounded-2xl completo em todos os cantos no desktop
- [ ] Verificar se o header também precisa de rounded completo no desktop

## Correção de Modal Desktop
- [x] Corrigir modal "Meus Pedidos" para ter rounded-2xl completo no desktop (estava apenas rounded-t)

## Correção Modal Meus Pedidos Desktop
- [x] Corrigir modal "Meus Pedidos" para ter arredondamento completo (rounded-2xl) no desktop igual ao modal Cartão Fidelidade

## Padronização Visual dos Modais
- [x] Verificar modal Informações - OK (header branco, arredondamento, shadow-2xl)
- [x] Verificar modal Cartão Fidelidade - OK (header branco, fundo cinza #f5f5f5)
- [x] Verificar modal Meus Pedidos - OK (header branco, fundo cinza #f5f5f5)
- [x] Verificar modal Aplicar Cupom - OK (header branco, arredondamento)
- [x] Verificar modal Acompanhamento de Pedido - OK (sticky header, shadow-2xl)
- [x] Verificar modal Avaliação - OK (fundo cinza #f5f5f5)

## Padronização Visual dos Modais do Menu Público
- [ ] Verificar modal Sacola
- [ ] Verificar modal Detalhes do Pedido
- [ ] Verificar modal Informações
- [ ] Verificar modal Cartão Fidelidade
- [ ] Verificar modal Cupom
- [ ] Verificar modal Avaliações
- [ ] Padronizar cabeçalhos (altura, cores, ícones)
- [ ] Padronizar arredondamento (rounded-t-2xl mobile, rounded-2xl desktop)
- [ ] Padronizar cor de fundo do body (#f5f5f5 ou bg-gray-200)


## Padronização Final dos Modais do Menu Público
- [x] Verificar modal Informações - cor de fundo branca no body
- [x] Verificar modal Cartão Fidelidade - cor de fundo branca no body
- [x] Verificar modal Aplicar Cupom - cor de fundo branca no body
- [x] Verificar modal Acompanhamento de Pedido - cor de fundo branca no body
- [x] Verificar modal Avaliação - cor de fundo branca no body
- [x] Verificar modal Meus Pedidos - cor de fundo branca no body (já estava correto)


## Verificação de Modais Adicionais
- [x] Verificar modal Sacola (sua sacola) - corrigido: bg branco, shadow-2xl, fundo body #ffffff
- [x] Verificar modal Checkout - corrigido: ícone colorido no header, shadow-2xl, estrutura padronizada
- [x] Verificar modal Acompanhar Pedido - já estava correto


## Ajustes no Modal Cartão Fidelidade
- [x] Ocultar botão "Sair do cartão" no modal de Cartão Fidelidade


## Ajustes no Cupom de Desconto
- [x] Ajustar cor das bolinhas (recortes circulares) do cupom para #ffffff (branco) igual ao fundo do modal


## Indicador de Paginação dos Cupons
- [x] Adicionar números dentro dos dots de paginação dos cupons (revertido a pedido do usuário)


## Bug - Atualização do Cartão Fidelidade
- [x] Corrigir: cartão fidelidade não atualiza automaticamente quando pedido é entregue (adicionado refetch automático via SSE)


## Alteração do Fluxo de Reset de Carimbos
- [x] Carimbos só devem ser resetados quando usuário clicar em "Ver cupom ganho"
- [x] Não resetar carimbos automaticamente ao completar o cartão
- [x] Criar endpoint para resetar carimbos ao visualizar cupom (loyalty.viewCouponAndResetStamps)
- [x] Atualizar frontend para chamar reset ao clicar em Ver cupom ganho


## Bug - Reset de Carimbos não Funciona Corretamente
- [x] Corrigir: carimbos não estão sendo resetados ao clicar em "Ver cupom ganho" - mostrando 3/2 em vez de 1/2 (corrigido: processLoyaltyStampOnDelivery não reseta mais automaticamente)


## Bug Persistente - Reset de Carimbos
- [x] Investigar: carimbos ainda mostram 3/2 após clicar em "Ver cupom ganho" - corrigido: não adicionar carimbo se cartão já tem cupom ativo


## Alteração de Fluxo - Carimbos com Cupom Ativo
- [x] Novos pedidos devem adicionar carimbos mesmo quando cliente tem cupom ativo
- [x] Carimbos só resetam quando usuário clica em "Ver cupom ganho"


## Novo Fluxo - Reset Automático de Carimbos
- [x] Carimbos resetam automaticamente quando novo pedido é entregue após completar o cartão
- [x] "Ver cupom ganho" apenas mostra o cupom, não reseta carimbos
- [x] Fluxo: 1/2 → 2/2 (cupom criado) → novo pedido entregue → reset + 1/2
- [x] Corrigir: histórico de carimbos não deve ser deletado no reset automático
- [x] Corrigir: exibir múltiplos cupons de fidelidade quando cliente completa cartão mais de uma vez
- [x] Exibir numeração do voucher (Voucher 1, Voucher 2, etc) quando há múltiplos cupons
- [x] Corrigir bug: cabeçalho do modal Cartão Fidelidade com fundo cinza e título sumindo
- [x] Exibir cupom aplicado no modal de detalhes do pedido
- [x] Exibir cupom aplicado na versão de impressão do pedido
- [x] Corrigir arredondamento do modal Sua Sacola na versão desktop
- [x] Implementar optimistic update na mudança de status dos pedidos para atualização instantânea
- [x] Mover pedido instantaneamente para o card correto após mudança de status
- [x] Ajustar espaçamento do container de taxa de entrega na versão desktop
- [x] Exibir taxa de entrega configurada no container (grátis ou valor fixo)
- [x] Exibir taxa de entrega configurada no modal de Resumo do Pedido
- [x] Redesenhar container de taxa de entrega com borda lateral verde
- [x] Atualizar container de taxa de entrega com ícone de caminhão e badge Grátis
- [x] Adicionar borda lateral esquerda verde no container de entrega grátis
- [x] Corrigir borda lateral do container de entrega grátis para ficar igual aos itens
- [x] Padronizar cor verde do container de entrega grátis com a cor do sistema
- [x] Corrigir cor verde do container de entrega grátis que não está aparecendo
- [x] Alterar cores do container de taxa de entrega de verde para vermelho (cor primária do sistema)
- [x] Implementar botão Selecionar com dropdown para taxa por bairro
- [x] Reduzir tamanho do botão Selecionar em 33%
- [x] Corrigir salvamento das taxas por bairro no painel admin
- [ ] Adicionar fechamento do dropdown ao clicar fora
- [ ] Validar seleção de bairro antes de finalizar pedido
- [ ] Aplicar seletor de bairro no checkout mobile
- [ ] Adicionar estimativa de tempo de entrega
- [x] Corrigir erro ao salvar taxas por bairro (bairros agora persistem corretamente)
- [x] Corrigir dropdown de seleção de bairros no cardápio público (não mostra os bairros cadastrados)
- [x] Bug: Bairros não aparecem no dropdown do menu público para cliente 30001 (tabela criada no banco)
- [x] Bug persistente: Bairros não aparecem no dropdown do menu público para o usuário (verificado - funciona corretamente)
- [x] Bug: Dropdown de bairros não abre ao clicar em Selecionar (corrigido removendo overflow-hidden)
- [x] Fechar dropdown de bairros ao clicar fora dele
- [x] Criar modal estilizado para seleção de bairros no desktop (mesmo estilo do modal de Meus Pedidos)
- [ ] Adicionar coração como marca d'água no cartão de fidelidade
- [x] Adicionar coração vazado como marca d'água no cartão de fidelidade
- [ ] Aumentar modal de seleção de bairro em 20% no desktop
- [ ] Adicionar campo de busca no modal de seleção de bairro
- [ ] Validar seleção de bairro no checkout (impedir finalização sem selecionar bairro)

## Modal de Seleção de Bairro (Melhorias)
- [x] Aumentar modal de seleção de bairro em 20% no desktop
- [x] Adicionar campo de busca para filtrar bairros por nome
- [x] Validar seleção de bairro no checkout (impede finalizar sem selecionar bairro quando taxa é por bairro)
- [x] Ordenar lista de bairros em ordem alfabética no modal de seleção
- [x] Adicionar mensagem de "nenhum bairro encontrado" quando a busca não retornar resultados (já implementado)
- [x] Refletir a taxa de entrega na sacola ao selecionar bairro
- [x] Implementar novo modelo do cartão de fidelidade com dois corações e container semi-transparente
- [ ] Bug: Cartão de fidelidade aparece por trás do cupom na versão mobile quando virado
- [x] Bug: Cartão de fidelidade aparece por trás do cupom na versão mobile quando virado (corrigido com z-index)
- [ ] Alterar botão de bairro: mostrar "Selecionado" com check quando selecionado, "Alterar" no hover

## Botão de Seleção de Bairro - Comportamento Melhorado
- [x] Mostrar "Alterar" diretamente quando bairro selecionado (sem hover)
- [x] Manter "Selecionar" quando nenhum bairro estiver selecionado

## Cupons de Fidelidade - Uso Único
- [x] Garantir que cupons ganhos pelo cartão fidelidade só podem ser usados uma única vez
- [x] Invalidar cupom após primeiro uso (independente do cliente)
- [x] Adicionar validação no backend para verificar se cupom já foi usado
- [x] Mensagem específica para cupom de fidelidade já utilizado

## Formato do Código de Cupom de Fidelidade
- [x] Alterar formato do código para máximo 8 caracteres (ex: FIDM7F9K)
- [x] Incluir números no código alfanumérico
- [x] Remover caracteres confusos (I, O, 0, 1) para evitar erros de digitação

## Verificação de Unicidade do Código de Cupom
- [x] Verificar se código já existe antes de criar cupom
- [x] Regenerar código automaticamente em caso de colisão
- [x] Limitar tentativas de geração para evitar loop infinito (max 10 tentativas)
- [x] Fallback com timestamp caso todas as tentativas falhem

## Novo Visual do Card de Cupom
- [x] Implementar novo design do card de cupom com efeito de voucher
- [x] Manter as mesmas proporções (altura e largura)
- [x] Adicionar efeito de recorte nas bordas (perfurado) usando CSS mask
- [x] Lado esquerdo amarelo/dourado com nome do estabelecimento e validade
- [x] Lado direito azul escuro (slate-900) com valor do desconto e botões
- [x] Ícone de talheres como marca d'água no lado esquerdo
- [x] Sombra drop-shadow para efeito de profundidade

## Variações de Cor para Cupons
- [x] Primeiro cupom mantém cor amarela/dourada atual
- [x] Cupons seguintes têm cores distintas no lado esquerdo (emerald, sky, violet, rose, orange, teal, pink)
- [x] Lado direito permanece azul escuro/preto em todos os cupons
- [x] Cores mudam ao navegar entre cupons para dar percepção de troca
- [x] Transição suave de 300ms entre cores

## Ajuste de Cores do Lado Direito do Cupom
- [x] Mudar cor do texto R$10 OFF para corresponder ao lado esquerdo
- [x] Mudar cor do botão Copiar para corresponder ao lado esquerdo
- [x] Mudar cor do botão Usar agora para corresponder ao lado esquerdo
- [x] Mudar cor do botão próximo para corresponder ao lado esquerdo

## Padronização dos Modais Mobile
- [x] Igualar altura do cabeçalho do modal de seleção de bairro com o de Meus Pedidos (68px)
- [x] Igualar tamanho do ícone e padding do modal de seleção de bairro (h-5 w-5, p-2)
- [x] Igualar tamanho do título do modal de seleção de bairro (text-lg)
- [x] Igualar tamanho do botão X de fechar (h-5 w-5, p-2)

## Correção do Scroll do Modal de Seleção de Bairro (Mobile)
- [x] Impedir que o fundo role quando o modal está aberto (adicionado showNeighborhoodModal ao useEffect)
- [x] Garantir que apenas o conteúdo do modal seja rolável (touch-action: pan-y)

## Link Alterar Bairro no Modal da Sacola
- [x] Adicionar texto "Alterar bairro" ao lado de "Taxa de entrega" quando bairro estiver selecionado
- [x] Ao clicar em "Alterar bairro", abrir o modal de seleção de bairro (fecha a sacola e abre o modal)

## Bug: Cabeçalho do Modal de Fidelidade Sumindo (Mobile)
- [x] Investigar por que o cabeçalho do modal de fidelidade some em algumas situações
- [x] Identificar o cenário que causa o bug (z-index dos elementos do card flip sobrepondo o header sticky)
- [x] Corrigir o problema (aumentado z-index do header para z-[50] e ajustado z-index dos elementos internos)

## Bug: Link Alterar Bairro não aparece no Modal da Sacola (Mobile)
- [ ] Verificar por que o link "Alterar bairro" não está aparecendo
- [ ] Corrigir o problema

## Bug: Link Alterar Bairro não aparece no Modal da Sacola (Mobile) - CORRIGIDO
- [x] Verificar por que o link "Alterar bairro" não está aparecendo (condição usava "neighborhood" ao invés de "byNeighborhood")
- [x] Corrigir o problema (atualizada condição para usar valor correto do schema)

## Reabrir Modal da Sacola após Alterar Bairro
- [x] Ao clicar em "Alterar bairro" no modal da sacola, fechar sacola e abrir modal de bairro
- [x] Após selecionar um bairro, reabrir automaticamente o modal da sacola (com setTimeout de 100ms)

## Reabrir Modal da Sacola após Selecionar Bairro (Fluxo Finalizar Pedido)
- [x] Quando usuário clica em "Finalizar pedido" sem bairro selecionado, abrir modal de bairro
- [x] Após selecionar o bairro, reabrir automaticamente o modal da sacola (mobile e desktop)

## Validação do Campo Número no Modal de Entrega
- [x] Permitir apenas números no campo "Número" (regex remove caracteres não numéricos)
- [x] Limitar a 6 caracteres máximo
- [x] Adicionado inputMode="numeric" para teclado numérico no mobile

## Persistência da Sacola no LocalStorage
- [x] Salvar sacola no localStorage ao adicionar/remover itens
- [x] Carregar sacola do localStorage ao iniciar a página
- [x] Manter sacola ao atualizar página, fechar navegador ou navegar para outra página
- [x] Limpar sacola apenas ao finalizar pedido ou limpar manualmente
- [x] Associar sacola ao estabelecimento (slug) para não misturar itens de diferentes lojas

## Campo Bairro no Modal de Entrega - Somente Leitura
- [x] Quando bairro já estiver selecionado (taxa de entrega), campo fica somente leitura
- [x] Exibir botão "Alterar bairro" ao lado do campo
- [x] Ao clicar em "Alterar bairro", abrir modal de seleção de bairro
- [x] Após selecionar novo bairro, retornar ao modal de tipo de entrega (checkout step 2)

## Bug: Sacola não limpa após envio do pedido
- [x] Limpar sacola do localStorage após envio bem-sucedido do pedido (onSuccess do createOrderMutation)
- [x] Garantir que o modal da sacola mostre estado vazio após envio
- [x] Resetar todos os estados relacionados à sacola (também no botão Fechar do modal de acompanhamento)

## Seleção Automática de Entrega ao Selecionar Bairro
- [x] Quando usuário selecionar um bairro, definir deliveryType como "delivery" automaticamente
- [x] Manter a opção de retirar no local disponível para alteração manual

## Exibir Taxa de Entrega no Modal de Confirmação
- [x] Adicionar linha de "Taxa de entrega" entre Subtotal e Total no modal de confirmação
- [x] Exibir o valor da taxa do bairro selecionado (apenas quando deliveryType === 'delivery')

## Bug: Som de Novo Pedido Tocando no Menu Público
- [x] Investigar onde o som de novo pedido está sendo disparado no menu público
- [x] Garantir que o som só toque no painel administrativo (adicionado isInPublicMenu() no NotificationAudioManager)
- [x] Bloquear som no método play() e no pendingPlay quando estiver no menu público

## Investigação Profunda: Som no Menu Público
- [x] Verificar se NewOrdersProvider está sendo carregado no menu público (SIM - estava envolvendo toda a app)
- [x] Verificar se o hook useOrdersSSE está ativo no menu público (SIM - era carregado pelo provider)
- [x] Verificar se há BroadcastChannel ou listener global de eventos (NÃO - problema era o provider)
- [x] Isolar o módulo de áudio para carregar apenas no painel admin (reestruturado App.tsx)
- [x] Garantir que o NotificationAudioManager não seja instanciado no menu público (NewOrdersProvider agora só envolve rotas admin)

## Bug: Scroll do Modal de Seleção de Bairro (v2)
- [x] Impedir que a página de fundo role quando o modal está aberto (onTouchMove com preventDefault)
- [x] Garantir que apenas o conteúdo do modal seja rolável (data-neighborhood-scrollable)
- [x] Adicionado overscroll-contain e WebkitOverflowScrolling para melhor suporte mobile


## Bug: Carimbo do Cartão Fidelidade não atualiza automaticamente
- [x] Investigar por que o carimbo não aparece ao abrir o modal após fazer pedido
- [x] Verificar se a query do cartão fidelidade está sendo invalidada corretamente
- [x] Garantir que o modal sempre busque dados atualizados ao abrir (adicionado refetch ao clicar no botão Fidelidade)
- [x] Correção aplicada tanto no desktop quanto no mobile


## Ajuste: Altura do Modal de Seleção de Bairro no Mobile
- [x] Limitar altura do modal para mostrar no máximo 4 bairros (maxHeight: 280px no mobile)
- [x] Garantir que o scroll funcione para ver os demais bairros
- [x] Manter comportamento normal no desktop (maxHeight: 400px)


## Bug: Preço dos complementos não aparece nos modais
- [x] Adicionar preço dos complementos no modal "Sua Sacola" (desktop e mobile)
- [x] Adicionar preço dos complementos no modal de resumo do pedido (checkout)
- [x] Adicionar preço dos complementos no modal de confirmação de endereço
- [x] Formato: "+ Complemento (R$ X,XX)"


## Ajuste: Estilo do preço dos complementos
- [x] Preço dos complementos em vermelho (igual ao preço do item)
- [x] Preço alinhado à direita do container
- [x] Aplicar em todos os modais (sacola desktop/mobile, resumo, confirmação)


## Bug: Modal de Cupom cortado em telas pequenas
- [x] Ajustar layout do campo de texto e botão para não serem cortados
- [x] Colocar campo e botão em linhas separadas em telas pequenas (flex-col no mobile, flex-row no desktop)
- [x] Garantir que o botão "Aplicar cupom" apareça completo (w-full no mobile)


## Ajuste: Texto do botão de complementos
- [x] Alterar "Selecione uma opção" para "Escolha uma opção" para evitar quebra de linha


## Ajuste: Altura da foto no modal de detalhes do item
- [x] Diminuir altura da foto em 20% para telas menores (mobile) - de 268px para 215px


## Verificação: Consistência de estilo entre modais
- [x] Comparar modal "Como chegar" com modal "Meus pedidos"
- [x] Ajustar cabeçalho, fundo e estilos para ficarem consistentes
  - Adicionado sticky top-0 no header
  - Ajustado max-h para 85vh, overflow-y-auto e overscroll-contain
  - Adicionado animações md:slide-in-from-bottom-0 md:zoom-in-95
  - Fundo branco (#ffffff) em todas as seções (endereço, opções, footer)


## Feature: Sistema de Impressão Automática de Pedidos

### Fase 1: Backend - Schema e Rotas
- [x] Criar tabela `printers` no schema (nome, IP, porta, ativo, estabelecimento)
- [x] Criar tabela `printer_settings` para configurações de impressão
- [x] Criar rotas tRPC para CRUD de impressoras (list, get, create, update, delete, getSettings, saveSettings, getDefault, printOrder)
- [ ] Criar rota para testar conexão com impressora (pendente - requer cliente de impressão)

### Fase 2: Evento SSE para Impressão
- [x] Adicionar evento SSE `new_order_to_print` no sistema de notificações (notifyPrintOrder)
- [x] Disparar evento quando pedido for criado (createPublicOrder)
- [x] Incluir dados completos do pedido no evento

### Fase 3: Interface de Configuração no Admin
- [x] Criar página de configuração de impressoras (/impressoras)
- [x] Formulário para adicionar/editar impressora (nome, IP, porta)
- [x] Toggle para ativar/desativar impressão automática
- [x] Botão para testar impressão (abre window.print)

### Fase 4: Impressão Manual
- [x] Adicionar botão "Imprimir" nos detalhes do pedido (já existia)
- [x] Criar layout de impressão formatado para cupom 80mm
- [x] Usar window.print() com @media print CSS
- [x] Criar rota printer.printOrder para impressão via impressora térmica

### Próximos Passos (Cliente de Impressão)
- [ ] Cliente local (app desktop) para receber eventos SSE e enviar para impressora térmica
- [ ] Testar conexão com impressora via TCP/IP


## Feature: Botão de Teste de Conexão com Impressora
- [x] Criar rota no backend para testar conexão TCP com a impressora (printer.testConnection)
- [x] Adicionar botão "Testar Conexão" no modal de adicionar/editar impressora
- [x] Mostrar feedback visual do resultado do teste (sucesso/falha) com cores verde/vermelho


## Bug: printer.getSettings retorna undefined
- [x] Corrigir rota para retornar objeto padrão quando não há configurações salvas


## Ajuste: Mover Impressoras para Configurações
- [x] Adicionar aba "Impressoras" na página de Configurações
- [x] Mover conteúdo da página Impressoras.tsx para a nova aba
- [x] Remover item "Impressoras" do menu lateral
- [x] Remover rota /impressoras do App.tsx
- [x] Deletar arquivo Impressoras.tsx


## Ajuste: Taxa de Entrega na Impressão do Pedido
- [x] Adicionar taxa de entrega no layout de impressão do pedido
- [x] Mostrar "Grátis" quando taxa for zero


## Feature: Botão de Impressão no Card do Pedido
- [x] Adicionar botão com ícone de impressora no card do pedido
- [x] Ao clicar, abrir diretamente a janela de impressão do pedido
- [x] Criar função handlePrintOrderDirect que busca dados do pedido e abre impressão


## Feature: Tooltip no Botão de Impressora
- [x] Adicionar tooltip informativo ao botão de impressora no card do pedido


## Ajuste: Posição e estilo do botão de impressão
- [x] Mover botão de impressão para o lado esquerdo do botão "Ver detalhes"
- [x] Ajustar estilo para ficar como botão outline com apenas o ícone


## Feature: PWA (Progressive Web App) para o Admin
### Fase 1: Configuração básica do PWA
- [x] Criar manifest.json com nome, ícones, cores e configurações do app
- [x] Adicionar meta tags necessárias no index.html
- [x] Criar ícones do app em diferentes tamanhos (192x192, 512x512)

### Fase 2: Service Worker
- [x] Criar service worker para cache de assets
- [x] Implementar estratégia de cache (network-first para API, cache-first para assets)
- [x] Registrar service worker no app

### Fase 3: Notificações Push
- [x] Implementar Web Push API no service worker
- [x] Criar rota no backend para registrar subscriptions de push
- [x] Enviar notificação push quando novo pedido chegar
- [x] Tocar som na notificação mesmo com tela desligada

### Fase 4: Experiência de instalação
- [x] Adicionar botão/prompt para instalar o PWA
- [x] Detectar se o app já está instalado
- [x] Mostrar instruções de instalação para iOS (Add to Home Screen)

### Fase 5: Interface de Configuração
- [x] Criar aba de Notificações na página de Configurações
- [x] Criar componente NotificationsTab com gerenciamento de subscriptions
- [x] Mostrar status das notificações (ativadas/desativadas)
- [x] Mostrar lista de dispositivos cadastrados
- [x] Permitir enviar notificação de teste
- [x] Mostrar instruções de instalação do PWA


## Layout Compacto do Card de Pedido (Mobile)
- [x] Reorganizar informações do card de pedido em uma única linha no mobile
- [x] Formato: Nome - Ícone pagamento - Método - Tag entrega - Valor
- [x] Remover linha separada de "Total" no mobile
- [x] Manter layout atual no desktop


## Bug: Notificações Push não funcionando após instalação PWA
- [ ] Verificar se o Service Worker está registrado corretamente
- [ ] Verificar se a subscription está sendo salva no banco
- [ ] Verificar se as chaves VAPID estão configuradas
- [ ] Testar envio de notificação de teste


## Bug: Número do pedido com ## duplicado na notificação push
- [x] Corrigir formato do número do pedido na notificação (##P345 → #P345)


## Bug: Botões sem nomes na versão mobile da página Cardápio
- [x] Adicionar Tooltips aos botões "Reorganizar", "Nova Categoria" e "Novo Item" no mobile


## Melhoria: Layout horizontal para informações do cliente no modal de pedido
- [x] Colocar Nome e Telefone na mesma linha horizontal no card de informações do cliente


## Melhoria: Unificar cards de entrega e pagamento no modal de pedido
- [x] Remover card "Detalhes do Pagamento" separado
- [x] Adicionar método de pagamento no card de "Informações de Entrega"
- [x] Renomear para apenas "Entrega" com Tipo e Método


## Bug: Erro ao imprimir direto do card no PWA
- [x] Corrigir erro ao abrir janela de impressão quando clica no botão de imprimir do card do pedido
- [x] Abrir janela ANTES do fetch para manter contexto de evento do usuário


## Bug: Nomes dos botões não aparecem no mobile na página Catálogo
- [x] Mostrar nomes "Reordenar", "Categoria" e "Item" nos botões no mobile


## Melhoria: Scroll horizontal nos campos de complementos (mobile)
- [x] Adicionar scroll horizontal nos itens de complemento para ver texto completo no mobile


## Melhoria: Scroll horizontal no card de Complementos/Adicionais
- [x] Adicionar scroll horizontal no card inteiro para ver nomes completos dos complementos
- [x] Adicionar min-width de 400px nos itens para garantir espaço


## Melhoria: Ocultar badge de tempo real no mobile (Pedidos)
- [x] Ocultar o badge de tempo real na versão mobile da página de Pedidos


## Melhoria: Layout horizontal no card de pedido (desktop)
- [x] Mostrar nome, forma de pagamento e tipo de entrega na mesma linha no desktop (igual mobile)
- [x] Aumentar tamanhos de fonte e espaçamentos para desktop


## Melhoria: Botão de cancelar vermelho por padrão
- [x] Deixar o botão de cancelar já vermelho (sem precisar de hover)


## Feature: Integração com WhatsApp via UAZAPI
### Fase 1: Análise da documentação
- [x] Ler documentação da UAZAPI
- [x] Identificar endpoints necessários (criar instância, QR code, enviar mensagem)

### Fase 2: Backend
- [x] Criar tabela para armazenar configuração do WhatsApp por estabelecimento
- [x] Implementar rotas tRPC para gerenciar conexão WhatsApp
- [x] Implementar função de envio de mensagens

### Fase 3: Frontend
- [x] Criar interface de conexão WhatsApp na página de Configurações
- [x] Mostrar QR Code para conexão
- [x] Mostrar status da conexão

### Fase 4: Integração
- [x] Enviar mensagem automática quando status do pedido mudar
- [x] Personalizar mensagens por tipo de status


## Melhoria: Configuração automática do WhatsApp via UAZAPI
- [ ] Configurar credenciais UAZAPI como variáveis de ambiente centralizadas
- [ ] Criar instância automaticamente por estabelecimento (usando ID do estabelecimento)
- [ ] Simplificar interface - dono do restaurante só precisa escanear QR Code
- [ ] Remover campos de subdomínio e token da interface

## Integração WhatsApp Simplificada (UAZAPI)
- [x] Configurar credenciais UAZAPI centralizadas (UAZAPI_BASE_URL, UAZAPI_ADMIN_TOKEN)
- [x] Criar módulo uazapi.ts com funções para criar instâncias automaticamente
- [x] Atualizar schema do banco para usar instanceId e instanceToken em vez de subdomain/token
- [x] Simplificar interface do WhatsApp - apenas QR Code para conectar (sem campos de credenciais)
- [x] Criar instância automaticamente ao clicar em Conectar
- [x] Atualizar rotas tRPC para usar credenciais centralizadas
- [x] Manter configurações de notificações e templates personalizáveis
- [x] Testar fluxo completo de conexão via QR Code
- [x] Corrigir exibição do status de conexão (mostrava desconectado mesmo conectado)
- [ ] Testar envio de notificações automáticas ao mudar status do pedido
- [x] Preencher templates de mensagem com valores padrão (sem precisar preencher manualmente)
- [x] Bug: ao aceitar pedido deve enviar mensagem de "Novo Pedido", não "Preparando" - Corrigido: agora envia notificação de novo pedido quando o pedido é criado
- [x] Adicionar templates diferentes para status "Pronto" baseado no tipo de entrega (retirada vs delivery)
- [x] Adicionar variável {{cancellationReason}} no template de cancelamento para enviar o motivo ao cliente
- [x] Limitar campo de telefone no modal "Seus Dados" para máximo de 13 caracteres
- [x] Adicionar máscara visual (DDD) 9 9999-9999 no campo de telefone com formatação automática
- [x] Criar variável {{greeting}} para saudação automática baseada no horário (Bom dia/Boa tarde/Boa noite)
- [x] Permitir underscore (_), ponto (.) e números no campo "Link do Cardápio"
- [x] Bug: ao avançar de "Seus Dados" para "Confirmação" mostra mensagem de erro "Não foi possível enviar o pedido" incorretamente - Corrigido: agora limpa o erro anterior ao iniciar novo checkout
- [x] Atualizar templates padrão de WhatsApp para novos estabelecimentos (incluindo template de fidelidade)

## App Android de Impressão Local
- [x] Pesquisar soluções de impressão ESC/POS para Android
- [x] Criar endpoint de API para gerar HTML do recibo (/api/print/receipt/:orderId)
- [x] Integrar com app ESC POS Wifi Print Service (via app-links print://)
- [x] Adicionar dropdown de impressão com opção térmica no painel de pedidos
- [x] Criar testes unitários para o endpoint de recibo


## Melhorias no Sistema de Impressão Térmica
- [x] Impressão automática de novos pedidos
- [x] Múltiplas impressoras (cozinha/balcão) com tipo e categorias
- [x] Personalizar recibo com logo, mensagem de cabeçalho e rodapé
- [x] Configuração de largura do papel (58mm/80mm)
- [x] Adicionar campo de tipo de impressora no modal (Todos, Cozinha, Balcão, Bar)
- [x] Atualizar endpoint de recibo para usar configurações personalizadas


## App Android de Impressão Automática
- [ ] Criar tabela de fila de impressão no banco de dados
- [ ] Criar endpoints de API para polling (buscar pedidos pendentes, marcar como impresso)
- [ ] Desenvolver app Android com Kotlin/Jetpack Compose
- [ ] Implementar polling a cada X segundos
- [ ] Integrar com impressora ESC/POS via socket TCP
- [ ] Gerar APK para instalação
- [ ] Documentar configuração e uso do app


## PWA de Impressão Automática
- [x] Criar tabela de fila de impressão (printQueue)
- [x] Criar endpoints de API para polling (pending, getJob, markPrinted, markFailed)
- [x] Desenvolver página PWA de impressão (/printer-app)
- [x] Integrar com app ESC POS via print://
- [x] Configurações de intervalo de polling (3s a 30s)
- [x] Som de notificação para novos pedidos
- [x] Histórico de impressões recentes
- [x] Criar testes unitários


## Bug: Pedidos não aparecem na fila de impressão
- [x] Adicionar chamada para addToPrintQueue após criar pedido
- [x] Verificar se printerSettings.autoPrintEnabled está ativado
- [ ] Testar fluxo completo de impressão automática


## Bug: Tela branca ao abrir link print://
- [x] Corrigir método de abertura do link print:// para não criar aba em branco no Android


## Melhoria: Botão de impressão visível na PWA
- [x] Garantir que o botão "IMPRIMIR AGORA" apareça quando há pedidos pendentes
- [x] Adicionar lista de pedidos pendentes para impressão manual
- [x] Melhorar feedback visual quando pedido chega
- [x] Não marcar como impresso automaticamente - usuário deve confirmar


## Bug: Botão IMPRIMIR PEDIDO não funciona na PWA
- [x] Investigar por que o link print:// não abre o app ESC POS
- [x] Corrigir formato do link para usar o formato correto do ESC POS Wifi Print Service
- [x] Usar window.location.href como na página de Pedidos

## Impressão Automática na PWA
- [x] Implementar impressão automática quando novos pedidos chegarem
- [x] Contornar limitações de segurança do navegador para abrir links automaticamente
- [x] Testar funcionamento no Android com app ESC POS
- [x] Decisão: criar app Android nativo para contornar limitações do navegador

## App Android Nativo para Impressão Automática
- [x] Configurar ambiente Android e criar estrutura do projeto
- [x] Implementar serviço de polling para verificar novos pedidos
- [x] Integrar com API do backend (endpoint /api/print/queue/pending)
- [x] Implementar abertura automática do app ESC POS via Intent
- [x] Adicionar notificação persistente para serviço em segundo plano
- [x] Adicionar som e vibração quando chegar pedido
- [x] Criar projeto completo com código fonte para compilação no Android Studio

## Impressão Semi-Automática ao Aceitar Pedido
- [x] Modificar botão "Aceitar" para enviar impressão automaticamente após aceitar
- [x] Manter botão de impressora independente funcionando
- [x] Testar fluxo completo

## Notificação Visual ao Aceitar Pedido
- [x] Adicionar toast de "Pedido aceito e enviado para impressão"

## Melhorar Legibilidade do Recibo Térmico
- [x] Aumentar tamanho da fonte para melhor leitura
- [x] Ajustar espaçamento e margens
- [x] Otimizar layout para impressoras 58mm/80mm

## Integração POSPrinterDriver - Impressão Automática via Servidor
- [x] Adicionar campos no banco para linkcode e configurações
- [x] Criar função de impressão via API POSPrinterDriver
- [x] Integrar impressão automática quando chegar pedido novo
- [x] Criar interface de configuração no painel admin
- [x] Testar impressão automática

## Impressão Direta via Rede Local (Socket TCP)
- [x] Criar módulo de impressão ESC/POS via socket TCP
- [x] Gerar comandos ESC/POS para formatação do recibo
- [x] Integrar impressão automática quando chegar pedido novo
- [x] Adicionar toggle para ativar/desativar impressão direta
- [x] Adicionar interface de configuração no painel admin
- [x] Adicionar botão de teste de conexão

## Melhorar Visibilidade do Recibo Térmico
- [x] Colocar todos os textos em negrito para melhor legibilidade

## Corrigir Impressão Térmica Android
- [x] Fazer botão "Impressora Térmica (Android)" usar o mesmo estilo do botão "Impressão Normal"

## Ajustar Tamanho e Peso das Fontes do Recibo
- [x] Diminuir tamanho das fontes do recibo térmico
- [x] Ajustar pesos: corpo (500), itens (700), observações (500), cliente (500), data/hora (700)

## Bug: Impressão Térmica Android não funciona
- [x] Investigar problema no botão de impressão térmica Android
- [x] Corrigir o código para funcionar corretamente (usar URL HTTP em vez de blob)

## Página de Teste e Configuração de Impressão
- [ ] Criar página com preview do recibo em tempo real
- [ ] Adicionar controles para tamanho de fonte (pequeno, médio, grande)
- [ ] Adicionar controles para peso de fonte (normal, semi-negrito, negrito)
- [ ] Adicionar controles para largura do papel (58mm, 80mm)
- [ ] Botão para testar impressão com configurações atuais
- [ ] Salvar configurações no banco de dados
- [ ] Aplicar configurações salvas no recibo térmico


## Página de Teste de Impressão
- [x] Criar página TesteImpressao.tsx com preview em tempo real
- [x] Adicionar controles de ajuste de fonte (tamanho e peso) para texto geral, títulos, itens e observações
- [x] Adicionar controles de layout (largura do papel, divisores)
- [x] Implementar preview do recibo com dados de exemplo
- [x] Adicionar botão de teste de impressão normal (navegador)
- [x] Adicionar botão de teste de impressão térmica (Android ESC POS)
- [x] Adicionar botão de restaurar configurações padrão
- [x] Adicionar link "Teste Impressão" no menu lateral
- [x] Adicionar campos de configuração de fonte no schema printerSettings
- [x] Implementar salvamento das configurações no banco de dados
- [x] Integrar configurações salvas com o endpoint de impressão de recibos
- [x] Carregar configurações salvas ao abrir a página


## Bugs - Teste de Impressão
- [x] Corrigir botão "Testar Impressão Normal" que não abre janela de impressão
- [x] Corrigir botão "Testar Impressora Térmica (Android)" que não funciona

- [x] Corrigir recibo de teste que não mostra todas as informações do Preview

- [x] Alterar modelo do recibo de teste para usar o mesmo layout do Preview (sem logo, mesmo formato)

- [x] Corrigir salvamento das configurações de fonte que não persiste no banco de dados

- [x] Adicionar card de preview com campo de texto personalizado e botão de teste de impressão térmica

- [x] Atualizar estilos do endpoint de teste para usar os mesmos estilos otimizados da função generateReceiptHTML

- [x] Ajustar layout do teste de impressão para alinhar Pedido e data à esquerda (igual foto do recibo)

- [x] Adicionar badge de ENTREGA/RETIRADA no recibo de teste (fundo preto, texto branco, centralizado)

- [x] Mover badge de ENTREGA/RETIRADA para o lado direito do número do pedido (mesma linha)

- [x] Centralizar badge de ENTREGA verticalmente entre as linhas Pedido e Realizado em (à direita)

- [x] Adicionar badge no Total com fundo escuro e texto branco (TOTAL à esquerda, valor à direita)

- [x] Trocar texto "Realizado em:" por ícone de calendário 📅 antes da data

- [x] Adicionar estilo de caixa com bordas redondas na seção de Endereço

- [x] Pagamento: caixa com bordas redondas, título PAGAMENTO e forma de pagamento em badge na mesma linha
- [x] Cliente: mesmo estilo de caixa com bordas redondas igual ao Endereço

- [x] Cliente: nome e telefone na mesma linha horizontal

- [x] Cliente: título e dados na mesma linha (Cliente: Nome - Telefone)

- [x] Itens do pedido: adicionar caixa com bordas redondas em cada item

- [x] Aumentar espessura das bordas de 1px para 2px em todas as caixas (agora 2px solid #000)

- [x] Aplicar o mesmo estilo do preview de teste na função generateReceiptHTML dos pedidos reais

- [x] Forma de pagamento: remover badge preto e deixar apenas texto em negrito

- [x] Garantir que a impressão dos pedidos reais use exatamente o mesmo estilo da página de teste (sem logo)

- [x] Pagamento: "Pagamento" à esquerda e forma de pagamento (PIX) à direita na mesma linha

- [x] Adicionar campo para upload de imagem QR Code na página de Teste de Impressão (após seção Cliente)

- [x] QR Code PIX: aumentar tamanho em 20% (de 120px para 144px) e remover borda redonda

- [x] Adicionar slider para controlar espaçamento interno (padding) das caixas com bordas redondas no card de Configurações de Fonte

- [x] Bug: Espaçamento interno das caixas (boxPadding) não está salvando no banco de dados

- [x] Bug: Lógica de horário não suporta horários que atravessam meia-noite (ex: 08:00 - 02:00)

- [x] Verificar e garantir que configurações de Teste de Impressão sejam aplicadas na impressão de pedidos aceitos

- [ ] Criar variável de template WhatsApp {itens_pedido} com todos os itens do pedido (produtos, complementos, observações)

- [x] Criar variável de template WhatsApp {{itensPedido}} com todos os itens do pedido (produtos, complementos, observações)

- [x] Ajustar variável {{itensPedido}} para não mostrar preço individual dos itens, apenas o total do pedido

- [x] Remover quebra de linha extra entre os itens na variável {{itensPedido}}

- [x] Bug: Horário 8h-2h ainda mostra fechado - corrigido para usar timezone de Brasília

- [x] Bug: Menu público ainda mostra fechado após correção de timezone - corrigido frontend para usar timezone de Brasília

- [x] Bug: Erro de login - Failed query na tabela users (coluna loginMethod adicionada)

- [x] Adicionar opção para alternar entre bordas redondas e linhas tracejadas nos itens do pedido

- [x] Substituir emoji de data (📅) pelo ícone de calendário no preview do recibo

- [x] Adicionar ícone de pagamento ao lado esquerdo do título Pagamento no card de pagamento

- [x] Adicionar ícone de estrela ao lado esquerdo do título Cliente no card de cliente

- [x] Bug: Nome do cliente foi para baixo - corrigir layout inline

- [x] Bug: Ícone de estrela no card de cliente aparecia em linha separada - corrigido usando display flex

- [x] Ajustar card de Cliente para mesmo layout do card de Pagamento: ícone + "Cliente" à esquerda, nome + telefone à direita, sem dois pontos

- [x] Aumentar tamanho do ícone de estrela no card de Cliente para ficar igual ao ícone de pagamento

## Impressão Simultânea em Múltiplas Impressoras (via IP)
- [x] Usar tabela printers existente para cadastrar múltiplas impressoras com IP
- [x] Criar função getActivePrinters para buscar impressoras ativas
- [x] Implementar função printOrderToMultiplePrinters para envio simultâneo
- [x] Modificar fluxo de criar pedido para imprimir em todas as impressoras ativas
- [x] Cadastrar as duas impressoras: 192.168.123.100 e 192.168.68.101
- [ ] Testar impressão simultânea com pedido real

## Integração ESC/POS Multi Printer Network Print Service
- [x] Criar endpoint público para gerar HTML do recibo acessível via URL
- [x] Implementar geração de deep link para o app Multi Printer com fila de impressão
- [x] Usar impressoras já cadastradas no banco (192.168.123.100 e 192.168.68.101)
- [x] Adicionar opção "Múltiplas Impressoras" no menu de impressão dos pedidos
- [ ] Testar impressão simultânea nas duas impressoras via app Multi Printer

- [x] Bug: Impressão Multi Printer não executa automaticamente - corrigido usando printerName (KOT-1, KOT-2) em vez de IP

- [x] Bug: Multi Printer mostra "please set the ip address" - corrigido usando printerIpAddr + printerPort

- [x] Impressão automática ao aceitar pedido - abrir deep link do Multi Printer automaticamente

## Sistema de Separação de Itens por Setor de Impressão
- [x] Adicionar campo printerId na tabela de produtos
- [x] Adicionar campo "Setor de Preparo" no formulário de cadastro de produtos
- [x] Criar página de gerenciamento de impressoras (/impressoras)
- [x] Modificar lógica de impressão para separar itens por setor
- [x] Gerar recibo separado para cada setor com apenas os itens daquele setor
- [x] Endpoint /api/print/multiprinter-sectors para impressão separada por setor

- [x] Bug: Impressão por setor imprime todos os itens em todas as impressoras - corrigido: alterado endpoint para multiprinter-sectors

- [x] Bug: Recibo de setor incompleto - corrigido para usar layout completo igual ao recibo normal (endereço, pagamento, QR code, total, taxa entrega), apenas filtrando itens por setor

- [x] Implementar lógica: itens sem setor (printerId = null) vão para todas as impressoras, itens com setor específico vão apenas para aquela impressora

- [x] Bug: Número do pedido aparece como ## em vez de #P35 no recibo impresso - corrigido removendo # extra do HTML


## Confirmação de Pedido via WhatsApp com Botões
- [x] Adicionar novo status "pending_confirmation" no schema de pedidos
- [x] Criar função sendButtonMessage no módulo UAZAPI para enviar mensagem com botões de resposta rápida
- [x] Modificar fluxo de criação de pedido para usar status "pending_confirmation" inicialmente
- [x] Criar endpoint webhook para receber resposta dos botões do WhatsApp
- [x] Configurar webhook na instância UAZAPI para enviar eventos de mensagens
- [x] Implementar lógica para confirmar pedido quando cliente clica em "Ok, pode fazer"
- [x] Implementar lógica para cancelar pedido quando cliente clica em "Não quero mais"
- [x] Adicionar toggle de configuração na aba WhatsApp para ativar/desativar confirmação
- [ ] Testar fluxo completo de confirmação via WhatsApp (aguardando teste do usuário)


## Configuração Automática do Webhook UAZAPI
- [x] Criar função configureWebhook no módulo UAZAPI para criar/atualizar webhook automaticamente
- [x] Integrar chamada da função ao salvar configurações de WhatsApp com confirmação via botões ativada
- [x] Testar fluxo completo de ativação automática do webhook


## Bug: Pedido não aparece após confirmação via WhatsApp
- [x] Investigar por que pedido #P441 não apareceu na página de pedidos após cliente clicar em "Ok, pode fazer"
- [x] Verificar se webhook está recebendo a resposta do botão
- [x] Corrigir fluxo de confirmação de pedido (campo correto é buttonOrListid)


## Bug: Webhook usando domínio incorreto
- [x] Corrigir URL do webhook de cardapio-admin.manus.space para mindi.manus.space
- [x] Atualizar webhook na UAZAPI para o domínio correto


## Bug: Pedido aparece como Novo sem confirmação do cliente
- [x] Investigar por que pedido está aparecendo como Novo sem aguardar confirmação no WhatsApp
- [x] Corrigir fluxo para usar status pending_confirmation quando confirmação via botões está ativada
- [x] Ajustar página de Pedidos para não mostrar pedidos com status pending_confirmation


## Remover mensagem automática de confirmação
- [x] Remover mensagem "Perfeito! Seu pedido foi confirmado..." enviada após cliente clicar no botão


## Bug: Notificação em tempo real não funciona após confirmação via WhatsApp
- [x] Investigar por que som não toca quando pedido é confirmado
- [x] Investigar por que badge de quantidade não atualiza
- [x] Investigar por que página não atualiza em tempo real
- [x] Adicionar logs de debug para identificar problema de conexão SSE
- [ ] Testar após publicar nova versão


## Remover botão "Não quero mais" do WhatsApp
- [x] Remover o botão "Não quero mais" da mensagem de confirmação, mantendo apenas "Ok, pode fazer"


## Simplificar página de login
- [x] Remover seção lateral "Bem-vindo de volta" e deixar apenas o container de login centralizado


## Ajustar estilo do modal de Avaliações
- [x] Comparar estilos dos modais de Avaliações e Meus Pedidos
- [x] Ajustar o modal de Avaliações para seguir o mesmo padrão visual do modal de Meus Pedidos
- [x] Layout Kanban na página de Pedidos com 4 colunas (Novos, Preparo, Prontos, Completos) seguindo estilo visual da referência
- [x] Restaurar visual original do card de pedido no layout Kanban (header colorido, botões impressora/ver detalhes/aceitar/cancelar)
- [x] Alterar cor de fundo do header do card para cinza fixo (#e3e3e3) apenas no status "completed"
- [x] Ajustar altura dos cards do Kanban na página de Pedidos para igualar à altura dos cards de Estoque
- [x] Padronizar cabeçalhos das páginas Catálogo, Pedidos e Cupons para ficarem iguais ao da página de Estoque
- [ ] BUG: Pedidos feitos no menu público não aparecem na página de Pedidos
- [ ] BUG: Erro "Rate exceeded" ao enviar pedido no menu público
- [x] Implementar acordeão (expandir/minimizar) nas colunas do Kanban para versão mobile
- [x] BUG: Erro "ERRO AO CONECTAR COM AS IMPRESSORAS" ao aceitar pedido
- [x] BUG: Pedidos não são impressos após clicar em Aceitar
- [x] Remover opção "Impressora Térmica (1 impressora)" do dropdown de impressão
- [x] Ajustar espaçamento entre cabeçalho e cards nas páginas Dashboard e Catálogo para ficar igual à página de Pedidos
- [x] Ajustar cards de estatísticas da página de Dashboard para ter o mesmo estilo visual dos cards do Kanban (barra colorida no topo, título uppercase, número grande, ícone no canto)
- [x] Ajustar cards de estatísticas da Dashboard para fundo branco e mesmo sombreamento do card 'Acumulado da semana'
- [x] BUG: Item configurado para KOT-1 está sendo impresso nas duas impressoras ao aceitar pedido

- [x] Alterar placeholders vazios do Kanban para serem informativos (ícone loading em Novos, textos descritivos nas outras colunas)
- [x] Transformar badge da página de Pedidos em card de status de conexão WhatsApp (conectado/desconectado, botões atualizar e desconectar)
- [x] Alterar botão do card de status WhatsApp: quando desconectado mostrar ícone de QR Code com ação "Conectar"
- [x] Criar modal de QR Code do WhatsApp que abre ao clicar em Conectar (com título "Aguardando conexão...", QR Code e instruções)
- [x] Criar modal de QR Code do WhatsApp na página de Pedidos (com título "Aguardando conexão...", QR Code e instruções)
- [x] Remover aba de WhatsApp da página de configurações (funcionalidade movida para Pedidos)
- [x] Restaurar aba de WhatsApp nas configurações, removendo apenas o card de status de conexão (manter notificações, templates e teste)
- [x] Remover mensagem hardcoded "🔔 Você será notificado por aqui em cada atualização." das notificações de WhatsApp (usar apenas o template configurado)
- [x] Ajustar altura dos placeholders vazios do Kanban para ter o mesmo tamanho dos cards de pedido
- [x] Alterar placeholders do Kanban para ter fundo branco e mesma sombra dos cards da dashboard
- [x] Reverter placeholders do Kanban para estilo anterior (com cores de fundo) e alterar os cards das colunas (área cinza) para fundo branco e sombra
- [x] Melhorar card de status WhatsApp: mostrar loading inicial, só mostrar desconectado após confirmação da API
- [x] Alterar cores do card de status WhatsApp: verde quando conectado, vermelho quando desconectado
- [x] Atualizar cards da página de Cardápio para ter bordas coloridas no topo (estilo igual à página de Pedidos)
- [x] Atualizar cards da página de Cupons para ter bordas coloridas no topo (estilo igual aos cards de métricas da Dashboard)
- [x] Atualizar cards da página de Estoque para ter bordas coloridas no topo (estilo igual aos cards de métricas da Dashboard)
- [x] Adicionar indicador de loading nos botões de ação dos cards de pedido (Aceitar, Pronto, Finalizar)
- [x] Corrigir link do WhatsApp no modal de detalhes do pedido para incluir código do país (55)
- [x] Remover texto "cerca de" dos cards do Kanban na página de Pedidos
- [x] Mover menu 'Teste Impressão' do sidebar para a página de Configurações como nova aba
- [x] Ajustar layout da aba Teste Impressão para seguir o mesmo padrão visual da aba WhatsApp
- [x] Corrigir layout da aba Teste na versão mobile para ficar igual às outras abas (Layout, Fontes)
- [x] Corrigir função de impressão térmica Android na aba de Teste Impressão (comparar com página de Pedidos)
- [x] Sincronizar estilos do recibo de teste com o recibo de pedidos reais (mesma fonte Arial, mesmos pesos, mesmos tamanhos, mesmos estilos de caixas)
- [x] Padronizar recibo de teste para usar EXATAMENTE o mesmo template do recibo real (mesma função generateReceiptHTML)
- [x] Corrigir formatação do número de telefone no recibo de impressão para o formato (88) 9 9929-0000
- [x] Corrigir recibo para mostrar troco solicitado quando pagamento for em dinheiro (formato: Dinheiro | Troco para R$X)
- [x] Limitar campo de dados do usuário no modal do menu público para máximo 15 caracteres
- [x] Implementar contador de caracteres no campo de nome do checkout (X/15)
- [x] Alterar contador de caracteres para mostrar "X restantes" em vez de "X/15"
- [x] Remover caixa com bordas redondas da tela de login na versão mobile
- [x] Corrigir exibição do valor do troco no recibo quando pagamento é em dinheiro
- [x] Alterar exibição do troco no recibo para linha separada com ícone (i), linhas tracejadas e texto Obs: Troco para R$ X
- [x] Substituir ícone (i) circular pelo ícone SVG fornecido no recibo de impressão
- [x] Substituir ícone de som pelo estilo amarelo com ondas sonoras
- [ ] Criar componente de som com ícone amarelo + toggle switch dentro de uma caixa
- [x] Substituir botão de som por componente com ícone amarelo + toggle switch em caixa arredondada
- [x] Ajustar componente de som: reduzir ícone, remover sombra, usar cor cinza claro
- [x] Ajustar toggle do som para usar o mesmo estilo do toggle de abrir/fechar restaurante
- [x] Alterar toggle de som: cor verde quando ativado e ícone de som com 3 ondas de volume
- [x] Alterar ícone de som para ter apenas 2 ondas igual à imagem de referência
- [x] Remover animação de pulso do card de som
- [x] Alterar cor do ícone de som para verde quando ativado e vermelho quando desativado
- [x] Implementar som de teste breve quando o usuário ativar o áudio
- [x] BUG: Som de teste não toca na primeira ativação do toggle de áudio (só toca a partir da segunda vez)
- [x] BUG: establishment.get retorna undefined para novos utilizadores sem estabelecimento
- [x] Adicionar borda vermelha arredondada nos cards de resultados de busca do menu público
- [x] Alterar limite de itens na pré-visualização de busca de 6 para 10
- [x] Ajustar tela de login desktop para ficar igual à versão mobile (sem container redondo)
- [x] Remover checkbox de termos de uso e política de privacidade da página de criar conta
- [x] Adicionar logo do sistema nas páginas de login e criação de conta
- [x] BUG: Logo e header sobem ao navegar para página de criar conta (devem ficar fixos)
- [x] Adicionar logo na página de Esqueci Senha
- [x] Adicionar nome "Mindi" abaixo do logo nas páginas de autenticação
- [x] Alterar campo de senha no modal de Cartão Fidelidade para 4 caixas separadas (estilo PIN)
- [x] Reverter campo de senha do Cartão Fidelidade para formato original (campo único)
- [x] Mover nome Mindi para ao lado do logo nas páginas de autenticação
- [x] Implementar animação de entrada suave para o logo e nome Mindi nas páginas de autenticação (removida a pedido do usuário)
- [x] Adicionar ícone de X para fechar as notificações toast
- [x] Permitir que novos utilizadores vejam Dashboard e Pedidos normalmente mesmo sem estabelecimento configurado
- [x] BUG: Card de WhatsApp com layout quebrado na página de Pedidos para novos utilizadores
- [x] Remover botão de atualizar status do card de WhatsApp (manter apenas desconectar)
- [x] Remover ícone de rede (WiFi) do card de WhatsApp
- [ ] Remover largura fixa do card de WhatsApp (voltar ao tamanho automático)
- [x] Remover largura fixa do card de WhatsApp (voltar ao tamanho automático)
- [x] Configurar templates de WhatsApp padrão para novos utilizadores
- [x] Ativar confirmação via botões por padrão
- [x] Ativar todas as notificações de status por padrão
- [x] Criar categoria e item de teste padrão para novos utilizadores ao criar conta
- [x] Corrigir localStorage de pedidos para isolar por establishmentId
- [x] Remover sombra da barra de menu lateral
- [x] Criar degradê vertical para sidebar - claro no topo, escuro embaixo
- [x] Aplicar degradê do sidebar ao background da página Dashboard
- [x] Remover degradê do sidebar e página principal
- [x] Implementar fluxo de onboarding após criação de conta
- [x] Badge de sucesso "Conta criada com sucesso"
- [x] Formulário de cadastro do restaurante (nome, link, whatsapp, instagram, área)
- [x] Multi-select de objetivos com a plataforma
- [x] Campo "Como conheceu a plataforma"
- [x] Campos condicionais para "Outros"
- [x] Redirecionar para dashboard após finalizar onboarding
- [x] Criar layout compartilhado para telas de autenticação (2 seções)
- [x] Redesenhar tela de Login com novo layout
- [x] Redesenhar tela de Criar Conta com novo layout
- [x] Redesenhar tela de Esqueci Senha com novo layout
- [x] Ajustar estilo dos campos de email e senha conforme referência
- [x] Ajustar posicionamento do conteúdo no lado esquerdo da tela de login
- [x] Dividir onboarding em 2 etapas com indicador de progresso
- [x] Etapa 1: nome, link público, WhatsApp, Instagram, tipo de entrega
- [x] Etapa 2: objetivos com a plataforma, como conheceu
- [x] Mover onboarding para usar AuthLayout com layout de 2 seções
- [x] Colocar campos WhatsApp e Instagram lado a lado no onboarding
- [ ] Corrigir layout do onboarding para igualar ao login

## Correção Layout Onboarding
- [x] Corrigir layout do onboarding para igualar ao login (h-14 nos inputs, pl-12, text-base, p-8 no container, mb-8 no header)
- [x] Ocultar card "Conta criada com sucesso" na segunda etapa do onboarding (Objetivos)
- [x] Remover opção "Outros" da pergunta "Como você conheceu nossa plataforma?" no onboarding

## Nova Etapa Onboarding - Configurações de Atendimento
- [x] Criar Step 2 - Configurações de Atendimento (entre Dados do estabelecimento e Objetivos)
- [x] Campo de endereço do estabelecimento
- [x] Campo de horário de atendimento (padrão 18:00 às 23:00)
- [x] Seleção múltipla de formas de pagamento (Pix, Dinheiro, Cartão)
- [x] Campos de tempo de entrega (de X min até Y min)
- [x] Toggle de pedido mínimo com campo de valor
- [x] Seleção de taxa de entrega (Grátis, Fixa, Por bairros)
- [x] Mensagem informativa quando selecionar "Por bairros"

## Salvar Dados do Onboarding Step 2 no Banco
- [x] Atualizar endpoint establishment.create para aceitar novos campos (address, openingTime, closingTime, acceptsPix, acceptsCash, acceptsCard, deliveryTimeMin, deliveryTimeMax, minimumOrderEnabled, minimumOrderValue, deliveryFeeType, deliveryFeeFixed, allowsDelivery, allowsPickup)
- [x] Atualizar Onboarding para enviar os novos dados na mutation
- [x] Criar horários de funcionamento automaticamente ao criar estabelecimento
- [x] Verificar que página de configurações já carrega os dados salvos (useEffect já implementado)
- [x] Ajustar botões de status do WhatsApp (Conectado/Desconectado) para terem o mesmo tamanho do card Verificando na página de pedidos

## Etapa de Seleção de Planos no Onboarding
- [x] Criar Step 4 - Seleção de Planos (última etapa do onboarding)
- [x] Adicionar 3 cards compactos: Gratuito (15 dias teste), Lite, Pro
- [x] Destacar principais features de cada plano
- [x] Cards um abaixo do outro (não grandes)
- [x] Ajustar botões de status do WhatsApp (Conectado/Desconectado) para terem o mesmo tamanho do card Verificando na página de pedidos
- [x] Corrigir card Preview do Perfil Público na página de configurações para ficar igual ao menu público (adicionar badges de tempo de entrega, pedido mínimo, tipo de entrega)
- [x] Padronizar 100% badges do Preview do Perfil Público no admin (cores, ícones, border-radius, estilos) para serem cópia fiel do menu público
- [x] Ajuste fino pixel perfect do Preview do Perfil Público: altura/padding do container, alinhamento vertical dos pills, espaçamento entre nome/endereço/status
- [x] Adicionar imagem de background na seção vermelha da tela de login com sobreposição vermelha de 40% de transparência
- [x] Remover ícones decorativos (marca d'água) da seção vermelha do AuthLayout
- [x] Corrigir responsividade do lado direito do onboarding para evitar barra de rolagem horizontal em telas menores


## Responsividade Completa do Onboarding
- [x] Container principal com height: 100vh e overflow: hidden
- [x] Área do formulário com overflow-y: auto e scroll interno
- [x] Remover qualquer scroll lateral/horizontal da página
- [x] Reduzir espaçamentos verticais em telas menores
- [x] Garantir que stepper, badge e botão fiquem sempre acessíveis
- [x] Layout funciona corretamente em notebooks menores e resoluções reduzidas


## Correção Scroll Interno Onboarding
- [x] Garantir que o scroll interno funcione corretamente no container do formulário
- [x] Botão Continuar deve estar sempre acessível (via scroll ou fixo)
- [x] Testar em telas com altura reduzida (notebooks menores)
- [x] Reduzir tamanhos de elementos para caber em telas menores (inputs h-10, badges menores, stepper compacto)
- [x] Usar 100dvh para altura dinâmica da viewport


## Responsividade Steps 2, 3 e 4 do Onboarding
- [x] Aplicar mesmas correções de responsividade do Step 1 para Step 2 (Atendimento)
- [x] Aplicar mesmas correções de responsividade do Step 1 para Step 3 (Objetivos)
- [x] Aplicar mesmas correções de responsividade do Step 1 para Step 4 (Plano)
- [x] Testar todos os steps em telas menores


## Consistência Layout Step 4
- [x] Ajustar Step 4 para ter título e descrição na mesma posição das etapas anteriores


## Consistência Visual Onboarding x Login
- [x] Copiar exatamente o estilo da seção lateral esquerda da tela de login para o onboarding
- [x] Incluir a mesma imagem/foto que aparece na tela de login
- [x] Manter mesma posição dos textos e elementos


## Validação Onboarding
- [x] Step 1: Botão Continuar só habilitado quando todos os campos estiverem preenchidos
- [x] Step 1: Instagram com @ automático no início
- [x] Step 2: Validação de campos obrigatórios
- [x] Step 3: Validação de campos obrigatórios
- [x] Step 4: Validação de campos obrigatórios


## Correção Link WhatsApp
- [x] Adicionar código do país 55 no link do WhatsApp no menu público
- [x] Adicionar código do país 55 no link do WhatsApp na página de Configurações
- [x] Adicionar código do país 55 no link do WhatsApp na página de Pedidos


## Verificação Disponibilidade Slug
- [x] Criar endpoint para verificar se o slug está disponível (já existia)
- [x] Adicionar ícone de check verde quando disponível
- [x] Adicionar ícone de X vermelho quando indisponível
- [x] Verificação em tempo real enquanto o usuário digita (debounce 500ms)
- [x] Mensagem de feedback abaixo do campo
- [x] Botão Continuar só habilitado quando slug disponível


## Validação Instagram Obrigatório
- [x] Adicionar campo Instagram como obrigatório na validação do Step 1


## Responsividade Onboarding Telas Grandes v2
- [x] Container do formulário com max-width responsivo e centralizado (xl:max-w-lg, 2xl:max-w-xl)
- [x] Espaçamentos laterais, superior e inferior máximos (xl:p-8, 2xl:p-10, py-4/6/8)
- [x] Tipografia responsiva com breakpoints xl/2xl (títulos até 2xl:text-3xl)
- [x] Padding e gaps proporcionais em telas grandes (space-y-5/6)
- [x] Layout equilibrado que funciona em todas as larguras de tela
- [x] StepIndicator maior em telas grandes (2xl:w-8 h-8)
- [x] Inputs maiores em telas grandes (xl:h-13, 2xl:h-14)


## Validação WhatsApp Obrigatório
- [x] Adicionar campo WhatsApp como obrigatório na validação do Step 1 (mínimo 10 dígitos)


## Link Voltar no Step 1
- [x] Adicionar link "Voltar ao login" com ícone de seta abaixo do botão Continuar no Step 1


## Navegação Suave Voltar ao Login
- [x] Alterar link "Voltar ao login" para usar Link do wouter em vez de tag <a> para evitar reload da página


## Corrigir Reload Voltar ao Login
- [x] Investigar por que a página ainda recarrega ao clicar em Voltar ao login
- [x] Usar useLocation do wouter para navegação programática via setLocation


## Reorganizar Menu Lateral
- [x] Criar seção OPERAÇÕES com Dashboard
- [x] Criar seção GESTÃO com Pedidos, Cardápio, Cupons, Estoque
- [x] Adicionar títulos de seção no menu lateral
- [x] Botão Voltar como link de texto abaixo do Continuar em todas as etapas do onboarding (Steps 2, 3 e 4)
- [x] Ajustar espaçamentos das seções do menu lateral (OPERAÇÕES, GESTÃO) para melhor hierarquia visual

## Página de Categorias
- [x] Adicionar item "Categorias" no menu lateral (seção GESTÃO, abaixo de Cardápio)
- [x] Criar página /categorias com visual similar ao modo reordenar
- [x] Implementar funcionalidade de criar nova categoria
- [x] Implementar funcionalidade de editar categoria (inline)
- [x] Implementar funcionalidade de excluir categoria
- [x] Implementar drag and drop para reordenar categorias
- [x] Remover botão "Nova Categoria" da página Catálogo
- [x] Manter apenas botões "Novo Item" e "Reordenar" na página Catálogo
- [ ] Remover botão Reordenar da página Catálogo (funcionalidade movida para página Categorias)
- [ ] Adicionar botão Reordenar na página de Categorias
- [x] Adicionar seção SISTEMA no menu lateral
- [x] Criar página de Configurações com abas: Estabelecimento, Atendimento, Impressoras, Notificações, WhatsApp, Teste Impressão
- [x] Remover aba Teste da seção WhatsApp nas configurações
- [x] Remover seção Validade da Nota do card de Nota do Restaurante
- [x] Remover sugestões rápidas específicas do card de Nota do Restaurante
- [x] Remover estilos de balão: Pêssego, Menta, Roxo, Doce, Real, Pôr do Sol
- [x] Remover card de preview do balão e mostrar preview temporário sobre a cor selecionada
- [x] Corrigir tempo de exibição (5s) e quebra de linha no preview do balão
- [x] Reorganizar aba Estabelecimento: Preview (60%) ao lado do Endereço (40%) com campos verticais
- [x] Remover validade de 24h da nota - nota fica permanente até ser removida manualmente
- [x] Reorganizar campos do Endereço: Número/Bairro/Cidade/UF juntos, Complemento/CEP juntos
- [x] Ajustar altura do card de Endereço para igualar ao Preview do Perfil Público
- [x] Alterar estilo das abas em Configurações para texto simples com aba ativa em azul
- [x] Remover sugestão rápida 'Promoção válida hoje!' do card de Nota
- [x] Remover aba Notificações da página de Configurações
- [x] Ajustar espaçamento das abas na página de Configurações para ficar na mesma altura das demais páginas
- [x] Implementar badge de status (Aberto/Fechado) abaixo do nome do restaurante no header da sidebar
- [x] Corrigir bug de vazamento de áudio ao recarregar página com som desativado
- [x] Corrigir som de notificação não tocando na versão mobile
- [x] Corrigir som de notificação não tocando em dispositivos Android
- [x] Adicionar vibração como feedback adicional em dispositivos Android
- [x] Corrigir toast e som de notificação não funcionando no Android (logs de debug adicionados)
- [x] Corrigir notificação de novo pedido para aparecer em todas as páginas do dashboard, não apenas na página de Pedidos
- [x] Ajustar modal de detalhes do pedido: remover botão WhatsApp do rodapé, estilizar botão Mensagem com verde e ícone WhatsApp, mover Imprimir para linha do título, remover X de fechar
- [x] Adicionar ícone do WhatsApp no botão de mensagem e ícone de telefone no botão de ligar no modal de detalhes do pedido
- [ ] Corrigir notificação de novo pedido não aparecendo na versão mobile fora da página de pedidos
- [x] Corrigir persistência do estado do toggle de som após refresh da página
- [ ] Corrigir erro intermitente 'The string did not match the expected pattern' no fluxo de login
- [ ] Corrigir erro intermitente 'The string did not match the expected pattern' no login
- [ ] Corrigir erro intermitente 'The string did not match the expected pattern' no login
- [x] Corrigir erro intermitente 'The string did not match the expected pattern' no login (Safari/iOS)
- [x] Adicionar estrela ao lado da nota de avaliação no menu público
- [x] Mostrar quantidade de avaliações apenas na versão desktop (ocultar no mobile)
- [x] Mostrar texto completo "(X avaliações)" na versão desktop, manter apenas número no mobile
- [x] Mostrar quantidade de avaliações no mobile apenas com número ex: (5)
- [x] Reorganizar campos WhatsApp e Instagram na mesma linha que Link do Cardápio em Configurações básicas
- [x] Remover opção de boleto do card de Formas de pagamento
- [x] Mover card de Cartão Fidelidade para a aba de Estabelecimento
- [x] Reorganizar campos do Cartão Fidelidade (tipo cupom, valor desconto, valor mínimo) na mesma linha dos carimbos
- [x] Mover campo de Carimbos necessários para a mesma linha do toggle Ativar Cartão Fidelidade
- [x] Adicionar botão "Sugestões" na mesma linha do campo de nota do restaurante que exibe as 4 sugestões ao clicar
- [x] Ajustar layout do Cartão Fidelidade - campos Tipo de cupom, Desconto e Valor mínimo na mesma linha
- [x] Corrigir layout do Cartão Fidelidade - garantir 3 campos na mesma linha em desktop sem quebra
- [x] Reorganizar Cartão Fidelidade - todos os 4 campos dentro do card Ativar (carimbos, tipo cupom, desconto, valor mínimo)
- [x] Colocar todos os 4 campos do Cartão Fidelidade na mesma linha após o toggle de ativação
- [x] Alterar texto do botão de sugestões para "Ver sugestões de notas"
- [x] Alterar botão "Ver sugestões de notas" para cor vermelha e adicionar ícone de balão
- [x] Mover tempo de entrega e pedido mínimo para card de Tipo de entrega e renomear para "Informações e entrega"
- [x] Simplificar textos descritivos de tempo de entrega e pedido mínimo
- [x] Reorganizar card Informações e entrega - colocar tempo de entrega e pedido mínimo lado a lado com seleção de entrega/retirada
- [x] Reorganizar card Formas de pagamento com opções menores e retangulares (checkbox à esquerda, texto à direita)
- [x] Mover card Notificações SMS para ficar ao lado do card Formas de pagamento
- [x] Colocar opções Dinheiro, Cartão e Pix na mesma linha no card de Formas de pagamento
- [x] Redesenhar card Informações e entrega com formato compacto (checkbox à esquerda, texto à direita)
- [x] Colocar Pedido mínimo abaixo de Tempo de entrega no card Informações e entrega
- [x] Mover card Taxa de entrega para ao lado do card Informações e entrega
- [x] Deixar card Taxa de entrega em formato compacto e retangular
- [x] Remover card "Como funciona a impressão" da aba Impressoras em Configurações

## Remoção do Card Configurações de Impressão
- [x] Remover card "Configurações de Impressão" da aba Impressoras (manter apenas "Impressoras Cadastradas")
- [x] Remover card "Texto Personalizado" da aba Teste Impressão em Configurações

## Reorganização da Aba Impressoras
- [x] Mover card "Impressoras Cadastradas" da aba Impressoras para aba Teste Impressão
- [x] Posicionar card acima de "Configurações de Layout"
- [x] Remover aba Impressoras (ficará vazia)

## Ajustes no Modal de Impressora
- [x] Remover botão "Testar Conexão" do modal de Editar Impressora
- [x] Colocar campo Porta na mesma linha do campo Endereço IP

## Renomear Aba de Impressão
- [x] Renomear aba "Teste Impressão" para "Impressora e Teste"

<<<<<<< Updated upstream
## Botão de Favorito nas Opções de Impressão
- [x] Adicionar campo de preferência de impressão padrão no banco de dados (normal ou android)
- [x] Adicionar botão de favorito (coração vermelho vazado/preenchido) ao lado de cada opção no menu Imprimir
- [x] Implementar lógica para apenas uma opção ser favorita por vez
- [x] Salvar preferência do usuário no banco de dados
- [ ] Usar opção favorita automaticamente ao aceitar pedidos

## Ajuste no Ícone de Favorito
- [x] Trocar ícone de coração por estrela no menu de impressão favorita

## Correção do Favorito de Impressão
- [ ] Corrigir comportamento de seleção exclusiva do favorito (clicar na estrela não está mudando)

## Correção da Impressão ao Aceitar Pedido
- [x] Corrigir lógica de impressão ao aceitar pedido - usar método favorito correto (normal ou android)
- [x] Quando favorito é "normal", abrir tela de impressão do navegador
- [x] Quando favorito é "android", mostrar mensagem para usar app Android

## Layout de Impressão Normal
- [x] Atualizar layout da impressão normal para ficar idêntico ao modelo Android
- [x] Adicionar badge RETIRADA/ENTREGA ao lado do número do pedido
- [x] Usar cards arredondados para Retirada, Pagamento e Cliente
- [x] Manter mesma estrutura visual: cabeçalho, itens, subtotal, total destacado, cards de info

## Impressão Normal em PDF
- [x] Usar endpoint existente /api/print/receipt/:orderId (HTML otimizado)
- [x] Ajustar função handlePrintOrderDirect para abrir recibo em nova aba
- [x] Garantir que funcione em celular (abrir em nova aba para imprimir/salvar PDF)

## Impressão Normal com Janela de Impressão Automática
- [x] Modificar endpoint de recibo para incluir window.print() automático ao carregar
- [x] Garantir que a janela de impressão abra automaticamente no celular e desktop

## Remoção do Card de Avaliação Gratuita
- [x] Remover card "Avaliação gratuita" da barra lateral

## Correção de Erro useOrdersSSE
- [x] Corrigir erro TypeError: Cannot read properties of undefined (reading 'substring') na linha 17

## Problema de Notificações SSE
- [ ] Investigar por que notificações de novos pedidos não estão sendo recebidas
- [ ] Verificar se o novo domínio v2.mindi.com.br está afetando a conexão SSE


## Correção da Lógica de Status Aberto/Fechado
- [x] Corrigir lógica para usar apenas horários configurados (sem depender do toggle isOpen)
- [x] Se estiver dentro do horário de funcionamento configurado, mostrar como Aberto
- [x] O campo manuallyClosed deve ser usado apenas para fechamento manual temporário

## Bottom Sheet para Categorias Mobile
- [x] Implementar modal estilo bottom sheet na página de categorias para versão mobile
- [x] Abrir bottom sheet ao clicar em categoria para editar
- [x] Abrir bottom sheet ao adicionar nova categoria

## Correção de Formatação de Preço
- [x] Corrigir problema onde preço 22,00 digitado no catálogo aparece como 2,200.00 no menu público

## Correção do Campo de Preço dos Complementos
- [x] Campo de preço dos complementos não aceita digitação
- [x] Erro ao salvar complementos com preço no formato brasileiro (0,00)

## Correção do Estado do Formulário ao Trocar de Aba
- [x] Estado do formulário de edição é perdido ao trocar de aba do navegador e voltar
=======
## Drag and Drop para Grupos de Opções
- [ ] Implementar arrastar e soltar para reordenar grupos de opções na tela Editar Item
- [ ] Feedback visual ao arrastar (sombra, opacity, placeholder)
- [ ] Salvar nova ordem no backend automaticamente
>>>>>>> Stashed changes

## Drag and Drop para Grupos de Opções
- [x] Implementar drag and drop para reordenar grupos de complementos na tela de Editar Item
- [x] Feedback visual ao arrastar (sombra, opacity, placeholder)
- [x] Salvar nova ordem no backend
- [x] Bug: Preços dos complementos multiplicam por 100 ao salvar (problema na conversão de formato)
- [x] Desabilitar menu Estoque na sidebar com badge 'Breve' e sem navegação
- [x] Desabilitar menu Planos no dropdown do usuário com badge 'Breve' e sem navegação
- [x] Alterar cor das abas de navegação em Configurações de azul escuro para vermelho (cor primária)
- [x] Implementar novo modelo de rodapé no menu público com gradiente e botão 'Experimente grátis'
- [x] Bug: Complementos não aparecem na impressão do pedido
- [x] Centralizar recibo na impressão normal
- [x] Adicionar tarja preta no TOTAL e badge ENTREGA na impressão normal
- [x] Forçar cores de fundo (badges pretos) na impressão normal
- [ ] Bug: Imagens dos produtos não estão carregando no admin e menu público
- [ ] Migrar imagens dos produtos do CloudFront antigo para o novo storage do Manus
- [ ] Bug: Upload de novas imagens não está funcionando
- [x] Adicionar link WhatsApp no rodapé do menu público (Bigteck e Experimente grátis) - 5588999290000
- [x] Migrar sistema de storage para S3 próprio do usuário
- [x] Mostrar quantidade de itens ao lado do nome da categoria na página /categorias

## Toggle e Exclusão de Categorias
- [x] Adicionar campo isActive no schema de categorias
- [x] Remover menu de 3 pontinhos das categorias
- [x] Adicionar toggle ativar/pausar categoria
- [x] Adicionar ícone de lixeira para excluir categoria
- [x] Implementar regra: categoria pausada não aparece no menu público
- [x] Implementar regra: categoria ativa sem itens ativos não aparece no menu público
- [x] Implementar regra: categoria ativa com pelo menos 1 item ativo aparece no menu público
- [x] Exibir confirmação ao excluir categoria
- [x] Toggle de categoria deve mostrar desativado quando todos os itens estão pausados

## Sistema de Complementos Globais
- [x] Atualizar schema: adicionar campos status, priceMode na tabela complements
- [ ] Criar tabela de vínculo produto-complemento (product_complements)
- [x] Criar endpoints CRUD para complementos globais
- [x] Criar página de gestão de Complementos no admin
- [ ] Implementar toggle ativo/pausado para complementos
- [ ] Implementar toggle preço normal/grátis para complementos
- [ ] Atualizar vinculação produto-complemento para usar IDs
- [x] Atualizar menu público para respeitar status e priceMode dos complementos
- [ ] Migrar dados existentes de complementos para o novo modelo
- [ ] Corrigir página de Complementos para mostrar itens de complemento, não produtos
- [x] Adicionar edição de preço na página de Complementos Globais

## Controle de Quantidade por Complemento
- [ ] Atualizar schema do banco para quantidade de complemento no pedido
- [ ] Atualizar UI do modal de detalhes do item com controle de quantidade (+/-)
- [x] Atualizar cálculo de preço dos complementos (preço × quantidade)
- [ ] Atualizar exibição dos complementos nos detalhes do pedido (admin)
- [x] Atualizar impressão do pedido com quantidade (ex: 3x Bacon R$ 16,50)
- [x] Corrigir exibição de quantidade de complemento no Modal Sua Sacola
- [x] Corrigir exibição de quantidade de complemento no Modal Resumo do Pedido
- [x] Corrigir exibição de quantidade de complemento no Modal Confirmar Endereço
- [x] Corrigir exibição de quantidade de complemento na Impressão
- [x] Corrigir exibição de quantidade de complemento na Notificação WhatsApp

## Bugs de Impressão
- [x] Bug: Quantidade de complementos não aparece na impressão normal (ex: "+ 4x Dose de Vodka Orloff")
- [x] Bug: Impressão múltiplas impressoras está saindo em branco (era problema de URL dev vs produção)

## Limpeza de Banco de Dados
- [x] Excluir tabela business_hours duplicada (usar apenas businessHours)

## Bug Toggle Status Restaurante
- [x] Corrigir toggle de status no perfil para refletir estado real (verde=aberto, vermelho=fechado baseado nos horários)

## Bug Acumulado da Semana
- [x] Corrigir erro de timezone no cálculo do card Acumulado da Semana (pedidos sendo atribuídos ao dia errado)

## Disponibilidade de Complementos por Dias/Horários
- [x] Atualizar schema do banco de dados para armazenar disponibilidade de complementos
- [x] Implementar lógica de validação de disponibilidade no backend
- [x] Criar UI de configuração de disponibilidade no admin (dropdown)
- [x] Filtrar complementos indisponíveis no menu público
- [x] Validar disponibilidade antes de adicionar ao carrinho

## Ajuste de Layout - Complementos
- [x] Colocar nome, preço e "Usado em X produtos" na mesma linha

## Opção "Consumir no local"
- [x] Atualizar schema do banco para suportar deliveryType 'dine_in'
- [x] Adicionar opção "Consumir no local" na UI do menu público
- [x] Atualizar lógica de fluxo para pular endereço quando dine_in
- [x] Atualizar exibição em sacola, resumo, admin, impressão e notificações

## Configuração "Consumir no local" por Estabelecimento
- [x] Adicionar campo dineInEnabled no schema do estabelecimento
- [x] Adicionar toggle no card de Informações e Entrega nas configurações
- [x] Filtrar opção no menu público baseado na configuração

## Bug Hooks PublicMenu
- [x] Corrigir erro "Rendered more hooks than during the previous render" - mover useEffect para antes dos early returns

## Remover Taxa de Entrega dos Modais
- [x] Remover taxa de entrega do modal "Sua Sacola"
- [x] Remover taxa de entrega do modal "Resumo do Pedido"

## Bug Taxa de Entrega nos Modais Seguintes
- [x] Verificar e corrigir exibição da taxa de entrega nos modais após selecionar "Entrega"

## Bug Sidebar Detalhes do Pedido - Consumo no local
- [x] Remover "Taxa de Entrega" do container "Itens do Pedido" quando for consumo no local
- [x] Alterar título "Entrega e Pagamento" para "Consumo no local e Pagamento" quando for dine_in

## Bug Taxa de Entrega no Modal Sua Sacola
- [x] Remover completamente a taxa de entrega do modal Sua Sacola (mesmo com taxa fixa)

## Ajuste Badge Impressão
- [x] Alterar badge de "CONSUMO LOCAL" para "CONSUMO" no modelo de impressão normal
- [x] Verificar e ajustar modelo de múltiplas impressoras para usar "CONSUMO"

## Tooltip nas Estrelas de Impressão
- [x] Adicionar tooltip informativo nas estrelas de favoritar das opções de impressão (Impressão Normal e Múltiplas Impressoras)

## Correção Texto Tipo Pedido na Impressão
- [x] Corrigir texto de "Retirada: Cliente irá retirar no estabelecimento" para "Consumo: Cliente irá consumir no local" quando tipo é dine_in
- [x] Verificar e corrigir no modelo de múltiplas impressoras Android (não possui esse campo, usa apenas badge)

## Mensagem Informativa Consumir no Local
- [x] Adicionar mensagem de aviso quando usuário selecionar "Consumir no local" no menu público

## Link WhatsApp na Mensagem de Consumo Local
- [x] Adicionar link clicável no texto "WhatsApp" para abrir conversa com número do restaurante

## Dropdown Card Complementos
- [x] Fazer dropdown abrir ao clicar em qualquer parte do card de complemento

## Bug Fix - Dropdown Card Complementos
- [x] Corrigir dropdown que não abre ao clicar no card de complemento

## Dropdown Único Complementos
- [x] Fechar dropdown anterior ao abrir outro card de complemento


## Integração iFood via Webhook
- [x] Configurar credenciais iFood como variáveis de ambiente
- [x] Implementar autenticação OAuth2 com iFood (obter e renovar tokens)
- [x] Criar endpoint de Webhook para receber eventos do iFood
- [x] Atualizar schema do banco para suportar pedidos externos (source, externalId, etc)
- [x] Implementar processamento de pedidos do iFood (converter para formato interno)
- [x] Implementar envio de acknowledgment para eventos recebidos
- [x] Implementar sincronização de status (confirmar, despachar, cancelar)
- [x] Adicionar badge visual "iFood" nos cards de pedidos
- [ ] Adicionar filtro por origem do pedido na página de Pedidos
- [ ] Testar integração com pedidos de teste do iFood

## Aba de Integrações nas Configurações
- [x] Criar tabela no banco para armazenar credenciais de integração por estabelecimento
- [x] Criar endpoints tRPC para gerenciar integrações (salvar, buscar, testar conexão)
- [x] Criar página de Integrações nas Configurações com formulário para iFood
- [x] Atualizar lógica do webhook para usar credenciais por estabelecimento
- [x] Adicionar toggle para ativar/desativar integração iFood

## Fluxo OAuth Distribuído iFood (Simplificado para Cliente)
- [x] Atualizar backend com endpoints para fluxo OAuth distribuído (getUserCode, exchangeAuthCode)
- [x] Atualizar tabela ifoodConfig para armazenar tokens OAuth por estabelecimento
- [x] Remover campos Client ID e Client Secret da tela de Integrações
- [x] Adicionar botão "Conectar iFood" que inicia o fluxo OAuth
- [x] Adicionar campo para colar código de autorização do Partner Portal
- [x] Implementar renovação automática de tokens (refresh token)
- [x] Mostrar status de conexão (Conectado/Desconectado) na tela

## Som Específico para Pedidos iFood
- [x] Copiar arquivo de som do iFood para o projeto (client/public)
- [x] Atualizar lógica de notificação para tocar som diferente quando pedido for do iFood

## Bug Fix - Erro Grant Type iFood
- [ ] Corrigir erro "Grant type not authorized for client" na integração iFood


## Modelo Centralizado iFood (Apenas Merchant ID)
- [x] Simplificar tela de Integrações para pedir apenas Merchant ID
- [x] Remover fluxo OAuth distribuído (não suporta webhook)
- [x] Usar credenciais globais do sistema para autenticação

## Validação do Merchant ID iFood
- [x] Implementar função de validação do Merchant ID com a API do iFood
- [x] Validar Merchant ID antes de salvar e marcar como conectado
- [x] Mostrar mensagem de erro se Merchant ID for inválido
- [x] Mostrar feedback de carregamento durante validação

## Correção Som de Notificação Pedidos iFood
- [x] Identificar onde o som é tocado para pedidos normais
- [x] Adicionar campo source ao objeto SSE para identificar origem do pedido
- [x] Garantir que o source seja enviado em createPublicOrder e confirmOrderByNumber
- [x] Implementar diferenciação de som para pedidos iFood vs interno

## Remoção Card Outras Integrações
- [x] Remover card "Outras Integrações" da aba Integrações em Configurações

## Bug: Som do iFood não está tocando
- [x] Investigar por que o som específico do iFood não está sendo tocado
- [x] Verificar se o campo source está sendo enviado corretamente via SSE
- [x] Corrigir o problema identificado

## Alteração Rodapé Impressões
- [x] Alterar "Pedido realizado via Cardapio Admin manus.space" para "Pedido realizado via v2.mindi.com.br"
- [x] Aplicar nos dois modelos: impressão normal e Android

## Bug: Webhook iFood processa pedidos de merchants desconectados
- [x] Verificar se o merchant está conectado antes de processar pedido no webhook
- [x] Ignorar pedidos de merchants que não estão conectados no sistema

## Bug: Faturamento Hoje mostrando valores de ontem
- [x] Investigar o filtro de data no cálculo do faturamento
- [x] Corrigir para mostrar apenas pedidos do dia atual (timezone Brasil)

## Bug: Notificação automática com Confirmação via Botões desativada
- [x] Quando desativado, enviar template NOVO PEDIDO sem texto "Clique para confirmar"
- [x] Remover botão "Sim, confirmar pedido" quando confirmação está desativada

## Bug: Taxa de entrega aplicada em pedidos de retirada (pickup)
- [x] Corrigir cálculo da taxa de entrega para zerar quando deliveryType é pickup ou dine_in
- [x] Verificar todos os locais onde deliveryFee é calculado no PublicMenu.tsx

## Opção Retirar no Local no Modal de Bairro
- [x] Adicionar opção fixa "Retirar no local" no topo do modal de seleção de bairro
- [x] Destacar visualmente a opção (cor verde, texto "Grátis")
- [x] Ao selecionar, definir deliveryType como pickup automaticamente
- [x] Zerar taxa de entrega ao selecionar retirada

## Opção Consumir no Local no Modal de Bairro
- [x] Adicionar opção "Consumir no local" no modal de seleção de bairro
- [x] Destacar visualmente similar à opção de retirada (azul)
- [x] Ao selecionar, definir deliveryType como dine_in automaticamente

## Layout Opções Retirar/Consumir no Modal de Bairro
- [x] Colocar opções lado a lado no desktop (md:flex-row)
- [x] Reduzir altura em 30% (py-2.5 em vez de py-4)
- [x] Manter empilhadas no mobile (flex-col)

## Bug: Taxa de entrega não exibida corretamente na sacola desktop
- [x] Corrigir exibição da taxa de entrega na sacola desktop quando bairro é selecionado
- [x] Adicionar taxa de entrega no resumo do modal de confirmação (step 3)
- [x] Garantir que a taxa de entrega seja exibida corretamente para pickup/dine_in (R$ 0,00)

## Bug: Texto incorreto na sacola para Consumir/Retirar no local
- [x] Alterar "Taxa de entrega Grátis" para "Consumir no local Grátis" quando dine_in selecionado
- [x] Alterar "Taxa de entrega Grátis" para "Retirar no local Grátis" quando pickup selecionado

## Bug: Modal de tipo de entrega mostra opções incorretas
- [x] No modal de confirmação (step 2), mostrar apenas a opção de entrega já selecionada
- [x] Adicionar botão "Alterar" dentro da opção selecionada para voltar ao modal de seleção de bairro
- [x] Remover as outras opções de entrega do modal de confirmação

## Ajuste: Remover nome do bairro do modal de tipo de entrega
- [x] Alterar "Entrega - Bairro X" para apenas "Entrega" no modal de tipo de entrega (step 2)

## Bug: Erro de permissão ao inserir merchant ID do iFood
- [ ] Investigar código de integração iFood que valida merchant ID
- [ ] Identificar causa do erro "Sem permissão para acessar este merchant"
- [ ] Corrigir validação ou mensagem de erro

## Validação de Critérios de Homologação iFood
- [x] Analisar código atual da integração iFood
- [x] Criar checklist de critérios obrigatórios
- [ ] Testar recebimento de eventos via polling/webhook
- [ ] Testar processamento de pedidos delivery (IMMEDIATE e SCHEDULED)
- [ ] Testar processamento de pedidos para retirar (TAKEOUT)
- [ ] Testar cancelamento de pedidos com motivos
- [ ] Testar exibição de informações de pagamento
- [ ] Testar exibição de observações dos itens
- [ ] Testar sincronização de status com outros sistemas
- [ ] Documentar gaps e correções necessárias

## Implementar informações do iFood no modal de detalhes do pedido
- [x] Exibir data/hora de entrega para pedidos agendados (SCHEDULED)
- [x] Exibir bandeira do cartão quando pagamento em cartão
- [x] Exibir valor do troco quando pagamento em dinheiro
- [x] Exibir CPF/CNPJ do cliente quando informado
- [x] Destacar código de coleta do iFood (displayId)
- [x] Exibir responsável pelo desconto (iFood/Loja)
- [x] Exibir observações de entrega (delivery.observations)

## Bug: '0' solto na seção de informações do iFood
- [x] Identificar causa do bug (condição && renderizando 0 quando benefits.length é 0)
- [x] Corrigir condição para usar optional chaining (benefits?.length > 0)

## Validação Final de Critérios de Homologação iFood
- [x] Verificar exibição de data/hora de pedidos agendados (SCHEDULED)
- [x] Verificar exibição de bandeira do cartão
- [x] Verificar exibição de valor do troco
- [x] Verificar exibição de CPF/CNPJ do cliente
- [x] Verificar destaque do código de coleta (displayId)
- [x] Verificar exibição de responsável pelo desconto (iFood/Loja)
- [ ] Implementar Plataforma de Negociação (verificar se obrigatório)
- [ ] Implementar verificação de duplicação de eventos
- [x] Preparar documentação para sessão de homologação

## Refatoração Visual da Página de Templates
- [ ] Criar sistema de abas para navegação entre templates (Novo Pedido, Preparando, Pronto, Finalizado, Cancelado)
- [ ] Layout em duas colunas: editor à esquerda, preview à direita
- [ ] Mover variáveis para card separado com tags clicáveis
- [ ] Preview estilo WhatsApp real (bolha verde, horário, checkmarks ✓✓)
- [ ] Reduzir texto técnico visível na tela principal
- [ ] Manter toda a lógica de salvamento e carregamento atual

## Refatoração Visual da Página de Templates
- [x] Criar tabs horizontais com nomes dos modelos (Novo Pedido, Preparando, Pronto, Finalizado, Cancelado)
- [x] Mover variáveis para card separado com tags clicáveis
- [x] Layout em duas colunas: editor à esquerda, preview à direita
- [x] Preview estilo WhatsApp (bolha verde, horário, checkmarks)
- [x] Reduzir texto técnico visível
- [x] Manter lógica atual de salvamento

## Redesign dos 3 Cards da Página de Templates
- [ ] Criar novo modelo visual para o card de Variáveis disponíveis
- [ ] Criar novo modelo visual para o card do Editor de texto
- [ ] Criar novo modelo visual para o card de Preview WhatsApp
- [ ] Manter botões de navegação (Novo Pedido, Preparando, etc.) no lugar atual

## Correção do Preview WhatsApp
- [x] Mover balão de mensagem para o lado esquerdo (mensagem recebida pelo cliente)
- [x] Usar cor branca no balão (mensagem recebida) em vez de verde
- [x] Adicionar nome do restaurante no header do preview

## Preview WhatsApp no Editor de Templates
- [x] Buscar dinamicamente o nome do restaurante do banco de dados para exibir no header do preview WhatsApp

## Card de Visualizações do Cardápio no Dashboard
- [x] Criar tabela menu_sessions no schema do banco de dados
- [x] Executar migração (pnpm db:push)
- [x] Implementar procedure pública para registrar sessão do cardápio
- [x] Implementar procedure protegida para contar visualizações ativas
- [x] Implementar procedure para buscar histórico de visualizações (últimos 7 dias)
- [x] Implementar hook no cardápio público para registrar sessões
- [x] Criar componente ViewsCard com sparkline e estados de cores
- [x] Integrar card no Dashboard ao lado do card de Acumulados da Semana
- [x] Implementar estados visuais: alta (verde), queda (vermelho), neutro (cinza)
- [x] Implementar tratamento de edge cases (poucas visualizações, sem dados)

- [x] Ajustar a fonte do card de Visualizações para usar a mesma fonte do sistema admin
- [x] Ajustar a altura do card de Visualizações para ser igual ao card de Acumulado da Semana

## Mapa de Calor de Visualizações
- [x] Criar tabela menu_views_hourly no schema para armazenar visualizações por hora
- [x] Implementar procedure para buscar dados do mapa de calor (7 dias x 24 horas)
- [x] Atualizar registro de sessão para incluir hora
- [x] Criar componente HeatmapCard com grid de dias x horas
- [x] Implementar escala de cores (azul claro a azul escuro)
- [x] Adicionar legenda "Menos" a "Mais"
- [x] Integrar HeatmapCard no Dashboard substituindo o ViewsCard simples

- [x] Mover HeatmapCard para ao lado do card de Acumulado da Semana (40% do espaço)
- [x] Alterar informação de hover para tooltip flutuante acima da célula
- [x] Ajustar altura do card de Acumulado da Semana para ser igual ao card de Mapa de Calor
- [x] Ajustar header do card de Acumulado da Semana para ter ícone à esquerda, título e descrição breve (mesmo modelo do Mapa de Calor)
- [x] Adicionar ícone de informação (ⓘ) no card de Mapa de Calor com tooltip explicativo


## Página de Disparo de SMS (Campanhas)
- [x] Adicionar seção "Marketing" na sidebar
- [x] Adicionar menu "Campanhas" dentro da seção Marketing
- [x] Criar rota /campanhas no App.tsx
- [x] Criar página de Campanhas com 4 cards informativos (Saldo, Custo por SMS, Quantidade possível, Último disparo)
- [x] Implementar layout em duas colunas (editor à esquerda, preview à direita)
- [x] Criar editor de mensagem SMS com limite de 152 caracteres e contador em tempo real
- [x] Criar bloco de seleção de destinatários com 3 abas (Base de clientes, Importar CSV, Adicionar manualmente)
- [x] Mostrar total de destinatários selecionados
- [x] Adicionar botão "Disparar SMS"
- [x] Criar preview visual do SMS no formato de celular
- [x] Ajustar os 4 cards informativos da página de Campanhas SMS para seguir o mesmo modelo visual dos cards do Dashboard
- [x] Mover ícone de informação (i) para o final da linha "Mensagem SMS"
- [x] Mover contador de caracteres para dentro do campo de texto no canto inferior direito
- [x] Ajustar campo de mensagem SMS para ter apenas uma área de texto sem quebras de linha extras
- [x] Posicionar contador de caracteres no canto inferior direito na mesma linha do placeholder

## Melhorias na Página de Campanhas SMS
- [x] Formatar número de telefone automaticamente com +55 e máscara (XX) X XXXX-XXXX na aba Adicionar Manual
- [x] Buscar clientes reais do banco de dados na aba Base de Clientes (clientes que fizeram pedidos)

## Correção de Timezone no Heatmap
- [x] Corrigir timezone do registro de visualizações do cardápio para usar horário de São Paulo (UTC-3) em vez de UTC

## Ajuste do Campo de Mensagem SMS
- [x] Campo de mensagem deve ter apenas uma linha inicialmente (altura mínima)
- [x] Contador de caracteres deve ficar na mesma linha do placeholder (à direita)
- [x] Campo só deve expandir quando a mensagem for grande

## Ajuste do Preview SMS
- [x] Remover modelo de celular do preview SMS
- [x] Usar estilo de card similar ao preview de WhatsApp da página de templates

## Ajuste do Estilo do Preview SMS (iOS Style)
- [x] Mudar preview para estilo iOS com header "< Mensagens" e fundo cinza claro

## Investigação do Envio SMS
- [x] Verificar logs do servidor para identificar erro no envio SMS via Disparo Pro
- [x] Corrigir integração com API Disparo Pro se necessário

## Sistema de Saldo SMS
- [x] Criar tabela sms_balance no banco de dados para armazenar saldo de cada estabelecimento
- [x] Criar tabela sms_transactions para histórico de transações (créditos e débitos)
- [x] Implementar procedure para buscar saldo atual do estabelecimento
- [x] Implementar débito automático do saldo ao enviar SMS com sucesso
- [x] Bloquear envio se saldo insuficiente
- [x] Atualizar frontend para usar saldo real em vez de dados mockados


## Ajustes de UX - Campanhas SMS
- [x] Alterar custo padrão por SMS de R$ 0,08 para R$ 0,10
- [x] Mascarar números de telefone na lista de destinatários (ex: +55 11 9 9929-00**)
- [x] Definir saldo inicial de R$ 0,10 para novos usuários (1 SMS de teste)


## Menu Campanhas - Badge Breve
- [x] Adicionar badge "Breve" no menu de Campanhas igual ao menu de Estoque


## Reorganização do Menu
- [x] Mover menu de Cupons para a seção de Marketing

## Badge Breve no Menu Cupons
- [x] Adicionar badge "Breve" ao menu de Cupons igual aos outros menus


## Est## Estilo de Seleção do Menu
- [x] Alterar estilo de seleção do menu para barra vermelha clara à esquerda e fundo vermelho escuro

## Página PDV (Ponto de Venda)
- [x] Criar página PDV.tsx com layout de duas colunas
- [x] Coluna esquerda: grade de produtos com categorias no topo
- [x] Coluna direita: sacola estilo menu público (mais alta)
- [x] Topo da sacola: seletor de tipo de pedido (Mesa, Retirada, Entrega)
- [x] Cards de produto com foto, título, descrição e botão adicionar
- [x] Modal de detalhes do item (reutilizar modelo do menu público)
- [x] Adicionar rota /pdv no App.tsx
- [x] Adicionar menu PDV na seção Operações da sidebar
- [x] Manter identidade visual do sistema (bordas coloridas, estilo de cards)

## Ajustes de Layout no PDV
- [x] Remover título "PDV" e descrição do topo da página
- [x] Ajustar categorias para ficarem em uma única linha com scroll horizontal
- [x] Evitar quebra de linha automática nas categorias

## Correção dos botões de categorias no PDV
- [x] Corrigir texto cortado nos botões de categorias
- [x] Garantir que o texto completo apareça em cada botão

## Otimização da sacola no PDV
- [x] Remover fotos dos itens na lista do pedido para ganhar espaço

## Correção de overflow na página PDV
- [x] Corrigir barra de rolagem externa na página PDV
- [x] Garantir que o botão Finalizar Pedido apareça completo

## Correção de overflow na página Dashboard
- [x] Corrigir barra de rolagem externa na página Dashboard

## Correção do modal de detalhes no PDV
- [ ] Abrir modal de detalhes quando clicar em Adicionar em item com complementos
- [ ] Replicar estilo do modal do menu público no PDV (bordas arredondadas, grupos de complementos)
- [ ] Adicionar seleção de complementos no modal do PDV
- [ ] Botão "Escolha uma opção" quando há complementos obrigatórios

## Ajuste dos cards de itens no PDV
- [x] Adicionar sombra igual aos cards da Dashboard
- [x] Adicionar borda colorida no topo dos cards (estilo "Pedidos Hoje")

## Correção do placeholder de foto no PDV
- [x] Ajustar placeholder de foto nos cards de itens quando produto não tem imagem

## Correção do alinhamento nos cards do PDV
- [x] Fixar posição do preço e botão Adicionar independente do tamanho da descrição

## Alteração do comportamento do botão Adicionar no PDV
- [x] Botão Adicionar: adiciona item direto à lista sem abrir modal
- [x] Clicar no card: abre modal de detalhes do item

## Minimizar menu automaticamente no PDV
- [x] Menu lateral deve minimizar automaticamente ao acessar a página PDV

## Correção de preço duplicado na lista do PDV
- [x] Remover o preço vermelho duplicado na lista de itens do PDV

## Ícone de menu de categorias no PDV
- [x] Adicionar ícone de menu (três linhas) ao lado do botão "Todos"
- [x] Criar modal com lista de todas as categorias para seleção rápida

## Ajustes na barra de categorias do PDV
- [x] Remover emojis das categorias, exibindo apenas o texto
- [x] Mover contagem de itens para badge no canto superior direito do botão

## Botão Adicionar responsivo nos cards do PDV
- [x] Quando espaço for limitado, mostrar apenas ícone + sem texto "Adicionar"
- [x] Mostrar texto "Adicionar" em telas maiores (2-3 cards) e apenas ícone + em 4+ cards por linha

## Melhorias na barra de categorias do PDV
- [x] Remover barra de rolagem horizontal das categorias
- [x] Adicionar ícone de menu no final da lista para ver mais categorias

## Ícone de ver mais categorias fixo
- [x] Fixar ícone na borda direita, fora do overflow
- [x] Adicionar gradiente/fade antes do ícone para indicar mais categorias
- [x] Garantir que o botão esteja sempre visível e clicável

## Drag horizontal na barra de categorias do PDV
- [x] Permitir arrastar com mouse para navegar entre categorias
- [x] Cursor muda para grab/grabbing durante arrasto
- [x] Sem scrollbar visível

## Botão de menu fixo na barra de categorias
- [x] Mover botão de menu (3 linhas) para fora da área de arrasto

## Ajustar botão Ver mais da barra de categorias
- [x] Manter apenas setinha (ChevronsRight) com efeito visual, remover texto e gradiente

## Setinha de categorias condicional
- [x] Mostrar setinha apenas quando houver overflow na lista de categorias

## Filtrar categorias pausadas no PDV
- [x] Exibir apenas categorias ativas (isActive = true) no PDV

## Borda vermelha nos cards do carrinho do PDV
- [x] Adicionar borda vermelha na lateral esquerda dos cards de itens no carrinho

## Melhorar drag de categorias
- [x] Continuar drag mesmo quando mouse sair da área horizontal das categorias

## Dropdown WhatsApp na página de configurações
- [ ] Transformar menu WhatsApp em dropdown expansível
- [ ] Adicionar sub-abas Notificações e Templates dentro do dropdown

## Dropdown WhatsApp nas Configurações
- [x] Converter botões "Notificações" e "Templates" do WhatsApp em um dropdown
- [x] Adicionar ícone de seta (ChevronDown) que rotaciona ao abrir/fechar
- [x] Implementar menu dropdown com opções "Notificações" e "Templates"
- [x] Manter destaque visual quando uma das opções está selecionada
- [x] Fechar dropdown automaticamente ao selecionar uma opção

## Barra Lateral Secundária nas Configurações
- [x] Criar componente de barra lateral secundária para Configurações
- [x] Adicionar menus verticais: Estabelecimento, Atendimento, WhatsApp, Impressora e Teste, Integrações
- [x] Exibir conteúdo à direita da segunda barra lateral
- [x] Remover abas horizontais atuais
- [x] Manter destaque visual no item selecionado
- [x] Garantir responsividade no mobile

## Ajuste do Cabeçalho nas Configurações
- [x] Mover cabeçalho (título e descrição) para dentro da área de conteúdo principal
- [x] Cabeçalho deve ficar ao lado direito do menu secundário, não acima dele

## Fixar Barra Lateral Secundária
- [x] Fixar a segunda barra de menu lateral para não deslizar com a página
- [x] Manter apenas o conteúdo da direita com scroll

## Ajustes na Barra Lateral Secundária
- [x] Remover espaço acima da barra de menu secundária (alinhar com topo)
- [x] Minimizar barra lateral principal automaticamente ao clicar em Configurações

## Corrigir Barra Lateral Secundária Fixa
- [x] Fixar a barra de menu secundária para não rolar junto com a página
- [x] Apenas o conteúdo à direita deve ter scroll

## Borda Vermelha no Menu Secundário
- [x] Adicionar borda vermelha no lado direito do item ativo na barra de menu secundária

## Transição Suave no Menu Configurações
- [x] Adicionar transição suave ao recolher o menu primário ao clicar em Configurações
- [x] Adicionar efeito do menu secundário deslizando de trás do menu primário

## Ajustar Borda do Menu Secundário
- [x] Ajustar a borda vermelha do lado direito do item ativo no menu secundário para ficar igual ao menu primário (arredondada)

## Corrigir Efeito de Recolher no Menu Configurações
- [x] Verificar e corrigir o efeito de recolher do menu ao clicar em Configurações para ficar igual ao PDV

## Menu Sanfona Mobile nas Configurações
- [x] Transformar barra lateral secundária em menu sanfona (accordion) no mobile
- [x] Menu deve expandir/recolher ao clicar no título da seção
- [x] Mostrar ícone de seta indicando estado expandido/recolhido
- [x] Manter comportamento normal em desktop (barra lateral fixa)
- [x] Adicionar transição suave na expansão/recolhimento

## Redesign do Card de Item no PDV
- [ ] Mostrar apenas título e preço na mesma linha no card do item
- [ ] Adicionar dropdown com controles (menos/mais/editar) ao hover ou clique
- [ ] Ícone de editar na mesma linha dos botões menos/mais
- [ ] Ao clicar no ícone de editar, abrir modal de detalhes do item
- [ ] Manter funcionalidade de remover item

## Correção do Modal de Edição no PDV
- [ ] Ao clicar em editar item do carrinho, abrir o mesmo modal de detalhes do produto
- [ ] Preencher o modal com os complementos já selecionados do item
- [ ] Remover o modal separado de edição de item

## Redesign do Card de Item no PDV
- [x] Mostrar apenas título e preço na mesma linha no card do item
- [x] Adicionar dropdown com controles (menos/mais/editar) ao hover ou clique
- [x] Botão de editar deve abrir o modal de detalhes do produto
- [x] Modal de edição deve mostrar os complementos já selecionados
- [x] Reutilizar o modal de detalhes do produto para edição
- [x] Remover modal de edição separado

## Correção: Restaurar Complementos ao Editar Item no PDV
- [x] Corrigir mapeamento de complementos salvos para grupos de complementos do produto
- [x] Garantir que complementos já selecionados apareçam marcados no modal ao editar

## Sidebar de Entrega no PDV
- [ ] Criar sidebar de entrega na lateral direita do PDV (mesma largura do card Pedido Atual)
- [ ] Adicionar campos de endereço: Rua, Número, Bairro, Complemento, Ponto de referência
- [ ] Adicionar seleção de forma de entrega com preço
- [ ] Adicionar formas de pagamento: Dinheiro, Cartão, Pix (com chave do restaurante)
- [ ] Mostrar sidebar apenas quando tipo de pedido for "Entrega"
- [ ] Manter mesmo estilo visual do modal de entrega do menu público
- [ ] Implementar seleção de bairro na sidebar de entrega do PDV quando restaurante estiver configurado para entrega por bairro

- [x] Modificar sidebar de entrega para seleção de bairro ocupar toda a sidebar inicialmente, e após selecionar mostrar campos de endereço e pagamento

- [x] Exibir tipo de pedido (Consumo, Retirada, Entrega) no card de Pedido Atual
- [x] Mostrar taxa de entrega quando aplicável no card de Pedido Atual
- [x] Adicionar ícone de cupom ao lado esquerdo do botão de cupom no card de Pedido Atual

- [x] Modificar botão de cupom para ser apenas um ícone ao lado esquerdo do botão Limpar

## Fluxo de Retirada no PDV
- [ ] Implementar sidebar de pagamento para Retirada (mesmo padrão visual da sidebar de Entrega)
- [ ] Botão "Finalizar Pedido" muda para "Pagamento" quando tipo é Retirada e não há forma de pagamento selecionada
- [ ] Ao clicar em "Pagamento", abrir sidebar com formas de pagamento do restaurante
- [ ] Ao selecionar forma de pagamento, fechar sidebar automaticamente
- [ ] Após selecionar pagamento, botão volta para "Finalizar Pedido"
- [ ] Ao clicar em "Finalizar Pedido", criar pedido com status "Preparando" e redirecionar para página de Pedidos

## Bug - Pedidos de Retirada não aparecem na página de Pedidos
- [x] Investigar por que pedidos de Retirada não aparecem no card de preparo
- [x] Corrigir a lógica de criação/exibição de pedidos de Retirada
- [x] Testar fluxo completo de Retirada
- [x] Pedidos do PDV agora têm status inicial 'preparing' (em preparação)
- [x] Número do pedido segue sequência correta (#P1, #P2, #P3...)
- [x] Notificação SSE enviada para atualizar página de Pedidos em tempo real

## Bug - Botão Adicionar no PDV abrindo modal (CORRIGIDO)
- [x] Corrigir botão Adicionar para adicionar item direto ao carrinho sem abrir modal
- [x] Modal de detalhes só deve abrir ao clicar no card do item

## Correção Modal de Detalhes do Item no PDV
- [ ] Corrigir modal para seguir exatamente o layout do menu público
- [ ] Foto grande no topo com botão X
- [ ] Nome, descrição e preço em vermelho
- [ ] Grupos de complementos com botão + vermelho circular
- [ ] Controle de quantidade (-/+) e botão "Adicionar" no rodapé

## Comparação Modal PDV vs Menu Público
- [ ] Comparar layout, ícones, alturas e larguras dos modais
- [ ] Ajustar modal do PDV para ficar idêntico ao menu público

## Comparação Modal PDV vs Menu Público
- [x] Comparar layout, ícones, alturas e larguras dos modais
- [x] Ajustar modal do PDV para ficar idêntico ao menu público
- [x] Placeholder sem imagem ajustado (h-[180px] sm:h-48 md:h-56)
- [x] Área de conteúdo com overscroll-contain e padding responsivo
- [x] Ordem título/preço/descrição corrigida
- [x] Campo de observações com rounded-xl
- [x] Footer com controles rounded-xl

## Ajuste Controle de Quantidade no Footer do Modal
- [x] Restaurar estilo do controle de quantidade no PDV (botões circulares em fundo cinza arredondado)
- [x] Aplicar mesmo estilo no modal do menu público

## Correção Comportamento de Interação no PDV
- [x] Botão "Adicionar" deve adicionar item diretamente ao carrinho (sem abrir modal)
- [x] Card do item (imagem, título, área) deve abrir o modal de detalhes

## Correção Layout Sidebar Dados da Entrega
- [x] Seleção de bairro em uma única linha (ícone + "Entrega" + taxa + "Alterar")
- [x] Campo Número ao lado do Complemento (20% largura)
- [x] Campo Complemento com 80% da largura

## Impressão Automática no PDV
- [x] Analisar código de impressão existente na página de Pedidos
- [x] Implementar impressão automática após finalizar pedido no PDV
- [x] Usar opção de impressão configurada como favorita

## Melhoria Impressão Normal
- [x] Alterar impressão normal para usar iframe oculto com window.print()
- [x] Evitar abertura de nova aba ao imprimir
- [x] Aplicado tanto no PDV quanto na página de Pedidos

## Bug - Janela de Impressão Abrindo Duas Vezes
- [x] Corrigir conflito entre iframe.print() e auto-print da página de recibo

## Campo de Cupom no PDV
- [x] Ao clicar no ícone de cupom, mostrar campo de texto abaixo dos botões
- [x] Campo de texto para inserir código do cupom
- [x] Botão "Aplicar" ao lado do campo

## Lógica Real de Cupons no PDV
- [x] Criar tabela de cupons no banco de dados (código, tipo desconto, valor, validade, uso máximo) - já existia
- [x] Criar endpoint para validar cupom - já existia (coupon.validate)
- [x] Criar endpoint para listar cupons - já existia (coupon.list)
- [x] Integrar validação de cupom no PDV
- [x] Aplicar desconto real no total do pedido
- [x] Salvar cupom aplicado no pedido (couponCode, couponId, incrementCouponUsage)

## Badge Breve no Menu PDV
- [x] Adicionar badge "Breve" no item PDV da sidebar igual ao Estoque

## Bug - Cupom OFF10 retornando inválido no PDV
- [x] Investigar e corrigir validação de cupom no PDV (formato JSON do tRPC)

## Exibir Desconto no Resumo do PDV
- [x] Adicionar linha de desconto entre Subtotal e Total quando cupom aplicado

## Modal de Categorias no Menu Público
- [x] Mobile: Bottom Sheet subindo da parte inferior (80% da tela)
- [x] Desktop: Modal centralizado padrão
- [x] Campo de busca para filtrar categorias em ambos
- [x] Lista de todas as categorias navegáveis

## Modal de Forma de Pagamento no PDV - Dinheiro
- [x] Ao selecionar Dinheiro, exibir campos: Valor total (somente leitura), Valor recebido (editável)
- [x] Exibir texto "Troco a devolver: R$ XX,XX" destacado e calculado automaticamente
- [x] Substituir botão Cancelar por botão Continuar
- [x] Ao clicar em Continuar, confirmar pagamento e fechar modal

## Campos Nome e Telefone na Sidebar de Entrega
- [x] Adicionar campo Nome acima do Endereço de Entrega
- [x] Adicionar campo Telefone abaixo do Nome

## Máscara de Telefone no PDV
- [x] Adicionar formatação automática (00) 00000-0000 no campo de telefone

## Padronização Visual da Sidebar de Entrega no PDV
- [x] Aplicar fundo branco na sidebar
- [x] Container com fundo cinza claro para campos de input
- [x] Bordas arredondadas e cores iguais ao modal do menu público

## Padronização Visual do Modal de Pagamento no PDV
- [x] Aplicar fundo branco no modal
- [x] Container com fundo cinza claro para opções de pagamento
- [x] Bordas arredondadas e cores consistentes com sidebar de entrega

## Efeito Pulse no Botão Criar Menu
- [x] Adicionar animação pulse/glow no botão "Criar Menu" do rodapé

## Ajuste Estilo Modal Pagamento PDV
- [x] Remover container cinza das opções de pagamento
- [x] Ajustar campos de troco para estilo do menu público

## Atalhos de Valores no Campo de Troco - Menu Público
- [ ] Adicionar botões R$ 20, R$ 50, R$ 100 abaixo do campo de troco

## Atalhos de Valores no Campo de Troco - Menu Público
- [x] Adicionar botões R$ 20, R$ 50, R$ 100 abaixo do campo de troco

## Estilo do Botão de Troco Selecionado
- [x] Fazer botão de valor de troco selecionado ficar vermelho

## Tooltips Mobile - Card de Visualizações do Cardápio
- [x] Corrigir tooltip dos quadradinhos do heatmap para funcionar com touch/tap em mobile
- [x] Corrigir tooltip do ícone de informação (i) para funcionar com touch/tap em mobile

## PDV - Campo de Valor Recebido
- [x] Alterar texto "Precisa de troco para quanto?" para "Qual valor recebido?"
- [x] Implementar formatação automática de moeda (ex: 050 = 0,50, 2 = 0,02)

## HeatmapCard - Dias da Semana Fixos
- [x] Fixar coluna dos dias da semana (Dom, Seg, Ter, etc.) durante scroll horizontal no heatmap

## PDV - Troco em Destaque
- [x] Exibir troco a devolver em destaque quando valor recebido for digitado

## Pedidos - Card de Cancelados Mobile
- [x] Voltar a exibir o card de cancelados na versão mobile

## Pedidos - Card de Cancelados Apenas Mobile
- [x] Ocultar card de Cancelados no desktop e manter apenas no mobile

## Impressão do Recibo - Correções
- [x] Remover janela/aba que abre no navegador ao clicar em imprimir
- [x] Corrigir modelo de impressão para usar o modelo correto da aba do recibo

## WhatsApp - Mensagem Completa do Pedido
- [x] Incluir número do pedido, itens com complementos e valor total na mensagem do WhatsApp

## HeatmapCard - Tooltips Desktop vs Mobile
- [x] Corrigir tooltips para usar hover no desktop e click no mobile

## WhatsApp - Remover Texto Extra
- [x] Remover "Como posso ajudar?" da mensagem do WhatsApp

## Dashboard - Comportamento dos Cards com Sidebar
- [x] Reverter HeatmapCard para versão 005e5bf7

## HeatmapCard - Tooltips Touch/Tap
- [x] Reimplementar suporte a touch/tap nos tooltips sem afetar layout dos cards

## HeatmapCard - Coluna de Dias Fixa
- [x] Adicionar coluna de dias da semana fixa durante scroll horizontal usando CSS sticky

## PDV - Nome do Cliente e Telefone
- [x] Tornar campo de telefone não obrigatório na sidebar de dados de entrega
- [x] Usar nome do cliente digitado no card do pedido em vez de "Cliente PDV"
- [x] Usar nome do cliente digitado na impressão do recibo

## Sidebar Mobile - Ícone de Fechar
- [x] Substituir ícone de X por ícone de minimizar/maximizar na sidebar mobile

## Sidebar - Minimizar ao Clicar em Pedidos
- [x] Minimizar sidebar automaticamente ao clicar no menu Pedidos (igual ao PDV)

## Configurações - Impressão de Teste
- [x] Corrigir botão Teste Normal para não abrir nova aba ao imprimir

## Conta e Segurança - Nova Página
- [x] Criar/atualizar schema do banco para campos de conta e 2FA
- [x] Criar procedures tRPC para dados da conta
- [x] Criar procedure para alteração de senha
- [x] Criar procedure para toggle 2FA por e-mail
- [x] Criar página AccountSecurity.tsx com seções:
  - [x] Card Dados da Conta (estabelecimento + responsável)
  - [x] Card Alterar Senha
  - [x] Card Verificação em duas etapas (2FA)
- [x] Adicionar rota /conta-seguranca no App.tsx
- [x] Adicionar link no menu secundário (AdminLayout)

## Conta e Segurança - Correção de Posição no Menu
- [x] Mover link do menu primário para o menu secundário (abaixo do WhatsApp)

## Impressora e Teste - Configuração de Impressão HTML
- [x] Adicionar campo htmlPrintEnabled no schema do banco
- [x] Criar/atualizar procedure para salvar configuração
- [x] Adicionar toggle no card de layout da aba Impressora e Teste

## Conta e Segurança - Ajustes de E-mail e Nome
- [x] Campo e-mail deve mostrar o e-mail cadastrado na plataforma (do usuário)
- [x] Nome do responsável ao ser alterado deve refletir no nome do perfil do usuário

## Conta e Segurança - Ajustes de E-mail e Nome do Responsável
- [x] Campo e-mail deve mostrar o e-mail cadastrado na plataforma (do usuário)
- [x] Nome do responsável deve refletir no nome do perfil do usuário ao ser alterado

## Conta e Segurança - Atualização do Nome do Perfil em Tempo Real
- [x] Invalidar cache do auth.me após salvar nome do responsável para atualizar perfil sem recarregar página

## PDV - Remover Redirecionamento Após Finalizar Pedido
- [x] Remover redirecionamento automático para /pedidos após finalizar pedido no PDV

## PDV - Remover Título Pedido Atual
- [x] Remover o título "Pedido Atual" da página do PDV

## PDV - Corrigir Notificações Duplicadas
- [x] Corrigir notificações duplicadas ao adicionar item ao carrinho


## Remodelação da Página de Planos (Billing & Subscription)
- [x] Criar estrutura base da página com 3 seções (Seleção de Planos, Plano Atual, Billing History)
- [x] Implementar toggle Monthly/Annual Plan no cabeçalho
- [x] Criar card do Plano Free (R$ 0, funcionalidades limitadas)
- [x] Criar card do Plano Basic (R$ 29/mês, funcionalidades intermediárias)
- [x] Criar card do Plano Pro com destaque visual (Most Popular, gradiente, sombra)
- [x] Implementar seção Plano Atual do Usuário (Your Plan + Next Payment)
- [x] Implementar seção Billing History com tabela e filtros
- [x] Adicionar botão Export no histórico de faturas
- [x] Garantir responsividade completa da página
- [x] Preparar layout para integração futura com Pix/Cartão

## Ajustes no Menu do Perfil
- [x] Alterar "Configurações" para "Ajuda e suporte" no dropdown do perfil


## Página de Ajuda e Suporte
- [x] Criar estrutura base da página com 3 blocos (Canais de Ajuda, Tutorial, FAQ)
- [x] Implementar bloco "Como podemos ajudar?" com 3 cards de contato (WhatsApp, Email, Telefone)
- [x] Implementar bloco Tutorial em Vídeo com player e lista de capítulos
- [x] Implementar bloco FAQ com accordion expansível
- [x] Garantir responsividade completa da página
- [x] Registrar rota /ajuda no App.tsx


## Remodelação da Página de Planos v2
- [x] Redesenhar com 2 cards de planos (Basic e Pro) lado a lado
- [x] Remover card Free, manter apenas Basic ($29/mês) e Pro ($120/ano)
- [x] Adicionar badge "Most Popular" no card Pro com borda azul
- [x] Redesenhar seção Your Plan com botão Cancel Plan
- [x] Adicionar informação de renovação (Renews date)
- [x] Redesenhar Billing History com paginação
- [x] Adicionar checkbox de seleção nas linhas da tabela
- [x] Melhorar visual dos badges de status (Success, Processing)

## Ajuste na Página de Planos
- [x] Adicionar card do plano gratuito à esquerda do card Basic


## Remodelação da Página de Ajuda
- [x] Remodelar página de Ajuda com novo design baseado na referência
- [x] Cards de contato (WhatsApp, Email, Telefone) com ícones coloridos
- [x] Seção Tutorial com player de vídeo e lista de capítulos
- [x] Seção FAQ com accordion expansível

## Tradução da Página de Ajuda
- [x] Traduzir todo o conteúdo da página de Ajuda para português brasileiro

## Atualização do WhatsApp na Página de Ajuda
- [x] Atualizar link do WhatsApp para número 5534998807793 com mensagem pré-definida

## Atualização do Email na Página de Ajuda
- [x] Atualizar email de contato para contato@mindi.com.br

## Atualização do Telefone na Página de Ajuda
- [x] Atualizar número de telefone de suporte para 5534998807793

## Verificação de Cabeçalho - Ajuda vs Dashboard
- [x] Verificar e ajustar cabeçalho da página de Ajuda para usar o mesmo padrão do Dashboard

## Efeito Blur no Card Pro - Página de Planos
- [x] Adicionar efeito blur/gradiente azul no canto superior direito do card Pro

## Tradução e Ajuste da Página de Planos
- [x] Traduzir todos os textos da página de Planos para português brasileiro
- [x] Ajustar cabeçalho para usar o componente PageHeader igual ao Dashboard

## Ajuste de Sombra nos Cards do Catálogo
- [x] Aplicar o mesmo estilo de sombra dos cards de Categorias nos cards de Catálogo

## Ajuste de Sombra nos Cards do Dashboard
- [x] Remover shadow-soft dos cards da página de Dashboard para ficar igual à página de Categorias

## Restaurar Efeito Hover nos Cards
- [x] Restaurar efeito de hover com elevação suave nos StatCards do Dashboard

## Ajuste de Sombra nos Cards Acumulado e Heatmap
- [x] Remover shadow-soft dos cards WeeklyRevenueCard e HeatmapCard

## Ajuste de Tamanho dos Cards de Tipo de Pedido
- [x] Reduzir tamanho dos cards Consumo, Retirada e Entrega em 20%

## Ajuste de Largura da Sidebar de Entrega
- [x] Reduzir largura da sidebar "Dados da Entrega" em 15%

## Ajuste do Card Troco a Devolver
- [x] Reduzir tamanho do card "Troco a devolver" no modal de Forma de Pagamento em 17%

## Implementação de Impressão ESC/POS
- [x] Criar utilitário de geração de comandos ESC/POS
- [x] Integrar ESC/POS com sistema de impressão quando toggle HTML estiver desativado

## Ajuste de Sombra nos Cards de Estoque
- [x] Remover shadow-soft dos cards da página de Estoque para ficar igual à página de Categorias

## Ajuste de Sombra nos Cards de Cupons
- [x] Remover shadow-soft dos cards de status (ativos, inativos, expirados, esgotados) e lista de cupons

## Ajuste de Sombra no Card de Lista de Estoque
- [x] Remover sombra do card de lista de itens de estoque

## Ajuste de Sombra no Card de Lista de Cupons
- [x] Remover sombra do card de lista de cupons

## Ajuste de Sombra nos Cards de Campanhas
- [x] Remover sombra de todos os cards da página de Campanhas

## Atualização de Placeholder SMS
- [x] Atualizar placeholder do campo de mensagem SMS na página de Campanhas
- [x] Atualizar texto padrão do card de preview

## Ajuste de Estilo na Aba Conta e Segurança
- [x] Remover sombra dos cards na aba Conta e Segurança
- [x] Ajustar estilo igual à página de Planos

## Ajuste de Sombra nas Abas de Impressora/Teste e WhatsApp
- [x] Remover sombra dos cards na aba de Impressora e Teste
- [x] Remover sombra dos cards na aba de WhatsApp

## Ajuste de Sombra na Aba Templates do WhatsApp
- [x] Remover sombra dos cards na aba Templates

## Reorganização de Campos na Aba Dados da Conta
- [x] Mover campo CNPJ para ao lado do campo nome do estabelecimento

## Reorganização dos Campos de Senha
- [x] Colocar campos de senha atual, nova e confirmar na mesma linha horizontal

## Reposicionamento do Botão Salvar
- [x] Mover botão Salvar alterações para a mesma linha do título Dados da Conta

## Layout Responsivo do Botão Salvar
- [x] Botão no header em desktop, na posição original em mobile

## Layout Responsivo do Botão Salvar no Card de Segurança
- [x] Botão no header em desktop, na posição original em mobile no card Alterar Senha

## Correção do Campo de Troco no PDV
- [x] Aplicar formatação padrão do sistema no campo de troco
- [x] Garantir que observação do troco apareça no recibo

## Observação de Não Precisa de Troco
- [x] Adicionar observação no recibo quando pagamento em dinheiro não precisar de troco

## Validação de Forma de Pagamento no Modal de Entrega
- [x] Impedir confirmação de dados sem selecionar forma de pagamento

## Pré-seleção de Forma de Pagamento
- [x] Pré-selecionar dinheiro como forma de pagamento padrão no PDV

## Pré-seleção de Dinheiro nos Modais do PDV
- [x] Garantir pré-seleção de dinheiro no modal de entrega
- [x] Garantir pré-seleção de dinheiro no modal de pagamento (retirada)

## Forma de Pagamento Favorita no PDV
- [x] Adicionar ícone de estrela ao lado de cada forma de pagamento
- [x] Implementar lógica de favorito com salvamento no localStorage
- [x] Pré-selecionar forma favorita ao abrir o modal
- [x] Garantir apenas uma forma favorita por vez

## Favoritar Forma de Pagamento no Sidebar de Entrega
- [x] Adicionar ícone de estrela nas formas de pagamento do sidebar de entrega

## Nova Página: Mesas e Comandas
- [ ] Criar estrutura base da página MesasComandas.tsx
- [ ] Implementar cards de resumo no topo (Livres, Ocupadas, Reservadas, Ticket Médio, Tempo Médio, Faturamento)
- [ ] Implementar filtros por status e busca por número da mesa
- [ ] Implementar grid de mesas com cards visuais (barra lateral colorida por status)
- [ ] Implementar sidebar lateral com detalhes da comanda
- [ ] Adicionar rota no App.tsx e menu no DashboardLayout


## Nova Página: Mesas e Comandas
- [x] Criar estrutura base da página MesasComandas.tsx
- [x] Implementar cards de resumo no topo (Livres, Ocupadas, Reservadas, Pedindo Conta, Ticket Médio, Faturamento)
- [x] Implementar filtros por status e busca por número da mesa
- [x] Implementar grid de mesas com cards visuais (barra lateral colorida por status)
- [x] Implementar sidebar lateral com detalhes da comanda
- [x] Adicionar rota no App.tsx e menu no AdminLayout

- [x] Corrigir layout da página Mesas e Comandas para usar AdminLayout em vez de DashboardLayout

- [x] Remover badge "Breve" do menu Mesas e Comandas para habilitar a página

- [x] Ajustar espaçamentos da página Mesas e Comandas para consistência com outras páginas
- [x] Alterar bordas dos cards de mesa para modelo Dashboard (borda superior colorida em vez de lateral)
- [x] Minimizar sidebar automaticamente ao acessar página de Mesas

- [x] Cards de mesa: voltar borda colorida para lado esquerdo
- [x] Remover cards de Livres/Ocupadas/Reservadas/Pedindo Conta (manter apenas Ticket Médio e Faturamento)
- [x] Cards de Ticket Médio e Faturamento: adicionar borda superior colorida
- [x] Filtros de status: adicionar badges de contagem ao lado direito

## Slidebar PDV na página de Mesas e Comandas
- [ ] Criar slidebar lateral (59% largura) que abre da esquerda para direita
- [ ] Reutilizar PDV existente dentro da slidebar com mesmo visual
- [ ] Tipo de pedido "Consumo" pré-selecionado automaticamente
- [ ] Número da mesa preenchido e bloqueado automaticamente
- [ ] Grade de produtos com máximo 3 itens por linha
- [ ] Cards de produto com tamanho reduzido em 20%
- [ ] Modal de detalhes do item igual ao PDV/menu público


## Slidebar PDV na Página de Mesas
- [x] Criar componente PDVSlidebar reutilizando o PDV existente
- [x] Slidebar entra da esquerda para direita com 59% da largura
- [x] Tipo de pedido "Consumo" pré-selecionado automaticamente
- [x] Número da mesa preenchido e bloqueado automaticamente
- [x] Grid de produtos com máximo 3 colunas e cards 20% menores
- [x] Modal de detalhes do produto igual ao PDV/menu público
- [x] Integrar PDVSlidebar na página MesasComandas


## Correções e Melhorias na Página de Mesas
- [x] Corrigir direção da slidebar PDV (da direita para esquerda)
- [x] Criar tabelas de mesas e comandas no schema do banco de dados
- [x] Criar endpoints tRPC para CRUD de mesas e comandas
- [x] Integrar página MesasComandas com dados reais do banco
- [x] Sincronizar comanda com mesa ao criar pedido pela slidebar
- [x] Adicionar botão de impressão de comanda na slidebar


## Aba Fixa (Handle) para Slidebar PDV
- [x] Criar aba vertical fixa na borda da slidebar do PDV
- [x] Aba sempre visível (fechada ou aberta)
- [x] Suporte a clique para abrir/fechar
- [x] Suporte a arrastar (drag) para abrir/fechar
- [x] Visual com cor vermelha, bordas arredondadas e sombra
- [x] Animação suave ao abrir/fechar (ease-in-out)
- [x] Ícone de seta indicando direção


## Melhorias na Slidebar PDV - Mesas e Comandas
- [x] Feedback visual no drag: animação de "puxar" mostrando a slidebar seguindo o dedo
- [x] Persistir mesa selecionada: manter a última mesa selecionada para a aba continuar visível
- [x] Aumentar largura da slidebar em 19% (de 59% para 78%)
- [x] Adicionar ícone de configuração (⚙️) na aba abaixo da seta
- [x] Modal de configuração: ajustar altura vertical da aba (posição Y)
- [x] Modal de configuração: ajustar tamanho da aba (altura/largura)
- [x] Preview em tempo real das alterações no modal
- [x] Persistir configurações no localStorage


## Efeito de Movimento na Aba da Slidebar
- [x] Adicionar animação de movimento/pulsação na aba (handle) da slidebar PDV para dar destaque visual


## Configuração Padrão da Aba da Slidebar
- [x] Alterar valores padrão: posição vertical 15%, altura 76px, largura 32px


## Preview ao Vivo da Configuração da Aba
- [x] Modificar modal para aplicar alterações em tempo real na aba real da tela
- [x] Remover preview estático do modal
- [x] Aba real deve refletir as mudanças enquanto o usuário ajusta os sliders


## Aba Acima do Overlay do Modal
- [x] Aumentar z-index da aba quando o modal de configuração estiver aberto para ficar acima do overlay escuro


## Aba Fixa em Todas as Páginas
- [ ] Adicionar opção no modal de configuração para aba fixa em todas as páginas (exceto PDV)
- [ ] Criar componente global da aba que aparece em todas as páginas quando ativado
- [ ] Persistir configuração no localStorage
- [ ] Ao clicar na aba de qualquer página, abrir a slidebar do PDV de mesas


## Aba Fixa em Todas as Páginas (Exceto PDV)
- [x] Adicionar opção no modal de configuração para aba fixa em todas as páginas
- [x] Criar componente GlobalPDVHandle para mostrar a aba globalmente
- [x] Excluir páginas de PDV e Mesas da exibição global
- [x] Persistir configuração no localStorage


## Ajuste na Aba Global
- [x] Remover indicador "M1" (número da mesa) da aba, deixando apenas as setas


## Atalhos de Teclado para Slidebar PDV
- [x] Implementar tecla F2 para abrir a slidebar
- [x] Implementar tecla ESC para fechar a slidebar
- [x] Atalhos funcionando em todas as páginas (exceto PDV)


## Padronização do Ícone da Aba
- [x] Usar o mesmo ícone de seta na aba quando aberta e fechada
- [x] Padronizar ícone nas demais páginas (GlobalPDVHandle)


## Ajustes na Slidebar PDV
- [x] Corrigir badges cortados nas categorias
- [x] Aumentar tamanho dos botões de categoria em 10%
- [x] Aumentar largura do carrinho em 17%
- [x] Mudar de 3 para 4 itens por linha no grid de produtos


## Animação Suave na Slidebar PDV
- [x] Adicionar transição mais suave na abertura (direita para esquerda)
- [x] Adicionar transição mais suave no fechamento (esquerda para direita)
- [x] Manter responsividade e fluidez


## Ajustes nos Cards de Produtos da Slidebar PDV
- [x] Adicionar texto "Adicionar" no botão junto com o ícone +
- [x] Aumentar tamanho dos cards em 10%


## Otimização da Animação da Slidebar PDV
- [x] Ajustar duração para 250-350ms (atualmente 400ms)
- [x] Usar ease-in-out em vez de cubic-bezier
- [x] Manter responsividade e fluidez


## Padronização do Modal de Detalhes do Item
- [ ] Identificar o modal de detalhes da página de Mesas
- [ ] Padronizar layout e tamanhos para ficar igual ao modal do PDV
- [ ] Usar checkbox quadrado com nome e preço na mesma linha


## Padronização do Modal de Detalhes do Item
- [x] Padronizar modal de Mesas para ficar igual ao modal do PDV
- [x] Usar mesmos tamanhos de fonte e espaçamentos
- [x] Usar mesmo estilo de checkbox/radio


## Cor dos Badges nos Filtros da Página de Mesas
- [x] Alterar cor dos badges (Todas, Livres, Ocupadas, Pedindo conta, Reservadas) para vermelho
- [x] Manter posição atual dos badges


## Largura dos Cards na Página de Mesas
- [x] Aumentar largura dos cards de Ticket Médio e Faturamento em 17%


## Correção da Aba do PDV na Página de Mesas
- [x] Fazer a aba do PDV aparecer automaticamente ao acessar a página de Mesas
- [x] Remover dependência do clique em uma mesa para exibir a aba


## Animação da Slidebar do PDV igual à de Configurações
- [x] Analisar o efeito de animação da slidebar de configurações
- [x] Aplicar o mesmo efeito na slidebar do PDV na página de Mesas


## Correção do Card Seu Plano na Página de Plano
- [x] Ajustar layout do card para duas colunas (Business Plan | Next Payment)
- [x] Adicionar data de renovação no cabeçalho
- [x] Adicionar botão Cancel Plan no canto superior direito
- [x] Adicionar link Upgrade Plan no rodapé


## Atualização do Título da Página de Mesas
- [x] Alterar título de "Mesas e Comandas" para "Mapa de mesas"
- [x] Alterar subtítulo para refletir o novo nome


## Ajustes de Espaçamento no PDVSlidebar
- [x] Aplicar marginRight: -3px no div (linha 606)
- [x] Aplicar ajustes de padding/margin no botão (linha 625)


## Ajuste de marginRight no PDVSlidebar
- [x] Alterar marginRight de -3px para -4px no div do handle


## Sistema de Espaços para Mesas
- [x] Atualizar schema do banco para incluir tabela de espaços (table_spaces)
- [x] Adicionar campo 'Nome do espaço' no modal de criar mesa
- [x] Transformar filtros de status em seletor de espaços
- [x] Manter filtro 'Todas' para ver todas as mesas
- [x] Tornar legenda de status clicável para filtrar mesas
- [x] Criar modal de gerenciamento de espaços (adicionar, editar, excluir)
- [x] Mostrar contagem de mesas por espaço nos botões de filtro


## Ajuste no Modal de Gerenciar Espaços
- [x] Remover campo "Adicionar novo espaço" do modal de Gerenciar Espaços


## Ajuste no Botão de Adicionar Mesa/Espaço
- [x] Mover botão + para o lado esquerdo do botão de gerenciar espaços
- [x] Aplicar mesmo estilo visual do botão de gerenciar espaços no botão +


## Melhorias na Interface de Mesas
- [x] Adicionar tooltips nos botões + e gerenciar espaços
- [x] Implementar funcionalidade de vincular mesas aos espaços


## Ajuste Visual do Botão de Adicionar Mesas
- [x] Alterar cor do botão + para vermelho (igual ao botão Todas selecionado)


## Remoção de Funcionalidade
- [x] Remover funcionalidade de vincular mesas aos espaços (seletor de espaço no Sheet)


## Ajuste Visual na Legenda de Status
- [x] Substituir texto "Status:" por ícone de filtro


## Ajuste Layout PDV Slidebar
- [x] Colocar cards Consumo e Mesa lado a lado com 50% cada


## Bug no Filtro de Busca do Cardápio
- [ ] Corrigir filtro de busca na página de Cardápio para filtrar itens corretamente


## Remover Validação de Tamanho da Imagem de Capa
- [x] Remover validação de tamanho mínimo de 1200px para imagem de capa do menu público


## Importação de Cardápio - Palácio do Açaí
- [x] Acessar cardápio público do Palácio do Açaí
- [x] Extrair categorias, produtos, complementos e grupos
- [x] Importar dados para o estabelecimento ID 90001


## Valor Padrão da Notificação Finalizado
- [x] Alterar valor padrão da notificação "Finalizado" para ativada (true) quando nova conta for criada


## Importação de Taxas por Bairro - Palácio do Açaí
- [x] Importar 25 bairros com taxas de entrega para o estabelecimento ID 90001


## Nova Cor no Card de Nota do Restaurante
- [x] Adicionar opção de cor "Açaí" no card de nota do restaurante nas configurações


## Badge Breve no Menu Mapa de Mesas
- [x] Adicionar badge "Breve" no menu lateral para Mapa de Mesas


## Tooltip nos Itens com Badge Breve
- [x] Adicionar tooltip explicativo nos itens do menu com badge "Breve"


## Melhorar Visibilidade do Tooltip
- [x] Alterar cor da descrição do tooltip para laranja para melhor visibilidade


## Badge Breve no Menu Ajuda e Suporte
- [x] Adicionar badge "Breve" no menu Ajuda e Suporte


## Valor Padrão da Opção Mostrar Divisores
- [x] Alterar valor padrão de "Mostrar divisores" para false quando nova conta for criada


## Badge Breve no Menu Integrações
- [x] Adicionar badge "Breve" no menu Integrações nas configurações


## Remover Texto de Prazo de Entrega no Modal de Confirmação
- [x] Remover o texto "O prazo de entrega está entre 30 a 45 minutos" do modal de confirmação no menu público


## Botão de Cupom e Limpar/Desfazer nas Páginas de Mesas e PDV
- [x] Adicionar botão de cupom na sidebar da página de Mesas (ao lado esquerdo do botão Finalizar Pedido)
- [x] Adicionar botão Limpar na sidebar da página de Mesas com funcionalidade de Desfazer
- [x] Implementar funcionalidade de Limpar/Desfazer na página de PDV


## Alteração de Status de Mesas
- [x] Trocar a cor do status "Ocupada" para vermelho (cor atual de "Pedindo conta")
- [x] Remover o status "Pedindo conta" dos filtros e do sistema


## Bug: Complementos não aparecem no hover do item do carrinho (PDVSlidebar)
- [x] Corrigir exibição dos complementos quando passa o hover no item do carrinho na slidebar do PDV


## Bug: Cor do balão da nota não aplica no preview do perfil público
- [x] Corrigir a aplicação da cor selecionada do balão no preview do perfil público na página de configurações


## Bug: Taxa de entrega fixa não exibe valor correto no menu público
- [x] Corrigir exibição da taxa de entrega fixa - mostra R$ 0,00 em vez do valor configurado (R$ 3,00)
- [x] Corrigir label "Retirar no local" - deve mostrar "Taxa de entrega" quando é delivery


## Correção da cor dos badges "Breve" em Configurações
- [x] Mudar cor do badge "Breve" no menu Ajuda e Suporte de vermelho para amarelo
- [x] Mudar cor do badge "Breve" no menu Integrações de vermelho para amarelo


## Alterar texto do card de seleção de entrega
- [x] Mudar "Entrega" para "Taxa de entrega" no card de seleção do modal de tipo de entrega


## Destaque visual para entrega grátis
- [x] Criar selo verde destacado para entrega grátis no card de taxa de entrega (sidebar)
- [x] Criar selo verde destacado para entrega grátis no modal de tipo de entrega
- [x] Criar selo verde destacado para entrega grátis na área de totais da sacola


## Reverter estilo do botão Grátis
- [x] Reverter botão Grátis para estilo vermelho com pulsação normal (sem ponto amarelo e sem gradiente verde)


## Adicionar ícone de check ao botão Grátis
- [x] Adicionar ícone de check ao botão Grátis mantendo cor vermelha e pulsação


## Aumentar tamanho da sidebar e cards do PDV
- [x] Aumentar largura da sidebar do PDV em 10%
- [x] Aumentar tamanho dos cards da lista de itens em 10%
- [x] Aumentar tamanho dos textos da lista de itens em 10%


## Atalhos de mesas na barra vermelha do PDVSlidebar
- [x] Adicionar atalhos de navegação entre mesas na barra vermelha da sidebar do PDV


## Ajustar layout dos atalhos de mesas na barra vermelha
- [x] Mover atalhos de mesas para a mesma linha que o título e descrição, centralizados


## Estilo de abas para atalhos de mesas
- [x] Alterar estilo dos atalhos de mesas para formato de abas (aba selecionada em verde, outras em cinza)
- [x] Ajustar estilo dos botões de números das mesas para seguir o mesmo padrão dos botões de categorias
- [x] Adicionar ícone de mesa ao lado do número na barra de atalhos de mesas
- [x] Trocar ícone de mesa (Armchair) pelo ícone de garfo e faca (UtensilsCrossed)
- [x] Adicionar botão de troca para inverter posição das barras de mesas e categorias
- [x] Corrigir alinhamento do botão de troca com botão de categorias
- [x] Aplicar mesma borda do botão de categorias no botão de troca
- [x] Botão de troca deve acompanhar as mesas quando barras são invertidas
- [x] Bug crítico: Isolar carrinho por mesa (cada mesa com sua própria comanda)
- [ ] Implementar status automático: mesa com itens = Ocupada, mesa sem itens = Livre
- [ ] Atualizar feedback visual no PDV (vermelho/verde baseado em itens)
- [ ] Atualizar feedback visual na página de Mesas (borda vermelha/verde)
- [x] Remover textos de status (Livre, Ocupada, Reservada) dos cards das mesas
- [x] Ajustar botões de mesas na barra PDV: usar cores de fundo (vermelho/verde claro) em vez de badge redondo
- [x] Bug: Status das mesas não atualiza em tempo real ao adicionar/remover itens da comanda (requer F5)
- [ ] Corrigir agrupamento de itens iguais no carrinho (ex: 5x em vez de 5 cards separados)
- [x] Implementar drag scroll na lista de mesas igual ao da lista de categorias
- [ ] Bug: Botão Desfazer/Limpar não reseta ao trocar de mesa no PDVSlidebar

## Bug Fix: Botão Limpar/Desfazer no PDV Slidebar
- [x] Corrigir bug onde o botão Limpar/Desfazer não resetava ao trocar de mesa

## Alterações na Sidebar do PDV - Labels e Botões
- [x] Trocar label "Consumo" para número da mesa selecionada (ex: "Mesa 3")
- [x] Trocar label "Mesa X" para "Comanda" com ícone de recibo
- [x] Exibir botão "Imprimir" entre "Limpar" e "Fechar conta" ao selecionar Comanda
- [x] Renomear "Finalizar Pedido" para "Fechar conta"

## Separação de visualização entre aba Mesa e aba Comanda
- [x] Aba Mesa: mostrar apenas itens no carrinho (pendentes de envio)
- [x] Aba Comanda: mostrar apenas itens já enviados para preparo (pedidos confirmados)
- [x] Buscar itens da comanda da mesa via API (tabItems)

## Bug: Itens enviados não aparecem na aba Comanda
- [ ] Investigar por que itens enviados para preparo não aparecem na aba Comanda
- [ ] Corrigir a lógica de busca/exibição dos itens da comanda

## Bug: Sidebar fecha após enviar pedido e texto do botão incorreto
- [x] Sidebar não deve fechar após enviar pedido
- [x] Texto do botão deve ser "Enviar pedido" e não "Adicionar à comanda"

## Bug: Pedido não chega na página de pedidos após enviar
- [x] Pedido deve ser enviado tanto para a comanda quanto para a página de pedidos
- [x] Corrigir a lógica de handleFinishOrder para criar o pedido na tabela orders

## Bug: Card da mesa zera itens e valor após enviar pedido
- [x] Card da mesa deve exibir os itens e valor da comanda (tabItems) após enviar o pedido
- [x] Não deve mostrar 0 itens e R$ 0,00 quando há itens na comanda

## Funcionalidade: Excluir mesas no modal Gerenciar Espaços
- [x] Adicionar botão de excluir mesa no modal de Gerenciar Espaços
- [x] Ao excluir mesa, excluir também todos os itens da comanda associados
- [x] Adicionar confirmação antes de excluir

## Bug: Mesa volta a ficar verde após enviar pedido
- [ ] Mesa deve permanecer vermelha (ocupada) enquanto houver itens na comanda
- [ ] Corrigir lógica de status para considerar itens da comanda (tabItems)

## Bug: Mesa volta a ficar verde após enviar pedido
- [x] Mesa deve permanecer vermelha (ocupada) enquanto houver itens na comanda
- [x] Corrigir a lógica de statusCounts para considerar itens da comanda (tabItems)

## Bugs - PDV Slidebar
- [x] Corrigir botões de mesas na barra de atalhos do PDV Slidebar para mostrar status correto (vermelho para mesas com itens na comanda, verde para mesas livres)
- [x] Desabilitar botão Comanda quando mesa estiver livre (sem itens na comanda)
- [x] Corrigir botão Fechar conta na aba Comanda - está desabilitado mesmo com itens na comanda
- [x] Corrigir cálculo do Subtotal/Total na aba Comanda - mostra R$ 0,00 ao invés do valor correto dos itens
- [x] Botão de impressão na aba Comanda deve mostrar opções (impressão normal e múltiplas impressoras Android)
- [x] Reposicionar ícone de impressora ao lado direito do botão de cupom
- [x] Alterar texto do botão de "Fechar conta" para "Fechar Mesa X" na aba Comanda
- [x] Atualizar dropdown de impressão do PDV Slidebar para ter o mesmo formato da página de Pedidos (título "Imprimir" e estrelinhas para favoritar)
- [x] Corrigir botão Comanda que não fica clicável após enviar o pedido
- [x] Corrigir erro 404 na impressão do recibo da comanda no PDV Slidebar
- [x] Atualizar layout do recibo da comanda no PDV Slidebar para usar o mesmo formato profissional da página de Pedidos
- [x] Alterar badge do recibo da comanda de "CONSUMO" para "Mesa X" no PDV Slidebar
- [x] Corrigir botão Fechar Mesa na aba Comanda - mostra "Adicione itens ao pedido" mesmo com itens na comanda

## Modal de Conferência ao Fechar Mesa
- [x] Criar modal de conferência do pedido ao clicar em "Fechar Mesa"
- [x] Usar layout exato do recibo no modal
- [x] Adicionar botão "Confirmar e fechar mesa"
- [x] Adicionar botão "Voltar / Cancelar"
- [x] Implementar impressão automática do recibo ao confirmar (usando impressora favoritada)

## Correção Visual Itens da Comanda
- [x] Remover badge "Pendente" dos itens da comanda no PDV Slidebar
- [x] Restaurar borda vermelha nos itens da comanda como estava antes

## Ícone no Botão Enviar Pedido
- [x] Adicionar ícone da página de pedidos no botão "Enviar pedido" do PDV Slidebar

## Remoção Cabeçalho PDV Slidebar
- [x] Remover cabeçalho vermelho com nome da mesa e descrição "Adicionar itens à comanda"

## Botão Desfazer Temporário
- [x] Implementar botão Desfazer por 10 segundos após clicar em Limpar
- [x] Usar apenas estado local e setTimeout (sem backend)
- [x] Após 10 segundos, voltar automaticamente para Limpar

## Contador Regressivo no Botão Desfazer
- [x] Exibir contador regressivo no texto do botão: Desfazer (10) → Desfazer (1)

## Remoção Linha Consumo no Local
- [x] Remover linha "Consumo no local - Grátis" da slidebar do PDV

## Delay na Abertura do Dropdown de Itens
- [x] Adicionar delay/efeito mais lento na abertura do dropdown dos itens do carrinho

## Correção Impressão Mesa no Pedido
- [x] Corrigir impressão de pedidos da slidebar para mostrar "Mesa X" em vez de "Consumo"
- [x] Corrigir badge preto no topo do recibo para mostrar "MESA X" em vez de "CONSUMO"

## Correção Modal Conferência - Divisores
- [x] Respeitar configuração de "mostrar divisores" no modal de conferência de pedido

## Remoção Card Observações no Recibo de Mesa
- [x] Remover card "OBSERVAÇÕES: Comanda da Mesa X" do recibo de fechamento de mesa

## Correção Botão Desfazer após Enviar Pedido
- [x] Corrigir botão Desfazer que aparece incorretamente após enviar pedido (só deve aparecer ao clicar em Limpar)

## Remoção Campo Número da Mesa no PDV
- [x] Remover campo "Número da mesa" da página de PDV

## Unificação Slidebar PDV em Todas as Páginas
- [x] Verificar diferenças entre a slidebar da página de Mesas e a slidebar das demais páginas
- [x] Unificar para que sejam exatamente iguais (exceto na página /pdv)

## Modal de Conferência no PDV
- [x] Adicionar modal de Conferência do Pedido na página de PDV para Consumo, Entrega e Retirada
- [x] Exibir recibo completo antes de finalizar o pedido
- [x] Botões de Confirmar e Cancelar no modal

## Contador de Tempo nas Mesas Ocupadas
- [ ] Adicionar contador de tempo no canto superior direito do card de mesa
- [ ] Tempo só conta quando mesa está ocupada
- [ ] Formato: 1Min, 1h, 2h40
- [ ] Timer local no frontend baseado no timestamp de ocupação
- [ ] Zerar ao liberar a mesa
- [ ] Manter tempo correto ao recarregar página

## Timer de Ocupação nas Mesas
- [x] Adicionar contador de tempo no canto superior direito dos cards de mesa ocupada
- [x] Formato do timer: 1Min, 1h, 2h40
- [x] Timer só aparece quando mesa tem itens (carrinho ou comanda)
- [x] Timer calcula tempo desde occupiedAt do banco de dados
- [x] Timer atualiza automaticamente a cada minuto no frontend
- [x] Mostrar "—" para mesas sem timestamp de ocupação

## Juntar Mesas (Arrastar e Soltar)
- [ ] Atualizar schema do banco para suportar mesas combinadas (campo mergedWith ou similar)
- [ ] Criar procedure tRPC para juntar mesas (mergeTables)
- [ ] Criar procedure tRPC para separar mesas (splitTables)
- [ ] Implementar drag and drop na lista de mesas (MesasComandas.tsx)
- [ ] Destacar visualmente mesa de destino ao arrastar
- [x] Unificar itens das mesas ao juntar (carrinho local + comanda do banco)
- [ ] Exibir nome combinado no formato menor-maior (ex: 1-3, 2-5)
- [ ] Ocultar mesas originais após junção, exibir apenas mesa combinada
- [ ] Atualizar sidebar do PDV para mostrar mesa combinada
- [ ] Atualizar atalhos rápidos para mostrar mesa combinada
- [ ] Mesa combinada funciona como mesa normal (adicionar/remover itens, fechar, imprimir)
- [ ] Recibo mostra "Mesa: 1-3" para mesas combinadas
- [ ] Persistir junção após refresh da página
- [ ] Testar cenário: mesa vazia + mesa vazia
- [ ] Testar cenário: mesa vazia + mesa com itens
- [ ] Testar cenário: mesa com itens + mesa com itens


## Juntar Mesas (Arrastar e Soltar) - CONCLUÍDO
- [x] Schema do banco de dados atualizado (mergedIntoId, mergedTableIds, displayNumber)
- [x] Procedures tRPC criadas (merge e split)
- [x] Drag and drop implementado na lista de mesas
- [x] Sidebar e atalhos atualizados para mesas combinadas
- [x] Mesas juntadas ocultadas da lista (só aparece a mesa principal)
- [x] Nome no formato menor-maior (ex: 3-4-5)
- [x] Itens unificados em uma única comanda
- [x] Indicador visual "Mesas unidas" no card


## Bug: Título da Mesa Combinada no PDVSlidebar
- [x] Corrigir título "Mesa 3" para mostrar "Mesa 3-4-5" quando for mesa combinada


## Desfazer Junção de Mesas
- [x] Adicionar botão para separar mesas combinadas
- [x] Restaurar mesas originais ao separar


## Bug: Número da Mesa Combinada nos Pedidos
- [x] Corrigir card do pedido para mostrar "Mesa 2-3-5" em vez de apenas "Mesa 2" para mesas combinadas


## Modal de Conferência de Pedido na Sidebar de Mesas
- [x] Replicar visual do modal de conferência de pedido da página /pdv na sidebar de mesas


## Botão Finalizar Pedido no PDV
- [x] Alterar texto do botão de "Finalizar Pedido" para "Avançar" quando tipo de pedido for Entrega


## Fluxo de Pagamento no Consumo (Mesa) no PDV
- [x] Adicionar etapa de seleção de forma de pagamento antes de finalizar pedido no tipo Consumo (mesa)
- [x] Seguir o mesmo fluxo do tipo Retirada: botão Pagamento → selecionar forma → Finalizar Pedido


## Bug: Modal de Configuração da Aba Duplicado
- [x] Corrigir modal de Configuração da Aba que aparece duplicado (aba atrás da aba)
- [x] PDV: mover botões Mesa e Comanda para a linha do campo de busca, liberando espaço para categorias/atalhos
- [x] PDV: atalhos de mesa full-width acima das duas colunas, descer botões Mesa/Comanda no carrinho
- [x] Mesas: cards de mesa só devem mostrar itens após envio do pedido, não quando adicionados no carrinho do PDV
- [ ] Bug: Cannot update MesasComandas while rendering PDVSlidebar - setState durante render via cartsPerTableUpdated event
- [ ] Impressão: remover info de mesa/comanda, pagamento, obs e cliente da impressão de pedidos de mesa (normal e multi-impressora android)
- [x] Bug: Cannot update MesasComandas while rendering PDVSlidebar - setState durante render (queueMicrotask fix)
- [x] Impressão: remover info de mesa/comanda, pagamento, obs e cliente da impressão de pedidos de mesa (HTML, setor, ESC/POS e texto puro)
- [x] Remover badge "Breve" do menu "Mapa de mesas" na sidebar

## Reserva de Mesas
- [x] Adicionar campo isReserved no schema de tables
- [x] Criar procedure tRPC para reservar/liberar mesa
- [x] Adicionar ícone ⋮ no canto superior direito dos cards de mesa
- [x] Menu dropdown com opção "Reservar mesa" / "Liberar reserva"
- [x] Card reservado: borda azul, badge "Reservada"
- [x] Atualizar filtro de status com contagem de reservadas

## Bug: Atalhos de Mesa no PDV não mostram cor azul para mesas reservadas
- [x] Corrigir atalhos de mesa no PDV Slidebar para exibir cor azul quando mesa está reservada

## Campo Quantidade de Pessoas na Reserva
- [x] Adicionar campo reservedGuests no schema de tables
- [x] Atualizar backend (db.ts e routers.ts) para aceitar reservedGuests
- [x] Adicionar campo "Quantidade de pessoas" no modal de reserva no frontend
- [x] Exibir quantidade de pessoas no card de mesa reservada

## Ajustes Visuais na Reserva de Mesa
- [x] Botão "Mesa X" no PDV Slidebar deve ficar azul quando mesa está reservada
- [x] Mover horário da reserva para o topo do card (ao lado do ⋮) com ícone de relógio, igual ao timer de mesa ocupada

## WhatsApp na Reserva de Mesa
- [x] Criar template padrão "Reserva de Mesa – Confirmação" com variáveis {{mesa}}, {{cliente}}, {{horario}}, {{pessoas}}
- [x] Adicionar template na UI de Configurações → WhatsApp → Templates
- [x] Adicionar toggle "Enviar confirmação de reserva por WhatsApp" em Configurações → Notificações
- [x] Implementar lógica de envio automático no backend ao reservar mesa (se telefone preenchido e toggle ativo)
- [x] Mensagem deve conter aviso sobre atraso e liberação da mesa

## Formatação do Telefone na Reserva
- [x] Alterar campo de telefone no modal de reserva para formato 88 9 9929-0000 (sem parênteses no DDD)

## Bug: Ordenação das Mesas
- [x] Corrigir ordenação das mesas para que novas mesas apareçam na posição correta (ordem numérica crescente) em vez de ficarem no meio das existentes

## Bug: Taxa de Entrega "Grátis" na Sacola Desktop
- [x] Quando taxa é por bairro, não mostrar "Grátis!" na sacola até o bairro ser selecionado (mostrar "A calcular" ou ocultar a linha)

## Badge Grátis para Retirar/Consumir no Local
- [x] Alterar "Retirar no local" e "Consumir no local" na sacola para usar o mesmo badge verde com check do Grátis

## Padronizar Visual de Complementos Globais
- [x] Remover container/card de fundo das listas de complementos
- [x] Usar lista limpa, largura total, igual à página de Categorias
- [x] Mesmo espaçamento, tipografia e hierarquia visual
- [x] Manter ações (editar, preço, toggle) alinhadas à direita

## Borda Vermelha Lateral nos Cards
- [x] Adicionar borda vermelha na lateral esquerda dos cards de Categorias
- [x] Adicionar borda vermelha na lateral esquerda dos cards de Complementos

## Cores Diferentes na Borda de Categorias
- [x] Implementar borda dinâmica por status: verde para ativo, vermelha para pausado

## Borda Dinâmica nos Complementos
- [x] Aplicar borda dinâmica por status nos cards de Complementos (verde=ativo, vermelho=pausado)

## Layout Responsivo da Página de Cupons
- [x] Exibir cupons em grade (grid) no desktop
- [x] Exibir cupons em lista no mobile

## Correções Visuais dos Cards de Cupons
- [x] Remover ícone % duplicado no card de cupom (manter apenas "10% Percentual")
- [x] Tornar detalhes do cupom colapsáveis (dropdown ao clicar no card)

## Filtro de Cupons na Página de Cupons
- [x] Exibir apenas cupons criados manualmente na página de Cupons (excluir cupons de fidelidade)

## Ajuste de Largura dos Cards de Cupons
- [x] Diminuir largura dos cards de cupom no desktop em 25%

## Menu Sidebar
- [x] Remover badge "Breve" do item Cupons no menu lateral

## Página de Campanhas
- [x] Trocar placeholder do campo de telefone para número genérico (11) 9 1234-5678

## Filtros Rápidos de Clientes - Campanhas SMS
- [x] Filtro: clientes que não compram há X dias (campo numérico, baseado no último pedido)
- [x] Filtro: clientes com mais de N pedidos concluídos (campo numérico)
- [x] Filtro: clientes que já usaram cupom (checkbox)
- [x] Filtros combináveis entre si com atualização automática da lista
- [x] Exibir quantidade de clientes filtrados

## Reposicionar Botão Filtros
- [x] Mover botão Filtros para a linha do título Destinatários (final do card header)

## Modelos Sugeridos de SMS
- [x] Botão "Modelos Sugeridos" no card de Mensagem SMS
- [x] Modal com 7 templates pré-definidos de SMS
- [x] Botão "Usar template" em cada card que insere o texto no campo de mensagem

## Ajuste Modal Modelos Sugeridos
- [x] Remover contagem de caracteres do modal de modelos sugeridos
- [x] Mover botão "Usar template" para a linha do título (ao final)

## Correção Template SMS
- [x] Substituir quebras de linha por espaços ao inserir template no campo de mensagem SMS

## Restrição de Emojis no SMS
- [x] Remover emojis de todos os templates de SMS
- [x] Bloquear inserção de emojis no campo de mensagem SMS

## Agendamento de Campanhas SMS
- [x] Criar tabela scheduledCampaigns no schema (data/hora, mensagem, destinatários, status, establishmentId)
- [x] Criar db helpers para CRUD de campanhas agendadas
- [x] Criar procedures tRPC para agendar, listar e cancelar campanhas
- [x] Implementar job periódico no servidor para disparar campanhas no horário agendado
- [x] Botão "Agendar campanha" ao lado do "Disparar SMS" na UI
- [x] Modal de agendamento com seletor de data/hora
- [x] Listagem de campanhas agendadas com status (pendente, enviada, cancelada)

## Filtro de Caracteres GSM 7-bit no SMS
- [x] Restringir campo de mensagem SMS para aceitar apenas caracteres GSM 7-bit (letras sem acento, números, espaço e especiais: !@"#$%&'()*+,-./:;<=>?_)

## Atualização Custo SMS
- [x] Alterar custo por SMS de R$ 0,10 para R$ 0,097

## Remoção Badge Breve - Campanhas
- [x] Remover badge "Breve" e estado disabled do item Campanhas no menu lateral

## Renomear Botão Campanhas
- [x] Alterar texto do botão "Disparar SMS" para "Enviar campanha"

## Renomear Botão Agendar
- [x] Alterar texto do botão "Agendar campanha" para "Agendar"

## Atualização Automática do Saldo SMS
- [x] Atualizar saldo automaticamente na UI após envio imediato de campanha (sem precisar recarregar a página)
- [x] Melhorar feedback visual: toast mostra custo debitado no envio imediato e informa que saldo será debitado no envio para agendamentos

## Recarga de Saldo SMS via Stripe
- [x] Adicionar feature Stripe ao projeto (webdev_add_feature)
- [x] Configurar credenciais Stripe (API keys)
- [x] Criar procedures tRPC para criar sessão de checkout Stripe
- [x] Criar webhook para processar pagamento confirmado e creditar saldo
- [x] Criar modal de recarga na página de Campanhas com opções de valor
- [x] Criar página de callback sucesso/cancelamento
- [x] Atualizar saldo em tempo real via SSE após pagamento confirmado
- [x] Escrever testes

## Correção Webhook Stripe
- [x] Corrigir endpoint /api/stripe/webhook que retorna timeout
- [x] Garantir express.raw() ANTES de express.json()
- [x] Retornar HTTP 200 com { verified: true } para todos os cenários

## UI Card Saldo - Recarregar
- [x] Remover botão "Recarregar" separado do card de saldo
- [x] Transformar ícone de carteira em botão clicável com texto "Recarregar"

## Remover Pacote 50 SMS
- [x] Remover pacote de 50 créditos SMS do modal de recarga

## Correção Modal Recarga SMS
- [x] Corrigir caracteres Unicode escapados (créditos, confirmação, Cartão, etc.)
- [x] Corrigir cor do texto de segurança de azul para emerald (verde)

## Recarga Personalizada SMS
- [x] Criar procedure backend para checkout com valor personalizado
- [x] Adicionar opção de valor personalizado no modal de recarga (input de valor em R$)
- [x] Calcular quantidade de SMS automaticamente com base no valor inserido
- [x] Validar valor mínimo (R$ 1,00) e máximo (R$ 1.000,00)

## Formatação Moeda no Campo Personalizado
- [x] Implementar formatação de moeda brasileira no input (digitar 100 = 1,00, digitar 1000 = 10,00)

## Dados do Cliente na Retirada (PDV)
- [x] Adicionar campo "Nome do cliente" (obrigatório) na sidebar de pagamento para retirada
- [x] Adicionar campo "Telefone" (opcional) com máscara (00) 00000-0000
- [x] Validar que nome é obrigatório antes de finalizar pedido de retirada

## Placeholder Grupo Complementos
- [x] Alterar placeholder do nome do grupo para "Nome do grupo, ou pergunta (ex: Adicionais ou Deseja colher?)"

## Bug: Valor de débito SMS incorreto no toast
- [x] Verificar se o valor debitado por SMS é R$ 0,10 ou R$ 0,097
- [x] Corrigir cálculo e/ou exibição do toast para mostrar valor correto (R$ 0,097)

## Stripe Connect - Pagamento Online no Menu Público
- [x] Adicionar campo stripeAccountId no schema de establishments
- [x] Adicionar campo onlinePaymentEnabled no schema de establishments
- [x] Criar endpoint para criar connected account (Stripe Connect V2)
- [x] Criar endpoint para gerar account link (onboarding)
- [x] Criar endpoint para verificar status da connected account
- [x] Criar endpoint para checkout session com destination charge (1,5% taxa)
- [x] Expandir webhook para processar pagamentos de pedidos online
- [x] Adicionar UI de ativação de pagamento online nas Configurações do restaurante
- [x] Adicionar opção de pagamento com cartão no menu público (apenas Entrega)
- [x] Criar pedido automaticamente após pagamento confirmado via webhook
- [x] Testes unitários para Stripe Connect

## Taxa da plataforma Stripe Connect
- [x] Alterar taxa da plataforma de 1,5% para 4,6%
- [x] Alterar taxa da plataforma de 4,6% para 4,3%
- [x] Alterar taxa da plataforma de 4,3% para 3,99% + R$ 1,00 fixo por transação
- [x] Alterar taxa fixa da plataforma de R$ 1,00 para R$ 0,89 por transação
- [x] Exibir banner de taxas destacado no topo da seção Pagamento Online
- [x] Adicionar reforço de taxa próximo ao toggle de ativar/desativar
- [x] Incluir mini exemplo de cálculo (R$ 100 → R$ 4,88)
- [x] Atualizar card 'Como funciona' com taxa correta
- [x] Renomear botão "Abrir Dashboard Stripe" para "Gestão de Pagamentos"
- [x] Remover texto extra e exemplos do card de taxas
- [x] Remover card "Como funciona"
- [x] Renomear título do card de taxas para "Pagamento online | Cartão"
- [x] Remover bullet "Não se aplica a pagamentos em dinheiro, Pix ou cartão presencial"
- [x] Remover banner amarelo de taxas de pagamento online
- [x] Ajustar layout de "Cobranças ativas" e "Repasses ativos" para ficarem lado a lado próximos
- [x] Dropdown no botão Cartão do menu público com "Trazer maquininha" e "Pagar online" quando Pagamento Online ativado
- [x] Manter comportamento atual do botão Cartão quando Pagamento Online desativado
- [x] Card "Pagar online" com ícone de segurança Stripe como já existe
- [x] Remover container "Pagamento online seguro" ao selecionar Pagar online
- [x] Alterar exibição de card_online nos recibos para "Pagamento confirmado – Cartão online" (impressão normal e múltiplas impressoras Android)
- [x] Alterar exibição de card_online nos recibos para "Pagamento confirmado – Cartão online" (impressão normal e múltiplas impressoras Android)
- [x] Reestruturar fluxo: não enviar pedido até pagamento online ser confirmado
- [x] Modal "Aguardando pagamento" com polling de status
- [x] Opção de tentar pagar novamente ou mudar forma de pagamento no estado aguardando
- [x] Pedido só é criado após confirmação do webhook de pagamento
- [x] Bug: Pedido não é criado após pagamento online confirmado (sem notificação WhatsApp e sem aparecer na página de pedidos)
- [x] Criar tabela pending_online_orders para salvar dados do pedido antes do checkout
- [x] Salvar dados do pedido no banco ao criar checkout session (em vez de metadata)
- [x] Webhook busca dados do pedido no banco por session_id (em vez de metadata)
- [x] Frontend polling retorna número do pedido após confirmação
- [x] Bug: Botão "Escolher outra forma de pagamento" volta para Confirmar Endereço em vez de Tipo de Entrega (fluxo 2)

## Reestruturação do Fluxo de Checkout (5 → 4 steps)
- [x] Remover step 1 (Resumo do Pedido) do fluxo de checkout
- [x] Mover conteúdo do resumo (itens, observação) para o step de Confirmar Endereço (agora step 2 - Resumo do Pedido)
- [x] Atualizar indicador de progresso de 5 para 4 steps
- [x] Atualizar labels dos steps: 1-Entrega, 2-Resumo, 3-Dados, 4-Enviar
- [x] Atualizar títulos dos modais para novo fluxo
- [x] Remapear todas as referências de setCheckoutStep para novos números
- [x] Ajustar botão Voltar no header do modal
- [x] Testar fluxo completo de checkout com 4 steps
- [x] Bug: Botão "Alterar" forma de entrega fecha o modal quando taxa é grátis (free) - impede trocar para retirada/consumo no local
- [x] Bug: Quando taxa é byNeighborhood e nenhum bairro selecionado, "Selecionar bairro" deve aparecer dentro do campo Bairro (não como botão separado)
- [x] Bug: Campo telefone no step Seus Dados permite avançar com apenas 2 dígitos - deve formatar como (XX) X XXXX-XXXX e só avançar quando completo
- [x] Bug: Após enviar pedido, novo pedido mostra tela de confirmação do pedido anterior (orderSent não é resetado ao iniciar novo checkout)
- [x] Remover delay de 3 segundos no envio do pedido no step Confirmação
- [x] Mostrar card "Aceitar pagamento online" sempre visível abaixo do Stripe Connect, com toggle desativado/não clicável quando Stripe não configurado
- [x] Mostrar número do pedido no título do modal de Acompanhar Pedido (ex: Acompanhar Pedido #P32)
- [x] Remover cards de Consumo e Cliente do modelo do recibo ao fechar mesa
- [x] Adicionar controles de edição nos itens da comanda: aumentar/diminuir quantidade, editar, excluir com confirmação (estilo dropdown expandível)
- [ ] Substituir ícone do card Suporte via WhatsApp na página /ajuda pelo ícone WhatsApp fornecido (manter círculo verde) — CANCELADO pelo usuário, revertido ao ícone original
- [x] Reduzir tamanho dos botões de controle (+/-/lixeira) nos itens da comanda de 32px para 25px
- [x] Ocultar cards de Ticket Médio e Faturamento na versão mobile da página de Mesas (exibir apenas no desktop)
- [x] [Mobile Mesas] Criar componente MobilePDVModal (bottom sheet 90vh) com cabeçalho Mesa X, resumo (itens, tempo, valor total)
- [x] [Mobile Mesas] Implementar busca de produtos com pré-visualização no modal mobile
- [x] [Mobile Mesas] Implementar modal bottom sheet de detalhes do item com complementos (mesmo estilo menu público)
- [x] [Mobile Mesas] Implementar lista de itens da mesa com controles de quantidade e remoção
- [x] [Mobile Mesas] Integrar: no mobile abrir MobilePDVModal ao clicar no card da mesa, no desktop manter PDVSlidebar
- [x] [Mobile Mesas] Remover no mobile: lista de categorias horizontal, atalho rápido de mesas, layout grade desktop
- [x] [Mobile Mesas] Implementar ações: enviar pedido, limpar, fechar mesa no modal mobile
- [x] [Mobile Mesas] Corrigir altura do MobilePDVModal para max-height 90vh (estava ocupando 100% da tela)
- [x] [Mobile Mesas] Ajustar estilo do MobilePDVModal para ficar igual aos bottom sheets do menu público (cantos, sombra, header com ícone)
- [x] [Mobile Mesas] Copiar exatamente o modal de detalhes do item do menu público para o MobilePDVModal (mesmo footer com botões quantidade e Adicionar)
- [x] [Mobile Mesas] Remover fotos dos itens na lista de resultados da busca (exibir foto apenas no modal de detalhes)
- [x] [Mobile Mesas] Botão + na busca: adicionar item direto ao carrinho sem modal de detalhes. Só abrir modal se item tiver complementos.
- [x] [Mobile Mesas] Mover botões de criar mesa (+) e gerenciar espaços (engrenagem) para ao lado do campo de busca no mobile
- [x] [Mobile Mesas] Melhorar busca no MobilePDVModal: usar dropdown/overlay flutuante igual menu público, ocultar footer quando buscando, maximizar espaço para resultados com teclado aberto
- [x] [Mobile Mesas] Alterar MobilePDVModal para tela cheia (100vh) ao invés de bottom sheet 90vh, manter botão de fechar
- [x] [Mobile Mesas] Simplificar header do MobilePDVModal: remover resumo (itens, tempo, valor) e exibir apenas "Mesa X | R$ XX,XX" no título
- [x] [Mobile Mesas] Remover fotos dos itens na lista do carrinho/comanda e usar estilo desktop: card com borda vermelha, badge quantidade (ex: 1x), nome e preço
- [x] [Mobile Mesas] Na aba Consumo, itens do carrinho devem aparecer no mesmo estilo da aba Comanda (card com borda vermelha, badge quantidade, nome e preço) em vez de misturar com resultados de busca
- [x] [Mobile Mesas] Busca no MobilePDVModal deve ignorar acentos (ex: digitar "agua" deve encontrar "Água")
- [x] [Mobile Mesas] Botões de espaços devem ficar em linha horizontal com scroll lateral (arrastar) no mobile, sem quebra de linha
- [x] [Menu Público] Cabeçalho do modal Meus Pedidos deve ficar igual ao da Conferência do Pedido (fundo vermelho gradiente, ícone, texto branco, botão X)
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Sua Sacola
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Selecione seu Bairro
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Categorias
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Entrega e Pagamento
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Resumo do Pedido
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Seus Dados
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Confirmação
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Aplicar Cupom
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Acompanhar Pedido
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Informações
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Como Chegar
- [x] [Menu Público] Aplicar cabeçalho vermelho gradiente no modal Avaliações
- [x] [Menu Público] Itens do carrinho no modal Sua Sacola devem ter borda vermelha na lateral esquerda igual aos itens do menu público
- [x] [Menu Público] Aplicar borda vermelha na lateral esquerda dos itens no Resumo do Pedido (step 2 do checkout)
- [x] [Menu Público] Botão de pagar online no modal de confirmação deve ser na cor vermelha
- [x] [SMS] Remover pacote de 1000 SMS do modal de recarregar saldo SMS
- [x] [Menu Público] Sugestões de troco dinâmicas baseadas no valor do pedido (arredondar para cima ao múltiplo de 10)
- [x] [Trial] Adicionar campo trialStartDate no schema do banco de dados
- [x] [Trial] Migrar banco de dados com pnpm db:push
- [x] [Trial] Implementar lógica de cálculo de dias restantes no backend
- [x] [Trial] Expor dados de trial via tRPC (dias restantes, se está em trial)
- [x] [Trial] Badge no dashboard ao lado de "Ver menu" mostrando dias restantes do trial
- [x] [Trial] Popover ao clicar no badge com texto e botão "Fazer upgrade agora"
- [x] [Trial] Badge visível apenas para usuários em trial
- [x] [Trial Expirado] Modal obrigatório de upgrade quando trial expira (sem fechar com ESC ou clique fora)
- [x] [Trial Expirado] Guard de rotas: bloquear todas as páginas exceto /planos quando trial expirado
- [x] [Trial Expirado] Fechar menu público automaticamente quando trial expira
- [x] [Trial Expirado] Reabrir menu público automaticamente após pagamento
- [x] [Trial Expirado] Liberar todas as ações e remover bloqueio após pagamento
- [x] [Trial Expirado] Testes vitest para bloqueio de trial expirado
- [x] [Trial Expirado] Redesign do modal com estilo degradê vermelho da marca (glassmorphism)
- [x] [Admin] Schema: tabela admin_users com role, email, password hash
- [x] [Admin] Seed: criar admin inicial (admin@admin.com)
- [x] [Admin] Backend: autenticação admin (login/logout/me) com JWT separado
- [x] [Admin] Backend: router admin dashboard (stats: novos cadastros, trials, pagos, expirados)
- [x] [Admin] Backend: router admin restaurantes (listar, detalhes, alterar plano, bloquear, reabrir menu, resetar trial)
- [x] [Admin] Backend: router admin planos (CRUD de planos)
- [x] [Admin] Backend: router admin trials (listar ativos, vencendo, expirados, ações)
- [x] [Admin] Frontend: página login admin (/admin/login)
- [x] [Admin] Frontend: layout admin com sidebar (mesmo estilo dashboard restaurante)
- [x] [Admin] Frontend: dashboard admin com 4 cards clicáveis
- [x] [Admin] Frontend: página Restaurantes (listagem + detalhes + ações)
- [x] [Admin] Frontend: página Planos (CRUD)
- [x] [Admin] Frontend: página Trials (visão rápida + ações)
- [x] [Admin] Rotas no App.tsx e guard de autenticação admin
- [x] [Admin] Testes vitest para routers admin
- [x] [Bug] Admin login não redireciona para dashboard - fica na página de login após logar
- [x] [Admin] Backend: endpoint de relatórios (total restaurantes, receita mensal, taxa conversão, ativos, distribuição status, receita anual, ticket médio, churn rate)
- [x] [Admin] Frontend: página Relatórios com 4 KPI cards no topo
- [x] [Admin] Frontend: gráfico donut Distribuição por Status (Ativos vs Em Teste)
- [x] [Admin] Frontend: cards Receita Anual Projetada, Ticket Médio, Churn Rate
- [x] [Admin] Rota /admin/relatorios e link na sidebar
- [x] [Bug] Página Relatórios admin sem sidebar (AdminPanelLayout)
- [x] [Dashboard] Backend: atualizar endpoints de métricas para aceitar parâmetro de período (today, week, month)
- [x] [Dashboard] Frontend: adicionar filtro de período (Hoje, Esta semana, Este mês) no topo da Dashboard
- [x] [Dashboard] Conectar filtro aos endpoints para atualizar todos os cards e métricas
- [x] [Dashboard] Backend: calcular dados do período anterior para comparação
- [x] [Dashboard] Backend: retornar variação percentual (ordersChange, revenueChange, avgTicketChange)
- [x] [Dashboard] Frontend: exibir indicador de variação % em cada card com seta e cor (verde/vermelho)
- [x] [Dashboard] StatCard: indicador % ao lado do valor (não abaixo), apenas seta + %, tooltip com info completa
- [x] [Dashboard] Indicador neutro com traço (—) quando variação é 0%
- [x] [Dashboard] Animação fade-in nos valores dos cards ao trocar filtro de período
- [x] [Bug] Cards Acumulado da semana e Visualizações do Cardápio não respondem ao filtro de período
- [x] [Dashboard] Card Acumulado: Hoje/Semana mostra dias (Seg-Dom), Mês mostra últimos 6 meses
- [x] [Dashboard] Visualizações do Cardápio responde a todos os filtros de período
- [x] [Bug] Card Visualizações do Cardápio mostra 0 quando filtro Hoje está selecionado
- [x] [Schema] Adicionar campo timezone (IANA) à tabela establishments com default America/Sao_Paulo
- [x] [Backend] Criar helper centralizado de timezone que lê do estabelecimento
- [x] [Backend] Refatorar todos os locais com timezone hardcoded (America/Sao_Paulo, -03:00) para usar timezone do restaurante
- [x] [UI] Adicionar campo "Fuso horário do restaurante" no card Horários de funcionamento em Configurações
- [x] [Backend] Procedure para atualizar timezone do estabelecimento
- [x] [Testes] Escrever testes para o helper de timezone e procedures

## Detecção Automática de Fuso Horário
- [x] [Frontend] Detectar timezone do navegador via Intl.DateTimeFormat ao criar conta
- [x] [Backend] Aceitar timezone como parâmetro na criação do estabelecimento
- [x] [Backend] Mapear timezone IANA do navegador para o timezone mais próximo suportado
- [x] [Testes] Escrever testes para o mapeamento de timezone
- [x] [Mesas] Remover cards de Ticket Médio e Faturamento da página de Mesas
- [x] [Dashboard] Adicionar card "Taxa de conversão" (pedidos/visualizações × 100) com filtro de período
- [x] [Dashboard] Card deve exibir % principal, subtexto "X pedidos / Y visualizações", e variação vs período anterior
- [x] [Dashboard] Posicionar card ao lado do card Itens em Falta e reduzir largura deste em 25%
- [x] [Backend] Criar endpoint para calcular taxa de conversão por período
- [x] [Testes] Escrever testes para o endpoint de taxa de conversão
- [x] [Dashboard] Mover subtexto do card Taxa de Conversão para tooltip no hover
- [x] [Dashboard] Diminuir largura do card Itens em Falta em 25%
- [x] [Dashboard] Adicionar ícone (i) ao lado do título Taxa de Conversão com tooltip no hover
- [x] [Bug] Tooltip do card Taxa de Conversão cortado pelo overflow-hidden do card
- [x] [Admin] Alterar senha do /admin/login para 290819943
- [x] [Login] Alterar placeholder do campo de senha de pontinhos para "Sua senha"
- [x] [Bug] Lembrar-me no login não salva email/senha no localStorage
- [x] [Criar Conta] Alterar placeholders dos campos de senha de pontinhos para texto
- [x] [Dashboard] Adicionar ícone da sidebar ao lado do título da página Dashboard

- [x] Cor do ícone Dashboard deve ser azul (não vermelho)
- [x] Adicionar ícone azul no título da página Pedidos
- [x] Adicionar ícone azul no título da página Mapa de Mesas
- [x] Adicionar ícone azul no título da página Cardápio
- [x] Adicionar ícone azul no título da página Categorias
- [x] Adicionar ícone azul no título da página Complementos
- [x] Adicionar ícone azul no título da página Cupons
- [x] Adicionar ícone azul no título da página Campanhas
- [x] [Bug] Fechamento de mesa não reflete no card Faturamento Hoje e Ticket Médio da Dashboard
- [x] Modal informativo WhatsApp na página de Pedidos (conectar WhatsApp para notificações automáticas)
- [x] Substituir 3 cards do modal WhatsApp por card visual de conversa WhatsApp
- [x] Botão Conectar WhatsApp do modal deve abrir modal QR Code em vez de redirecionar
- [x] Carrossel animado no balão do modal WhatsApp alternando entre modelos de notificação (recebido, preparo, entrega)
- [x] Notificação "Finalizado" (entregue/retirado) deve vir ativada por padrão ao criar conta
- [x] Notificação "Confirmação de Reserva" deve vir ativada por padrão ao criar conta
- [x] Alterar template padrão do pedido finalizado para novo texto com emojis
- [x] Mostrar divisores deve vir desativado por padrão ao criar conta (configurações de layout impressora)
- [x] Adicionar informação de Apple Pay na seção de Pagamento Online das Configurações
- [x] [Bug] Abertura manual da loja no admin não reflete no menu público (continua mostrando Fechado)
- [x] [Bug] Toggle de abrir/fechar loja sem cor visual (deve ser verde quando aberto, vermelho quando fechado)
- [x] [Bug] Validação do campo WhatsApp no Step 1 do onboarding permite continuar com número incompleto

## Badge Customizável nos Complementos
- [x] Adicionar campo badgeText no schema de complements
- [x] Atualizar backend (db.ts e routers.ts) para suportar badgeText
- [x] Adicionar campo de texto no catálogo admin para definir badge do complemento
- [x] Exibir badge vermelho pulsante no menu público ao lado do nome do complemento
- [x] Testes unitários para badge de complementos

## Edição de Nome de Complemento
- [x] Criar função no backend para renomear complemento em todos os grupos/produtos
- [x] Adicionar campo editável de nome na página /complementos
- [x] Propagar renomeação para todos os produtos que usam o complemento
- [x] Testes unitários para renomeação de complemento

## Bugs Layout Menu Público
- [x] [Bug] Botão Adicionar e controles +/- ficam muito para baixo quando item tem muitos complementos no modal de detalhes
- [x] [Bug] Backend rejeita pedido dizendo "fechado" mesmo quando menu público e admin mostram "aberto" (estabelecimento 871095)

## Endereço do Estabelecimento
- [x] Remover obrigatoriedade dos campos Nº, Bairro, Cidade, UF e CEP (apenas Rua obrigatório)
- [x] [Bug] Ao salvar endereço com campos vazios, os valores antigos voltam a preencher os campos
- [x] [Bug] Alterações de preço dos complementos na página /complementos não são salvas no banco de dados
- [x] [Bug] Corrigir preços errados dos complementos no banco (200.00 → 2.00, 300.00 → 3.00, 400.00 → 4.00) no estabelecimento 150004

## Dark Mode
- [x] Configurar variáveis CSS do tema escuro no index.css (tokens de cor)
- [x] Implementar toggle de tema (light/dark) alternável
- [x] Ajustar cores hardcoded nos componentes da Dashboard (cards, gráficos, badges)
- [x] Ajustar sidebar e topbar para dark mode
- [x] Ajustar gráficos (gridlines, cores) para boa leitura em fundo escuro
- [x] Garantir contraste adequado e estados (hover, ativo, desabilitado, loading/skeleton)
- [x] Testar em todas as páginas principais

## Toggle de Tema no Menu de Perfil
- [x] Remover botão de toggle de tema da topbar
- [x] Adicionar seção "Tema" no menu dropdown do perfil (abaixo de Planos)
- [x] Exibir "Modo Escuro" ou "Modo Claro" com ícone e indicador "Ativado"

## Bugs - Templates de Mensagem
- [x] [Bug] Mensagem de novo pedido (com saudação e itens) não é enviada ao cliente - apenas a mensagem de 'preparing' é recebida (logs detalhados adicionados para monitorar)

## Variáveis de Template WhatsApp - Pronto
- [x] Separar {{deliveryMessage}} para ser exclusivamente delivery (entregador a caminho)
- [x] Criar nova variável {{pickupMessage}} para retirada e consumo no local
- [x] Adicionar novo campo de template na seção "Pronto" para mensagem de retirada/consumo no local
- [x] Atualizar lógica de substituição no uazapi.ts

## PDV - Salvar e Reaproveitar Dados de Clientes
- [x] Criar tabela pdvCustomers no banco (telefone como chave, vinculado ao estabelecimento)
- [x] Criar endpoint tRPC para buscar cliente por telefone
- [x] Criar endpoint tRPC para salvar/atualizar cliente
- [x] Integrar busca automática no campo telefone do PDV (entrega e retirada)
- [x] Preencher automaticamente nome e endereço quando cliente encontrado
- [x] Salvar/atualizar dados do cliente ao finalizar pedido no PDV
- [x] Campos permanecem editáveis após preenchimento automático
- [x] [Bug] Máscara de telefone na retirada do PDV formata incorretamente (88) 9 99290-000 em vez de (88) 9 9929-0000 (corrigido também no campo de entrega)
- [x] [Bug] Filtro de busca na página /catalogo (Cardápio) não filtra pelo nome dos produtos/itens
- [x] Ocultar templates de notificações WhatsApp desativadas na aba de Templates (ex: se "Preparando" está desativado, não exibir o template de "Preparando")
- [x] Card "Completos" na página /pedidos deve mostrar apenas pedidos do dia atual (limpeza automática à 00:00 respeitando timezone do restaurante)
- [x] Busca global na topbar: filtrar conteúdo relevante em cada página (mesas, catálogo, categorias, complementos, pedidos, cupons, campanhas)
- [x] Remover auto-minimização da sidebar ao clicar em PDV, Mapa de Mesas e Pedidos
- [x] [Bug] Corrigir tema escuro na sacola/painel direito da página PDV (fundo branco no modo dark)

## Isolamento de Tema - Menu Público vs Admin
- [x] Isolar tema do menu público do tema do admin (modo escuro do admin não deve afetar menu público)
- [x] Menu público deve manter tema claro padrão sempre, independente do modo escuro do admin
- [x] Não compartilhar variáveis/tokens de tema entre admin e menu público

## Bug - Tema Escuro na Página de Mesas
- [x] Corrigir tema escuro no painel central de produtos da página de Mesas (fundo branco no modo dark)
- [x] Corrigir tema escuro na sacola/painel direito da página de Mesas
- [x] Corrigir tema escuro nos cards de produtos, barra de categorias e campo de busca

## Bug - Tema Escuro no PDV Embutido nas Mesas
- [x] Corrigir tema escuro na sidebar do PDV embutido na página de Mesas (painel de produtos, categorias, busca e sacola)

## Transição Suave ao Alternar Tema
- [x] Aplicar transition-colors no <html> para mudança de tema mais fluida

## Auditoria Tema Escuro - Páginas Restantes
- [x] Corrigir cores hardcoded na página de Pedidos
- [x] Corrigir cores hardcoded na página de Categorias
- [x] Corrigir cores hardcoded na página de Cupons
- [x] Corrigir cores hardcoded na página de Campanhas
- [x] Corrigir cores hardcoded na página de Configurações
- [x] Auditoria global em massa: 462+ substituições em 30+ ficheiros (páginas, componentes, admin)

## Bug - Estilo Seleção Configurações no Modo Escuro
- [x] Corrigir estilo de seleção na barra secundária de Configurações para ficar igual ao estilo da sidebar principal no modo escuro

## Bug - Tema Escuro nos Templates WhatsApp
- [x] Corrigir tema escuro na secção de WhatsApp Templates (Editor de Mensagens) - cards, variáveis, textarea e botões de status

## Bug - Tema Escuro no Card de Entrega do PDV
- [x] Corrigir tema escuro no card de endereço de entrega (fundo claro/bege no modo dark)
- [x] Adicionar dark variants a todos os bg-red-50, bg-blue-50, bg-amber-50, hover:bg-red-50 no PDV

## Bug - Tema Escuro nos Cards de Estado Vazio dos Pedidos
- [x] Corrigir tema escuro nos cards de estado vazio (Novos, Preparo, Prontos) na página de Pedidos - fundos claros no modo dark
- [x] Adicionar dark variants a todos os bg-*-50, bg-*-100, border-*-200 e text-*-700/800 nos Pedidos

## Bug - Tema Escuro nos Cupons (ícones e badges)
- [x] Corrigir tema escuro nos ícones de status, badges e elementos restantes na página de Cupons

## Bug - Tema Escuro nos Cards de Pagamento Online (Configurações)
- [x] Corrigir tema escuro nos cards de Stripe Connect e Aceitar Pagamento Online na secção Pagamento Online das Configurações
## Bug - Tema Escuro na Página de Campanhas
- [x] Corrigir tema escuro no modal de Recarregar Saldo SMS e outros elementos com cores claras na página de Campanhas

## Ajustes de UI
- [x] Remover badge "Breve" do menu Ajuda e Suporte na sidebar
- [x] Ajustar botões Mensal/Anual na página de Planos para seguir o mesmo estilo dos filtros da Dashboard (Hoje/Esta semana/Este mês)
- [x] Igualar a cor de fundo da sidebar principal do menu à cor da sidebar de Configurações
- [x] Corrigir tooltips dos cards Visualizações do Cardápio e Acumulado da semana no dark mode da Dashboard
- [x] Renomear plano Básico para Essencial (R$ 79,90) e colocar preço do Pro como R$ --,-- em todos os locais
- [x] Limpar dados mockados do Histórico de Pagamentos na página de Planos
- [x] Atualizar textos das features dos planos Gratuito e Essencial na página de Planos
- [x] Remover badge do menu Planos no dropdown do perfil
- [x] Adicionar ícone no cabeçalho da página Ajuda e Suporte (igual às demais páginas)
- [x] Adicionar ícone no cabeçalho da página Planos (igual às demais páginas)
- [x] Adicionar features "Campanhas SMS" e "Cupons de desconto" ao plano Essencial
- [x] Adicionar feature "Programa de fidelidade" ao plano Pro
- [x] Corrigir menu público herdando dark mode do admin quando aberto na mesma aba do navegador
- [x] Corrigir card de Confirmação via Botões na secção WhatsApp das Configurações no dark mode
- [x] Corrigir toggle do Programa de Fidelidade quase invisível no dark mode
- [x] Corrigir badge de Avaliação gratuita: 15 dias com cores claras no dark mode
- [x] Toggle de som deve ficar vermelho quando desativado no dark mode
- [x] Forçar tema light nas telas públicas (Login, Cadastro, Onboarding) - nunca herdar dark mode do admin
- [x] Corrigir checkout de planos para usar mode: subscription com renovação automática mensal/anual

## Bug: Herança indevida de tema no /admin
- [x] Forçar tema LIGHT fixo em todas as rotas /admin (AdminPanelLayout + AdminLogin)
- [x] Garantir que /admin nunca herda dark mode do restaurante, menu público ou localStorage

## Limpeza automática de pedidos finalizados
- [x] Verificar se a limpeza automática às 00:00 (timezone do restaurante) está ativa no código
- [x] Confirmar que a lógica é exclusivamente visual (front-end), sem remover dados do banco
- [x] Não foi necessário reimplementar - funcionalidade está ativa

## Limpeza diária de pedidos cancelados
- [x] Aplicar mesma lógica de limpeza diária (00:00 timezone do restaurante) à coluna de Cancelados

## WhatsApp com submenus nas Configurações
- [x] Transformar WhatsApp em menu pai com submenus: Notificações e Templates
- [x] Submenu Notificações: conteúdo atual de notificações automáticas
- [x] Submenu Templates: nova aba para templates de mensagens

## Limpeza manual de pedidos via ícone do card
- [x] Ao clicar no ícone do card Completos, limpar visualmente os pedidos da coluna
- [x] Ao clicar no ícone do card Cancelados, limpar visualmente os pedidos da coluna
- [x] Limpeza apenas visual (front-end), sem apagar dados do banco

## Card de avaliação gratuita - versão mobile compacta
- [x] No mobile: mostrar apenas ícone de relógio + quantidade de dias restantes
- [x] Ao clicar no card no mobile: expandir e mostrar texto completo
- [x] Desktop: manter comportamento atual

## Bug: Limpeza manual de pedidos não persiste após refresh
- [x] Persistir limpeza manual no localStorage para sobreviver ao refresh da página
- [x] Reset automático à meia-noite (timezone do restaurante)

## Animação pulse no badge de trial
- [x] Adicionar animação pulse no badge quando restarem menos de 3 dias de trial

## Bug: Pedido finalizado não aparece no card Completos após limpeza manual
- [x] Ao finalizar pedido, resetar limpeza manual do card Completos para que o novo pedido apareça
- [x] Mesma lógica para Cancelados: ao cancelar pedido, resetar limpeza manual do card Cancelados

## Página de Avaliações do Restaurante
- [x] Schema: adicionar campo de resposta (responseText, responseDate) na tabela de avaliações
- [x] Backend: procedures tRPC para listar avaliações, métricas e responder
- [x] Frontend: página de Avaliações com cards de métricas no topo
- [x] Frontend: lista de avaliações com nota, nome, comentário, data, status
- [x] Frontend: botão Responder com campo de texto inline/modal
- [x] Frontend: resposta pública visível junto da avaliação
- [x] Sidebar: reorganizar Cardápio como submenu de Menu (Menu > Cardápio, Avaliações)
- [x] Badge: contador de avaliações pendentes no menu lateral
- [x] Destaque visual para avaliações negativas (1-2 estrelas)

## Controle de Avaliações (Toggle Ativar/Desativar)
- [x] Schema: adicionar campo reviewsEnabled (boolean) e fakeReviewCount na tabela establishments
- [x] Configurações > Estabelecimento: card "Avaliações do Restaurante" com toggle
- [x] Menu público (desativado): nota fixa 5.0, quantidade fake, sem modal de avaliações
- [x] Menu público (desativado): ocultar modal de avaliação pós-pedido entregue
- [x] Admin (desativado): ocultar menu Avaliações no sidebar e badge
- [x] Admin (desativado): bloquear acesso à página /avaliacoes com mensagem
- [x] Backend: impedir criação de avaliações quando desativado

## Resposta do restaurante no modal de avaliações do menu público
- [x] Exibir resposta do restaurante junto da avaliação no modal do menu público
- [x] Visual da resposta: nome do restaurante, texto da resposta, data

## Ajuste visual dos cards de Avaliações
- [x] Ajustar cards de métricas da página Avaliações para seguir mesmo estilo do Dashboard (borda colorida topo, sem sombra)

## Redesign do card de avaliação na página Avaliações
- [x] Redesenhar ReviewCard: pedido+data no topo, nota+estrelas, comentário do cliente com nome+data, área de resposta
- [x] Remover seção "O que pode melhorar"
- [x] Implementar tabela em lista de avaliações (Pedido, Data, Nota, Comentário, Status) conforme design de referência
- [x] Implementar sidebar direita (Sheet) com detalhes da avaliação ao clicar em "Mostrar detalhes"
- [x] Backend: incluir orderNumber no resultado de reviews (join com orders)
- [x] Remover sombra dos cards da lista de pedidos para igualar estilo dos cards de gráficos da Dashboard
- [x] Redesenhar sidebar de avaliação conforme modelo iFood: título "Detalhes da avaliação", card cinza com pedido+data, nota grande com estrelas, comentário do cliente com nome+data, área de resposta com textarea e botão vermelho
- [x] Redesenhar sidebar de avaliação com cabeçalho vermelho (estilo Forma de Pagamento) e 15% mais larga
- [x] Remover sombra do card da lista de avaliações na página de Avaliações
- [x] Sidebar avaliação: mostrar resposta em container de leitura quando já respondida, com botão "Editar resposta" para modo de edição
- [x] Paginação backend: adicionar limit/offset e contagem total na query de avaliações
- [x] Paginação frontend: controles Primeira, Anterior, campo de página, Próxima, Última (15 por página)
- [x] Redesenhar layout interno da sidebar de avaliação estilo iFood: nota destaque, estrelas, check verde cliente, seção resposta com estados sem/com resposta, layout limpo e responsivo
- [x] Remover badge "Verificada" da nota na sidebar de avaliação
- [x] Substituir ícone check verde do cliente por avatar vermelho com inicial do nome
- [x] Substituir ícone check verde da resposta por avatar com inicial do restaurante
- [x] Corrigir erro acessibilidade: adicionar SheetTitle ao SheetContent da sidebar de avaliação
- [x] Página de planos: alterar seleção padrão de anual para mensal
- [x] Corrigir card "Seu Plano" na página de planos: remover dados hardcoded e mostrar plano real do utilizador
- [x] Utilizadores sem assinatura devem ver "Plano Gratuito" no card "Seu Plano"
- [ ] Adicionar campo ownerDisplayName (varchar 11) no schema de establishments
- [ ] Adicionar campo "Nome do responsável" no onboarding passo 1 ao lado do nome do estabelecimento
- [ ] Limite de 11 caracteres no campo Nome do responsável
- [ ] Exibir ownerDisplayName no perfil do utilizador na topbar (dropdown e header)

## Campo Nome do Responsável no Onboarding
- [x] Adicionar campo "Nome do responsável" ao Step 1 do onboarding (ao lado de "Nome do estabelecimento")
- [x] Limitar campo a 11 caracteres com contador visual
- [x] Salvar ownerDisplayName na base de dados via backend (endpoint create)
- [x] Exibir ownerDisplayName no topbar/perfil do AdminLayout (avatar + nome + dropdown)
- [x] Fallback para user.name quando ownerDisplayName não está definido
- [x] Testes unitários para validação e lógica de fallback

## Subtítulo do Card Heatmap
- [x] Alterar subtítulo do card de heatmap para "Dias e horários com mais acessos ao seu cardápio"

## Tooltip do Heatmap
- [x] Substituir "visualizações" por "acesso" (1) ou "acessos" (2+) no tooltip das células do heatmap

## Legenda do Heatmap
- [x] Atualizar "Total acumulado" para "Total de acessos" na legenda inferior do heatmap

## Página de Estoque
- [x] Remover coluna "Custo unitário" da tabela de itens de estoque
- [x] Remover coluna "Valor total" da tabela de itens de estoque
- [x] Implementar busca por nome do item na página de estoque

## Formulário de Estoque - Layout e Formatação
- [x] Mover seleção de categoria para ao lado do campo nome do item
- [x] Formatar quantidade mínima como inteiro (1, 2, 3) sem vírgula para unidade/pacote/caixa/dúzia
- [x] Formatar custo por unidade com vírgula (ex: 100 → 1,00 / 050 → 0,50)
- [x] Remover campo "Custo por unidade (R$)" do modal de editar item de estoque

## Editar Produto - Controle de Estoque
- [x] Ao ativar controle de estoque e salvar, criar automaticamente o item na página de estoque (sem redirecionar)
- [x] Reverter redirecionamento incorreto para /estoque no ProductForm

## Bug Fix e Vinculação Estoque-Produto
- [x] Corrigir criação automática de item de estoque (item 120100 não foi criado)
- [x] Adicionar campo linkedProductId ao stockItems para vincular produto ao estoque
- [x] Descontar estoque automaticamente ao vender/confirmar pedido

## Remoção do Botão Novo Item no Estoque
- [x] Remover botão "Novo Item" da página de estoque (itens são criados via catálogo)

## Badge Breve no Menu Estoque
- [x] Remover badge "Breve" do item Estoque na sidebar

## Cor do Badge de Avaliações
- [x] Alterar cor dos badges de novas avaliações (e do menu pai) para vermelho, igual ao badge de novos pedidos

## Estado Vazio do Estoque
- [x] Remover botão "Adicionar primeiro item" do estado vazio e orientar utilizador a usar o catálogo

## Bloqueio de Produto sem Estoque no Menu Público
- [x] Bloquear produto no menu público quando estoque vinculado chegar a zero
- [x] Mostrar badge "Indisponível" no produto sem estoque no menu público

## Bug: Estoque não desconta ao comprar
- [x] Corrigir: estoque não é descontado ao realizar compra/confirmar pedido
- [x] Corrigir: menu público não mostra "Indisponível" após estoque chegar a zero

## Badge de Estoque sem Produto na Sidebar
- [x] Criar endpoint para contar itens de estoque com quantidade zero
- [x] Adicionar badge vermelho no menu Estoque na sidebar com contagem de itens sem estoque

## Bug: Entrada de estoque não atualiza quantidade
- [x] Corrigir: movimentação de entrada não atualiza currentQuantity do item de estoque (tabela stockMovements não existia)
- [x] Corrigir: badge de sem estoque continua após entrada de estoque (tabela stockMovements não existia)

## Sincronização stockQuantity do produto com currentQuantity do stockItem
- [x] Criar função syncProductStockQuantity que atualiza stockQuantity do produto vinculado
- [x] Chamar sincronização em addStockMovement (entrada/saída/ajuste)
- [x] Chamar sincronização em deductStockForOrder (desconto automático) - via addStockMovement
- [x] Chamar sincronização em updateStockItem (quando currentQuantity é alterado)

## Controle de estoque desativado por padrão
- [x] Garantir que ao adicionar novo produto no catálogo, a opção de controle de estoque esteja desativada por padrão

## Desativar controle de estoque em estabelecimentos específicos
- [x] Desativar hasStock de todos os produtos dos estabelecimentos 30001, 60018, 90001 e 150004

## Bug: Produtos não aparecem no menu público quando hasStock=false
- [x] Corrigir lógica no backend: outOfStock só deve ser true quando hasStock=true E stockQuantity=0 (backend já estava correto)
- [x] Corrigir lógica no frontend (MenuPublico): produtos com hasStock=false devem aparecer normalmente
- [x] Badge "Indisponível" só aparece quando hasStock=true E quantidade=0 (corrigido em PublicMenu, PDVSlidebar e MobilePDVModal)

## Bug: Menu público não atualiza disponibilidade após pedido
- [x] Invalidar cache do menu público após criação de pedido para refletir estoque atualizado em tempo real

## Restauração automática de estoque ao cancelar pedido
- [x] Criar função restoreStockForOrder que devolve estoque dos itens do pedido cancelado
- [x] Integrar restauração no fluxo de cancelamento (updateOrderStatus → cancelled)
- [x] Registrar movimentação de entrada com motivo "Pedido cancelado"
- [x] Sincronizar stockQuantity do produto após restauração (via addStockMovement que já chama syncProductStockQuantity)

## Bug: Quantidade de estoque não atualiza em tempo real na edição do produto
- [x] Corrigir campo stockQuantity na página de editar produto para refletir valor atualizado sem refresh

## Validação completa de estoque em todos os fluxos
- [x] Backend: validar estoque antes de criar pedido público (createPublicOrder)
- [x] Backend: validar estoque antes de criar pedido interno (createOrder - PDV/mesas)
- [x] Frontend Menu Público: limitar quantidade no carrinho ao estoque disponível
- [x] Frontend Menu Público: mostrar quantidade disponível ao cliente
- [x] Frontend PDV: limitar quantidade ao estoque disponível
- [x] Frontend Mesas/Comandas: limitar quantidade ao estoque disponível
- [x] Nenhum fluxo pode ignorar o estoque

## Validação de estoque no carrinho/sacola (incremento de quantidade)
- [x] Menu Público: impedir incremento de quantidade na sacola além do estoque disponível
- [x] Menu Público: mostrar indicador visual quando limite de estoque é atingido na sacola
- [x] PDV: impedir incremento de quantidade no carrinho além do estoque disponível (via updateCartItem)
- [x] Mesas/Comandas: impedir incremento de quantidade no carrinho além do estoque disponível (via updateCartItem)

## Redesign barra inferior mobile - Menu Público
- [x] Mover menu "Pedidos" para o menu hamburger (3 barrinhas)
- [x] Barra inferior fixa oculta até cliente adicionar item à sacola
- [x] Efeito slide-up ao aparecer a barra
- [x] Lado esquerdo: valor total + quantidade de itens
- [x] Lado direito: botão "Ver sacola"
- [x] Info de entrega: grátis / taxa fixa com valor / "total sem entrega" (por bairro)
- [x] Alterações apenas na versão mobile, desktop permanece igual

## Bug: botões de quantidade e adicionar desaparecem no modal do produto
- [x] Investigar e corrigir: após esvaziar sacola e abrir modal do produto novamente, botões +/- e "Adicionar" não aparecem (corrigido: auto-fechar sacola quando vazia + remover sticky/z-index conflitante do footer)

## Bug: borda colorida dos cards na página de Pedidos mais fina que na Dashboard
- [x] Corrigir espessura da borda superior colorida dos cards na página de Pedidos para ficar igual à Dashboard (ordem das classes CSS corrigida)

## Remover sombra do card Conectado/Desconectado na página de Pedidos
- [x] Remover shadow do card de status de conexão na página de Pedidos

## Ocultar botão Sacola no desktop quando carrinho vazio
- [x] Ocultar botão Sacola no header desktop quando carrinho estiver vazio, mostrar apenas Pedidos
- [x] Quando houver itens no carrinho, exibir Sacola junto com Pedidos no desktop
- [x] Nenhuma alteração na versão mobile

## Bug: PDV mostrando itens como Indisponível com controle de estoque desativado
- [x] Corrigir lógica no PDV: itens com hasStock=false não devem aparecer como Indisponível
- [x] Indisponível só quando hasStock=true E stockQuantity=0
- [x] Corrigido em PDV.tsx, PDVSlidebar.tsx e MobilePDVModal.tsx
- [x] Adicionado stockQuantity ao tipo Product no PDV.tsx

## Bug: Busca no PDV não funciona sem acentos
- [x] Implementar normalização de acentos na busca de produtos do PDV (ex: "agua" deve encontrar "Água mineral")
- [x] Aplicar em PDV.tsx, PDVSlidebar.tsx e MobilePDVModal.tsx (MobilePDVModal já tinha normalização)

## Limitação de avaliações quando opção desativada
- [x] Quando a opção de Avaliações do Restaurante estiver desativada, limitar o campo de quantidade a no máximo 250 avaliações
- [x] Validar no frontend (input max) e backend (zod schema)

## Tooltip no campo de quantidade de avaliações
- [x] Adicionar tooltip ou texto de ajuda explicando o motivo do limite de 250 avaliações

## Bug: Perda de dados digitados ao mudar de aba do navegador
- [x] Corrigir re-fetch automático que sobrescreve estado local em Configurações
- [x] Corrigir re-fetch automático que sobrescreve estado local em Atendimento
- [x] Corrigir re-fetch automático que sobrescreve estado local em Estabelecimento
- [x] Desabilitar refetchOnWindowFocus globalmente no QueryClient
- [x] Adicionar flags initialDataLoaded em Configuracoes.tsx (establishment, businessHours, neighborhoodFees, printerSettings)
- [x] Adicionar initialDataLoaded em CouponForm.tsx
- [x] Reset de flags após save (onSuccess das mutations)

## Migração do cardápio Sr. Macarrão para estabelecimento 210001
- [x] Acessar e extrair dados completos do cardápio via API Mindi (categorias, produtos, preços, descrições, complementos, fotos)
- [x] Migrar 8 categorias para o estabelecimento 210001
- [x] Migrar 55 produtos com 54 fotos para o estabelecimento 210001
- [x] Migrar 73 grupos e 500 itens de complementos
- [x] Validar migração completa no banco de dados

## Remover fotos placeholder dos produtos migrados (estabelecimento 210001)
- [ ] Identificar produtos com fotos placeholder/geradas automaticamente pelo Mindi
- [ ] Remover imagens e deixar apenas o placeholder padrão do sistema

## Melhorar fotos dos produtos do estabelecimento 210001
- [x] Melhorar fotos: Esfirras (Variadas), Pizza (Grande, Média, Pequena), Macarrão (Médio, Grande, Prato Econômico, Alho e Óleo Grande), Oferta do dia (Combo 1-4), Novidades (Batata recheada) - 13 fotos melhoradas e enviadas para CDN

## Remover item Informações do menu lateral do menu público
- [x] Remover o item "Informações" do menu lateral, deixando apenas "Meus Pedidos"

## Corrigir emoji no template de mensagem de entrega
- [x] Trocar emoji de barco pelo emoji de moto 🛵 no template de pedido pronto/entrega

## Corrigir limites min/max dos complementos do estabelecimento 210001
- [x] Comparar dados originais do Mindi com o banco para identificar discrepâncias nos limites de seleção
- [x] Corrigir min/max de todos os 73 grupos de complementos conforme o cardápio original (66 correções aplicadas)

## Bug: Toggles de categorias aparecem todos desativados
- [x] Investigar por que os toggles de ativação das categorias aparecem como desativados na página de Categorias
- [x] Corrigir toggle para refletir o estado real (isActive) da categoria
- [x] Corrigir toggle para atualizar visualmente ao clicar (toast mostra "Categoria ativada" mas toggle não muda)

## Campo de busca mobile na página de Catálogo
- [x] Adicionar campo de busca visível na versão mobile da página de Catálogo para filtrar produtos
- [x] Filtrar produtos em tempo real conforme o usuário digita (busca por nome, sem acentos)

## Layout mobile Catálogo: botão nova categoria + campo de busca na mesma linha
- [x] Colocar campo de busca à esquerda e botão nova categoria à direita na mesma linha (versão mobile)

## Ajuste botão mobile Catálogo
- [x] Remover botão vermelho "+ item" acima do campo de busca no mobile
- [x] Botão ao lado do campo de busca deve adicionar novo produto (não nova categoria)
- [x] Botão ao lado do campo de busca na cor vermelha #db262f

## Bug: Dashboard mostra "Itens em Falta" mesmo sem controle de estoque ativado
- [x] Investigar lógica de cálculo dos itens em falta na dashboard
- [x] Corrigir para não contar itens em falta quando controle de estoque não está ativado (hasStock=false)

## Bug: Preços de complementos voltam ao valor antigo após salvar (produtos 300057 e 300002)
- [x] Investigar dados dos complementos dos produtos 300057 e 300002 no banco
- [x] Investigar lógica de salvamento/atualização de complementos no backend
- [x] Corrigir preços em centavos no banco (31 complementos divididos por 100)
- [x] Corrigir bug na função parsePriceInput que multiplicava preços por 100 ao salvar sem editar (tratava ponto decimal como separador de milhar)

## Bug RECORRENTE: Preços de complementos do estabelecimento 210001 voltam a valores errados
- [x] Verificar estado atual dos preços no banco (6 complementos do produto 300002 com 1000.00)
- [x] Investigar se a correção do parsePriceInput foi deployada corretamente (sim, estava no código)
- [x] Investigar causa raiz: usuário salvou produto antes do deploy da correção
- [x] Corrigir os 6 preços no banco (1000.00 -> 10.00)
- [x] Adicionar normalização de preço ao carregar complementos do banco (formato americano -> brasileiro)
- [x] Validar com teste de ciclo completo (5 ciclos salvar/recarregar sem alteração de preço)

## Sidebar: Submenu "Menu" não deve recolher ao navegar
- [x] Fazer com que o submenu "Menu" só recolha ao clicar novamente no próprio "Menu", não ao navegar para outra página (persistido no localStorage)

## Bug: Excluir foto do produto não funciona
- [x] Investigar por que ao excluir a foto de um produto e salvar, a foto não é removida (enviava undefined em vez de [] quando sem fotos)
- [x] Corrigir para que a foto seja removida e o placeholder apareça (enviar [] ao backend)

## Redesign header de categoria no Catálogo
- [x] Remover ícone de lixeira da linha do título da categoria
- [x] Mover contagem de itens para ao lado direito do nome da categoria
- [x] Adicionar botão Pausar/Play para pausar/ativar a categoria
- [x] Adicionar botão 3 pontinhos com menu: Duplicar categoria e Remover categoria
- [x] Adicionar botão setinha (chevron) para minimizar/expandir itens da categoria
- [x] Implementar lógica de duplicar categoria no backend

## Ícone de arrastar nas categorias + auto-minimizar ao arrastar
- [x] Adicionar ícone de arrastar (GripVertical) ao lado esquerdo do título da categoria
- [x] Ao iniciar arraste de categoria, minimizar automaticamente todos os itens de todas as categorias
- [x] Ao soltar a categoria, restaurar o estado anterior de colapso

## Ajuste botões de ação dos itens no Catálogo
- [x] Remover botões de Duplicar e Excluir visíveis diretamente na linha do item
- [x] Adicionar ícone de 3 pontinhos (MoreVertical) sem estilo de botão, apenas o ícone
- [x] Ao clicar nos 3 pontinhos, abrir menu dropdown com opções "Duplicar" e "Excluir"
- [x] Manter Switch (toggle) para pausar/ativar o item

## Substituir Switch por botão Pausar/Play nos itens do Catálogo
- [x] Remover Switch/toggle vermelho dos itens
- [x] Adicionar botão Pausar/Play (ícone Pause/Play) igual ao da categoria

## Funcionalidade: Criar Combo (Catálogo)
- [x] Schema de banco: tabelas comboGroups e comboGroupItems
- [x] Procedures tRPC: CRUD de combos (criar, listar, deletar)
- [x] Botão "Criar combo" no header da categoria (à esquerda do botão Pausar)
- [x] Slidebar lateral direita (Sheet) com padrão visual da plataforma
- [x] Etapa 1: Seleção de produtos com busca debounce (300ms), limite 10 resultados
- [x] Etapa 1: Preview com foto, nome, categoria disponível e checkbox
- [x] Etapa 1: Botão "Agrupar produtos" e seção "Adicionados" com drag icon e remover
- [x] Etapa 1: Botão "Continuar" habilitado com ao menos 1 item agrupado
- [x] Etapa 2: Configuração do grupo (nome, tipo obrigatório/opcional, quantidade máxima)
- [x] Etapa 2: Validação - nome obrigatório e ao menos 1 item
- [x] Etapa 2: Botões Voltar e Concluir
- [x] Upsell: Seção para adicionar grupos adicionais após concluir primeiro grupo
- [x] Salvar combo como novo tipo de produto com estrutura de grupos

## Ajuste limite busca Criar Combo
- [x] Alterar limite de resultados da busca de 10 para 7 itens

## Adicionar foto e descrição no Criar Combo
- [x] Upload de foto do combo acima do campo Nome na tela de overview
- [x] Campo de descrição do combo abaixo do campo Nome
- [x] Enviar descrição e imagem ao criar o combo

## Ajuste botão Criar Combo no header da categoria
- [x] Mudar botão para exibir apenas texto "Criar Combo" sem ícone

## Ajuste mobile: botões da categoria no Catálogo
- [x] Esconder botões "Criar Combo" e "Pausar/Play" na versão mobile
- [x] Adicionar opções "Pausar/Ativar categoria" e "Criar Combo" no menu de 3 pontinhos acima de Duplicar e Remover

## Bug: Drag & Drop de categorias no Catálogo não está fluido
- [x] Comparar implementação de drag entre /categorias e /catalogo
- [x] Corrigir drag para ficar fluido como na página /categorias
  - Usar CSS.Translate em vez de CSS.Transform (sem scale)
  - Remover transition-all duration-200 conflitante
  - Esconder CategoryDropZone durante drag de categoria
  - Usar startTransition para batch collapse update
  - Adicionar position relative durante drag

## Ajuste badge Pausado dos itens e botão Criar Categoria
- [x] Igualar badge "Pausado" dos itens ao badge "Pausada" da categoria (mesmo tamanho, cor e estilo)
- [x] Adicionar botão "Criar Categoria" na página Catálogo
- [x] Scroll automático para o final da lista ao criar nova categoria

## Remover página /categorias e badge Pausado dos itens
- [x] Remover página /categorias (componente, rota e link no sidebar)
- [x] Remover badge "Pausado" dos itens na lista do catálogo (manter apenas badge da categoria)

## Ajuste mobile: preço abaixo do nome do item no Catálogo
- [x] Mover preço para abaixo do nome do item na versão mobile em tamanho menor

## Imagens placeholder estilo iFood para itens sem foto
- [ ] Criar 5 modelos de imagens placeholder com padrões de comida estilo iFood
- [ ] Upload para S3 e integrar no sistema como fallback para itens sem foto

## Remover itens pré-visualizados na slidebar Criar Combo
- [x] Não exibir itens pré-carregados - mostrar resultados apenas quando o usuário digitar na busca

## Ajuste botões Agrupar/Continuar na slidebar Criar Combo
- [x] Quando há itens selecionados: mostrar apenas botão "Agrupar X produtos"
- [x] Quando não há itens selecionados e já tem agrupados: mostrar apenas botão "C- [x] Bug: Complementos/grupos dos combos não aparecem no menu público
- [ ] Investigar como os combos são salvos no banco (comboGroups, comboGroupItems)
- [ ] Investigar como o menu público carrega dados dos combos
- [ ] Corrigir exibição dos grupos/complementos no menu público
- [x] Bug: Complementos/grupos não aparecem na página de edição do produto
- [x] Bug: BATATA FRITA aparece como GRÁTIS no combo quando deveria mostrar o preço correto
- [x] Bug: Ao criar combo e adicionar item que já possui complementos próprios, esses complementos não são importados/exibidos no combo
- [x] UX: Sidebar Criar Combo - lista de resultados da busca precisa de scroll próprio para manter busca e botões visíveis
- [x] Feature: Botão "Complementos" por item na página de catálogo com dropdown expansível inline
- [x] Feature: Dropdown mostra grupos de complementos com tags (Obrigatório/Opcional/Reutilizado), pausar, drag-and-drop
- [x] Feature: Itens dentro do grupo com nome, preço editável inline, pausar, deletar, drag-and-drop
- [x] Feature: Versão mobile com ícone de seta para expandir complementos
- [x] Feature: Estado vazio "Nenhum complemento configurado" com botão "Adicionar complemento"
- [x] Feature: Campos editáveis Mín, Máx e checkbox Obrigatório em cada grupo no dropdown de complementos do catálogo
- [x] Feature: Editar nome do grupo e do item inline no dropdown de complementos do catálogo (texto "Editar" em vermelho)
- [x] Feature: Toggle grátis/normal para complementos no dropdown do catálogo
- [x] Feature: Dropdown expandível ao clicar no item com badge/destaque e disponibilidade
- [x] Remover ícone do botão "Complementos" na página de catálogo (manter apenas texto + seta)
- [x] Adicionar badge de contagem de complementos no botão "Complementos" do catálogo
- [x] Bug: Itens não aparecem na página de catálogo do estabelecimento Big Norte (mas aparecem no menu público)
- [x] Remover badge "GRÁTIS" redundante ao lado do botão Editar quando item já está marcado como grátis no dropdown de complementos do catálogo
- [x] Mobile: Consolidar botões de ação dos complementos (editar, pausar/ativar, excluir) em menu de 3 pontinhos no dropdown do catálogo
- [x] Mobile: Mover toggle Grátis/Normal para dentro do menu de 3 pontinhos no dropdown de complementos do catálogo
- [x] Catálogo: Adicionar visual cinza/esmaecido nos itens pausados na lista (estilo iFood) para diferenciar visualmente de itens ativos
- [x] Catálogo: Botão de ativar (Play) não deve ficar com efeito de opacidade/cinza quando item está pausado
- [x] Aplicar visual esmaecido (cinza + opacidade) nos itens de complemento pausados dentro do dropdown, mantendo botão ativar normal
- [x] Bug: Erro de estoque insuficiente ao fazer pedido mesmo quando estoque não está ativado (itens 120063 e 300067, estabelecimento 30001)
- [x] Bug: PDV perde lista de itens do carrinho ao navegar para outra página e voltar - deve persistir os itens
- [x] PDV: Persistir dados de entrega (nome, telefone, endereço) e retirada (nome, telefone) no sessionStorage
- [x] Catálogo: Reduzir largura do campo de edição do nome do complemento e adicionar botões salvar/cancelar
- [x] Catálogo: Botões de ação (Normal, preço, pausar, lixeira, dropdown) não devem se mover quando campo de edição do nome é ativado
- [x] Catálogo: Remover sombras dos botões na lista de itens e header do catálogo
- [x] Bug: Erro de validação no catálogo - availableDays e availableHours enviados como null em vez de array
- [x] Pedidos: Mover tipo de entrega (Retirada/Entrega/Mesa) para abaixo do número do pedido no card, em vez da linha do preço
- [x] Pedidos: Estilizar tipo de entrega abaixo do número do pedido como badge escuro (fundo preto, texto branco, arredondado)
- [x] Fix catálogo: ao voltar da edição de produto, rolar para a categoria que estava sendo editada em vez de voltar ao topo
- [x] Fix campos Mín/Máx dos adicionais no catálogo: permitir apagar completamente (sem ficar preso no zero), aceitar apenas inteiros, limitar a 999
- [x] Bug: Maximum call stack size exceeded na página /pedidos - recursão infinita em useMemo / Tooltip nesting no editor visual
- [x] Pedidos: Alterar cor do badge de tipo de entrega para combinar com a cor da coluna do kanban (em vez de vermelho fixo)
- [x] Pedidos: Modo lista compacta - adicionar toggle para alternar entre visualização kanban e lista compacta
- [x] Templates WhatsApp: Adicionar método de pagamento na variável {{itensPedido}} abaixo do total (ex: 💰 Pagamento via: *PIX*)
- [x] Reset diário automático da numeração de pedidos (#P1) à 00:00, respeitando fuso horário do estabelecimento
- [x] Pedidos: Alterar cores dos botões de ação (Aceitar, Pronto, Finalizar) para combinar com a cor da coluna do kanban
- [x] Pedidos: Alterar cor do card de Preparo de dourado/âmbar para vermelho
- [x] Bug crítico: Acompanhamento de pedido retorna pedido antigo após reset diário da numeração - usar ID único em vez de número visual
- [x] Bug: Badge de contagem de complementos no catálogo não atualiza ao excluir todos os complementos de um item - só some ao atualizar a página
- [x] Catálogo: Campo de edição do nome do complemento deve ter largura proporcional ao texto, não largura total
- [x] Catálogo: Adicionar textos "Salvar" e "Cancelar" ao lado dos ícones check e X no campo de edição do complemento
- [x] Catálogo: Manter botões de ação (Normal, preço, pausar, lixeira) fixos à direita quando campo de edição do nome do complemento está ativo
- [x] Catálogo: Aumentar largura do campo de edição do nome do complemento para ~1.5x-2x o tamanho do texto
- [x] Refatorar criação de produto: substituir modal central por slidebar lateral direita (padrão Combo)
- [x] Slidebar Etapa 1: Informações básicas (imagem, nome, descrição, categoria, status, estoque)
- [x] Slidebar Etapa 2: Grupos de complementos (criar/copiar grupo, criar/copiar complemento)
- [x] Slidebar Etapa 3: Disponibilidade e preço final (preço, categorias, horários)
- [x] Progress bar no topo da slidebar (Passo 1 de 3)
- [x] Não impactar botão de Complementos existente no catálogo
- [x] Alinhar estilo visual da slidebar de criar produto com a slidebar de criar combo (background branco, mesmo padrão)
- [x] Passo 2 da slidebar de criar produto: adicionar 3 abas/cards antes de criar/copiar grupo — Ingredientes, Especificações, Descartáveis
- [x] Cada aba leva ao mesmo fluxo de criar/copiar grupos (mudança visual, sem alterar lógica)
- [x] Remover link "Voltar às categorias" do topo do conteúdo no Passo 2 da slidebar de criar produto
- [x] Remover título com ícone da categoria do conteúdo no Passo 2
- [x] Adicionar botão "Voltar" ao lado esquerdo do botão "Avançar" no footer do Passo 2
- [x] Remover botão de seta voltar do header vermelho do Passo 2 (já tem Voltar no footer)
- [x] Remover botão de seta voltar do header vermelho de TODOS os passos e sub-passos da slidebar de criar produto
- [x] Adicionar placeholder contextual no campo "Nome do grupo" baseado na categoria selecionada (ex: "Deseja descartáveis?" para Descartáveis)
- [x] Trocar foto da página de Criar Conta pela imagem do homem no restaurante com burger e tablet
- [x] Alterar cor de fundo do tab selecionado na lista de pedidos: de preto para cor clara do badge do status (azul claro para Novos, vermelho claro para Preparo, etc.)
- [x] Aumentar tamanho dos textos, botões e elementos da visualização em lista de Pedidos para ficar no padrão do Kanban e demais páginas
- [x] Corrigir badges de tipo de entrega (Entrega, Retirada, Consumo) no modo lista de Pedidos para ter o mesmo visual do modo Kanban
- [x] Exibir nome completo do status no badge da coluna STATUS no modo lista de Pedidos (em vez de abreviado)
- [x] Criar coluna separada TEMPO no modo lista de Pedidos e remover o tempo da coluna PEDIDO
- [x] Trocar foto da página de Login pela imagem dos dois bartenders com tablet
- [ ] Adicionar campo de Estoque editável inline ao lado esquerdo do preço na versão desktop do cardápio
- [ ] Tornar campo de Preço editável inline na versão desktop do cardápio
- [x] Auto-salvar estoque e preço ao clicar fora do campo (onBlur)
- [x] Adicionar campo de Estoque editável inline ao lado esquerdo do preço na versão desktop da página de Catálogo
- [x] Tornar campo de Preço editável inline na versão desktop da página de Catálogo
- [x] Auto-salvar estoque e preço ao clicar fora do campo (onBlur)
- [ ] Corrigir formato do campo de preço inline no Catálogo para padrão brasileiro (R$ 0,00)
- [x] Implementar máscara de moeda brasileira no campo de preço inline do Catálogo (digitar 500 = 5,00)
- [x] Aplicar campo de preço editável inline com máscara de moeda nos complementos da página de Catálogo (sem cor vermelha)
- [x] Aplicar máscara de moeda brasileira nos campos de preço do CreateProductSheet
- [x] Aplicar máscara de moeda brasileira no campo de preço do CreateComboSheet
- [x] Remover campo "Nome do grupo" e botão "Adicionar grupo" inline do dropdown de complementos no Catálogo
- [x] Adicionar botão "Adicionar grupo" que abre slidebar com seleção de categoria (Ingredientes, Especificações, Descartáveis) reutilizando fluxo do CreateProductSheet step 2
- [x] Adicionar tela intermediária "Criar novo grupo / Copiar grupo existente" no AddGroupSheet após seleção de categoria
- [x] Centralizar botões "Adicionar item" e "Adicionar grupo" no dropdown de complementos, "Adicionar grupo" vermelho e "Adicionar item" com destaque
- [x] Bug: Ao limpar campo de estoque no Catálogo (deixar vazio), o item deve desaparecer da página de Estoque

## Redesign da Página de Complementos - Gestão Global de Grupos
- [x] Nível 1: Lista de grupos com nome, qtd complementos, qtd produtos vinculados
- [x] Nível 1: Botão pausar grupo inteiro (todos complementos ficam indisponíveis)
- [x] Nível 1: Botão excluir grupo inteiro
- [x] Nível 2: Expandir grupo mostra complementos (igual Catálogo)
- [x] Nível 2: Editar mín/máx/obrigatório globalmente (altera para todos os produtos)
- [x] Nível 2: Pausar/reativar complemento individual
- [x] Nível 2: Editar preço, tipo (Normal/Grátis), reordenar complementos
- [x] Nível 2: Adicionar novo complemento ao grupo
- [x] Nível 2: Excluir complemento individual
- [ ] Backend: Endpoints para listar grupos globais com contagem de produtos
- [ ] Backend: Endpoint para pausar/reativar grupo inteiro
- [ ] Backend: Endpoint para excluir grupo inteiro
- [ ] Backend: Endpoint para alterar regras (mín/máx/obrigatório) globalmente
- [x] Bug: Pausar grupo na página de Complementos não reflete na página de Catálogo (grupo continua visível/ativo)
- [x] Mover item "Grupos" para dentro do submenu "Menu", abaixo de "Cardápio"

## Página de Entregadores
- [ ] Schema: tabela drivers (nome, email, whatsapp, status, estratégia repasse, valor fixo, percentual)
- [ ] Schema: tabela deliveries (pedido, entregador, valor taxa, valor repasse, status pago/pendente)
- [ ] DB helpers: CRUD de entregadores
- [ ] DB helpers: métricas de entregadores (cadastrados, ativos, inativos, repasses 7 dias)
- [ ] DB helpers: lista de entregas por entregador
- [ ] tRPC procedures: CRUD entregadores + métricas + entregas
- [ ] Página /entregadores: cards de métricas (cadastrados, ativos, inativos, repasses 7 dias)
- [ ] Página /entregadores: tabela de entregadores com nome, whatsapp, status, estratégia, entregas, total a receber
- [ ] Slidebar criar/editar entregador com campos: nome, email, whatsapp, status, estratégia repasse
- [ ] Página detalhes do entregador: métricas individuais + lista de entregas
- [ ] Botão marcar entrega como paga
- [ ] Integração UAZAPI: envio automático WhatsApp ao marcar pedido como "Saiu para entrega"
- [ ] Registrar delivery_whatsapp_sent no banco para evitar duplicatas
- [ ] Menu lateral: adicionar "Entregadores" abaixo de "Pedidos"
- [ ] Testes unitários para endpoints de entregadores
- [x] Ajustar cards de métricas Entregadores: separar Repasses (7d) em valor e novo card para quantidade de entregas
- [x] Padronizar slidebar de Novo Entregador com o mesmo estilo da slidebar de Criar Combo do Catálogo
- [x] Adicionar ícone X no header da slidebar de Novo Entregador para fechar
- [x] Validação de WhatsApp em tempo real via UAZAPI antes de salvar entregador

## Fluxo inteligente de atribuição de entregadores
- [ ] Ao marcar pedido como "Pronto": verificar entregadores ativos
- [ ] Se 1 entregador ativo: atribuir automaticamente + status "Em entrega" + enviar WhatsApp
- [ ] Se 2+ entregadores ativos: abrir modal de seleção de entregador
- [ ] Se 0 entregadores ativos: não fazer nada (apenas marcar como Pronto normalmente)
- [ ] Após seleção no modal: atribuir + status "Em entrega" + enviar WhatsApp
- [ ] Backend: endpoint para auto-assign com mudança de status
- [x] Fluxo de entregadores deve se aplicar APENAS a pedidos de entrega (delivery), não para retirada (pickup) ou consumo no local (dine_in)
- [x] Bug: Modal de Notificações WhatsApp aparece mesmo quando WhatsApp já está conectado - deve aparecer apenas uma vez para novos usuários
- [x] Bug: Botão "Ver pedidos" na notificação de novo pedido faz reload completo da página em vez de navegação SPA

## Mensagem WhatsApp do Entregador - Melhorias
- [x] Atualizar formato da mensagem WhatsApp para entregador conforme modelo do usuário
- [x] Incluir informação de troco (changeAmount) quando pagamento for dinheiro
- [x] Separar endereço em linhas: rua+número, bairro, referência
- [x] Adicionar emoji de troco (💵) com texto "Vai precisar de troco?" quando for dinheiro
- [x] Aplicar mesmo formato nas 3 mensagens: markReadyAndAssign, assignDriver, resendNotification
- [x] Corrigir duplo # no orderNumber das mensagens (orderNumber já inclui #)
- [x] Remover link "Abrir no mapa" da mensagem WhatsApp do entregador

## Configuração de Momento de Acionamento do Entregador
- [x] Adicionar campo driverNotifyTiming no schema de establishments (on_accepted / on_ready, padrão: on_ready)
- [x] Adicionar campo deliveryNotified (boolean) no schema de orders para evitar duplicatas
- [x] Migrar banco de dados com os novos campos
- [x] Criar DB helpers para get/update driverNotifyTiming
- [x] Criar tRPC procedure para get/update configuração de timing
- [x] Atualizar fluxo de aceitar pedido: se timing=on_accepted, acionar entregador automaticamente
- [x] Atualizar fluxo de marcar como pronto: se timing=on_ready, acionar entregador (manter comportamento atual)
- [x] Verificar deliveryNotified antes de enviar para evitar duplicatas
- [x] Marcar deliveryNotified=true após envio bem-sucedido
- [x] Enviar apenas para pedidos com modalidade Entrega
- [x] Verificar se existe entregador ativo antes de enviar
- [x] Adicionar opção de configuração no modal de novo entregador (abaixo da estratégia de repasse)
- [x] Padrão: "Quando o pedido for marcado como pronto"
- [x] Testes unitários para a nova lógica
- [x] Bug: Ao editar entregador, campos (nome, email, WhatsApp, etc.) não ficam preenchidos com os dados existentes
- [x] Alterar título da mensagem do entregador de "Nova entrega" para "Nova entrega!"
- [x] Remover card "Média por entrega" da página de detalhes do entregador
- [x] Bug: Estabelecimento 60018 mostra "fechado" ao enviar pedido no menu público - corrigido: frontend agora usa computedIsOpen do servidor como fonte de verdade
- [x] Bug: Toggle "Aberto agora" no admin mostra "Aberto" mas banco de dados tem manuallyClosed=true - corrigido: admin agora usa computedIsOpen do servidor como fonte de verdade
- [x] Quando sidebar minimizada e usuário clicar em "Menu" (com submenu), a barra deve expandir em vez de mostrar tooltip/popover

## Auto-scroll Complementos no Menu Público
- [x] Auto-scroll suave para próximo grupo de complementos quando cliente atingir quantidade máxima no menu público
- [x] Bug: Auto-scroll dos complementos mostra parte do grupo anterior após completar seleção - próximo grupo deve ficar no topo da área visível
- [x] Bug: Clicar no texto do complemento não seleciona o item - só funciona clicando na área vazia do complemento
- [x] Alterar cor do estado "Completo" dos complementos de verde para vermelho (bordas, header, badge, ícone, subtítulo)
- [x] Bug: Botão de ativar/pausar da categoria no catálogo não reflete estado pausado quando todos os itens da categoria estão pausados
- [x] Bug: Botão de ativar/pausar da categoria no catálogo não reflete estado pausado quando todos os itens da categoria estão pausados
- [x] Bug: Itens dentro de categoria pausada não aparecem visualmente como pausados (devem ter opacidade reduzida e ícone de pausa)
- [x] Bug: Cards na coluna 'Pronto' do Kanban aparecem com cor laranja em vez de verde
- [x] Reduzir altura dos cards de pedido no Kanban para ficarem mais compactos
- [x] Adicionar efeito pulsante no badge "ENTREGA" dos cards de pedido no Kanban
- [x] Sistema de Agendamento: Schema DB (scheduledAt, isScheduled, movedToQueue nos pedidos + configurações de agendamento)
- [x] Sistema de Agendamento: Helpers DB e procedures tRPC (CRUD agendados, configurações, job automático)
- [x] Sistema de Agendamento: Menu público - botão "Agendar" no resumo + step de agendamento (data/hora)
- [x] Sistema de Agendamento: Painel admin - página "Agendados" com calendário mensal + lista de pedidos
- [x] Sistema de Agendamento: Configurações do restaurante - seção Agendamento (toggle, antecedência, intervalo, etc.)
- [x] Sistema de Agendamento: Integração WhatsApp para pedidos agendados
- [x] Sistema de Agendamento: Testes unitários (50 testes passando)
- [x] Sistema de Agendamento: Job automático para mover pedidos agendados para fila (intervalo 60s)

## Redesign Visual da Página Agendados (Alinhar com Dashboard)
- [x] Cards superiores: remover sombras, reutilizar mesmo componente visual da Dashboard (border-radius, borda, padding, tipografia, ícones)
- [x] Cabeçalho: mesmo tamanho de título, font-weight, espaçamento e subtítulo da Dashboard
- [x] Filtros: reutilizar mesmo componente segmentado da Dashboard (background, cor ativa, arredondamento, transição, padding)
- [x] Calendário: redesenhar estilo SaaS moderno (células maiores, hover suave, dia selecionado com bg primária, indicadores discretos, sem sombra)
- [x] Painel direita (lista do dia): sem sombra, mesmo estilo de card, padding e tipografia da Dashboard
- [x] Badges de status padronizados (Agendado=cinza, Aguardando=laranja, Aceito=verde, Na fila=azul)
- [x] Consistência global: mesmo espaçamento, tipografia, hover, botões e identidade visual

## Redesign Calendário e Painel Lateral (Modelo de Referência)
- [x] Calendário: layout tabela com células grandes, bordas finas, número no canto superior esquerdo
- [x] Calendário: mostrar nomes de pedidos/horários dentro das células (não apenas dots)
- [x] Calendário: dia selecionado com círculo azul sólido no número (hoje=primary, selecionado=highlight)
- [x] Calendário: dias de outros meses em cinza claro
- [x] Painel direita: cards de pedidos detalhados com status badge, descrição, data/hora, ações (editar/excluir)
- [x] Painel direita: cabeçalho com data formatada (ex: "Fev 15 Dom")

## Refinamento Visual Calendário e Cards de Pedidos (v3)
- [x] Calendário: usar SectionCard como wrapper para manter consistência com Dashboard
- [x] Calendário: separar visualmente do painel direita (dois cards independentes como na referência)
- [x] Calendário: bordas mais suaves, hover mais sutil, espaçamento interno melhor
- [x] Painel direita: usar SectionCard como wrapper independente
- [x] Cards de pedidos: seguir padrão visual dos cards da Dashboard (sem sombra, borda leve, padding consistente)
- [x] Empty state: mais limpo e alinhado com o padrão do sistema

## Calendário: Estilo Pill/Chip nos Pedidos
- [x] Cada pedido dentro da célula do calendário deve ter fundo arredondado verde claro (pill/chip) como na referência

## Navegação: Agendados como submenu de Pedidos
- [x] Mover Agendados para dentro do menu Pedidos como submenu (igual ao padrão do menu "Menu" com submenus)

## Fix: Menu Pedidos navegar + expandir dropdown
- [x] Clicar em Pedidos deve navegar para /pedidos E expandir o dropdown com Agendados simultaneamente

## Ajuste largura botões Agendar/Próximo no resumo do pedido
- [x] Botão Agendar deve ocupar 15% da largura (só ícone) e Próximo 85% (flex-1) no modal de resumo do pedido público

## Cor do botão Enviar Pedido no modal de confirmação
- [x] Alterar botão de enviar pedido de verde para vermelho no modal de confirmação do menu público

## Botão Ver Detalhes nos cards de Pedidos Agendados
- [x] Adicionar botão "Ver detalhes" nos cards de pedidos agendados
- [x] Reutilizar a mesma sidebar de detalhes da página de Pedidos (Sheet com mesmo estilo)
- [x] Incluir informações de agendamento (data/hora agendado) na sidebar com secção azul destacada

## Redesign Cards de Agendados para Padrão de Pedidos
- [x] Cabeçalho do card: número do pedido + badge modalidade (Entrega/Retirada) + horário agendado
- [x] Linha central: nome do cliente + método pagamento + valor em vermelho
- [x] Rodapé: botão ver detalhes + ações (aceitar/reagendar/cancelar)
- [x] Seguir mesmo estilo visual dos cards de Pedidos (header colorido, content compacto, actions)

## Botão Imprimir nos Cards de Pedidos Agendados
- [x] Adicionar botão de imprimir nos cards de pedidos agendados (substituiu ícone de olho por impressora)
- [x] Reutilizar mesma funcionalidade de impressão da página de Pedidos (normal + múltiplas impressoras)
- [x] Incluir dropdown com opções de impressão e favorito (estrela amber)

## Badge "Agendado" e Card de Agendamento no Recibo e Cards
- [x] Badge no recibo HTML: mostrar "AGENDADO" em vez de "RETIRADA/ENTREGA" quando pedido for agendado
- [x] Badge no recibo texto puro (ESC/POS): mostrar "AGENDADO" + secção com data/hora
- [x] Badge no recibo ESC/POS printer: mostrar "AGENDADO" + secção com data/hora
- [x] Badge no recibo por sector: mostrar "AGENDADO"
- [x] Adicionar card/secção de agendamento (data e hora) abaixo do card de retirada no recibo HTML
- [x] Adicionar card/secção de agendamento (data e hora) no recibo por sector

## Remover sombra dos cards de pedidos agendados
- [x] Remover shadow dos cards de pedidos na página Agendados

## Badge no Submenu Agendados e Notificação de Pedido Agendado
- [x] Adicionar badge com contagem de pedidos agendados pendentes no submenu "Agendados" na sidebar
- [x] Na notificação de novo pedido agendado, botão deve dizer "Ver pedido agendado" e navegar para /agendados

## Ocultar submenu Agendados quando agendamento desativado
- [x] Ocultar submenu "Agendados" da sidebar quando schedulingEnabled=false no estabelecimento
- [x] Submenu só aparece quando o restaurante ativa o agendamento nas configurações

## Landing Page - Hero Section
- [x] Criar página de Landing Page com rota pública (não autenticada)
- [x] Hero Section com layout duas colunas (60/40) inspirado no GranaFy
- [x] Copy otimizada para conversão: headline, subheadline, CTAs
- [x] Mockups desktop + mobile do dashboard com efeito flutuante
- [x] Mini benefícios abaixo dos CTAs (sem taxa, configuração rápida, suporte)
- [x] Micro-animações: fade-in headline, entrada lateral mockup, hover botões
- [x] Fundo claro com grid sutil
- [x] Responsividade completa (mobile: coluna única, mockup abaixo)
- [x] Navbar da landing com links: Home, Funcionalidades, Preços, FAQ, Login, Criar conta

## Landing Page - Seção 2: O Problema + A Virada
- [x] Bloco Dor: título emocional "Você está pagando para vender o que é seu?"
- [x] Simulação de perdas: slider/calculadora mostrando quanto perde no marketplace
- [x] Bloco Virada: "Com o CardápioAdmin você assume o controle" com lista visual de benefícios
- [x] Layout duas colunas (texto emocional + visual comparativo)
- [x] Cards comparativos: Marketplace (❌) vs CardápioAdmin (✅)
- [x] Micro-animações: entrada suave, contadores animados
- [x] Responsividade completa (mobile: coluna única)

## Landing Page - Seção 3: Clientes que vendem conosco
- [x] Gerar imagens de capa e logos para 6 estabelecimentos fictícios
- [x] Carrossel horizontal com scroll suave e auto-play
- [x] Cards com foto de capa, logo, nome, cidade/estado e botão "Ver cardápio"
- [x] Animação de entrada suave ao scroll
- [x] Responsividade completa (mobile: scroll horizontal touch)

## Landing Page - Seção 4: Cardápio Digital (Tablet Mockup)
- [x] Capturar screenshot do cardápio/catálogo real do sistema
- [x] Moldura de tablet à esquerda com screenshot do cardápio
- [x] Conteúdo à direita: badge, título, descrição, lista de benefícios, CTA
- [x] Animação de entrada suave ao scroll
- [x] Responsividade completa (mobile: coluna única, tablet abaixo)

## Carrossel Automático na Seção Clientes
- [x] Adicionar efeito de marquee/carrossel infinito nos cards de restaurantes

## Renomear CardápioAdmin para Mindi na Landing Page
- [x] Alterar todas as referências de "CardápioAdmin" para "Mindi" na landing page
- [x] Alterar "Cardápio Admin" para "Mindi" na landing page
- [x] Alterar "CardápioAdmin" para "Mindi" na navbar da landing

## Fix: Imagem de Background nas Páginas de Login/Registro
- [x] Resolver carregamento lento da imagem de background nas páginas de login e criação de conta

## Efeito Typewriter na Hero Section
- [x] Adicionar efeito de digitação animado no título principal da Hero Section da landing page

## Landing Page - Seção de Planos
- [x] Adicionar seção de planos na landing page baseada na página /planos existente
- [x] Manter mesmos dados, preços e features dos planos
- [x] Estilo visual consistente com o resto da landing page
- [x] Responsividade completa

## Remover Mockup Mobile da Hero
- [x] Remover o mockup mobile (celular) da Hero Section da landing page

## Landing Page - Seção FAQ
- [x] Accordion com perguntas frequentes (período grátis, cancelamento, taxas, suporte, etc.)
- [x] Animação de abertura/fechamento suave
- [x] Responsividade completa

## Landing Page - Seção CTA Final
- [x] Headline impactante de encerramento
- [x] Botão de conversão destacado
- [x] Background com gradiente ou textura diferenciada

## Landing Page - Footer
- [x] Links úteis organizados em colunas (Produto, Empresa, Suporte)
- [x] Redes sociais (Instagram, WhatsApp, etc.)
- [x] Informações legais e copyright
- [x] Responsividade completa

## Redesign Footer da Landing Page (estilo Menuz)
- [ ] Fundo claro (cinza muito claro) em vez de escuro
- [ ] Logo Mindi + descrição à esquerda com ícones sociais arredondados
- [ ] Colunas de links: Links Úteis, Segmentos, Legal
- [ ] Seção de Contato separada abaixo com email e endereço
- [ ] Barra inferior com nome da empresa, CNPJ e copyright
- [ ] Responsividade completa

## Aumentar Mockup Dashboard na Hero Section
- [x] Aumentar tamanho do container do mockup do dashboard na Hero em 15%
- [x] Reduzir scale do mockup de 1.15 para 1.10 (diminuir 5%)

## Seção Mockup Visual de Pedidos na Landing Page
- [x] Criar seção com mockup estático visual da página de pedidos (sem funcionalidade)
- [x] Layout 2 colunas: 55% mockup esquerda, 45% texto direita
- [x] Mockup com borda arredondada, sombra suave, parte cortada (estilo frame)
- [x] Badge + título + descrição + lista com checks verdes + botão CTA no lado direito
- [x] Responsivo: mockup primeiro, texto abaixo no mobile
- [x] Sem rotas, botões clicáveis, funcionalidade real ou scroll interno

## Substituir Imagem do Mockup de Pedidos na Landing
- [x] Upload da nova screenshot da página de Pedidos para S3
- [x] Substituir URL da imagem no mockup da seção Gestão de Pedidos

## Substituir Screenshot do Dashboard na Hero por Versão com Dados
- [x] Criar página estática do dashboard com dados realistas preenchidos
- [x] Capturar screenshot da página com dados
- [x] Upload para S3 e substituir DASHBOARD_MOCKUP na LandingPage

## Fix Imagem Mockup Pedidos
- [x] Ajustar imagem da screenshot de Pedidos para preencher corretamente o container do browser frame

## Remover container decorativo atrás da imagem de Pedidos
- [x] Remover sombra/gradiente decorativo atrás do mockup de pedidos

## Remover estatísticas da seção Explore Cases Reais
- [x] Remover barra de números (500+, 150k+, 27, 4.9) da seção de clientes

## Substituir Mockup da Seção Cardápio Digital
- [x] Upload da screenshot do cardápio Sushi Haruno para S3
- [x] Criar moldura de celular (phone frame) estilizada
- [x] Substituir imagem na seção Cardápio Digital com phone frame

## Ajuste Espessura da Moldura do Celular
- [x] Igualar espessura da borda de cima com a de baixo na moldura do celular (seção Cardápio Digital)

## Carrossel na Moldura do Celular (Seção Cardápio Digital)
- [x] Upload das 3 novas screenshots para S3
- [x] Implementar carrossel automático dentro da moldura do celular com 4 imagens
- [x] Indicadores de posição (dots) no carrossel
- [x] Transição suave entre imagens

## Segunda Linha de Cases Reais
- [ ] Adicionar segunda linha de cards no carrossel de Explore Cases Reais
- [ ] Efeito de scroll da esquerda para a direita (inverso da primeira linha)
- [ ] Novos restaurantes fictícios para a segunda linha
- [x] Remover pausa ao hover no carrossel de clientes (Explore Cases Reais) - animação deve ser contínua sem interrupções
- [x] Redesenhar seção calculadora de economia (Quanto você perde por mês) - remover fundo escuro, layout mais limpo e claro, alinhado com estilo Mindi
- [x] Remover seção calculadora de economia (Quanto você perde por mês) completamente da landing page
- [x] Remover 'Zero comissão por pedido' e 'Estoque sincronizado automaticamente' da seção A Solução
- [x] Redesenhar seção CTA final (Comece Agora) - remover fundo escuro, design claro alinhado com Mindi
- [x] Redesenhar cards de comparação (Usando Marketplace vs Com Mindi) na seção A Solução - novo modelo mais moderno
- [x] Remover segunda fileira do carrossel de clientes (Explore Cases Reais) - deixar apenas uma linha
- [x] Adicionar efeito fade-in/fade-out suave ao hover nos cards de cases (Explore Cases Reais)
- [x] Adicionar dados mockados na conta do restaurante xkelrix@gmail.com (pedidos, produtos, clientes, faturamento)
- [x] Remover 'Filtros por data, status e entregador' e 'Histórico completo de cada cliente' da seção Gestão de Pedidos
- [x] Adicionar dados mockados no gráfico Acumulado da Semana (todos os dias) e no card Acessos ao Cardápio para Burger House Gourmet
- [x] Redistribuir pedidos em todos os dias da semana (Seg-Dom) e preencher heatmap de Acessos com mais acessos no fim de semana
- [x] Tirar novo screenshot do dashboard com dados mockados em largura maior e substituir na seção Sistema Completo de Gestão
- [x] Remover borda amarela que aparece na foto mockup do dashboard na seção Sistema Completo de Gestão (era do preview mode, novo screenshot tirado sem borda)
- [x] Remover 3 perguntas do FAQ: 'Existe taxa por pedido?', 'Preciso de conhecimento técnico para usar?', 'Como funciona a gestão de entregadores?'
- [x] Duplicar seção Cardápio Digital na landing page - nova seção Programa de Fidelidade com layout invertido (texto à esquerda, celular à direita)
- [x] Bug: Carimbo do cartão fidelidade não é registrado após finalização do pedido (estabelecimento 30001, cliente 88999290000)

## Bug Fix: Programa de Fidelidade - Carimbos não registrados
- [x] Corrigir verificação de duplicação de carimbos: usar orderId em vez de orderNumber (orderNumber se repete entre dias)
- [x] Atualizar lógica em updateOrderStatus para verificar por orderId
- [x] Escrever teste vitest para validar a correção
- [x] Bug: Botão "Ver cupom ganho" não aparece quando cartão fidelidade atinge 12/12 carimbos (cliente 88999290000) - cupons antigos não existiam na tabela coupons, criado novo cupom FID-Y5JXL5
- [x] Adicionar 4 fotos reais do programa de fidelidade no mockup de celular da seção Programa de Fidelidade da landing page
- [x] Remover texto "Relatórios de engajamento" da seção Programa de Fidelidade na landing page
- [x] Remover texto "Funciona em qualquer dispositivo" da seção Cardápio Digital na landing page
- [x] Mover seção "Explore cases reais" para baixo da seção "Planos e Preços" na landing page
- [x] Redesenhar seção FAQ com layout 2 colunas: título/descrição/CTA à esquerda, perguntas accordion à direita
- [x] Ajustar background do footer para continuar com o mesmo degradê da seção "Comece agora" (CTAFinalSection)
- [x] Testar responsividade da seção FAQ e demais seções alteradas em dispositivos móveis
- [x] Criar nova seção "Integração com WhatsApp" na landing page: layout invertido (mockup esquerda, texto direita), conteúdo sobre notificações automáticas de status de pedidos via WhatsApp
- [x] Substituir mockup de chat simulado da seção WhatsApp pelo mesmo estilo de mockup com carrossel de imagens da seção Programa de Fidelidade
- [x] Bug: Notificação WhatsApp "saiu para entrega" não é enviada quando não há entregador cadastrado - deve enviar independente de ter entregador ou não
- [x] Adicionar foto real do WhatsApp no mockup de celular da seção Integração WhatsApp
- [x] Ajustar tamanho do mockup da seção "Gestão de Pedidos" para ficar igual ao da seção "Sistema completo de gestão"
- [x] Tirar screenshot da página de pedidos com menu minimizado e usar como imagem do mockup na seção Gestão de Pedidos

## Dados Mockados para conta admin@admin.com
- [x] Adicionar dados mockados na Dashboard (pedidos, faturamento, gráficos)
- [x] Adicionar pedidos mockados na página de Pedidos (vários status)
- [x] Adicionar pedidos agendados mockados
- [x] Adicionar entregadores mockados
- [x] Adicionar avaliações mockadas
- [x] Adicionar itens de estoque mockados

## Novo Screenshot do Dashboard para Landing Page
- [x] Tirar novo screenshot do dashboard admin@admin.com sem borda do preview e atualizar na seção Sistema Completo de Gestão (v2.mindi.com.br)

## Alternância de Imagens na Seção Sistema Completo de Gestão
- [x] Tirar screenshots das páginas (estoque, pedidos, dashboard, cardápio) sem barra de preview
- [x] Upload dos screenshots para S3
- [x] Implementar alternância de imagem do mockup sincronizada com o efeito de digitação do texto

## Seção Versátil para Diversos Segmentos
- [x] Adicionar seção "Versátil para diversos segmentos" abaixo de "Explore Cases Reais" com identidade visual Mindi

## Fotos Reais WhatsApp no Carrossel
- [x] Adicionar 3 fotos reais do WhatsApp como slides no mockup de celular da seção Integração WhatsApp

## Redesign Seção Segmentos
- [x] Redesenhar seção "Versátil para diversos segmentos" com estilo marquee/carrossel contínuo horizontal compacto (fundo branco, bordas suaves, emojis grandes passando em loop)

## Ajuste Faixa de Segmentos
- [ ] Aproximar faixa de segmentos dos cards de cases acima (reduzir espaçamento)
- [ ] Faixa de segmentos deve ocupar toda a largura disponível (full-width) igual ao carrossel de cases

## Seção Cupons + Campanhas SMS na Landing Page
- [x] Criar seção de Cupons + Campanhas SMS após seção de Integração WhatsApp

## Adicionar Docerias ao Marquee de Segmentos
- [x] Incluir "Docerias" na lista de segmentos do marquee da landing page

## Reaproveitar Seção Gestão de Pedidos para Cupons + SMS
- [x] Tirar screenshots das páginas de Campanhas SMS e Cupons via v2.mindi.com.br
- [x] Reescrever OrdersMockupSection com carrossel de screenshots, typewriter e ícones estilo Cardápio Digital
- [x] Remover MarketingBoostSection separada

## Dividir Seção Bombe suas Vendas em Duas Seções
- [x] Criar seção dedicada para Campanhas SMS com mockup, benefícios e CTA
- [x] Criar seção dedicada para Cupons de Desconto com mockup, benefícios e CTA
- [x] Remover OrdersMockupSection combinada
- [x] Atualizar LandingPage para usar as duas novas seções separadas

## Ajuste Seção Cupons de Desconto
- [x] Remover benefício "Frete grátis" da seção Cupons de Desconto na landing page

## Ajuste Seção Campanhas SMS
- [x] Remover benefício "Resultados mensuráveis" da seção Campanhas SMS na landing page

## Página Finanças (Admin)
- [x] Schema: tabela de despesas (expenses) com data, categoria, descrição, valor, forma de pagamento, observação
- [x] Schema: tabela de categorias de despesa (expense_categories) com categorias padrão
- [x] Schema: tabela de metas mensais de lucro (monthly_goals)
- [x] DB helpers: CRUD de despesas, listar categorias, calcular receita dos pedidos, resumo financeiro
- [x] tRPC procedures: finance router com todas as operações
- [x] Frontend: Header com título + botão "Novo lançamento"
- [x] Frontend: Cards resumo (Receita, Despesas, Lucro líquido, Ticket médio) com filtros de período
- [x] Frontend: Gráfico combinado (barras despesas + linha receita + linha lucro)
- [x] Frontend: Tabela de gastos com editar/excluir
- [x] Frontend: Modal "Registrar gasto" com todos os campos
- [x] Frontend: Sistema de categorias com opção de adicionar nova
- [x] Frontend: Indicador de saúde financeira (termômetro visual)
- [x] Frontend: Meta mensal de lucro
- [x] Frontend: Alerta se despesas > receita
- [x] Navegação: Adicionar "Finanças" no sidebar
- [x] Rota: Registrar /financas no App.tsx
- [x] Testes: vitest para procedures de finanças

## Dados Mockados Finanças (admin@admin.com)
- [x] Identificar establishmentId da conta admin@admin.com
- [x] Garantir categorias de despesa padrão criadas
- [x] Inserir despesas mockadas variadas (últimos 30 dias, múltiplas categorias e formas de pagamento)
- [x] Definir meta mensal de lucro
- [x] Verificar dados na página de Finanças

## Despesas Recorrentes (Extensão do Modal)
- [x] Schema: criar tabela recurring_expenses com todos os campos
- [x] DB helpers: CRUD de recorrências (criar, listar, atualizar, excluir, gerar lançamentos)
- [x] tRPC procedures: recurring router (create, list, update, delete, generatePending)
- [x] Job: geração automática de lançamentos na data programada
- [x] Modal: toggle "Tornar lançamento recorrente" abaixo do campo Valor
- [x] Modal: campos condicionais por frequência (Mensal/Semanal/Anual)
- [x] Modal: animação suave accordion ao expandir/recolher campos
- [x] Lógica: criar lançamento normal + registro recurring ao salvar com toggle ativo
- [x] Lógica: editar recorrência não altera lançamentos já gerados
- [x] Lógica: ao excluir recorrência, perguntar (só futuros / futuros + cancelar)
- [x] Lógica: não permitir duplicidade no mesmo dia
- [x] Testes vitest para procedures de recorrência

## Ajuste Gráfico Evolução Financeira
- [x] Alterar cor das barras de despesas no gráfico para vermelho

## Ajuste Cores Cards KPI Finanças
- [x] Card Despesas: alterar cor para vermelho
- [x] Card Lucro Líquido: alterar cor para azul
- [x] Card Ticket Médio: alterar cor para dourado (igual card itens em falta da Dashboard)

## Card Comparação Mensal (Finanças)
- [x] Backend: criar procedure getMonthlyComparison (receita, despesas, lucro do período atual vs anterior)
- [x] Frontend: card com 3 blocos resumo (Receita, Despesas, Lucro) com valor atual, anterior e variação %
- [x] Frontend: gráfico de barras agrupadas comparando mês atual vs anterior
- [x] Respeitar filtro de período já selecionado na página
- [x] Layout responsivo seguindo padrão visual da dashboard

## Redesign Card Comparação Mensal
- [x] Backend: alterar getMonthlyComparison para retornar últimos 4 meses (Receitas e Despesas por mês)
- [x] Frontend: redesenhar card no mesmo tamanho do Evolução Financeira (lg:col-span-2)
- [x] Frontend: barras agrupadas por mês (Receitas verde, Despesas vermelho), sem blocos de resumo
- [x] Remover os 3 blocos de resumo (Receita, Despesas, Lucro) do card

## Bug: Despesas por Categoria mostrando apenas Fornecedor
- [ ] Investigar e corrigir query getExpensesByCategory para mostrar todas as categorias com despesas

## Ajuste Visual Card Evolução Financeira
- [x] Atualizar card Evolução Financeira para seguir exatamente o visual do card Acumulado da semana da Dashboard

## Ajuste Visual Evolução Financeira (v2)
- [x] Manter ícone header e tags de legenda (dots coloridos)
- [x] Reverter gráfico para recharts ComposedChart (barras + linhas) estilo anterior

## Bug: Espaço em branco abaixo do gráfico Evolução Financeira
- [x] Remover espaço em branco extra abaixo do gráfico no card de Evolução Financeira

## Progresso da Meta no Botão
- [x] Remover seção separada "Meta mensal" com barra de progresso do card Indicadores
- [x] Integrar progresso da meta diretamente no botão "Meta" com preenchimento gradual
- [x] Degradê de cores: vermelho (<10%), laranja (<30%), amarelo (<70%), verde (>=70-100%)

## Ajuste visual KPI
- [x] Encurtar título "Lucro Líquido" para "L. Líquido" no card KPI

## Unificar estilo dos cards na página Finanças
- [x] Aplicar mesmo estilo do card Evolução Financeira no card Indicadores (ícone header, tipografia)
- [x] Aplicar mesmo estilo do card Evolução Financeira no card Comparação Mensal (ícone header, legend dots)
- [x] Aplicar mesmo estilo no card Despesas recorrentes (ícone header roxo)
- [x] Aplicar mesmo estilo no card Gastos registrados (ícone header vermelho)

## Card Faturamento por canal
- [x] Analisar schema de pedidos para identificar campo de canal (PDV, Menu público, Mesas)
- [x] Criar endpoint tRPC para faturamento por canal com filtro de período
- [x] Criar card UI com donut chart + lista detalhada (mesmo padrão visual dos outros cards)
- [x] Respeitar filtro global da página (Hoje / 7 dias / Este mês)
- [x] Estado vazio: "Sem faturamento registrado neste período"
- [x] Escrever testes vitest para o endpoint

## Redesign card Faturamento por canal
- [x] Remover donut chart do card
- [x] Mover card para dentro do grid, mesma coluna do Indicadores (abaixo dele)
- [x] Manter apenas lista de canais com barras de progresso

## Fix barras de progresso Faturamento por canal
- [x] Igualar estilo das barras de progresso do card Faturamento por canal ao card Indicadores

## Redesign Faturamento por canal - estilo meia lua
- [x] Implementar gráfico semi-circle (meia lua) com segmentos por canal
- [x] Lista abaixo com barra vertical colorida + nome + valor + percentual

## Dados mockados para admin@admin.com
- [ ] Identificar estabelecimento e IDs da conta admin
- [ ] Inserir pedidos mockados (PDV, Menu público, Mesas) com datas variadas
- [ ] Inserir despesas mockadas com categorias variadas
- [ ] Verificar dados na página de Finanças

## Redesign Faturamento por canal - Barras verticais
- [x] Substituir meia lua por mini barras verticais arredondadas com gradiente sutil
- [x] 3 barras (PDV, Menu público, Mesas) com alturas proporcionais ao faturamento

## Redesign Faturamento por canal - Barras horizontais
- [ ] Substituir barras verticais por 3 barras horizontais empilhadas (uma por canal)
- [ ] Estilo igual à barra de Saúde Financeira do card Indicadores

## Tooltip interativo nas barras de Faturamento por canal
- [x] Adicionar dados de período anterior no endpoint revenueByChannel (variação %)
- [x] Implementar tooltip ao hover nas barras com valor exato, pedidos e variação

## Fix tamanho mockups landing page
- [x] Igualar tamanho dos mockups das seções Campanhas SMS e Cupons de Desconto ao mockup da seção Sistema completo de gestão

## Card Formas de Pagamento
- [x] Analisar schema de pedidos para campo de forma de pagamento
- [x] Criar endpoint tRPC para faturamento por forma de pagamento com filtro de período
- [x] Criar componente Activity Rings (anéis concêntricos estilo Apple Watch)
- [x] Criar card UI com Activity Rings + lista detalhada (Pix, Cartão, Dinheiro)
- [x] Respeitar filtro global da página (Hoje / 7 dias / Este mês)
- [x] Estado vazio: "Nenhuma venda registrada neste período"
- [x] Escrever testes vitest para o endpoint

## Redesign Formas de Pagamento - Mini Area Charts
- [ ] Criar endpoint backend para breakdown diário por método de pagamento
- [ ] Substituir Activity Rings por 3 mini area charts (sparklines) lado a lado
- [ ] Cada sparkline mostra evolução diária do método (Pix, Cartão, Dinheiro)
- [ ] Manter valor total e percentual em cada mini card
- [ ] Verificar visual e rodar testes

## Restyle Formas de Pagamento
- [x] Substituir sparklines por barras horizontais com tooltip (mesmo estilo do Faturamento por canal)

## Mover Comparação Mensal para coluna esquerda
- [x] Mover card Comparação Mensal para dentro do grid, abaixo de Evolução Financeira (coluna esquerda)

## Fix altura das colunas no grid de Finanças
- [x] Fazer as duas colunas do grid terem a mesma altura (esticar cards da esquerda para alinhar com Formas de Pagamento)

## Fix SQL error paymentMethodDaily
- [x] Corrigir erro CONVERT_TZ na query getPaymentMethodDailyBreakdown (TiDB não suporta timezone strings)

## Fix espaçamento cards Faturamento e Formas de Pagamento
- [x] Igualar padding/espaçamento dos cards Faturamento por canal e Formas de Pagamento ao card Indicadores

## Distribuir altura igualmente entre Evolução Financeira e Comparação Mensal
- [x] Fazer os cards Evolução Financeira e Comparação Mensal dividirem o espaço igualmente na coluna esquerda (ambos com flex-1) em vez de Comparação Mensal crescer desproporcionalmente

## Fix alinhamento grid Finanças entre períodos
- [x] Corrigir grid para que Comparação Mensal e Formas de Pagamento se alinhem na parte inferior independentemente do período selecionado (evitar esticamento excessivo quando coluna direita tem menos conteúdo)

## Padronizar lista de Avaliações com lista de Entregadores
- [ ] Atualizar o visual da lista de avaliações para seguir o mesmo padrão visual da lista de entregadores (manter consistência entre páginas)

## Padronizar lista de Estoque
- [x] Padronizar a lista da página de Estoque para seguir o mesmo modelo visual das páginas de Entregadores e Avaliações (wrapper bg-card rounded-xl, tabela nativa HTML, DropdownMenu, layout mobile responsivo, TableSkeleton, EmptyState)

## Reestruturar grid Evolução Financeira + Comparação Mensal
- [x] Usar flex-col com flex-1 para que ambos os cards dividam a altura igualmente (empilhados verticalmente)
- [x] Remover alturas fixas e usar flex-grow (flex-1 min-h-[250px]) no gráfico
- [x] Garantir align-items: stretch via grid outer container
- [x] Cards usam flex flex-col flex-1
- [x] Sem hacks de margin, solução puramente estrutural com flex

## Fix esticamento desproporcional dos cards ao trocar período
- [x] Remover flex-1 dos cards Evolução Financeira e Comparação Mensal para que não estiquem além do conteúdo natural
- [x] Usar h-[300px] fixo nos containers de gráfico para garantir tamanho consistente sem esticamento
- [x] Garantir que ao trocar de "Este mês" para "7 dias" ou "Hoje", os cards não mantenham a altura expandida (items-start no grid)

## Fix definitivo: cards esquerda devem preencher altura da coluna direita
- [x] Remover items-start do grid (voltar ao stretch padrão) para colunas terem mesma altura
- [x] Restaurar flex-1 nos cards para dividir igualmente a altura da coluna esquerda
- [x] Usar min-h-[300px] (não h fixo) nos gráficos para garantir tamanho mínimo mas permitir crescimento
- [x] Testar em todos os períodos: cards devem sempre preencher sem espaço vazio

## Fix definitivo v2: cards com tamanho fixo e consistente
- [x] Remover flex-1 dos cards de gráfico (Evolução Financeira e Comparação Mensal)
- [x] Usar h-[300px] fixo nos containers de gráfico
- [x] Usar items-start no grid para que colunas não estiquem
- [x] Cards devem ter sempre o mesmo tamanho independente do período selecionado

## Fix final: grid stretch + flex-1 nos cards + flex-1 nos gráficos
- [x] Grid sem items-start (stretch padrão) para colunas terem mesma altura
- [x] flex-1 em ambos os cards (Evolução Financeira e Comparação Mensal) para dividir altura igualmente
- [x] flex-1 min-h-[250px] nos containers de gráfico para crescerem com o card
- [x] Testado: Este mês → 7 dias → Hoje - cards se ajustam corretamente em todas as transições

## Reestruturar grid Finanças - align-items:start + height:auto
- [x] Grid principal: align-items: start (não stretch)
- [x] Remover flex-1 dos cards Evolução Financeira e Comparação Mensal
- [x] Remover min-height dos containers de gráfico (usando h-[300px] fixo)
- [x] Cards com height: auto, crescendo apenas com conteúdo
- [x] Cada coluna: flex flex-col gap-6, ajustando-se ao conteúdo
- [x] Testar em todos os períodos: Hoje, 7 dias, Este mês

## Reestruturar grid Finanças - Remover wrappers de coluna
- [ ] Remover div wrapper "coluna esquerda" e "coluna direita"
- [ ] Colocar todos os 5 cards (Evolução, Indicadores, Comparação, Faturamento, Formas) diretamente no grid
- [ ] Grid: display:grid, grid-template-columns: repeat(2, minmax(0, 1fr)), gap:24px, align-items:start
- [ ] Sem flex-1, sem height fixa, sem min-height forçado
- [ ] Cada card independente, grid decide organização por linha
- [ ] Testar em todos os períodos: Hoje, 7 dias, Este mês

## Reestruturar grid Finanças - estrutura definitiva com 2 colunas fixas
- [x] Grid principal: grid-template-columns: 1.5fr 1fr, gap: 24px, align-items: start
- [x] Coluna esquerda (wrapper): flex flex-col gap-6 com Evolução Financeira + Comparação Mensal
- [x] Coluna direita (wrapper): flex flex-col gap-6 com Indicadores + Faturamento por canal + Formas de Pagamento
- [x] Sem flex-1 nos cards
- [x] Sem height fixa nos cards
- [x] Cada coluna cresce independente da outra

## Fix: Cards esquerda devem acompanhar altura da coluna direita dinamicamente
- [x] Grid com stretch (não start) para colunas terem mesma altura
- [x] flex-1 nos cards Evolução Financeira e Comparação Mensal para dividir espaço igualmente
- [x] flex-1 nos containers de gráfico para crescerem com o card
- [x] Ao trocar período (Hoje/7 dias/Este mês), cards da esquerda se adaptam à nova altura da direita
- [x] Testar: Este mês (direita alta) → 7 dias (direita baixa) → Hoje - altura se adapta em tempo real

## Bug: ResponsiveContainer não recalcula altura ao trocar período
- [x] Diagnosticar: Recharts ResponsiveContainer mantém altura anterior quando grid encolhe
- [x] Forçar remount dos gráficos ao trocar período (key baseada no período)
- [x] Testar: Este mês → 7 dias → Hoje - cards devem encolher ao voltar para período menor

## Seletor de abas na seção Gastos registrados (Gastos / Receitas / Recorrentes)
- [x] Adicionar botões de aba estilo período (Gastos / Receitas / Recorrentes) na seção Gastos registrados
- [x] Filtrar tabela por tipo: Gastos mostra despesas, Receitas mostra receita diária consolidada dos pedidos, Recorrentes mostra lançamentos recorrentes
- [x] Backend: criar endpoint para listar receitas diárias (faturamento por dia dos pedidos finalizados)
- [x] Atualizar título e contagem conforme aba selecionada
- [x] Manter mesmo estilo visual dos botões de seleção de período

## Card "Lançamentos futuros" - Timeline horizontal de despesas recorrentes
- [x] Backend: criar endpoint para gerar próximas ocorrências de lançamentos recorrentes
- [x] Calcular próximas datas de vencimento baseado na frequência (semanal/mensal/anual)
- [x] Ordenar por data mais próxima, mostrar pelo menos 6 lançamentos
- [x] Somar valor comprometido no mês selecionado
- [x] UI: Card com título "Lançamentos futuros" e subtítulo dinâmico com total do mês
- [x] UI: Mini cards horizontais com ícone, nome, valor e data de vencimento
- [x] UI: Setas entre cada mini card indicando sequência
- [x] UI: Scroll horizontal suave com scrollbar discreta
- [x] Badges de urgência: "Próximo" (< 3 dias), "Hoje", "Atrasado" (já passou)
- [x] Estado vazio: "Nenhum lançamento recorrente programado."
- [x] Testes para o novo endpoint

## Ajustes de layout na seção Finanças
- [x] Adicionar espaçamento entre card "Lançamentos futuros" e card "Gastos registrados"
- [x] Mover abas (Gastos / Receitas / Recorrentes) para fora do card, acima dele

## Alinhamento do header Gastos registrados
- [x] Alinhar header "Gastos registrados" com header "Lançamentos futuros" (mesmo padding horizontal)

## Visual dos mini cards Lançamentos futuros
- [x] Substituir emojis por ícones Lucide (Users, Home, Zap, Droplets, Globe, etc.)
- [x] Usar fundo colorido no padrão do sistema (bg com cor da categoria + baixa opacidade)
- [x] Trocar bg-muted/50 por bg-card para consistência visual
- [x] Adicionar hover effect (shadow-md + translate-y) igual aos StatCards

## Mini cards Lançamentos futuros - Borda lateral colorida
- [x] Remover ícones Lucide dos mini cards
- [x] Adicionar borda colorida na lateral esquerda (vermelha para despesas, verde para receitas)
- [x] Ajustar layout sem ícone (texto direto)

## Lista de Recorrentes - Formato tabela igual Gastos
- [x] Alterar aba Recorrentes para usar formato de tabela (DATA, CATEGORIA, DESCRIÇÃO, VALOR, PAGAMENTO, AÇÕES)
- [x] Manter mesma estrutura visual da aba Gastos (header, linhas, cores, espaçamentos)
- [x] Adaptar dados recorrentes para colunas (frequência como info adicional)

## StatCards - Mover indicador % para ao lado do título
- [x] Mover indicador de porcentagem (↓100%, ↑100%) para ao lado do título (ex: "RECEITA HOJE ↓100%")
- [x] Remover indicador de % de ao lado do valor

## Fix: Reverter StatCard da Dashboard
- [x] Reverter StatCard compartilhado ao formato original (% ao lado do valor)
- [x] Aplicar indicador % ao lado do título apenas nos StatCards da página de Finanças

## Mobile: Botão Período de Avaliação
- [x] Ocultar texto "X dias" no mobile, mostrar apenas ícone de relógio

## Trial: Urgência visual nos últimos 3 dias
- [x] Mudar cor do ícone para vermelho quando faltar 3 dias ou menos
- [x] Adicionar animação pulse no ícone quando faltar 3 dias ou menos

## Menu: Trocar ícone de Finanças
- [x] Substituir ícone Wallet por BadgeDollarSign para Finanças

## Header Finanças: Trocar ícone
- [x] Substituir ícone do header da página de Finanças para BadgeDollarSign

## Header Finanças: Cor do ícone
- [x] Trocar cor do ícone de emerald para azul

## Entregadores: Badge Pago e integração Finanças
- [x] Mostrar badge "Pago" com visual adequado quando entrega já foi paga (similar ao Pagar mas com status concluído)
- [x] Registrar pagamento de taxa de entrega como gasto na lista de gastos registrados em Finanças

## Landing: Aumentar mockups em 5%
- [x] Aumentar tamanho dos mockups em 5% nas seções: Sistema completo de gestão, Campanhas SMS, Cupons de Desconto

## Landing: Efeito zoom ao hover nos mockups
- [x] Adicionar efeito de zoom ao hover nos mockups das seções: Sistema completo de gestão, Campanhas SMS, Cupons de Desconto

## Landing: Texto do botão hero
- [x] Alterar texto do botão principal de "Criar conta grátis" para "Teste agora!"

## Landing: Texto CTA seção Sistema completo
- [x] Alterar texto do CTA de "Começar agora — é grátis" para "Teste grátis por 15 dias"

## Landing: Texto CTA menu mobile
- [x] Alterar texto do botão menu mobile de "Criar conta grátis" para "Teste 15 dias grátis"

## Finanças: Paginação igual Avaliações
- [x] Analisar modelo de paginação da página de Avaliações
- [x] Aplicar mesmo modelo de paginação nas listas de Gastos e Receitas (Recorrentes não tem paginação server-side)

## Finanças: Editar despesas recorrentes
- [x] Adicionar botão de editar na coluna AÇÕES da aba Recorrentes
- [x] Criar modal/dialog de edição de despesa recorrente (valor, descrição, categoria, frequência, pagamento)
- [x] Criar mutation backend para atualizar despesa recorrente (já existia)

## Lançamentos futuros: Incluir despesas avulsas com data futura
- [x] Analisar como o card de Lançamentos futuros busca dados atualmente
- [x] Ajustar para incluir despesas avulsas registradas com data futura no card
- [x] Total comprometido já inclui tanto recorrentes quanto avulsas futuras (calculado no frontend)

## Histórico de alterações em despesas recorrentes
- [x] Criar tabela recurringExpenseHistory no schema (campo alterado, valor anterior, valor novo, data)
- [x] Rodar migration (pnpm db:push)
- [x] Criar funções no db.ts para inserir e listar histórico
- [x] Integrar registro de histórico na mutation updateRecurring
- [x] Criar procedure para listar histórico de uma despesa recorrente
- [x] Criar UI para visualizar histórico (modal com botão History)
- [x] Múltiplas metas financeiras no card de Indicadores
- [x] Tabela financialGoals no schema para metas personalizadas
- [x] Funções CRUD no db.ts (create, list, update, delete)
- [x] Procedures tRPC (listGoals, createGoalCustom, updateGoalCustom, deleteGoalCustom)
- [x] UI: lista de metas customizadas com barra de progresso abaixo da meta principal
- [x] UI: botão "+ Nova meta" com borda tracejada para criar novas metas
- [x] UI: modal de criação/edição de meta (nome + valor alvo)
- [x] UI: botão de excluir meta ao passar o mouse
- [x] Testes vitest para CRUD de metas financeiras (6 testes passando)
- [x] Corrigir badges cortados no card Lançamentos Futuros (adicionar pt-3 ao container)
- [x] Alterar cor do badge "Hoje" de laranja para verde (bg-emerald-500)
- [x] Ajustar largura dos mini cards de Lançamentos Futuros de 150px para 165px
- [x] Clique nos cards de lançamento futuro abre edição da despesa recorrente correspondente
- [x] Tooltip nos cards truncados de Lançamentos Futuros (exibir nome completo ao hover)
- [x] Botões Nova meta e Gerenciar categorias lado a lado no card de Indicadores
- [x] Barra de rolagem horizontal do card Lançamentos Futuros só aparece ao hover
- [x] Marcar lançamento futuro (recorrente ou avulso) como pago diretamente do card
- [x] Indicador visual de "já pago" nos cards de Lançamentos Futuros (fundo verde claro ou badge Pago)
- [x] Desfazer pagamento via botão no toast de sucesso
- [x] Diálogo de confirmação antes de marcar como pago (com opção de ajustar valor/data)
- [x] Ocultar cards pagos do carrossel de Lançamentos Futuros (não exibir após marcar como pago)
- [x] Alterar cor do badge "Hoje" para amarelo (mesma cor do ícone do card)
- [x] Cards pagos devem permanecer visíveis com badge Pago no dia, e só ocultar após meia-noite (próximo dia)
- [x] Permitir editar lançamentos avulsos ao clicar nos cards de Lançamentos Futuros
- [x] Badge Pago não aparece em lançamentos avulsos marcados como pagos no carrossel
- [x] Gráfico de Comparação Mensal deve exibir últimos 6 meses em vez de 4
- [x] Remover fundo escuro do hover no gráfico de Comparação Mensal (manter apenas tooltip)
- [x] Card de Indicadores: mostrar mensagem neutra (ex: "Sem movimentação") em vez de "Prejuízo" quando não há registros no período
- [x] Restaurar fundo do hover no gráfico Comparação Mensal com 60% de transparência
- [x] Modernizar estilo do gráfico interno no card de Evolução Financeira
- [x] Uniformizar cor verde nos gráficos (Comparação Mensal + Evolução Financeira) com o verde da barra Menu Público
- [x] Uniformizar cor vermelha nos gráficos (Comparação Mensal + Evolução Financeira) com o vermelho da borda dos cards Lançamentos Futuros
- [x] Aplicar gradiente (degradê de baixo para cima) nas barras do gráfico de Comparação Mensal igual ao de Evolução Financeira
- [x] Substituir window.confirm por modal do sistema ao excluir gastos registrados
- [x] Alterar rótulo 'Lucro máximo' para 'Excelente' na barra de saúde financeira do card Indicadores
- [x] Adicionar indicador 'Boa' no meio da barra de saúde financeira
- [x] Adicionar cores distintas aos rótulos da barra de saúde financeira (Prejuízo=vermelho, Boa=âmbar, Excelente=verde)
- [x] Animação suave de preenchimento na barra de saúde financeira ao carregar o card de Indicadores
- [x] Schema DB: tabela cashback_config (percentual, modo aplicação, uso parcial, categorias)
- [x] Schema DB: tabela cashback_transactions (tipo geração/uso, pedido_id, valor, saldo)
- [x] Schema DB: campo reward_program_type no estabelecimento (fidelidade ou cashback)
- [x] Schema DB: campos valor_cashback_utilizado e valor_original nos pedidos (usando cashbackTransactions)
- [x] Backend: routers de configuração cashback (get/update config)
- [x] Backend: routers de saldo e movimentações cashback (consulta saldo, histórico)
- [x] Backend: validação de saldo no backend ao aplicar cashback no pedido
- [x] Backend: geração automática de cashback ao concluir pedido
- [x] Admin: seção Programa de Recompensas com radio button exclusivo (Fidelidade/Cashback)
- [x] Admin: configuração do cashback (percentual, categorias, uso parcial)
- [x] Menu Público: badge de cashback nos produtos (+X% de cashback)
- [x] Menu Público: Minha Carteira (saldo, histórico acumulado, histórico utilizado)
- [x] Menu Público: lógica de login para visualizar saldo cashback
- [x] Modal Pagamento: opção usar cashback com cálculo em tempo real
- [x] Modal Pagamento: regras de aplicação (parcial, total, excedente)
- [x] Testes vitest para cashback
- [x] Reduzir tamanho do container de cashback no modal de entrega/pagamento
- [x] Mover cashback do modal de entrega para bottom sheet separado acionado por ícone de carteira ao lado do botão Próximo
- [x] Corrigir texto unicode quebrado 'Saldo disponível' no bottom sheet de cashback
- [x] Trocar cores azuis do cashback para vermelho (mesma cor do modal de entrega)
- [x] Alterar cabeçalho do bottom sheet de cashback para mesmo padrão do 'Meus Pedidos' (fundo vermelho, texto branco)
- [x] Adicionar variáveis cashbackEarned e cashbackTotal ao template de mensagem de pedido finalizado
- [x] Lógica de envio: só incluir bloco de cashback se cashback ativo e valor > 0
- [x] Garantir saldo atualizado antes do envio da mensagem (transação no banco)
- [x] Formatar valores com 2 casas decimais e vírgula como separador (padrão BR)
- [x] Testes vitest para notificação de cashback
- [x] Alterar modal de cashback: dialog centralizado no desktop, bottom sheet apenas no mobile
- [x] Adicionar variáveis {{cashbackEarned}} e {{cashbackTotal}} ao editor de templates WhatsApp
- [x] Corrigir preview das variáveis cashback no template: exibir 'Cashback ganho: R$X,XX' e 'Cashback acumulado: R$X,XX'
- [x] Corrigir substituição das variáveis cashback no backend: incluir rótulos 'Cashback ganho:' e 'Cashback acumulado:' na mensagem WhatsApp
- [x] Remover opção de uso parcial do cashback: manter apenas uso total do saldo (config admin, backend, frontend)
- [x] Corrigir espaço em branco na mensagem WhatsApp de pedido finalizado quando cashback está desativado
- [x] Bug: menu público mostra quantidade de complementos como máximo do grupo em vez do maxQuantity configurado no admin
- [x] Bug: dessincronização do maxQuantity entre página de Complementos (fonte da verdade) e edição individual do produto
- [x] Bug: dados existentes dessincronizados - página de Complementos mostra 50 mas produtos individuais continuam com 18
- [x] Bug: preços de complementos multiplicados por 100 na edição do produto (ex: R$3,00 aparece como R$300,00) e no menu público
- [x] Filtro interativo nos cards de status do estoque (OK, Baixo, Crítico, Em Falta) com toggle e sincronização com select
- [x] Criar nova variável de template WhatsApp para exibir apenas Total + Forma de pagamento
- [x] Adicionar barra lateral vermelha nos submenus do menu 'Menu' igual ao WhatsApp
- [x] Bug: template configurado de 'Novo Pedido' não está sendo usado na notificação WhatsApp - sistema envia template padrão com itens (não era bug: print antigo do cliente)
- [x] Bug: borda colorida nos submenus do Menu está do lado esquerdo em vez do direito
- [x] Bug: borda não aparece no menu Pedidos quando selecionado
- [x] Bug: scroll da sidebar volta ao topo ao clicar num menu
- [x] Exibir "Troco a devolver" no card Entrega e Pagamento do modal de detalhes do pedido
- [x] Exibir "Troco a devolver" nos recibos de impressão abaixo da observação do troco
- [x] Corrigir IDs de estabelecimento para usar sequência baixa (começando em 2) em vez de IDs altos
- [x] Migrar cardápio completo do Grupo Roxedo (menu.mindi.com.br) para estabelecimento 210002
- [x] Extrair todas as categorias, produtos, preços, descrições e fotos
- [x] Extrair todos os grupos de complementos com quantidades mínimas/máximas
- [x] Extrair todos os itens de complemento com preços e fotos
- [x] Inserir dados no banco de dados do estabelecimento 210002
- [x] Gerar imagens profissionais com IA para os produtos do estabelecimento 210002 e associar no banco
- [x] Gerar imagens profissionais melhoradas baseadas nas fotos originais para os produtos do estabelecimento 210002
- [x] Bug: notificação WhatsApp "saiu para entrega" ao cliente não é enviada quando driverNotifyTiming=on_accepted (early return no markReadyAndAssign)
- [x] Remover template padrão fixo de out_for_delivery e usar apenas o template "Pronto (Delivery)" quando o pedido sai para entrega (on_accepted)
- [x] Adicionar badges vermelhos "Novo" nos menus: PDV, Mapa de Mesas, Entregadores, Avaliações, Estoque, Finanças, Cupons, Campanhas
- [x] Adicionar badge "Novo" no menu Dashboard
- [x] Diferenciar visualmente os títulos das seções (OPERAÇÕES, GESTÃO, FINANCEIRO, MARKETING, SISTEMA) dos itens do menu com cor diferente
- [x] Substituir card "Itens em falta" por "Clientes Recorrentes" no Dashboard
- [x] Backend: procedure para calcular clientes recorrentes (2+ pedidos nos últimos 30 dias por telefone, PDV + menu público)
- [x] Frontend: card com total, percentual sobre base ativa, indicador comparativo com mês anterior
- [x] Fix: bordas do banner no menu público com cantos transparentes em vez de corte real (overflow hidden)
- [x] Fix: bordas do balão de nota no menu público ainda com cantos quadrados/transparentes - aplicar isolamento de camada de renderização
- [x] Investigar e corrigir endpoint SSE /api/sse?establishmentId={id} para conexão do app da impressora
- [x] Criar endpoint SSE /api/printer/stream com autenticação por API key (sem OAuth) para app da impressora
- [x] Adicionar campo printerApiKey na tabela printerSettings para armazenar chave de API por estabelecimento
- [x] Criar UI no painel admin (aba API nas configurações de impressora) para gerar/gerenciar API keys
- [x] Escrever testes para o endpoint da impressora
- [x] Criar endpoint /api/print/receipt/{orderId}?key={apiKey} com autenticação por API key para app da impressora buscar HTML do recibo
- [x] Implementar funcionalidade de aceitar pedidos automaticamente (toggle nas configurações do estabelecimento)
- [x] Adicionar campo autoAcceptOrders no schema do estabelecimento
- [x] Atualizar lógica de criação de pedidos para auto-aceitar quando ativado
- [x] Adicionar toggle na UI de configurações
- [x] Escrever testes para a funcionalidade
- [x] Bug: Drag and drop na página /complementos não persiste a nova posição - complemento volta ao lugar original ao soltar
- [ ] Bug: Ativar htmlPrintEnabled nas configurações de impressora não muda o formato do recibo - app continua recebendo texto puro
- [x] Feature: Adicionar suporte a tecla Enter nos campos de nome/preço do complemento no modal "Escolha seus adicionais" para acionar "Adicionar ao grupo"
- [x] Feature: Após adicionar complemento ao grupo (Enter ou clique), focar automaticamente no campo "Nome do complemento"
- [x] Feature: Adicionar Enter + auto-focus no modal de grupo de complementos da página /complementos (etapa Configurar grupo)
- [x] Bug: "Copiar grupo existente" mostra produtos em vez de grupos de complementos, e na conta 150004 não mostra nada
- [x] Fix: Texto no modal "Copiar grupo" deve mostrar "X complemento(s)" em vez de "X item(ns)"
- [x] Feature: Adicionar Enter + auto-focus no campo de nome do complemento no AddGroupSheet (etapa group-items / "Adicione os complementos")
- [x] Feature: Adicionar Enter + auto-focus no campo de nome do complemento no CreateProductSheet (etapa group-items) - já estava implementado
- [x] Feature: Adicionar Enter no campo de preço do complemento no AddGroupSheet e CreateProductSheet para adicionar o complemento e focar no campo de nome
- [x] Feature: Enter no campo nome do complemento pula para preço; Enter no campo preço adiciona e volta para nome (AddGroupSheet e CreateProductSheet)
- [x] Feature: Adicionar ícone (i) de informação com tooltip explicando atalho Enter (nome→preço→adicionar) no AddGroupSheet e CreateProductSheet
- [x] Bug: Complementos com mesmo nome compartilham preço entre grupos diferentes - cada complemento deve ser instância independente por grupo
- [x] Validação: Página /complementos (gestão global) - altera templates ou instâncias vinculadas?
- [x] Validação: Pedidos antigos preservam preço do momento da compra?
- [x] Validação: Exclusão de complemento de um grupo não impacta outros grupos
- [x] Validação: Risco de duplicação descontrolada de complementos
- [x] Remover card "Complementos / Adicionais" da página de edição do produto (ProductForm) - gestão de complementos apenas via /complementos ou inline no catálogo
- [x] Feature: Aviso de impacto na gestão global (/complementos) - exibir "Esta ação afetará X produtos" antes de confirmar edição/exclusão
- [ ] Feature: Badge "Personalizado" no catálogo quando complemento tem preço diferente do template global (/complementos)

## Badge "Personalizado" no Catálogo
- [x] Criar query getGlobalTemplatePrices no backend (calcula preço moda por grupo+item)
- [x] Criar procedure tRPC complement.getGlobalTemplatePrices
- [x] Adicionar prop globalTemplatePrice ao SortableInlineItem
- [x] Implementar badge "Personalizado" com cor âmbar e ícone de lápis
- [x] Adicionar tooltip com preço template ao hover no badge
- [x] Escrever testes unitários (23 testes passando)
- [x] Ajustar estilo do badge "Personalizado" para seguir o mesmo modelo visual do badge "GRÁTIS"
- [x] Mover badge "Personalizado" para envolver a caixa de preço (atrás do campo de preço com ícones)

## Itens Exclusivos por Produto (Complementos)
- [x] Adicionar coluna exclusiveProductId (nullable) na tabela complementItems
- [x] Criar procedures backend para gerenciar itens exclusivos (CRUD)
- [x] Atualizar página /complementos com badge "Exclusivo" (visualização)
- [x] Atualizar página /catalogo para mostrar badge "Exclusivo" nos itens exclusivos
- [x] Mover botão "Adicionar item exclusivo" da /complementos para /catalogo (InlineComplementsDropdown)
- [x] Remover botão "Adicionar item exclusivo" da /complementos
- [x] Escrever testes unitários (30 testes passando)
- [x] Adicionar tooltip no badge "Exclusivo" informando que o item só aparece neste produto
- [x] Adicionar tooltip no botão "Adicionar exclusivo" no catálogo informando que o item só aparecerá neste produto
- [x] Corrigir drag-and-drop no catálogo: item volta para posição original antes de ir para a nova posição (falta update otimístico)
- [x] Corrigir cursor do campo de preço: ao clicar no campo, cursor deve ir para o final do valor
- [x] Corrigir campo de preço: ao digitar sobre 0,00, deve substituir o valor em vez de concatenar (ex: 0,00300)
- [x] Baixar fotos dos produtos do Mindi e fazer upload para S3, atualizar registros no banco de dados (estabelecimento 150004)
- [x] Remover badge "Novo" do menu lateral (sidebar)
- [x] Corrigir caracteres Unicode escapados nas abas Impressora e API da página de Configurações
- [x] Corrigir card de Pedidos em Configurações > Atendimento: estado ativo/desativado não atualiza visualmente após salvar (precisa recarregar a página)
- [x] Corrigir horário na impressão de recibos: horário não corresponde ao horário exato do pedido (problema de fuso horário)

## Redesign página de detalhes do restaurante (/admin)
- [x] Header: nome + badge status + slug + botões "Ver Cardápio" e "Acessar Painel" (impersonação)
- [x] 4 Cards informativos: Mensalidade, Data de Início, Admins, Loja (Ativa/Aberta)
- [x] Tab Cobrança: gerenciar status manualmente (Período de Teste, Ativo, Suspenso, Cancelado)
- [x] Tab Contato: nome do proprietário, telefone/WhatsApp, e-mail de contato
- [x] Tab Histórico: histórico de pagamentos
- [x] Tab Administradores: listar/criar admins do restaurante
- [x] Tab Comunicações: placeholder para futuras comunicações
- [x] Funcionalidade de impersonação: acessar painel do restaurante sem email/senha
- [x] Manter ações administrativas existentes (bloquear, reabrir menu, resetar trial, etc.)

## Correção visual da página /admin detalhes do restaurante
- [x] Igualar cor de fundo do /admin com a dashboard do restaurante
- [x] Remover sombras dos cards do /admin (igualar ao estilo da dashboard)
- [x] Igualar estilo das tabs do /admin com as tabs da dashboard
- [x] Igualar tipografia e espaçamentos do /admin com a dashboard

## Aplicar estilo visual consistente no /admin Dashboard e Relatórios
- [x] Aplicar estilo visual da página de detalhes na Dashboard do /admin (cards, tipografia, espaçamentos)
- [x] Aplicar estilo visual da página de detalhes na página de Relatórios do /admin
- [x] Aplicar estilo visual da lista de estoque na página /admin/restaurantes
- [x] Aplicar estilo visual consistente na página /admin Trials
- [x] Corrigir login do /admin: toast mostra "Login realizado" mas navegação não acontece no primeiro clique
- [x] Corrigir login do /admin: toast mostra "Login realizado" mas navegação não acontece no primeiro clique
- [x] Adicionar ícones no header das páginas Dashboard, Planos e Relatórios do /admin (igual à página de Restaurantes)
- [x] Igualar filtro de período da Dashboard do /admin ao estilo da Dashboard do restaurante
- [x] Corrigir emails não aparecendo para alguns restaurantes na lista do /admin (Big Norte, Lanche PS, Açaí Roxedo)
- [x] Corrigir altura dos cards na página /admin/relatorios (igualar à altura dos cards da dashboard)
- [x] Sincronizar campo email dos 3 restaurantes (Big Norte, Lanche PS, Açaí Roxedo) copiando email do users para establishments
- [x] Adicionar ícone de info (i) com tooltip nos 4 KPI cards da página /admin/relatorios
- [x] Ajustar headers dos cards Distribuição por Status, Detalhes por Plano, Receita Anual Projetada, Ticket Médio, Churn Rate no /admin/relatorios para seguir o estilo do card Acessos ao Cardápio (ícone + descrição abaixo)
- [x] Ajustar barras coloridas do card Detalhes por Plano no /admin/relatorios para seguir o estilo do card Faturamento por canal da página de Finanças
- [x] Remover textos de subtítulo dos 4 KPI cards no /admin/relatorios (info já está nos tooltips)
- [x] Criar conta demo para Imperial Casa de Carnes (imperial@demo.com / 12345678)
- [x] Configurar estabelecimento com foto de capa, perfil, endereço, horários, redes sociais
- [x] Criar categoria Semanal com 3 itens do cardápio original
- [x] Criar categoria Kit Semanal Personalizado com 6 itens
- [x] Criar categoria Carvão com 3 itens
- [x] Criar categoria Carne de Primeira com 6 itens
- [x] Criar categoria Carne de Segunda com 6 itens
- [x] Criar categoria Preço Único com 6 itens
- [x] Criar categoria Linguiças com 6 itens
- [x] Todos os itens devem ter foto, preço e descrição do cardápio original
- [x] Regenerar todas as 36 fotos dos produtos do Imperial Casa de Carnes com IA
- [x] Estilo profissional de churrasco: carne sobre tábua de madeira, fundo rústico
- [x] Upload das imagens geradas para S3 e atualizar registros no banco
- [x] Reformular logo do Imperial Casa de Carnes com estilo mais profissional (manter elementos originais)
- [x] Reformular foto de capa do Imperial Casa de Carnes com estilo mais profissional de açougue/churrasco
- [x] Diagnóstico do pipeline de imagens: verificar compressão, redimensionamento, formato e tamanho médio
- [x] Instalar sharp como dependência do servidor
- [x] Criar módulo server/imageProcessor.ts para redimensionamento e conversão WebP
- [x] Atualizar rota upload.image para gerar duas versões (thumb 400px + principal 1200px) em WebP q75-80
- [x] Adicionar validação no frontend (dimensões máximas, limite de tamanho de ficheiro)
- [x] Atualizar componentes frontend para usar thumb em listagens e principal em detalhe
- [x] Criar script de migração para otimizar todas as imagens existentes de todos os estabelecimentos (334.8MB → 13.3MB, redução de 96%)
- [x] Escrever testes para o pipeline de processamento de imagens (17 testes passaram)
- [x] Implementar lazy loading com placeholder blur (~20px base64 inline) nas imagens de produtos
- [x] Gerar blurhash/placeholder no imageProcessor durante o upload
- [x] Armazenar placeholder base64 no banco de dados (campo blurPlaceholder nos produtos)
- [x] Criar componente BlurImage para exibir placeholder enquanto imagem carrega
- [x] Integrar BlurImage nas páginas de listagem (Catalogo, PDV, PublicMenu)
- [x] Configurar Cache-Control headers no S3 para cache de longo prazo
- [x] Migrar imagens existentes para gerar placeholders blur
- [x] Escrever testes para o pipeline de blur placeholder
- [x] Adicionar campos blurPlaceholder para capa e logo na tabela establishments
- [x] Atualizar pipeline de upload para gerar blur placeholder em capas e logos
- [x] Implementar suporte a srcset no componente BlurImage (thumb para mobile, main para desktop)
- [x] Migrar imagens existentes de capa/logo para gerar blur placeholders
- [x] Medir impacto de performance no carregamento do menu público
- [x] Escrever testes para as novas funcionalidades
- [x] Criar job de conversão automática em background para imagens PNG/JPG → WebP
- [x] Detectar imagens legacy em todas as tabelas (products, establishments, complements, combos)
- [x] Converter imagens para WebP com duas versões (thumb 400px + principal 1200px)
- [x] Gerar blur placeholder para imagens convertidas
- [x] Integrar job no startup do servidor com execução automática
- [x] Adicionar endpoint admin para trigger manual da conversão
- [x] Escrever testes para o job de conversão
- [x] Criar script para identificar imagens órfãs no S3 não referenciadas no banco
- [x] Implementar modo dry-run para listar órfãs sem apagar
- [x] Implementar modo de remoção efetiva das imagens órfãs
- [x] Integrar como endpoint admin para trigger via painel
- [x] Escrever testes para a lógica de detecção de órfãs


## Bug: Imagens não carregam na listagem do menu público (estabelecimento 60018 - Big Norte)

- [x] Investigar por que algumas imagens não aparecem na listagem mas carregam ao clicar no produto
- [x] Verificar URLs de TODAS as imagens e thumbnails dos produtos do estabelecimento 60018
- [x] Gerar thumbnails faltantes para todos os produtos afetados
- [x] Adicionar fallback no BlurImage para quando thumbnail não existir
- [x] Analisar componente BlurImage e lógica de thumbnail
- [x] Corrigir o problema identificado
- [x] Testar e verificar a correção

## Conversão de imagens legadas e geração automática de thumbnails

- [x] Identificar todas as imagens em formato PNG/JPEG no S3 referenciadas no banco
- [x] Criar script para converter imagens legadas para WebP otimizado + gerar thumbnails (todas já estavam em WebP)
- [x] Executar conversão em todos os estabelecimentos e atualizar URLs no banco (0 imagens legacy encontradas)
- [x] Integrar geração automática de thumbnail no fluxo de upload de imagens (singleVersion agora gera thumb)
- [x] Escrever testes para a lógica de geração automática de thumbnails (15 testes)
- [x] Verificar funcionamento end-to-end (90 testes passando, servidor OK)

## Fase 1 — Bot API para Integração n8n/WhatsApp

- [x] 1.1 Criar tabela botApiKeys no schema Drizzle (id, key, establishmentId, name, createdAt, active)
- [x] 1.2 Criar middleware de autenticação que valida API Key e injeta establishmentId
- [x] 1.3 Criar botApiRouter.ts com endpoints GET de consulta (establishment, menu, search, products, stock, delivery-fees)
- [x] 1.4 Criar endpoint POST /api/bot/coupons/validate
- [x] 1.5 Criar endpoint POST /api/bot/orders com validação completa (estoque, complementos, valor mínimo, horário)
- [x] 1.6 Criar endpoint GET /api/bot/orders (consulta por telefone e por orderId)
- [x] 1.7 Criar endpoints admin para gerar/revogar API Keys (CRUD via tRPC)
- [x] 1.8 Criar página admin "Bot WhatsApp" para gerenciar API Keys
- [x] 1.9 Escrever testes para todos os endpoints do bot API (35 testes)
- [x] 1.10 Verificar funcionamento end-to-end

## Bug: Página Bot WhatsApp sem layout correto
- [x] Corrigir página BotWhatsApp para usar AdminLayout com sidebar
- [x] Ajustar espaçamentos e visual da página para seguir o padrão do sistema
- [x] Criar API Key de teste e validar todos os 11 endpoints com curl (11/11 passaram)

## Bug: Notificação de entregador ao aceitar pedido envia para todos
- [x] Investigar fluxo de notificação ao aceitar pedido vs marcar como pronto
- [x] Corrigir backend: retornar lista de entregadores em vez de broadcast quando on_accepted e 2+ entregadores
- [x] Corrigir frontend: interceptar resposta e mostrar modal de seleção de entregador no aceite
- [x] Usar mutation correta (driver.assignToOrder) no modal quando contexto é aceite
- [x] Testar e verificar a correção (0 erros TypeScript, servidor OK)
- [x] Pedidos lista: trocar contagem de parênteses (9) para badge redondo vermelho igual ao PDV categorias
- [x] Configurações Impressora: adicionar toggle "Bipe ao imprimir" na aba Layout abaixo de "Mostrar divisores"
- [x] Reescrever modelo de recibo ESC/POS (texto) com layout: header centralizado, separadores = e -, preços alinhados à direita, complementos indentados com pontos
- [x] Ajustar modelo ESC/POS v2: header condensado (#P99 data | TIPO |), preço do item em linha separada alinhado à direita
- [x] ESC/POS: adicionar observação geral do pedido (order.notes) no recibo de texto
- [x] Menu público: remover seção "Observação do pedido" (título + textarea) do modal de Resumo do Pedido
- [x] Pedidos: adicionar tooltip customizado no botão "Conectado" mostrando número WhatsApp conectado dinamicamente
- [x] Bot API: novo endpoint GET /api/bot/whatsapp-config que retorna establishmentId filtrado por connectedPhone
- [x] Bot API: criar API Key global (master) que funcione para todos os estabelecimentos, para uso no endpoint /api/bot/whatsapp-config
- [x] Bot API: novo endpoint GET /api/bot/api-key que retorna a apiKey filtrada por establishmentId
- [x] Fix: adicionar groupIds como filtro na função updateComplementItemsByName para evitar alteração em massa de preços entre grupos diferentes
- [x] Menu público: exibir badge "Grátis" nos complementos gratuitos (priceMode free ou price 0) no modal de seleção de complementos
- [x] Fix: badge "Grátis" no menu público deve aparecer SOMENTE quando priceMode === 'free', não quando preço é 0 ou indefinido
- [x] Fix: beepOnPrint não está sendo enviado no evento SSE de impressão para o app externo
- [x] Adicionar badge "Breve" ao item "Mapa de mesas" no menu lateral
- [x] Criar endpoint GET /api/bot/menu-link que retorna { menuUrl, slug, establishmentName }
- [x] Bloquear opção "Confirmação via Botões" - desativar toggle no frontend e impedir ativação no backend
- [x] Fix: impressão automática não funciona - pedido feito pelo menu público não dispara evento print_order via SSE para o Mindi Printer app
- [x] Fix: pedido sendo impresso 2x na mesma impressora via SSE
- [x] Fix: pedido ainda sendo impresso 2x mesmo após desativar impressora legada - separar pool SSE de impressora do pool do dashboard
- [x] Sistema de log de impressão: criar tabela printLogs no banco de dados
- [x] Sistema de log de impressão: criar db helpers para inserir e consultar logs
- [x] Sistema de log de impressão: criar rotas tRPC para listar logs com filtros
- [x] Sistema de log de impressão: integrar logging em todos os pontos de disparo de impressão (createPublicOrder, updateOrderStatus)
- [x] Sistema de log de impressão: criar UI para visualizar logs na aba de impressão nas configurações
- [x] Sistema de log de impressão: testes vitest
- [ ] Fix: pedidos novos do menu público não aparecem em tempo real no admin - precisa atualizar a página para ver o pedido (SSE do dashboard não está notificando)
- [x] Melhoria: tornar createPrintLog resiliente - falhas de logging nunca devem interferir no fluxo de impressão
- [x] Fix: impressão HTML via SSE/Mindi Printer não ocupa a largura total do papel 80mm (ESC/POS funciona corretamente)
- [x] Fix: toggle de som deve iniciar desativado ao carregar/atualizar a página (browser autoplay policy bloqueia som sem interação do usuário)
- [x] Fix: impressão HTML via Mindi Printer ainda não ocupa largura total do papel 80mm - ajustar template para width 100% sem restrições
- [x] Fix: impressão HTML via Mindi Printer ainda não ocupa largura total do papel 80mm - ajustar template para width 100%
- [x] Fix: impressão HTML tem muito espaço em branco abaixo do conteúdo - impressora não corta no lugar certo
- [x] Fix: impressão via browser (window.print) ficou alinhada à esquerda e não preenche a página corretamente após fix do Mindi Printer
- [x] Fix: toggle de som reseta ao navegar entre menus - deve resetar apenas no carregamento real da página (F5/primeiro acesso), não na navegação interna
- [x] Substituir opção "Múltiplas Impressoras (Android)" por "Impressão Automática (Mindi Printer)" no menu de impressão
- [x] Opção "Impressão Automática" só deve aparecer quando o usuário já gerou uma API Key para o Mindi Printer
- [x] Quando "Impressão Automática" estiver marcada como favorita, ao aceitar pedido NÃO deve abrir o webview de impressão (impressão é enviada via SSE automaticamente)
- [x] Manter opção "Impressão Normal" funcionando como antes (abre webview ao aceitar)
- [x] Fix: ícone de Entregadores no menu lateral deve ser o mesmo ícone usado no modal de acompanhamento do pedido (status "Saiu para entrega") - alterado de Truck para Bike
- [x] Padronizar ícone de entregador/delivery de Truck para Bike em todas as telas: PDV, Configurações, Entregadores, Pedidos, LandingPage, Onboarding, PublicMenu, Agendados, EntregadorDetalhes, PDVSlidebar, MobilePDVModal
- [x] Fix: botão "Desconectado | Conectar" do WhatsApp na página de Pedidos com layout quebrado (texto sobreposto e cortado) - removido width fixo de 161px, agora auto-size
- [x] Criar página /privacidade (Política de Privacidade) para conformidade com Play Store
- [x] Página pública com link direto, sem aparecer no menu lateral do admin
- [x] Layout e estilo consistente com o sistema (cores, fontes, design)
- [x] Textos completos de política de privacidade adequados para app de cardápio digital
- [x] Fix: adicionar meta viewport (width=567) no HTML de recibo gerado para impressão via Mindi Printer - conteúdo está renderizando muito estreito (alterado em 4 locais: index.ts x3 + PrintTestTab.tsx x1)
- [x] Fix: recibo HTML via Mindi Printer continua com largura estreita - media query @media screen (min-width: 400px) alterada para 768px para não afetar o Mindi Printer (viewport 567px)
- [x] Separar configurações de fonte/estilo de impressão em duas: "Impressão Normal" e "Mindi Printer"
- [x] Adicionar colunas Mindi-specific no schema (mindiFontSize, mindiTitleFontSize, etc.)
- [x] Atualizar backend para salvar/carregar configurações Mindi separadamente
- [x] Atualizar geração de recibo para usar configurações Mindi quando servido via API key
- [x] Adicionar aba/seção "Mindi Printer" nas Configurações de Impressão no frontend
- [x] Adicionar opção de beep (sinal sonoro) na aba Mindi Printer das configurações de impressão
- [x] Adicionar opção de ativar/desativar impressão HTML na aba Mindi Printer das configurações de impressão
- [x] Garantir que endpoints do Mindi Printer (SSE stream, receipt, status) exponham mindiBeepOnPrint e mindiHtmlPrintEnabled para o app consumir
- [x] Remover botão "Teste Térmica (Android)" da aba de teste de impressão
- [x] Mover botão "Imprimir Teste" (normal) para a aba Fontes
- [x] Remover aba "Teste" das configurações de impressão (agora são 5 abas: Layout, Fontes, Mindi, API, Logs)
- [x] Corrigir erro TypeScript: tipo 'automatic' não era aceito no defaultPrintMethod (adicionado 'android' ao enum zod e db.ts para compatibilidade)
- [x] Adicionar coluna whatsappBotEnabled no schema do banco de dados
- [x] Criar endpoint tRPC para ativar/desativar bot do WhatsApp
- [x] Criar endpoint público /api/bot/bot-status para o n8n consultar se o bot está ativo
- [x] Adicionar toggle de ativar/desativar bot ao lado do botão de API key na página de WhatsApp
- [x] Ocultar API Key Global da listagem na página Bot WhatsApp (manter apenas no backend)
- [x] Remover botão "Nova Key Global" da interface do usuário
- [x] Configurar webhook padrão automaticamente ao criar instância Uazapi (URL: https://webn8n.granaupvps.shop/webhook/mindi)
- [x] Garantir que a configuração do webhook não dependa de ação manual do usuário
- [x] Configurar webhook n8n automaticamente ao reconectar instância existente (não apenas ao criar nova)
- [x] Criar API Key do bot automaticamente ao conectar WhatsApp pela primeira vez (sem ação manual)
- [x] Remover seção de API Keys da página Bot WhatsApp (listagem, botão Nova API Key, dialog de criação)
- [x] Manter apenas toggle ativar/desativar e informações de conexão/endpoints na página
- [x] Corrigir formatação ESC/POS: preço dos itens deve ficar na mesma linha do nome do item (não na linha de baixo)
- [x] Corrigir ESC/POS: itens com complementos devem mostrar preço base do item na mesma linha do nome e remover total abaixo dos complementos
- [x] Corrigir versão HTML do recibo: mostrar preço base do item (sem complementos) na linha do item, igual à correção ESC/POS
- [x] Corrigir bug: horários de funcionamento alterados em Configurações > Atendimento não refletem no menu público
- [x] Corrigir toggle de som: resetar para OFF em reload completo (F5), manter estado em navegação SPA

## Agendamento de Categorias (Category Scheduling)
- [x] Adicionar colunas availabilityType, availableDays, availableHours na tabela categories (schema + migração)
- [x] Criar função utilitária compartilhada isScheduleAvailable com suporte a horários que cruzam meia-noite
- [x] Corrigir bug de meia-noite na verificação de complementos (reutilizar nova função)
- [x] Adicionar cache em memória com TTL para getPublicMenuData (por establishmentId)
- [x] Atualizar endpoint category.update para aceitar campos de agendamento
- [x] Filtrar categorias agendadas fora do horário no getPublicMenuData (menu público)
- [x] Validar categorias agendadas no createOrder (rejeitar pedidos com categorias indisponíveis)
- [x] Adicionar opção "Agendar" no dropdown de 3 pontinhos da categoria no /catalogo
- [x] Criar modal/dialog de agendamento de categoria (dias + horários) seguindo padrão dos complementos
- [x] Mostrar badge azul "Horário" no header da categoria quando availabilityType === "scheduled"
- [x] Escrever testes vitest para isScheduleAvailable (normal, meia-noite, timezone, edge cases)
- [x] Corrigir caracteres Unicode escapados no modal de agendamento de categorias (ex: \u00e9 → é)
- [x] Trocar ícone do badge "Agendado" de Clock para CalendarClock para melhor identificação visual
- [ ] Implementar conversão HTML→bitmap no servidor para impressão em segundo plano via Mindi Printer

## Animações Kanban de Pedidos
- [x] Instalar Framer Motion e adicionar transições suaves no Kanban de pedidos
- [x] Animação fade+slide ao mover card entre colunas (Novos→Preparo→Prontos→Completos)
- [x] Animação ao entrar pedido novo e ao reordenar dentro da mesma coluna
- [x] Adicionar modal de confirmação ao limpar pedidos completos/cancelados no Kanban para evitar cliques acidentais
- [x] Remover card "Conta criada com sucesso!" da tela de onboarding
- [x] Mover botão "Voltar" para ao lado esquerdo do botão "Continuar" em todas as telas do onboarding
- [x] Indicador de progresso animado no stepper do onboarding — transição suave ao avançar/voltar entre passos
- [x] Bug: Número do step piscando ao digitar nos campos do onboarding (animate-ping re-renderiza)
- [x] Aumentar espaçamento entre círculo do step e label no stepper do onboarding
- [x] Remover badge "Breve" do item Mapa de mesas no menu lateral
- [x] Limpar connectedPhone automaticamente ao desconectar WhatsApp
- [ ] Validar unicidade do número ao conectar — limpar registros antigos de outros estabelecimentos
- [ ] Criar API key não-global automaticamente ao ativar o bot WhatsApp
- [x] Modal informativo ao aceitar pedido (com verificação de notificação ativa)
- [x] Modal informativo ao marcar como pronto (com verificação de notificação ativa)
- [x] Modal informativo ao finalizar pedido (com verificação de notificação ativa)
- [x] Checkbox "Não mostrar novamente" com persistência em localStorage por estabelecimento
- [x] Borda colorida do modal conforme status (vermelho, verde, cinza)

## Refinamento dos Modais de Onboarding de Status
- [x] Atualizar texto do modal preparing: "Ao aceitar, o cliente será avisado via WhatsApp que o pedido está em preparo."
- [x] Redesenhar card WhatsApp no estilo /configuracoes (header verde com foto, nome do restaurante e "online", badge "HOJE")
- [x] Trocar checkbox "Não mostrar novamente" por botão vazado branco acima do botão principal
- [x] Aplicar mesmas mudanças de estilo nos modais de ready e completed
- [x] Corrigir borda do modal de onboarding: borda grossa (h-1.5) deve ser fina como a dos cards Kanban
- [x] Modal de "Pedido pronto": mostrar mensagem de retirada quando pedido é para retirada, e mensagem de entrega quando é para entrega
- [x] Modal de onboarding: usar os templates reais de Configurações → WhatsApp → Templates no preview, respeitando tipo entrega vs retirada
- [x] Modal de onboarding: remover variáveis {{cashbackEarned}} e {{cashbackTotal}} do preview quando cashback não está ativo
- [x] Modal de onboarding: quando cashback NÃO está ativo, remover linhas com {{cashbackEarned}} e {{cashbackTotal}} em vez de substituí-las por valores de exemplo
- [x] Modal Meus Pedidos (menu público): adicionar botão vermelho "Avaliar restaurante" para pedidos entregues, com mesma lógica do modal Acompanhar Pedido (só aparece se não avaliou ou avaliou há mais de 30 dias)

## Modal Informativo na Página /entregadores (Transição 1→2 entregadores)
- [x] Modal informativo ao cadastrar o segundo entregador (transição 1→2)
- [x] Mesmo padrão visual dos modais de onboarding da página /pedidos (borda colorida, ícone, botões)
- [x] Texto explicando que com múltiplos entregadores, será exibido modal de seleção ao aceitar/pronto
- [x] Botão "Entendi" como ação principal
- [x] Botão "Não mostrar este aviso novamente" com persistência em localStorage por estabelecimento
- [x] Modal só aparece na transição de 1→2 e se não foi dismissado

## Ajuste de Badges Obrigatório/Opcional nos Complementos
- [x] Exibir badge "Opcional" no menu público quando grupo tem mínimo = 0
- [x] Unificar regra: mínimo >= 1 → obrigatório automaticamente, mínimo = 0 → opcional
- [x] Ajustar lógica no admin para sincronizar campo obrigatório com mínimo
- [x] Ajustar validação no checkout para usar mínimo como fonte de verdade

## Variável {{customerAddress}} nos Templates WhatsApp
- [x] Criar variável {{customerAddress}} que exibe endereço completo do cliente
- [x] Formatar com asteriscos para negrito no WhatsApp (Rua, Número, Bairro, Complemento, Ponto de referência)
- [x] Adicionar substituição no resolveTemplate do backend (envio real)
- [x] Adicionar substituição no preview dos modais de onboarding
- [x] Adicionar variável na lista de variáveis disponíveis na UI de configuração de templates
- [x] Omitir campos vazios (complemento, ponto de referência) quando não preenchidos

## Cabeçalho na variável {{itensPedido}}
- [x] Adicionar "📦 *Itens do pedido:*" como cabeçalho antes da lista de itens no backend (generateStatusMessage)
- [x] Atualizar preview no TemplatesEditor.tsx

## Exibição das variáveis em português no TemplatesEditor
- [x] Mostrar nomes das variáveis em português amigável (ex: customerName → Nome do Cliente)
- [x] Adicionar tooltips explicativos ao passar o mouse sobre cada variável
- [x] Manter inserção do código técnico ao clicar (ex: {{customerName}})

## Botão "Copiar chave PIX" na mensagem WhatsApp de novo pedido
- [x] Localizar campo de chave PIX nas configurações de atendimento
- [x] Adicionar chave PIX na mensagem WhatsApp de novo pedido quando cadastrada
- [x] Implementar botão PIX nativo via endpoint /send/pix da UAZAPI (botão de copiar nativo do WhatsApp)
- [x] Auto-detecção do tipo de chave PIX (CPF, CNPJ, EMAIL, PHONE, EVP)
- [x] Testar envio com e sem chave PIX cadastrada

## Fluxo Inteligente de Entrega (v4 - Clean Implementation)
- [x] Backend: Suprimir envio de template ao cliente quando admin marca como Pronto E existem entregadores cadastrados
- [x] Backend: Enviar 2 botões ao entregador na notificação (🚵 Sair para entrega + ✅ O pedido foi entregue)
- [x] Backend: Webhook handler - botão "Sair para entrega" envia template Pronto (Delivery) ao cliente
- [x] Backend: Webhook handler - botão "O pedido foi entregue" atualiza status para Finalizado + envia template Finalizado ao cliente
- [x] Backend: Configurar webhook UAZAPI para nosso endpoint (com proxy para n8n)
- [x] Frontend: Desabilitar botão Finalizar na página /pedidos quando existem entregadores (ícone entregador + tooltip)
- [x] Frontend: Não exibir modal de "Pedido pronto" quando existem entregadores (marcar direto)
- [x] Testes vitest para o fluxo completo

## Bug Fix - Webhook Entregador v5
- [x] Corrigir: botão "Sair para entrega" não envia notificação ao cliente via WhatsApp
- [x] Corrigir: botão "O pedido foi entregue" não envia notificação ao cliente via WhatsApp
- [x] Mover auto-reconfiguração do webhook para fora da condição de mudança de status
- [x] Remover excludeMessages que bloqueava respostas de botão
- [x] Adicionar proteção contra loops (ignorar fromMe sem buttonId)
- [x] Adicionar logging detalhado no webhook handler

## Bug Fix - Webhook Entregador v6 (Deep Debug)
- [ ] Investigar se webhook UAZAPI está a chegar ao endpoint
- [ ] Verificar formato do payload da UAZAPI para respostas de botão
- [ ] Testar endpoint diretamente com curl
- [ ] Corrigir o que for necessário

## Modal Informativo Entregador
- [x] Tornar botão "Entregador" clicável com modal informativo no estilo do modal "Pedido em preparo"

## Estilo Botão Entregador
- [x] Mudar botão "Entregador" para mesmo estilo do "Finalizar" (fundo verde, texto branco)

## Cor Modal Entregador
- [x] Mudar cor do modal de entregador de laranja para verde #059669
## Badge Entrega nos Pedidos Completos
- [x] Mudar badge de "ENTREGA" para "ENTREGUE" nos pedidos da coluna Completos (status finished)
## Mensagens de Confirmação ao Entregador
- [x] Enviar mensagem de confirmação ao entregador quando clicar "Sair para entrega" (🛵 Entrega iniciada, cliente informado, status atualizado)
- [x] Enviar mensagem de confirmação ao entregador quando clicar "Pedido entregue" (✅ Entrega concluída, cliente notificado, pedido encerrado)
## Badge EM ROTA nos Pedidos Out for Delivery
- [x] Mudar badge de "ENTREGA" para "EM ROTA" quando pedido estiver com status out_for_delivery (visual only)
## Fix: Pedidos atrasados no Admin (SSE buffering)
- [x] Adicionar res.flush() após res.write() em todas as funções SSE (sendEvent, sendPrinterEvent, sendOrderEvent, sendOrderIdEvent, sendCustomerEvent)
- [x] Reduzir heartbeat de 30s para 15s
- [x] Adicionar Transfer-Encoding: chunked nos headers SSE
## Bug: Mensagens de confirmação ao entregador não chegam
- [x] Investigar e corrigir por que o entregador não recebe mensagem de confirmação ao clicar "Sair para entrega" e "Pedido entregue"
## Bug: Mensagens de confirmação ao entregador ainda não chegam (v2)
- [x] Verificar logs em produção e corrigir definitivamente o envio de confirmação ao entregador
## Bug: Mensagens de confirmação ao entregador ainda não chegam (v3)
- [x] Verificar logs de produção e diagnosticar ponto exato da falha - CAUSA: sender vinha como LID (@lid) inválido, corrigido para usar chatid
## Atualizar textos das mensagens de confirmação ao entregador
- [x] Alterar texto de "Sair para entrega" e "Pedido entregue" para novo modelo
## Remoção do endpoint de debug
- - [x] Remover /api/debug/webhook-logs e código de intercepção de logs (monkey-patch console.log)
## Importar cardápio Tche Restaurante para estabelecimento 210007
- [x] Extrair foto de perfil e foto de capa do Tche Restaurante
- [x] Extrair categorias, itens, descrições, preços e fotos dos itens
- [x] Fazer upload de todas as imagens para o CDN próprio
- [x] Cadastrar tudo no sistema para o estabelecimento ID 210007 (2 categorias, 15 produtos)
## Bug: Nome do responsável não aparece nas Configurações
- [x] Campo "Nome do responsável" na página de configurações mostra slug em vez do nome cadastrado no onboarding (corrigido: onboarding agora salva em responsibleName + fallback para ownerDisplayName)
## Inserir bairros e taxas de entrega para estabelecimento 210007
- [x] Acessar painel de produção e extrair bairros e taxas do Tche Restaurante (87 bairros extraídos via portal.mindi.com.br)
- [x] Inserir 87 bairros e taxas no banco de dados (neighborhoodFees) para estabelecimento 210007
## Adicionar complementos às bebidas do estabelecimento 210007
- [x] Acessar cardápio antigo (menu.mindi.com.br/tche-restaurante) e extrair grupos de complementos das bebidas (10 produtos verificados)
- [x] Inserir 15 grupos de complementos e 30 opções no banco de dados para 8 produtos de bebida (Suco Limão e Suco Laranja não têm complementos)
## Bug: Edição de complemento global cria duplicata
- [x] Corrigir edição de item de complemento que cria novo item em vez de atualizar o existente (agora usa updateGlobal para propagar para todos os itens com mesmo nome)
- [x] Corrigir exclusão do item original que faz o item "editado" desaparecer (resolvido pela propagação global da edição de nome)
## Sistema de Feedback
- [x] Criar tabela feedbacks no schema (tipo, mensagem, screenshot, status, userId, establishmentId)
- [x] Criar endpoints tRPC para enviar feedback e listar feedbacks (admin)
- [x] Criar componente/modal de envio de feedback acessível pelo menu do utilizador (dropdown)
- [x] Criar painel admin para visualizar e gerenciar feedbacks recebidos (/admin/feedbacks)
- [x] Notificar owner quando novo feedback for recebido (via notifyOwner)
- [x] Escrever testes vitest para os endpoints de feedback (11 testes passando)
## Melhorias no Modal de Feedback
- [x] Remover botões Dúvida e Outro (manter apenas Reportar Bug e Sugestão)
- [x] Adicionar upload de até 7 fotos no feedback (com preview, remoção individual, upload via S3)
- [x] Padronizar visual do modal com o estilo do modal de aceitar pedido (border-t-4, rounded-xl, layout header com ícone)
## Contador de feedbacks novos no painel admin
- [x] Criar endpoint para contar feedbacks com status "new" (reutilizado feedback.stats existente)
- [x] Adicionar badge com contagem na sidebar do painel admin junto ao item Feedbacks (badge vermelho, auto-refresh 60s + refetch on focus)
## Ajustes no modal de feedback
- [x] Renomear "Reportar Bug" para "Reportar Problema"
- [x] Adicionar nova opção "Elogio" no modal de feedback (tipo praise, cor verde, ícone ThumbsUp)
## Ajuste de largura do modal de feedback
- [x] Igualar largura do modal de feedback à largura do modal de Notificações WhatsApp (ambos sm:max-w-md / 448px)
## Padronização visual do modal de Notificações WhatsApp
- [x] Padronizar modal de Notificações WhatsApp com o mesmo modelo visual do modal de Feedback (border-t-4 emerald, p-0, px-6 interno, botões full-width rounded-xl)
## Melhoria no fluxo de criação de categoria no catálogo
- [ ] Categoria recém-criada aparece imediatamente na lista com "0 itens"
- [ ] Scroll automático até a nova categoria após criação
- [ ] Botão "Adicionar Produto" (vermelho) ao lado de "Criar Combo" em categorias com 0 itens
- [ ] Ao clicar em "Adicionar Produto", abre o modal de Novo Produto existente

## Categorias Vazias no Catálogo
- [x] Mostrar categorias vazias (0 ítens) na lista do catálogo em vez de escondê-las
- [x] Botão vermelho "Adicionar Produto" no header da categoria vazia (ao lado esquerdo do "Criar Combo")
- [x] Empty state dentro da categoria vazia com ícone, mensagem e botão "Adicionar Produto"
- [x] Auto-scroll para nova categoria após criação
- [x] Modal de Novo Produto abre com categoria pré-selecionada ao clicar em "Adicionar Produto"
- [x] Opção "Adicionar Produto" no dropdown mobile para categorias vazias
- [x] Remover botão vermelho "Adicionar Produto" do header da categoria vazia (manter apenas o do empty state)

## Padronização de Modais com Estilo do Feedback
- [x] Padronizar modal de Seleção de Entregador com estilo do FeedbackModal
- [x] Padronizar modal de Nova Categoria com estilo do FeedbackModal
- [x] Padronizar modal de Criar Mesas com estilo do FeedbackModal

## Toggle Expandir/Minimizar Categoria por Click no Header
- [x] Clicar no header da categoria (nome, ícone, contagem) deve alternar expandir/minimizar
- [x] Não deve interferir com botões (Criar Combo, editar, drag handle, dropdown, etc.)
- [x] Remover botão Cancelar dos modais padronizados (Nova Categoria, Seleção de Entregador, Criar Mesas)

## Revisão de Botões Cancelar em Modais da Plataforma
- [x] Identificar todos os modais com botão Cancelar desnecessário
- [x] Remover botões Cancelar desnecessários (manter apenas em confirmações destrutivas)

## Padronização de Modais de Confirmação Destrutiva
- [x] Padronizar modal de excluir produto (Catalogo.tsx) com estilo FeedbackModal
- [x] Padronizar modal de excluir categoria (Catalogo.tsx) com estilo FeedbackModal
- [x] Padronizar modal de agendar disponibilidade (Catalogo.tsx) com estilo FeedbackModal
- [x] Padronizar modal de cancelar pedido (Pedidos.tsx) com estilo FeedbackModal
- [x] Padronizar modal de limpar coluna (Pedidos.tsx) com estilo FeedbackModal

## Padronização Visual Completa de Todos os Modais
- [x] Agendados.tsx - Reagendar Pedido
- [x] Campanhas.tsx - Agendar Campanha
- [x] Campanhas.tsx - Recarga de Saldo
- [x] Configuracoes.tsx - Impressora
- [x] Estoque.tsx - Novo Item
- [x] Estoque.tsx - Editar Item
- [x] Estoque.tsx - Movimentação
- [x] Estoque.tsx - Nova Categoria Estoque
- [x] Financas.tsx - Registrar/Editar Despesa
- [x] Financas.tsx - Editar Despesa Recorrente
- [x] Financas.tsx - Gerenciar Categorias
- [x] Financas.tsx - Meta Mensal
- [x] Financas.tsx - Nova/Editar Meta
- [x] Financas.tsx - Confirmar Pagamento
- [x] Impressoras.tsx - Nova/Editar Impressora
- [x] MesasComandas.tsx - Gerenciar Espaços
- [x] MesasComandas.tsx - Reservar Mesa
- [x] Complementos.tsx - Excluir Item, Toggle Item, Excluir Grupo, Toggle Grupo
- [x] Cupons.tsx - Excluir Cupom
- [x] Entregadores.tsx - Excluir Entregador
- [x] PDVSlidebar.tsx - Excluir Item Comanda, Configuração da Aba
- [x] MobilePDVModal.tsx - Excluir Item Comanda
- [x] PrintLogsTab.tsx - Limpar Logs
- [x] ImageCropModal.tsx - Recorte de Imagem
- [x] Pedidos.tsx - QR Code WhatsApp
- [x] Configuracoes.tsx - Exclusão de Impressora
- [x] Financas.tsx - Histórico de Alterações, Exclusão de Despesa
- [x] Campanhas.tsx - Modelos Sugeridos

## Alerta de WhatsApp Desconectado
- [x] Criar componente WhatsAppDisconnectedBanner (banner fixo vermelho no topo)
- [x] Usar status do getConfig (sem polling extra) para verificar conexão
- [x] Mostrar banner ao navegar nas páginas (Pedidos, Dashboard) quando desconectado
- [x] Mostrar banner ao receber novo pedido via SSE quando desconectado
- [x] Botão "Reconectar agora" que leva à página de configurações do WhatsApp

## Ajustes do Banner de WhatsApp
- [x] Banner de WhatsApp desconectado só deve aparecer se já foi conectado pelo menos uma vez

## Ajuste do Botão Reconectar do Banner
- [x] Botão "Reconectar" deve navegar para Pedidos e abrir o modal de conexão do WhatsApp

## Animação do Banner de WhatsApp
- [x] Ocultar banner com animação suave de fade-out quando WhatsApp reconectar

## Ícone de Câmera para Itens sem Foto
- [x] Adicionar ícone de câmera para itens sem foto na página de Catálogo (Menu)

## Refatoração da Edição de Produtos
- [x] Modificar clique no item do catálogo para abrir modal de edição
- [x] Adicionar campo de preço ao modal de edição de produto
- [x] Remover a página de edição de item (/catalogo/editar/:id)

## Refatoração da Edição de Produtos (Modal)
- [x] Modificar CreateProductSheet para suportar modo de edição com productId
- [x] Carregar dados do produto existente no modal ao editar
- [x] Alterar onEdit no Catálogo para abrir modal em vez de navegar
- [x] Remover página /catalogo/editar/:id e rota correspondente
- [x] Testar criação e edição de produtos via modal

## Spinner de Carregamento no Modal de Edição
- [x] Adicionar spinner de loading enquanto os dados do produto estão sendo carregados no modal de edição

## Imagens do Produto no Modal
- [x] Permitir até 3 fotos no modal de edição/criação de produto
- [x] Remover botão "Trocar" da seção de imagens

## Modal de Enviar Feedback
- [x] Remover botão "Cancelar" do modal de Enviar Feedback

## Setas de Navegação de Fotos no Menu Público
- [x] Adicionar setas de navegação (voltar/avançar) no modal de detalhes do item quando tiver mais de 1 foto

## Bug Fix - Camera not defined
- [x] Corrigir erro "Camera is not defined" na página de Pedidos (import faltando)

## Bug - Lentidão nos campos Mín/Máx
- [x] Corrigir lentidão nos campos Mínimo e Máximo dos grupos de complementos no catálogo

## Validação Mín/Máx
- [x] Adicionar validação para impedir que o mínimo seja maior que o máximo nos campos de complementos

## Banner Informativo de Produtos Sem Foto
- [x] Banner informativo no topo do catálogo mostrando quantidade de produtos sem foto, com botão para filtrar lista, usando identidade visual do projeto

## Estilo Visual Card Como Funciona
- [x] Atualizar card 'Como funciona' da página de complementos para seguir o mesmo estilo visual do banner de produtos sem foto do catálogo

## Borda na Foto do Restaurante na Sidebar
- [x] Adicionar borda/container ao redor da foto do restaurante na sidebar do menu

## Efeito Shimmer no Banner de Produtos Sem Foto
- [x] Adicionar efeito shimmer/brilho sutil ao card informativo de produtos sem foto no catálogo

## Efeito Pulsante no Ícone do Banner
- [x] Adicionar efeito pulsante (animate-ping) no ícone da câmera do banner de produtos sem foto, igual ao do WhatsApp desconectado

## Notificações Push no Navegador
- [x] Implementar Notification API do navegador para alertar sobre novos pedidos com aba inativa
- [x] Pedir permissão do usuário para notificações
- [x] Disparar notificação push ao receber novo pedido via SSE
- [x] Tocar som de alerta junto com a notificação

## Botão Finalizar para Pedidos em Entrega Atrasados
- [x] Quando pedido em entrega há mais de 1 hora, trocar botão "Entregador" por "Finalizar"
- [x] Permitir ao dono do restaurante finalizar o pedido diretamente após 1h em entrega

## Paginação na Lista de Entregas do Entregador
- [x] Adicionar paginação (máximo 20 itens por página) na lista de entregas ao clicar num entregador na página /entregadores

## Banner Informativo na Página de Avaliações
- [x] Adicionar banner informativo no topo da página /avaliacoes com mesmo estilo visual do banner de produtos sem foto do catálogo
- [x] Mensagem: "Avaliações são importantes! Incentive seus clientes a avaliarem o restaurante para aumentar sua credibilidade e atrair mais pedidos."
- [x] Ícone de estrela à esquerda, efeito pulsante, botão de fechar (dismiss)

## Onboarding Pós-Pedido no Menu Público
- [x] Após finalizar pedido, abrir sidebar automaticamente e destacar "Meus pedidos" com tooltip
- [x] Tooltip com mensagem: "Você pode acompanhar o status em Meus pedidos. E até repetir o mesmo pedido que já foi entregue."
- [x] Mostrar apenas 1 vez por cliente (localStorage)
- [x] Apenas após pedido concluído, não em navegação normal
- [x] Visual sutil e elegante, sem bloquear a tela inteira

## Refazer Onboarding Pós-Pedido (Novo Fluxo 3 Etapas)
- [ ] Etapa 1: Na tela de sucesso, overlay escuro focando no botão "Acompanhar pedido" + tooltip acima
- [ ] Etapa 2: No modal de acompanhamento, trocar botão "Fechar" por "Meus pedidos" (cor vermelha)
- [ ] Etapa 3: Ao clicar "Meus pedidos", fechar modal, abrir sidebar com overlay focando no item "Meus Pedidos" + tooltip
- [ ] Remover onboarding anterior (sidebar automática após pedido)
- [ ] Manter localStorage para mostrar apenas 1 vez por cliente


## Onboarding Pós-Pedido (Menu Público)
- [x] Implementar Step 1: Overlay escuro + tooltip acima do botão "Acompanhar pedido" após envio
- [x] Implementar Step 2: Modificar botão "Fechar" para "Meus pedidos" (vermelho) no modal de tracking
- [x] Implementar Step 3: Overlay + tooltip no item "Meus pedidos" da sidebar
- [x] Salvar no localStorage que onboarding foi exibido (não repetir para mesmo usuário)
- [x] Transições suaves entre etapas (fade/slide)
- [x] Ring highlight nos elementos focados

- [x] Bloquear cliques fora do botão "Acompanhar pedido" durante Step 1
- [x] Desabilitar toda a interface exceto o botão "Acompanhar pedido"
- [x] Adicionar overlay com pointer-events-none no resto da tela

- [x] Ajustar estilo do tooltip Step 1 para padrão do card informativo (fundo rosa, ícone, botão vermelho)
- [x] Adicionar botão "Acompanhar" no tooltip com estilo vermelho

- [x] Restaurar setinha estilo balão (triângulo apontando para baixo) no tooltip
- [x] Remover botão "Acompanhar" do tooltip (manter apenas texto informativo)


## Step 2 - Onboarding no Modal de Acompanhamento

- [x] Implementar state para Step 2 do onboarding (onboardingStep2SubStep)
- [x] Tooltip 1: Informar sobre acompanhamento + WhatsApp com botão "Entendi"
- [x] Tooltip 2: Focar no botão "Meus pedidos" após clicar em "Entendi"
- [x] Overlay bloqueador durante Step 2 (impede cliques fora dos botões)
- [x] Transição suave entre Tooltip 1 e Tooltip 2
- [x] Salvar no localStorage que Step 2 foi exibido (não repetir)

- [x] Ajustar layout do botão "Entendi" para ficar na mesma posição do "Meus pedidos"
- [x] Garantir que o botão "Entendi" tenha o mesmo tamanho e altura do "Meus pedidos"
- [x] Posicionar o tooltip acima do botão "Entendi"


## Otimizacao de Performance - Envio de Pedidos

- [x] Mover impressao para fire-and-forget (nao bloquear resposta)
- [x] Mover notificacao WhatsApp para fire-and-forget
- [x] Criar funcoes de processamento em background (processOrderPrintingInBackground, processOrderNotificationInBackground)
- [x] Desabilitar blocos de impressao e WhatsApp originais (usar if(false))
- [x] Testar tempo de resposta apos otimizacoes


## Correção do Preço na Impressão HTML
- [x] Corrigir valor exibido por item na impressão HTML para incluir preço dos complementos (preço base + complementos)
- [x] Corrigir valor exibido por item no ESC/POS para incluir preço dos complementos
- [x] Corrigir valor exibido por item no PrintTestTab (preview) para incluir preço dos complementos


## Simplificação do Step 2 do Onboarding
- [x] Remover tooltip "Acompanhe seu pedido!" e botão "Entendi" do Step 2
- [x] Manter apenas tooltip "Veja todos os seus pedidos" com foco no botão "Meus pedidos"
- [x] Setinha estilo balão já presente no tooltip do Step 2 (mesmo estilo do Step 1)


## Correção do tipo de chave PIX no botão WhatsApp
- [x] Investigar bug: chave telefone sendo identificada como CPF no botão PIX nativo
- [x] Implementar validação de CPF (algoritmo de dígitos verificadores) para distinguir CPF de telefone
- [x] Corrigir lógica de detecção em sendPixButton (uazapi.ts)
- [x] Adicionar suporte para telefones com DDD (10 dígitos), com código de país (12-13 dígitos)
- [x] Criar testes vitest (pix-key-detection.test.ts) - 15 testes passando


## Correção do foco no botão "Meus pedidos" no Step 2 do Onboarding
- [x] Adicionar ring highlight no botão "Meus pedidos" igual ao Step 1 (ring-4 ring-white/50 shadow-2xl)
- [x] Garantir que o botão fique com z-index elevado acima do overlay (z-[202])
- [x] Overlay escurece conteúdo do modal (header+body) deixando footer/botão visível
- [x] Esconder botões de avaliar durante Step 2 para não distrair

## Ajuste posição e estilo do tooltip/foco no Step 2 (idêntico ao Step 1)
- [x] Tooltip posicionado com bottom-full + mb-3 (idêntico ao Step 1)
- [x] Botão com ring-4 ring-white/50 shadow-2xl z-[201] (idêntico ao Step 1)
- [x] Setinha do tooltip apontando para o botão
- [x] Overlay bloqueador fixo z-[199] + overlay escuro z-[200] (idêntico ao Step 1)
- [x] Removido overlay interno do modal que não era necessário


## Onboarding do menu público não aparece no mobile
- [x] Investigar: tooltips usavam `absolute bottom-full` cortado pelo `overflow-hidden` do container
- [x] Corrigir Step 1: tooltip movido para dentro do fluxo normal (entre body e footer)
- [x] Corrigir Step 2: tooltip movido para dentro do fluxo normal (antes do footer do tracking)
- [x] Remover constantes não utilizadas (onboardingPedidoVisto, onboardingStep2Visto)

## Onboarding mobile - investigação profunda (não funciona no mobile)
- [x] Debug visual confirmou: orderSent=true mas onboardingStep=0 no mobile (setTimeout não dispara)
- [x] Causa: setTimeout dentro do onSuccess da mutation é cancelado por re-renders no mobile (setCart([]) causa re-render massivo)
- [x] Correção: Substituir setTimeout por useEffect que reage a orderSent=true
- [x] Remover setTimeout de ambos os fluxos (normal e pagamento online)
- [x] Remover debug visual temporário

## Remover onboarding do menu público
- [x] Remover estados onboardingStep, onboardingStep2SubStep, showOnboardingTooltip
- [x] Remover useEffect do onboarding
- [x] Remover tooltips e overlays dos Steps 1, 2 e 3
- [x] Remover condições de onboarding nos botões e modais
- [x] Remover referências a localStorage onboarding_meus_pedidos

## Bug: Botão PIX nativo do WhatsApp não está sendo enviado
- [x] Causa: sendPixButton estava no bloco if(false) desabilitado, não na função de background ativa
- [x] Correção: Adicionado sendPixButton na função processOrderNotificationInBackground

## Cashback: exibir valor em R$ em vez de porcentagem no menu público
- [x] Encontrar onde o cashback é exibido nos itens do menu público (ProductCard)
- [x] Calcular o valor em R$ com base no preço do item e na porcentagem de cashback
- [x] Exibir ex: "+R$ 2,00 cashback" em vez de "+2% cashback"

## Efeito shimmer no badge de cashback do menu público
- [x] Adicionar animação shimmer (banner-shimmer) no badge de cashback dos itens
## Cor do blur do plano Pro na página de Planos
- [x] Alterar cor do blur do plano Pro de azul para vermelho (cor do sistema)
## Bug: Notificações não chegam ao admin após otimização fire-and-forget
- [ ] Investigar por que notificações, som e SSE não funcionam após pedido pelo menu público
- [ ] Corrigir processamento em background para garantir que notificações cheguem ao admin
- [x] Corrigir sistema líder/seguidor SSE - detectar líder morto e assumir liderança automaticamente
- [x] Remover sistema líder/seguidor SSE e usar conexão independente por aba
- [x] Diagnosticar fluxo SSE → handler → estado → UI para notificações de novos pedidos
- [x] Schema: Adicionar campos freeOnDelivery, freeOnPickup, freeOnDineIn na tabela complementItems
- [x] Backend: Atualizar db.ts para retornar e salvar os novos campos de gratuidade
- [x] Backend: Atualizar routers.ts para expor os novos campos nas queries de complementos
- [x] UI Admin: Toggle Grátis com checkboxes expandíveis no InlineComplementsDropdown
- [x] UI Admin: Sincronizar com página /complementos (gestão global)
- [x] Menu Público: Lógica de preço condicional por deliveryType (badge GRÁTIS)
- [x] PDV Mesas: Aplicar gratuidade para dine_in
- [x] PDV Mobile: Aplicar gratuidade conforme tipo de pedido
- [x] Backend: Validação de preço na criação de pedidos considerando contexto
- [x] Impressão: Mostrar GRÁTIS no cupom para complementos gratuitos por contexto

## Forçar escolha do tipo de entrega antes de adicionar itens ao carrinho
- [ ] Analisar fluxo atual do deliveryType no menu público
- [ ] Implementar modal/tela obrigatória de seleção do tipo de entrega ao abrir o menu
- [ ] Bloquear adição de itens ao carrinho até tipo de entrega ser selecionado
- [ ] Recalcular preços dos complementos quando tipo de entrega mudar
- [ ] Escrever testes unitários

## Modal obrigatório de tipo de entrega ao clicar em produto (v2)
- [x] Adicionar estado deliveryTypeChosen para controlar se tipo de entrega já foi escolhido
- [x] Guardar produto pendente (pendingProduct) para abrir após seleção
- [x] Interceptar clique em produto: se não escolheu tipo de entrega e há múltiplas opções, abrir modal primeiro
- [x] Criar modal bonito "Como deseja receber?" com opções Delivery/Retirada/Consumo no local
- [x] Após selecionar tipo de entrega, abrir automaticamente o modal do produto pendente
- [x] Pré-selecionar forma de entrega no checkout step 1 com a escolha feita
- [x] Auto-selecionar quando só há 1 opção de entrega (sem modal)
- [x] Testes unitários (21 testes passando)

## Alerta ao mudar forma de entrega no checkout com complementos afetados
- [x] Detectar quando o tipo de entrega muda no checkout step 1
- [x] Comparar preços dos complementos no carrinho entre o tipo antigo e o novo
- [x] Mostrar alerta visual listando os complementos cujo preço mudou (ficou grátis ou deixou de ser grátis)
- [x] Recalcular o total do carrinho automaticamente
- [x] Testes unitários (36 testes passando)

## Bug: Modal Meus Pedidos muito alto no mobile
- [x] Limitar altura máxima do modal Meus Pedidos para 80vh no mobile

## Revisão de altura dos modais no mobile (menu público)
- [x] Identificar todos os modais com max-h superior a 80vh (12 modais encontrados)
- [x] Ajustar modais do fluxo de pedidos para max-h-[80vh] no mobile (todos os 12 ajustados)

## Bug: Botão Adicionar bypassa complementos no PDV/Mesas
- [x] Verificar lógica do botão Adicionar na página /pdv (corrigido com handleQuickAdd)
- [x] Verificar lógica do botão Adicionar na página /mesas (PDVSlidebar corrigido com handleQuickAdd)
- [x] Verificar lógica do botão Adicionar na versão mobile de /mesas (MobilePDVModal já estava correto)
- [x] Verificar lógica do botão Adicionar na busca do PDV (usa mesmo grid, corrigido)
- [x] Verificar lógica do botão Adicionar na busca das mesas (usa mesmo grid, corrigido)
- [x] Corrigir: itens com complementos devem abrir modal de detalhes em vez de adicionar direto
- [x] Testes unitários (17 testes passando)

## Optimistic update híbrido para pedidos via SSE
- [x] Criar função normalizeSSEOrder para preencher campos faltantes do SSE com defaults
- [x] Alterar handleNewOrder no Pedidos.tsx para inserir pedido no cache imediatamente via setData
- [x] Invalidar orders.list em background após inserção (sem flicker)
- [x] Garantir deduplicação (verificar por id antes de inserir)
- [x] Manter ordenação por createdAt desc
- [x] Aplicar mesma lógica no NewOrdersContext para consistência global
- [x] Testes unitários para normalizeSSEOrder e lógica de deduplicação (15 testes passando)
- [x] Traduzir deliveryType no endpoint GET /api/bot/orders/:id (deliveryTypeLabel)
- [x] Criar endpoint GET /api/bot/location que retorna localização do restaurante com link Google Maps
- [x] Adicionar documentação do endpoint GET /api/bot/location na página do Bot WhatsApp
- [x] Dashboard: Card "Top Produtos" - ranking dos 10 mais vendidos com barra visual
- [x] Dashboard: Card "Pedidos por Modalidade" - gráfico donut (Entrega vs Retirada vs Consumo no local)
- [x] Dashboard: Card "Tempo Médio de Preparo" - tempo médio do pedido até finalizado
- [x] Inserir dados mockados para popular os 3 novos cards da dashboard (Top Produtos, Modalidade, Tempo Médio)
- [x] Corrigir dados mockados para aparecerem no estabelecimento 30001 (produção)
- [x] Redesenhar card "Pedidos por Modalidade" no estilo barras horizontais com percentuais grandes (sem donut)
- [x] Adicionar botão de tempo médio de preparo na top bar (desktop only), ícone relógio + tempo em minutos
- [x] Redesenhar card Pedidos por Modalidade v2: barras individuais, borda pontilhada, percentuais grandes, cores degradê
- [x] Alterar cores do card Pedidos por Modalidade para usar as mesmas cores do card de formas de pagamento (Finanças)
- [x] Card Pedidos por Modalidade: linhas pontilhadas alinhadas com final da barra colorida (proporcional ao %)
- [x] Card Pedidos por Modalidade: header com ícone + título + descrição (igual ao Acumulado da semana)
- [x] Card Pedidos por Modalidade: labels com cor correspondente à barra (Delivery=violet, Retirada=blue, Consumo=emerald)
- [x] Card Clientes Recorrentes vs Novos: criar query backend para calcular % recorrentes e novos (últimos 30 dias)
- [x] Card Clientes Recorrentes vs Novos: implementar layout visual estilo Customer Insights com barras verticais finas
- [x] Card Clientes Recorrentes vs Novos: posicionar abaixo do Pedidos por Modalidade dividindo espaço vertical
- [x] Card Clientes Recorrentes vs Novos: header com ícone + título + descrição (mesmo estilo)
- [x] Card Clientes Recorrentes vs Novos: responsividade (desktop horizontal, mobile empilhado)
- [x] Botão tempo médio na top bar: alterar cor para verde (cor do sistema)
- [x] Card Top Produtos: reestilizar com mesmo visual do card Formas de Pagamento (Finanças)
- [x] Card Top Produtos: mostrar 7 itens visíveis + 3 via scroll interno
- [x] Card Top Produtos: ajustar para 6 itens visíveis e eliminar espaço em branco
- [x] Card Top Produtos: forçar max-height fixo reduzido 40% para scroll interno real
- [x] Card Top Produtos: voltar para 10 itens com scroll interno sem aumentar altura do card
- [x] Card Top Produtos: altura fixa do card com max-height na lista para scroll interno (10 itens, ~7 visíveis)
- [x] Card Top Produtos: insight de % do faturamento dos top 10 produtos sobre o faturamento total do período
- [x] Card Top Produtos: alinhar texto de insight horizontalmente com o texto do card Perfil de Clientes
- [x] Top 10: sistema de cores em degradê baseado no ranking (verde→amarelo→laranja→vermelho)
- [x] Card Tempo Médio: redesenhar com header padronizado (ícone + título + subtítulo) igual aos outros cards
- [x] Card Faturamento por Hora: criar novo card com gráfico de linha suave (line chart) abaixo do Tempo Médio
- [x] Backend: criar endpoint para faturamento por hora do dia
- [x] Cards Dashboard: definir alturas fixas para consistência independente do período selecionado (Modalidade=Tempo Médio=196px, Clientes=Faturamento=306px)
- [x] Card Pedidos por Modalidade: corrigir empty state para caber na altura fixa de 196px
- [x] Card Faturamento por Hora: adicionar ícone ao empty state para seguir o mesmo padrão dos outros cards
- [x] PDV: Alterar seleção de modalidade de 3 cards separados para um único componente pill/tab sem ícones
- [x] PDV: Adicionar animação de transição suave (sliding pill) ao seletor de modalidade
- [x] PDV: Mover seleção de forma de pagamento para botão com ícone ao lado direito do botão Cupom, mesmo estilo outline com ícone vermelho
- [x] Bug: Tooltip do item 'Pedidos' não aparece no menu lateral minimizado (hover)
- [x] Dashboard: Adicionar mini gráfico sparkline de tendência ao card Tempo Médio
- [x] Dashboard: Adicionar texto de insight no card Tempo Médio (ex: "3 min mais rápido que ontem")
- [x] Dashboard: Centralizar verticalmente o sparkline do card Tempo Médio no lado direito
- [x] Dashboard: Redesenhar card Tempo Médio com KPI numérico moderno (sem ring gauge), número grande + contexto + sparkline à direita
- [x] Pedidos: Adicionar botão 'Finalizar' ao modal de Entregador responsável para permitir que o atendente finalize o pedido
- [x] Dashboard: Redesenhar card Pedidos Recentes - header padronizado com ícone, badges coloridos, itens resumidos, valor em destaque, tempo com cor automática
- [x] Dashboard: Pedidos Recentes - badges de status com cores mais claras e destaque visual
- [x] Dashboard: Pedidos Recentes - valor do pedido com fonte mais forte
- [x] Dashboard: Pedidos Recentes - itens resumidos (primeiro item + "+X itens")
- [x] Dashboard: Pedidos Recentes - tempo desde chegada com cor automática (verde/amarelo/vermelho)
- [x] Dashboard: Pedidos Recentes - pedidos novos sempre no topo da lista
- [x] Bug: Card Pedidos Recentes mostra ID interno (#990088) em vez do número do pedido formatado (#P23)
- [x] Dashboard: Tornar pedidos clicáveis no card Pedidos Recentes para abrir sidebar de Detalhes do Pedido
-- [x] Card Pedidos Recentes: tempo movido para mesma linha dos itens (à direita), abaixo do valor do pedido
- [x] Adicionar timeline com dots coloridos na lateral esquerda das linhas da tabela do card Pedidos Recentes] Dashboard: Adicionar estilo de timeline vertical ao card Pedidos Recentes com ponto colorido por status e linha conectora
- [x] Dashboard: Redesenhar card Pedidos Recentes com layout de tabela (Pedido, Status, Item, Tempo, Valor)
- [x] Dashboard: Adicionar botão "Ver todos" no header do card Pedidos Recentes
- [x] Dashboard: Implementar contador em tempo real no tempo de espera (atualiza a cada minuto)
- [x] Dashboard: Limitar card Pedidos Recentes a no máximo 10 pedidos
- [x] Dashboard: Remover coluna Status do card Pedidos Recentes (dot colorido da timeline já indica o status)
- [x] Dashboard: Alterar limite de pedidos recentes de 5 para 10 (backend + frontend)
- [x] Dashboard: Alterar limite de pedidos recentes de 10 para 7
- [x] Dashboard: Corrigir timeline do card Pedidos Recentes - adicionar linha vertical contínua conectando os dots
- [x] Card Últimos 7 dias: Adicionar KPI principal com total de pedidos da semana acima do gráfico
- [x] Card Últimos 7 dias: Mostrar variação percentual em relação à semana anterior
- [x] Card Últimos 7 dias: Exibir melhor dia da semana e média diária
- [x] Card Últimos 7 dias: Melhorar tooltip do gráfico com número de pedidos e comparação com média
- [x] Card Últimos 7 dias: Adicionar linha horizontal de média semanal no gráfico
- [x] Card Últimos 7 dias: Padronizar header no mesmo estilo do card Pedidos Recentes (ícone + título + subtítulo)
- [x] Tempo de Preparo: Converter modal para sidebar deslizante pela direita (estilo detalhes do pedido, 15% mais larga, bg branco)
- [x] Card Pedidos: Adicionar filtro de período (7 dias, 14 dias, 30 dias) para análise flexível
- [x] Card Pedidos: Incluir comparação visual lado a lado com período anterior no gráfico
- [x] Backend: Endpoint flexível com parâmetro de período e dados do período anterior para comparação
- [x] Sidebar Tempo de Preparo: Remover botão de fechar (X) e substituir por dropdown de filtro
- [x] Sidebar Tempo de Preparo: Dropdown com mesmos filtros da Dashboard (Hoje, Esta semana, Este mês)
- [x] Sidebar Tempo de Preparo: Sincronizar filtro com o filtro selecionado na Dashboard
- [x] Tempo Médio: Alterar cálculo de createdAt→completedAt para acceptedAt→readyAt (aceito→pronto)
- [x] Tempo Médio: Atualizar subtítulo e labels no frontend para refletir nova métrica
- [x] Schema: Adicionar campos acceptedAt e readyAt na tabela orders
- [x] Backend: Atualizar fluxo de mudança de status para registrar acceptedAt e readyAt automaticamente
- [x] Bug: Corrigir duplo ## no número do pedido em "Pior tempo da semana" na sidebar Tempo de Preparo
- [x] Top bar: Adicionar tooltip no botão "Avaliação gratuita: X dias"
- [x] Top bar: Adicionar tooltip no botão "Ver menu"
- [x] Top bar: Adicionar tooltip no botão de tempo de preparo dos pedidos (3min)
- [x] Top bar: Tooltips desaparecem após primeiro clique (persistir via localStorage)
- [x] Top bar: Aumentar largura do campo de busca em 20%
- [x] Dashboard: Adicionar hover/tooltip informativo no card Perfil de Clientes
- [x] Dashboard: Adicionar HoverCard informativo no card Tempo Médio
- [x] Dashboard: Adicionar HoverCard informativo no card Pedidos por Modalidade
- [x] Dashboard: Adicionar HoverCard informativo no card Top 10 Mais Vendidos
- [x] Dashboard: Padronizar estado vazio do card Pedidos Recentes (mesmo estilo dos outros cards)
- [x] Dashboard: Padronizar estado vazio do card Pedidos Últimos 7 dias (mesmo estilo dos outros cards)
- [x] Top bar: Campo de busca deve funcionar também na página /pdv (Frente de Caixa)
- [x] PDV: Remover campo de busca local (abaixo das categorias) pois a top bar já faz a busca
- [x] Menu público: Itens com preço 0 só devem mostrar "Grátis" se priceMode=free, não por ter preço zero
- [x] PDV: Adicionar cabeçalho do carrinho com título dinâmico, contagem de itens e descrição contextual

- [x] Padronizar cabeçalho do carrinho na PDVSlidebar (Mapa de Mesas) igual ao PDV (ícone, título, descrição, badge, botões de modo com ícones)
- [x] Corrigir cores hardcoded no cabeçalho do carrinho (PDV e PDVSlidebar) para suportar modo escuro
- [x] Investigar delay de 3-4s ao abrir detalhes do pedido vindo da Dashboard
- [x] Adicionar skeleton de carregamento na sidebar de detalhes do pedido
- [x] Adicionar dropdown de motivos rápidos pré-definidos no modal de cancelamento de pedido
- [x] Tela de boas-vindas/onboarding: endpoint backend para verificar status de configuração
- [x] Tela de boas-vindas/onboarding: componente visual com checklist de primeiros passos
- [x] Tela de boas-vindas/onboarding: lógica de exibição condicional (primeiro acesso ou sem produtos)
- [x] Configurações Impressora: Unificar abas Layout e Fontes em uma só aba
- [x] Configurações Impressora: Ocultar aba Logs
- [x] Menu lateral Configurações: Adicionar badge "Breve" no item Pagamento Online
- [x] Onboarding: Adaptar layout para desktop com grid de 2 colunas e menos espaço vertical
- [x] Onboarding desktop: Redesenhar como modal wizard com sidebar de passos e detalhes à direita
- [x] Onboarding desktop: Barra de progresso minimizada quando modal é fechado, com botão para reabrir
- [x] Onboarding modal: Ajustar cores para identidade visual Mindi (vermelho em vez de preto/zinc/verde)
- [x] Animação de confetti ao completar todos os passos do checklist de onboarding
- [x] Bug: Modal de onboarding não aparece para novas contas (localStorage compartilhado entre contas - corrigido com chave por establishment)
- [x] Onboarding: Passo 'Conectar WhatsApp' deve redirecionar para /pedidos e abrir modal de conexão WhatsApp automaticamente
- [x] Padronizar barra minimizada do onboarding no estilo do banner 'produto sem foto' (ícone, texto 2 linhas, botão ação, botão X)
- [x] Onboarding desktop: Converter de modal central para sidebar (sheet) lateral com cabeçalho vermelho, progresso segmentado, cards expandíveis
- [x] Onboarding sidebar: Tornar fundo mais claro com degradê suave e efeito glow
- [x] Onboarding sidebar: Remover título 'Mindi Setup' e colocar 'Primeiros Passos' + descrição junto ao botão X com ícone foguete
- [x] Remover criação automática de categoria e produto padrão ao criar conta
- [x] Onboarding sidebar: Bloquear pulos — usuário deve finalizar passo atual antes de ir ao próximo
- [x] Onboarding sidebar: Implementar toast "Complete o passo anterior primeiro" nos passos bloqueados
- [x] Onboarding sidebar: Implementar animação de desbloqueio (scale + glow) quando passo é concluído
- [x] Cardápio: Sem categorias mostra apenas botão 'Criar Categoria' (esconde '+ item'), com categorias mostra ambos botões
- [x] Botão "Ver Menu" só deve aparecer quando o utilizador tiver pelo menos 1 categoria e 1 produto criado
- [x] Onboarding sidebar: Reduzir tamanho do card "Progresso Total" em 20%
- [x] Onboarding de criação de conta: Remover campo de horário de atendimento do formulário inicial
- [x] Bug: Conta nova já vem com categoria e produto de teste criados automaticamente — era dados órfãos de ID reutilizado
- [x] Bug fix: Limpar dados órfãos do establishment 210009 (categoria e produto de teste)
- [x] Bug fix: createEstablishment deve limpar dados residuais ao reutilizar IDs (categorias, produtos, etc.)
- [x] Bug: Cache tRPC/React Query mostra dados da conta anterior ao criar nova conta — adicionado headers no-cache na API + invalidação total do cache + limpeza localStorage ao criar conta
- [x] Bug: Passo "Configurar atendimento" do onboarding já vem marcado como concluído — removida criação automática no backend + valores padrão vazios no frontend
- [x] Bug: Passo "Configurar atendimento" do onboarding redireciona para aba Configurações → Estabelecimento em vez de Configurações → Atendimento
- [x] Scroll automático para o card de horários de funcionamento ao acessar aba Atendimento pelo onboarding
- [x] Bug: Sidebar de onboarding não atualiza em tempo real ao completar tarefa — invalidar/refetch checklist após cada mutation relevante
- [x] Sidebar Primeiros Passos: Garantir reabertura automática sempre que um novo passo é concluído
- [x] Animação de desbloqueio: scale + glow vermelho no próximo passo ao concluir um passo
- [x] Celebração na sidebar: tela de parabéns com Trophy, degradê festivo, confetis e botão "Ir para o Dashboard" ao concluir todos os passos (auto-dismiss 12s)
- [x] Onboarding: Ao clicar "Começar este passo" no passo "Criar primeira categoria", abrir automaticamente o modal de Nova Categoria na página Catálogo
- [x] Onboarding: Alterar texto do botão do passo "Criar primeira categoria" de "Começar este passo" para "Criar Categoria"
- [x] Onboarding: Ao clicar "Adicionar Produto" no passo "Adicionar primeiros produtos", abrir automaticamente o sheet de criação de produto na página Catálogo
- [x] Onboarding: Mover passo "Testar um pedido" para a última posição do checklist (após "Adicionar foto e capa")
- [x] Onboarding: Remover card de "Progresso Total" (barra segmentada + contador) da sidebar Primeiros Passos
- [x] Onboarding: Adicionar indicador de progresso textual "X de 6 passos" ao lado do subtítulo na sidebar Primeiros Passos
- [x] Bug: Celebração com confetti não aparece ao completar o último passo do onboarding — sidebar desaparece imediatamente
- [x] Produto: Tornar seleção de categoria obrigatória no sheet de criação/edição — não permitir salvar sem categoria selecionada
- [x] Produto: Remover opção "Sem categoria" do dropdown de categorias no sheet de criação/edição
- [x] PDV: Aumentar tamanho do cabeçalho do carrinho (título, subtítulo, ícone) e dos 3 botões de tipo de pedido (Consumo, Retirada, Entrega)
- [x] PDV: Remover ícone ShoppingBag (sacola vermelha) ao lado do título "Carrinho" no cabeçalho do carrinho
- [x] Sidebar: Alterar borda da foto do restaurante para vermelho claro visível (revertido para original a pedido do usuário)
- [x] Mesas: Alinhar cabeçalho do carrinho (título, subtítulo, botões) com o mesmo tamanho do PDV e remover ícone ShoppingBag
- [x] Onboarding: Impedir que a sidebar de Primeiros Passos feche ao clicar fora — só deve fechar pelo botão X
- [x] Top bar: Reverter botão "Ver Menu" para aparecer sempre, sem exigir categoria e produto cadastrados
- [x] Configurações: Remover card "Notificações SMS" e mover card "Pedidos" para o lugar dele (ao lado de Formas de pagamento)
- [x] Auth: Alterar fluxo "Esqueceu a senha" — ao inserir email correto, mostrar campos para inserir e confirmar nova senha directamente (temporário, sem link de recuperação)
- [x] Auth: Reverter fluxo "Esqueceu a senha" para o estado original (enviar link de recuperação)
- [x] Onboarding: Mover passo "Adicionar foto e capa" para antes de "Conectar WhatsApp" (nova ordem: categoria → produtos → atendimento → foto/capa → whatsapp → testar pedido)
- [x] Bug: Sidebar Primeiros Passos abre/fecha/abre novamente ao completar uma tarefa — comportamento de flickering
- [x] Bug: Ícone não aparece acima da mensagem "Seu restaurante está pronto" na tela de celebração (Parabéns) da sidebar Primeiros Passos
- [x] Onboarding: Passo "Testar um pedido" deve redirecionar para o menu público (não PDV) e só marcar como concluído quando receber o primeiro pedido pelo menu
- [x] Onboarding: Adicionar novo passo "Ativar notificação sonora" — ao ativar, o passo é concluído
- [x] Onboarding: Criar botão flutuante global (FAB) com ícone de foguete no canto inferior direito, visível em todas as páginas, que abre a sidebar ao clicar
- [x] Onboarding: Sidebar deve reabrir automaticamente ao completar um passo em qualquer página (não apenas na Dashboard)
- [x] Onboarding: Manter barra de "Configuração Inicial" na Dashboard enquanto os passos não estiverem todos concluídos
- [x] Bug: Sidebar Primeiros Passos abre/fecha/abre novamente ao completar um passo — deve abrir apenas uma vez
- [x] FAB deve aparecer em todas as páginas incluindo Dashboard
- [x] WelcomeChecklist só deve abrir pelo FAB (não automaticamente)
- [x] Corrigir flickering: sidebar abre/fecha/abre ao completar passo
- [x] Bug: Som não toca ao ativar notificação sonora no passo do onboarding — marca como concluído mas não ativa o som
- [x] Bug: Sidebar de Primeiros Passos ainda abre/fecha/abre ao completar um passo (flickering persiste)
- [x] Bug: Sidebar Primeiros Passos não abre automaticamente para novos utilizadores ao criar conta e entrar pela primeira vez
- [x] Bug: Flickering persiste — sidebar fecha e reabre ao completar tarefa (estado resetado ou disparado duas vezes)
- [x] Bug: Sidebar de celebração (confetti + Parabéns) não abre ao completar todos os passos do onboarding
- [x] Bug: Passo "Conectar WhatsApp" demora a atualizar após conexão bem-sucedida — deve marcar como concluído imediatamente
- [x] Bug: WhatsApp ainda demora a atualizar no checklist após conexão (invalidate pode não estar funcionando)
- [x] Bug: Celebração com confetti ainda não aparece ao completar todos os passos do onboarding
- [x] Remover auto-dismiss de 12s da celebração do onboarding — utilizador fecha manualmente pelo botão ou X
- [x] Reduzir largura da barra de WhatsApp desconectado em 33%
- [x] Bug: Passo "Conectar WhatsApp" do onboarding só atualiza ao navegar para outra página — deve atualizar imediatamente após conexão
- [x] Onboarding: Passo "Adicionar primeiros produtos" deve abrir directamente a sidebar de Novo Produto ao clicar no botão (já implementado via ?action=new-product)
- [x] Bug: Passo "Adicionar foto e capa" do onboarding não redireciona para a aba de estabelecimento nas configurações
- [x] Bug (persistente): Passo "Conectar WhatsApp" do onboarding ainda não atualiza imediatamente após conexão — corrigido: invalidate adicionado no Pedidos.tsx (onde o utilizador realmente conecta o WhatsApp)
- [x] Admin: Recriar utilizador djigorlousada@hotmail.com para o estabelecimento 210008
- [x] Bug: Taxa de entrega "Por Bairros" — ao salvar, os bairros cadastrados são limpos/apagados (corrigido: substituída lógica de mutations individuais por batch sync)
- [x] Remover texto "Esta tela fechará automaticamente em alguns segundos" da sidebar de Parabéns do onboarding
- [x] Menu Público: Spotlight/Overlay no ícone ≡ após primeiro pedido do cliente para guiá-lo a abrir o menu lateral
- [x] Spotlight: Não fechar ao clicar fora — só fecha via botão "Abrir Menu" ou ícone hamburger
- [x] Spotlight: Mostrar itens condicionalmente (Avaliações se ativo, Cupons se fidelidade ativo, Cashback se ativo)
- [x] Admin: Atualizar user ID 1471505 — email para gauteriocristinedeise283@gmail.com e nome para Deise
- [x] Bug: Ao alterar nome do responsável em Configurações, o avatar de perfil no header não atualiza (corrigido: adicionado refetch explícito do auth.me + invalidate do getAccountData)
- [x] Bug: Alterar nome do responsável no estabelecimento 210008 (user 1471505) não atualiza avatar — corrigido: causa raiz era que ownerDisplayName não era atualizado junto com responsibleName; agora updateAccountData atualiza users.name + establishments.ownerDisplayName + invalidate do establishment.get no frontend
- [x] Menu Público: Descrição do produto com "Ver mais / Ver menos" — limitar a 3 linhas com line-clamp-3 e link clicável para expandir/recolher
- [x] Permitir clicar no texto da descrição para expandir/recolher (além do botão Ver mais/Ver menos)
- [x] Menu Público: Sticky header nos grupos de complementos — nome do grupo fica fixo no topo do modal enquanto o utilizador faz scroll pelos itens do grupo
- [x] Menu Público: Header sticky do grupo de complementos deve ficar mais próximo da borda da foto, escondendo itens que aparecem entre a foto e o header
- [x] Bug: Borda superior do grupo de complementos não aparece — pseudo-elemento branco está a cobrir a borda de cima do rounded-xl
- [x] Menu Público: Bloquear scroll para próximo grupo se grupo obrigatório actual não estiver completo
- [x] Menu Público: Tarja vermelha no header do grupo informando "Falta(m) X complemento(s) obrigatório(s)"
- [x] Menu Público: Mover tarja vermelha de complementos faltantes para fora do header — barra vermelha sólida entre o header e os itens do grupo (estilo iFood)
- [x] Menu Público: Mover tarja vermelha para o footer do modal — acima da borda superior do botão Adicionar (não dentro dos grupos) [revertido]
- [x] Menu Público: Remover tarja vermelha de complementos faltantes do modal (não é necessária)
- [x] Menu Público: Itens de complementos devem desaparecer por baixo do header sticky ao scroll (não aparecer por cima)
- [x] Menu Público: Restaurar visual original dos grupos de complementos (borda arredondada, fundo cinza claro no header) mantendo sticky funcional
- [x] Menu Público: Substituir texto técnico "Mín: X | Máx: X" por texto dinâmico humano (Escolha X opções, Escolha até X opções, etc.)
- [x] Menu Público: Adicionar contador visual de seleção em tempo real (ex: "1 / 2 selecionados")
- [x] Menu Público: Remover contador visual de seleção (não é necessário)
- [x] Menu Público: Aumentar tamanho do ícone de estrela e texto de quantidade de avaliações
- [x] DB: Adicionar campo description (texto opcional) na tabela de complementos
- [x] Admin: Adicionar campo de descrição no formulário de cadastro/edição de complementos
- [x] Menu Público: Exibir descrição do complemento abaixo do nome (texto menor, cinza, opcional)
- [x] Bug: Query na tabela complementItems falha nas páginas /catalogo e /complementos — coluna description não existia no banco remoto; migração aplicada manualmente via ALTER TABLE
- [x] Bug: Erro "No values to set" na página /complementos — corrigido: adicionado description ao updateGlobal + proteção contra update vazio
- [x] Menu Público: Reorganizar layout do complemento — botões +/- e preço na linha do título, descrição abaixo em linha separada para evitar layout quebrado com nomes longos
- [x] Menu Público: Mover botões +/- para a linha da descrição do complemento, ao lado direito
- [x] Menu Público: Complementos sem descrição devem manter botões +/- na linha do nome (layout original); só com descrição usar segunda linha
- [x] Grupos: Clicar no card do complemento deve abrir o dropdown de detalhes (igual à setinha)
- [x] Complementos: Clicar no card do complemento na página /complementos deve abrir o dropdown de detalhes (igual à setinha)
- [x] Complementos: Igualar visual do campo de descrição na página /complementos ao visual da /catalogo (textarea grande, título com ícone de lápis, botão vermelho, corrigir caracteres unicode)
- [x] Catalogo + Complementos: Adicionar ícone FileText cinza discreto ao lado do nome do complemento quando tem descrição cadastrada
- [x] Catalogo + Complementos: Adicionar tooltip ao ícone FileText que exibe a descrição completa ao passar o mouse
- [x] Catalogo + Complementos: Botão "Editar" só aparece no hover do card (desktop), escondido por padrão
- [x] Catalogo + Complementos: Adicionar separador "|" antes do ícone FileText (ex: Nome | ícone)
- [x] Bug: Card "Bem-vindo ao Mindi" aparece acima da Dashboard no mobile — corrigido: esconder mobile card quando renderizado pelo OnboardingFAB
- [x] Sidebar desktop do WelcomeChecklist: Aplicar visual do card mobile Bem-vindo ao Mindi (header limpo, barra de progresso, ícones suaves) — apenas visual
- [x] Redesenhar página de Parabéns (celebration) no estilo limpo do Bem-vindo ao Mindi — sem gradiente pesado, fundo claro, ícones suaves
- [x] Celebration: Transformar modal de Parabéns de sidebar/card para Dialog centralizado na tela (desktop e mobile)
- [x] Celebration: Atualizar texto do modal com lista de benefícios (compartilhar cardápio, receber pedidos, gerenciar pedidos)
- [x] Celebration: Substituir barra de progresso verde por texto "Setup completo — 7 de 7 etapas concluídas"
- [x] Celebration: Adicionar botão "Compartilhar Cardápio" com ícone de compartilhar abaixo do botão Dashboard
- [x] Celebration: Criar modal de compartilhamento overlay com link do cardápio, botão Copiar link e botão Compartilhar no WhatsApp
- [x] Stories: Schema DB (tabela stories com establishmentId, imageUrl, fileKey, createdAt, expiresAt)
- [x] Stories: Helpers DB (create, list, delete, listActive, cleanup expirados)
- [x] Stories: Rotas tRPC protegidas (upload com compressão, listar, deletar) e rota pública (listar ativos)
- [x] Stories: Painel admin — card "Stories do Menu" com cards redondos estilo Instagram, botão +, upload, preview, excluir, limite 5
- [x] Stories: Visualizador fullscreen no menu público estilo Instagram (barras progresso, auto-avanço 5s, toque lateral, botão fechar)
- [x] Stories: Borda degradê estilo Instagram e animação pulsante no logo do menu público quando há stories ativos
- [x] Stories: Compressão de imagens (max 1080px largura) no upload
- [x] Stories: Expiração automática 24h
- [x] Bug: Tabela stories não existe no banco - executar migration db:push (criada via SQL direto)
- [x] Story Analytics: Schema DB (tabela storyViews com storyId, sessionId, viewedAt)
- [x] Story Analytics: Helpers DB (registar view, contar views por story, contar views totais por establishment)
- [x] Story Analytics: Rota tRPC pública para registar view de story
- [x] Story Analytics: Rota tRPC protegida para obter analytics de views por story
- [x] Story Analytics: Registar view no StoryViewer do menu público (1 view por sessão por story)
- [x] Story Analytics: Exibir contagem de views em cada story no painel admin
- [x] Stories: Borda cinza no logo do menu público quando usuário já visualizou todos os stories (igual Instagram)
- [x] Stories: Resetar estado "visto" quando restaurante publicar novo story (comparação de IDs no sessionStorage)
- [x] Stories Admin: Substituir modal de preview por StoryViewer fullscreen (mesmo do menu público)
- [x] Stories: Ajustar header da página para ficar no padrão das demais páginas admin (descrição mais curta)
- [x] Stories: Ao abrir StoryViewer no menu público, ir direto para o primeiro story não visto (em vez de começar do início)
- [x] Stories: Corrigir header da página para ficar exatamente igual ao padrão do Dashboard (ícone + título bold + descrição cinza)
- [x] Stories: Corrigir espaçamentos da página para ficar no padrão das demais páginas admin
- [x] Substituir ícone de Stories de CircleDot para Clapperboard na sidebar e na página (ícone azul na página)
- [x] Bug: Borda dos stories no menu público não muda para cinza após visualizar todos (deve persistir com localStorage)
- [x] Stories: Melhorar long press para pausar (distinguir tap rápido de press longo, igual Instagram)
- [x] Stories Venda: Adicionar campo type (simple, product, promo) ao schema de stories
- [x] Stories Venda: Adicionar campos productId, promoTitle, promoText, promoPrice, promoExpiresAt ao schema
- [x] Stories Venda: Atualizar db.ts com helpers para criar/buscar stories com novos campos
- [x] Stories Venda: Atualizar routers.ts para aceitar novos campos na criação de stories
- [x] Stories Venda: Atualizar painel admin com seletor de tipo de story
- [x] Stories Venda: Adicionar seletor de produto do cardápio para tipo "Destacar produto"
- [x] Stories Venda: Adicionar campos de promoção (título, texto, preço, validade) para tipo "Promoção"
- [x] Stories Venda: Atualizar StoryViewer com botão "Ver produto" / "Pedir agora"
- [x] Stories Venda: Implementar overlay de promoção no StoryViewer (título, texto, preço, countdown)
- [x] Stories Venda: Integrar botão do story com abertura do modal de produto no cardápio
- [x] Stories Venda: Ocultar automaticamente stories de promoção expirados
- [x] Stories Venda: Escrever testes para novos tipos de stories
- [x] Bug: Coluna storyType no banco em vez de type — colunas faltantes adicionadas manualmente ao banco (migração não tinha sido aplicada)
- [x] Bug: Seletor de produto no CreateStoryDialog não encontra nenhum produto ao buscar (trpc.products.list → trpc.product.list)
- [x] Bug: Na segunda visualização dos stories, o segundo story (promoção) não carrega — corrigido com key dinâmica e pointer-events-none nos overlays
- [x] Bug: No mobile, tocar na direita do story fecha em vez de avançar para o próximo (overlays bloqueavam toques — corrigido com pointer-events-none)
- [ ] Bug: Seletor de produto no CreateStoryDialog voltou a mostrar "Nenhum produto encontrado" (mobile)
- [x] Bug: Segundo story não carrega no menu público — corrigido com handlers separados para touch/mouse, threshold 500ms, touch-none e pointer-events-none
- [x] Bug PERSISTENTE: No mobile, ao avançar do 1o story para o 2o, viewer fechava — corrigido com Pointer Events unificados + debounce + updater function no goNext
- [x] Bug: Ao navegar para o 2o story, barra de progresso 100% — corrigido com manualNavRef flag para evitar que cleanup do timer acumule elapsed ao navegar
- [x] Bug: Ao navegar para o 2o story, barra de progresso 100% — corrigido com manualNavRef flag
- [x] Reordenar menu sidebar: Stories acima de Cupons (Stories, Cupons, Campanhas)
- [x] Stories: Botão de ação (Ver produto / Pedir agora) no menu público com cor vermelha e animação pulsante
- [x] Stories: Melhorar overlay de promoção com fundo escuro sólido (bg-black/85 + backdrop-blur + rounded-t-2xl) para evitar conflito com texto da imagem
- [x] Stories Promoção: Adicionar campo priceBadgeStyle ao schema (circle, ribbon, top-center)
- [x] Stories Promoção: Atualizar db.ts e routers.ts para aceitar priceBadgeStyle
- [x] Stories Promoção: Seletor visual de estilo de badge no CreateStoryDialog
- [x] Stories Promoção: Renderizar badge no StoryViewer conforme estilo escolhido
- [x] Stories Promoção: Testes para price badge style (20 testes passando)
- [x] Stories: Adicionar passo de preview antes de publicar (tipo → imagem → detalhes → preview → publicar)
- [x] Stories: Preview realista mostrando como o story ficará no menu público (imagem, overlay, badge de preço, botão de ação)
- [x] Stories: Botão "Pré-visualizar" no passo de detalhes leva ao preview, botão "Publicar" só no preview
- [x] Stories: Testes para preview step (27 testes passando)
- [x] Bug: Badges de tipo dos stories cortados (overflow hidden) nos círculos da página admin de Stories — corrigido overflow-hidden para overflow-visible no botão pai
- [x] Stories Analytics: Criar tabela storyEvents no schema (story_id, event_type, product_id, order_id, order_value, session_id, timestamp)
- [x] Stories Analytics: Criar endpoints tRPC para registrar eventos (view, click, add_to_cart, order_completed)
- [x] Stories Analytics: Criar endpoint tRPC para buscar métricas agregadas por story (views, clicks, orders, revenue)
- [x] Stories Analytics: Implementar rastreamento no menu público — registrar clique no botão do story
- [x] Stories Analytics: Vincular pedido concluído ao story de origem (atribuição de conversão)
- [x] Stories Analytics: Painel de desempenho por story na página admin (views, clicks, orders, revenue)
- [x] Stories Analytics: Gráfico de vendas geradas por stories nos últimos 7 dias
- [x] Stories Analytics: Insight "Story mais performático da semana"
- [x] Stories Analytics: Insight "Stories geraram X% das vendas hoje"
- [x] Stories Analytics: Testes para analytics de stories (24 testes + 176 total passando)
- [x] Bug: Queries SQL de analytics de stories falhando — tabela storyEvents não existia no banco remoto, criada manualmente via SQL
- [x] Bug: Query salesChart falha com DATE() no Drizzle/TiDB — convertido todas as queries analytics para db.execute() com SQL raw + try/catch
- [x] Stories Analytics: Padronizar cards de métricas para o mesmo visual da Dashboard (usando StatCard e SectionCard)
- [x] Stories Analytics: Padronizar gráfico e insights para o mesmo estilo da Dashboard (ícones 10x10, text-base font-semibold, gap-6)
- [x] Stories: Padronizar card de Stories ativos para tabela com header icónico (padrão Dashboard) e colunas Views/Cliques/Pedidos/Vendas
- [x] SEO: Campo slug (menuSlug) já existe na tabela establishments
- [x] SEO: Endpoint getBySlug já existe no publicMenu router
- [x] SEO: Rota /menu/:slug já funciona no frontend
- [x] SEO: Implementar meta tags dinâmicas (title, description) via servidor SSR — middleware injecta no HTML
- [x] SEO: Implementar Schema.org Restaurant com menu no JSON-LD — com MenuSection e MenuItem
- [x] SEO: Implementar OpenGraph tags para compartilhamento no WhatsApp — og:type, og:title, og:image, etc.
- [x] SEO: Criar sitemap.xml automático com páginas de restaurantes e produtos
- [x] SEO: Criar robots.txt permitindo indexação das páginas públicas e bloqueando admin
- [x] SEO: Adicionar H1 com nome do restaurante e texto SEO automático na página
- [x] SEO: Otimizar carregamento de imagens (BlurImage já tem lazy loading, srcset, decoding async)
- [ ] SEO: Configurar gestão de slug na página de configurações do admin
- [x] SEO: Testes para endpoints de SEO (11 testes passando)
- [x] Bug: Cards de analytics de Stories (Cliques, Carrinho, Pedidos, Faturamento, Vendas, Top Story) desaparecem quando todos os stories são apagados — removida condição activeStories.length > 0 do painel de analytics

## Página Fidelização (Reorganização)
- [x] Criar nova página Fidelização com layout dedicado
- [x] Mover Programa de Recompensas da página Configurações para Fidelização
- [x] Adicionar item "Fidelização" no menu lateral sob Marketing (após Campanhas)
- [x] Adicionar rota /fidelizacao no App.tsx
- [x] Cards maiores e mais destacados para seleção do programa (Nenhum, Cartão Fidelidade, Cashback)
- [x] Configurações condicionais abaixo dos cards (mesmo comportamento atual)
- [x] Botão "Salvar Configurações" com mesmo comportamento
- [x] Remover seção Programa de Recompensas da página Configurações
- [x] Padronizar visual da página Fidelização com o mesmo padrão de header e cards da Dashboard

## Métricas de Desempenho na Página Fidelização
- [x] Criar procedure tRPC para métricas do Cartão Fidelidade (clientes com cartão, carimbos distribuídos, recompensas resgatadas, clientes fidelizados)
- [x] Criar procedure tRPC para métricas do Cashback (clientes com saldo, cashback distribuído, utilizado, saldo total)
- [x] Criar procedure tRPC para evolução da fidelização (últimos 30 dias)
- [x] Adicionar seção "Desempenho da Fidelização" com StatCards dinâmicos na página
- [x] Mostrar métricas diferentes conforme programa ativo (Cartão Fidelidade vs Cashback)
- [x] Mostrar mensagem quando nenhum programa estiver ativo
- [x] Adicionar gráfico de evolução da fidelização (últimos 30 dias)

## Reorganização Visual do Programa de Recompensas
- [x] Remover card grande com 3 opções de programa
- [x] Colocar status do programa ativo na mesma linha do título com botão Ativar/Configurar
- [x] Criar sidebar (Sheet) no estilo Primeiros Passos para escolha e configuração do programa
- [x] Dentro da sidebar: opções Cartão Fidelidade e Cashback com configurações abaixo
- [x] Manter toda a lógica e backend inalterados
- [x] Corrigir header do card Evolução da Fidelização para seguir padrão visual do card Acumulado da semana da Dashboard

## Histórico de Fidelização
- [x] Criar db helper para listar clientes com cartão fidelidade (nome, carimbos, progresso, data último carimbo)
- [x] Criar db helper para listar histórico de eventos de fidelidade (carimbo ganho, cartão completado)
- [x] Criar db helper para listar clientes com cashback (nome, saldo, cashback ganho, utilizado)
- [x] Criar db helper para listar histórico de eventos de cashback (ganhou, usou)
- [x] Criar procedures tRPC para histórico de fidelização (loyalty e cashback)
- [x] Adicionar seção Histórico de Fidelização na página (abaixo do gráfico de evolução)
- [x] Cartão Fidelidade: lista de clientes com barra de progresso visual e data do último carimbo
- [x] Cartão Fidelidade: histórico de eventos (carimbo ganho, cartão completado)
- [x] Cashback: lista de clientes com saldo, cashback ganho e utilizado
- [x] Cashback: histórico de eventos (ganhou cashback, usou cashback)
- [x] Destaque para clientes próximos de completar o cartão

## Paginação e Filtro por Período na Fidelização
- [x] Atualizar db helpers com suporte a paginação (offset/limit) para clientes e eventos
- [x] Atualizar db helpers com filtro de período (hoje, esta semana, este mês) para eventos
- [x] Atualizar procedures tRPC com parâmetros de paginação e filtro
- [x] Adicionar paginação na lista de Clientes Fidelizados (Cartão Fidelidade)
- [x] Adicionar paginação na lista de Clientes com Cashback
- [x] Adicionar paginação no Histórico de Fidelização (eventos loyalty)
- [x] Adicionar paginação no Histórico de Cashback (eventos cashback)
- [x] Adicionar filtro por período (hoje, esta semana, este mês) no Histórico de Fidelização
- [x] Adicionar filtro por período no Histórico de Cashback

## Layout 50/50 dos Cards de Histórico
- [x] Colocar cards "Clientes Fidelizados" e "Histórico de Fidelização" lado a lado (50%/50%) para Cartão Fidelidade
- [x] Colocar cards "Clientes com Cashback" e "Histórico de Cashback" lado a lado (50%/50%) para Cashback

## Visual de Stamps com Quadradinhos
- [x] Trocar barra de progresso linear por grid de quadradinhos (stamps) no card Clientes Fidelizados
- [x] Aplicar mesmo estilo nos cards de Clientes Perto da Recompensa

## Busca por Nome/Telefone nas Listas de Clientes
- [x] Atualizar db helper getLoyaltyCardClients com parâmetro de busca (nome/telefone)
- [x] Atualizar db helper getCashbackClients com parâmetro de busca (nome/telefone)
- [x] Atualizar procedures tRPC com parâmetro de busca
- [x] Adicionar campo de busca no card Clientes Fidelizados
- [x] Adicionar campo de busca no card Clientes com Cashback

## Tooltips nos Quadradinhos de Progresso do Cartão
- [x] Atualizar db helper getLoyaltyCardClients para retornar datas dos carimbos individuais
- [x] Atualizar procedure tRPC para incluir datas dos carimbos
- [x] Adicionar tooltips nos quadradinhos mostrando data de cada carimbo
- [x] Aplicar tooltips também nos cards de Clientes Perto da Recompensa

## Busca no Histórico de Fidelização
- [x] Atualizar db helper getLoyaltyEventHistory com parâmetro de busca (nome/telefone)
- [x] Atualizar db helper getCashbackEventHistory com parâmetro de busca (nome/telefone)
- [x] Atualizar procedures tRPC de histórico com parâmetro search
- [x] Adicionar campo de busca no card Histórico de Fidelização (loyalty)
- [x] Adicionar campo de busca no card Histórico de Cashback

## Filtro por período como Select/dropdown
- [x] Substituir botões de filtro (Todos, Hoje, Semana, Mês) por um Select/dropdown no card Histórico de Fidelização
- [x] Substituir botões de filtro (Todos, Hoje, Semana, Mês) por um Select/dropdown no card Histórico de Cashback

## Mesclar badge + botão Configurar
- [x] Mesclar badge de status do programa (Cartão Fidelidade / Cashback) e botão Configurar em um único botão

## Padronizar barras de busca nos cards de Fidelização
- [x] Igualar altura da barra de busca do card Histórico de Fidelização à do card Clientes Fidelizados
- [x] Igualar altura da barra de busca do card Histórico de Cashback à do card Clientes com Cashback

## Ajustar espaçamento da barra de busca
- [x] Ajustar espaçamento entre título e barra de busca no card Histórico de Fidelização para ficar igual ao card Clientes Fidelizados
- [x] Ajustar espaçamento entre título e barra de busca no card Histórico de Cashback para ficar igual ao card Clientes com Cashback

## Visualização padrão de pedidos
- [x] Alterar visualização padrão da página de pedidos de Kanban para Lista

## SSE para Menu Público (Stories em tempo real)
- [x] Criar gerenciador de conexões SSE do menu público (MenuSSEManager) no backend
- [x] Criar endpoint SSE /api/menu/:slug/stream no servidor
- [x] Integrar emissão de eventos story_created, story_updated, story_deleted nos mutations de stories
- [x] Criar hook useMenuSSE(establishmentId) no frontend
- [x] Integrar hook no PublicMenu.tsx para invalidar query de stories
- [x] Preparar endpoint para eventos futuros (produto atualizado, estabelecimento fechou, etc.)

## Efeito Wave Ring nos Stories
- [x] Substituir efeito Scale Pulse pelo Wave Ring nos stories do menu público

## SSE Status Estabelecimento (Aberto/Fechado) em Tempo Real
- [x] Emitir evento SSE establishment_opened/establishment_closed no mutation de toggle do estabelecimento
- [x] Tratar eventos no hook useMenuSSE para invalidar query do menu público
- [x] Clientes no menu público veem mudança de status em tempo real sem refresh

## Cor do ícone da Fidelização
- [x] Alterar cor do ícone da página de Fidelização para azul (mesma cor do ícone do Dashboard)

## Header do card Desempenho da Fidelização
- [x] Padronizar header do card "Desempenho da Fidelização" para seguir o mesmo modelo visual do card "Acumulado da semana" (com ícone colorido à esquerda)

## Bug: Keys duplicadas na página de Stories
- [x] Corrigir erro de keys duplicadas na página /stories (múltiplos stories do mesmo dia geram key `2026-03-08` duplicada)

## Header do card Desempenho (estado sem programa)
- [x] Corrigir header do card "Desempenho da Fidelização" quando nenhum programa está ativo (estado 'none') para usar modelo com ícone colorido

## Bug: SSE establishment_closed não atualiza status no menu público
- [x] Corrigir: evento SSE establishment_closed é recebido mas o menu público continua mostrando "Aberto agora"

## Texto do botão da sacola
- [x] Alterar texto do botão "Finalizar pedido" para "Avançar" na sacola do menu público

## Melhoramento de Imagens com IA (Nano Banana / Gemini)
- [x] Pesquisar e integrar API Gemini para edição/geração de imagens
- [x] Criar endpoint tRPC para melhoramento de imagem (enviar imagem + prompt, receber imagem melhorada)
- [x] Prompt inteligente que identifica o tipo de comida e cria cenário temático (ex: hambúrguer → tábua de madeira, fundo churrasqueira)
- [x] Limitar imagens a 4MB antes de enviar para a API
- [x] Botão "Melhorar foto" na sidebar de edição de produto
- [x] Modal antes/depois com opção de aceitar nova imagem ou manter original
- [x] Guardar imagem original e imagem melhorada separadamente no S3
- [ ] No cardápio público, exibir a versão melhorada quando disponível (pendente - precisa mapear no getBySlug)

## Bug: coluna enhancedImages não existe no banco
- [x] Executar db:push para criar a coluna enhancedImages na tabela products

## Mover botão de melhorar imagem para o modal de edição
- [x] Adicionar botão de melhorar imagem no modal de edição de produto (Passo 1 - Imagens do produto)

## Bug: Modal de melhorar foto fecha ao clicar fora
- [x] Impedir que o modal de melhorar foto com IA feche ao clicar fora (overlay)

## Otimização da imagem melhorada com IA
- [x] Aplicar pipeline de otimização (WebP + resize + thumb + blur) na imagem melhorada pela IA, igual ao upload normal

## Modal de confirmação de exclusão de produto
- [x] Adicionar modal de confirmação antes de excluir produto na sidebar de edição

## Auto-abertura do modal de melhorar foto após upload
- [x] Após upload de imagem, abrir automaticamente o modal de melhorar foto com IA
- [x] Garantir que o fluxo de manter original também passa pela otimização WebP+resize+thumb+blur (upload já otimiza antes de salvar)

## Redesenho do Modal de Melhorar Foto com IA
- [x] Redesenhar visual do modal alinhado ao estilo do sistema (vermelho/branco)
- [x] Adicionar etapas visuais progressivas durante processamento (Identificando comida → Ajustando iluminação → Criando cenário)
- [x] Renomear botões: "Usar original", "Tentar outra versão", "Usar foto profissional"
- [x] Adicionar dica SaaS após gerar: "Produtos com foto profissional vendem até 3x mais"
- [x] Remover botão "Excluir produto" do Passo 3 da sidebar de edição
- [x] Adicionar modal de confirmação ao clicar no X para excluir foto do produto
- [x] Alterar texto do card "Como funciona" no modal de Foto Profissional com IA
- [x] Aplicar efeito shimmer no texto "Como funciona" do modal de Foto Profissional com IA

## Sistema de Créditos para Melhoria de Fotos com IA
- [ ] Adicionar campo ai_image_credits na tabela establishments (default 15)
- [ ] Criar tabela ai_image_credit_logs (user_id, action, quantity, date)
- [ ] Criar procedure tRPC para consultar créditos disponíveis
- [ ] Criar procedure tRPC para consumir 1 crédito ao melhorar foto
- [ ] Criar procedure tRPC para compra de pacotes via Stripe Checkout
- [ ] Atualizar modal ImageEnhance com indicador de créditos restantes
- [ ] Bloquear botão Melhorar Foto quando créditos = 0
- [ ] Exibir mensagem e botão "Comprar créditos" quando créditos acabarem
- [ ] Criar página/modal de compra de pacotes (50/100/300 créditos)
- [ ] Processar webhook Stripe para creditar automaticamente após compra
- [ ] Definir produtos/preços no Stripe (R$29/R$49/R$99)
- [ ] Testes vitest para o fluxo de créditos
- [x] Atualizar preços dos pacotes de créditos IA: 50=R$40,50 (R$0,81/cada), 100=R$72,00 (R$0,72/cada), 300=R$201,00 (R$0,67/cada)
- [x] Alterar default de créditos grátis de 15 para 0 (créditos são concedidos sob condições)
- [x] Backend: criar verificação de elegibilidade (15+ produtos, foto perfil, capa, 5+ produtos com foto)
- [x] Backend: conceder 3 créditos grátis quando elegível (apenas uma vez)
- [x] Frontend: exibir "Não elegível" no modal quando condições não atendidas (sem mostrar motivo)
- [x] Renomear modal de melhoria de imagem para "Mindi Vision — Transforme suas fotos em imagens profissionais"
- [x] Adicionar 6 créditos ao estabelecimento 210006 (ficar com 15)
- [x] Editar texto "Como funciona" para "Nossa IA Mindi Vision melhora iluminação, cores e cria um cenário profissional. A comida em si não é alterada."
- [x] Adicionar badge sparkles no canto superior direito da foto do produto no catálogo quando foto foi melhorada com IA, com tooltip "Foto aprimorada com Mindi Vision"
- [x] Adicionar badge sparkles Mindi Vision nas fotos do sidebar de edição de produto (mesmo estilo do catálogo)

- [x] Corrigir texto incompleto na sidebar de boas-vindas: "Seu restaurante X com sucesso." → frase completa
- [x] Adicionar passo "Cadastrar chave Pix" na sidebar de primeiros passos (WelcomeChecklist)
- [x] Ao clicar no passo, navegar para configurações do estabelecimento com scroll automático até card Formas de Pagamento
- [x] Concluir passo automaticamente quando chave Pix for salva
- [x] Corrigir notificação "Finalizado" do WhatsApp para vir ativada por padrão ao criar conta
- [x] Adicionar botão para remover imagem de perfil (logo) no preview do perfil público
- [x] Adicionar botão para remover imagem de capa no preview do perfil público
- [x] Substituir botões de lixeira por overlay hover elegante com texto "Remover capa" e "Remover foto"
- [x] Trocar ícone de lápis por ícone de câmera no botão de editar foto do perfil
- [x] Adicionar toggle ativar/desativar avaliações na página de Avaliações (na linha do título)
- [x] Remover card "Avaliações do Restaurante" da página de Configurações
- [x] Manter item "Avaliações" sempre visível no menu lateral (não esconder quando desativado)
- [x] Adicionar configurações do modo desativado (quantidade de avaliações fictícias + preview) na página de Avaliações
- [x] Adicionar validação de máximo 149 avaliações fictícias no campo de quantidade
- [x] Remover texto "IA" do badge no modal de melhoramento de imagem, deixar apenas ícone sparkles
- [ ] Investigar e corrigir bug: itens de complemento não aparecem em alguns produtos após exclusão de itens do grupo
- [x] Adicionar breve explicação abaixo de cada opção de programa de fidelização (Cartão Fidelidade e Cashback)
- [x] Adicionar tooltip com preview do cartão fidelidade/cashback ao hover sobre a opção selecionada no sheet de Programa de Recompensas
- [x] Aumentar tamanho dos tooltips de preview do cartão fidelidade/cashback em 33%
- [x] Corrigir bug: barra de rolagem do sidebar volta ao topo ao clicar nos itens inferiores (Bot WhatsApp, Configurações)
- [x] Alterar label 'Estratégia de repasse' para 'Como o entregador será pago pelas entregas?' (editor visual)
- [x] Adicionar opção 'Nenhuma' na estratégia de repasse do entregador
- [x] Ajustar layout desktop Configurações > Estabelecimento: card Preview 40% e card Endereço 60%
- [x] Card de Preview do Perfil sticky (fixo ao rolar) na coluna esquerda (40%)
- [x] Card de Nota do Restaurante na coluna direita (60%), mesma largura do Endereço
- [x] Alterar texto 'Aberto agora' para 'Aberto' no card de preview do perfil
- [x] Fazer as 7 cores do estilo do balão caberem todas na mesma linha
- [x] Alterar texto descritivo da nota do restaurante
- [x] Padronizar estilo dos cards e headers da página Configurações > Estabelecimento para ficar igual ao padrão do Dashboard
- [x] Remover container interno do card de Preview do Perfil para eliminar efeito de card dentro de card
- [x] Tooltip no endereço truncado do card de Preview mostrando endereço completo ao hover
- [x] Adicionar ícone azul de engrenagem no header da página de Configurações (mesmo padrão da Dashboard)
- [x] Mover card 'Configurações básicas de atendimento' da aba Atendimento para aba Estabelecimento (abaixo do Preview, coluna esquerda 40%, 3 linhas: link, whatsapp, instagram)
- [x] Colocar campos WhatsApp e Instagram na mesma linha no card Configurações básicas
- [x] Adicionar ícone ao lado do campo Link do cardápio no card Configurações básicas (padronizar com WhatsApp e Instagram)
- [x] Remover card 'Configurações básicas de atendimento' duplicado da aba Atendimento (já movido para Estabelecimento)
- [x] Redesign aba Atendimento - Layout coluna única com max-width
- [x] Redesign aba Atendimento - Card Modalidades de atendimento (pills selecionáveis)
- [x] Redesign aba Atendimento - Card Tempo e pedido mínimo (campos limpos com ícones)
- [x] Redesign aba Atendimento - Card Formas de pagamento (ícones visuais)
- [x] Redesign aba Atendimento - Card Taxa de entrega (cards selecionáveis)
- [x] Redesign aba Atendimento - Card Pedidos (toggle aceitar automaticamente)
- [x] Redesign aba Atendimento - Horários de funcionamento (manter e polir)
- [x] Redesign aba Atendimento - Botão único Salvar no final
- [x] Diminuir tamanho dos cards de seleção (Modalidades, Pagamento, Taxa) na aba Atendimento
- [x] Corrigir responsividade do card de Preview - textos saindo para fora do container
- [x] Adicionar botão dropdown ao lado esquerdo do seletor Kanban/Lista na página de Pedidos com opção "Aceitar pedidos automaticamente"
- [x] Remover card "Recebimento de pedidos" da aba Atendimento em Configurações
- [x] Alterar layout dos cards de seleção (Modalidades, Pagamento, Taxa) para ícone ao lado do texto (horizontal)
- [x] Aplicar redesign visual da aba Atendimento na aba Agendamento para manter consistência
- [x] Reorganizar aba Atendimento em 2 colunas: Modalidades (40% esquerda fixo) + Pagamento/Taxa/Horários (60% direita)
- [x] Mover card Agendamento de Pedidos para aba Atendimento, abaixo de Modalidades e entrega (coluna esquerda 40%)
- [x] Minimizar sidebar automaticamente ao clicar em Configurações no menu
- [x] Padronizar cores dos cards de seleção (Modalidades e Pagamento) para vermelho igual Taxa de entrega
- [x] Padronizar aba Notificações com SectionCards e layout em colunas da aba Atendimento
- [x] Auto-save nos toggles de notificação (salvar ao ativar/desativar) e remover botão Salvar
- [x] Padronizar aba Impressora e Teste com SectionCards e layout em colunas
- [x] Padronizar aba Conta e Segurança com SectionCards e layout em colunas
- [x] Auto-save nos toggles de seleção da aba Atendimento (modalidades, formas de pagamento, taxa de entrega, tempo de entrega, pedido mínimo) para consistência
- [x] Padronizar aba Pagamento Online com SectionCards e layout em colunas
- [x] Padronizar aba Integrações com SectionCards e layout em colunas
- [x] Remover card Eventos SSE e URL de Status (Healthcheck) da aba Impressora e Teste > API (informações técnicas irrelevantes para o cliente)
- [x] Remover URL SSE (Stream de Pedidos) da aba Impressora e Teste > API (informação técnica irrelevante para o cliente)
- [x] Padronizar aba Estabelecimento com SectionCards e layout em colunas para completar uniformização (já estava padronizada)
- [x] Auto-save com debounce nos campos de texto da aba Atendimento (chave Pix, valor taxa fixa, tempos entrega, pedido mínimo)
- [x] Auto-save nos horários de funcionamento e fuso horário
- [x] Auto-save nas taxas por bairro
- [x] Remover botão "Salvar todas as configurações" da aba Atendimento (redundante após auto-save)
- [x] Adicionar filtro de pesquisa no card de taxa de entrega por bairros para buscar bairros rapidamente
- [x] PDV: Reduzir ícone de seleção de bairro e mover ao lado do título "Selecione o Bairro"
- [x] PDV: Adicionar campo de filtro/pesquisa na seleção de bairros para buscar rapidamente
- [x] PDV: Reduzir tamanho dos botões de seleção de bairro (padding, texto e radio button menores)
- [x] PDV: Ajustar espaçamento do título "Selecione o Bairro" mais próximo do topo
- [x] Implementar auto-save no Agendamento de Pedidos na aba Atendimento
- [x] Implementar auto-save com debounce na aba Estabelecimento (nome, endereço, WhatsApp, Instagram, link do cardápio, nota do restaurante)
- [x] Adicionar indicador visual checkmark verde temporário ao lado de cada campo após auto-save confirmar sucesso
- [x] Implementar auto-save com debounce na aba Conta e Segurança (dados do estabelecimento e do responsável)
- [x] Adicionar spinner animado durante o processo de salvamento (antes do checkmark verde) para feedback imediato em todas as abas com auto-save
- [x] Corrigir responsividade da aba Atendimento: cards devem ficar em coluna única no mobile (igual Impressora e Estabelecimento)
- [x] Atualizar modal de detalhes do item no PDV para seguir o mesmo modelo do menu público (grupo sticky no topo, seleção com círculos vermelhos em vez de checkboxes azuis, mesmo layout visual)
- [x] Aplicar mesmas alterações visuais do modal de complementos na página /pdv (Frente de Caixa): grupo sticky, círculos vermelhos, controles +/-, fundo rosa
- [x] Corrigir transparência do grupo sticky de complementos no PDV.tsx e PDVSlidebar.tsx (deve ter fundo sólido branco/opaco igual ao menu público)
- [x] Corrigir espaçamentos do footer (botões +/- e Adicionar) no modal de detalhes do item no PDV.tsx e PDVSlidebar.tsx para igualar ao menu público
- [x] Unificar o componente de complementos num único componente reutilizável (ComplementGroups) para PublicMenu, PDV e PDVSlidebar
- [x] Adicionar animações de transição ao selecionar/desselecionar complementos no ComplementGroups (fundo, checkmark, controles +/-, badge Completo)
- [x] Implementar efeito de shrink na imagem do modal de detalhes do item ao rolar (reduzir altura ~30%) nos 3 modais (PublicMenu, PDV, PDVSlidebar)
- [x] Corrigir efeito de shrink da imagem: remover CSS transition e usar scroll direto para eliminar travamento ao rolar para baixo
- [x] Implementar efeito de parallax na imagem do modal de detalhes do item (translateY, scale e object-position) nos 3 modais (PublicMenu, PDV, PDVSlidebar) para experiência de scroll mais sofisticada
- [x] Remover efeito de parallax da imagem do modal de detalhes do item e restaurar apenas o shrink original nos 3 modais (PublicMenu, PDV, PDVSlidebar)
- [x] Corrigir heatmap do card "Acessos ao Cardápio" para que as horas comecem às 8h e terminem às 7h (do dia seguinte), em vez de 0h-23h
- [x] Corrigir bug nos Horários de Funcionamento: ao preencher horário de um dia, o horário do dia anterior é zerado/resetado
- [x] Implementar autoformatação de horário com máscara HH:MM nos campos de horário de funcionamento (aceitar apenas números, formatar automaticamente, validar 00:00-23:59)
- [x] Implementar replicação automática do horário de segunda-feira para os outros dias vazios ao preencher segunda
- [x] Corrigir bug de auto-save em Configurações: refetch após salvar sobrescreve estado local, fazendo campos como 'Nota do Restaurante' sumirem momentaneamente antes de reaparecer
- [x] Migrar dados do menu antigo (menu.mindi.com.br/casaraogastrobar) para o estabelecimento ID 1560157: categorias, produtos, preços, descrições e fotos
- [x] Corrigir migração do menu Casarão Gastrobar: mover categorias e produtos do estabelecimento 1560157 (errado, era o ID do usuário) para o estabelecimento 210016 (correto)
- [x] Verificar e cadastrar grupos de complementos dos produtos do menu antigo (menu.mindi.com.br/casaraogastrobar) no estabelecimento 210016
- [x] Verificar manualmente cada produto do menu antigo para encontrar grupos de complementos e cadastrá-los no estabelecimento 210016
- [x] Corrigir créditos de melhoramento de imagem para novas contas: de 18 para 4 créditos (corrigido race condition no grantFreeAiCredits com UPDATE atômico)
- [x] Transformar categoria Guarnições (Arroz, Feijão Tropeiro, Vinagrete) em grupo de complementos e adicionar a todos os produtos da categoria Espetinhos no estabelecimento 210016
- [ ] Corrigir créditos de contas existentes que receberam 18 créditos indevidamente (race condition), ajustando para 4
- [x] Corrigir menu/sidebar mobile para abrir maximizado (expandido) por padrão quando o utilizador clicar no ícone do menu
- [x] Reduzir tamanho dos cards de mesas na versão mobile em 25% (feedback dos donos de restaurantes)
- [x] Mover campo Preço do produto do Passo 3 para o Passo 1 (abaixo do Nome) na slidebar mobile de edição de produto no /catalogo
- [x] Implementar meta tags Open Graph dinâmicas para URLs /menu/{slug} servidas pelo servidor (SSR)
- [x] Buscar dados do restaurante (capa/logo) pelo slug no banco de dados
- [x] Usar imagem fallback quando restaurante não tiver foto cadastrada
- [x] Garantir que meta tags vêm no HTML inicial (não via JS/React)
- [x] Incluir og:image:width e og:image:height nas meta tags
- [x] Gerar imagem OG dinâmica server-side com composição visual (capa + logo + nome + info do restaurante)
- [x] Criar endpoint /api/og-image/:slug que gera a imagem dinamicamente com sharp
- [x] Atualizar og:image no seo.ts para apontar para o endpoint dinâmico
- [x] Implementar cache S3/CDN para imagens OG geradas dinamicamente
- [x] Verificar cache S3 antes de gerar imagem (retornar direto se existir)
- [x] Salvar imagem gerada no S3 após processamento
- [x] Invalidar cache automaticamente ao atualizar capa, logo ou nome do restaurante
- [x] Escrever testes para o fluxo de cache OG
- [x] Reduzir tamanho dos cards de mesas na versão desktop em 20%
- [x] Redesign imagem OG: corrigir logo circular (não quadrado atrás do círculo)
- [x] Redesign imagem OG: remover barra vermelha pesada, usar barra escura sutil com linha vermelha fina
- [x] Redesign imagem OG: avaliação mais destacada (★ 4.7 • 287 avaliações)
- [x] Redesign imagem OG: adicionar CTA "Peça online agora!" na parte inferior
- [x] Redesign imagem OG: layout premium com gradiente escuro na parte inferior
- [x] Adicionar toggle Grid/Lista no mapa de mesas (estilo do toggle Kanban/Lista dos pedidos)
- [x] Implementar visualização em lista/tabela como alternativa ao grid de cards
- [x] Persistir preferência de visualização no localStorage
- [x] Página de pedidos: viewMode padrão = Kanban no mobile e Lista no desktop

## Migração de Dados - Rota 17 Burger
- [x] Extrair categorias, produtos, fotos, preços e descrições do menu antigo (menu.mindi.com.br/rota-17-burger)
- [x] Inserir categorias no estabelecimento ID 210017
- [x] Inserir produtos com fotos, preços e descrições no estabelecimento ID 210017
- [x] Migrar imagens dos produtos do Google Storage para S3 do novo sistema

## Correção Meta Tags OG - Menu Público
- [x] Corrigir meta tags OG nas páginas de menu público para mostrar imagem/descrição do restaurante em vez do screenshot do dashboard admin

## UX - Botão + Mesas Mobile
- [ ] Aumentar área clicável do botão + no card de produto (lado direito: preço + botão) na página de mesas mobile
- [ ] Sem complemento: clicar na área direita adiciona direto ao pedido
- [ ] Com complemento: clicar na área direita abre modal de detalhes para selecionar complementos

## UX - Botão + Mesas Mobile
- [x] Aumentar área clicável do botão + no lado direito do card de produto na página de mesas mobile (estilo: preço + botão como zona de toque única maior)

## Identificação de Mesas (Label)
- [x] Adicionar campo label (varchar 15, opcional) na tabela de mesas + endpoint para atualizar
- [x] Implementar edição inline do label no MobilePDVModal (mobile)
- [x] Implementar edição inline do label no PDVSlidebar (desktop)
- [x] Implementar etiqueta estilo aba de pasta no card de mesa no mapa
- [x] Limpar label automaticamente ao fechar mesa
- [x] Exibir label no header: Mobile "Mesa X | João | R$ Y" / Desktop "Mesa X | João"
- [ ] Trocar etiqueta de identificação da mesa para estilo corner ribbon diagonal no canto superior direito
- [x] Redesenhar faixa inferior do card de mesa: label à esquerda + status (Ocupada/Livre/Reservada) à direita, fundo cinza claro

- [x] Esconder tag "Reservada" no filtro de status quando não houver mesas reservadas (count = 0)
- [x] Exibir label da mesa na visualização em lista
- [x] Bug: label da mesa não atualiza no header do modal PDV em tempo real após edição (só com F5)
- [x] Diminuir espaçamento entre filtros de status (Livre, Ocupada, Reservada) na página de mesas
- [ ] Drag and drop: arrastar mesa sobre espaço = mover mesa para esse espaço
- [ ] Drag and drop: arrastar mesa para reorganizar ordem dentro do mapa
- [ ] Drag and drop: feedback visual durante arrasto ("Movendo mesa X", destacar área destino)
- [x] Drag: arrastar mesa sobre espaço (Salão, Varanda) = mover mesa para esse espaço
- [x] Drag: arrastar mesa entre mesas = reordenar com gap visual entre cards
- [x] Drag: manter comportamento de juntar mesas ao arrastar sobre outra mesa (não alterar)
- [x] Drag: substituir banner "Movendo mesa" e barra amber por card pontilhado placeholder no local de inserção
- [x] Bug: drag and drop treme e card pontilhado não aparece corretamente (loop de layout)
- [x] Drag: cards devem se afastar suavemente com animação CSS para abrir espaço ao arrastar mesa entre eles
- [x] Separar drag em dois modos: modo normal (juntar) e modo reordenar (botão, só reordena com gap visual)
- [x] Botão "Reordenar" ao lado dos botões + e engrenagem para ativar modo reordenar
- [x] No modo reordenar: arrastar NÃO junta mesas, apenas reordena com card fantasma pontilhado
- [x] No modo normal: arrastar sobre mesa = juntar (comportamento original)
- [x] Banner "Modo reordenar ativo" com botão "Concluir" para desativar
- [x] Ícone de grip nos cards no modo reordenar, menu ⋮ oculto
- [x] Clicar na mesa no modo reordenar NÃO abre o PDV
- [x] Mover mesa entre espaços desabilitado no modo reordenar
- [x] Trocar cor do modo reordenar de amber/laranja para azul (botão, banner, card fantasma, borda dos cards)
- [x] Corrigir visual do botão reordenar selecionado: remover ring/borda externa estranha
- [x] Bug: reordenação não funciona ao arrastar card para posição adjacente (card volta para mesma posição)
- [x] Remover botão "Concluir" do banner de modo reordenar (reordenação já é salva automaticamente)
- [x] Adicionar animação suave de transição quando os cards trocam de posição na reordenação
- [x] Ao excluir um espaço no modal Gerenciar Espaços, excluir todas as mesas desse espaço
- [x] Página Acessos: schema de colaboradores (nome, email, senha hash, establishmentId, permissões)
- [x] Página Acessos: helpers de DB para CRUD de colaboradores
- [x] Página Acessos: procedures tRPC para listar, criar, editar, excluir colaboradores
- [x] Página Acessos: login por email/senha para colaboradores
- [x] Página Acessos: página com lista de colaboradores e modal de criação/edição
- [x] Página Acessos: checkboxes de permissões por página do sistema
- [x] Página Acessos: filtrar sidebar baseado nas permissões do colaborador logado
- [x] Página Acessos: proteger rotas no backend (validar permissão antes de servir dados)
- [x] Página Acessos: adicionar item "Acessos" na seção SISTEMA do menu lateral
- [x] Refazer visual da página Acessos seguindo o estilo da página Entregadores
- [x] Mostrar contagem de permissões no card do colaborador (ex: "1 permissão" ou "3 permissões")
- [x] Melhorar texto explicativo: "Colaboradores acessam o painel usando email e senha cadastrados aqui. Eles verão apenas as páginas autorizadas."
- [x] Limitar campo nome do colaborador a no máximo 10 caracteres
- [x] Modal de confirmação antes de excluir colaborador: "Você realmente deseja excluir este colaborador?"

## WhatsApp no Formulário de Colaborador
- [x] Campo WhatsApp opcional no formulário de novo colaborador com máscara (00) 00000-0000
- [x] Texto informativo abaixo do campo: "O colaborador receberá automaticamente os dados de acesso via WhatsApp."
- [x] Envio automático via UAZAPI dos dados de acesso ao criar colaborador (se WhatsApp preenchido)
- [x] Mensagem formatada com nome, email, senha, link e instruções de acesso
- [x] Toast de confirmação: "Acesso criado e enviado via WhatsApp ao colaborador."
- [x] Feedback diferenciado: sucesso com envio / sucesso sem envio (WhatsApp desconectado) / sucesso sem número

## Melhorias na Página de Acessos (Colaboradores)
- [x] Substituir tags de permissões na tabela por texto "Ver permissões" clicável que abre sidebar de edição com scroll automático até permissões
- [x] Colocar campos Nome e Email lado a lado no modal de editar/criar colaborador
- [x] Adicionar validação de WhatsApp em tempo real via UAZAPI (igual página de entregadores)

## Popover no Menu da Sidebar Minimizada
- [x] Quando sidebar minimizada, clique em "Menu" abre popover flutuante (não expande sidebar)
- [x] Popover lista: Cardápio, Grupos, Avaliações
- [x] Sidebar expandida mantém comportamento atual (submenu expandido)
- [x] Popover aparece ao lado do ícone Menu
- [x] Fix: Tooltip não aparece no hover do item Menu na sidebar colapsada (precisa combinar Tooltip + Popover)
- [x] Fix: Corrigir formatação da mensagem WhatsApp do colaborador (quebras de linha entre blocos + link v2.mindi.com.br)
- [ ] Desativar item Bot WhatsApp do menu lateral (sem badge, apenas remover do menu)
- [x] Desabilitar clique no item Bot WhatsApp na sidebar (manter visível, sem navegação)

## Permissões de Colaborador - Ocultar Opções de Admin
- [x] Ocultar toggle abrir/fechar restaurante para colaboradores (header e dropdown)
- [x] Ocultar item Planos para colaboradores (dropdown do perfil)
- [x] Ocultar badge/info de teste gratuito (trial) para colaboradores (header)
- [x] Ocultar controle de som do sistema para colaboradores (header)

## Desativar Mesa em vez de Excluir + Restauração
- [x] Trocar "Excluir mesa" por "Desativar mesa" no menu de contexto da mesa
- [x] Mesa desativada fica cinza/invisível no mapa (isActive = false)
- [x] Exclusão permanente somente no modal Gerenciar Espaços
- [x] Nova aba "Mesas Excluídas" no modal Gerenciar Espaços com opção de restaurar
- [x] Backend: endpoint para desativar mesa (soft delete via isActive)
- [x] Backend: endpoint para restaurar mesa desativada
- [x] Mesas desativadas devem continuar visíveis no mapa com aparência cinza/opaca (não desaparecer)
- [x] Bug: Erro de validação ao cadastrar entregador com mesmo número de WhatsApp de colaborador - repasseStrategy inválido (adicionado 'none' ao enum)
- [x] Fix busca intermitente: Eliminar state intermediário establishmentId (usar establishment?.id direto)
- [x] Fix busca intermitente: Adicionar staleTime na query de produtos (cache 30s)
- [x] Fix busca intermitente: Mostrar loading state na busca enquanto produtos carregam
- [x] Remover window.confirm nativo ao desativar mesa (desativar diretamente sem confirmação)
- [x] Mesas desativadas não devem aparecer em "Mesas Excluídas" - separar conceitos desativada vs excluída

## Separação Mesas Desativadas vs Excluídas (deletedAt)
- [x] Adicionar campo deletedAt (timestamp) à tabela tables no schema
- [x] Migração aplicada no banco de dados
- [x] Backend: getTablesByEstablishment filtra deletedAt IS NULL
- [x] Backend: getDeactivatedTables filtra isActive=false AND deletedAt IS NULL
- [x] Backend: nova função getDeletedTables filtra deletedAt IS NOT NULL
- [x] Backend: nova função softDeleteTable (marca deletedAt + isActive=false)
- [x] Backend: nova função restoreDeletedTable (limpa deletedAt + isActive=true)
- [x] Backend: endpoint delete usa softDeleteTable (soft delete com deletedAt)
- [x] Backend: novo endpoint deletePermanently (hard delete real)
- [x] Backend: novo endpoint listDeleted (mesas com deletedAt)
- [x] Backend: novo endpoint restoreDeleted (restaurar mesa excluída)
- [x] Frontend: "Excluir" no Gerenciar Espaços usa soft delete (deletedAt)
- [x] Frontend: "Mesas Excluídas" mostra apenas mesas com deletedAt (não desativadas)
- [x] Frontend: Restaurar em "Mesas Excluídas" usa restoreDeleted
- [x] Frontend: Excluir permanentemente usa deletePermanently
- [x] Frontend: Mesas desativadas continuam visíveis no mapa como cinza (sem deletedAt)
- [x] Testes vitest: 16 testes passando para separação desativada/excluída

## Bug: Coluna deletedAt não existe no banco de dados
- [x] Verificar se a migração do campo deletedAt foi aplicada ao banco
- [x] Aplicar migração com ALTER TABLE diretamente (pnpm db:push não aplicou no banco de produção)
- [x] Confirmar que as queries com deletedAt funcionam sem erro

## Transferir Itens entre Mesas
- [x] Backend: criar função transferTabItems no db.ts (move itens entre comandas)
- [x] Backend: criar endpoint tRPC tables.transferItems
- [x] Backend: se mesa destino não tem comanda, criar uma nova
- [x] Backend: se mesa origem ficar sem itens, fechar comanda e liberar mesa
- [x] Backend: recalcular totais das duas comandas
- [x] Backend: transferir label/identificação se mesa origem ficar vazia
- [x] Frontend: adicionar opção "Transferir itens" no menu de contexto da mesa (acima de Reservar)
- [x] Frontend: modal de transferência com lista de itens, checkboxes, seletor de mesa destino
- [x] Frontend: mostrar complementos/observações nos itens do modal
- [x] Frontend: confirmação antes de concluir ("Transferir X itens da Mesa Y para Mesa Z?")
- [x] Frontend: toast de sucesso após transferência
- [x] Frontend: refetch automático das mesas após transferência
- [x] Testes vitest para a funcionalidade de transferência (17 testes passando)

## Bug: Scroll no drawer mobile rola conteúdo de fundo
- [x] Corrigir scroll no drawer mobile: ao fazer scroll no menu lateral, o conteúdo por trás é que rola
- [x] Adicionar overflow-y-auto + overscroll-contain no container do drawer e bloquear scroll do body quando drawer aberto

## Correção Atômica: orderNumber para requisições paralelas
- [x] Criar tabela order_counters no schema (establishmentId, date, counter)
- [x] Aplicar migração no banco
- [x] Atualizar getNextDailyOrderNumber para usar INSERT ON DUPLICATE KEY UPDATE atômico com fallback
- [x] Escrever testes vitest para concorrência (14 testes passando)
- [x] Verificar que formato #P1, #P2 continua igual
- [x] Fix N8N bot greeting showing literal {{nome}} instead of establishment name (primeira_mensagem prompt rewritten to use tools instead of expressions)
- [ ] Fix bot treating 'obrigado' as out-of-scope instead of a polite farewell response
- [x] Fix catalog search to hide categories with no matching products (only show categories that contain filtered items)
- [x] Add 'no results found' message when catalog search returns no matching items
- [x] Fix bot to check minimum order value before creating order and inform customer if below minimum
- [ ] Fix bot sending duplicate 'pedido criado com sucesso' message after order creation (agent should be silent)
- [x] Fix bot accepting orders when establishment is closed (structural Verificar Aberto node + pedidos prompt uses dados_estabelecimento for isOpen check)
- [x] Fix markdown link format in closed message (Msg Fechado now uses menuUrl from establishment API with slug)
- [x] Fix bot showing unnecessary minimum order message when order is already above minimum (pedidos prompt updated with SILÊNCIO TOTAL rule)
- [x] Bug: Impressão do pedido não abre janela ao aceitar pedido e ao clicar no botão de impressão (fix: frameAncestors CSP 'none' → 'self')
- [x] Aba Mindi nas configurações de impressora só deve aparecer quando a API key do Mindi Printer já foi gerada
- [x] Bug N8N: Bot diz "aberto" na primeira mensagem mas depois diz "fechado" ao pedir pedido (pedidos now uses dados_estabelecimento tool for consistent status check)
- [x] Bug N8N: Link do cardápio usa ID do estabelecimento (/menu/30001) em vez do slug (/menu/sushi_haruno) (added slug+menuUrl to /api/bot/establishment, Msg Fechado uses menuUrl, cardapio_link tool calls /api/bot/menu-link which returns slug)

## Bug N8N: Pedidos agent diz fechado quando restaurante está aberto + link literal
- [x] Investigar por que o agente pedidos diz "estamos fechados" quando o restaurante está aberto (causa raiz: prompt do pedidos mandava re-verificar status via tool, AI hallucinated resultado)
- [x] Corrigir link do cardápio que aparece como texto literal "[link do cardápio]" em vez da URL real (removida instrução de chamar cardapio_link no pedidos; Msg Fechado usa menuUrl com fallback)
- [x] Remover verificação de status redundante do prompt do pedidos (substituída por declaração fixa: "O estabelecimento está ABERTO")
- [x] Atualizar primeira_mensagem para usar dados do nó Estabelecimento via expressões N8N (sem chamar tool status_estabelecimento)
- [x] Adicionar fallback no Msg Fechado e primeira_mensagem para quando menuUrl não estiver disponível na API deployed

## Bug N8N: Bot diz "fechado" quando cliente diz "boa noite" mas restaurante está aberto
- [x] Corrigir prompt do primeira_mensagem: AI usa saudação do cliente para inferir horário/status em vez de confiar no campo isOpen
- [x] Reforçar no prompt que isOpen é a ÚNICA fonte de verdade para status aberto/fechado (adicionadas regras explícitas: 'NUNCA use a saudação do cliente para decidir status', 'O restaurante pode estar aberto de noite')

## Bug N8N: Bot SEMPRE diz fechado mesmo com restaurante aberto manualmente
- [x] Verificar o que a API deployed retorna para isOpen → API retorna isOpen=true corretamente
- [x] CAUSA RAIZ: expressões {{ $('Estabelecimento')... }} no systemMessage dos AI Agent nodes NÃO são resolvidas pelo N8N - o AI recebe o texto literal da expressão
- [x] Solução: mover todas as expressões dinâmicas para o campo 'text' (que É resolvido pelo N8N) e tornar o systemMessage 100% estático
- [x] Corrigidos TODOS os AI Agent nodes: AI Agent (router), primeira_mensagem, pedidos, fora_escopo, status_funcionamento, agent_status_funcionamento

## Melhoria N8N: Pedidos agent deve enviar link do cardápio em vez de listar produtos
- [x] Atualizar prompt do pedidos para enviar link do cardápio quando cliente quer pedir
- [x] Informar que pode pedir pelo menu online ou diretamente pelo WhatsApp
- [x] Incluir menuUrl nos dados de contexto do pedidos agent (com fallback para slug/id)

## Bug N8N: Pedidos agent não pergunta endereço de entrega
- [x] Bot pula etapa de coleta de endereço e usa endereço do restaurante
- [x] Reforçar no prompt que PASSO 3 (endereço) é OBRIGATÓRIO e deve perguntar: rua, número, bairro, referência
- [x] Bot NÃO deve usar dados_estabelecimento para preencher endereço do cliente (regra explícita adicionada)

## Feature: Controle de estoque para complementos
- [x] Adicionar campos de estoque na tabela de complementos (hasStock, stockQuantity)
- [x] Migrar banco de dados com novos campos
- [x] Atualizar lógica do servidor para gerenciar estoque de complementos
- [x] Atualizar frontend para exibir controles de estoque nos complementos
- [x] Atualizar API do bot para respeitar estoque de complementos
- [x] Escrever testes para a nova funcionalidade (4 testes passando)

## Feature: Controle de estoque de complementos na página de Cardápio
- [x] Adicionar campo de estoque nos complementos exibidos na página de Cardápio (dentro dos detalhes do produto) - desktop e mobile

## Bug: Estoque de complementos não salva
- [x] Investigar por que o estoque de complementos volta a zero após navegar (causa: updateGlobalMutation no Complementos.tsx não incluía hasStock/stockQuantity no spread)
- [x] Corrigir a persistência do estoque de complementos (adicionados hasStock e stockQuantity ao spread do updateGlobalMutation)

## Feature: Dedução automática de estoque de complementos ao criar pedido
- [ ] Implementar dedução de estoque de complementos quando pedido é criado pelo menu público
- [ ] Verificar se dedução de estoque de produtos já existe e está funcionando
- [ ] Garantir que estoque não fique negativo

## Correção: Dedução de Estoque ao Criar Pedido
- [x] Corrigir dedução de estoque simples (stockQuantity) de complementos ao criar pedido pelo menu público
- [x] Corrigir dedução de estoque simples (stockQuantity) de produtos sem stockItem vinculado ao criar pedido
- [x] Evitar dupla dedução para produtos COM stockItem vinculado (syncProductStockQuantity já cuida)
- [x] Adicionar dedução de estoque na mutation orders.create (admin) via deductStockForOrder
- [x] Remover lógica duplicada inline de dedução de estoque do PDV (já coberta por createOrder -> deductStockForOrder)
- [x] Corrigir restoreStockForOrder para também restaurar estoque simples de complementos ao cancelar
- [x] Evitar dupla restauração para produtos COM stockItem vinculado
- [x] Escrever testes vitest para dedução e restauração de estoque

## Bug: Bot WhatsApp não respondendo
- [x] Investigar fluxo N8N do bot WhatsApp
- [x] Identificar causa raiz: endpoint whatsapp-config não normaliza número com @s.whatsapp.net
- [x] Corrigir endpoint para normalizar número de telefone (remover sufixo @s.whatsapp.net)
- [x] Testes de normalização de telefone



## Bug: Bot WhatsApp ainda não responde após fix de normalização
- [x] Verificar se a correção foi publicada corretamente no endpoint de produção
- [x] Verificar logs do servidor para erros no webhook
- [x] Inspecionar execuções recentes no N8N para identificar ponto de falha
- [x] Corrigir o problema identificado (HTTP Request4 com continueOnFail + timeout 5s)

## Bug: Bot rejeita pedido acima do mínimo (R$45 rejeitado como abaixo de R$20)
- [x] Investigar lógica de validação de pedido mínimo no N8N
- [x] Corrigir comparação incorreta no fluxo do bot (prompt do agente atualizado com exemplos numéricos explícitos)

## Bug: Pedido mínimo - LLM continua errando comparação numérica
- [x] Mover validação de pedido mínimo do prompt LLM para lógica programática
- [x] Remover minimumOrderValue/minimumOrderEnabled da resposta do endpoint dados_estabelecimento
- [x] Validação de pedido mínimo feita exclusivamente pela API ao criar pedido
- [x] Remover regras de pedido mínimo do prompt do agente pedidos no N8N
- [ ] Testar com nova conversa (sem memória Redis antiga)

## Melhoria: Rate Limiting - skipSuccessfulRequests
- [x] Adicionar skipSuccessfulRequests: true no authLimiter
- [x] Reduzir max de 20 para 10 tentativas

- [x] Reimplementar Open Graph (endpoint /api/menu/:slug + /api/og-image/:slug) conforme versão funcional das 12:23

## Bug: Mindi Printer não mostra conexão após inserir key
- [x] Investigar endpoints do printer que podem ter sido alterados
- [x] Corrigir o problema de conexão do app de impressão (ENV is not defined no SSE /api/printer/stream)

## Bug: Mindi Printer ainda não conecta em produção após fix do ENV
- [x] Verificar endpoint SSE em produção (v2.mindi.com.br)
- [x] Verificar CORS, proxy e headers SSE
- [x] Comparar com versão que funcionava antes do rollback
- [x] Corrigir o problema definitivamente (helmet adicionava Cross-Origin-Resource-Policy: same-origin que bloqueava o app Android)

## Bug: Mindi Printer AINDA não conecta em produção após fix de helmet/CORS
- [ ] Analisar código fonte do app Mindi Printer para entender o fluxo de conexão
- [ ] Verificar logs de produção quando o app tenta conectar
- [ ] Comparar respostas entre versão funcional e atual em detalhe
- [ ] Corrigir definitivamente

## Página Cozinha (submenu Mapa de Mesas)
- [x] Analisar página de Pedidos atual para duplicar visual
- [x] Criar página Cozinha com visual idêntico a Pedidos
- [x] Remover "aceitar pedido automaticamente" e "conectar WhatsApp" da Cozinha
- [x] Manter modos Kanban e Lista na Cozinha
- [x] Criar backend para pedidos de mesa separados (filtro source='pdv' no orders.list)
- [x] Título do pedido: número da mesa + horário + itens
- [x] Adicionar Cozinha como submenu do Mapa de Mesas na sidebar
- [x] Separar pedidos do cardápio público dos pedidos do mapa de mesas

## Ajustes Cozinha - Cards e Kanban
- [x] Ocultar coluna/card de Cancelados no Kanban da Cozinha
- [x] Remover forma de pagamento do card de pedido na Cozinha
- [x] Remover valor (R$) do card de pedido na Cozinha
- [x] Remover número do pedido (#P2) do card de pedido na Cozinha

## Itens do Pedido no Card da Cozinha
- [x] Adicionar lista de itens do pedido dentro do card Kanban na página Cozinha
- [x] Adicionar coluna Itens na vista Lista da página Cozinha
- [x] Exibir quantidade + nome do produto + complementos + observações

## Redesign Cozinha - Layout Fullscreen
- [x] Cozinha abre em nova aba separada ao clicar na sidebar
- [x] Remover sidebar lateral da página Cozinha (layout fullscreen)
- [x] Topbar simplificada: apenas botão "Voltar ao Admin" e botão toggle de som
- [x] Botão de som ativa/desativa notificação sonora para pedidos PDV
- [x] Substituir relógio estático por contador em tempo real (há quanto tempo o pedido chegou)
- [x] Som toca apenas quando pedido vem do PDV (query filtra source: 'pdv')

## Ajustes Cozinha - Topbar
- [x] Remover botão "Voltar ao Admin" da topbar da Cozinha
- [x] Exibir nome do estabelecimento abaixo do título "Cozinha" na topbar

## Redesign Visual dos Itens no Card da Cozinha
- [x] Barrinha vertical vermelha ao lado da quantidade (padrão visual da mesa)
- [x] Quantidade em destaque com cor accent (ex: "2x" em vermelho)
- [x] Nome do produto em negrito uppercase
- [x] Complementos indentados com "+" abaixo do item
- [x] Layout mais espaçado e limpo

## Ajustes Cozinha - Filtros e Itens
- [x] Alinhar estilo dos filtros do modo Lista da Cozinha com o padrão da página de Pedidos
- [x] Separador visual entre itens quando pedido tiver 2+ produtos
- [x] Indicador de observações: destaque visual quando item tiver observações (badge OBS: com fundo amber)

## Ajustes Cozinha - Cor da Barrinha e Tamanho dos Itens
- [x] Barrinha vertical e quantidade devem seguir a cor do status do card (azul=novo, vermelho=preparo, verde=pronto, cinza=completo)
- [x] Reduzir tamanho/espaçamento dos itens no card para ficarem mais compactos e proporcionais

## Ajustes Cozinha - Texto e Alinhamento dos Itens
- [x] Remover negrito do nome do produto no card (font-normal em vez de font-semibold)
- [x] Centralizar verticalmente nome do produto com a quantidade (items-center)

## Cozinha - Som Independente do Admin
- [x] Separar estado do toggle de som da Cozinha do Admin (cada um independente)
- [x] Cozinha e Admin podem ter som ligado/desligado independentemente
- [x] Cozinha usa chave localStorage 'cozinhaSoundEnabled' separada de 'notificationSoundEnabled'
- [x] Cozinha toca som diretamente sem depender do singleton NotificationAudioManager

## Cozinha - Borda Superior dos Cards de Status
- [x] Alinhar espessura da borda colorida superior dos cards Kanban da Cozinha com o padrão da página de Pedidos (border-t-2 → border-t-4)

## Sidebar - Ícone Nova Aba da Cozinha
- [x] Mover ícone de nova aba para o final da borda de seleção (lado direito) no submenu Cozinha

## Sidebar - Dropdown Mapa de Mesas
- [x] Clicar em "Mapa de mesas" deve abrir o dropdown exibindo o submenu Cozinha

## Bug Fix - Dropdown Mapa de Mesas
- [x] Corrigir: submenu Cozinha só abre no segundo clique em "Mapa de mesas" (deve abrir no primeiro)

## Som Personalizado da Cozinha
- [x] Configurar som personalizado da Cozinha (WAV do usuário) como toque de novo pedido via CDN
- [x] Atualizar CSP (Content-Security-Policy) para permitir áudio do CloudFront CDN
- [x] Pré-carregar áudio da Cozinha para reprodução instantânea

## Bug Fix - Toggle de Som da Cozinha
- [x] Corrigir: toggle de som da Cozinha deve ficar desativado por padrão ao carregar a página (igual ao Admin)

## Reativar Página Bot WhatsApp
- [x] Reativar página Bot WhatsApp na sidebar (disabled: true → false)

## Bug Fix: Pedido Mínimo no Bot WhatsApp
- [x] Investigar por que bot informa R$ 50 de pedido mínimo quando desativado no Casarão Gastrobar
- [x] Causa raiz: campos minimumOrderEnabled/minimumOrderValue removidos da API /api/bot/establishment - LLM inventava valores
- [x] Adicionar minimumOrderEnabled e minimumOrderValue de volta na resposta da API do bot
- [x] Atualizar prompt do agente pedidos no N8N: lógica explícita para ignorar mínimo quando desativado
- [x] Atualizar toolDescription do dados_estabelecimento com instruções sobre minimumOrderEnabled
- [x] Atualizar REGRAS OBRIGATÓRIAS do prompt com verificação de minimumOrderEnabled
- [x] Salvar workflow v9 no N8N (backup local: mindi_workflow_v9_minimum_fix.json)

## Bug: Link do cardápio enviado em duplicidade no WhatsApp
- [x] Investigar por que o bot envia o link do cardápio em 2 mensagens separadas
- [x] Corrigir para enviar apenas 1 mensagem consolidada com link + opção WhatsApp
- [x] Adicionar remoção de links markdown [text](url) no node Limpar Saída

## Bug: Bot menciona pedido mínimo mesmo quando subtotal está acima
- [x] Reforçar no prompt que NUNCA deve mencionar pedido mínimo quando subtotal >= mínimo
- [x] Bot deve ir direto ao endereço de entrega sem comentar sobre mínimo
- [x] Adicionadas proibições explícitas: palavras "mínimo", "subtotal", "ativado" proibidas na resposta quando ok

## Melhoria: Quebras de linha no resumo do pedido e entrega/pagamento
- [x] Aplicar formatação com espaçamento no resumo do pedido (PASSO 5 confirmação)
- [x] Aplicar formatação com espaçamento no balão de entrega e pagamento

## Bug: Bot inventa valor do pedido mínimo (diz R$45 quando é R$20) e menciona quando não deveria
- [ ] Investigar por que o LLM confunde subtotal com valor mínimo
- [ ] Verificar resposta da tool dados_estabelecimento para estabelecimento 30001
- [ ] Corrigir definitivamente para que o bot NUNCA mencione mínimo quando subtotal >= mínimo

## Feature: Auto-completar pedidos ao fechar mesa
- [x] Investigar fluxo de fechamento de mesa no código
- [x] Ao fechar mesa, mover todos os pedidos em status intermediário para "completo"
- [ ] Testar fluxo completo (aguardando deploy)

## Bug: Pedido duplicado e som ao fechar mesa
- [x] Evitar criação de pedido duplicado no closeTable quando já existem pedidos da mesa
- [x] Evitar som na cozinha ao auto-completar pedidos no fechamento de mesa

## Bug: Cozinha não atualiza em tempo real ao fechar mesa
- [x] Enviar evento SSE de orderUpdate ao auto-completar pedidos (para mover card em tempo real)
- [x] Garantir que o evento SSE não dispare som de novo pedido na cozinha (usa order_update, não new_order)

## Feature: Pedidos de mesa apenas na cozinha
- [x] Filtrar pedidos dine_in/pdv da página de Pedidos (admin) - não devem aparecer lá
- [x] Garantir que som do admin não toque para pedidos de mesa
- [x] Pedidos de mesa devem aparecer APENAS na página de cozinha

## Feature: Fechar Parcial de Mesa
- [x] Analisar código atual da sidebar de mesa e fluxo de fechamento
- [x] Criar procedure backend para fechamento parcial (remover itens selecionados, gerar pagamento parcial)
- [x] Ao clicar "Fechar mesa" na sidebar, mostrar modal perguntando "Completo ou Parcial?"
- [x] No modo parcial: exibir lista de itens com checkboxes para seleção
- [x] Mostrar subtotal dos itens selecionados em tempo real
- [x] Permitir escolha de forma de pagamento para o fechamento parcial
- [x] Remover itens pagos da comanda e manter mesa aberta com itens restantes
- [x] Adicionar opção "Fechar parcial" no menu de contexto (3 pontos) da mesa
- [x] Registrar histórico de pagamentos parciais na mesa (via pedido "completed" com nome "Mesa X (parcial)")

## Bug: Card da mesa não atualiza após fechamento parcial
- [x] Invalidar cache das mesas (tables.list) após fechamento parcial para atualizar contagem de itens e valor no card

## Bug: Card da mesa continua mostrando todos os itens após fechamento parcial (v2)
- [x] Investigar: getTabItems não filtrava itens cancelled - retornava todos
- [x] Corrigido: getTabItems agora filtra ne(status, 'cancelled')

## Feature: Fechamento parcial na versão mobile do PDV
- [x] Localizar componente mobile do PDV (MobilePDVModal ou similar)
- [x] Adicionar modal de escolha "Completo ou Parcial?" ao clicar em fechar mesa
- [x] Implementar seleção de itens e forma de pagamento no mobile
## Feature: Histórico de Atividades da Mesa (Timeline)
- [x] Criar procedure backend para buscar histórico de atividades da mesa (pedidos inseridos, pagamentos parciais, etc.)
- [x] Criar componente TableHistorySidebar com UI de timeline (estilo Pedidos Recentes da Dashboard)
- [x] Desktop: Adicionar botão de histórico ao lado direito do ícone de cupom no PDVSlidebar
- [x] Mobile (aba Consumo): Adicionar botão de histórico ao lado esquerdo do botão Limpar
- [x] Mobile (aba Comanda): Adicionar botão de histórico ao lado esquerdo do botão Fechar Mesa
## Redesign: Histórico de Atividades da Mesa - Identidade Visual
- [x] Redesenhar TableHistorySidebar seguindo modelo visual da slidebar de dados de entrega do PDV
- [x] Redesenhar TableHistoryMobile seguindo mesmo padrão visual
## Bug: Botão de histórico não funciona no mobile
- [x] Corrigir botão de histórico no MobilePDVModal que não abre o histórico ao clicar (z-index estava z-[60], abaixo do modal principal z-[71], corrigido para z-[100])
## UI: Botão Histórico no Mobile
- [x] Trocar ícone do botão de histórico no MobilePDVModal pelo texto "Histórico"
## Feature: Pagamento Avulso (Abater Valor)
- [x] Criar tabela tabPayments no schema para registrar pagamentos avulsos
- [x] Criar procedure loosePayment no backend para processar pagamento avulso
- [x] Desktop: Adicionar terceira opção "Pagamento Avulso" no modal de fechar mesa (PDVSlidebar)
- [x] Desktop: Criar fluxo de input de valor + forma de pagamento para pagamento avulso
- [x] Mobile: Adicionar terceira opção "Pagamento Avulso" no modal de fechar mesa (MobilePDVModal)
- [x] Mobile: Criar fluxo de input de valor + forma de pagamento para pagamento avulso
- [x] Atualizar histórico da mesa para exibir pagamentos avulsos na timeline
- [x] Atualizar total exibido na comanda para refletir abatimentos
## Bug: Histórico da mesa não mostra atividades
- [x] Investigar e corrigir getTableHistory que parou de retornar eventos (tabela tabPayments não existia no banco, criada manualmente via SQL)
## UI: Botão Limpar no Desktop PDV
- [x] Transformar botão "Limpar" em ícone (Eraser) no desktop PDVSlidebar para economizar espaço
## UI: Tooltips nos botões de ícone do PDV Desktop
- [x] Adicionar Tooltip component nos botões de ícone do footer do PDVSlidebar (cupom, histórico, impressora, limpar)
- [ ] Fix OAuth callback error - white screen with {"error":"OAuth callback failed"} when accessing /admin

## Correções de Segurança (do PR #2)
- [x] Adicionar .manus/db/ ao .gitignore
- [x] Remover credenciais hardcoded dos scripts (check-order-240.mjs, seedAdmin.mjs)
- [x] Criar ENV_REFERENCE.md com todas as variáveis de ambiente (referência)
- [x] P04: Adicionar rate limiting ao webhook iFood
- [x] P05: Webhook Stripe retornar 401 em assinatura inválida (hoje retorna 200)
- [x] P29: Mover 32 scripts da raiz para /scripts
- [x] P25: Substituir console.logs sensíveis por logger condicional em 26 arquivos
- [x] P06: JWT admin com secret independente via ADMIN_JWT_SECRET
- [x] P07: Rate limiter para consulta de pedidos por telefone (20 req/15min)
- [x] P11: Senha mínima mais forte: mínimo 8 caracteres
- [x] P13: Header HSTS adicionado ao Helmet
- [x] P14: Bloquear path traversal (../) no upload S3
- [x] P26: Dividir routers.ts (7.330 linhas) em 37 routers separados por domínio
- [x] Adicionar compressão de imagem no frontend antes do upload (fix: imagens grandes falhavam por exceder limite de 5MB)
- [x] Fix: modal de melhoramento de imagem com IA - removida condição isEditing para funcionar na criação + botão sparkles no hover
- [x] Criar endpoint separado de enhance de imagem sem productId para funcionar na criação de produto (upload.enhanceImage)

## Aplicar correções dos PRs abertos (manual)

### PR #10 - SEO e Performance PublicMenu
- [x] S01: Meta tags genéricas substituídas por descrição relevante
- [x] S04: Font Inter movida de @import CSS para <link> no HTML
- [x] S05/S15: Cover image com loading="eager" + fetchPriority="high"
- [x] S06: aspect-ratio nos containers de imagem (previne CLS)
- [x] S08: <link rel="preconnect"> para CDN CloudFront

### PR #11 - UX e Segurança Admin Frontend
- [x] F13: Validação de protocolo em URLs de screenshot (bloqueia javascript: e data:)
- [x] F01: Botão "Confirmar" disabled durante pending (evita clique duplo)
- [x] F02/F03: Input de dias de trial valida range 1-90
- [x] F08: "Bloquear/Desbloquear menu" exige confirmação via dialog
- [x] F20: Debounce de 400ms na busca de restaurantes

### PR #9 - Segurança Admin Backend
- [x] A01: Parsing de cookies com req.cookies em vez de manual
- [x] A02: Rate limiting nos endpoints admin (login + mutations 50 req/15min)
- [x] A05: Senha mínima 8 chars no login admin
- [x] A07: Validação de input na listagem de restaurantes
- [x] A08: Limite total de 365 dias para extensão de trial

### PR #6 - Auth Webhook WhatsApp (P10)
- [x] Nova coluna webhookSecret na tabela whatsappConfig
- [x] URL do webhook inclui token secreto (todas as 4 ocorrências atualizadas)
- [x] Validação timing-safe do token no endpoint do webhooktica de token ao conectar

## Bugs
- [x] Fix: Imagem de capa do menu público cortada/pequena no desktop (removido aspect-ratio conflitante do PR #10)

### PR #14 - Quick Wins Batch (11 melhorias)
- [x] A04: Impersonate retorna expiresAt, toast mostra horário
- [x] A06: Paginação client-side (20/página) na listagem de Trials
- [x] S07: Logo do restaurante com responsive sizes
- [x] S10: Páginas de erro usam h2 em vez de h1 duplicados
- [x] S11: aria-label nos botões de ícone (menu mobile, compartilhar)
- [x] F07: DropdownMenuItems disabled quando mutation pendente
- [x] F11: Removido toast.success duplicado nas notas
- [x] F14: Toast de sessão expirada quando auth.me retorna erro
- [x] F16: Input de dias extras no Trial restrito a 0-90 no onChange
- [x] F17: Texto "Carregando..." durante loading state do admin
- [x] F28: maxLength=1000 + contador de caracteres no textarea de notas

### PR #15 - Skeleton Loading + Filtros URL
- [x] F12: Dashboard cards com skeleton loading animado
- [x] F18: AdminRelatorios com empty state melhorado e skeleton loading
- [x] F25: Filtros persistidos na URL (AdminRestaurantes, AdminTrials)

### PR #17 - Mobile UX Improvements on PublicMenu
- [x] MU04: Remover user-scalable=no do viewport, permitir zoom acessível (max-scale=5)
- [x] MU05: CSS iOS para prevenir auto-zoom em inputs (font-size >= 16px)
- [x] MU08: safe-area-inset-bottom no carrinho flutuante (iPhone notch/home indicator)
- [x] MU03: Aumentar touch target das abas de categoria (py-2 → py-3)
- [x] MU01: Aumentar touch target do botão limpar busca + aria-label
- [x] MU21: aria-labels em botões de ícone (quantity +/-, close, etc.)
- [x] Botões +/- quantidade de 32px → 40px (product detail + cart items)
- [x] active:bg states para feedback tátil no mobile (todos os botões de quantidade)

### PR #12 - Performance + Validações Admin
- [x] S13: React.lazy() para 4 páginas pesadas (PublicMenu, PDV, Pedidos, MesasComandas)
- [x] S17: Vite manualChunks (react-vendor, ui-vendor, query-vendor)
- [x] S20: Cache headers otimizados no express.static (immutable para hashed assets)
- [x] F04: ID inválido na URL /admin/restaurantes/:id mostra erro amigável
- [x] F05: Impersonate trata popup bloqueado pelo navegador
- [x] F06: Validação nome obrigatório + formato email ao editar contato
- [x] F09: Impede salvar mesmo plano no dialog de alteração

### PR #5 - Performance P22, P24
- [x] P22: useMemo chartData + prevTotalPedidos em Dashboard.tsx
- [x] P22: useMemo ordersByStatus + constantes de animação em Pedidos.tsx
- [x] P22: useMemo filteredProducts, sortedCategories, categoryCounts, calculateTotal em PDV.tsx
- [x] P22: useMemo sortedCategories, categoryCounts, calculateTotal, calculateTabTotal, getDisplayTotal em PDVSlidebar.tsx
- [x] P24: 77 indexes adicionados em 52 tabelas do schema Drizzle + db:push aplicado

### PR #13 - Audit Log, CSV Export
- [ ] A03: Nova tabela admin_audit_log no schema + db:push
- [ ] A03: Funções logAdminAction() e getAuditLogs() no adminDb.ts
- [ ] A03: Rotas admin.auditLog.list no adminRouter.ts
- [ ] A03: Chamadas logAdminAction() em todas as mutations admin
- [ ] A03: Nova página /admin/audit-log com paginação
- [ ] A03: Item "Log de Atividades" no menu lateral admin
- [ ] A09: Rota admin.export.restaurantsCsv e admin.export.auditLogCsv
- [ ] A09: Função getRestaurantsForExport() no adminDb.ts
- [ ] A09: Botão "Exportar CSV" na página de restaurantes e audit log

## PR #13 - Audit Log Admin + CSV Export
- [x] A03/F29: Criar tabela admin_audit_log no schema com indexes
- [x] A03/F29: Criar função logAdminAction() no adminDb.ts
- [x] A03/F29: Criar função getAuditLogs() com paginação e filtros
- [x] A03/F29: Criar função getAuditLogsCsv() para exportação CSV
- [x] A03/F29: Criar rotas admin.auditLog.list e admin.export.auditLogCsv
- [x] A03/F29: Adicionar logAdminAction() em todas as mutations admin (login, changePlan, toggleMenu, extendTrial, resetTrial, forceExpire, impersonate, updateSubscription, updateContact, convertToPaid, convertLegacy, orphanCleanup)
- [x] A03/F29: Criar página AdminAuditLog.tsx com tabela, paginação, filtros e export CSV
- [x] A03/F29: Adicionar item "Log de Atividades" no menu sidebar admin
- [x] A03/F29: Adicionar rota /admin/audit-log no App.tsx
- [x] A09: Criar função getRestaurantsForExport() para CSV de restaurantes
- [x] A09: Criar rota admin.export.restaurantsCsv
- [x] A09: Botão "Exportar Restaurantes" na página de Audit Log
- [x] Testes vitest para audit log (8 testes passando)

## PR #3 - Correções de Segurança P09, P15, P20
- [x] P20: Criar client/src/lib/safeFetch.ts (safe JSON parse para Safari)
- [x] P20: Atualizar tRPC client para verificar Content-Type antes de parsear JSON
- [x] P15: Migrar leitura de sessão colaborador de localStorage para cookie no frontend
- [x] P15: Remover localStorage.setItem('collaborator_session') do Login.tsx
- [x] P15: Atualizar AdminLayout.tsx para ler collaborator_info do cookie
- [x] P09: Criar server/_core/apiKeyHash.ts (hash SHA-256)
- [x] P09: Adicionar coluna apiKeyHash no schema botApiKeys
- [x] P09: Atualizar botApiRouter.ts para buscar por hash com fallback plaintext
- [x] P09: Migração automática de keys antigas para hash
- [x] Fechar PR #3 no GitHub (P12 CSRF não aplicado - não solicitado)

## Bug Fix - Spotlight posicionamento desktop
- [x] Corrigir spotlight "Pedido enviado" que aparece no lado esquerdo em vez de apontar para o botão "Pedidos" no header direito (desktop)

## Bug Fix - Notificações WhatsApp não chegam após pedido
- [x] Investigar por que notificações WhatsApp não estão sendo enviadas após pedido no menu público
- [x] Verificar se correções P09 (hash API keys) afetaram autenticação do bot WhatsApp
- [x] Causa raiz: coluna webhookSecret existia no schema Drizzle mas não no banco de dados
- [x] Correção: adicionada coluna webhookSecret na tabela whatsappConfig via ALTER TABLE
- [x] Também adicionada coluna apiKeyHash na tabela botApiKeys (faltava do P09)

## Bug Fix - Erro ao adicionar entregador (tabela drivers)
- [x] Investigar colunas faltando na tabela drivers (repasseStrategy, fixedValue, percentageValue)
- [x] Sincronizar schema Drizzle com banco de dados
- [x] Causa raiz: enum repasseStrategy no DB não tinha valor 'none' (schema Drizzle tinha ['none','neighborhood','fixed','percentage'] mas DB só tinha ['neighborhood','fixed','percentage'])
- [x] Correção: ALTER TABLE para adicionar 'none' ao enum

## Melhoria - Histórico de mesa filtrado por dia (cutoff 5h)
- [x] Filtrar getTableHistory para mostrar apenas eventos do dia atual (cutoff às 5h da manhã)
- [x] Filtrar também pedidos parciais e pedidos de cozinha pelo mesmo cutoff
- [x] Corrigir timezone: usar UTC explícito para 5h BRT (08:00 UTC) em vez de hora local do servidor
- [x] Corrigir: comandas abertas (status='open') sempre aparecem no histórico, independente da data de criação. Só comandas fechadas são filtradas pelo cutoff.

## Bug Fix - Notificação entregador não enviada ao aceitar pedido
- [ ] Investigar por que entregador não recebe notificação quando pedido é aceito (trigger: on_accepted)

## Bug Fix - Notificação entregador não enviada ao aceitar pedido
- [ ] Investigar por que entregador não recebe notificação WhatsApp quando pedido é aceito (trigger: on_accepted)

## Bug Fix - Som de notificação tocando na página de cozinha
- [x] Som de novo pedido (menu público) está tocando na página de cozinha quando deveria tocar apenas na página de pedidos
- [x] Pedidos do menu público não deveriam acionar som na página de cozinha (apenas pedidos de mesa/PDV)

## Bug Fix - Som da cozinha tocando ao fechar mesa
- [x] Som de notificação da cozinha toca quando uma mesa é fechada - não deveria tocar
- [x] Causa raiz: closeTable e partialCloseTable chamavam createOrderWithNumber que envia SSE new_order
- [x] Correção: adicionado parâmetro skipSSE a createOrderWithNumber, usado em closeTable e partialCloseTable

## Bug Fix - Som da cozinha ao fechar mesa com pagamento avulso
- [x] Fechar mesa com pagamento avulso ainda toca som na cozinha - encontrar caminho de código adicional
- [x] Causa raiz: função loosePayment() também chamava createOrderWithNumber sem skipSSE
- [x] Correção: adicionado skipSSE: true na chamada de createOrderWithNumber em loosePayment()

## Bug Fix - Valor da mesa não atualiza após pagamento avulso
- [x] Após pagamento avulso, mesa ainda mostra total original em vez do saldo restante
- [x] Correção: getTableTotal em MesasComandas.tsx agora subtrai tab.paidAmount do total exibido

## Bug Fix - Card de mesa não mostra valor quando saldo é 0 após pagamentos avulsos
- [x] Card de mesa mostra "1 item" mas sem valor quando saldo restante é 0 após pagamentos avulsos
- [x] Correção: quando saldo é 0 mas tem paidAmount > 0, mostra "Pago" em verde (grid e lista)

- [x] Fix: getTableTotal filtra itens cancelados antes de somar (evita total inflado após pagamento parcial)
- [x] Fix: remover label "Pago" do card de mesa (não solicitado)
- [x] Fix: ao trocar de mesa ocupada para mesa livre no PDV, aba deve voltar para "Mesa" em vez de ficar em "Comanda"
- [x] Adicionar imagem de fundo do colaborador na página de login (trocar bg ao clicar em "Sou Colaborador")
- [x] Criar imagem Open Graph no estilo do banner lateral do login (foto restaurante + overlay vermelho + logo + texto)

- [x] Fix: Recibo não aparece após fechar mesa (confirmado: comportamento correto com impressão automática)
- [x] Re-aplicar: Título da comanda mostra apenas "Comanda" ou nome da mesa (sem código longo C2000034)
- [x] Re-aplicar: Redesign do Mindi Bot (renomear para "Mindi Bot", ícone azul, remover card API)
- [x] Re-aplicar: Banner horizontal do Mindi Bot (estilo alerta "produtos sem foto")
- [x] Re-aplicar: Estilo do slidebar de Fidelização — header gradiente vermelho padronizado
- [x] Re-aplicar: Estilo da sidebar com seleção bg-primary/15, text-primary, rounded-xl (estilo /admin)

## Busca de Cliente por Telefone (WhatsApp Bot)
- [x] API endpoint GET /api/bot/customer-lookup para buscar cliente por telefone
- [x] Buscar primeiro em pdv_customers, depois no último pedido com delivery
- [x] Salvar/atualizar cliente em pdv_customers quando pedido é criado pelo bot
- [x] Nova tool buscar_cliente no n8n conectada ao agente de pedidos
- [x] Atualizar prompt do PASSO 3 para usar buscar_cliente antes de perguntar endereço

## Bugs
- [ ] Bot WhatsApp parou de responder após implementação do customer lookup
- [x] Bug: Bot não pergunta confirmação do endereço salvo antes de prosseguir
- [x] Bug: Bot reinicia fluxo após resposta de pagamento em vez de montar resumo final
- [x] Bug: buscar_cliente tool não está sendo chamada pelo bot antes de perguntar endereço
- [ ] Bug: Bot não responde com detalhes do pedido após confirmação com "sim"
- [x] Bug: Buscar Cliente Pre não está injetando dados do cliente no agente pedidos - bot continua perguntando endereço
- [x] Add interactive WhatsApp buttons (Sim/Não) to address confirmation message
- [x] Add interactive WhatsApp buttons (Sim/Não) to order summary confirmation message
- [x] Bot should remember customer last delivery address from previous orders
- [x] Create API endpoint to fetch customer last address by phone number
- [x] Update agent prompt to use last address and suggest it instead of asking from scratch
- [x] Integrar Mandrill para envio de e-mails de redefinição de senha
- [x] Criar endpoint de solicitação de reset de senha (forgot-password)
- [x] Criar endpoint de redefinição de senha com token (reset-password)
- [x] Criar template HTML do e-mail de redefinição de senha
- [x] Criar página frontend de "Esqueci minha senha"
- [x] Criar página frontend de "Redefinir senha" (com token)
- [x] Escrever testes para validar a integração Mandrill
- [x] Implement Google Places Autocomplete in delivery modal
- [x] Implement GPS "Usar minha localização" button
- [ ] Add map confirmation with draggable pin
- [ ] Add number, complement, reference fields after address selection
- [x] Integrate address picker with existing order flow
- [x] Fix GPS location stuck on Obtendo localização in DeliveryAddressPicker

## Reaproveitar componente de localização das configurações no checkout
- [x] Analisar componente de localização da página de configurações do estabelecimento
- [x] Refatorar DeliveryAddressPicker para reaproveitar o mesmo estilo e lógica
- [x] Unificar busca de endereço e GPS em componente compartilhado

## Refatorar botões de endereço de entrega
- [x] Buscar endereço: mostrar campos de endereço inline (rua, número, bairro, cidade, CEP) sem abrir modal
- [x] Usar localização: abrir o modal do mapa (AddressMapPicker) como já funciona
- [x] Melhorar estilo dos botões de seleção para ficar mais alinhado com o design do app

## Corrigir link Ver no Maps na mensagem do entregador
- [x] Verificar se latitude/longitude estão sendo coletadas no checkout
- [x] Verificar se latitude/longitude estão sendo salvas no pedido
- [x] Corrigir link Ver no Maps para abrir Google Maps em modo navegação/rota

## Bug: Erro ao criar pedido com coordenadas
- [x] Corrigir decimal(10,7) insuficiente para coordenadas GPS (valores como -40.944593927404895 excedem o limite)

## Geocodificar endereços digitados manualmente
- [x] Implementar geocodificação no backend quando pedido não tem lat/lng
- [x] Usar API do Google Maps (via proxy) para converter endereço texto em coordenadas
- [x] Incluir cidade/estado do estabelecimento no endereço para melhorar precisão

## Renomear botão do entregador
- [x] Renomear 'Ver no Maps' para 'Abrir rota' na mensagem do entregador

## Padronizar estilo das seleções de pagamento
- [x] Alterar seleções de forma de pagamento para usar o mesmo estilo das seleções de forma de entrega (check vermelho à direita, sem radio button azul à esquerda)
- [x] Corrigir delay na transição entre modo escuro e modo claro - otimizar CSS theme-transition para não aplicar em todos os elementos DOM
- [x] Reduzir tamanho do valor (R$) no card de cupom na página de Cupons para tornar o card mais compacto
- [x] Aplicar efeito de slide animado nos filtros da Dashboard (Hoje/Esta semana/Este mês) igual ao PDV, sem alterar visual
- [x] Aplicar efeito sliding pill no seletor Kanban/Lista da página de Pedidos
- [x] Aplicar efeito sliding pill no seletor da página de Cozinha
- [x] Aplicar efeito sliding pill nas abas Layout e Fontes / Mindi Printer / API da página de Impressora
- [x] Aplicar efeito SlidingTabs no seletor 7d/14d/30d do card de Pedidos na Dashboard

## Reordenar Fluxo do Onboarding
- [x] Reordenar steps: Step 1 Plano → Step 2 Restaurante → Step 3 Atendimento → Step 4 Objetivos → Step 5 Email/Senha
- [x] Adicionar procedure registerAndCreateEstablishment no auth router
- [x] Adicionar Step 5 (final) com formulário de email/senha
- [x] No submit final, chamar registerAndCreateEstablishment em vez de establishment.create
- [x] Seleção de plano como pré-tela (sem step indicator), steps 1-4 são: Restaurante, Atendimento, Objetivos, Email/Senha
- [x] Redesenhar cards de plano no onboarding: estilo do modal de entrega (ícone esquerda, nome+badge, radio direita, features em dropdown expansível)
- [x] Cards de tipo de entrega no onboarding Step 1: mudar para estilo horizontal da página de Configurações (ícone esquerda com fundo rosado, texto ao lado em vermelho)
- [x] Cards de formas de pagamento e taxa de entrega no Step 2: mudar para estilo horizontal (ícone esquerda com fundo rosado, texto ao lado em vermelho)
- [x] Remover "Já tem uma conta? Fazer login" do Step 4 do onboarding
- [x] Adicionar botão vazado "Explorar primeiro" abaixo do botão de criar categoria na sidebar de boas-vindas
- [x] Remover texto "Melhora a experiência de compra" da sidebar de boas-vindas
- [x] Ao clicar em "Adicionar Produto" na sidebar de boas-vindas, fechar sidebar e abrir sidebar de Novo Produto
- [x] Fix: Ao clicar em "Adicionar Produto" na sidebar de boas-vindas, deve navegar para /catalogo?action=new-product e abrir a sidebar de Novo Produto
- [x] Fix: Ao clicar em "Configurar Horários" na sidebar de boas-vindas, fazer scroll automático para o card de Horários de funcionamento na página de configurações
- [x] Fix: Highlight do card de Horários deve ter bordas arredondadas e animação de pulso suave
- [x] Fix: Etapa "Configurar atendimento" deve ser concluída somente quando pelo menos 6 dias da semana tiverem horários definidos (não apenas 1 dia)
- [x] Remover texto "Clientes reconhecem sua marca facilmente" do card de Adicionar foto e capa na sidebar de boas-vindas
- [x] Remover texto "Pix é o meio de pagamento mais usado no Brasil" do card de Cadastrar chave Pix na sidebar de boas-vindas
- [x] Remover texto "Reduz o tempo de resposta ao cliente" do card de Ativar notificação sonora na sidebar de boas-vindas
- [x] Remover texto "Garante que o fluxo completo funciona" do card de Testar um pedido na sidebar de boas-vindas
- [x] Fix: Botão de filtro selecionado (Hoje/Esta semana/Este mês) na Dashboard invisível no modo escuro - deve ficar vermelho quando selecionado
- [x] Fix: Botão de filtro selecionado na Dashboard deve ter fundo branco (não vermelho) com texto vermelho
- [x] Fix: Cor do texto do filtro selecionado na Dashboard deve ser preto (não vermelho)
- [x] Fix: Filtro 7d/14d/30d no card de Pedidos na Dashboard invisível no modo escuro - mesmo estilo: fundo branco, texto preto
- [x] Remover campo "Capacidade por mesa" do modal de criar mesas
- [x] Aplicar efeito pill (SlidingTabs) no toggle Grid/Lista da página de mesas
- [x] Fix: Erro ao logar - colunas lastSignedIn, resetToken, resetTokenExpiresAt não existem na tabela users do banco
- [x] Fix: Pill do filtro Hoje/Esta semana/Este mês não aparece na primeira renderização da Dashboard (versão dev)
- [x] Mudar "Sou colaborador" de botão para link de texto na página de login
- [x] Fix: Quando restaurante é aberto manualmente e horário programado começa, limpar flag manuallyOpened para seguir horário automático (incluindo fechamento)
- [x] Fix: Botão "Voltar" na página de criar conta não volta para a página de login
- [ ] Implementar verificação de email com código OTP de 5 dígitos no fluxo de cadastro (após email/senha, antes de continuar)

## Verificação de Email OTP no Signup
- [x] Criar tabela email_verification_codes no banco de dados
- [ ] Criar procedimentos tRPC para enviar e verificar código OTP via Mandrill
- [ ] Criar componente UI de input OTP com 5 caixas
- [ ] Integrar verificação de email no fluxo de signup (entre email/senha e criação de conta)
- [ ] Opção de editar email e reenviar código
- [ ] Corrigir botão Voltar na página de signup para navegar ao login
- [ ] Testes unitários para fluxo de verificação de email
- [x] Alterar botão Voltar no Step 4 para texto simples com setinha (sem estilo de botão), abaixo do botão Verificar email
- [x] Bug: Corrigir erro de insert na tabela email_verification_codes (Failed query) - tabela não existia no banco
- [x] Remover título, descrição e step indicator da tela de verificação OTP
- [x] Fix Step 4: mostrar campos email+senha+confirmar senha ANTES do OTP, após verificar OTP criar conta automaticamente e redirecionar ao admin

## Chat WhatsApp no Dashboard
- [x] DB: Criar tabelas whatsapp_conversations e whatsapp_messages
- [x] Backend: Webhook endpoint para receber mensagens da UAZAPI (integrado no webhook existente)
- [x] Backend: SSE endpoint para push em tempo real por establishmentId (pool adicionado ao sse.ts)
- [x] Backend: tRPC procedures (listar conversas, buscar mensagens, enviar resposta)
- [ ] Backend: Configurar webhook URL na criação/conexão de instância UAZAPI
- [x] Frontend: Botão flutuante verde (estilo WhatsApp) no canto inferior direito
- [x] Frontend: Painel de chat flutuante com lista de conversas e thread de mensagens
- [x] Frontend: Input para digitar e enviar mensagens
- [x] Frontend: Filtros (Tudo, Atenção, Bot)
- [x] Frontend: Busca de conversas
- [x] Frontend: Conexão SSE para receber mensagens em tempo real

## Redesign Chat Widget — Estilo Sidebar Compact (#7)
- [x] Substituir design escuro (WhatsApp) pelo estilo Sidebar Compact com cores Mindi (vermelho + branco)
- [x] Barra lateral compacta com avatares circulares e badges de não lidas
- [x] Indicador de status (Bot ativo / Atendimento humano) no header do chat
- [x] Mensagens enviadas em vermelho, recebidas em branco com borda
- [x] Input de mensagem com fundo claro e botão vermelho
- [x] Manter todas as funcionalidades existentes (SSE, enviar, filtros, busca, assumir/devolver bot)

## Ajustes Chat Widget — Estilo White & Red Outline + Mock + Tamanho
- [x] Aplicar estilo de balões White & Red Outline (branco com borda vermelha para recebidas, vermelho sólido para enviadas)
- [x] Adicionar 7 conversas mockadas com mensagens de exemplo
- [x] Aumentar tamanho do popup em 25%

## Escalar Chat Widget +30% largura com proporção
- [x] Aumentar largura do popup em 30% (600→780px, altura proporcional)
- [x] Escalar proporcionalmente: textos, ícones, avatares, badges, espaçamentos

## Sidebar Expandível no Chat Widget
- [x] Adicionar toggle para expandir/recolher sidebar de contatos
- [x] Sidebar expandida: header vermelho com título "Conversas" + contagem, lista com avatar + nome + preview + badge
- [x] Sidebar recolhida: apenas avatares compactos (comportamento atual)

## Fechar chat ao clicar fora
- [x] Adicionar detecção de clique fora do popup para fechar o chat

## Sidebar branca no Chat Widget
- [x] Mudar sidebar expandida de fundo vermelho para fundo branco com textos escuros
- [x] Remover barra compacta de avatares vermelha, usar lista de contatos sempre visível com fundo branco
- [x] Header "Conversas" em texto escuro, avatares vermelhos, nomes em preto, preview em cinza
- [x] Botão de pesquisa no rodapé da sidebar em cinza

## Ajustes Chat Widget — Ícone e painel direito
- [x] Adicionar ícone de chat (MessageCircle) ao lado esquerdo do título "Conversas" no header da sidebar
- [x] Lado direito mostra apenas o chat (thread de mensagens), sem lista de contatos duplicada

## Efeito blur no fundo ao abrir chat
- [x] Adicionar overlay com backdrop-blur (estilo Apple/iPhone) atrás do chat quando aberto

## Fix blur overlay z-index
- [x] Aumentar z-index do overlay de blur para cobrir a sidebar do menu (z-index acima da sidebar)

## Reduzir altura do chat em 15%
- [ ] Diminuir altura do popup de 820px para ~697px

## Reduzir altura do chat em 20%
- [x] Diminuir altura do popup de 820px para ~656px

## Chat como Sidebar Lateral Direita
- [x] Transformar chat de popup flutuante para sidebar lateral direita (slide-in)
- [x] Cabeçalho no estilo do modal de Novo Produto
- [x] Manter todas as funcionalidades existentes (conversas, mensagens, SSE, envio, busca)

## Fix Cabeçalhos Chat Sidebar
- [x] Igualar altura dos headers esquerdo e direito da sidebar de chat
- [x] Reduzir tamanho dos headers (mais compactos)
- [x] Mover filtros (Tudo/Atenção/Bot) para fora do header, abaixo dele

## Chat Mobile — Layout Tela Cheia
- [x] Chat ocupa tela inteira no mobile (100vw x 100vh)
- [x] Navegação entre lista de conversas e conversa ativa (mostrar um de cada vez)
- [x] Botão voltar no header da conversa para retornar à lista
- [x] Header compacto adaptado para mobile
- [x] Input de mensagem fixo no fundo da tela

## Ajustes Chat — Remover lupa e header direito branco
- [x] Remover ícone de lupa do rodapé da sidebar de contatos
- [x] Mudar cabeçalho direito de gradiente vermelho para fundo branco com textos escuros e ícones vermelhos

## Ajustes Chat — Remover X no desktop
- [x] Remover botão X de fechar do header direito no desktop (manter apenas no mobile)

## Ajustes Chat — Reduzir botão flutuante
- [x] Reduzir tamanho do botão flutuante de chat em 15% (botão, ícone e badge)

## Chat — Migrar armazenamento para localStorage
- [x] Criar utilitário de armazenamento local (localStorage) para conversas e mensagens
- [x] Atualizar WhatsAppChatWidget para usar localStorage em vez de queries ao banco
- [x] Atualizar webhook para apenas enviar SSE sem salvar no banco
- [x] Simplificar tRPC router (remover queries de mensagens do banco, manter envio e SSE)
- [x] Testar fluxo completo: receber via SSE → salvar local → exibir no chat

## Chat — Notificação sonora
- [x] Upload do arquivo de som para CDN
- [x] Implementar reprodução do som ao receber mensagem com chat fechado

## Chat — Ícone mute/unmute no cabeçalho
- [x] Adicionar ícone de som (Volume2/VolumeX) no cabeçalho "Conversas" para ativar/desativar notificação sonora

## Chat — Preview do som ao ativar
- [x] Tocar preview do som de notificação ao clicar para ativar o som (também desbloqueia autoplay do navegador)

## Layout — Empilhar botões flutuantes
- [x] Posicionar foguete (primeiros passos) acima do chat, empilhados verticalmente sem sobreposição

## Bug — Mensagens automáticas do bot (n8n) não aparecem no chat
- [x] Investigar e corrigir: respostas automáticas do bot (fromMe via n8n/UAZAPI) não estão aparecendo no chat widget

## Chat — Remover "Online" do cabeçalho
- [x] Remover texto "Online •" do cabeçalho direito do chat, exibir apenas nome e telefone

## Dashboard — Data dinâmica no cabeçalho
- [x] Substituir "Visão geral do seu estabelecimento" pela data de hoje formatada em português (ex: domingo, 22 de março de 2026)

## Bug — Mensagens do cliente e bot criando conversas separadas
- [x] Corrigir: mensagens incoming (cliente) e outgoing (bot/fromMe) estão criando conversas separadas em vez de ficarem no mesmo chat

## Chat — Reduzir tamanho dos balões de mensagem
- [x] Reduzir tamanho dos balões em 25% (fonte, padding, largura máxima, timestamp)

## Chat — Ícone de robô para mensagens automáticas
- [x] Adicionar ícone de robô ao lado esquerdo do timestamp em mensagens outgoing do bot para diferenciar de respostas manuais

## Chat — Tooltip no ícone de robô
- [x] Adicionar tooltip "Resposta automática do bot" ao passar o mouse sobre o ícone de robô

## Chat — Indicador "digitando..." (CANCELADO pelo usuário)
- [x] ~Cancelado - não será implementado~

## Chat — Reduzir balões mais 10% e aplicar degradê
- [x] Reduzir tamanho dos balões de mensagem em mais 10%
- [x] Aplicar degradê vermelho mais claro nos balões outgoing (estilo cabeçalho Conversas)

## Chat — Mover ícone de robô para ao lado do balão
- [x] Mover ícone de robô do timestamp para o lado esquerdo do balão da mensagem

## Chat — Reduzir altura do campo de mensagem
- [x] Reduzir altura do campo de input e área de envio em 15%

## Chat — Corrigir tooltip do ícone de robô
- [x] Substituir title nativo por tooltip customizado visível no hover

## Bug: Status do bot no chat não sincroniza com página Mindi Bot
- [x] Corrigir sincronização do status bot ativo/desativado entre página Mindi Bot e chat widget

## Bug: Badge de não lidas aparece mesmo com conversa aberta
- [x] Auto-marcar mensagens como lidas quando a conversa está aberta e selecionada

## Feature: Highlight/Spotlight do Chat WhatsApp
- [x] Criar overlay de highlight com foco no ícone do chat e texto explicativo sobre a novidade
- [x] Salvar em localStorage para não mostrar novamente após dismiss

## Chat — Ajustes visuais lista de conversas
- [x] Avatar do contato com fundo vermelho degradê em vez de cinza
- [x] Remover filtro Atenção, manter apenas Tudo e Bot

## Chat — Sidebar arredondada e mais larga
- [x] Borda esquerda da sidebar arredondada (rounded-l-2xl)
- [x] Largura da sidebar aumentada em 5% (780px → 819px)

## Chat — Modo escuro
- [x] Definir visual dark mode para sidebar do chat (fundo, textos, bordas)
- [x] Dark mode para lista de conversas (avatares, filtros, header)
- [x] Dark mode para área de mensagens (balões, input, header)
- [x] Dark mode para highlight/spotlight overlay

## Chat — Mensagens amigáveis para tipos de mídia
- [x] Exibir mensagem amigável para imagem (📷)
- [x] Exibir mensagem amigável para áudio (🎵)
- [x] Exibir mensagem amigável para vídeo (🎥)
- [x] Exibir mensagem amigável para documento (📄)
- [x] Exibir mensagem amigável para localização (📍)
- [x] Exibir mensagem amigável para sticker e contato

## Bug — Texto "NOVA ENTREGA!" não aparece no chat
- [x] Investigar por que o título da mensagem de entrega não aparece no chat widget
- [x] Corrigir renderização para exibir o texto completo incluindo "NOVA ENTREGA!"

## Feature — Reconhecer número do entregador no chat
- [x] Cruzar número do contato com tabela de entregadores
- [x] Exibir "Entregador" como nome do contato quando número for de entregador cadastrado

## Bug — Resposta de botão do entregador aparece como "[media]" no chat
- [x] Investigar por que cliques em botões ("Sair para entrega", "O pedido foi entregue") aparecem como "[media]"
- [x] Extrair texto do botão clicado (selectedButtonId/buttonText) e exibir no chat

## Bug — Highlight do chat aparece na frente do modal de boas-vindas
- [x] Corrigir para que o highlight do chat só apareça após o modal de boas-vindas ser fechado

## Bug — Highlight do chat reaparece após clicar "Experimentar agora" e fechar o chat
- [x] Corrigir para que o highlight não reapareça após clicar "Experimentar agora"

## Feature — Background pattern para área de mensagens do chat
- [x] Gerar 5 opções de background estilo doodle/pattern com tema restaurante/delivery Mindi
- [x] Apresentar opções ao usuário para escolha
- [x] Aplicar background escolhido na área de mensagens do chat widget (opção 3 - rosa kawaii)

## Ajuste — Aumentar tamanho dos balões e textos do chat em 15%
- [x] Aumentar font-size (12px→14px), padding (px-2.5 py-1.5→px-3 py-2), max-width (60%→70%), timestamp (10px→11px)

## Feature — Barra de pedido ativo no header do chat
- [x] Backend: reutilizado endpoint existente publicMenu.getOrdersByPhone (melhorado matching de telefone)
- [x] Frontend: barra compacta com número do pedido, status badge, total e tempo (📦 #P6 · 🟡 Preparando · R$ 30,00 · há 12 min)
- [x] Frontend: timeline de progresso visual com estágios do pedido
- [x] Frontend: card expansível com detalhes do pedido (itens, endereço, pagamento)
- [x] Integrar componente no header do chat abaixo do nome do contato

## Bug URGENTE — Erro 429 (Rate exceeded) bloqueando login dos restaurantes
- [x] Investigar rate limiter no auth.loginWithEmail (max: 10 por IP, todos compartilhando mesmo IP via proxy)
- [x] Corrigir: aumentado max 10→30, adicionado keyGenerator com X-Forwarded-For para IP real
- [x] Investigação profunda: 429 vem da infraestrutura Manus/Cloudflare, não do Express
- [x] Remoção TOTAL de rate limiting: removidos authLimiter, webhookLimiter, publicApiLimiter, orderLookupLimiter, couponLimiter, adminMutationLimiter
- [x] Removidas todas as app.use() que aplicavam rate limiters nos endpoints tRPC
- [x] Removido webhookLimiter dos endpoints /api/webhook/whatsapp e /api/ifood/webhook
- [x] Removido import do express-rate-limit
- [x] Removido pacote express-rate-limit do package.json
- [x] Verificado: nenhuma referência a rate limiting restante no frontend

## Chat: Mostrar apenas último pedido na barra do chat
- [x] Alterar componente do chat header para exibir apenas o último pedido do cliente em vez de todos

## Orders SSE: Remover reset infinito de reconexão
- [x] Remover o RESET_DELAY que reinicia tentativas infinitamente após 10 falhas no useOrdersSSE.ts

## Teste: Desativar widget WhatsApp para diagnosticar 429
- [x] Desativar temporariamente o widget do WhatsApp para testar se é a causa do rate limit

## Otimizações de Rate Limit / SSE / Polling / Sitemap
- [x] SSE Orders: Limitar reconexão a max 10 tentativas com backoff exponencial (já feito em checkpoint anterior)
- [x] SSE Chat: Limitar reconexão a max 10 tentativas com backoff exponencial
- [x] React Query: Reduzir retries de 3 para 1
- [x] Polling: scheduling.pendingCount de 30s → 120s
- [x] Polling: establishment.getOpenStatus de 60s → 300s
- [x] Sitemap: Código já está correto (usa baseUrl dinâmico), infraestrutura Manus sobrescreve com sitemap próprio
- [x] Reativar widget WhatsApp com correções aplicadas

## Investigação: Erros TypeScript (75 erros)
- [x] Listar e categorizar todos os 75 erros TS
- [x] Verificar se afetam o sistema em produção (NÃO afetam)

## Investigação: Erro TS em server/db.ts:12069 (SendTextResponse)
- [x] Investigar erro Property 'error' does not exist on type 'SendTextResponse'

## Correção Erro 429 / Tráfego Excessivo
- [x] Fix sitemap.xml e robots.txt para usar domínio correto da Manus em vez de Cloud Run
- [x] Adicionar rate limiting middleware (express-rate-limit) no servidor Express
- [x] Bloquear crawlers nas páginas admin (robots.txt disallow + meta noindex)

## Bug: Modal Entrega e Pagamento - Seleção de Bairro Obrigatória
- [x] Quando taxa por bairro ativa e cliente seleciona "Taxa de entrega - A calcular", botão Próximo deve ficar desabilitado até selecionar bairro
- [x] Quando cliente seleciona "Retirar no local" ou "Consumir no local", não deve exigir seleção de bairro (taxa = grátis)

## Bug: Página Conta e Segurança
- [x] Notificação "Dados salvos com sucesso" aparece ao entrar na página sem fazer alterações
- [ ] Campo "Celular do responsável" mostra o nome do responsável em vez do número de celular

## Favicon
- [x] Atualizar favicon para usar o mesmo logo do topo do menu público (ícone vermelho com talheres)

## Bug: Card Top 10 Mais Vendidos cortado no mobile
- [x] Card "Top 10 | Mais vendidos" aparece cortado/com overflow na versão mobile da Dashboard

## Otimização: Minimizar erro 429 após deploy
- [x] Implementar exponential backoff + jitter no retry do tRPC client
- [x] Implementar reconexão SSE com delay escalonado/aleatório
- [x] Configurar staleTime mais alto no auth.me query

## SEO: Correções na página inicial
- [x] Ajustar título para 30-60 caracteres (atualmente 67)
- [x] Adicionar palavras-chave relevantes na página

## Bug: Página de Pedidos mostra todos os pedidos em vez de apenas os do dia
- [x] Filtrar pedidos para mostrar apenas os do dia atual no modo lista

## Impressora: Remover itens da Documentação Rápida
- [x] Remover itens 3, 4 e 5 do card Documentação Rápida (print_order, receipt URL, format=text)

## Bug: Aba de pedido no chat WhatsApp
- [x] Corrigir ##P1 para #P1 (duplo hash no número do pedido)
- [x] Adicionar status "Em Rota" e "Completo" na timeline do pedido
- [x] Mostrar o pedido mais recente do cliente (não o mais antigo)
- [x] Esconder aba do pedido quando pedido é concluído/completo

## Verificação: Timeline do pedido no chat atualiza em tempo real via SSE
- [x] Verificar se a timeline do ChatOrderBar atualiza quando o status do pedido muda (integrado com SSE)

## Corrigir ícone nas 20 animações de loading
- [x] Substituir ícone atual nas animações de loading pelo mesmo ícone SVG da tela de login (garfo e faca cruzados em X)

## Full Overlay Loading na tela de Login
- [ ] Adicionar animação Full Overlay (#20) como loading de transição ao fazer login

## Substituir loading atual pelo Full Overlay #20
- [x] Encontrar e substituir o loading existente do app pelo Full Overlay #20
- [x] Remover overlay duplicado do Login.tsx (manter apenas um loading)

## Alterar nome na página de login admin
- [x] Mudar "admin" para "admin super" na página /admin login

## Otimização de deploy
- [x] Mover imagens de products/ para CDN (eliminar 6.3MB do deploy) — client/public reduzido de 7.7MB para 448KB
- [x] Melhorar code splitting para reduzir bundle principal de 4.5MB → 728KB (-84.5%)
- [x] Corrigir erros TypeScript mais críticos (76 → 37 erros, -51%)

## Corrigir erros TypeScript no PublicMenu.tsx
- [x] Corrigir os 22 erros TypeScript restantes no PublicMenu.tsx (22 → 0 erros)

## Dados mockados no chat WhatsApp (apenas dev)
- [x] Adicionar 5 conversas simuladas entre restaurante e clientes no ambiente dev

## Remover tabela table_spaces
- [x] Remover tabela table_spaces do schema e do banco (não é usada no sistema)

## Corrigir scroll do chat de mensagens
- [x] Ao clicar numa conversa, ir diretamente para as últimas mensagens (sem mostrar topo primeiro)

## Frete Grátis acima de valor mínimo com Barra de Progresso
- [x] Adicionar campo freeDeliveryMinValue no schema do estabelecimento
- [x] Criar/atualizar endpoints backend para salvar e retornar o valor mínimo
- [x] Adicionar configuração na UI de settings do estabelecimento
- [x] Implementar barra de progresso no carrinho do PublicMenu (desktop e mobile)
- [x] Zerar taxa de entrega automaticamente quando valor mínimo é atingido
- [x] Corrigir todos os pontos de cálculo de taxa de entrega para usar helper getDeliveryFee
- [x] Corrigir erros TypeScript restantes (25 → 0 erros)
- [x] Recriar router tableSpaces e funções db para espaços de mesas
- [x] Adicionar tabela tableSpaces ao schema Drizzle
## Bug: Barra de frete grátis não aparece na sacola
- [x] Barra de progresso do frete grátis não aparecia ao adicionar item na sacola (removida condição baseFee===0 que bloqueava para deliveryFeeType=byNeighborhood)
## Animação de confete no frete grátis
- [x] Adicionar animação de confete quando a barra de progresso do frete grátis atinge 100%
## Shimmer e renomear frete grátis
- [x] Adicionar efeito shimmer no texto da barra de progresso do frete grátis
- [x] Renomear "frete grátis" para "entrega grátis" em todos os pontos
## Bug: Confetti não dispara no modal da sacola
- [x] Confetti não aparece quando a barra de entrega grátis é preenchida no modal da sacola mobile - corrigido: lógica de transição refatorada e zIndex aumentado para 999999
## Bug: Confetti ainda não aparece
- [x] Confetti corrigido: hooks movidos antes dos early returns (isLoading/error), deliveryType check removido, establishment adicionado às deps do useEffect
- [x] Mensagem "Você economizou R$ 0.00" escondida quando baseFee é 0
## Bug: Confetti não aparece em produção + texto antigo
- [x] Confetti corrigido com componente ConfettiTrigger dedicado (dispara ao montar quando achieved=true)
- [x] Texto corrigido para "Entrega grátis desbloqueada!" em todos os pontos
- [x] Mensagem "Você economizou" só aparece quando baseFee > 0
## Ajuste do card de item na sacola
- [x] Diminuir tamanho do card do item na sacola em 15%
- [x] Esconder botões de - e + por padrão, mostrar apenas ao clicar no item (expansível)
## Ajuste de tamanho do card na sacola
- [ ] Aumentar tamanho do card do item na sacola em 5% (redução ficou muito, ajustar de 15% para 10%)

## Indicador de Expansão nos Cards do Carrinho
- [x] Adicionar ícone de seta para baixo (chevron down) nos cards de itens do carrinho (mobile e desktop) para indicar que o card é expansível para alterar quantidade
- [x] Seta deve girar para cima (chevron up) quando o card está expandido

## Bug: Texto de economia na entrega grátis
- [x] Restaurar texto "Você economizou R$ X na entrega!" abaixo da barra de progresso de entrega grátis no carrinho (mobile e desktop)

## Bug: Barra fixa "Ver sacola" muito alta no mobile
- [x] Reduzir altura da barra vermelha fixa no rodapé mobile (Ver sacola) para ficar compacta como era antes
- [x] Reverter altura da barra "Ver sacola" para o valor original (py-3 e h-[68px]) a pedido do usuário

## Bug: Card de entrega grátis desbloqueada não aparece no estabelecimento 30001
- [x] Investigar e corrigir por que o card de progresso de entrega grátis não está aparecendo no menu público do estabelecimento 30001 (funciona no dev server - precisa publicar para produção)

## Bug: Confetti não re-dispara ao abrir sacola
- [x] Reescrever ConfettiTrigger com sistema de fireKey para re-disparar confetti toda vez que a sacola mobile é aberta com entrega grátis desbloqueada

## Bug: Confetti não dispara ao re-atingir frete grátis dentro da sacola aberta
- [x] Confetti deve disparar quando o usuário diminui quantidade (perde frete grátis) e depois aumenta novamente (re-atinge frete grátis) com a sacola já aberta

## Bug: Dois botões de entrega (Grátis e Selecionar) aparecendo ao mesmo tempo no desktop
- [x] Mostrar apenas "Selecionar" quando frete grátis NÃO foi atingido (para estabelecimentos com taxa por bairro)
- [x] Mostrar apenas "Grátis" quando frete grátis FOI atingido

## Bug: Badge "Grátis" ainda aparece incorretamente no desktop sidebar (persistente)
- [x] Badge "Grátis" aparece mesmo com sacola vazia e sem bairro selecionado
- [x] Texto "Grátis" abaixo do badge também aparece incorretamente
- [x] Verificar se o deploy está com o código atualizado (precisa publicar)
- [x] Bug: React error #310 no menu público (useMemo crash) - produção app.mindi.com.br
- [ ] Bug: Confetti dispara toda vez que modal da sacola mobile abre com frete grátis já atingido (deve disparar só quando threshold é cruzado)
- [x] Bug: Confetti dispara toda vez que modal da sacola abre (mobile e desktop) com frete grátis já atingido - deve disparar só quando threshold é cruzado
- [x] Criar página temporária com 10 exemplos de efeitos de confetti para card de entrega grátis desbloqueada
- [x] Substituir efeito confetti atual pelo efeito Celebração Completa (#40) com motinha e presente
- [x] Diminuir tamanho do card de entrega grátis desbloqueada em 5%
- [x] Diminuir tamanho dos ícones de lixeira e + no dropdown do item do carrinho em 4%
- [x] Diminuir mais 5% o card de entrega grátis (total 10% redução)
- [x] Diminuir tamanho dos emojis de motinha e presente no efeito celebração (de 28-42px para 18-28px)
- [x] Bug: Barra de pedido no chat mostra pedido antigo/concluído em vez do pedido mais recente do cliente

## Chat Order Bar - Correções de Status
- [x] Corrigir timeline de status: remover "Aguardando" e "Confirmado", usar Novo → Em Preparo → Pronto → Em Rota → Finalizado
- [x] Corrigir ícone de relógio no card de observação (trocar Timer por ícone de nota/observação)
- [x] Verificar que SSE atualiza a barra de status do chat em tempo real quando status muda na página de pedidos
- [x] Bug: Barra de pedido no chat não aparece para novos pedidos recebidos, mesmo ao atualizar a página (causa: normalização do 9o dígito brasileiro)

## Mensagens do Entregador - Reorganização de Botões
- [x] Mensagem de nova entrega: remover botão "O pedido foi entregue", manter apenas "Abrir rota" e "Sair para entrega"
- [x] Mensagem de entrega iniciada (após "Sair para entrega"): adicionar botão "O pedido foi entregue"
- [x] Remover lazy loading (spinner) de todas as páginas e voltar ao import direto
- [x] Redesenhar visual do card de cupom para estilo de cupom real (serrilhado, visual atrativo)
- [ ] Criar página de teste com 10 modelos visuais de cupons para escolha
- [ ] Adicionar mais 10 modelos de cupons na página de teste usando identidade visual Mindi
- [x] Aplicar Modelo 16 (Mindi Card com Aba) na página de Cupons real
- [x] Reduzir tamanho do card de cupom em 20% (fontes, paddings, espaçamentos)
- [ ] Criar página de teste com 20 modelos de botões de status Conectado/Desconectado WhatsApp
- [x] Aplicar Modelo 12 (Mindi Card Borda) no botão de status WhatsApp da página de Pedidos
- [x] Trocar botão WhatsApp de Modelo 12 (Card Borda) para Modelo 16 (Mindi Barra Status)

## PDV - Modo de Visualização e Categorias
- [x] Adicionar botão Grid/Lista antes das categorias na horizontal
- [x] Categorias devem parecer fluir/sair dos botões de seleção Grid/Lista
- [x] Trocar botão vermelho >> por botão redondo com seta para a direita
- [x] Criar modo de visualização em Lista para os produtos do PDV
- [x] Salvar preferência de visualização no localStorage

## Pedidos - Alinhamento de Botões
- [x] Alinhar botão de status WhatsApp (Conectado/Desconectado) na mesma altura dos botões Kanban/Lista
- [x] Alinhar botão de aceitar pedidos automaticamente na mesma altura dos botões Kanban/Lista

## PDV - Correções de Layout
- [x] Remover container/borda atrás das categorias (voltar ao visual original sem container)
- [x] Mover botões Grid/Lista para dentro da seção de produtos (lado direito, acima do grid) em vez da barra de categorias

## Pedidos - Correção de Altura dos Botões (v2)
- [x] Botão de configurações deve manter formato original (não redondo) e ter mesma altura do SlidingTabs
- [x] Barra de status WhatsApp deve ter mesma altura do SlidingTabs

## Pedidos - Botão Aceitar Automaticamente Quadrado
- [x] Botão de aceitar automaticamente deve ser quadrado (mesma largura e altura)

## Pedidos - Largura da Área Verde WhatsApp
- [x] Área verde do ícone WhatsApp deve ter mesma largura que o modelo original da página de teste

## PDV - Contagem de Produtos por Categoria
- [x] Mostrar texto com quantidade de produtos na categoria selecionada (ex: "7 produtos em Pães")

## PDV - Estilo Lista igual ao Catálogo
- [x] Modo lista do PDV deve seguir o mesmo estilo visual da página de catálogo (imagem arredondada, nome, descrição, preço, botão Adicionar)

## PDV - Lista: Espaçamento e Container Arredondado
- [x] Aumentar espaçamento entre itens da lista (estão muito colados)
- [x] Adicionar container com borda arredondada no topo da lista (estilo tabela)

## PDV - Lista: Replicar estilo exato do catálogo
- [x] Copiar exatamente o estilo de linha da lista do catálogo para o modo lista do PDV

## PDV - Alinhar Botões Grid/Lista com Consumo/Retirada/Entrega
- [x] Aumentar botões Grid/Lista em 3% para alinhar com botões Consumo/Retirada/Entrega

## PDV - Alinhar Botões Horizontalmente
- [x] Subir conteúdo do painel direito para alinhar Consumo/Retirada/Entrega com Grid/Lista
- [x] Diminuir em 2% o tamanho dos botões Consumo/Retirada/Entrega (apenas tamanho, sem alterar bordas)

## PDV - Fundo Branco no Carrinho e Alinhamento Final
- [x] Mudar fundo do carrinho para branco (bg-white)
- [x] Alinhar botões Consumo/Retirada/Entrega na mesma linha horizontal que Grid/Lista (reduzir Grid/Lista e header do carrinho)

## PDV - Restaurar Tamanho dos Botões Grid/Lista
- [x] Restaurar botões Grid/Lista ao tamanho original (px-3 py-1.5 text-[13px], ícones h-[15px] w-[15px])

## PDV - Restaurar Tamanho Original do Header do Carrinho
- [x] Restaurar título "Carrinho", descrição, badge e botões Consumo/Retirada/Entrega ao tamanho original (comparar com últimas 6 versões)

## Bug - Menu Lateral Minimizado: Submenu Mapa de Mesas
- [x] Corrigir submenu quando sidebar minimizada: ao clicar em Mapa de Mesas, deve mostrar os dois submenus (Mapa de Mesas e Cozinha), não apenas Cozinha

## Sidebar - Auto-minimizar ao clicar em PDV
- [x] Sidebar deve minimizar automaticamente quando o usuário clicar no menu "Frente de Caixa" (PDV)

## Bug - Cozinha não abre em nova aba no menu minimizado
- [x] Corrigir: ao clicar em "Cozinha" no popover do menu minimizado, deve abrir em nova aba (openNewTab)

## PDV - Fundo branco no header do carrinho
- [x] Mudar fundo do header do carrinho de bg-muted/40 para branco
- [x] Revertido: manter bg-muted/40 no header do carrinho conforme solicitado pelo usuário

## PDV - Reduzir altura da foto dos cards de produtos
- [x] Reduzir altura da imagem dos cards de produto no PDV em 25% (h-28/112px → h-[84px])

## PDVSlidebar (Mapa de Mesas) - Alternância Grid/Lista
- [x] Adicionar botões Grid/Lista ao lado direito da barra de busca na PDVSlidebar
- [x] Implementar modo lista seguindo o mesmo modelo do PDV (imagem pequena, nome, descrição, preço, botão adicionar)

## Entregadores - Corrigir texto da coluna Estratégia
- [x] Corrigir "none" para "Nenhuma" na coluna Estratégia da página de Entregadores

## Fidelização - Flash de conteúdo ao carregar página
- [x] Corrigir flash que mostra "Nenhum programa ativo" antes de carregar os dados reais quando a fidelização está ativa

## Acessos - Alterar link na mensagem WhatsApp do colaborador
- [x] Alterar link de v2.mindi.com.br para app.mindi.com.br/login na mensagem WhatsApp enviada ao cadastrar colaborador

## Acessos - Alterar link WhatsApp colaborador
- [x] Alterar link de v2.mindi.com.br para app.mindi.com.br/login na mensagem WhatsApp do colaborador

## Configurações Atendimento - Renomear Frete grátis para Entrega grátis
- [x] Alterar "Frete grátis acima de valor" para "Entrega grátis acima de valor"
- [x] Alterar "Ativar frete grátis por valor mínimo" para "Ativar entrega grátis por valor mínimo"
- [x] Atualizar descrição para mencionar benefício de aumento do ticket médio

## PDV - Modo de visualização padrão como Lista
- [x] Alterar viewMode padrão do PDV de "grid" para "list"

## Mesas - Substituir SlidingTabs por botões inline (estilo PDV)
- [x] Substituir SlidingTabs por botões inline na página de Mesas com px-3 py-1.5 text-[13px] (igual ao PDV)

- [x] Substituir SlidingTabs por botões inline (Kanban/Lista) na página de Cozinha com mesmo estilo da página de Mesas (px-3 py-1.5 text-[13px], ícones h-[15px] w-[15px])
- [ ] Reduzir largura do card de cupom em 40% e altura em 20%
- [x] Reduzir largura do card de cupom em 35% e altura em 20%
- [x] Padronizar página de WhatsApp Templates para seguir o mesmo estilo das demais páginas de configurações (ex: aba Atendimento)
- [x] Mover card 'Impressoras Cadastradas' para aba 'Mindi Printer' acima do card 'Fontes do Mindi Printer' com mesma largura
- [x] Reorganizar aba Mindi Printer: Layout fixo à esquerda (40%), Impressoras Cadastradas à direita (60%), Fontes abaixo
- [x] Mover card Fontes do Mindi Printer para abaixo de Impressoras Cadastradas na coluna direita (60%)
- [x] Adicionar card de Downloads (Android Play Store + Windows Microsoft Store) no topo da aba Mindi Printer
- [x] Mover card 'Baixe o Mindi Printer' para coluna esquerda (40%) acima de Layout, sticky, com Impressoras ao lado direito (60%)
- [x] Corrigir card 'Baixe o Mindi Printer' para ficar fixo (sticky) na coluna esquerda de 40%
- [ ] Criar página de teste com 5 propostas visuais de Changelog/Novidades (apenas design, sem backend)

## Sistema de Changelog / Novidades
- [x] Criar página de teste com 5 propostas visuais de changelog
- [x] Proposta 1: Timeline Elegante (linha do tempo vertical com expansão)
- [x] Proposta 2: Cards Modernos (tabs de versão + grid de cards)
- [x] Proposta 3: Feed Social (estilo feed minimalista)
- [x] Proposta 4: App Store (destaque visual na versão recente)
- [x] Proposta 5: Notion Clean (tabela limpa e organizada)
- [x] Incluir simulação de botões na sidebar (3 estilos)
- [x] Incluir visualização como modal
- [x] Registrar rota /changelog-demo no App.tsx
- [x] Implementação final do changelog (Mindi Split na sidebar)

## Bug: Pagamentos avulsos não refletidos no sidebar PDV e recibo de fechamento
- [x] Sidebar PDV da mesa mostra total bruto (R$34) em vez do saldo restante (R$14) após pagamento avulso
- [x] Recibo de fechamento ("Conferência do Pedido") mostra total bruto sem descontar pagamentos avulsos
- [x] Ao fechar mesa com "Fechamento Completo", o valor deve ser o saldo restante (total - pagamentos avulsos)
- [x] Recibo impresso (HTML) mostra total bruto sem considerar pagamentos avulsos
- [x] Backend closeTable não considera pagamentos avulsos ao criar pedido de fechamento (duplicação de faturamento)
- [x] MobilePDVModal mostra total bruto no header e footer sem considerar pagamentos avulsos

## Propostas adicionais de Changelog / Novidades
- [x] Criar mais 5 propostas visuais de Changelog na página /changelog-demo (propostas 6-10)

## Bug: Recibo impresso após fechamento completo não considera pagamentos avulsos
- [x] Recibo impresso/visualizado mostra TOTAL bruto (R$17) em vez do saldo restante (R$12) quando há pagamentos avulsos (resolvido - código já estava correcto, servidor precisava de restart para carregar alterações)

## Refazer página de Changelog Demo
- [x] Remover propostas 1-8 e 10 (manter apenas Notion Clean e Feed Social)
- [x] Criar proposta "Mindi Cards" (SectionCards expansíveis) baseada na identidade visual das Configurações
- [x] Criar proposta "Mindi Split" (Sidebar de versões + conteúdo) baseada na identidade visual das Configurações

## Ajuste altura da imagem no card de produto (modo grid) no PDVSlidebar
- [x] Verificar e ajustar altura da imagem do card de produto no modo grid do sidebar PDV (mesas) para ficar igual à página de PDV (h-[100px] → h-[84px])

## Mensagens WhatsApp do entregador - incluir dados do cliente
- [x] Mensagem "Entrega iniciada": incluir nome do cliente, telefone e endereço
- [x] Mensagem "Entrega concluída": incluir nome do cliente

## Página de Relatórios v2 — Etapa 1
- [x] Header sticky com título "Relatórios", descrição e ícone
- [x] Seletor de período (SlidingTabs): Hoje, Esta semana, Este mês, Mês passado
- [x] Botão Personalizado com seletor de datas customizadas
- [x] Botões de exportação: PDF, Excel, Enviar por email (placeholders)
- [x] 4 KPI Cards: Faturamento, Pedidos, Ticket Médio, Clientes Ativos
- [x] Comparação com período anterior (variação % em cada card)
- [x] Backend: procedure tRPC reports.kpis com filtros de período
- [x] Registrar rota /relatorios no App.tsx e sidebar
- [x] Nota: "Relatório não contabiliza pedidos cancelados"
- [x] Testes vitest para o backend

## Ajuste layout header Relatórios
- [x] Remover botões PDF, Excel, Email do header
- [x] Mover filtros de período (SlidingTabs + Personalizado) para o lugar dos botões removidos

## Abas e Performance Semanal na página de Relatórios
- [x] Adicionar 6 abas: Visão Geral, Produtos (ABC/CMV), DRE / Financeiro, Clientes & LTV, Operacional, Marketing & ROI
- [x] Card Performance Semanal com gráfico de barras (Sem 1-4) + linha tracejada de meta
- [x] Apenas frontend com dados mockados (sem backend nesta etapa)

## Card Evolução Mensal na aba Visão Geral
- [x] Card Evolução Mensal: Receita vs Despesas vs Lucro — últimos 6 meses (dados mockados)

## Card Mapa de Sazonalidade na aba Visão Geral
- [x] Card Mapa de Sazonalidade: heatmap de pedidos por dia da semana e horário (dados mockados)

## Card Mapa de Sazonalidade na aba Visão Geral
- [x] Card Mapa de Sazonalidade: heatmap de pedidos por dia da semana e horário (dados mockados)

## Card Performance por Canal na aba Visão Geral
- [x] Card Performance por Canal: Comparativo PDV, Menu Público e Mesas (dados mockados)

## Card Curva ABC na aba Produtos (ABC/CMV)
- [x] Card Curva ABC de Produtos: Classificação por rentabilidade — Pareto 80/20 (dados mockados)

## Aba DRE/Financeiro completa
- [x] Card DRE Simplificado: Receita Bruta → Deduções → Receita Líquida → CMV → Lucro Bruto → Despesas Operacionais → Resultado Operacional
- [x] Indicadores de Margem com gauge bars e metas (Margem Bruta, Margem Líquida, CMV/Receita)
- [x] Card de Saúde Financeira com diagnóstico automático

## Aba Operacional
- [x] Card Tempo de Preparo por Categoria: barras horizontais tempo real vs meta (dados mockados)
- [x] Mini stats: Tempo Médio Geral, Categoria Mais Rápida, Gargalo

## Aba Marketing & ROI
- [x] Tabela ROI de Campanhas: campanha, investimento, retorno, ROI%, pedidos (dados mockados)
- [x] Gráfico de barras investimento vs retorno
- [x] Insight automático sobre campanhas mais eficientes

## Ajustes Aba DRE/Financeiro
- [x] Layout side-by-side: DRE Simplificado (65%) + Indicadores de Margem (35%)
- [x] Indicadores de Margem (Margem Bruta, Margem Líquida, CMV/Receita) empilhados verticalmente
- [x] Cards proporcionais ao estilo da Dashboard (sem sombra, mesma borda, header consistente)

## Padronização de Estilo dos Cards (todas as abas)
- [x] Aba Visão Geral: cards com rounded-xl, border-border/50, sem sombra, header compacto h-10 w-10
- [x] Aba Produtos (ABC/CMV): cards com rounded-xl, border-border/50, sem sombra, header compacto h-10 w-10
- [x] Aba Operacional: cards com rounded-xl, border-border/50, sem sombra, header compacto h-10 w-10
- [x] Aba Marketing & ROI: cards com rounded-xl, border-border/50, sem sombra, header compacto h-10 w-10

## Layout Side-by-Side Performance Semanal + Evolução Mensal
- [x] Cards Performance Semanal (60%) e Evolução Mensal (40%) lado a lado na aba Visão Geral

## Layout Side-by-Side Mapa de Sazonalidade + Performance por Canal
- [x] Cards Mapa de Sazonalidade (60%) e Performance por Canal (40%) lado a lado na aba Visão Geral

## Redesign Cards Classe A/B/C na Curva ABC
- [x] Redesenhar os 3 cards de Classe A, B e C para seguir a identidade visual do sistema (sem fundos coloridos pesados)

## Modelo 4 Performance por Canal
- [x] Aplicar Modelo 4 (Barra empilhada + linhas compactas) no card Performance por Canal

## Fix espaço em branco Performance por Canal
- [x] Adicionar items-start no grid Sazonalidade + Canal para eliminar espaço em branco

## Card Performance Semanal V2 + Meta Semanal
- [x] Adicionar campo meta semanal no schema do banco de dados
- [x] Criar tRPC procedures para CRUD de meta semanal
- [x] Adicionar opção de criar meta semanal na página de Finanças (Indicadores)
- [x] Implementar Card Performance Semanal V2 (código fornecido pelo utilizador)
- [x] Lógica de exibição: mostrar card no primeiro login da segunda-feira
- [x] Integrar card com dados reais de meta semanal
- [x] Mostrar "Nenhuma meta definida" quando não houver meta semanal cadastrada

## Bug: Card Performance Semanal V2 mostra R$ 0,00
- [x] Investigar porque o card não mostra dados reais do estabelecimento
- [x] Corrigir integração de dados para exibir histórico semanal real
- [x] Corrigir formato de dados: getWeeklyRevenue agora retorna pedidos por dia (thisWeekOrders, lastWeekOrders)
- [x] Corrigir useMemo weeklyPerformanceData para trabalhar com arrays de números (não objetos)
- [x] Adicionar campos de orders em todos os return paths de getRevenueByPeriod (today, week, month)
- [x] Reverter trigger do card de sexta-feira (teste) para segunda-feira (produção)
- [x] Corrigir erro TypeScript: LinkBreak -> Unlink no WhatsAppStatusModels.tsx
- [x] Nota: Burger House Gourmet mostra R$ 0,00 porque não tem pedidos esta semana (último pedido: 14/03/2026)

## Trigger do Card Performance Semanal para teste
- [x] Reverter trigger para sexta-feira (dia 5) para o utilizador testar

## Bug: Tabela weeklyGoals não existe no banco
- [x] Executar migração para criar tabela weeklyGoals no banco de dados

## Bug: Procedure finance.setWeeklyGoal não encontrada
- [x] Registrar procedure setWeeklyGoal no router de finance (resolvido com restart do servidor)

## Ajustes no Card Performance Semanal V2
- [x] Nomes dos dias completos (Segunda, Terça, Quarta, Quinta, Sexta, Sábado, Domingo)
- [x] Adicionar quantidade de pedidos ao lado do valor em cada dia (ex: "R$ 342,40  16 ped.")
- [x] Remover botão X ao lado do ícone de calendário no header

## Botão "Fechar resumo" no Card Performance Semanal V2
- [x] Adicionar botão "Fechar resumo" vermelho no final do card
- [x] Remover botão X do Dialog (canto superior direito)
- [x] Impedir que o Dialog feche ao clicar fora (só fecha pelo botão)

## Corrigir tipografia do Card Performance Semanal V2
- [x] Adicionar fonte DM Sans ao card (via Google Fonts)
- [x] Faturamento: text-[32px] → text-3xl (30px)
- [x] Labels uppercase: adicionar font-semibold
- [x] Sub-labels: text-[10px] → text-xs (12px)
- [x] Meta Semanal label: text-[10px] → text-[11px]

## Ajustes visuais Card Performance Semanal V2
- [x] Botão "Fechar resumo" vazado (outline) em vez de preenchido
- [x] Header do card: cor vermelha (cor do sistema) em vez de azul

## Ajustes Card Performance Semanal V2 - largura e cor
- [x] Aumentar largura do card em 10% (480px → 528px)
- [x] Reverter header para cor azul original (#4285F4 → #5B9CF6)

## Ajustes Card Performance Semanal V2 - largura, pedidos e botão
- [x] Aumentar largura do card em mais 5% (528px → 554px)
- [x] Trocar "ped." por "Pedidos" nos dias da semana
- [x] Botão "Fechar resumo" de vermelho para azul (outline azul)

## Redesign Card Performance Semanal V2 - Identidade Visual Mindi
- [x] Redesenhar com identidade visual do sistema (vermelho primário, Inter, border-t-4, rounded-xl, etc.)

## Bug: Card Performance Semanal V2 - pedidos e ticket médio zerados
- [x] Verificar mapeamento de dados no Dashboard.tsx (weeklyPerformanceData useMemo)
- [x] Corrigir para que pedidos e ticket médio apareçam corretamente
- [x] Criar query separada weeklyCardRevenue (sempre period='week') para o card Performance Semanal

## Ajuste: Trigger do Card Performance Semanal
- [x] Alterar trigger do card Performance Semanal de sexta-feira (5) para segunda-feira (1)

## Proteção: Card Performance Semanal para contas novas
- [x] Verificar lógica completa do card (trigger + dados + condições de exibição)
- [x] Garantir que contas novas criadas na segunda não vejam card vazio (sem dados da semana anterior)

## Redesign: Card Indicadores de Margem na página de Relatórios
- [x] Analisar componente CardIndicadoresMargem.tsx fornecido
- [x] Encontrar e substituir o card atual de Indicadores de Margem na página de Relatórios
- [x] Integrar o novo componente com os dados existentes
- [x] Verificar resultado visual no browser

## Redesign: Card Performance Semanal na aba Visão Geral (Relatórios)
- [x] Redesenhar card com faturamento total, pedidos, ticket médio, melhor semana e gráfico de barras 4 semanas

## Redesign: Card Faturamento por Canal (Finanças)
- [x] Substituir visual do card Faturamento por Canal pelo Modelo 2 (Donut chart + lista)

## Melhoria: Ícones no card Performance Semanal (Relatórios)
- [x] Adicionar ícones com fundo colorido às métricas Pedidos, Ticket Médio e Melhor Semana

## Bug: Lentidão nos 4 cards KPIs da página de Relatórios
- [x] Investigar e corrigir a lentidão dos cards Faturamento, Pedidos, Ticket Médio e Clientes Ativos

## Ajuste: Mapa de Sazonalidade (Relatórios)
- [x] Alterar horários do mapa de sazonalidade para 8h até 0h (meia-noite)

## Melhoria: Hover + Tooltip no Mapa de Sazonalidade
- [x] Adicionar hover com feedback visual e tooltip com dia, hora e pedidos no heatmap de sazonalidade

## Backend: Curva ABC de Produtos (Relatórios)
- [x] Criar query getProductsABC no reportHelpers.ts (JOIN orders+orderItems, agrupar por produto, classificar ABC)
- [x] Criar procedure reports.productsABC no router
- [x] Conectar frontend ao backend substituindo dados mockados
- [x] Adicionar estados de loading e vazio ao card
- [x] Remover dados mockados do frontend
- [x] Escrever testes vitest para o endpoint e lógica de classificação ABC

## Modal Informativo Carrossel: Curva ABC de Produtos
- [x] Criar componente ABCInfoModal com carrossel de 4 telas
- [x] Tela 1: O que é a Curva ABC (Princípio de Pareto 80/20)
- [x] Tela 2: Classificação dos produtos (Classe A, B, C)
- [x] Tela 3: Como isso ajuda o restaurante (decisões práticas)
- [x] Tela 4: Como usar na Mindi (orientação de uso)
- [x] Adicionar botão/banner de abertura do modal na aba Produtos ABC
- [x] Indicadores de progresso (dots) e navegação (Próximo/Anterior/Entendi)

## Bug: Curva ABC não mostra produtos para o estabelecimento Big Norte
- [x] Investigar query productsABC para o estabelecimento Big Norte
- [x] Corrigido: servidor precisava ser reiniciado para carregar o router de reports

## Modal ABC: Auto-abertura na primeira visita
- [x] Abrir modal automaticamente quando o usuário acessa a aba Produtos pela primeira vez
- [x] Salvar no localStorage que já viu o tutorial para não repetir

## Backend: Performance Semanal (Relatórios)
- [x] Analisar card Performance Semanal no frontend e identificar dados necessários
- [x] Verificar se precisamos de nova tabela — NÃO precisa, usamos orders + weeklyGoals existentes
- [x] Implementar endpoint getWeeklyPerformance no reportHelpers.ts
- [x] Criar procedure reports.weeklyPerformance no router
- [x] Conectar frontend ao backend substituindo dados mockados
- [x] Adicionar estados de loading e vazio ao card

## Backend: Evolução Mensal (Relatórios) + Comparação Mensal (Finanças)
- [x] Analisar card Evolução Mensal no Relatorios.tsx (dados mockados)
- [x] Analisar card Comparação Mensal no Financas.tsx — JÁ CONECTADO ao backend
- [x] Verificar se podem compartilhar a mesma procedure — SIM, reutiliza finance.getMonthlyComparison
- [x] Não precisa de novo endpoint, reutiliza trpc.finance.getMonthlyComparison
- [x] Conectar frontend Evolução Mensal ao backend (lucro = receitas - despesas no frontend)
- [x] Remover dados mockados monthlyEvolutionData
- [x] Adicionar estados de loading e vazio ao card

## Bug: Erro "Load failed" ao enviar pedido no menu público
- [x] Investigar logs do servidor para identificar a causa
- [x] Verificar se as alterações recentes (reports/evolução mensal) causaram o problema
- [x] Resultado: NÃO foi causado pelas alterações recentes (ver análise abaixo)

## Backend: Mapa de Sazonalidade (Relatórios)
- [x] Analisar card Mapa de Sazonalidade no frontend (dados mockados)
- [x] Criar endpoint getSeasonalityMap no reportHelpers.ts (distribuição pedidos por dia/horário)
- [x] Criar procedure reports.seasonalityMap no router
- [x] Conectar frontend ao backend substituindo dados mockados
- [x] Adicionar estados de loading e vazio
- [x] Corrigir bug: query Drizzle .select().groupBy() falhava, migrado para db.execute()
- [x] Corrigir bug: db.execute() retorna [rows, fields], ajustado parsing

## Backend: Performance por Canal (Relatórios)
- [x] Analisar card Performance por Canal no frontend (dados mockados)
- [x] Verificar endpoint existente Faturamento por Canal na página de Finanças
- [x] Reutilizar mesmo endpoint finance.revenueByChannel para o card de Relatórios
- [x] Conectar frontend ao backend substituindo dados mockados
- [x] Adicionar estados de loading e vazio

## DRE Conectado ao Backend
- [x] Adicionar campo `cost` (decimal) na tabela products no schema
- [x] Migrar DB com pnpm db:push
- [x] Adicionar campo "Custo do produto" no modal de editar produto (ao lado do Preço)
- [x] Atualizar backend para salvar/retornar o campo cost
- [x] Criar endpoint reports.dre no backend (receita orders + CMV products.cost × orderItems.qty + despesas expenses por categoria)
- [x] Garantir categorias padrão de despesas (Impostos, Funcionários, Aluguel, Energia, etc.) — já existem na tabela expenseCategories
- [x] Conectar aba DRE/Financeiro dos Relatórios ao backend real
- [x] Remover dados mockados do DRE
- [x] Adicionar estados de loading e vazio
- [ ] Escrever testes vitest para o endpoint DRE

## Bug: Ícone do card Indicadores de Margem fora do padrão
- [x] Corrigir ícone do card Indicadores de Margem para seguir o padrão visual dos outros cards

## Modal Informativo Carrossel: DRE (Demonstrativo de Resultado)
- [x] Criar componente DREInfoModal com carrossel de 4 telas
- [x] Tela 1: O que é o DRE e por que é importante
- [x] Tela 2: Como funciona — conexão com a página de Finanças (despesas) e pedidos (receita)
- [x] Tela 3: Importância de cadastrar o custo dos produtos (CMV)
- [x] Tela 4: Como usar o DRE na Mindi para tomar decisões
- [x] Adicionar banner + botão "Saiba mais" na aba DRE
- [x] Auto-abertura na primeira visita (localStorage)
- [x] Indicadores de progresso (dots) e navegação (Próximo/Anterior/Entendi)

## Exportação PDF e Excel nos Relatórios (DRE e Curva ABC)
- [x] Instalar dependências para geração de PDF e Excel no servidor
- [x] Criar endpoint backend para exportar DRE em PDF
- [x] Criar endpoint backend para exportar DRE em Excel
- [x] Criar endpoint backend para exportar Curva ABC em PDF
- [x] Criar endpoint backend para exportar Curva ABC em Excel
- [x] Adicionar botões de exportação na aba DRE/Financeiro
- [x] Adicionar botões de exportação na aba Produtos (ABC/CMV)
- [x] Testes vitest para endpoints de exportação (11 testes passando)

## Bug: PDF Curva ABC gerando 2 páginas
- [x] Corrigir PDF da Curva ABC para caber em uma única página (sem segunda página vazia)

## Remover limpeza automática à meia-noite dos pedidos completos/cancelados
- [x] Remover filtro de todayStart nos pedidos completed e cancelled (manter apenas limpeza manual)
- [x] Remover useEffect de reset automático à meia-noite do localStorage
- [x] Remover reset por dia no estado inicial de manuallyClearedColumns

## Edição de Pedido — Ideia 4 (Seção Expansível)
- [x] Criar endpoint backend para atualizar itens do pedido (adicionar, remover, alterar quantidade)
- [x] Criar endpoint para buscar produtos do cardápio (para adicionar ao pedido)
- [x] Implementar seção expansível "Adicionar item ao pedido" no painel de detalhes
- [x] Permitir alterar quantidade de itens existentes (+/-)
- [x] Permitir remover itens do pedido
- [x] Campo de busca para adicionar novos produtos do cardápio
- [x] Recalcular total em tempo real
- [x] Disponível apenas para pedidos não completos/cancelados
- [x] Testes vitest para endpoint de edição de pedido (12 testes passando)

## Bug: Card Performance Semanal mostrando datas futuras
- [x] Corrigir lógica de datas para mostrar últimos 7 dias (segunda a domingo passados) em vez dos próximos 7 dias

## Bug: Card Indicadores — meta mensal sem lixeira e valor zero esquisito
- [x] Adicionar ícone de lixeira na barra de meta mensal (igual à meta semanal)
- [x] Tratar valor zero como "sem meta" — ao digitar 0, voltar ao estado "Definir meta" em vez de mostrar barra quebrada
- [x] Criar endpoint deleteMonthlyGoal no backend (db.ts + finance router)
- [x] Tratar zero também no Dashboard (meta semanal do card Performance Semanal)

## UI: Mover botão Editar do card Itens do Pedido
- [x] Substituir botão "Editar" no header por barra estilizada na borda superior do card com texto "Editar itens do pedido"

## UI: Cor da barra Concluir edição
- [x] Mudar cor da barra "Concluir edição" de amber/laranja para verde

## Complementos na Edição de Pedido
- [x] Reutilizar componente ComplementGroups do menu público na página de Pedidos
- [x] Ao buscar produto com complementos, abrir modal de seleção de complementos em vez de adicionar direto
- [x] Adaptar backend (searchProductsForOrder retorna complementCount/isCombo, novo endpoint getProductComplements)
- [x] Modal Dialog com ComplementGroups, seletor de quantidade e botão Adicionar com preço total
- [x] Produtos sem complementos continuam sendo adicionados diretamente
- [x] 13 testes vitest passando para o fluxo de complementos na edição
- [x] Implementar modal sidebar lateral (Sheet direita→esquerda, 33% largura) com estilo Mindi Split na ChangelogDemo
- [x] Botão de versão (v2.5.0) na sidebar abaixo de Configurações com ícone pulsante vermelho/cinza
- [x] Tooltip vermelho acima do botão quando há novidades (com X para fechar)
- [x] Ao clicar no botão abre Sheet lateral Mindi Split (33% largura)

## Botão de Changelog na Sidebar
- [x] Adicionar botão de versão (v2.5.0) abaixo de Configurações na sidebar
- [x] Ícone pulsante vermelho quando há novidades, cinza quando não há
- [x] Tooltip vermelho com X de fechar quando há atualizações disponíveis
- [x] Ao clicar, abrir Sheet lateral (33% largura) com conteúdo Mindi Split
- [x] Funcionar tanto com sidebar expandida quanto colapsada
- [x] Persistir estado de "lido" no localStorage

## Correção: Botão de Changelog na Sidebar
- [x] Mover botão v2.5.0 para dentro do menu como item normal abaixo de Configurações (não numa barra separada)
- [x] Seguir visual exato da changelog-demo: ícone Sparkles pulsante à esquerda, texto v2.5.0, badge Novo à direita
- [x] Tooltip vermelho com seta para baixo posicionado acima do item de menu
- [x] Remover barra separada no fundo da sidebar
- [x] Funcionar no modo colapsado (só ícone) e expandido (ícone + texto + badge)

## Correção 2: Visual do Botão de Changelog
- [x] Mudar estilo de "item de menu" para estilo pill/chip compacto como na referência da simulação
- [x] Botão versão: fundo cinza claro arredondado com "v2.5.0" + ponto vermelho pulsante
- [x] Botão novidades: pill rosa claro com ícone Sparkles + badge contagem
- [x] Tamanho menor que itens de menu normais
- [x] Sem estilo hover/active de item de menu

## Fechamentos Programados (Configurações)
- [x] Schema: tabela scheduled_closures (tipo, data, regra recorrente, motivo, ativo)
- [x] DB helpers e routers tRPC (CRUD de fechamentos)
- [x] UI: seção "Fechamentos Programados" na página de Configurações
- [x] Tipo 1: Datas específicas (calendário + motivo)
- [x] Tipo 2: Regras recorrentes (último domingo do mês, último sábado, etc.)
- [x] Lógica de verificação: sistema verifica se hoje é dia de fechamento programado
- [x] Integração com status do estabelecimento (fechar automaticamente ou avisar)

## Banner de Aviso de Fechamento Programado
- [x] Endpoint tRPC para verificar próximo fechamento programado (próximos 7 dias)
- [x] Componente banner estilo WhatsApp desconectado (fundo vermelho, ícone, texto, botão ação, X fechar)
- [x] Posicionar abaixo do topbar no lado superior direito
- [x] Botão de ação "Ver detalhes" que leva às configurações de fechamento
- [x] Permitir fechar/dispensar o banner (com localStorage para não mostrar novamente)

## Banner Ver Detalhes → Scroll + Destaque
- [x] Botão "Ver detalhes" do banner redireciona para /configuracoes aba Atendimento
- [x] Scroll automático para o card de Fechamentos Programados
- [x] Efeito de destaque nas bordas do card (mesmo padrão do modal de boas-vindas)

## Bug: Banner "Ver detalhes" navega para aba errada
- [x] Corrigir: ao clicar em "Ver detalhes" no banner de fechamento, deve ir para aba Atendimento (não Estabelecimento)

## Aviso de Fechamento no Card de Horários
- [x] Mostrar aviso visual no card de Horários de Funcionamento quando um dia tem fechamento programado
- [x] Ex: "Terça-feira — Fechado (programado)" em vez do horário normal
- [x] Considerar fechamentos por data específica e regras recorrentes

## Sistema de Changelog Dinâmico (Painel Admin)
- [x] Schema: tabela changelog_versions (id, version, title, publishedAt, isPublished, createdAt, updatedAt)
- [x] Schema: tabela changelog_entries (id, versionId, type [feature/improvement/fix], title, description, sortOrder, createdAt)
- [x] Migrar schema para o banco (pnpm db:push)
- [x] DB helpers: CRUD de versões e entradas
- [x] Router tRPC: endpoints admin (criar/editar/excluir versões e entradas, publicar/despublicar)
- [x] Router tRPC: endpoint público (listar versões publicadas com entradas para sidebar)
- [x] Página/seção admin para gerenciar changelog (criar versão, adicionar entradas, publicar)
- [x] UI admin: lista de versões com status (rascunho/publicada), botão publicar/despublicar
- [x] UI admin: dentro de cada versão, lista de entradas agrupadas por tipo com CRUD
- [x] Atualizar ChangelogSidebar para consumir dados reais do banco em vez de dados mockados
- [x] Atualizar botão na AdminLayout: versão dinâmica, badge baseado em dados reais
- [x] Estado de leitura: comparar última versão publicada vs última versão lida (localStorage)
- [x] Migrar dados mockados atuais como seed inicial (opcional - dados mockados removidos, admin cria via painel)
- [x] Testes unitários para os endpoints do changelog

## Bug: Banner de Fechamento Programado - Reload
- [x] Corrigir: botão "Ver detalhes" no banner de fechamento programado causa reload (F5) da página em vez de navegar suavemente via SPA (substituído window.location.href por navigate do wouter)

## Bug: Banner sobrepõe menu secundário de Configurações
- [x] Corrigir: banner de fechamento programado está sobrepondo o menu lateral secundário (Configurações), deve ficar abaixo do menu secundário

## Bug: Banner cobre menu secundário em Configurações (v2)
- [x] Na página de Configurações, mover o banner para dentro da área de conteúdo (à direita do menu secundário), não em full-width
- [x] Na Dashboard e outras páginas sem menu secundário, manter o banner em full-width (comportamento atual OK)

## Simplificar botão status WhatsApp na página de Pedidos
- [x] Remover ícone QR code e texto "Conectar" ao lado direito do botão
- [x] Mudar texto "Desconectado" para "Conectar"
- [x] Quando conectado, não mostrar botão extra ao lado

## Bug: Changelog router não carrega
- [x] Corrigir erro "No procedure found on path changelog.createVersion" - tabelas changelog_versions e changelog_entries não existiam no banco (migração não aplicada)

## Bug: Permissão 10002 no Changelog Admin
- [x] Corrigir erro "You do not have required permission (10002)" ao criar versão no changelog admin — Bruno (ID 180577) promovido para admin

## Mover botão de novidades para ao lado do filtro de período
- [x] Mover botão de novidades (changelog) da sidebar para ao lado do filtro "Este mês" no Dashboard

## Redesenho botão novidades no Dashboard
- [x] Botão com mesma altura dos filtros de período, mostra apenas ícone Sparkles por padrão
- [x] Ao hover, expande com efeito de slide mostrando texto da versão (ex: v2.1.2)
- [x] Ao sair do hover, volta a mostrar apenas o ícone

## Página de teste com variações do botão de novidades
- [x] Criar página /test-buttons com 20 variações do botão de versão (foco no estado "com novidade")
- [x] Adicionar mais 30 variações (21-50) do botão de novidades na página de teste

## Campo de imagem no Changelog
- [x] Adicionar coluna de imagem no schema do changelog
- [x] Adicionar upload de imagem no router do changelog
- [x] Adicionar campo de upload de imagem na UI de criação/edição de versão
- [x] Exibir imagem na visualização do changelog (admin e sidebar do usuário)

## Bug: Changelog admin mostra "Nenhuma versão criada"
- [x] Corrigir bug que faz a página admin do Changelog não listar as versões existentes no banco (resolvido com restart do servidor)

## Popup "Temos novidades!" no botão de versão
- [x] Implementar popup/tooltip "Temos novidades!" abaixo do ícone de versão quando há novo changelog
- [x] Changelog sidebar: limitar descrição dos cards a 2 linhas com "Ver mais" em vermelho no final

## Imagens Ilustrativas no Changelog
- [x] Changelog: adicionar campo imageUrl nas entradas do changelog (schema + migration)
- [x] Changelog: exibir imagem ilustrativa nos cards do sidebar de novidades
- [x] Changelog: permitir upload de imagem por entrada no admin
- [x] Changelog: gerar imagens ilustrativas para as entradas existentes
- [x] Changelog: regenerar imagens ilustrativas com paleta vermelha (identidade visual Mindi)
- [x] Changelog admin: criar endpoint tRPC para gerar imagem ilustrativa com IA (prompt padrão estilo vermelho Mindi)
- [x] Changelog admin: adicionar botão "Gerar imagem com IA" no formulário de entrada
- [x] Changelog admin: permitir visualizar, regenerar e salvar imagem gerada
- [x] Changelog sidebar: reduzir largura em 10%
- [x] Changelog sidebar: aumentar tamanho dos textos (título, descrição)
- [x] Changelog sidebar: adicionar efeito zoom-in nas imagens ao hover
- [ ] Changelog sidebar: mover título para acima da descrição (ordem: título → imagem → descrição)
- [x] Changelog sidebar: filtro clicável no resumo "novidades, melhorias e correções"
- [x] Changelog sidebar: reordenar cards para imagem → título → descrição
- [x] Changelog sidebar: filtro clicável no resumo "novidades, melhorias e correções"
- [x] Changelog sidebar: remover ícone de check verde dos cards de entrada
- [x] Changelog sidebar: corrigir quebra de linha na descrição (respeitar \n do admin)
- [x] Changelog admin: adicionar formatação de texto (negrito) no campo de descrição
- [x] Changelog sidebar: renderizar negrito na descrição das entradas
- [x] Menu público: salvar automaticamente dados do cliente na tabela pdv_customers ao criar pedido
- [x] Migração: importar clientes de pedidos antigos do menu público para pdv_customers (INSERT IGNORE, sem sobrescrever)
- [x] PDV modal entrega: busca de cliente por nome com dropdown autocomplete (avatar iniciais + nome + telefone)
- [x] PDV: criar endpoint de busca de cliente por nome no router pdvCustomer

## Atalhos de Mensagens Rápidas no Chat
- [x] Criar tabela chatShortcuts no schema (establishmentId, title, message)
- [x] Criar endpoints CRUD no backend (list, create, update, delete)
- [x] Implementar modal "Atalhos Rápidos" com formulário para criar/editar/excluir
- [x] Implementar dropdown ao digitar "/" no campo de mensagem do chat
- [x] Ao selecionar atalho no dropdown, preencher campo de mensagem com o texto
- [x] Botão "+" ao lado do campo de mensagem para abrir modal de gerenciamento
- [x] Identidade visual Mindi (vermelho) nos componentes

## Bugs - Atalhos Rápidos
- [x] Bug: modal de Atalhos Rápidos fecha tudo (modal + chat) ao clicar nos campos de input
- [x] Bug: erro ao criar atalho - tabela chat_shortcuts não existia no banco de produção (criada manualmente)
- [x] Ajustar dropdown de atalhos rápidos para caber até 7 itens antes da barra de rolagem
- [x] Implementar drag & drop para reordenar atalhos no modal de gerenciamento
- [x] Criar endpoint de reordenação (updateSortOrder) no backend
- [x] Melhorar drag & drop dos atalhos: reordenação visual em tempo real durante arraste (como no catálogo)
- [x] Bug: drag & drop dos atalhos está lento/travando durante o arraste (otimizar performance)

## Chat WhatsApp - Aviso de Desconexão
- [x] Exibir banner de aviso no chat quando WhatsApp estiver desconectado
- [x] Adicionar botão "Conectar" no banner que abre o modal de QR Code
- [x] Desabilitar campo de envio de mensagem quando WhatsApp desconectado
- [x] Chat: Alterar banner de desconexão para cor vermelha do tema + efeito pulsar no ícone Wi-Fi

## Política de Privacidade
- [x] Analisar página de privacidade do concorrente viamenu.com.br como referência
- [x] Criar página /privacidade com conteúdo adaptado para a Mindi (estilo accordion com 10 seções)
- [x] Layout integrado ao login: conteúdo aparece no lado direito via AuthLayout (split-screen)
- [x] Manter identidade visual da Mindi (cores vermelhas, ícones, tipografia)
- [x] Integrar link "Política de Privacidade" na tela de login para abrir a nova página
- [x] Link "Voltar ao login" no topo da página de privacidade

## Melhoria Fluxo Impressora
- [x] Mover card "Integração com App" (API Key) da aba API para dentro da aba Mindi Printer
- [x] Posicionar abaixo do card "Baixe o Mindi Printer"
- [x] Aba Mindi Printer sempre visível (não depende mais de ter API Key)
- [x] Aba API separada removida (conteúdo unificado)
- [x] Corrigir responsividade da página de Privacidade: eliminar barra de scroll desnecessária quando seções estão fechadas
- [x] Bug: Página de Privacidade causa scroll na página inteira, zoom na imagem do lado esquerdo e cards diminuídos
- [x] Privacidade: Mover conteúdo mais para o topo (reduzir espaçamento superior)
- [x] Privacidade: Cards 13% mais largos
- [x] Privacidade: Eliminar barra de rolagem da página inteira
- [x] Privacidade: Alterar cor do texto LGPD no footer para vermelho
- [x] Privacidade: Adicionar texto introdutório acima do card "1. Dados que Coletamos"
- [x] Privacidade: Colocar texto introdutório dentro de container vermelho com destaque (borda + fundo)
- [x] Privacidade: Centralizar título e ícone do escudo na página + remover texto "Voltar ao login" (manter só seta)
- [x] Página Privacidade: remover ícone Shield vermelho grande
- [x] Página Privacidade: juntar títulos em uma linha "Política de Privacidade - Privacidade & LGPD"
- [x] Página Privacidade: centralizar título
- [x] Página Privacidade: remover texto "Voltar ao login" (manter só seta)
- [x] Página Privacidade: aumentar tamanho do título e dos textos para melhor legibilidade
- [x] Página Privacidade: aumentar título e subtextos (data/leitura) em mais ~10%
- [x] Página Privacidade: adicionar mais espaço acima do título (descer um pouco)
- [x] Página Privacidade: simplificar título para "Política de Privacidade & LGPD"
- [x] Página Privacidade: adicionar texto "Voltar" ao lado da seta de voltar
- [x] Página Privacidade: alterar tempo de leitura de 5 min para 18 min
- [x] Página Privacidade: reverter tamanho da data e tempo de leitura para text-sm
- [x] Página Privacidade: remover parágrafo "Ao utilizar a plataforma Mindi..."
- [x] Página Privacidade: diminuir tamanho da data e tempo de leitura em ~12% (text-xs)
- [x] Página Privacidade: diminuir título "Política de Privacidade & LGPD" em ~5%
- [x] Página Privacidade: diminuir texto de conformidade LGPD no footer em ~5%
- [x] Página Privacidade: card introdutório mostrar só 3 linhas com "Ler mais" expansível
- [x] Página Privacidade: "Ler mais" inline no final da 3ª linha (não em linha separada)
- [x] Página Privacidade: cortar texto truncado até "armazenamos..." para caber "Ler mais" na linha
- [x] Implementar banner de consentimento de cookies na primeira visita
- [x] Página Privacidade: alterar data para "03 de janeiro de 2026"
- [x] Remover página /whatsapp-status-modelos (rota, import e arquivo)
- [x] Remover página /cupons-modelos (rota, import e arquivo)
- [x] Remover página /changelog-demo (rota, import e arquivo)
- [x] Remover badge "NOVO" da sidebar de Novidades da Plataforma
- [x] Revisar rotas e páginas não utilizadas no projeto
- [x] Página Privacidade: adicionar imagem lateral esquerda (mesmo padrão Login/Criação de conta)
- [x] Alterar background do lado direito (formulário) das telas de login/registro para branco
- [x] Diminuir banner de cookies em ~39% (padding, textos, ícone, botões)
- [x] Página Privacidade: remover "& LGPD" do título (deixar só "Política de Privacidade")
- [x] Página Privacidade: remover texto "Tempo estimado de leitura: 18 min"
- [x] Relatórios: remover filtro "Mês passado"
- [x] Relatórios: botão Personalizado — remover texto, deixar só ícone calendário, mesma altura dos filtros
- [x] Relatórios: criar DateRangePicker customizado (visual próprio, navegação por mês, seleção de intervalo, Cancelar/Aplicar)
- [x] Relatórios: remover inputs nativos de data do navegador
- [x] Relatórios: remover completamente a data ao lado do botão de calendário (mostrar apenas dentro do calendário aberto)
- [x] Relatórios: adicionar texto 'Personalizado' ao botão de calendário (ícone + texto)
- [x] Relatórios: mover botão 'Personalizado' para o lado esquerdo dos filtros
- [x] Relatórios: botão Personalizado com efeito slide (só ícone, ao hover expande com texto)
- [x] Relatórios: ajustar altura do botão Personalizado para igualar aos filtros (Hoje, Esta semana, Este mês)
- [x] Relatórios: ajustar altura do botão Personalizado para igualar ao container dos filtros (44px)
- [ ] Bug: redefinição de senha de colaborador permite login como estabelecimento
- [ ] Feature: colaborador tentando login como estabelecimento deve ser redirecionado para acesso de colaborador
- [x] Bug: login de estabelecimento com credenciais de colaborador não redireciona para modo colaborador
- [x] Impressora: alterar texto do card 'Integração com App' para texto mais orientativo
- [x] Fechamentos: substituir input de data nativo pelo calendário customizado igual ao dos Relatórios
- [x] Impressora: voltar cor do card de integração para amarelo (manter novo texto)
- [x] Fechamentos: reduzir tamanho dos botões Data específica/Regra recorrente (igual aos botões de modalidade)
- [x] Bug: status mostra 'Abriremos hoje às X' mesmo quando há fechamento programado para hoje
- [x] Bug: menu público mostra 'Abriremos hoje às X' mesmo com fechamento programado ativo
- [x] Feature: botão editar ao lado do nome do cliente selecionado no modal Dados da Entrega (PDV)
- [x] Feature: modo edição com campos editáveis (nome e telefone) e botão Salvar no card de dados do cliente
- [x] Feature: endpoint backend para atualizar nome/telefone de contato existente
- [x] Feature: botão editar ao lado do nome do cliente selecionado no modal Dados da Entrega (PDV)
- [x] Feature: sidebar esquerda (sheet) para editar dados do cliente (nome, telefone) e endereço de entrega
- [x] Feature: endpoint backend para atualizar nome/telefone/endereço de contato existente
- [x] Feature: botão Salvar no final da sidebar de edição de contato
- [x] Bug: sidebar de edição de cliente no PDV aparece no lado oposto da tela, deve aparecer colada ao lado esquerdo da sidebar de entrega (como sidebar de adicionar item nos pedidos)
- [x] Feature: campo de bairro na sidebar Editar Cliente deve funcionar igual ao modal Dados da Entrega (não editável, com botão Alterar que abre lista de bairros)
- [x] Bug: verificar se o botão Salvar Alterações da sidebar Editar Cliente está salvando os dados no banco (pdv_customers) para que ao buscar novamente os dados venham atualizados
- [x] Bug: editar cliente na sidebar do PDV está duplicando o contato em vez de atualizar o existente (corrigido: rastreamento por customerId em vez de apenas telefone)

## Segurança: Remover credenciais expostas do git
- [x] Remover 1195 arquivos .manus/db/ do índice git (contêm credenciais TiDB Cloud)
- [x] Confirmar que .gitignore já previne novos arquivos de serem tracked
- [x] Segurança: Corrigir IDOR em collaborator.ts (update/delete) — adicionar assertEstablishmentOwnership
- [x] Testes: Criar testes unitários para validar correção IDOR collaborator (6 testes passando)
- [x] Segurança: Corrigir IDOR em stories.ts (create/delete + queries) — adicionar assertEstablishmentOwnership
- [x] Testes: Criar testes unitários para validar correção IDOR stories (11 testes passando)
- [x] Segurança: Corrigir IDOR em finance.ts (todas mutations e queries) — adicionar assertEstablishmentOwnership
- [x] Testes: Criar testes unitários para validar correção IDOR finance (34 testes passando)
- [x] Segurança: Corrigir IDOR em category.ts (list/create/update/delete/duplicate/reorder) — adicionar assertEstablishmentOwnership
- [x] Testes: Criar testes unitários para validar correção IDOR category (16 testes passando)
- [x] Segurança: Corrigir IDOR em product.ts (CAT4 #1) — 10 procedures, 12 testes
- [x] Segurança: Corrigir IDOR em complement.ts (CAT4 #3) — 19 procedures, 15 testes
- [x] Segurança: Corrigir IDOR em coupons.ts (CAT4 #4) — 6 procedures, 10 testes
- [x] Segurança: Corrigir IDOR em neighborhoodFees.ts (CAT4 #5) — 5 procedures, 8 testes
- [x] Segurança: Corrigir IDOR em stock.ts (CAT4 #7) — 15 procedures, 16 testes
- [x] Segurança: Corrigir IDOR em orders.ts (CAT4 #8) — 10 procedures, 13 testes
- [x] LGPD: CAT5 #19 — Documentar Google Maps como subprocessador na política de privacidade
- [x] LGPD: CAT5 #18 — Verificar/corrigir banner de consentimento de cookies (já existia, texto melhorado)
- [x] LGPD: CAT5 #12 — Adicionar texto explicativo para geolocalização no AddressMapPicker
- [x] LGPD: CAT5 #13-14 — Minimizar dados pessoais nos metadados Stripe (removido customer_name e customer_email de 5 ocorrências)
- [x] LGPD: CAT5 #10 — Adicionar DPO Francisco Brito na política de privacidade
- [x] LGPD: CAT5 #11 — Checkbox de consentimento explícito no registro (botão desabilitado até aceitar)
- [x] Segurança: CAT2 #1 — Corrigir SQL injection em getDailyRevenue (parametrizado com sql.join)
- [x] Segurança: CAT2 #2 — Corrigir SQL injection em getDailyPaymentData (parametrizado com sql.join)
- [x] Segurança: CAT2 #3 — Corrigir SQL injection em getStoryAnalytics (sql.join em vez de sql.raw)
- [x] Segurança: CAT4 #12 — Corrigir SSRF em enhanceImage (whitelist de domínios)
- [x] Testes: Criar testes unitários para validar correção SSRF enhanceImage (20 testes passando)
- [x] Segurança: CAT4 #15 — Rate limiting no forgotPassword (5 tentativas/IP/15min)
- [x] Segurança: CAT4 #14 — Rate limiting no Bot API (100 req/key/min)
- [x] Testes: Criar testes unitários para validar rate limiting (9 testes passando)
- [x] Segurança: Rate limiting no login — 8 tentativas de senha errada por IP a cada 15 minutos (donos + colaboradores)
- [x] Testes: Criar testes unitários para validar rate limiting de login (12 testes passando no total)
- [x] Segurança: CAT1 #8/#13 — .gitignore já adequado (cobre .env*, .manus/db/, node_modules, dist/, IDE, logs, DB local)
- [x] Segurança: CAT1 #9 — check-stripe.cjs usa 'sk_test_dummy' (não é credencial real, script de diagnóstico)
- [x] Segurança: CAT1 #6 — seedAdmin.mjs já corrigido (lê credenciais de variáveis de ambiente)
- [x] Segurança: CAT5 #1 — VAPID_PRIVATE_KEY movida para variável de ambiente (removida do código-fonte)
- [x] Segurança: CAT4 #18 — Validação de senha alinhada: collaborator update e login corrigidos de min(6) para min(8)
- [x] Segurança: CAT1 #5/#7 — Remover credenciais hardcoded dos scripts (check-order-240.mjs já OK, check-establishments.mjs corrigido para usar DATABASE_URL)
- [x] Segurança: CAT4 #21 — Limitar tamanho da query de busca no Bot API (max 100 chars)
- [x] Segurança: CAT4 #23 — Validar formato do sessionId no recordView (regex alfanumérico)
- [x] Segurança: CAT2 #9 — Escapar wildcards no LIKE (função escapeLike aplicada em 11 locais no db.ts e botApiRouter.ts)
- [x] Segurança: CAT2 #6 — SameSite cookie já usa lax em produção (HTTPS); nenhuma alteração necessária
- [x] Segurança: CAT2 #8 — N/A: CORS wildcard necessário para app Android (Mindi Printer); protegido por API key
- [x] Segurança: CAT4 #13 — Mascarar email no validateResetToken (j***a@g***l.com)
- [x] Segurança: CAT4 #19 — N/A: min 8 chars adequado para perfil dos usuários; complexidade adiada
- [x] Segurança: CAT4 #11 — Validar MIME type no upload (whitelist: jpeg, png, webp, gif, svg, avif)
- [x] Segurança: CAT4 #22 — JWT admin com secret separado + warning se não configurado
- [x] Segurança: CAT1 #11 — Validação de env vars críticas no startup (DATABASE_URL, JWT_SECRET, VITE_APP_ID, OAUTH_SERVER_URL)
- [x] Segurança: CAT1 #12 — Trocado email/senha admin reais por dados fictícios (test-admin@example.com, TestSenha1234)
- [x] Segurança: CAT1 #10 — JWT secret em testes é aceitável (test_secret_admin não é credencial real)
- [x] Segurança: CAT5 #15 — ADIADO: Logger sem timestamp/sanitização (risco baixo, info/debug silenciados em produção)
- [x] Segurança: CAT5 #16 — ADIADO: Telefones entregadores logados (risco baixo, logger.info silenciado em produção)
- [x] Segurança: CAT3 #1 — basic-ftp atualizado para 5.1.0 (devDependency)
- [x] Segurança: CAT3 #2 — fast-xml-parser atualizado para 5.2.5 (transitiva AWS SDK)
- [x] Segurança: CAT3 #3 — @trpc/server atualizado para 11.6.0 (estável)
- [x] Segurança: CAT3 #4 — axios atualizado para 1.12.2
- [x] Segurança: CAT3 #5 — tar atualizado para 7.5.1 (devDependency)
- [x] Segurança: CAT3 #6 — rollup atualizado para 4.52.4 (devDependency)
- [x] Segurança: CAT3 #8 — picomatch atualizado para 4.0.3
- [x] Segurança: CAT3 #9 — dompurify atualizado para 3.3.0
- [x] Segurança: CAT3 #10 — vite atualizado para 7.1.9 (devDependency)
- [x] Segurança: CAT3 #12 — nanoid atualizado para 5.1.6/3.3.11
- [x] Segurança: CAT3 #13 — cookie atualizado para 1.0.2
- [x] Segurança: CAT3 #14 — cross-spawn atualizado para 7.0.6
- [x] Segurança: CAT3 #15 — esbuild atualizado para 0.25.10 (devDependency)
- [x] Segurança: CAT3 #17 — micromatch N/A (não encontrado no projeto)
- [x] Segurança: CAT3 #23 — wouter atualizado para 3.7.1
- [x] Segurança: CAT5 #2 — Telefones em sms.ts: logger.info silenciado em produção, risco zero
- [x] Segurança: CAT5 #3 — ADIADO: SMS opt-in requer alteração no fluxo de negócio/cadastro
- [x] Segurança: CAT5 #4 — Telefones em SSE: logger.info silenciado em produção, risco zero
- [x] Segurança: CAT5 #5 — Emails em mandrill.ts: logger.info silenciado em produção, risco zero
- [x] Segurança: CAT5 #6 — Telefone/Pix em uazapi.ts: logger.info silenciado em produção, risco zero
- [x] Segurança: CAT2 #10 — CSV injection corrigido com sanitizeCsvField() nos 2 exports
- [x] Segurança: CAT3 #18 — body-parser já na versão corrigida (1.20.3)
- [x] Segurança: CAT3 #19 — send já na versão corrigida (0.19.0 + 1.2.0)
- [x] Segurança: CAT3 #20 — jsonwebtoken + jose: contextos diferentes, sem risco
- [x] Segurança: CAT3 #21 — @smithy/config-resolver: transitiva AWS SDK, sem controle
- [x] Segurança: CAT3 #22 — bn.js: transitiva web-push, risco baixo (DoS server-side)
- [x] Segurança: CAT4 #20 — N/A: getOrderById público necessário para app impressora (Mindi Printer)
- [x] Segurança: CAT2 #7 — Proteção CSRF no tRPC (Origin malicioso bloqueado 403, localhost/domínios permitidos OK)
- [x] Segurança: CAT2 #4 — N/A: XSS document.write() na impressão; risco moderado, dados de pedidos reais
- [x] Segurança: CAT2 #5 — N/A: dangerouslySetInnerHTML no chart.tsx é componente shadcn/ui padrão, só CSS hardcoded
- [x] Segurança: CAT5 #8 — Concluído: opt-in SMS aceito pelo dono como fluxo de negócio atual
- [x] Segurança: CAT4 #16 — N/A: localStorage só guarda nome/email/role (sem tokens); padrão da indústria
- [x] Segurança: CAT3 #7 — path-to-regexp 0.1.12 já corrigida (backport fix 0.1.10)
- [x] Segurança: CAT3 #11 — lodash transitiva do recharts, sem input de usuário, risco zero
- [x] Segurança: CAT3 #16 — N/A: elliptic não existe mais no projeto
- [x] Segurança: CAT5 #7 — Concluído: TiDB Cloud já oferece criptografia TDE
- [x] Segurança: CAT5 #9 — Concluído: aceito pelo dono, implementação futura
- [x] Segurança: CAT5 #15 — Concluído: logger.info/debug silenciados em produção
- [x] Segurança: CAT5 #16 — Concluído: logger.info silenciado em produção
- [x] Segurança: CAT5 #17 — Concluído: já coberto pelo CAT1 #8/#13
- [x] Segurança: CAT5 #3 — Concluído: opt-in SMS aceito pelo dono como fluxo atual
- [x] Banner de fechamento programado: texto dinâmico baseado no momento ("Estabelecimento fechado hoje" vs "Fechamento programado para amanhã/data")
- [x] Verificar e corrigir estilo da página Ajuda e Suporte para ficar consistente com demais páginas (cards, ícones, espaçamentos)
- [x] Alterar preço do plano Essencial de R$ 79,90 para R$ 89,00
- [x] Unificar 4 cards de agendamento de pedidos em 1 único card (Configurações > Atendimento)
- [x] Redesenhar página Planos e Assinatura para ficar consistente com padrão visual da Dashboard e demais páginas
- [x] Redesenhar visual dos cards de planos na página Planos e Assinatura (manter estrutura, melhorar visual para ficar com a cara do Mindi)
- [x] Corrigir proporções da página Planos: ícones 40x40 (h-10 w-10), títulos text-base, usar SectionCard, ícones internos h-5 w-5
- [x] Corrigir autorização em establishment.update — adicionar assertEstablishmentOwnership
- [x] Corrigir autorização em loyalty.saveSettings — adicionar assertEstablishmentOwnership
- [x] Fase 1 ownership: Corrigir botApiKeys (list, toggleActive, rename, create)
- [x] Fase 1 ownership: Corrigir cashback (saveSettings, getMetrics, getEvolution, getClients, getEventHistory)
- [x] Fase 1 ownership: Corrigir collaborator (list, create, getById e demais mutations com establishmentId)
- [x] Fase 1 ownership: Corrigir dashboard (stats, weeklyStats, recentOrders, lowStock, weeklyRevenue, conversionRate, topProducts, ordersByDeliveryType, avgPrepTime, avgPrepTimeTrend, prepTimeAnalysis, customerInsights, revenueByHour, onboardingChecklist, updatePrepGoal)
- [x] Fase 1 ownership: Corrigir chatShortcuts (list, create, update, reorder, delete)
- [x] Fase 1 ownership: Corrigir neighborhoodFees (list e mutations)
- [x] Fase 1 ownership: Corrigir printer (list, get, create, update, delete, testDirectPrint, testPOSPrinter, printOrder, testConnection, getDefault, setDefault, clearDefault)
- [x] Fase 1 ownership: Corrigir push (list, sendTest, unsubscribe)
- [x] Fase 1 ownership: Corrigir reviewsAdmin (metrics, list, count, unreadCount, respond, markAsRead)
- [x] Fase 1 ownership: Corrigir loyalty queries (listCards, getMetrics, getEvolution, getClients, getEventHistory)
- [x] Fase 1 ownership: Corrigir combo (searchProducts)
- [x] Fase 1 ownership: Corrigir reports (kpis, productsABC, weeklyPerformance, seasonalityMap, dre)
- [x] Fase 1 ownership: Corrigir pdvCustomer (upsert)
- [x] Fase 1 ownership: Corrigir establishment.updateTwoFactorSettings + feedback (admin role check)
- [x] Fase 1 ownership: Escrever testes vitest para validar correções (7 testes, todos passaram)
- [x] Corrigir validação de valores monetários: adicionar z.string().regex() para formato decimal, recalcular total server-side em order.create e publicMenu.createOrder
- [ ] Implementar persistência de mídias UAZAPI no S3 (download fileURL + upload S3)
- [ ] Enviar mediaUrl (S3) via SSE ao frontend no chat
- [ ] Renderizar imagens, áudios e vídeos no WhatsAppChatWidget em vez de texto genérico

## Exibição de Mídias no Chat WhatsApp
- [x] Backend: extrair fileURL do webhook UAZAPI para mensagens de mídia (image, audio, video, document, sticker, ptt)
- [x] Backend: download da mídia da UAZAPI e upload permanente para S3 (chat-media/{establishmentId}/)
- [x] Backend: enviar mediaUrl (URL S3) via SSE junto com os dados da mensagem
- [x] Frontend: renderizar imagens inline com <img> clicável (abre em nova aba)
- [x] Frontend: renderizar áudios inline com player <audio> nativo
- [x] Frontend: renderizar vídeos inline com player <video> nativo
- [x] Frontend: renderizar documentos como link "Abrir documento"
- [x] Frontend: fallback para mensagens de mídia sem URL (mensagens antigas)
- [x] Frontend: fallback para mensagens de mídia outgoing (enviadas pelo bot)

## Bug: Mídias no chat ainda aparecem como [media]
- [x] Investigar payload real do webhook UAZAPI para identificar por que fileURL/messageType não estão sendo extraídos
- [x] Corrigir extração de dados e garantir que mediaUrl chegue ao frontend

## Bug: messageType da UAZAPI vem como 'ImageMessage' em vez de 'image'
- [x] Normalizar messageType no backend (ImageMessage→image, AudioMessage→audio, etc.)
- [x] Frontend já aceita o formato normalizado (image, audio, etc.) - sem alteração necessária

## Fase 2 de Autorização: Verificação de ownership por resource ID
- [x] Auditar todos os routers e identificar endpoints vulneráveis
- [x] Implementar verificações de ownership nos routers identificados
- [x] tables.ts: updateStatus - verificar ownership da mesa antes de atualizar
- [x] tableSpaces.ts: update/delete - verificar que o espaço pertence ao estabelecimento
- [x] tabs.ts: addItems - verificar ownership da comanda antes de adicionar itens
- [x] tabs.ts: updateItem - verificar ownership do item via comanda
- [x] tabs.ts: cancelItem - verificar ownership do item via comanda
- [x] tabs.ts: update - verificar ownership da comanda antes de atualizar
- [x] Escrever testes de ownership Phase 2 (9 testes passando)
- [ ] Testar que tudo continua funcionando

## Bug: Imagem no chat mostra fallback em vez de renderizar inline
- [x] Investigar por que mediaUrl não chega ao frontend - UAZAPI não envia fileURL no webhook
- [x] Implementar chamada ao endpoint POST /message/download da UAZAPI para obter fileURL
- [x] Fluxo: webhook recebe msg → chama /message/download com msgId → obtém fileURL → download → upload S3 → envia via SSE
- [x] Adicionada função downloadMedia() ao uazapi.ts

## UX: Modal de imagem no chat + hover zoom
- [x] Ao clicar na imagem, abrir modal fullscreen dentro do chat (não redirecionar para URL)
- [x] Ao fazer hover na imagem, mostrar zoom flutuante (popup) com imagem maior
- [x] Popup desaparece ao tirar o hover, reaparece ao fazer hover novamente

## Bug: Som do chat inicia ligado ao recarregar página
- [x] Alterar estado padrão do som para desligado (muted) ao carregar a página
- [x] Atendente deve ativar manualmente o som

## Bug: Modal de imagem fecha o chat junto
- [x] Impedir propagação de clique do modal para o chat (stopPropagation + data-image-modal)
- [x] Limpar imageModalUrl ao fechar o chat para evitar que reapareça ao reabrir

## Bug: Som do chat ainda inicia ligado (localStorage com valor antigo)
- [x] Ignorar localStorage e sempre iniciar som desligado ao carregar a página

## UX: Reposicionar hover zoom da imagem no chat
- [x] Mover popup flutuante para a área vazia à direita do chat (não sobrepor mensagens)
- [x] Tamanho proporcional e responsivo ao tamanho da tela

## UX: Tamanho do balão de vídeo no chat
- [x] Padronizar tamanho do balão de vídeo para ficar igual ao da imagem (max-w-[220px] max-h-[220px])

## UX: Tooltip no botão de som desativado
- [x] Quando som estiver desativado, exibir tooltip abaixo do botão com "Som desativado"

## UX: Hover flutuante para vídeos no chat
- [x] Ao fazer hover no vídeo, abrir vídeo flutuante à direita do chat com autoplay
- [x] Mesmo estilo e posicionamento do hover de imagens (responsivo)
- [x] Ao tirar o mouse, fechar e parar o vídeo
- [x] Modal fullscreen também suporta vídeo com autoplay ao clicar

## UX: Tooltip de som desativado fixo
- [x] Exibir tooltip "Som desativado" fixo quando som está desligado (não apenas no hover)
- [x] Ao fazer hover no botão de som, esconder o tooltip permanentemente (até recarregar ou toggle)

## Changelog: Anúncio de novidades
- [ ] Criar/atualizar changelog com novidades de mídia no chat WhatsApp (imagens, áudio, vídeo)
- [ ] Incluir otimizações de segurança no changelog (autorização por estabelecimento, validação monetária)

## Bug: Validação de preço rejeita pedidos com complementos grátis por tipo de entrega
- [x] Corrigir validação server-side no createOrder (publicMenu.ts) para considerar freeOnDelivery/freeOnPickup/freeOnDineIn e priceMode
- [x] Corrigir validação server-side no createOrderCheckout (stripeConnect.ts) se aplicável
- [x] Escrever testes unitários para validação de preços com gratuidade por contexto (20 testes passando)
- [x] Adicionar deliveryType ao createOrderCheckoutMutation no frontend (Stripe Checkout)
- [x] Corrigir responsividade do texto "Avaliações" no header do menu público mobile (não aparece em telas largas o suficiente)
- [x] Adicionar pré-visualização/autocomplete de clientes no campo de telefone do PDV (igual ao campo de nome)
- [x] Bug: Autocomplete de busca por nome e por telefone não funciona no PDV após implementação do autocomplete de telefone (resolvido: servidor precisava reiniciar para reconhecer novos endpoints)
- [x] Remover sombras (shadow-*) de todos os botões/CTAs da landing page
- [x] Hero: mockup mostra 50% no lado direito, ao hover desliza para esquerda revelando 75%
- [x] Corrigir posicionamento da imagem dentro do mockup do hero - imagem está cortando o logo na borda superior, precisa descer um pouco
- [x] Segurança: Corrigir JWT_SECRET com fallback vazio - servidor deve falhar no startup se JWT_SECRET não estiver configurado
- [x] Segurança: Tornar ADMIN_JWT_SECRET obrigatório e independente, removendo fallback derivado do cookieSecret
- [x] Segurança: Remover unsafe-eval do CSP em produção, condicionar apenas ao ambiente de desenvolvimento
- [x] Landing: Substituir seção "Você está pagando para vender o que é seu?" pela nova seção "O Problema" com 4 cards de dores
- [x] Landing: Igualar tamanho do título do hero ao título da seção "O Problema" (text-3xl sm:text-4xl lg:text-5xl)
- [x] Landing: Remover badge "O problema" e subir título "Cansado de perder pedidos e dinheiro?" mais para cima
- [x] Landing: Remover badge "A solução" da seção de virada
- [x] Landing: Alterar seção "Com o Mindi você assume o controle" - novo título, descrição e mockup de celular no lado direito
- [x] Landing: Mockup da seção "Tudo que seu restaurante precisa" - reduzir 20% e trocar para estilo iPhone realista
- [x] Landing: Ajustar borda inferior do mockup iPhone para ter o mesmo tamanho da borda superior
- [x] Landing: Reestruturar seção - título e descrição centralizados no topo, depois features abaixo (sem alterar mockup iPhone)
- [x] Landing: Restaurar grid com lista de benefícios + mockup iPhone abaixo do título centralizado
- [x] Landing: Feature 2 - Gestão de Pedidos em Tempo Real (layout reverso com Kanban mock)
- [x] Landing: Feature 3 - Frente de Caixa + Mapa de Mesas (tables mock)
- [x] Landing: Feature 4 - Marketing que Vende Mais (layout reverso com loyalty + coupon mock)
- [x] Landing: How It Works - "Operando em 10 minutos" com 4 steps
- [x] Landing: Comparison - "Por que Mindi e não marketplace?" tabela comparativa
- [x] Landing: Testimonials - "Quem usa, recomenda" 3 cards
- [ ] Landing: Pricing - 2 planos (Essencial e Completo)
- [ ] Landing: Cases Reais - carousel de clientes + ticker de segmentos
- [ ] Landing: CTA Final - "Pronto para parar de perder dinheiro?"
- [ ] Landing: FAQ - 5 perguntas frequentes com accordion
- [ ] Landing: Footer atualizado
- [ ] Landing: Adicionar título "Cardápio Digital Inteligente" e descrição acima da lista de benefícios na seção do mockup iPhone, e centralizar melhor o texto

- [x] Auditoria completa: remover TODAS as validações de preço que bloqueiam pedidos

## Página de Logs de Pedidos no Admin
- [x] Criar tabela order_logs no schema do banco de dados
- [x] Criar migração e aplicar no banco remoto
- [x] Adicionar funções de consulta no adminDb.ts (getOrderLogs, getOrderLogsCount, getOrderLogsStats, getOrderLogsEstablishments)
- [x] Adicionar rotas tRPC no adminRouter (orderLogs.list, orderLogs.stats, orderLogs.establishments)
- [x] Criar página AdminOrderLogs com filtros, cards de stats e listagem
- [x] Adicionar item "Logs de Pedidos" no menu lateral do admin
- [x] Registrar rota /admin/order-logs no App.tsx

## Integração de Logging no Fluxo de Pedidos
- [x] Criar função helper createOrderLog no db.ts para gravar logs
- [x] Integrar logging no publicMenu.ts (createOrder) - sucesso e erros
- [x] Integrar logging no botApiRouter.ts - sucesso e erros
- [x] Capturar: validação, preço, pagamento, erros de servidor, dados do cliente, IP, user-agent

## Landing Page - Hero Section
- [x] Substituir fundo da hero por imagem real de restaurante com overlay escuro (estilo da referência)
- [x] Alterar cor dos checks na hero section de verde para vermelho (cor da marca)
- [x] Alterar cor do texto typewriter na hero para mesma cor do botão 'Criar conta grátis' (red-500)
- [x] Redesenhar seção 'Cansado de perder pedidos e dinheiro?' -> Removida a pedido do utilizador
- [x] Remover seção 'Cansado de perder pedidos e dinheiro?' da landing page
- [x] Ajustar tamanho do mockup da seção 'Cardápio Digital Inteligente' para ficar igual ao da seção de slides (256px -> 280px)
- [x] Remover seção de slides/carrossel de funcionalidades da landing page
- [x] Remover seção 'Por que Mindi e não marketplace?' da landing page
- [x] Criar seção estilo Goomer (fundo escuro + título + descrição + CTA + mockup dashboard) abaixo da hero section
- [x] Substituir mockup CSS da seção DashboardShowcase por screenshot real do dashboard dentro de frame estilo Goomer
- [x] Seção 'Dados que transformam decisões': usar apenas screenshot do Dashboard (sem carrossel), imagem estática no frame de laptop, fundo igual ao da seção 'Tudo que seu restaurante precisa'
- [x] Remover moldura/frame de laptop da seção Dashboard e exibir apenas a imagem do tablet diretamente
- [x] Adicionar efeito glow vermelho degradê atrás da imagem do tablet na seção Dashboard
- [x] Substituir imagem do mockup do tablet na seção Dashboard pela screenshot da tela de Pedidos (Kanban)
- [x] Restaurar moldura do tablet na seção Dashboard e inserir imagem dos Pedidos (Kanban) dentro da moldura
- [x] Restaurar moldura original do laptop (barra browser com botões coloridos, URL, câmera, hinge/base) e inserir imagem dos Pedidos Kanban dentro
- [x] Gerar imagem de mockup de laptop realista (estilo referência) com screenshot dos Pedidos Kanban dentro e usar na seção Dashboard
- [x] Criar mockup de laptop de alta qualidade via composição programática (Pillow) com screenshot original dos Pedidos Kanban
- [x] Reverter seção Dashboard para exibir apenas a imagem original dos Pedidos Kanban (sem mockup de laptop)
- [x] Diminuir imagem dos Pedidos em 18% e adicionar container escuro (estilo tablet/bezel) por trás
- [x] Remover moldura cinza/bezel/hinge, deixar apenas browser bar branca (3 botões Mac) + imagem dos Pedidos
- [x] Alterar cor da browser bar da seção Dashboard para a mesma cor da seção 'Gestão de Pedidos em Tempo Real'
- [x] Imagem do mockup deve ser cortada na borda inferior da seção 'Dados que transformam decisões' (overflow hidden)
- [x] Redesenhar seção 'Cardápio Digital Inteligente' no estilo Goomer: texto/benefícios à esquerda, mockup celular à direita, fundo suave rosa/vermelho
- [x] Criar seção 'Modelos de negócios que o Mindi fortalece' com imagem de fundo, grid de categorias, abaixo da seção de Planos
- [x] Botão 'Falar com especialista' na hero section deve ser vermelho (mesma cor do botão 'Criar conta grátis')
- [x] Substituir imagem da seção 'Dados que transformam decisões' pelo novo screenshot do Dashboard

## Melhoria de Nitidez da Imagem do Dashboard (Landing Page)
- [x] Aplicar sharpening (UnsharpMask + contraste) na imagem do Dashboard
- [x] Upload da versão mais nítida (WebP quality 95) para CDN
- [x] Atualizar URL na seção 'Dados que transformam decisões'

## Mockup de Tablet na Seção Dashboard (Landing Page)
- [x] Adicionar mockup de tablet CSS ao redor do browser chrome + screenshot na seção 'Dados que transformam decisões'
- [x] Atualizar URL bar para app.mindi.com.br/dashboard

## Landing Page - Carrossel e Mockup de Tablet
- [x] Adicionar carrossel com 2 imagens do Dashboard na seção "Dados que transformam decisões"
- [x] Dots do carrossel em cor vermelha sem container
- [x] Mover seção "Gestão de Pedidos em Tempo Real" para abaixo de "Dados que transformam decisões"
- [x] Adicionar mockup de tablet CSS na seção "Gestão de Pedidos em Tempo Real"

## Demo Dashboard Estática para Landing Page
- [ ] Criar página DemoDashboard1 (/demo/dashboard) com KPIs, gráfico faturamento, heatmap acessos
- [ ] Criar página DemoDashboard2 (/demo/dashboard2) com Top 10, Pedidos por Modalidade, Tempo Médio
- [ ] Registrar rotas públicas no App.tsx
- [ ] Substituir imagens do carrossel por iframes no mockup de tablet da landing page

## Pixel Perfect Demo Dashboard
- [ ] Reescrever DemoDashboard1 pixel perfect (sidebar, KPIs, gráficos, heatmap)
- [ ] Reescrever DemoDashboard2 pixel perfect (Top 10, Perfil Clientes, Faturamento por Hora, Pedidos)
- [ ] Verificar resultado visual comparando com screenshots originais

## Bug: Complementos pausados reativados ao salvar produto editado
- [x] Bug: Ao editar qualquer produto com complementos pausados e clicar em salvar, todos os complementos pausados ficam reativados (o onSuccess deleta todos os grupos e recria sem preservar isActive)
- [x] Investigar lentidão no salvamento ao adicionar novo grupo de complementos (corrigido: syncGroups faz diff inteligente em vez de deletar e recriar tudo)

## Bug: Cores do DemoDashboard1 na landing page
- [x] Corrigir cor de fundo dos filtros de período (Hoje/Esta semana/Este mês) no DemoDashboard1 para corresponder ao dashboard real (cinza)
- [x] Corrigir cor de fundo do campo de busca no DemoDashboard1 para corresponder ao dashboard real
- [x] Corrigir cor de fundo do container SlidingTabs no DemoDashboard1 - está mais escuro que o original (corrigido: #f0f0f2 → #eff2f5 que é o valor real de bg-muted oklch 0.96 0.005 250)
- [ ] Corrigir cores dos badges 49min e Ver menu no DemoDashboard1 - no real são verdes, no demo estão vermelho/rosa
- [ ] Corrigir ícone de som e toggle no DemoDashboard1 para corresponder ao original
- [x] Corrigir badge "Ver menu" no DemoDashboard1 e DemoDashboard2 - deve ser vermelho/rosa (bg-primary/10 text-primary) e não verde
- [x] Corrigir ícone do Dashboard na sidebar dos demos - deve ser Lucide LayoutDashboard (grid assimétrico 2x2)
- [x] Corrigir ícone do Dashboard na sidebar do demo - agora usa Lucide LayoutDashboard preenchido (filled) com padrão assimétrico
- [x] Corrigir cor do ícone Dashboard no título para azul (text-blue-600 = #2563eb como no código real)
- [x] Corrigir cor do ícone de som no topbar do demo para vermelho (#ef4444, como o badge Ver menu)
- [x] Mudar nome do restaurante de "Big Norte" para "Burger House" nos demos da landing page
- [x] Mudar nome do utilizador de "Jéssica" para "Bruno" nos demos da landing page
- [x] Remover +88% do card de Faturamento do Mês nos demos (card fica grande demais)
- [x] Espalhar mais pontos de calor no mapa de calor do demo (horários da manhã, madrugada, etc.) para não ficar centralizado
- [x] Adicionar tooltip informativo no mapa de calor do demo (ex: "Qui às 15h — 34 acessos")
- [x] Adicionar pontos coloridos (●) antes dos valores em todos os cards do demo (azul Pedidos, azul Faturamento, azul Ticket, verde Conversão, vermelho Fidelizados)
- [x] Adicionar logo do Burger House na sidebar dos demos (substituir avatar BH por imagem)
- [x] Corrigir valor do card Faturamento do Mês para R$ 2.355 (sem centavos)
- [x] Corrigir cor do filtro 7D selecionado no card Pedidos (de preto para cinza claro #eff2f5)

## Correção dos Cards KPI nos Demos da Landing Page
- [x] Aumentar padding dos cards KPI de 14px para 18px para dar mais espaço aos valores
- [x] Adicionar minHeight 90px e flex layout para espaçamento consistente
- [x] Aumentar label font de 9px para 10px (mais próximo do real 12px)
- [x] Aumentar margin entre label e valor de 10px para 12px

## Carregamento Lento dos Demos na Landing Page
- [x] Investigar causa do carregamento lento do mockup de tablet (tela preta enquanto carrega)
- [x] Otimizar carregamento dos demos (substituir iframe por renderização direta dos componentes React)

## Alinhamento Sidebar Header vs Topbar nos Demos
- [x] Alinhar logo/nome do restaurante na sidebar com a topbar (mesma altura) no DemoDashboard1
- [x] Alinhar logo/nome do restaurante na sidebar com a topbar (mesma altura) no DemoDashboard2

## Espaçamento dos Cards KPI no Dashboard Real
- [ ] Corrigir espaçamento entre label e valor nos cards KPI - valores estão muito para baixo

## Espaçamento dos Cards KPI no Dashboard Real
- [x] Corrigir espaçamento entre label e valor nos cards KPI - valores estão muito para baixo comparado ao original

## Tamanho da Fonte do Tempo Médio nos Demos
- [x] Corrigir tamanho da fonte do "49" no card Tempo Médio para ficar proporcional ao "94%" do card Pedidos por Modalidade

## Scale do Mockup do Tablet
- [x] Aumentar conteúdo do mockup em ~10% (reduzir largura base de 1440px para ~1310px)

## Seção de Métricas/Dados na Landing Page
- [x] Adicionar seção de dados com fundo escuro abaixo de "Soluções para a nova era de entregas" (+1.200 restaurantes, R$0 taxa, 30% economia, 7 min configurar)
- [x] Trocar fundo da seção de métricas para glassmorphism transparente com números vermelhos e labels cinza

## Reordenação de Seções na Landing Page
- [x] Mover seção "Vantagens do Cardápio Digital Mindi" para abaixo de "Dados que transformam decisões"

## Efeitos de Animação nas Métricas
- [x] Alterar +1.200 para +900 com efeito de contagem rápida (0→900)
- [x] R$0 com efeito scale pop (bounce)
- [x] Alterar 30% para 27% com efeito slide-up reveal + counter
- [x] 7 min com efeito de contagem rápida (0→7) igual ao 900

## Ajuste de Animações nas Métricas
- [x] Diminuir velocidade de todas as animações em 20% (mais lento)
- [x] Trocar efeito do R$0 de scale pop para efeito pulsante (pulseBeat)
- [x] Fazer efeito pulsante do R$0 ficar em loop infinito (continuar pulsando)

## Redesign dos Cards de Vantagens
- [x] Redesenhar cards da seção "Vantagens do Cardápio Digital Mindi" - remover container arredondado, usar borda lateral vermelha com hover e ícones quadrados vermelhos
- [x] Adicionar badge "CARDÁPIO DIGITAL" acima do título da seção "Seu cardápio moderno, Online em minutos"
- [x] Alterar botão "Falar com especialista" para "Teste Grátis | 15 dias" na seção hero
- [x] Alterar badge "CARDÁPIO DIGITAL" para estilo minimalista (apenas texto vermelho, sem fundo/borda/ícone) com mais espaçamento antes do título
- [x] Centralizar texto "CARDÁPIO DIGITAL" e posicioná-lo mais para baixo (mais próximo do título)
- [x] Alinhar "CARDÁPIO DIGITAL" à esquerda (text-left), mais abaixo e próximo do título, sem ultrapassar o S
- [x] Reduzir largura do mockup do tablet na seção Gestão de Pedidos (de 130% para ~100%) para não sobrepor o texto à direita
- [x] Criar componente DemoPedidos pixel perfect (página de Pedidos Kanban) e renderizar dentro do mockup do tablet na seção Gestão de Pedidos em Tempo Real
- [x] Atualizar DemoPedidos pixel perfect com cards de pedidos reais em cada coluna Kanban (Novos: #P7, #P5, #P3; Preparo: #P6; Prontos: #P4, #P2; Completos: #P1) com detalhes completos
- [x] Aumentar largura do mockup do tablet na seção Gestão de Pedidos em 13%
- [x] Reverter largura do tablet para 100% e aumentar scale interno do DemoPedidos em 13%
- [x] Alterar sidebar do DemoPedidos para modo minimizado (apenas ícones, sem texto/labels)
- [x] Remover badge "Teste gratuito: 5 dias" da topbar do DemoPedidos
- [x] Diminuir scale interno do DemoPedidos em 13% (remover multiplicador 1.13)
- [x] Corrigir ícone de Pedidos bugado na sidebar e no título da página do DemoPedidos
- [x] Adicionar 3 ícones faltantes na sidebar do DemoPedidos após coração (integrações, equipe, configurações) com divisória
- [ ] Reescrever cards do Kanban no DemoPedidos pixel perfect com o design original (ícone status, badge ENTREGA, tempo, nome+pagamento+valor, ações com impressora/ver detalhes/botão ação/X)

## Landing Page - Cards Kanban Pixel Perfect
- [x] Atualizar OrderCard com novas props (statusBg, cardBg, statusIcon)
- [x] Adicionar fundo circular para ícone de status em cada card
- [x] Estilizar botão "Ver detalhes" como pill button com borda
- [x] Estilizar ícone de impressora com fundo circular cinza
- [x] Estilizar botão de cancelar (X) com fundo circular rosa
- [x] Adicionar cor de fundo tintada para cada coluna (azul, rosa, verde, cinza)
- [x] Estilizar botões de ação como pill buttons arredondados
- [x] Atualizar todas as chamadas do OrderCard nas 4 colunas do Kanban

## Landing Page - Remoção do Chat Flutuante
- [x] Remover ícone de chat flutuante (floating chat button) do DemoPedidos

## Landing Page - Corrigir borda preta no mockup do tablet DemoPedidos
- [ ] Fazer o DemoPedidos preencher 100% da altura do mockup do tablet (eliminar borda preta inferior)
- [ ] Estender sidebar e colunas do Kanban no DemoPedidos para preencher 100% da altura visível (sem espaço vazio na parte inferior)

## Landing Page - Nova seção Robô WhatsApp
- [x] Criar nova seção "Robô no WhatsApp que atende e vende por você" abaixo da seção Gestão de Pedidos
- [x] Layout: conteúdo à esquerda, mockup de celular à direita (invertido)
- [x] Criar componente DemoWhatsApp com conversa animada simulando o bot

## Landing Page - Foto de fundo na seção Cardápio Digital
- [x] Adicionar foto de fundo na seção "Seu cardápio moderno, Online em minutos" similar ao estilo da seção Hero

## Landing Page - Mover foto de fundo para seção Gestão de Pedidos
- [x] Reverter seção "Seu cardápio moderno" para fundo branco original
- [x] Gerar imagem IA de atendente sorrindo no restaurante usando computador
- [x] Aplicar imagem como fundo na seção "Gestão de Pedidos em Tempo Real"

## Landing Page - Remover foto de fundo da seção Gestão de Pedidos
- [x] Reverter seção "Gestão de Pedidos em Tempo Real" para fundo branco sem foto de fundo

## Landing Page - Mockup iPhone na seção WhatsApp Bot
- [x] Trocar mockup de celular da seção WhatsApp Bot para usar o mesmo estilo de mockup de iPhone da seção Cardápio Digital (mesmo tamanho)
- [x] Corrigir largura do container do mockup WhatsApp (w-[300px] em vez de max-w-[300px])

## Landing Page - Identidade visual na seção WhatsApp Bot
- [x] Alterar fundo da seção WhatsApp Bot de cinza genérico para identidade visual Mindi (cores vermelho/coral da marca)

## Landing Page - Estilo iOS no DemoWhatsApp
- [x] Reescrever DemoWhatsApp com estilo iOS (cabeçalho branco, bolhas brancas/verde claro, fundo bege, barra de input iOS)

## Bug - DemoWhatsApp ainda mostra cabeçalho verde na versão dev
- [x] Investigar por que o DemoWhatsApp ainda mostra cabeçalho verde apesar do arquivo ter sido atualizado - era cache, versão dev já está com estilo iOS correto

## Landing Page - Balões flutuantes saindo do iPhone no WhatsApp Bot
- [x] Criar balões de mensagem flutuantes que "saem" do mockup do iPhone na seção WhatsApp Bot (efeito 3D/transbordamento)
## Landing Page - Remover textos internos do mockup iPhone na seção WhatsApp Bot
- [x] Remover textos/mensagens que estão dentro do mockup do iPhone (manter apenas os balões flutuantes)
## Landing Page - Novo balão verde flutuante na seção WhatsApp Bot
- [x] Adicionar balão verde (mensagem do cliente fazendo pedido) à direita, no meio do mockup iPhone
- [x] Melhorar background do WhatsApp dentro do mockup iPhone para parecer mais com o wallpaper real do WhatsApp (doodles/ícones)
- [x] Gerar imagem de background estilo WhatsApp (doodles/ícones sutis em bege) e aplicar no mockup iPhone
## Landing Page - Nova seção de Marketing com cards flutuantes
- [x] Criar nova seção de Marketing abaixo da seção WhatsApp Bot
- [x] Card flutuante 1: SMS de promoção (estilo notificação iOS com cupom)
- [x] Card flutuante 2: Cupom de desconto (estilo Mindi com header vermelho e código)
- [x] Card flutuante 3: Cartão fidelidade (com carimbos digitais)
- [x] Card flutuante 4: Stories (barrinha colorida do restaurante no cardápio)
## Landing Page - Carrossel de screenshots na seção Cardápio Digital
- [x] Upload das 6 screenshots do cardápio para CDN
- [x] Implementar carrossel de imagens na seção "Seu cardápio moderno, Online em minutos"
- [x] Adicionar screenshot do cardápio Sushi Haruno como primeira imagem do carrossel
- [x] Remover labels de texto abaixo dos dots do carrossel
- [x] Remover setas de navegação (anterior/próximo) do carrossel
- [x] Ajustar tempo de transição do carrossel para 6 segundos
- [x] Otimizar imagens do carrossel: redimensionar 560px largura + comprimir WebP 80% + re-upload CDN
- [x] Adicionar balão verde com emojis 😍😍😍😍 no canto inferior direito do mockup WhatsApp
- [x] Mover nome do header WhatsApp mais para baixo (não encostar na câmera do iPhone)
- [x] Trocar "Sabor da Casa" por "Seu estabelecimento" no header WhatsApp
- [x] Mover balão "Boa noite!" mais para baixo (não encostar na câmera)
- [x] Adicionar barra de status iOS no mockup iPhone (hora, sinal operadora, Wi-Fi, bateria)
## Landing Page - Redesenhar seção PDV + Mapa de Mesas
- [x] Trocar título "Frente de Caixa + Mapa de Mesas" para "PDV + Mapa de Mesas"
- [x] Redesenhar layout: texto à esquerda, mockup tablet à direita
- [x] Adicionar mockup de tablet com imagens do PDV/Mapa de Mesas
- [x] Replicar o mesmo estilo de mockup tablet da seção "Gestão de Pedidos" na seção "PDV + Mapa de Mesas"
- [x] Substituir imagem do mockup tablet PDV pela nova screenshot enviada pelo usuário
- [x] Adicionar imagem Dados da Entrega e transformar mockup tablet PDV em carrossel com 2 slides
- [x] Duplicar seção PDV + Mapa de Mesas e adicionar cópia logo abaixo da original
- [x] Editar nova seção duplicada de 'PDV + Mapa de Mesas' para apenas 'Mapa de Mesas'
- [ ] Bug: Drag-and-drop do grupo de complementos não funciona na página de catálogo
- [x] UX: Ao arrastar grupo de complementos, esconder itens e mostrar apenas header compacto
- [x] Bug: Drag-and-drop dos grupos de complementos está lento (mesmo bug que categorias tinham antes)
- [x] Bug: Drag-and-drop dos grupos de complementos ainda lento - investigar re-renderização
- [x] Bug: Texto enorme/distorcido aparece ao iniciar arraste de grupo de complementos
- [x] Bug: Tooltip Temos novidades cortado na lateral esquerda no mobile - posicionar ao lado direito do botao
- [x] Bug: Tooltip Temos novidades aparece por cima do menu lateral quando aberto - esconder quando menu aberto
- [x] Tornar envio de notificação WhatsApp assíncrono (fire-and-forget) na mutation updateStatus
- [x] Unificar seções Gestão de Pedidos, PDV + Mapa de Mesas e Mapa de Mesas em uma única seção com abas e carrossel automático
- [ ] Bug: Mockup vazio na aba Gestao de Pedidos da secao unificada - restaurar conteudo Kanban
- [x] Alterar texto da aba "PDV + Mesas" para apenas "PDV" na seção unificada da landing page
- [x] Corrigir DemoPedidos não renderizando no mockup da aba Gestão de Pedidos (scale era 0 por falta de recálculo ao trocar de aba)
- [x] Redesenhar seção 'Operando em 10 minutos' com fundo escuro, 3 passos, novo texto e identidade visual conforme modelo
- [x] Redesenhar seção 'Como funciona' com identidade visual do Mindi: mesma fonte, fundo consistente, design elaborado com cards e elementos visuais ricos
- [x] Adicionar imagem de fundo de restaurante na seção 'Pronto para vender em menos de 10 minutos'
- [x] Trocar fundo da seção Como funciona para o mesmo da seção WhatsApp Bot (gradiente vermelho claro)
- [x] Criar página de teste com 6 propostas visuais para a seção 'Como funciona' para o utilizador escolher
- [x] Adicionar mais 6 propostas visuais (7-12) com fundos diferentes à página de teste HowItWorksTest
- [x] Aplicar Proposta 4 (Números Gigantes com Cards) na seção 'Como funciona' da landing page principal
- [x] Adicionar imagens de fundo temáticas em cada card da seção 'Como funciona' (01, 02, 03)
- [x] Substituir imagem do card 'Monte seu cardápio' por gerente de restaurante sorrindo no computador
- [x] Trocar fundo da seção Como funciona para o mesmo gradiente rosa/vermelho da seção WhatsApp Bot
- [x] Remover linha colorida (gradient accent) do topo da seção 'Como funciona'
- [x] Criar 10 modelos de seções de depoimentos/testemunhos na página /test/testimonials
- [x] Aplicar Proposta 4 (Destaque + Grid) na seção 'Quem usa, recomenda.' da landing page principal
- [x] Remover depoimentos do Marcos Oliveira e Juliana Costa da seção de depoimentos da landing page
- [x] Criar 10 propostas visuais para a seção de planos/preços na página /test/pricing
- [x] Adicionar mais 10 propostas (11-20) de seção de planos/preços com identidade visual Mindi
- [x] Aplicar Proposta 4 (Cards com Ícones e Gradiente) sem ícones na seção de planos da landing page principal
- [x] Adicionar nova aba KDS (Kitchen Display System) na seção "Tudo que você precisa para gerenciar" com imagem e descrição
- [x] Adicionar segunda imagem KDS (vista Lista) como carrossel na aba KDS
- [x] Remover badge "Novo" da aba KDS
- [x] Adicionar nova aba Relatórios na seção de funcionalidades com carrossel de 2 imagens (Visão Geral e Produtos ABC/CMV)
- [x] Diminuir em 10% a altura da browser bar no mockup de todas as abas da seção de funcionalidades
- [x] Substituir segunda imagem da aba Relatórios pela nova imagem (Produtos ABC/CMV com gráfico de barras)
- [x] Substituir ambas as imagens da aba Relatórios pelas novas (rela.webp como 1ª e relatorios2.webp como 2ª)
- [x] ~Redesenhar seção Como Funciona: substituir fotos de fundo por ícones grandes~ (revertido - usuário preferiu manter fotos)
- [x] Reverter seção Como Funciona para o design original com fotos de fundo nos cards
- [x] Adicionar overlay vermelho semitransparente sobre as imagens de fundo dos cards da seção Como Funciona

## Integração Paytime
- [x] Fase 1: Criar credenciais placeholder (PAYTIME_INTEGRATION_KEY, PAYTIME_AUTHENTICATION_KEY, PAYTIME_X_TOKEN, PAYTIME_BASE_URL)
- [x] Fase 1: Implementar módulo de autenticação com Bearer Token (login + renovação automática)
- [x] Fase 2: Implementar criação de transações PIX via API Paytime
- [x] Fase 2: Gerar QR Code PIX no frontend a partir do EMV
- [x] Fase 2: Implementar webhook para confirmação de pagamento (updated-sub-transaction)
- [x] Integrar opção de pagamento online (PIX/Cartão) no fluxo de pedidos do menu público

## Fase 3 Paytime: Smart Checkout (Cartão)
- [x] Consultar documentação Paytime sobre Smart Checkout
- [x] Adicionar função createCardTransaction no módulo paytime.ts
- [x] Adicionar função sendAntifraudAuth no módulo paytime.ts
- [x] Criar procedimentos tRPC para Smart Checkout (createCardPayment, confirmAntifraud, checkPaymentStatus)
- [x] Atualizar webhook para tratar transações de cartão (PAID/APPROVED/FAILED)
- [x] Adicionar campo paytimeCardEnabled no schema do estabelecimento
- [x] Integrar Smart Checkout no frontend do menu público (opção cartão online via Paytime)
- [x] Formulário de cartão com validação (número, nome, validade, CVV, CPF, endereço)
- [x] Auto-preenchimento de endereço via ViaCEP
- [x] Implementar SDK IDPAY no frontend para antifraude (iframe)
- [x] Polling de status do pagamento com cartão
- [x] Estados visuais: preenchendo, processando, antifraude, confirmado, falhou
- [x] Toggle de ativação no painel admin (Configurações > Pagamento Online)
- [ ] Testar fluxo completo de pagamento com cartão via Smart Checkout

## Bugs (Fase 3)
- [x] Estabelecimento não carrega após alterações da Fase 3 — "Crie o estabelecimento primeiro" (causa: db:push falhou por OOM, coluna paytimeCardEnabled não existia no banco)
- [x] Tabela paytime_transactions com schema antigo (recriada com estrutura correta)

## Fase 4 Paytime: Cadastro de Estabelecimentos e Split
- [x] Remover Stripe Connect para pagamento de pedidos (manter Stripe apenas para planos)
- [x] Ativar menu de Configurações de Pagamentos Online (removido disabled: true do SettingsSidebar)
- [x] Adicionar funções Paytime: createPaytimeEstablishment, getPaytimeEstablishment, listPaytimeGateways, activatePaytimeGateway, createPaytimeSplitPre, listPaytimeSplitPre
- [x] Adicionar campos no schema: paytimeEstablishmentId, paytimeOnboardingStatus, paytimeGatewayActive, paytimeSplitConfigured, paytimeSplitRuleId, razaoSocial, nomeFantasia, cnae, representante (nome, sobrenome, cpf, email, phone, birthDate)
- [x] Criar procedimentos tRPC: getOnboardingStatus, submitOnboarding, refreshOnboardingStatus, activateGateway, configureSplit, completeSetup, listGateways
- [x] Criar formulário de onboarding multi-step no frontend (4 passos: Empresa, Endereço, Representante Legal, Revisão)
- [x] Criar página de status do onboarding (progresso visual, botões de ação por estado)
- [x] Configurar Split Pré automático de 1% para Mindi
- [x] Reescrever OnlinePaymentTab com layout 40/60 (status + toggles PIX/Cartão)
- [x] Auto-preenchimento de endereço via ViaCEP no formulário
- [x] Pré-preenchimento de dados existentes do estabelecimento
- [ ] Testar fluxo completo no sandbox

## Bugs (Menu Público)
- [x] Bug: Ao selecionar "Retirar no local", a opção "Taxa de entrega" também mostra badge "Grátis!" em vez de manter o valor real (ex: R$ 8,00). O badge deveria aparecer apenas na opção selecionada que é gratuita.

## Webhook Paytime
- [x] Implementar endpoint POST /api/paytime/webhook para receber eventos da Paytime
- [x] Processar evento updated-establishment-status (atualizar status de onboarding automaticamente)
- [x] Processar evento updated-sub-transaction (atualizar status de transações)
- [x] Criar função getEstablishmentByPaytimeId no db.ts
- [x] Escrever testes vitest para o webhook (24 testes passando)

## Estorno de Transação Paytime
- [x] Implementar função refundPaytimeTransaction() no paytime.ts
- [x] Criar endpoint tRPC para estorno manual
- [x] Integrar estorno automático no fluxo de cancelamento de pedidos (Kanban)
- [x] Escrever testes vitest para o estorno
- [ ] Bug: Página de Pagamento Online (Configurações) demora muito para carregar

## Página Banking (Conta Digital)
- [x] Criar página Banking principal com cards de acesso rápido (Histórico, Extrato, Pagar Conta, PIX)
- [x] Card de saldo disponível + lançamentos futuros na página principal
- [x] Criar sub-página Histórico de Transações (lista paginada com filtros)
- [x] Criar sub-página Extrato (movimentações com filtro de data)
- [x] Criar sub-página Pagar Conta (consultar boleto + confirmar pagamento)
- [x] Criar sub-página PIX (enviar PIX com fluxo de 2 etapas)
- [x] Criar sub-página Dados do Estabelecimento (info Paytime)
- [x] Registar rota /banking no App.tsx e adicionar ao menu lateral
- [ ] Backend: endpoints tRPC para saldo, extrato, transações, PIX, pagar conta
- [ ] Conectar frontend ao backend

## Bug Fix: Tela branca total (React não monta)
- [x] Diagnosticar erro: AdminLayout importado como default no Banking.tsx mas é named export
- [x] Corrigir importação: `import AdminLayout from` → `import { AdminLayout } from`

## Remover PIX do Banking
- [x] Remover card "PIX - Envie e receba via PIX" dos cards de acesso rápido
- [x] Remover sub-view PIX e referências associadas

## Corrigir Layout Banking - Full Width
- [x] Remover div wrapper com p-4 md:p-6 max-w-7xl mx-auto
- [x] Alinhar header com padrão Dashboard/Finanças (mb-6 flex)

## Reorganizar Layout BankingHome (Estilo Efí)
- [x] Card de saldo pequeno à direita (sidebar)
- [x] Acesso rápido na sidebar: Pagar conta, Extrato, Meu estabelecimento (ícones circulares)
- [x] Conteúdo principal à esquerda (cards de operações + transações)

## Card Saldo - Restaurar Background Escuro
- [x] Restaurar card de saldo com gradiente dark (from-gray-900 via-gray-800) na sidebar direita

## Últimas Transações - Formato Tabela
- [x] Alterar lista de últimas transações na BankingHome para formato tabela com header (TRANSAÇÃO, TIPO, DATA)

## Alinhar Altura Cards Banking
- [x] Card Lançamentos futuros e Card Conta Digital (saldo) devem ter mesma altura na mesma linha

## Bug: Página Configurações loading infinito
- [x] Diagnosticar e corrigir loading infinito na página de Configurações (pagamento online)

## Bug Fix: Pagamento Online loading infinito
- [x] Remover chamada tRPC paytime.getOnboardingStatus do OnlinePaymentTab (desativar temporariamente)
- [x] Adicionar alerta visual de funcionalidade desativada para testes futuros

## Desativar aba Pagamento Online
- [x] Tornar aba Pagamento Online não clicável nas Configurações (como estava antes)

## Mascarar Banking no Menu
- [x] Renomear item Banking para ******* no menu lateral
- [x] Tornar item Banking não clicável (disabled com badge Breve)

## Esconder Pix QR Code no menu público
- [x] Esconder opção "Pix QR Code" do menu público de pagamento enquanto Paytime não estiver ativo

## Desativar Paytime no Checkout Público (código)
- [x] Forçar paytimeEnabled=false no checkout para esconder Pix QR Code
- [x] Forçar paytimeCardEnabled=false no checkout para esconder Cartão Online
- [x] Manter apenas Pix manual (copiar chave) quando PIX selecionado
- [x] Card de funcionalidades do Mindi Bot (estilo Notificações de Status) com toggles
- [x] Toggle "Retirar pedidos" desativado por padrão (bot só responde perguntas)
- [x] Toggle "Responder perguntas" ativado por padrão
- [x] Campos no schema/banco para persistir configurações do bot
- [x] Endpoint /api/bot/bot-status expor flag botOrdersEnabled para n8n consultar
- [x] Verificar impacto no fluxo n8n e documentar

## Card de Funcionalidades do Mindi Bot
- [x] Adicionar campos botOrdersEnabled e botQuestionsEnabled no schema do banco
- [x] Aplicar migração no banco de dados
- [x] Adicionar campos no router tRPC establishment.update
- [x] Expor ordersEnabled e questionsEnabled no endpoint /api/bot/bot-status
- [x] Bloquear POST /api/bot/orders quando botOrdersEnabled = false (retorna 403 BOT_ORDERS_DISABLED)
- [x] Criar card "Funcionalidades do Bot" na página Mindi Bot (estilo Notificações de Status)
- [x] Toggle "Responder perguntas" (botQuestionsEnabled)
- [x] Toggle "Retirar pedidos" (botOrdersEnabled, default desativado)
- [x] Desativar toggles quando o bot está inativo
- [x] Nota informativa quando bot está desativado
- [x] Testes vitest para as novas funcionalidades (6 testes passando)

## Ajuste no Fluxo n8n - Flag ordersEnabled
- [x] Ajustar Roteador AI no n8n para consultar flag ordersEnabled do bot-status
- [x] Impedir que o bot direcione para agente de pedidos quando ordersEnabled = false

## Plano Lite - Menu com envio via WhatsApp
- [x] Adicionar 'lite' ao enum planType no schema e migrar banco
- [x] Checkout simplificado no PublicMenu: 3 etapas (Resumo, Dados=só Nome, Confirmação) + botão Enviar via WhatsApp
- [x] Função de formatação de mensagem WhatsApp com todos os dados do pedido
- [x] Sidebar simplificada para plano Lite (Dashboard, Menu: Cardápio+Grupos, Configurações)
- [x] Configurações simplificadas (sem Agendamento, Fechamento Programado, Entrega Grátis)
- [x] Admin: opção de mudar plano de restaurante para Lite
- [x] Testes vitest para funcionalidades do plano Lite (24 testes passando)
## Bug: changePlan falha ao mudar para plano Lite
- [x] Corrigir erro SQL ao mudar plano para Lite (enum 'lite' não existia no banco — aplicado ALTER TABLE manualmente)
## Bug: Validação Zod não aceita 'lite' e 'free' no changePlan/convertToPaid
- [ ] Corrigir enum Zod na rota convertToPaid para incluir 'free' e 'lite'
- [ ] Verificar todas as rotas admin que usam enum de planType
## Plano Lite - Esconder elementos do header
- [x] Esconder ícone de tempo de preparo no header (plano Lite)
- [x] Esconder toggle de som no header (plano Lite)
- [x] Esconder ícone/botão de chat flutuante (plano Lite)
- [x] Esconder OnboardingFAB (foguete) no plano Lite
- [x] Esconder WhatsAppDisconnectedBanner no plano Lite
## Plano Lite - Bloquear rotas não permitidas
- [x] Redirecionar para Dashboard quando plano Lite tenta acessar rotas não permitidas (ex: /pedidos, /financas, /relatorios, etc.)
## Plano Lite - Seção de Entrega e Pagamento no checkout
- [x] Adicionar seção de Entrega (tipo de entrega, endereço) e Pagamento (forma de pagamento) no checkout Lite do menu público
- [x] Incluir dados de entrega e pagamento na mensagem formatada do WhatsApp (já estava implementado no buildWhatsAppMessage)
## Plano Lite - Esconder Pedidos e Fidelidade no menu público
- [x] Esconder opção "Pedidos" no menu público para plano Lite (já estava implementado)
- [x] Esconder opção "Fidelidade" e "Minha Carteira" (Cashback) no menu público para plano Lite (desktop e mobile)
## Bug: Plano Lite - Página de planos e sidebar- [x] Página de planos mostra 'Gratuito' em vez de 'Lite' quando restaurante está no plano Lite — adicionado 'lite' ao planNameMap, planPriceMap e lista de planos- [ - [x] Sidebar mostra menus completos em vez dos menus reduzidos do Lite para novos cadastros — corrigido auth.ts para salvar planType='lite' ao criar estabelecimentostros no plano Lite
- [x] Corrigir isLitePlan para NÃO incluir plano 'free' (free deve ter menu completo, só lite tem restrições) — corrigido em AdminLayout, PublicMenu, OnboardingFAB, SettingsSidebar, Configuracoes
## Remover plano 'free' do sistema
- [x] Remover 'free' do enum planType no schema (mantido no enum para compatibilidade com dados existentes, mas não é usado para novos cadastros)
- [x] Substituir todas as referências a 'free' por 'trial' no frontend e backend
- [x] Atualizar página de Planos para não ter card 'Gratuito' separado (trial = teste grátis 15 dias)
- [x] Atualizar Onboarding para usar 'trial' em vez de 'free'
- [x] Atualizar adminRouter e rotas que referenciam 'free'
- [x] Atualizar testes (24 passando)
## Bug: Conta criada com plano Lite não tem menu reduzido
- [x] Investigar e corrigir: ao criar conta selecionando Lite, o menu não fica reduzido (era cache do servidor dev — reinício resolveu)
## Plano Lite - Trial de 15 dias
- [x] Definir trialStartDate ao criar conta com plano Lite (auth.ts)
- [x] Mostrar botão "Teste gratuito: X dias" na top bar para plano Lite (igual ao trial)
- [x] Atualizar getTrialInfo para incluir Lite como trial
- [x] Atualizar adminChangePlan para definir trialStartDate ao mudar para Lite

## Template de E-mail Minimalista (estilo iFood)
- [x] Redesenhar template de e-mail de verificação no estilo minimalista iFood (logo Mindi + código em destaque + textos limpos)
- [x] Redesenhar template de e-mail de redefinição de senha no mesmo estilo minimalista

## Correção Visual - Onboarding
- [x] Corrigir background do onboarding para branco (igual à tela de login)

## Correção - Banner de Cookies
- [x] Restringir banner de cookies para aparecer apenas na landing page (não no menu público nem no dashboard)

## Mindi Bot - Desativar Retirar Pedidos
- [x] Desativar toggle 'Retirar pedidos' na página Mindi Bot (não permitir que o usuário ative)

## Mindi Bot - Layout Banner
- [x] Mover banner 'Mindi Bot está ativo' para a mesma linha do título no desktop

## Template E-mail - Cor da caixa de código
- [x] Trocar fundo bege (#f5f0e8) da caixa do código de verificação para vermelho claro (#fde8e8)

## Template E-mail - Corrigir Logo
- [x] Trocar logo no template de e-mail de verificação para o mesmo logo do menu público (e redefinição de senha)

## Dashboard - Plano Lite
- [x] Esconder card 'Tempo Médio' no dashboard para o plano Lite

## PWA - Atualizar Ícones
- [x] Atualizar ícones PWA (client/public/icons/) para usar o logo correto UtensilsCrossed

## Favicon
- [x] Atualizar favicon.ico com o logo correto UtensilsCrossed
- [x] Adicionar apple-touch-icon.png para compatibilidade iOS (já referenciado via icons PWA)

## Plano Lite - Métricas Dashboard via WhatsApp
- [x] Registrar pedido no banco quando cliente clica "Enviar pedido via WhatsApp" no menu público
- [x] Garantir que Dashboard Lite mostra TODOS os cards de métricas (Pedidos, Faturamento, Ticket Médio, Taxa de Conversão, C. Fidelizados, Acumulado da semana, Top 10, Pedidos por Modalidade, Faturamento por Hora, Perfil de Clientes, Pedidos Últimos 7 dias, Pedidos Recentes)
- [x] Manter card 'Tempo Médio' oculto no Lite, garantir que todos os outros cards estão visíveis

## Bug: Pedido Lite WhatsApp não registra no banco
- [x] Investigar por que pedido Lite não foi salvo no banco (establishment 210026) — servidor estava com código antigo, restart resolveu
- [x] Corrigir o fluxo de registro de pedido Lite — validação customerPhone corrigida, testado com sucesso (pedidos #P2 e #P3 salvos como completed)

## Menu Público - Barra de Categorias
- [x] Reduzir em 9% o tamanho da barra de categorias e conteúdo interno (desktop e mobile)

## Menu Público - Setas de Navegação nas Categorias (Desktop)
- [x] Adicionar setas de navegação lateral (esquerda/direita) na barra de categorias do menu público
- [x] Apenas na versão desktop (ocultar no mobile)
- [x] Usar mesmo estilo das setas do PDV (botão circular com chevron)
- [x] Corrigir posição das setas: mover para fora do container de categorias, nas extremidades laterais da barra
- [x] Ajustar posição das setas: aproximar do conteúdo das categorias (não tão nas bordas da tela)
- [x] Aumentar tamanho dos botões das setas de navegação em 4% (28px → 29px)

## Admin - Edição de Planos (Preços e Recursos)
- [x] Editar preços dos planos no admin (sincronizar com Stripe - usar price_data dinâmico)
- [x] Editar textos dos recursos existentes de cada plano
- [x] Adicionar novos textos de recursos em cada plano
- [x] Remover textos de recursos de cada plano
- [x] Alterações refletem na página de planos do restaurante
- [x] Alterações de preço refletem na Stripe (via price_data dinâmico no checkout)

## Admin Planos - Redesign Lista + Sidebar
- [x] Trocar visualização de cards para lista/tabela compacta
- [x] Ao clicar no plano, abrir Sheet (sidebar lateral direita) para editar preços e recursos

## Admin Planos - Redesign Sheet Lateral
- [x] Redesenhar Sheet lateral dos planos com layout profissional (melhor espaçamento, tipografia, organização visual)
## Admin Planos - Remover Enterprise
- [x] Remover plano Enterprise da lista (último plano é o Pro)
## Adicionar plano Essencial
- [x] Adicionar plano Essencial na página de registro (entre Lite e Pro)
- [x] Garantir que Essencial aparece na página de planos do admin
## Cards de planos - Reduzir tamanho
- [x] Diminuir tamanho dos cards de planos em 5% na página /criar-conta
## Admin Planos - Editar nome do plano
- [x] Adicionar possibilidade de editar o nome do plano no Sheet lateral do admin
- [x] Nome editado deve refletir na página de registro /criar-conta
## Página interna de planos - displayName dinâmico
- [x] Fazer a página interna de planos do dashboard usar displayName do banco (editado pelo admin)
## Bug: endpoint updateDisplayName não registrado
- [x] Corrigir endpoint admin.plans.updateDisplayName que não existe no router (era cache do servidor, resolvido com restart)
## Plano Free - Limitações
- [x] Plano Free (trial) sem período de trial, é gratuito permanente com limitações
- [x] Máximo 9 categorias no plano Free
- [x] Máximo 25 produtos no plano Free
- [x] Máximo 5 complementos por grupo de complementos no plano Free
- [x] Bloquear agendar disponibilidade de categoria no plano Free
- [x] Bloquear disponibilidade por dias/horários específicos ao editar produto no plano Free (mostrar "assine um plano para liberar")
- [x] Bloquear controle de estoque ao editar produto no plano Free (mostrar "assine um plano para liberar")
- [x] Bloquear card Acessos do Cardápio na dashboard no plano Free (mostrar "assine um plano para liberar")
- [x] Bloquear card Taxa de Conversão na dashboard no plano Free (mostrar "assine um plano para liberar")
- [x] Bloquear card Faturamento por Hora na dashboard no plano Free (mostrar "assine um plano para liberar")
## Bug: Dropdown Alterar Plano com nomes antigos
- [x] Corrigir dropdown de Alterar Plano no admin para usar displayName dinâmico (Free, Starter, Essencial, Pro) e remover Enterprise
- [x] Remover referências ao Enterprise de todos os ficheiros de teste
- [x] Remover dados do Enterprise do banco (plan_prices e plan_features)
- [x] Atualizar displayNames no banco (Free, Starter, Essencial, Pro)
## Plano Free - Mesmos menus do Starter
- [x] Aplicar ao plano Free (trial) as mesmas restrições de sidebar do plano Starter (lite): apenas Dashboard, Menu (Cardápio/Grupos) e Configurações
## Plano Free - Mesmos menus do Starter
- [x] Aplicar ao plano Free (trial) as mesmas restrições de sidebar do plano Starter (lite): apenas Dashboard, Menu (Cardápio/Grupos) e Configurações
## Plano Free - Bloqueio de produtos/categorias excedentes
- [x] Produtos que excedem o limite do plano Free ficam pausados automaticamente (sem poder reativar)
- [x] Produtos bloqueados não aparecem no menu público
- [x] Na página de catálogo, produtos bloqueados aparecem com indicação visual (pausado/bloqueado pelo plano)
- [x] Categorias que excedem o limite ficam bloqueadas da mesma forma
- [x] Complementos que excedem o limite ficam bloqueados da mesma forma
- [x] Impedir criação de novos produtos/categorias/complementos acima do limite
## Corrigir ordem de bloqueio de produtos por categoria
- [x] Bloqueio deve seguir a ordem das categorias: cat1 completa, cat2 completa, cat3 parcial (até atingir 25)
- [x] Aplicar mesma lógica no menu público
## Plano Free - Remover indicação de trial
- [x] Plano Free não deve mostrar "teste gratuito de 15 dias" - é permanente e gratuito
- [x] Apenas planos pagos (Starter, Essencial, Pro) têm trial de 15 dias
## Remover card trial da página de planos
- [x] Remover trial do PLAN_ORDER - manter apenas Free, Starter (lite), Essencial (basic), Pro
- [x] Trial é estado temporário interno, não um plano visível
## Badge trial na barra superior
- [x] Badge "Teste gratuito: 15 dias" não deve aparecer para o plano Free
- [x] Adicionar opção "Free" no dropdown de Alterar Plano do admin (AdminRestaurantes e AdminRestauranteDetalhe)
- [x] Adicionar "free" ao enum do changePlan no adminRouter
## Dropdown Alterar Plano duplicado
- [x] Remover opção 'trial' do dropdown Alterar Plano - trial é estado interno, não selecionável
## Corrigir adminChangePlan
- [x] Adicionar 'free' ao tipo da função adminChangePlan no adminDb.ts
## Bloquear Nota do Restaurante no plano Free
- [x] Card "Nota do Restaurante" deve estar bloqueado no plano Free (igual ao Starter)
## Recursos dinâmicos na página de Planos do restaurante
- [x] Buscar features/recursos dos planos do banco de dados (plan_features) na página de Planos
- [x] Substituir textos fixos nos cards por features dinâmicas do admin
- [x] Cada edição/adição de recurso no admin deve refletir automaticamente na página de Planos
## Drag and drop para recursos dos planos
- [x] Adicionar ícone de arrastar (grip) em cada recurso na lista de Recursos do AdminPlanos
- [x] Implementar drag and drop para reordenar recursos
## Bug: Badge errado no Admin Planos
- [x] Corrigir badge de plano na página Admin Restaurantes — restaurante com plano Free/trial mostra badge "Essencial" incorretamente
## Bug: Badges de plano usam labels fixas em vez de displayNames dinâmicos
- [x] Corrigir badges na página Admin Restaurantes para usar displayNames dinâmicos do banco (ex: "Starter" em vez de "Lite")
## Bug: Erro ao mudar restaurante para plano Free
- [x] Corrigir erro "Invalid option" ao tentar mudar restaurante para plano Free — resolvido após reiniciar servidor (código já estava correto)
## Bug: Card Nota do Restaurante cortado no plano Free
- [x] Mostrar conteúdo completo do card Nota do Restaurante com overlay de bloqueio no plano Free (Configurações)
## Melhoria: Cards bloqueados na Dashboard com conteúdo visível
- [x] Mostrar conteúdo completo dos cards bloqueados na Dashboard (Taxa de Conversão, Acessos ao Cardápio, Faturamento por Hora) com overlay de bloqueio por cima
## Melhoria: Overlay dos cards bloqueados mais visível
- [x] Redesenhar overlay com gradiente para conteúdo ser visível (gerar curiosidade) mas com indicação clara de bloqueio
## Ajuste: Ícone de cadeado ao lado do texto
- [x] Mover ícone de cadeado para ficar ao lado esquerdo do texto "Recurso Premium" nos cards bloqueados (Dashboard e Configurações)
## Bloqueio: Card Pedidos Últimos 7 dias no plano Free
- [x] Bloquear card "Pedidos | Últimos 7 dias" na versão Free com overlay de gradiente e dados de exemplo
## Melhoria: Card Tempo Médio visível no plano Free
- [x] Mostrar card Tempo Médio no plano Free com overlay de bloqueio e dados de exemplo (em vez de ocultar completamente)
## Bug: Estilo do botão Desbloquear inconsistente
- [ ] Padronizar botão Desbloquear do card Taxa de Conversão para usar mesmo estilo (botão vermelho arredondado) do card Acessos ao Cardápio
## Bug: Estilo e centralização dos overlays nos cards bloqueados
- [x] Padronizar botão Desbloquear do card Taxa de Conversão para usar mesmo estilo (botão vermelho arredondado) dos outros cards
- [x] Centralizar texto e botão no meio do overlay em todos os cards bloqueados
## Bug: Overlay Nota do Restaurante em Configurações
- [x] Mudar texto de "Fazer upgrade →" para "Desbloquear →" e padronizar estilo do botão no card Nota do Restaurante (Configurações)
## Bug: Modal Alterar Plano mostra plano errado
- [x] Modal "Alterar Plano" em Admin > Restaurantes mostra "Essencial" selecionado em vez do plano atual do restaurante (ex: Free)
## Valor por dia nos planos pagos
- [x] Adicionar texto pequeno abaixo do preço mensal nos 3 planos pagos mostrando o valor por dia (preço ÷ 30)
## Texto no plano Free
- [x] Adicionar texto "Ideal para começar e validar" abaixo do botão no card do plano Free
## Limpeza de fechamentos programados expirados
- [x] Remover automaticamente fechamentos programados com datas que já passaram (regra geral para todos os estabelecimentos)
## Bug: Timezone nos fechamentos programados
- [x] Data selecionada 11/04 está sendo salva como 10/04 — problema de conversão UTC no backend (corrigido: T00:00:00 -> T12:00:00)
## Favicon de produção diferente do de dev
- [ ] Corrigir favicon de produção para usar o mesmo ícone do ambiente de desenvolvimento
## Tamanho dos títulos nos cards de status de Pedidos
- [x] Aumentar tamanho dos títulos NOVOS, PREPARO, PRONTOS, COMPLETOS nos cards de status da página de Pedidos
## Bug: Filtro produtos sem foto mostra categorias vazias
- [x] Quando filtro "produtos sem foto" está ativo, esconder categorias que não têm nenhum produto sem foto
## Edição dos nomes dos status de pedidos
- [x] Criar backend (schema + router) para armazenar nomes customizados dos status
- [x] Adicionar ícone de três pontinhos à esquerda dos nomes PREPARO, PRONTOS, COMPLETOS (sem NOVOS)
- [x] Dropdown com opções: "Editar título" e "Restaurar título" ao clicar nos três pontinhos
- [x] Permitir edição dos nomes dos status pelo cliente (salvar no banco por estabelecimento)
- [x] DemoPedidos.tsx não precisa (componente estático de demonstração na Landing Page)
## Bug: Erro ao atualizar título dos status na página de Pedidos
- [x] Investigar e corrigir erro "Erro ao atualizar título" ao editar nome dos status (coluna não existia no banco remoto, SQL executado manualmente)

## Corrigir ícone duplicado na página de Cozinha
- [x] Remover ícone duplicado do lado direito nos headers de status
- [x] Manter apenas o ícone do lado esquerdo com o mesmo tamanho do que será removido (lado direito, p-2.5 h-5 w-5)

## Consistência visual dos títulos de status (Cozinha → Pedidos)
- [x] Aplicar mesma fonte, negrito e tamanho do título dos status da Cozinha na página de Pedidos (h3 font-semibold text-sm, sem uppercase/tracking-wide/text-muted-foreground)

## Restaurar tamanho original do título dos status (Pedidos)
- [x] Voltar o título para text-sm text-muted-foreground font-semibold tracking-wide uppercase (como era antes)

## Igualar fonte/negrito do título de status (Pedidos = Cozinha) sem diminuir tamanho
- [x] Ajustado Pedidos para h3 font-semibold text-sm (igual Cozinha: negrito, texto escuro, sem uppercase/tracking/cinza)

## Diminuir logo da página de carregamento
- [x] Reduzir tamanho do logo em 20% na página de carregamento (AdminLayout + AdminPanelLayout): w-20→w-16, h-20→h-16, h-10→h-8, w-10→w-8, rounded-[22px]→rounded-[18px]

## Igualar tamanho do título de status (Cozinha = Pedidos)
- [x] Alterar título na Cozinha de text-sm para text-base (igual Pedidos)

## Trocar ícone de limpar pedidos (Completos) na página de Pedidos
- [x] Trocar ícone de check pelo ícone de borracha (Eraser) no botão de limpar pedidos acumulados

## Adicionar edição de títulos de status na página de Cozinha
- [x] Adicionar ícone de 3 pontinhos (⋮) ao lado direito dos cards PREPARO, PRONTOS, COMPLETOS
- [x] Dropdown com "Editar título" e "Restaurar título" (igual Pedidos)
- [x] Usar customStatusLabels do establishment para salvar/carregar nomes customizados

## Bug: Planos de assinatura perderam recursos/features na versão dev
- [x] Investigar diferenças entre versão publicada (com recursos completos) e versão dev (recursos simplificados)
- [x] Comparar últimas 8 versões para identificar onde a mudança ocorreu
- [x] Causa: servidor dev com cache de routers antigos, resolvido com restart

## Ajuste no card Completos da Cozinha (Kanban)
- [x] Remover ícone de lixeira ao lado dos 3 pontinhos no card Completos
- [x] Adicionar opção "Limpar lista" no dropdown dos 3 pontinhos, abaixo de "Restaurar título"

## Card Essencial na página de Planos - ver mais recursos
- [x] Mostrar recursos até "(KDS) Sistema de Exibição de Cozinha" no card Essencial
- [x] Adicionar botão "ver mais recursos" abaixo do último recurso visível
- [x] Ao clicar, exibir os demais recursos que estavam escondidos

## Favicon da versão dev diferente da versão publicada
- [ ] Corrigir favicon da versão dev para ser igual ao da versão publicada (ícone vermelho arredondado com talheres)

## Reativar Paytime para testes com sandbox
- [x] Reativar aba de Pagamento Online nas configurações
- [x] Remover bloqueio forçado de paytimeEnabled/paytimeCardEnabled no checkout público (ainda não removido no checkout - apenas na aba de configurações)

## Bug: Erro 422 ao cadastrar estabelecimento na Paytime
- [x] Corrigir payload: type não está sendo enviado (INDIVIDUAL/BUSINESS)
- [x] Corrigir payload: responsible não está sendo enviado (renomeado de representative para responsible)
- [x] Corrigir payload: address.complement deve ser enviado (default "N/A")
- [x] Corrigir payload: revenue deve ser número >= 1 (default 10000)
- [x] Adicionar campos: format, birthdate, phone_number, gmv
- [x] Atualizar frontend para enviar novos campos

## Bug: Erro 422 validação Paytime - formatos incorretos
- [x] Corrigir formato telefone responsável (responsible.phone) - 11 dígitos com DDD
- [x] Corrigir CNAE para ter exatamente 7 caracteres (padStart + slice)
- [x] Corrigir CNPJ para formato válido com pontuação (XX.XXX.XXX/XXXX-XX)
- [x] Corrigir formato telefone principal (phone_number) - 11 dígitos com DDD
- [x] Corrigir CPF responsável para formato com pontuação (XXX.XXX.XXX-XX)

## Botão de preenchimento automático no formulário de Pagamento Online (dev only)
- [x] Adicionar botão "Preencher automaticamente" em cada etapa do formulário de cadastro Paytime
- [x] Usar dados de teste válidos do sandbox Paytime (CNPJ, CPF, telefone com final 1, etc.)
- [x] Mostrar botão apenas em ambiente de desenvolvimento
- [x] Gerar CNPJ e CPF aleatórios (válidos) a cada clique para evitar erro "CPF/CNPJ já cadastrado" na Paytime
- [x] Adicionar prop headerRight ao SectionCard para posicionar botão no cabeçalho de cada step

## Remover bloqueios forçados de paytimeEnabled no checkout público
- [x] Investigar todos os locais onde paytimeEnabled/paytimeCardEnabled são forçados a false no checkout
- [x] Remover bloqueios para que o checkout respeite as configurações reais do estabelecimento
- [x] Verificar que métodos de pagamento PIX e Cartão aparecem corretamente no checkout quando habilitados

## Bug: Erro 403 "O estabelecimento principal já faz parte da regra de Split" ao completar setup
- [x] Investigar lógica de criação de split pre no backend (paytime.ts)
- [x] Tratar erro 403 "já faz parte da regra de Split" como sucesso (split já existe)
- [x] Garantir que o status splitConfigured seja marcado como true mesmo quando split já existe

## Verificar campos obrigatórios para pagamento com cartão Paytime
- [ ] Consultar documentação da API Paytime sobre campos obrigatórios na criação de transação com cartão
- [ ] Verificar se endereço de cobrança é obrigatório ou opcional
- [ ] Verificar como testar pagamento com cartão no sandbox Paytime
- [ ] Ajustar formulário se necessário (remover campos não obrigatórios ou torná-los opcionais)

## Botão de preenchimento automático no checkout público (cartão online)
- [x] Adicionar botão "Preencher automaticamente" no formulário de cartão do checkout público
- [x] Usar cartão de teste oficial da Paytime (5200000000001005, CVV 123, 12/2026)
- [x] Preencher endereço de cobrança automaticamente com dados de teste
- [x] Investigar e corrigir erro "Dados do cartão inválidos" - era establishment_id errado no header
- [x] Corrigir establishment_id: usar paytimeEstablishmentId do sub-estabelecimento em vez do marketplace
- [x] Aplicar correção tanto para transações PIX quanto Cartão

## Implementar Jornada KYC no fluxo de onboarding Paytime
- [x] Analisar código atual do completeSetup e ativação de gateways
- [x] Adicionar campo kycUrl, kycStatus, paytimeBankingActive, paytimeSubPaytimeActive ao schema do banco
- [x] Backend: extrair url_documents_copy da resposta do Gateway 6 e salvar no banco
- [x] Backend: criar procedures activateBanking, checkKycStatus, activateSubPaytime
- [x] Backend: listar planos comerciais e tarifas bancárias da Paytime
- [x] Backend: ativar Gateway 4 (SubPaytime) com planos comerciais vinculados
- [x] Frontend: mostrar etapa KYC no painel de configurações com link para o titular completar
- [x] Frontend: mostrar status do KYC (pendente/aprovado/rejeitado) no stepper de onboarding
- [x] Frontend: botões separados para cada etapa (Banking → KYC → SubPaytime → Split)
- [ ] Testar fluxo completo no sandbox

## Correção Campo Interest na API Paytime
- [x] Corrigir campo interest de "ESTABLISHMENT" para "STORE" em conformidade com a documentação da API Paytime
- [x] Erro TON000145 confirmado como configuração interna da Paytime (não é problema do código) — aguardar Paytime resolver do lado deles

## Página de Gestão de Clientes
- [x] Análise das tabelas existentes no banco antes de criar novas
- [x] Página /clientes com menu na seção Gestão
- [x] 5 cards de resumo (Total, Novos, Recorrentes, Em Risco, Inativos)
- [x] Filtros de período (Hoje, 7 dias, Mês, 3 meses)
- [x] Botão "Novo Cliente"
- [x] Tabela paginada (25/página) com avatar, nome, contato, última compra, pedidos
- [x] Slidebar com perfil completo do cliente
- [x] Campo de anotações internas
- [x] Estatísticas e histórico de pedidos na slidebar
- [x] Botão salvar na slidebar
- [x] Escopo por estabelecimento
- [x] Testes unitários para as procedures de clientes

- [x] BUG: Cards mostram 41 clientes mas a lista/tabela aparece vazia na página de Clientes
## Padronização Visual da Página de Clientes
- [x] Padronizar cards de resumo com estilo StatCard da Dashboard (borda colorida no topo, ícone no canto)
- [x] Padronizar filtros de período com estilo botões pill da página Trials (ativo vermelho, inativos cinza)
- [x] Redesenhar slidebar de perfil do cliente seguindo modelo da slidebar Dados da Entrega do PDV (header vermelho gradiente)
- [x] Adicionar /clientes à lista LITE_ALLOWED_HREFS para acesso no plano Lite

## Ajustes Página Clientes (Rodada 3)
- [x] Cards clicáveis: clicar em Novos/Recorrentes/Em Risco/Inativos filtra a lista
- [x] Ícone header: remover container colorido, deixar vazado igual demais páginas
- [x] Padronizar tamanho do título igual demais páginas
- [x] Remover campo de busca da página (usar busca da top bar)
- [x] Adicionar "clientes" no placeholder da top bar
- [x] Botão Novo Cliente: mesmo estilo pill dos filtros de período (cinza claro, não vermelho grande)

## Ajustes Página Clientes (Rodada 4)
- [x] Campos de endereço na edição do cliente iguais ao modal Dados da Entrega do PDV (Rua, Número, Bairro, Complemento, Ponto de referência)
- [x] Botão Novo Cliente na cor vermelha (mesma cor dos filtros de período ativos)
- [x] Borda de seleção dos cards igual à página de Estoque (fina e suave, não grossa azul)

## Busca Global - Integração com Clientes
- [x] Integrar busca global da topbar para filtrar clientes na página /clientes

## Ajustes Página Clientes (Rodada 5)
- [x] Campo de bairro na edição do cliente com botão "Alterar" e seleção de bairros cadastrados (igual PDV)
- [x] Campo de busca da topbar: remover X nativo e adicionar texto "Limpar" em vermelho
## Ajustes Página Clientes (Rodada 6)
- [x] Mover paginação (botões voltar/avançar + "X de Y") para o lado esquerdo, texto "X clientes encontrados" à direita dos botões de paginação
- [x] Converter modal "Novo Cliente" de Dialog para Sheet (sidebar) no mesmo estilo da sidebar de edição
- [x] Seção Anotações no perfil do cliente: botão "Deixar nota", visual post-it com bordas tracejadas e cores aleatórias (verde, vermelho, amarelo, azul, cinza)
- [x] Sidebar Novo Cliente: replicar visual post-it colorido na seção de anotações
- [x] Ícone de lixeira para apagar nota individual (perfil e novo cliente)
- [x] Limite de 3 linhas por nota com "Ler mais..." quando ultrapassar
- [x] Ícone de editar nota ao lado da lixeira em cada post-it
- [x] "Deixar nota" deve adicionar nova nota abaixo das existentes (não substituir)
- [x] Data de criação em cada nota individual
- [x] Aumentar largura do campo de busca na topbar em 15%
- [x] Permitir busca de clientes por número de celular além do nome (já implementado no backend)
## Padronização de Botões de Criação (Rodada 7)
- [x] Padronizar botão "Novo Entregador" na página de Entregadores (mesmo estilo do Novo Cliente)
- [x] Padronizar botão "Categoria" na página de Estoque (mesmo estilo do Novo Cliente)
- [x] Padronizar botão "Novo Lançamento" na página de Finanças (mesmo estilo do Novo Cliente)
- [x] Padronizar botão "Criar Cupom" na página de Cupons (mesmo estilo do Novo Cliente)
- [x] Padronizar botão "Novo Colaborador" na página de Acessos (mesmo estilo do Novo Cliente)
- [x] Padronizar botões "Categoria" e "Item" na página de Catálogo (mesmo estilo vermelho do Novo Cliente)
- [x] Reduzir paginação de clientes de 25 para 20 por página
- [x] Alterar cor do tooltip "Temos novidades!" para bg-red-500 (mesmo vermelho do botão Novo Cliente)
## Lista de Clientes - Melhorias (Rodada 8)
- [x] Adicionar coluna "Total Gasto" na lista de clientes
- [x] Ordenação por coluna "Pedidos" (maior/menor)
- [x] Ordenação por coluna "Último Pedido" (mais recente/mais antigo)
- [x] Reorganizar seção de info do cliente no perfil: nome+telefone organizados, botões Ligar e Mensagem (WhatsApp) lado a lado como na sidebar de detalhes do pedido
## Correções Histórico de Pedidos (Rodada 9)
- [x] Corrigir número do pedido duplicado (##P25 → #P25)
- [x] Traduzir termos técnicos no histórico: card→Cartão, internal→PDV, etc.
## Correção Mobile - Modal Checkout (Rodada 10)
- [x] Bloquear scroll do body quando modal de checkout está aberto no mobile (scroll bleed fix)
## Fix Barra Sacola Mobile Chrome (Rodada 11)
- [x] Corrigir altura da barra "Ver sacola" no Chrome mobile quando barra de navegação é recolhida (fica muito grande)

## Sistema de Upsell (Fase 2 - Painel Admin + Checkout Público)
- [x] Schema: campos isUpsell (categoria) e isUpsellPinned (produto) no Drizzle
- [x] Procedure toggleUpsell para categorias (category.ts)
- [x] Procedure toggleUpsellPinned para produtos (product.ts)
- [x] Procedure getUpsellSuggestions no publicMenu.ts
- [x] Toggle "Usar como sugestão" no menu de contexto da categoria (Catalogo.tsx)
- [x] Toggle "Fixar como sugestão" no menu de contexto do produto (Catalogo.tsx)
- [x] Badge "Sugestão" com ícone de presente nas categorias/produtos marcados
- [x] Carrossel "Que tal adicionar?" no Step 2 (Resumo do Pedido) do checkout público
- [x] Botão "+" para adicionar itens do upsell ao carrinho diretamente do checkout
- [x] Filtragem: excluir itens já no carrinho das sugestões
- [x] Toast de confirmação ao adicionar item do upsell
- [x] Limitar carrossel de upsell para exibir no máximo 7 sugestões
- [x] Corrigir erros de TypeScript em reportExport.ts e reportHelpers.ts (function declarations em blocos + null checks)
- [x] Corrigir erros de TypeScript em paytime.ts (interest ESTABLISHMENT→STORE, planId object wrap)
- [x] Criar ficheiro shared/planLimits.ts em falta (já existia, adicionado enterprise ao PlanType)
- [x] Adicionar testes unitários vitest para getDRE e getProductsABC (9 testes, todos a passar)
- [x] Adicionar opção de excluir cliente no menu de 3 pontinhos da lista de clientes
- [x] Alterar label "TOTAL DE CLIENTES" para "T. DE CLIENTES" na página de clientes
- [x] Card Acessos ao Cardápio: filtrar dados para mostrar apenas semana atual (zerar toda segunda)
- [x] Card Acessos ao Cardápio: mostrar "Hoje" em vermelho no label do dia atual
- [x] Card Acessos ao Cardápio: efeito pulsante nos quadradinhos do dia atual
- [x] Card Acessos ao Cardápio: adicionar borda vermelha/laranja nos quadradinhos do dia atual
- [x] Card Acessos ao Cardápio: trocar quadradinhos do dia atual para escala de vermelho (remover borda laranja)
- [x] Mover menu Clientes para ficar acima do menu Pedidos na sidebar
- [x] Adicionar banner de cashback na página de Clientes (mesmo estilo do banner 'produtos sem foto' do catálogo)
- [x] Mover banner de cashback para abaixo dos stat cards (não acima)
- [x] Atualizar texto do banner de cashback para nova descrição
- [x] Banner de cashback só aparece quando cashback NÃO está ativo (ocultar se já configurado)
- [x] Remover botão X de fechar do banner de cashback na página de Clientes
- [x] Adicionar banner de Cartão Fidelidade (vermelho) na página de Clientes
- [x] Criar carrossel com dots para alternar entre banner de Cashback e Cartão Fidelidade
- [x] Auto-rotação do carrossel de banners a cada 7 segundos na página de Clientes
- [x] Pausar auto-rotação do carrossel de banners ao hover do mouse
- [x] Ocultar cards de PIX Online, Smart Checkout, Taxas e Métodos aceitos na aba Pagamento Online até onboarding Paytime completo
- [x] Corrigir erro 'No procedure found on path paytime.submitOnboarding' ao enviar cadastro Paytime
- [x] Corrigir fluxo PIX QR Code: pedido só deve ser criado APÓS pagamento confirmado
- [x] Corrigir fluxo Cartão Online: pedido só deve ser criado APÓS pagamento confirmado
- [x] Corrigir fluxo PIX: ao clicar "Pagar com PIX" deve mostrar QR Code ANTES de mostrar "Pedido enviado com sucesso"
- [x] Liberar menu Banking no sidebar para ser clicável (remover tooltip "em desenvolvimento")

- [x] Fix: Botão "Pagar com PIX" volta ao estado inicial antes do QR Code ser gerado — manter "Processando..." até o QR Code aparecer
- [x] Fix: Pedidos pagos via PIX Online mostram ícone de cartão sem nome — corrigir para ícone QR Code + texto "Pix Online"
- [x] Fix: Mover botão "Escolher outra forma de pagamento" para footer fixo do modal (fora da rolagem) e renomear para "Alterar forma de pagamento"
- [x] UI: Mover ícone QR Code para ao lado do título "Escaneie o QR Code para pagar" (inline) e diminuir tamanho
- [x] UI: Botão copiar PIX — remover alert, ícone muda para check ao copiar, cor vermelha, vibração no celular
- [x] Investigar: Fluxo pagamento cartão Paytime — antifraude/3DS, cartões de teste, regras de aprovação por centavos, bug "Processando pagamento" infinito
- [x] Migrar antifraude de IDPAY (iframe) para 3DS (SDK PagSeguro) no pagamento com cartão online
- [ ] Bug: Pagamento com cartão online fica preso em "Processando pagamento" após migração para 3DS — diagnosticar e corrigir

## Correções fluxo 3DS (pagamento cartão online)
- [x] Corrigir: body do antifraud-auth deve usar o `id` retornado pelo SDK PagSeguro (threeDsSdkId), não o antifraudId da Paytime
- [x] Frontend: enviar threeDsSdkId separado do antifraudId ao backend
- [x] Backend: usar threeDsSdkId no body do antifraud-auth para 3DS (com fallback para antifraudId)
- [x] Backend: atualizar ID da transação no banco quando Paytime retorna novo _id após 3DS
- [x] Adicionar função updatePaytimeTransactionId no db.ts
- [x] Adicionar função getPaytimeTransactionByReferenceId no db.ts
- [x] Webhook: buscar transação por reference_id como fallback quando novo ID pós-3DS não é encontrado
- [x] Logs detalhados no fluxo 3DS (frontend + backend + sendAntifraudAuth)
- [x] Corrigir chamada getThumbUrl com 2 argumentos (aceita apenas 1)
- [x] Corrigir result.emv que pode ser undefined (usar ?? null)

## Bug: Pagamento cartão 3DS ainda trava em "Processando pagamento" após correções
- [x] Verificar logs do console do navegador — identificado: SDK PagSeguro usando SANDBOX em vez de PROD
- [x] Causa raiz: PAYTIME_BASE_URL é sandbox, mas frontend detectava domínio app.mindi.com.br como PROD
- [x] Correção: backend agora retorna sdkEnv (SANDBOX/PROD) baseado na PAYTIME_BASE_URL
- [x] Frontend usa sdkEnv do backend em vez de detectar pelo hostname
- [x] Melhorar tratamento de erro: quando SDK falha, mostrar erro claro ao usuário (não tentar fallback)
- [x] Adicionar endpoint getPaytimeEnv no router paytime
- [ ] Testar pagamento com cartão de teste no ambiente correto (SANDBOX)

## Correção payload 3DS - Invalid request parameters
- [x] Adicionar shippingAddress ao payload 3DS (faltava conforme doc Paytime)
- [x] Adicionar 3 tipos de telefone (MOBILE, HOME, BUSINESS) conforme doc Paytime
- [ ] Testar pagamento com cartão de teste no ambiente correto (SANDBOX)

## Correção 3DS - Dados do cliente no objeto card (orientação suporte Paytime)
- [ ] Consultar doc Paytime sobre dados do cliente no objeto card
- [ ] Adicionar dados do cliente (CPF/documento) no objeto card do payload 3DS
- [ ] Testar pagamento com cartão de teste

## Correção Pagamento Cartão Online (3DS) - Erro 403 Antifraud
- [x] Corrigir sendAntifraudAuth para usar sub_establishment_id do restaurante (erro 403 API000104)
- [x] Corrigir confirmAntifraud no router para buscar paytimeEstablishmentId e passá-lo ao sendAntifraudAuth
- [x] Corrigir checkPaymentStatus para passar sub_establishment_id ao getTransaction (polling)
- [x] Adicionar parâmetro establishmentId opcional à função getTransaction no serviço paytime

## Ajustes Pix QR Code
- [x] Esconder opção "Pix manual" quando Pix QR Code (online) estiver ativo
- [x] Mudar cor do Pix QR Code de verde para vermelho

## Modal Selecione seu Bairro
- [x] Abrir modal "Selecione seu Bairro" imediatamente ao selecionar Delivery quando taxa é por bairro

## Pix QR Code sem dropdown
- [x] Quando paytimeEnabled: mostrar "Pix QR Code" diretamente como opção principal sem dropdown (sem Pix manual, sem sub-opções)

## Bug modal bairro
- [x] Corrigir modal de bairro reaparecendo no checkout após já ter sido selecionado no modal inicial

- [x] Corrigir todos os erros de tipagem TypeScript restantes (14 erros em Relatorios, OnlinePaymentTab, Catalogo, Clientes, PublicMenu, AdminOrderLogs, auth.ts, rateLimiter.ts)
- [x] Alterar título da seção 'Pronto para vender em menos de 10 minutos' para estilo: label sem badge + título grande em 2 linhas com palavra destacada em vermelho
- [x] Alterar título da seção 'Fidelize clientes e aumente o ticket médio' para estilo: label sem badge + título grande em 2 linhas com palavra destacada em vermelho
- [x] Alterar título da seção 'Robô no WhatsApp que atende e vende por você' para estilo: label sem badge + título em 2 linhas com palavra em vermelho
- [x] Alterar título da seção 'Tudo que você precisa para gerenciar' para estilo: label sem badge + título em 2 linhas com palavra em vermelho
- [x] Tornar seção de planos da Landing Page dinâmica (buscar planos do banco de dados)
- [x] Adicionar o 4º card de plano que falta na seção de planos (Lite adicionado)
- [x] Qualquer alteração nos planos no admin deve refletir automaticamente na Landing Page (usa trpc.plans.getData)
- [x] Limitar lista de features do plano Essencial na Landing Page e adicionar 'Ver mais X recursos' expansível (somente no Essencial)
- [x] Remover seção 'Modelos de negócios que o Mindi fortalece' da Landing Page
- [x] Padronizar título da seção 'Clientes que vendem conosco' para estilo: label sem badge + título em 2 linhas com palavra em vermelho
- [x] Padronizar título da seção 'Dados que transformam decisões' para estilo: label sem badge + título em 2 linhas com palavra em vermelho
- [x] Padronizar título da seção 'Perguntas frequentes' para estilo: label sem badge + título em 2 linhas com palavra em vermelho
- [x] Padronizar título da seção 'Seu restaurante pode vender muito mais' para estilo: label sem badge + título em 2 linhas com palavra em vermelho
- [x] Alterar texto 'Ver mais X recursos' na seção de planos para cor preta com efeito shimmer
- [x] Tornar dots do carrossel da seção 'Seu cardápio moderno' clicáveis para navegar entre slides (já eram clicáveis)
- [x] Verificar e informar o tempo de transição entre slides do carrossel (alterado de 6s para 4s)
- [x] Corrigir efeito shimmer do 'Ver mais X recursos' para cor branca e direção da direita para a esquerda
- [x] Adicionar background de ícones de comida (mesmo do chat) na seção CTA Final até o footer, com transparência 88%

- [x] Desativar botão de Banking no OnlinePaymentTab para restaurantes não poderem clicar
- [x] Reativar botões de Banking/KYC/SubPaytime/Split no OnlinePaymentTab
- [x] Remover item 'Banking' do menu lateral (sidebar) para restaurantes
- [x] Reativar botões de Banking/KYC/SubPaytime/Split no OnlinePaymentTab
- [x] Conectar backend do saldo Paytime ao frontend do Banking (card Conta Digital)
- [x] Conectar card Lançamentos Futuros do Banking ao backend (API future_releases Paytime)
- [x] Conectar aba 'Meu estabelecimento' do Banking aos dados reais da Paytime
- [x] Mover card de Conta Bancária para abaixo do card de saldo no BankingHome
- [x] Mover card Conta Bancária para ao lado do card Lançamentos Futuros (35% largura, layout horizontal)
- [x] Conectar Extrato do Banking ao backend (API transactions Paytime)

## Bugs - Banking / Chat Icon
- [x] Esconder ícone de chat flutuante nas páginas Banking, PDV e Mesas
- [x] Conectar Extrato/Histórico/Últimas transações à API real da Paytime (getTransactions)
- [x] Card de Conta Bancária ao lado direito dos Lançamentos Futuros (35% largura)
- [x] Conectar dados do Estabelecimento à API real (getEstablishmentDetails)

## Bugs - Banking (estabelecimento 30001)
- [x] Conta bancária mostra "Conta bancária não configurada" — corrigido: dados extraídos dos gateways da API Paytime
- [x] Transações não aparecem — corrigido: removido parâmetro `sorters` que causava erro 500 na API Paytime

## Banking - Ajuste de Layout
- [x] Remover card "Conta bancária" da Home do Banking (manter apenas em "Meu estabelecimento")
- [x] Restaurar layout dos Lançamentos Futuros para largura total (sem grid 65%/35%)

## Bug - Histórico de Transações
- [x] Total recebido/enviado soma transações canceladas — corrigido: filtra canceled/cancelled/refunded
- [x] Aplicar estilo dos cards da Dashboard (barra colorida no topo, ícone, uppercase) aos 3 cards do Histórico de transações
- [x] Mudar cor do ícone Banking de vermelho para azul (igual Dashboard)
- [x] Card de Saldo Disponível deve ter mesma largura que card de Acesso Rápido (320px)

## Performance - Banking
- [x] Criar endpoint combinado getBankingDashboard (saldo + lançamentos futuros + transações em paralelo)
- [x] Adicionar staleTime/gcTime às queries tRPC do Banking para evitar refetches desnecessários
- [x] Usar endpoint combinado no BankingHome para reduzir de 3 chamadas sequenciais para 1

## Bugs - Histórico de Transações (Totais inconsistentes)
- [x] Cards de totais (Total Recebido/Enviado/Transações) mudam incorretamente ao trocar filtros de tipo
- [x] "Todos os tipos" mostra R$244, PIX mostra R$320 (mais que todos), Crédito mostra R$70 — valores inconsistentes
- [x] "Total Transações" mostra 0 em todos os filtros

## Redesign Visual - Banking
- [ ] Redesenhar visualmente a página Banking (apenas frontend, sem alterar backend)
- [ ] BankingHome: novo layout premium com card de saldo, lançamentos e transações
- [ ] BankingHistorico: novo visual para cards de totais e tabela
- [ ] BankingExtrato: novo visual para lista de movimentações
- [ ] BankingEstabelecimento: novo visual para dados da conta
- [x] Redesign v2: Card de saldo mais compacto (menos espaço vertical)
- [x] Redesign v2: Manter cards de acesso rápido (Histórico, Extrato, Pagar conta, Conta)
- [x] Redesign v2: Novo layout geral mais limpo e eficiente

## Card de Status Gateways (estilo Facesign)
- [x] Investigar API Paytime para dados de status de gateways (Venda Presencial, Online, Tap on Phone)
- [x] Criar card de status no BankingHome com identidade visual Mindi

## Sidebar Direita Fixa - Banking (estilo Facesign)
- [x] Criar sidebar direita fixa com nome do restaurante + email
- [x] Status do Banking (Habilitado/Não habilitado)
- [x] Saldo disponível com botão ocultar + Lançamentos futuros
- [x] Botão "Adicionar saldo" (visual, desabilitado)
- [x] Status: Venda Presencial, Venda Online, Tap on Phone

## Restaurar Card Últimas Transações
- [x] Restaurar card de Últimas Transações com estilo de tabela (TRANSAÇÃO, TIPO, DATA, STATUS, VALOR)

## Restaurar Histórico de Transações
- [x] Restaurar visual anterior da página BankingHistorico (cards de totais + tabela com filtros)

## Restaurar Extrato e Estabelecimento
- [x] Restaurar visual anterior da página BankingExtrato
- [x] Restaurar visual anterior da página BankingEstabelecimento

## Equipamentos - Banking (Paytime)
- [ ] Investigar API Paytime para endpoints de Equipamentos
- [ ] Criar função no paytime.ts para listar equipamentos do estabelecimento
- [ ] Criar endpoint tRPC para equipamentos
- [ ] Criar seção/página de Equipamentos no Banking
- [ ] Implementar ação de habilitar/desabilitar equipamento (se API permitir)

## Melhoria Visual - Banking Sidebar
- [x] Redesenhar card BankingSidebar com estilo Paytime adaptado à identidade Mindi
- [x] Adicionar header com gradiente e ícone colorido
- [x] Adicionar detalhe decorativo lateral
- [x] Botão "Adicionar saldo" com borda tracejada
- [x] Ícones nos serviços (Venda Presencial, Online, Tap on Phone)
- [x] Badges de status com cores da identidade Mindi (vermelho/primary)
- [x] Aplicar estilo visual do BankingSidebar nos cards de saldo/métricas da área principal do Banking
- [x] Redesenhar cards de Ações Rápidas com título "AÇÕES RÁPIDAS", ícones coloridos, chevron e branding Mindi
- [x] Padronizar containers de ícones do Banking para ficarem no mesmo estilo da Dashboard (mais arredondados, fundo suave, sem ring)
- [x] Padronizar card de Últimas Transações com o mesmo estilo do BankingSidebar (gradiente, detalhe lateral, ícone no padrão Dashboard)
- [x] Redesenhar página Pagar Conta com sidebar direita no estilo BankingSidebar (formulário + aviso)
- [x] Padronizar página Histórico de Transações com estilo BankingSidebar (gradiente, detalhe lateral, ícones Dashboard)
- [x] Padronizar página Extrato com estilo BankingSidebar (gradiente, detalhe lateral, ícones Dashboard)
- [x] Padronizar página Dados da Conta (Estabelecimento) com estilo BankingSidebar (gradiente, detalhe lateral, ícones Dashboard)
- [ ] Mover dados da conta bancária para o BankingSidebar (mesma linha do título Banking)
- [x] Adicionar dados da conta bancária ao getBankingDashboard (backend)
- [x] Conectar BankingSidebar aos dados reais da conta bancária (frontend)
- [x] Adicionar botão de copiar número da conta no BankingSidebar

## Substituição Card Conta Bancária por Gateways de Pagamento
- [x] Remover card de Conta Bancária da aba Dados da Conta (BankingEstabelecimento)
- [x] Adicionar card de Gateways de Pagamento no lugar do card removido

## Área PIX no Banking
- [x] Backend: endpoint listar transferências PIX (GET com filtro type=PIX)
- [x] Backend: endpoint detalhar transferência PIX
- [x] Backend: endpoint iniciar pagamento PIX (pix-init)
- [x] Backend: endpoint confirmar pagamento PIX (pix-confirm)
- [x] Frontend: aba Área PIX com lista de transferências PIX (busca, filtros, ordenação)
- [x] Frontend: modal/dialog detalhar transferência PIX
- [x] Frontend: modal/dialog Fazer PIX (chave ou copia-e-cola, fluxo 2 etapas)
- [x] Frontend: card de ação rápida "Área PIX" no BankingHome
- [x] Frontend: navegação para aba Área PIX no menu lateral do Banking

## Layout Área PIX unificado
- [x] Unificar aba Geral e Fazer PIX: transferências à esquerda, formulário Fazer PIX à direita
- [x] Remover abas separadas (Geral / Fazer PIX)

## Formatação automática campos PIX
- [x] Máscara CPF: 000.000.000-00
- [x] Máscara CNPJ: 00.000.000/0000-00
- [x] Máscara Telefone: 00 9 0000 0000
- [x] Sugestões de domínio e-mail ao digitar @

## Ajuste visual card Pagamento (Pagar Conta)
- [x] Aumentar card Pagamento em 45% (de 288px para 420px)
- [x] Adicionar divisória abaixo do título "Tipos aceitos"
- [x] Reduzir padding-top do título "Tipos aceitos" (estava muito abaixo)
- [x] Adicionar divisórias entre os itens (Boletos bancários, Contas de consumo, Tributos e taxas)
- [x] Espaçamento adequado entre título e itens

## Fechamento imediato ao desligar toggle do dia atual (Horários de Funcionamento)
- [x] Ao desligar toggle do dia atual nos horários de funcionamento, fechar a loja imediatamente
- [x] Adicionar tooltip informativo explicando a ação de fechamento imediato
- [x] Badge "Hoje" no dia atual para fácil identificação
- [x] Toast informativo quando loja é fechada imediatamente
- [x] Invalidação de cache e notificação SSE ao fechar imediatamente
- [x] Testes vitest para 3 cenários (fechar, não fechar dia diferente, não fechar já fechada)

## Botão Limpar Pedidos Completos - Badge + Pulse
- [x] Adicionar badge vermelho com contador de pedidos completos no ícone de limpar
- [x] Adicionar efeito pulse sutil quando há pedidos para limpar
- [x] Manter tooltip existente no hover

## Badges Banking - Ativo/Inativo com dot
- [x] Trocar "Habilitado/Não habilitado" por "Ativo/Inativo" em todos os badges
- [x] Reduzir tamanho dos badges (remover padding/background, usar texto inline)
- [x] Adicionar dot verde para Ativo e dot vermelho pulsando para Inativo
- [x] Aplicar mesmo padrão nos gateways de pagamento (PIX, Crédito, Débito)
- [x] Débito com dot âmbar pulsando "Em breve"

## Extrato Banking - Reverter visual da lista para modelo antigo
- [x] Verificar versões anteriores do visual da lista do Extrato
- [x] Aplicar o mesmo modelo visual usado nas Últimas transações (tabela com colunas Transação, Tipo, Data, Status, Valor)

## Melhorias no Extrato Bancário
- [x] Filtros por tipo de transação (PIX, Crédito, Débito, Estorno)
- [x] Filtros por status (Concluído, Pendente, Falhou, Cancelado)
- [x] Filtro por período (data início/fim)
- [x] Exportação do extrato em CSV (compatível com Excel)
- [x] Modal de detalhes ao clicar numa transação
- [x] Cards de resumo (Saldo, Total recebido, Total enviado, Total transações)
- [x] Botão Limpar filtros quando há filtros ativos

## Padronizar cards Histórico de transações
- [x] Trocar StatCards por cards estilo Banking (gradient + barra lateral + ícone) no Histórico

## Padronizar cards Extrato bancário
- [x] Trocar StatCards por cards estilo Banking (gradient + barra lateral + ícone) no Extrato

## Liquidações / Repasses no Banking
- [x] Estudar endpoints de liquidações na API Paytime
- [x] Implementar endpoint backend para listar liquidações
- [x] Criar aba/seção de Liquidações no Banking (cards resumo + tabela + filtros + exportação CSV)
- [x] Modal de detalhes da liquidação ao clicar (valor, status, transações, estabelecimento, planos, datas)

## Ajuste cards A receber e Transações no Banking
- [x] Adicionar divisória acima dos textos descritivos nos cards A receber e Transações
- [x] Centralizar valor no meio do card com mais espaçamento

## Ajuste Ações Rápidas e botão Últimas transações
- [x] Remover card Histórico das Ações Rápidas
- [x] Trocar botão "Ver todas" por "Histórico" com ícone History no card Últimas transações

## Gestão de Taxas e Tarifas no Banking
- [x] Estudar endpoints de taxas e planos comerciais na API Paytime
- [x] Implementar backend (endpoints de taxas e planos)
- [x] Implementar frontend (aba Taxas no Banking com cards, tabela de taxas, plano ativo)
- [x] Cards de resumo estilo Banking (Plano ativo, Taxa PIX, Taxa Débito, Taxa Crédito 1x)
- [x] Card Plano Comercial com taxas por bandeira (MASTERCARD, VISA, ELO, AMEX, HIPERCARD)
- [x] Card Tarifas Bancárias com tabela (PIX, TED, Boleto, PIX Dinâmico)
- [x] Exportação CSV das taxas e tarifas
- [x] Card Taxas nas Ações Rápidas do Banking Home

## Padronização botão Continuar no Enviar PIX
- [x] Ajustar estilo do botão "Continuar" no card Enviar PIX para seguir o visual padrão do Banking

## Esconder busca na topbar do Banking
- [x] Esconder campo de busca "Buscar produtos, pedidos, clientes..." na topbar quando na página /banking
- [x] Esconder botão de tempo médio de preparo na topbar quando na página /banking
- [x] Adicionar ícone, título e descrição do Banking na topbar onde ficava o campo de busca

## Bug Fix: Taxas de Crédito Parcelado não apareciam
- [x] Corrigir mapeamento taxas crédito parcelado (API retorna fees.credit["1x"] em vez de fees.credit_1)
- [x] Atualizar interface PlanFlag para estrutura real da API (credit como objeto aninhado)
- [x] Corrigir frontend: cards de resumo, tabela por bandeira e exportação CSV

## Card de Onboarding no Banking (Cadastro Paytime)
- [x] Verificar status do cadastro Paytime e exibir card de onboarding quando não completado
- [x] Card de onboarding com estilo visual do Banking (verde emerald, passos do processo)
- [x] Passos: Cadastro enviado, Aprovação, Banking ativado, Verificação KYC, SubPaytime ativado, Split configurado
- [x] Botão "Iniciar Cadastro" com estilo Banking
- [x] Esconder conteúdo do Banking quando cadastro não está completo
- [x] Mover fluxo de cadastro Paytime da aba Pagamento Online para o Banking
- [x] Remover aba Pagamento Online das Configurações (sidebar + seção)

## Ajustes no formulário de cadastro Banking
- [x] Mudar label CNPJ/CPF para apenas CNPJ
- [x] CNAE pré-preenchido com 5611201 e campo readonly/desabilitado
- [x] Nome Fantasia pré-preenchido com nome do restaurante e botão de editar

## Pré-preenchimento Email e Telefone no formulário de cadastro Banking
- [x] Email pré-preenchido com email do estabelecimento + botão de editar (lápis/check)
- [x] Telefone pré-preenchido com número do WhatsApp conectado + botão de editar (lápis/check)

## Bug Fix: Email não pré-preenchido no Banking Onboarding
- [x] Corrigir: email do establishment pode ser null/vazio, usar email do user como fallback

## Bug Fix: Login admin só funciona na segunda tentativa
- [x] Investigar e corrigir: /admin/login mostra "login realizado com sucesso" mas não redireciona, só loga na segunda tentativa

## Bug Fix: CPF e CNPJ enviados com formatação para a API Paytime
- [x] Remover formatação (pontos, traços, barras) do CPF e CNPJ antes de enviar para a API Paytime no submitOnboarding

## Botão Acessar Portal Paytime
- [x] Adicionar botão "Acessar Portal Paytime" na página de Banking para ECs com cadastro aprovado/habilitado

## Reposicionar botão Acessar Portal Paytime
- [x] Mover botão "Acessar Portal Paytime" da sidebar para a linha do título Banking (canto superior direito)

## Estilo do botão Acessar Portal Paytime
- [x] Ajustar botão para degradê vermelho (estilo card de saldo) e mesma altura do botão "Novo Cliente"

## Bug Fix: Botão Portal na tela de onboarding
- [x] Remover botão "Acessar Portal Paytime" da tela de onboarding (deve aparecer apenas quando Banking está ativo)

## Bug Fix: Erro BNK006000 na ativação do Banking (Gateway 6)
- [x] Adicionar `reference_id` ao body da chamada activatePaytimeGateway (campo obrigatório faltando)
- [x] Adicionar `statement_descriptor` ao body usando nome fantasia do estabelecimento (obrigatório quando form_receipt=PAYTIME)
- [x] Adicionar logs detalhados do `feesBankingId` para confirmar que está sendo obtido corretamente

## Bug Fix: listPaytimeFeesBankings retorna objeto paginado
- [x] Corrigir listPaytimeFeesBankings para tratar resposta paginada ({ data: [...] }) em vez de array direto
- [x] Acessar feesBankings.data[0].id em vez de feesBankings[0]._id

## Bug Fix: Gateway 6 já ativado causa erro 500
- [x] Detectar gateway já ativado antes de tentar ativar (consultar gateways existentes)
- [x] Tratar erro 500 com BNK006000 como "gateway já ativado" além do 409
- [x] Sincronizar estado local do banco quando gateway já existe na Paytime

## Fix: Segunda chamada para obter link KYC após ativação do Gateway 6
- [ ] Fazer segunda chamada POST na API Paytime para EC 157580 para obter link KYC
- [ ] Atualizar código activateBanking para fazer segunda chamada automaticamente após ativação
- [ ] Salvar link KYC no banco de dados local

## Fix: Segunda chamada automática para obter link KYC
- [x] Atualizar activateBanking para fazer segunda chamada após ativação do Gateway 6 para obter metadata.url_documents_copy
- [x] Adicionar fallback via GET no gateway se segunda chamada falhar

## UI Fix: Botão Portal de Gestão
- [x] Esconder botão "Portal de Gestão" até que todo o fluxo Paytime esteja completo (KYC aprovado, Gateway ativado, Split configurado)

## UI Fix: Mensagens de erro Paytime
- [x] Limpar mensagens de erro da Paytime para mostrar apenas a mensagem amigável sem stack trace

## Fix: Remover statement_descriptor do body do Gateway 6 (Banking)
- [x] Remover statement_descriptor do body enviado para Gateway 6 - campo é exclusivo do Gateway 4 (SubPaytime)
- [x] Atualizar testes para verificar que Gateway 6 NÃO inclui statement_descriptor
- [x] Adicionar teste para verificar que Gateway 4 INCLUI statement_descriptor
- [x] Corrigir erro TS awaiting_kyc → pending no paytimeKycStatus
- [x] Resetar EC 210001 no banco para testar fluxo completo

## Fix: Causa raiz do BNK006000 - revenue=0 e cnae=null
- [x] Investigação: EC 157547 (funciona) tem revenue=100000 e cnae=5611201, ECs que falham têm revenue=0 e cnae=null
- [x] Confirmação: Após atualizar EC 157585 com revenue=100000, Gateway 6 ativou com sucesso (HTTP 201)
- [x] Reforçar validação de revenue no zod: z.number().min(1) com mensagem clara
- [x] Reforçar fallback de revenue no payload: (revenue && revenue >= 1) ? revenue : 10000
- [x] Adicionar fallback de cnae no payload: formatCNAE(cnae) || "5611201"
- [x] Adicionar validação max(7) no cnae do zod
- [x] Adicionar testes para validação de revenue (0, undefined, null, negativo)
- [x] Adicionar testes para formatação de cnae
- [x] Todos os 25 testes do banking-activate-fix passam

## Bug: Pedido enviado ao restaurante antes da confirmação do pagamento
- [x] Investigar fluxo de criação de pedido com pagamento online (PIX/Cartão)
- [x] Proteger push notification no createPublicOrder com if(!isOnlinePayment)
- [x] Adicionar push notification à função triggerOnlinePaymentConfirmedNotifications no paytime.ts
- [x] Atualizar testes (33/33 passam)

## Fix: Filtrar transações por sub-estabelecimento na API Paytime
- [x] Corrigir getTransactions no server/paytime.ts para usar filters={"establishment.id": id} nos query params
- [x] Corrigir getTransactionsSummary com o mesmo filtro
- [x] Verificar outros endpoints (saldo, transferências, lançamentos futuros) - filtram corretamente pelo header
- [x] Atualizar testes (39/39 passam)

- [x] Remover código de split do completeSetup (markup do plano já cuida da receita)

- [x] Renomear toast "SubPaytime ativado" para texto amigável
- [x] Renomear botão "Ativar Gateway" para "Ativar Pagamento Online"
- [x] Remover step "Split configurado" e renomear botão final para "Finalizar"
- [x] Remover parcelamento cartão: fixar 1x à vista no frontend (texto fixo) e forçar installments:1 no backend
- [x] Implementar botão "Estornar pagamento" no modal de detalhes da transação no Banking
- [x] Configurar mindi.com.br para mostrar /landing na rota raiz

## Portal de Gestão - Domínio Personalizado
- [x] Alterar URL do botão Portal de Gestão de portal.paytime.com.br para gestao.mindi.com.br
- [ ] Aguardar Paytime ativar domínio personalizado gestao.mindi.com.br

## Pagamento Online Banking - Correções
- [x] Ativar paytimeEnabled, paytimeCardEnabled, onlinePaymentEnabled para estabelecimento 210007
- [x] Corrigir fluxo: completeSetup deve ativar onlinePaymentEnabled automaticamente
- [x] Corrigir fluxo: activateBanking deve ativar paytimeEnabled e paytimeCardEnabled quando banking já aprovado
- [x] Desabilitar botão de estorno para transações PIX no Banking (mostrar "Estorno PIX não disponível")

## Funcionalidades Paytime - Prioridade Alta
- [x] Exibir transação individual (GET /transactions/{id}) - Backend + Frontend
- [x] Simulação de valores de transação (POST /transactions/simulate) - Backend + Frontend
- [x] Extrato do estabelecimento (GET /banking/statements) - Backend + Frontend
- [x] Ajustar modal 'Como deseja receber?' no menu público para estilo compacto igual ao modal de bairro

- [x] Corrigir modal "Como deseja receber?" — restaurar ícones (Bike, Package, UtensilsCrossed), descrições e badge Grátis original, apenas diminuir tamanho dos ícones
- [x] Investigar scroll não natural (muito rápido) no modal de produto com complementos no menu público — removido efeito shrink da imagem, altura fixa
- [x] Mover simulador de taxas para sidebar na aba Taxas e Tarifas (botão ao lado do Exportar CSV)
- [x] Remover card Simulador da página Banking principal
- [x] Corrigir simulador de taxas para interpretar resposta real da API Paytime
- [x] Esconder parcelamento quando tipo é PIX (só mostrar para cartão de crédito)
- [x] Corrigir referência residual setModalImageShrink no PublicMenu
- [x] Melhorar nomes e descrições dos extratos (Extrato → Vendas/Cobranças, Extrato Bancário → Conta Banking) para ficar mais claro
- [x] Remover botão "Adicionar saldo" do Banking (não existe endpoint na API Paytime)
- [x] Implementar backend: consultBillet (consultar dados do boleto pelo código de barras) via API Paytime
- [x] Implementar backend: payBillet (realizar pagamento do boleto) via API Paytime
- [x] Implementar backend: listBilletPayments (listar pagamentos de boletos) via API Paytime
- [x] Criar procedures tRPC para pagamento de boletos
- [x] Conectar frontend BankingPagarConta às chamadas reais da API (remover dados mockados)
- [x] Investigar implementação de Liquidações/Repasses: verificar se dados são reais da API ou placeholder, validar prazos D+1 PIX e D+30 cartão conforme documentação Paytime
- [x] Migrar endpoint de liquidações de /extract (sumarizado) para /v1/marketplace/liquidations (completo) no backend
- [x] Ajustar frontend BankingLiquidacoes para exibir corretamente status, transações e histórico usando dados do endpoint completo
- [x] Diminuir a altura do Header do Bottom Sheet da Sacola de Compras (está desproporcional/muito alto)
- [x] Padronizar todos os headers vermelhos dos modais do menu público (Checkout, Cupom, Pedidos, Informações, Meus Pedidos, etc.) com altura de 67px
- [x] Plano Free na página /criar-conta não deve mostrar "Teste grátis" nem "15 dias de teste" (já é gratuito)
- [x] Recursos dos planos na página /criar-conta devem vir do banco de dados (admin planos) e aparecer lado a lado
- [x] Checks dos recursos dos planos devem ser estilo redondo vermelho (como no menu público)

- [x] Corrigir cor do radio button de seleção de plano (border-primary bg-primary → border-red-500 bg-red-500) para igualar aos checks vermelhos dos recursos
- [x] Adicionar subtítulo "Teste grátis por 15 dias" abaixo do preço nos planos pagos (Lite, Essencial, Pro) na página /criar-conta
- [x] Substituir card "Split Automático" por "Conta Digital" na página Banking (tela de onboarding)
- [x] Ocultar página de Clientes na sidebar para planos Free (trial) e Starter (lite)
- [x] Implementar exclusão completa de restaurantes no painel admin (/admin/restaurantes) — remover todos os dados do banco de dados
- [x] Adicionar botão de exclusão com dialog de confirmação na página de detalhe do restaurante (/admin/restaurantes/:id)
- [x] Bug fix: Garantir sincronização de deliveryAddress.neighborhood com selectedNeighborhood.name em todos os fluxos (checkout menu público)
- [x] Agrupar horários de funcionamento no modal de Informações — dias consecutivos com mesmo horário resumidos (ex: "Segunda a Sexta 18:30 às 23:45")
- [x] Corrigir ícone do Waze quebrado no modal "Como Chegar" do menu público
- [x] Alterar link "Ver planos e preços" na landing page para navegação instantânea (sem scroll suave) para a seção de planos
- [x] Botão "Teste Grátis | 15 dias" na landing page deve redirecionar para /criar-conta com plano Essencial pré-selecionado
- [x] Alterar texto "Fechado" para "Aberto" na seção "Dados que transformam decisões" da landing page (mockup do dashboard)
- [x] Remover sombras dos cards de perguntas frequentes (FAQ) na landing page
- [x] Alterar URL do botão Teste Grátis de ?plan=basic para ?plan=essencial (URL mais legível)
- [x] Alterar texto dos botões "Começar agora" para "15 Dias Grátis" nos planos pagos (Starter, Essencial, Pro) na seção de preços da landing page
- [x] Bug: Página /planos — Free mostra "Plano Atual" quando o plano atual é Essencial
- [x] Bug: Página /planos — Pro mostra badge "Em breve" e botão "Em breve" incorretamente
- [x] Bug: Página /planos — Botões mostram nomes de planos errados (ex: Starter mostra "Assinar Lite")
- [x] Reorganizar layout Banking: mover 3 cards (PIX Online, Cartão de Crédito, Conta Digital) para vertical ao lado direito dos cards Ativar Pagamento e Progresso da Ativação
- [x] Adicionar 2 novos cards informativos (Pagar Contas e Área PIX) na coluna direita da página Banking
- [x] Reduzir tamanho do título "Ativar Pagamento Online" no card da página Banking
- [x] Trocar badge Inativo/Ativo por dot + texto (estilo padronizado igual ao da página banking ativo)
- [x] Padronizar ícone do card Ativar Pagamento Online para mesmo estilo/tamanho dos cards da coluna direita (PIX Online, etc.)
- [x] Adicionar descrição abaixo do título "Progresso da Ativação" no card da página Banking
- [x] Remover botão "Preencher" do card "Dados da Empresa" na página Banking (era para testes dev)
- [x] Limpar código morto: remover funções autoFillStep1/2/3, autoFillAll, geradores CNPJ/CPF, isDev e AutoFillBtn do Banking.tsx
- [x] Adicionar carrossel Fade Crossfade com auto-play nas fotos do modal de detalhes do produto no menu público
- [x] Remover setas de navegação do modal de detalhes do produto (manter apenas na visualização fullscreen)
- [x] Limitar sugestões a no máximo 9 produtos por categoria no catálogo (frontend e backend)
- [x] Bug: "No procedure found on path category.toggleUpsell" ao tentar marcar categoria como sugestão no catálogo (resolvido com restart do servidor)
- [x] Alterar lógica de sugestões: ao marcar categoria com mais de 9 produtos, marcar automaticamente apenas os primeiros 9 como sugestão (em vez de bloquear)
- [x] Criar página de Sugestões (frontend mockup) com aba "Sempre sugerir" e aba "Sugestões vinculadas"
- [x] Adicionar rota /sugestoes e item na sidebar do menu
- [x] Aba "Sempre sugerir": lista unificada de itens/categorias marcados como sugestão, com tag, ações e modal de adicionar
- [x] Aba "Sugestões vinculadas": tabela gatilho → sugeridos com modal de criação e edição inline
- [ ] Badge visual (estrela) nos produtos/categorias marcados como sugestão no catálogo admin
- [x] Adicionar card "Receita gerada" com dados mockados na página de Sugestões (R$ 2.840, +18% vs mês anterior)
- [x] Implementar regras de horário nas sugestões (frontend mockup) — dias da semana e faixas de horário por sugestão
- [x] Backend: Criar tabela fixed_suggestions no schema (tipo, referência a produto/categoria, schedule, isActive, sortOrder)
- [x] Backend: Criar helpers de banco para sugestões fixas (listar, adicionar, remover, toggle, reordenar, atualizar schedule)
- [x] Backend: Criar procedures tRPC para CRUD de sugestões fixas
- [x] Frontend: Conectar aba "Sempre sugerir" aos dados reais (remover mocks)
- [x] Backend: Criar tabela linked_suggestions no schema (gatilho → sugeridos, schedule, isActive)
- [x] Backend: Criar helpers de banco para sugestões vinculadas (listar, adicionar, remover, toggle, atualizar schedule)
- [x] Backend: Criar procedures tRPC para CRUD de sugestões vinculadas
- [x] Frontend: Conectar aba "Sugestões vinculadas" aos dados reais (remover mocks)
- [x] Alterar checkout para buscar sugestões da tabela fixed_suggestions (e linked_suggestions) em vez de isUpsell/isUpsellPinned
- [x] Remover opções "Usar como sugestão" e "Fixar como sugestão" do menu de 3 pontinhos no catálogo
- [x] Bug: Campo de busca do modal "Nova sugestão vinculada" ultrapassa os limites do modal (overflow)
- [x] Bug: Sugestões vinculadas não aparecem no checkout quando produto gatilho está no carrinho (corrigido: item.productId → item.suggestedProductId e isScheduleActive → isScheduleActiveFromRow com campos separados)
- [x] Copiar estilo visual dos cards da dashboard para os cards da página de sugestões (mesmo modelo com barra colorida no topo, ícone, bolinha de status)
- [x] Converter modal "Adicionar sugestão fixa" para Sheet (sidebar lateral direita) no mesmo estilo da sidebar "Dados da Entrega" do PDV
- [x] Converter modal "Criar sugestão vinculada" para Sheet lateral direita no estilo do PDV
- [x] Converter modal "Editar sugestão vinculada" para Sheet lateral direita no estilo do PDV
- [x] Converter modal "Regra de horário" para Sheet lateral direita no estilo do PDV
- [x] Esconder botão X de fechar nas sidebars de sugestões no desktop (manter apenas no mobile)
- [x] Alterar botões "Item específico" e "Categoria inteira" da sidebar de sugestão fixa para o mesmo estilo dos botões de pagamento/entrega do PDV
- [x] Bug: Página de Estoque usa dados mockados (stockItems/stockCategories) em vez dos produtos reais do catálogo
- [x] Refazer página de Estoque para usar products.hasStock e products.stockQuantity do catálogo
- [x] Remover sistema separado de stockItems/stockCategories (dados mockados)
- [x] Bug: Cards da página de Estoque com borda cinza quando não selecionados — deve mostrar borda colorida sempre como na Dashboard
- [x] Alterar card "Como funciona o controle de estoque" para o estilo do card "Ative o Cashback" da página de Clientes e mover para acima da lista de produtos
- [x] Bug: Estabelecimento 30001 mostra itens fictícios/mockados na página de Estoque — apenas SASHIMI DE SALMÃO é real, remover dados falsos
- [x] Remover botão "Ir para Catálogo" do cabeçalho da página de Estoque
- [x] Alterar seção "Que tal adicionar?" no Resumo do Pedido do menu público para exibição em lista em vez de cards com imagens
- [x] Bug: Erro "No procedure found on path stock.updateQuantity" ao tentar editar estoque na página de Estoque (corrigido com restart do servidor + publish)
- [x] Cards "Que tal adicionar?" no Resumo do Pedido: remover sombra e reduzir tamanho em 10%
- [x] Cards "Que tal adicionar?": mover preço para ao lado esquerdo do botão "+" para ganhar espaço
- [x] Cards "Que tal adicionar?": reduzir foto do item sugerido em mais 5% (w-10→w-9)
- [x] Adicionar valor total do pedido no botão "Enviar pedido" na tela de Confirmação do menu público
- [x] Mover botão de voltar do cabeçalho do modal de pedido para ao lado esquerdo do botão Próximo (outline branco, ~10% largura, apenas setinha)
- [x] Botão de voltar no modal de pedido: alterar para 15% da largura e bordas vermelhas (em vez de cinza)
- [x] Adicionar dois banners informativos com scroll automático e dots na página de Sugestões (sugestões fixas e vinculadas)
- [x] Adicionar ícone (i) com tooltip no card "Máx. exibidos" da página de Sugestões (mesmo estilo do card "Receita gerada")
- [x] Conectar card "Receita gerada" ao backend com dados reais dos últimos 30 dias (receita de produtos vendidos via sugestões)
- [x] Mover banners informativos (Sugestões Fixas e Vinculadas) para abaixo dos 4 cards de métricas na página de Sugestões
- [x] Adicionar botão X para fechar os banners informativos (persistir no localStorage)
- [x] Alterar tempo de scroll automático dos banners de 7s para 8s
- [x] Criar tabela user_preferences no schema (chave-valor genérica)
- [x] Criar helpers de DB para get/set preferências
- [x] Criar endpoints tRPC para preferences (get, set, getBatch)
- [x] Criar hook usePreference no frontend
- [x] Migrar onboarding_modal_dismissed_{id}_{status} (Pedidos) para banco
- [x] Migrar onboarding_modal_dismissed_{id}_multi_driver (Entregadores) para banco
- [x] Migrar abcInfoSeen (Relatórios - Curva ABC) para banco
- [x] Migrar dreInfoSeen (Relatórios - DRE) para banco
- [x] Migrar welcome_checklist_dismissed_{id} (Checklist boas-vindas) para banco
- [x] Migrar onboarding_auto_opened_{id} (Auto-abertura onboarding FAB) para banco
- [x] Migrar mindi_chat_highlight_seen (Highlight chat WhatsApp) para banco
- [x] Adicionar barrinha vermelha lateral na modalidade de entrega no modal Resumo do Pedido (menu público)
- [x] Adicionar barrinha vermelha lateral na forma de pagamento no modal Resumo do Pedido (menu público)
- [x] Ícone dinâmico de entrega: Retirada=loja, Consumo=garfo/faca, Entrega=bike
- [x] Ícone dinâmico de pagamento: Pix=QR Code, Dinheiro=notas, Cartão=cartão, etc.
- [x] Bug: "Minha localização" no modal de endereço mostra "Localização indisponível no momento" mesmo com permissão concedida (adicionado fallback low accuracy)
- [x] Adicionar badge "Novo" vermelho ao lado do item Sugestões no menu lateral (sidebar)
- [x] Adicionar efeito shimmer no badge "Novo" do item Sugestões no menu lateral
- [x] Badge "Novo" do Sugestões deve desaparecer ao clicar no menu (salvar preferência no banco via usePreference)
- [x] Alterar empty state das sugestões (fixas e vinculadas) para estilo da página de avaliações (sem card, ícone maior, título/descrição maiores)
- [x] Mudar cor do dia atual (Hoje) no heatmap de Acessos ao Cardápio de vermelho para verde (mesma cor do gráfico Acumulado da semana)
- [x] Bug: Card de taxa de entrega na versão desktop (sidebar direita) do menu público com layout quebrado — 2 botões ("Grátis" e "Selecionar") causando quebra visual
- [x] Alterar texto do card "Máx. exibidos" de "9 por sessão" para "9 Itens" na página de Sugestões
- [x] Adicionar card de Ticket Médio na página de Sugestões (reaproveitando dados da Dashboard) ao lado do card de Receita Gerada
- [x] Corrigir 3 erros TypeScript TS2802 (Set iteration) em server/db.ts — convertidos para Array.from()
- [x] Limitar exibição de sugestões no modal Resumo do Pedido a no máximo 5 visíveis, demais acessíveis por rolagem
- [x] Adicionar indicador visual fade/gradiente no final da lista de sugestões do modal Resumo do Pedido quando há mais itens para rolar
- [x] Alterar cor do gradiente fade das sugestões no modal Resumo do Pedido de cinza para vermelho
- [x] Bug: Sugestões com complementos no modal Resumo do Pedido devem abrir modal de detalhes do produto em vez de adicionar direto ao carrinho
- [x] Bug: Modal de detalhes do item abre atrás do modal de Resumo do Pedido — corrigir z-index
- [x] Lógica condicional: abrir modal de detalhes só se produto tem complementos, senão adicionar direto ao carrinho
- [x] Bug: Imagem do changelog gerada na vertical e com textos — corrigir para horizontal (landscape) e sem textos
- [x] Bug: Modal de nova entrada do changelog sem scroll — botões ficam fora da tela quando texto é grande
- [x] Adicionar background da seção "Seu restaurante pode vender muito mais" da landing page ao menu público
- [x] Bug: Cards dos itens do menu público com fundo transparente — devem ter fundo branco para não mostrar o background de ícones
- [x] Padronizar card da página de Fidelização para ficar igual ao estilo da página de Sugestões (fundo na cor do background, sem card branco destacado)
- [x] Implementar login social com Google para donos de restaurante (admin)
  - [x] Configurar secrets GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET
  - [x] Criar rotas backend /api/auth/google e /api/auth/google/callback
  - [x] Adicionar campo googleId na tabela users
  - [x] Criar funções getUserByGoogleId, createUserWithGoogle, linkGoogleId no db.ts
  - [x] Adicionar botão "Entrar com Google" na página de Login
  - [x] Adicionar botão "Registrar com Google" na página de Registro
  - [x] Vincular conta Google a conta existente se email já existir
- [x] Vincular/Desvincular Google nas Configurações da conta
  - [x] Expor googleId no auth.me para o frontend saber se está vinculado
  - [x] Criar procedure tRPC para desvincular Google (remover googleId)
  - [x] Criar rota para vincular Google (link mode no OAuth)
  - [x] Seção "Contas conectadas" na página de Configurações (conta e segurança)
  - [x] Botão "Conectar conta Google" se não vinculado
  - [x] Card com email Google + badge "Conectado" + botão "Desconectar" se vinculado
  - [x] Bloquear desconexão se não tiver senha cadastrada
- [x] Indicador visual no perfil do usuário mostrando conexão com Google
  - [x] Ícone do Google ao lado do email no menu do usuário (canto superior direito)
- [x] Ocultar ícone de chat flutuante nas páginas de Configurações (conta e segurança, impressora e teste, atendimento, estabelecimento)
- [x] Bug: Desktop - ao clicar num item pela primeira vez (sem entrega selecionada), modal de detalhes e modal de bairro abrem juntos. Correto: só abrir modal de bairro, fechar, e só depois ao clicar novamente abrir detalhes do item
- [x] Reformatar banner "Como funciona" na página de Complementos: mesmo estilo do banner "Sugestões Fixas", mostrar 2 primeiros textos + botão "Ver mais" em vermelho para expandir
- [x] Bug: Erro ao autenticar com Google quando usuário não tem conta existente — deveria criar conta nova mas dá erro "Erro ao autenticar com Google"
- [x] Bug: Após login com Google e clicar Continuar, redireciona para landing page em vez de dashboard/onboarding

- [x] Bug fix: Banner "Falta R$ X para entrega grátis" aparecia em Retirada/Consumo no local — agora só aparece em Delivery
- [x] Fix: Erro TypeScript na prop 'title' do SVG no AdminLayout.tsx (substituído por aria-label)
- [x] Card de taxa no sidebar desktop: mostrar "Grátis" quando Retirada/Consumo no local (em vez de esconder o card)
- [x] Banner "Entrega grátis desbloqueada" deve aparecer SOMENTE em Delivery (já corrigido anteriormente)
- [x] Alterar cores do card de retirada/consumo no local de verde para vermelho (mesmo padrão do delivery)
- [x] Bug: Fechar checklist "Bem-vindo ao Mindi" com X não persiste no banco — comportamento mantido (X só minimiza, dismiss permanente ao completar etapas core)
- [x] Bug: Checklist "Bem-vindo ao Mindi" reaparece porque som desativado e WhatsApp desconectado resetam etapas — deve salvar dismiss permanente no banco quando todas etapas foram completadas ao menos uma vez
- [x] Verificar/corrigir highlight do Chat WhatsApp: tabela user_preferences não existia no banco — criada manualmente. Código já estava correto usando usePreference
- [x] Verificar/corrigir modais de pedido (Preparo, Pronto, Finalizado): já usam usePreference — funcionam agora que tabela existe
- [x] Fix: Highlight do chat WhatsApp aparecia em aba anônima antes da query do banco retornar (adicionado check de isLoading)
- [x] Diminuir opacidade do background de ícones de comida no menu público de 25% para 22%
- [x] Corrigir responsividade mobile do fluxo de onboarding (criar conta) — textos pequenos misturados com grandes, layout inconsistente com tela de login
- [x] Corrigir responsividade dos 5 cards KPI na Dashboard para telas desktop pequenas (textos cortados, layout bagunçado)
- [x] Corrigir responsividade do card de Pedidos Recentes na Dashboard para telas desktop pequenas (coluna VALOR cortada)
- [x] Remover badge "Breve" / disabled do item Integrações nas configurações (SettingsSidebar)
- [x] Criar card de integração Telegram (apenas frontend) na aba de Integrações, abaixo do iFood, com fluxo conectar/desconectar

## Integração Telegram Bot — Notificações de Pedidos
- [x] Salvar TELEGRAM_BOT_TOKEN como secret
- [x] Adicionar campos telegram no schema do banco (telegramEnabled + telegramChatId em establishments)
- [x] Criar db helpers para telegramConfig (get, save, delete)
- [x] Criar server/telegramNotifier.ts (sendMessage, formatOrderMessage)
- [x] Criar routers tRPC para configuração Telegram (get, save, test, disconnect)
- [x] Conectar card frontend IntegrationsTab ao backend real
- [x] Integrar notificação Telegram no createPublicOrder (fire-and-forget)
- [x] Integrar notificação Telegram no botApiRouter (pedidos via WhatsApp)
- [x] Integrar notificação Telegram no iFood (createOrderFromIfood)
- [ ] Testes vitest para telegramNotifier
- [x] Bug: Link do bot Telegram no card de Integrações estava errado (MindiBotPedidos → Mindi_pedidos_bot)
- [x] Bot Telegram não responde ao /start — implementar webhook handler para responder com chat_id
- [x] Card Acessos ao Cardápio: trocar labels dias da semana para letra inicial (D S T Q Q S S) e aumentar tamanho em 2%
- [x] Card Acessos ao Cardápio: adicionar 3 abas (Dia, Dia e hora, Hora) com gráficos de barras
- [x] Card Acumulado da semana: nomes dos dias completos em telas largas, 3 letras em telas menores, aumentar tamanho do texto
- [x] Bug: Push Notification (PWA) não exibe notificação — tabela pushSubscriptions vazia, implementar auto-registro de subscription no AdminLayout
- [x] Migrar envio de emails do Mandrill para Resend (noreply@mindi.com.br)
- [x] Configurar secrets RESEND_API_KEY e RESEND_FROM_EMAIL
- [x] Instalar pacote resend e criar módulo de email
- [x] Substituir todas as chamadas Mandrill por Resend
- [x] Renomear mandrill.ts para email.ts e atualizar todos os imports
- [x] Ajustar empty states de Catálogo (categorias) e Complementos para estilo da página de Sugestões (sem container branco, apenas ícone + texto sobre background)
- [x] Padronizar empty state da página de Estoque no mesmo estilo da página de Sugestões (sem container branco)
- [x] Em telas desktop pequenas, mudar automaticamente Kanban para Lista na página de Pedidos (respeitar seleção manual do usuário, sem alterar mobile)
- [x] Ajustar card Chave Pix em Configurações > Atendimento: título "Pix estático — sem taxas", descrição, texto auxiliar e caixa de Importante
- [x] Ajustar foto de capa no Preview do Perfil Público para ter cantos arredondados iguais ao menu público
- [x] Reproduzir layout visual mobile do menu público no card de Preview do Perfil Público em Configurações > Estabelecimento
- [x] Corrigir layout do Preview do Perfil Público para ficar pixel-perfect igual ao mobile real (screenshots do usuário): capa ocupa largura total sem padding lateral, logo maior sobrepondo capa à esquerda, badge vermelho no canto inferior direito da capa, card branco de info separado abaixo
- [x] Corrigir cor de fundo do Preview do Perfil Público: usar o mesmo background do menu público real em vez do bege/amarelado atual
- [x] Aumentar espaço entre a capa/logo e o card branco de informações no Preview do Perfil Público
- [x] Mover badge de Delivery e Retirada mais para a esquerda no Preview para que a lateral direita fique cortada/escondida igual ao menu público
- [x] Trocar ordem dos cards em Configurações > Estabelecimento: Nota do Restaurante sobe para o lugar do Endereço, e Endereço desce para onde estava a Nota
- [x] Corrigir badge de Delivery: aumentar marginRight negativo de -14px para -32px para que a lateral direita fique cortada pelo overflow-hidden
- [x] Simplificar badge de Delivery no Preview: mostrar apenas o tipo de entrega (Delivery e Retirada), remover tempo de entrega e pedido mínimo para ficar mais compacto
- [x] Simplificar badge de Delivery no Preview: mostrar apenas tipo de entrega, remover tempo e pedido mínimo
- [x] Simplificar badge de Delivery no Preview: mostrar apenas tipo de entrega, remover tempo e pedido mínimo
- [x] Corrigir posição do badge de Delivery: mover para a esquerda com marginRight positivo (16px) em vez de negativo
- [x] Corrigir dropdown de Redes Sociais: ícones ficam cortados/escondidos atrás do container de categorias no PublicMenu e no Preview em Configurações
- [x] Mover botão Remover Nota para ao lado direito do campo de texto da nota, mostrando apenas o ícone da lixeira (sem texto)
- [x] Remover label 'Nota do Restaurante (opcional)' com ícone de mensagem do card de Nota, pois o título do card já informa
- [x] Unificar os 3 cards de integração iFood (status, Como conectar, Conectar loja) em um único card em Configurações > Integrações
- [x] Adicionar efeito de borda ondulada (wave) na parte inferior do card de métricas (+900, 27%, etc.) na landing page
- [x] Bug: Item Costela com estoque 7 aparece como Indisponível no menu público (estabelecimento 210016) — corrigido sincronização entre products.stockQuantity e stockItems.currentQuantity
- [x] Corrigir fundo branco abaixo do wave na seção de métricas: deve ter a mesma cor da seção "Dados que transformam decisões"
- [x] Substituir efeito wave por efeito de toldo de restaurante — revertido para wave original a pedido do usuário
- [x] Remover dots coloridos ao lado dos números nos cards KPI da Dashboard
- [x] Colocar os 5 cards KPI da Dashboard em uma única linha horizontal no desktop (remover breakpoint intermediário 3+2)
- [x] Auto-minimizar sidebar em telas ~1200px ou menores para dar mais espaço ao conteúdo
- [ ] Remover centavos dos valores monetários nos cards KPI da Dashboard (ex: R$ 3.005,25 → R$ 3.005)
- [x] Auto-minimizar sidebar em telas ~1200px ou menores para dar mais espaço ao conteúdo
- [x] Remover centavos dos valores monetários nos cards KPI somente em telas menores (~1200px), manter centavos em telas maiores
- [x] Adicionar efeito de balanço (swing) no ícone de presente do programa de Fidelidade no menu público
- [x] Carimbo de fidelidade só para clientes cadastrados (não criar cartão automaticamente ao completar pedido)
- [x] Métricas de fidelidade (Clientes Fidelizados e Histórico de Fidelização) devem mostrar apenas clientes com cadastro real (senha definida)
- [x] Adicionar campo registeredByCustomer (boolean) na tabela loyaltyCards para distinguir cadastros reais de automáticos
- [x] Excluir os 131 cartões criados automaticamente do estabelecimento 210006 (manter apenas os 8 com cadastro real)
- [x] Atualizar filtros de métricas de fidelidade para usar registeredByCustomer em vez de password4Hash
- [x] Atualizar lógica de cadastro no menu público para marcar registeredByCustomer = true
- [x] Limpar cartões de fidelidade automáticos de TODOS os estabelecimentos (não só 210006) e marcar os reais como registeredByCustomer
- [x] Corrigir 5 erros de TypeScript que podem impedir publicação
- [x] Substituir dropdown 'Redes Sociais' no menu público por ícones diretos de WhatsApp e Instagram (sem dropdown)

## Cor do Botão Fidelidade no Menu Público
- [x] Alterar cor do ícone e texto "Fidelidade" na barra de navegação desktop de emerald para red-500
- [x] Alterar cor do ícone e fundo "Fidelidade" no menu lateral mobile de emerald para red-500
- [x] Alterar cor do ícone no header do modal de Fidelidade de emerald para red-500

## Correções na Página de Estoque
- [x] Corrigir preços dos itens do estoque para corresponder aos preços do catálogo
- [x] Adicionar paginação na página de Estoque (máximo 25 itens por página, estilo da página de Clientes)
- [x] Bug: lista de itens do estoque não aparece (retorno do backend mudou de array para objeto paginado mas o summary usa endpoint separado)
- [ ] Bug: busca do estoque deve pesquisar em todos os produtos (server-side), não apenas na página atual

## Configuração de Regras de Estoque Mínimo
- [x] Adicionar campos stockLowThreshold, stockCriticalThreshold, stockOutThreshold na tabela establishments
- [x] Criar endpoints backend para ler/salvar thresholds de estoque
- [x] Atualizar lógica de cálculo de status do estoque para usar thresholds personalizados
- [x] Adicionar botão de config (estilo Mapa de Mesas) ao lado do filtro de categorias
- [x] Implementar dialog de configuração com campos numéricos e validação
- [x] Alterar cor do texto "Cadastre-se agora" no modal de Cartão Fidelidade de verde para vermelho
- [x] Bug: menu lateral mobile abre minimizado, deveria abrir maximizado (expandido)
- [x] Padronizar empty state da página de Cupons para ficar igual ao da página de Sugestões Fixas (sem container branco, mesmos tamanhos)

## Migração de Produtos - Monte seu Açaí (Estabelecimento 210018)
- [x] Extrair dados da categoria Monte seu Açaí do menu antigo (menu.mindi.com.br)
- [x] Mapear campos do menu antigo para o schema atual
- [x] Migrar produtos com fotos salvas no S3
- [x] Migrar complementos com regras corretas de obrigatoriedade
- [x] Verificar dados migrados

## Bug: Scroll bloqueado + Tooltip bairros não configurados
- [x] Bug: scroll da página fica bloqueado quando dropdown de bairro está aberto sem bairros cadastrados
- [x] Melhoria: ao clicar em Avançar com taxa por bairro sem bairros cadastrados, mostrar tooltip informando que o estabelecimento não configurou bairros
## Auto-focus nos campos de Horário de Funcionamento
- [x] Ao completar digitação de horário (4 dígitos, ex: 2200 → 22:00), cursor deve pular automaticamente para o próximo campo de horário
- [x] Funcionar para todos os dias da semana (abertura → fechamento → próximo dia abertura)
## Máscara de moeda no campo Pedido Mínimo
- [x] Campo de Pedido Mínimo deve formatar automaticamente com vírgula (ex: 1600 → 16,00)
## Bug: Tooltips de bairro aparecem nos dois botões ao mesmo tempo
- [x] Tooltip deve aparecer apenas no botão clicado (Selecionar OU Avançar), não nos dois simultaneamente
## Migração de categorias do menu antigo para 210018
- [x] Migrar categoria: Promoção do Dia
- [x] Migrar categoria: Milk Shake
- [x] Migrar categoria: Açaí Zero
- [x] Migrar categoria: Caixa de Açaí
- [x] Salvar fotos dos produtos no S3 (não URLs externas)
- [x] Configurar complementos com regras corretas (opcional vs obrigatório)
## Migração de categorias: Refrigerantes e Sorvetes Idayo
- [x] Migrar categoria: Refrigerantes
- [x] Migrar categoria: Sorvetes Idayo
- [x] Salvar fotos dos produtos no S3
- [x] Configurar complementos com regras corretas (sem complementos nestas categorias)
## Correção de créditos Mindi Vision
- [x] Garantir default 0 no schema para aiImageCredits
- [x] Manter 4 créditos grátis via grantFreeAiCredits (elegibilidade)
- [x] Corrigir saldo de todos os estabelecimentos afetados (remover os 15 extras)
- [x] Atualizar testes para refletir valores corretos (4 créditos grátis, preços reais)
## Migração Paytime para Produção (Homologação aprovada)
- [x] Atualizar PAYTIME_BASE_URL para https://api.paytime.com.br
- [x] Atualizar PAYTIME_INTEGRATION_KEY para chave de produção
- [x] Atualizar PAYTIME_AUTHENTICATION_KEY para chave de produção
- [x] Atualizar PAYTIME_X_TOKEN para token de produção
- [x] Atualizar PAYTIME_ESTABLISHMENT_ID para 358314 (produção)
- [x] Teste de autenticação na API de produção passou com sucesso
## Seletor de cor do background do menu público
- [x] Adicionar campo menuBackgroundHue no schema do estabelecimento
- [x] Criar seletor de cor em Configurações > Estabelecimento (abaixo do card de nota)
- [x] Aplicar filtro CSS hue-rotate no background do menu público baseado na cor escolhida
- [x] Cor padrão: vermelho (atual)
## Cor do Background do Menu Público (simplificado)
- [x] Simplificar card para apenas 2 opções: Vermelho (padrão) e Roxo/Açaí
- [x] Mudar título do card para "Cor do Background"
- [x] Remover pré-visualização de botão e todas as cores extras
- [x] Gerar imagem de background na cor roxa/açaí
- [x] Aplicar seleção apenas na imagem de fundo do menu público (não nos botões/elementos)
- [x] Reverter mudanças de hue-rotate que afetavam todo o menu
- [x] Configurar storage proxy para servir imagens /manus-storage/ no projeto
## Padronizar botões do card Cor do Background
- [x] Alterar botões de seleção do card "Cor do Background" para o mesmo estilo visual do card "Nota do Restaurante" (retângulos arredondados com gradiente, não círculos)
## Preview do Perfil Público reage à cor do background
- [x] Ao mudar a seleção de cor no card "Cor do Background", o background de ícones do card "Preview do Perfil Público" deve trocar em tempo real (vermelho ou roxo)
## Cores sólidas no card Cor do Background
- [x] Trocar gradientes por cores sólidas nos botões do card "Cor do Background" (degradê é só no card Nota do Restaurante)
## Cadastro de bairros e taxas de entrega - Estabelecimento 210018
- [x] Extrair lista de bairros e taxas do portal antigo (portal.mindi.com.br) — 79 bairros extraídos
- [x] Cadastrar bairros e taxas no estabelecimento 210018 no novo sistema — 78 bairros inseridos (1 duplicado Marta Helena removido)
## Bug: Cor do Background Açaí não funciona
- [x] Corrigir: ao selecionar cor Açaí, o background do Preview do Perfil Público e do menu público não muda (continua vermelho) — resolvido após restart do servidor
## Badge Grátis no modal de seleção de bairro
- [x] Bairros com taxa R$ 0,00 devem mostrar badge "Grátis" vermelho (mesmo estilo do badge verde dos complementos, mas em vermelho) em vez de "R$ 0,00"
## Bug: Cor do background não funciona em produção
- [x] Corrigir: troca de cor do background funciona em dev mas não na versão publicada — URLs trocadas para CloudFront público direto
## Bug: Cor do background não funciona em produção
- [x] Corrigir: troca de cor do background funciona em dev mas não na versão publicada — storageProxy alterado para servir imagem diretamente (pipe) em vez de redirect 307 com URL assinada que expirava
## Limpeza do storageProxy
- [x] Remover storageProxy.ts e sua referência no index.ts (não é mais necessário para imagens de background)
## Bug: Scroll reset ao fechar modal no menu público
- [x] Corrigir: ao fechar o modal de detalhes do item, a página rola para o topo em vez de manter a posição de scroll — trocado dataset/cleanup por useRef estável
## Animação de transição no modal de produto
- [x] Adicionar animação slide-up ao abrir e slide-down ao fechar o modal de detalhes do produto no menu público
## Bug: Lista de itens pisca ao fechar modal
- [x] Corrigir: ao fechar o modal de detalhes do item, a lista de itens pisca/flasha brevemente — trocado position:fixed por overflow:hidden simples (sem reflow)
## Webhook Paytime - Notificação automática de aprovação de cadastro
- [x] Criar endpoint POST /api/paytime/webhook para receber webhooks da Paytime (já existia, melhorado)
- [x] Processar evento updated-establishment-status para atualizar status do estabelecimento no banco
- [x] Processar evento updated-establishment-gateway para atualizar status do gateway
- [x] Registrar webhooks na API da Paytime via código (updated-establishment-status e updated-establishment-gateway)
- [x] Enviar notificação ao dono do restaurante (email, push, telegram) quando cadastro for aprovado/rejeitado
- [x] Templates de email para aprovação e rejeição de cadastro Paytime
- [x] Endpoint tRPC para registrar e listar webhooks na Paytime
- [ ] Atualizar a tela de Banking para refletir mudanças automáticas de status
## Correção: Remover menções à Paytime nos templates de email
- [x] Substituir todas as menções à "Paytime" por "Mindi" nos templates de email, push e Telegram de aprovação e rejeição
## Ajustes visuais na página Banking
- [x] Transformar "Progresso da Ativação" de lista vertical para stepper horizontal visual (círculos conectados)
- [x] Mover os 5 cards (PIX Online, Cartão, Conta Digital, etc.) para abaixo do banner como "O que você ganha ao ativar"
## Reverter cards de benefícios na página Banking
- [x] Reverter os 5 cards de benefícios para posição vertical original (como estavam antes), manter stepper horizontal
## Remover menções à Paytime em mensagens de erro e notificações visíveis ao cliente
- [x] Encontrar todas as menções à "Paytime" em mensagens de erro, toasts e notificações visíveis ao cliente
- [x] Substituir por mensagens genéricas sem mencionar Paytime (30+ mensagens corrigidas em 4 arquivos)
- [ ] Investigar erro "Invalid phone number format" no cadastro
## Redesign visual da página Banking (apenas frontend)
- [x] Layout 2 colunas: hero/CTA à esquerda, cards de benefícios à direita
- [x] Título vendedor: "Receba pagamentos direto no seu cardápio."
- [x] Subtítulo: "Ative PIX, cartão e conta digital em poucos minutos. Sem mensalidade fixa, com liquidação em D+1 e dashboard unificado."
- [x] Stepper horizontal com números (1-5) e labels (Cadastro, Aprovação, Banking, KYC, Online)
- [x] Status badge (Inativo/Pendente/Aprovado) com texto descritivo
- [x] Botões "Iniciar cadastro" (primary vermelho Mindi) e "Ver requisitos" (outline)
- [x] Info "Tempo médio: 5 minutos · Aprovação em até 24h"
- [x] Badges de segurança: SSL TLS 1.3, PCI-DSS Level 1, Autorização BACEN, 5 min para concluir
- [x] Cards de benefícios à direita com badge "INCLUÍDO" (PIX Online, Cartão de Crédito, Conta Digital, Pagar Contas, Área PIX)
- [x] Seção "Liquidação por" com nomes dos bancos (Banco Central, Bradesco, Itaú, Stone)
- [x] Adaptar cores para branding Mindi (vermelho/coral nos botões e ícones)
- [x] Manter toda a lógica de backend inalterada

## Redesign visual da página Banking V2 (novo mockup)
- [x] Hero section com fundo escuro, badge de status, breadcrumb BANKING · CADASTRO
- [x] Título "Falta só o cadastro para começar a receber." com subtítulo
- [x] Botão "Iniciar cadastro →" verde escuro + "Ver requisitos" outline
- [x] Stepper horizontal com bolinhas e labels (Cadastro, Aprovação, Banking, KYC, Online)
- [x] Info "~5 min para concluir"
- [x] 4 cards de taxas: PIX 0,99%, Crédito 2,99%, Liquidação D+1, Antifraude Incluído
- [x] Seção "Produtos que serão liberados" com grid 3+2 de cards com badge "Bloqueado"
- [x] Manter toda a lógica de backend inalterada

## Unificação visual Banking: onboarding deve seguir mesmo estilo do Banking ativo
- [x] Analisar visual da página Banking quando aprovado/ativo (cards, cores, tipografia, layout)
- [x] Redesenhar BankingOnboarding para seguir mesmo estilo/branding do Banking ativo
- [x] Manter lógica de backend inalterada

## Ajustar fontes/tamanhos do BankingOnboarding para padrão do sistema
- [x] Analisar fontes padrão das páginas Dashboard, Clientes, Mapa de Mesas, PDV
- [x] Ajustar fontes e tamanhos do BankingOnboarding para seguir o padrão do sistema

## Padronizar fontes do Banking ativo para mesmo estilo do sistema
- [x] Ajustar fontes em BankingHome (saldo, cards, ações rápidas, transações)
- [x] Ajustar fontes em BankingSidebar
- [x] Ajustar fontes em BankingHistorico
- [x] Ajustar fontes em BankingExtrato
- [x] Ajustar fontes em BankingPagarConta
- [x] Ajustar fontes em BankingAreaPix
- [x] Ajustar fontes em BankingEstabelecimento
- [x] Ajustar fontes em BankingLiquidacoes
- [x] Ajustar fontes em BankingTaxas
- [x] Ajustar fontes em BankingExtratoBancario

## Renomear Banking para Conta Digital
- [x] Renomear no menu lateral (DashboardLayout/sidebar)
- [x] Renomear nos títulos e breadcrumbs dentro do Banking.tsx
- [x] Renomear em textos de referência (labels, descrições, tooltips)

## Atualizar taxas e badge dos cards do BankingOnboarding
- [x] Taxa PIX: 0,99% → 1,39%
- [x] Taxa Crédito: 2,99% → 3,59%
- [x] Badge "Bloqueado" → "Após aprovação" nos cards de produtos

## Atualizar card de Liquidação
- [x] Separar Liquidação em: PIX D+1 e Cartão D+3 (descrição no mesmo card)

## Ajustar border-radius dos badges
- [x] Badge "Após aprovação": border-radius 9px
- [x] Badge "Inativo": border-radius 9px

## Separar Liquidação em dois cards independentes
- [x] Separar card único "Liquidação D+1/D+3" em dois cards: "Liquidação PIX" (D+1) e "Liquidação Cartão" (D+3)
- [x] Grid alterado de xl:grid-cols-4 para xl:grid-cols-5 (5 cards do mesmo tamanho)
- [x] Remover ping do dot ativo do stepper (manter ring simples)

## Ajustar layout dos cards de produtos liberados
- [x] Título do card ao lado direito do ícone (mesma linha), não abaixo

## Animação de pulsar no dot do stepper
- [x] Adicionar animate-ping no dot vermelho ativo do stepper (igual ao menu público)

## Efeito hover nos cards de taxas
- [x] Adicionar hover:shadow-md hover:-translate-y-0.5 nos 5 cards de taxas do Banking

## Auto-expand sidebar ao aumentar largura da janela
- [x] Implementar lógica de auto-expand do sidebar quando a largura da janela ultrapassar breakpoint

## Sheet lateral com timeline de progresso da ativação
- [x] Implementar Sheet/Drawer lateral direito com timeline ao clicar em 'Ver requisitos'
- [x] Timeline com 5 steps: Cadastro, Aprovação, Banking, KYC, Online
- [x] Identidade visual do Banking (emerald/red, gradientes)
- [x] Indicação do step atual e progresso

## Redesenhar sidebar de progresso do Banking no estilo PDV
- [x] Aplicar header com gradiente (estilo PDV) na sidebar de progresso do Banking
- [x] Botão X no header para fechar
- [x] Conteúdo com bg-card e overflow-y-auto
- [x] Manter identidade visual do Banking (emerald/verde ao invés de red)

## Ajustar sidebar de progresso do Banking
- [x] Header com degradê vermelho (estilo card hero) em vez de verde sólido
- [x] Adicionar barra de progresso animada no header
- [x] Remover espaço vazio na parte de baixo da sidebar

## Estilizar 5 cards de produtos como card de formulário
- [x] Aplicar bg-gradient-to-br, border colorida, rounded-2xl nos 5 cards de produtos (estilo formulário cadastro)

## Atualizar sub-itens do step Cadastro na timeline
- [x] Alterar sub-itens do step Cadastro para: Razão social e CNPJ, Endereço do estabelecimento, Dados do responsável legal, Revisão e Envio

## Campo E-mail editável nas Configurações
- [x] Tornar campo E-mail da conta editável com botão "Editar" no final do campo

## Atualizar sub-itens dos steps Banking, KYC e Online na timeline
- [x] Banking: sub-item único "Ativar Conta digital"
- [x] KYC: sub-itens "Documento do responsável", "Selfie como prova de vida"
- [x] Online: sub-itens "Ativação no checkout", "Conta digital liberada"

## Bug: Email editado não persiste e não atualiza login
- [x] Corrigir backend para salvar email na tabela users (email de login) além de establishments
- [x] Garantir que ao recarregar a página o novo email apareça corretamente

## Melhorar Sheet de progresso da ativação
- [x] Aumentar espaço entre os passos 1-5
- [x] Adicionar botão "Fechar" vazado na parte inferior
- [x] Remover espaço vazio em baixo (responsivo)

## Efeito hover nos cards de Produtos
- [x] Adicionar efeito de elevação no hover nos 5 cards da seção "Produtos que serão liberados"

## Cards de Produtos na página de cadastro
- [x] Adicionar os 5 cards de "Produtos que serão liberados" em coluna vertical ao lado direito do formulário de cadastro

## Melhorar sidebar de produtos no formulário de cadastro
- [x] Background diferenciado (bege/cinza claro) na sidebar direita
- [x] Cards maiores com mesmo estilo da seção principal de Produtos + badge "INCLUÍDO"

## Reorganizar campos do Step 1
- [x] Mover campos para grid 2 colunas: Razão Social|Nome Fantasia, CNPJ|Telefone, CNAE|Email

## Reorganizar campos do Step 2 (Endereço)
- [x] Primeira linha com 3 campos: Rua | CEP | Estado (UF)

## Remover container da sidebar de produtos
- [x] Remover o container (border/bg) que envolve os 5 cards na sidebar "O que você ativa"

## Validação de CNPJ e CPF no formulário de cadastro
- [x] Adicionar validação de CNPJ no Step 1 (Dados da Empresa) com mensagem de erro visual
- [x] Adicionar validação de CPF no Step 3 (Representante Legal) com mensagem de erro visual

## Adicionar 6º card Antifraude 3DS
- [x] Adicionar card "Antifraude 3DS" na seção de Produtos que serão liberados (página principal e sidebar do cadastro)

- [x] Adicionar imagem de fundo (person-working-html-computer.webp) no card principal "Conta Digital · CADASTRO" com opacidade 20% — REVERTIDO a pedido do usuário
- [x] Reverter imagem de fundo do card hero (remover background image adicionada)
- [x] Redesenhar os 4 steps do formulário de cadastro para ficarem com o mesmo estilo visual da página Banking
- [ ] Ocultar seção Banking/Conta Digital para contas de teste grátis (não deve aparecer na sidebar nem na rota)
- [x] Mover campo Cidade ao lado do Bairro (4 campos na mesma linha: Número | Complemento | Bairro | Cidade)
- [x] Campo Número menor (máx 4 caracteres, ocupa menos espaço)
- [x] BUG: Ao trocar e-mail em Configurações > Conta e Segurança, o e-mail de login do usuário não é atualizado (só atualiza no card visual) — corrigido condição + verificação de duplicidade
- [x] Editar textos do card Conta Digital: título para "Receba PIX online e cartão direto no seu cardápio." e subtítulo para "Ative o pagamento online em minutos. Dinheiro cai na sua conta digital, sem intermediários."
- [x] Cards "Produtos que serão liberados" em uma linha só com efeito de carrossel/scroll horizontal (estilo "Clientes que vendem" da landing page)
- [x] Atualizar copy da landing page com base no posicionamento StoryBrand (sem alterar visual/layout)
- [x] Atualizar copy da seção 'Comece Agora' na landing page: título "Seu restaurante pode vender muito mais." e subtítulo "Junte-se a centenas de restaurantes que já economizam milhares de reais por mês com o Mindi. Crie sua conta grátis em menos de 2 minutos."
- [x] Atualizar subtítulo do hero da landing page: "Para você focar no que realmente importa, atender melhor e vender mais."
- [x] Banking cadastro: botões Voltar/Próximo lado a lado à direita, barra com cor diferenciada no rodapé do modal, textos descritivos (ex: "Avançar para Endereço", "Avançar para Representante")
- [x] Corrigir storageProxy.ts - erro TS7053 req.params[0] → req.params.key
- [x] Botão "Salvar e continuar depois" no cadastro Banking com persistência no banco (tabela onboarding_drafts)
- [x] Carregar rascunho salvo ao abrir formulário de onboarding (prioridade sobre dados do establishment)
- [x] Botão "Iniciar cadastro" muda para "Continuar cadastro" quando há rascunho salvo
- [x] Rascunho é deletado automaticamente após envio do cadastro com sucesso
- [x] Atualizar subtítulo do hero da landing page
- [x] Atualizar copy da seção "Comece Agora" da landing page
- [x] Padronizar botões do formulário de cadastro Banking (Salvar e continuar depois, Cancelar/Voltar, Avançar) no mesmo estilo dos botões Iniciar cadastro e Ver requisitos — verde arredondado com seta para principal, borda arredondada fundo branco para secundários
- [x] Menu público: campo observações — texto "Alguma observação?" com ícone balão, contador 0/150 com vermelho ao se aproximar do limite, textarea começa com 1 linha e expande automaticamente
- [x] Ajuste: adicionar espaçamento entre caixa de complementos e footer no modal de detalhes do item
- [x] Ajuste: imagens dos cards de produto no menu público devem ter tamanho fixo para não ficarem esquisitas com textos de 2+ linhas
- [x] Ajuste: cards com texto curto ficam com muito espaço vazio — imagem deve ter tamanho fixo, não esticar
- [x] Preço promocional: adicionar campo promotionalPrice no schema de produtos
- [x] Preço promocional: endpoint tRPC para atualizar/remover preço promocional
- [x] Preço promocional: sidebar modal no catálogo com ícone de tag no campo de preço
- [x] Preço promocional: campos inline no modal de editar produto (preço promo ↔ % desconto sincronizados)
- [x] Preço promocional: exibição no menu público (preço atual + preço original riscado + badge -XX%)

## Ajustes visuais no preço promocional
- [x] Ícone de Tag no catálogo: quando produto tem promoção ativa, ícone fica vermelho (mesma cor do botão de categoria) em vez de verde
- [x] Modal de preço promocional: redesenhar para seguir o mesmo padrão visual do modal de editar produto (header vermelho, campos com mesmo estilo)

## Efeito shimmer no badge de desconto
- [x] Adicionar efeito shimmer (brilho deslizante) no badge de desconto (-XX%) do menu público para chamar atenção

## Correção de erros TypeScript
- [x] Adicionar promotionalPrice ao input schema do create product (routers/product.ts)
- [x] Adicionar promotionalPrice ao tipo do selectedProduct no PublicMenu.tsx
- [x] Passar promotionalPrice nos setSelectedProduct calls do PublicMenu.tsx (modal de detalhes)

## Promoção em lote por categoria
- [x] Backend: endpoint tRPC para aplicar desconto percentual em lote a todos os produtos de uma categoria
- [x] Backend: endpoint tRPC para remover promoção em lote de todos os produtos de uma categoria
- [x] Frontend: botão Tag ao lado do "Criar Combo" no header da categoria no catálogo
- [x] Frontend: sidebar modal com campo de desconto % e preview dos produtos afetados
- [x] Frontend: opção de remover promoção em lote no modal

## Ícone de promoção dentro do campo de preço
- [x] Mover ícone de Tag para dentro do container do campo de preço (mesmo border, mesmo row) estilo iFood
- [x] Remover botão separado de Tag e integrar ao campo de preço

## Exibir preço promocional na lista do catálogo
- [x] Mostrar preço original (cinza/riscado) + preço promocional lado a lado na lista de produtos do catálogo quando produto tem promoção ativa

## Migração de Menu Antigo - Pequena Londres (ID 210020)
- [x] Extrair categorias e produtos do menu antigo (menu.mindi.com.br/pequena-londres/m)
- [x] Inserir categorias no banco (tabela categories)
- [x] Inserir produtos no banco (tabela products) — sem fotos
- [x] Verificar dados migrados

## Subtextos descritivos nos planos
- [x] Adicionar subtexto abaixo do botão de cada plano (Free, Starter, Essencial, Pro) na página de planos

## Migração de Menu Antigo - Estabelecimento 210021
- [x] Descobrir slug/alias do estabelecimento 210021 no menu antigo
- [x] Extrair categorias e produtos do menu antigo via API
- [x] Baixar fotos dos produtos e fazer upload para o S3
- [x] Inserir categorias no banco (tabela categories)
- [x] Inserir produtos no banco (tabela products) com fotos
- [x] Inserir complementos (addon_groups e addon_items) se houver (nenhum complemento no menu antigo)
- [x] Verificar dados migrados

## Migração de Bairros e Taxas de Entrega - Estabelecimento 210021 (Allan Salgados)
- [x] Extrair bairros e valores de entrega do backoffice antigo (88 bairros via API)
- [x] Inserir bairros e taxas no banco do sistema novo (86 únicos, 2 duplicatas removidas)
- [x] Verificar dados migrados
- [x] Trocar mensagem de erro de validação do email na página Conta e Segurança para "Digite um email válido"

## Migração de Menu Antigo - Estabelecimento 210022 (LK Açaí Delivery)
- [x] Extrair categorias, produtos, complementos e fotos do menu antigo via API
- [x] Baixar fotos e fazer upload para o S3 com URLs absolutas
- [x] Inserir categorias no banco
- [x] Inserir produtos no banco com fotos (URLs absolutas do S3)
- [x] Inserir complementos (addon_groups e addon_items) respeitando obrigatório/opcional
- [x] Verificar dados migrados

## Correções na Migração LK Açaí Delivery (ID 210022)
- [x] Corrigir obrigatoriedade dos grupos de complementos (comparar com menu antigo - sem badge = opcional)
- [x] Converter nomes dos itens de complemento de MAIÚSCULAS para primeira letra maiúscula
- [x] Verificar correções no banco

## Placeholder da Nota do Restaurante
- [x] Alterar placeholder de "Deixe uma nota temporária para seus clientes" para texto sem referência a "temporária"

## Bug: Créditos gratuitos do Mindi Vision
- [x] Investigar por que novas contas recebem 19 créditos em vez de 4 (causa: default da coluna aiImageCredits no banco era 15 em vez de 0)
- [x] Corrigir default da coluna aiImageCredits de 15 para 0 no banco
- [x] Resetar saldos inflados dos estabelecimentos afetados

## Layout Modalidades e Entrega
- [x] Alterar cards "Tempo de entrega" e "Pedido mínimo" para ficarem empilhados (um abaixo do outro) em vez de lado a lado

## Correção Plano Paytime SubPaytime
- [x] Usar plano fixo ID 22149 na ativação do Gateway 4 (SubPaytime) em vez de listar todos os planos

## Bug: Token da instância WhatsApp não encontrado (estabelecimento 210020)
- [x] Investigar erro "Token da instância não encontrado" ao conectar WhatsApp (resolvido: usuário apagou e recriou a instância)

## Atualizar plano Paytime para Online Flex (22150)
- [x] Alterar plano de 22149 (antecipado D+30) para 22150 (Online Flex, não antecipado)

## Alterar plano Paytime para pagamento online
- [x] Alterar plano de 22150 para 22151 no código (server/routers/paytime.ts)
- [x] Corrigir plano de 22151 para 22152 (ID correto informado pelo usuário)

## Simplificar cards de Plano Comercial na página Banking
- [x] Remover PIX dos cards de bandeira (já aparece no topo da página)
- [x] Remover seção de Crédito parcelado (só temos pagamento à vista)
- [x] Mostrar apenas Crédito à vista e Débito por bandeira
- [x] Layout mais limpo e organizado
- [x] Corrigir bug: serviços (Venda Presencial/Online/Tap) mostrando Inativo por pegar gateway ACQUIRER errado (PAGSEGURO WAITING ao invés de PAYTIME APPROVED)
- [x] Adicionar 2 cards de faturamento (Hoje e Mensal) na página de Banking com comparação percentual
- [x] Bug: campo de observações não aparece no modal de produto combo no menu público
- [x] Remover badge "Conta Digital - Ativo" da sidebar Banking
- [x] Mover Saldo disponível e Lançamentos futuros para sidebar (no lugar do badge)
- [x] Remover card separado de Saldo disponível do conteúdo principal
- [x] Remover trend de número de transações
- [x] Adicionar "C/C" antes do número da conta na exibição de Agência/Conta (ex: 0001 / C/C 48915335-3)
- [x] Remover linha "Tipo / Conta Corrente" da seção de dados bancários (já indicado pelo C/C)
- [x] Remover card "Taxas / Planos e tarifas" da home do Banking
- [x] Adicionar botão retangular "Planos e Tarifas" abaixo do card do estabelecimento na aba Dados da Conta
- [x] Redesenhar Banking Home: remover texto "AÇÕES RÁPIDAS", cards de ações no topo
- [x] Adicionar 4 cards de métricas: Faturamento Hoje, Faturamento Mensal, Saldo disponível, Lançamentos futuros
- [x] Adicionar gráfico "Progressão de vendas" com dados da API Paytime e seletor de datas
- [x] Adicionar 4 cards abaixo do gráfico: Total de Vendas, Valor Bruto, Valor Líquido, Ticket Médio
- [x] Restaurar visual original dos cards (gradiente + barra lateral + ícones coloridos) no novo layout Banking Home
- [x] Ajustar borda dos cards do Banking: trocar borda lateral esquerda para borda superior arredondada (igual Dashboard)
- [x] Restaurar nomes originais dos cards de ações rápidas do Banking Home (Vendas, Pagar conta, Área PIX, Repasses, Conta, Extrato)
- [x] Corrigir bordas dos cards de métricas/resumo: voltar para lateral esquerda com estilo arredondado (copiar estilo existente)
- [x] Corrigir gráfico de Progressão de vendas que fica travado em "Carregando gráfico..." (procedure getSalesProgression agora é encontrada)
- [x] Bug fix: getSalesProgression procedure não encontrada (resolvido com restart do server)
- [x] Bug fix: Bordas dos cards Banking Home alteradas para border-l-4 (borda esquerda)
- [x] Alterar borda dos 4 cards de métricas (Faturamento Hoje/Mensal, Saldo, Lançamentos) para borda superior (border-t-4), mantendo os demais com border-l-4
- [x] Sidebar minimiza automaticamente ao clicar em Conta Digital (Banking)
- [x] Remover textos 'Extrato' e 'Antecipe agora' dos cards de Saldo e Lançamentos
- [x] Mover badges de percentual (+100%) para ao lado direito do valor (igual Dashboard)
- [x] Mostrar 'Desde ontem' e 'Desde mês passado' em tooltip no hover dos cards
- [x] Ajustar visual do card Progressão de vendas para ter borda superior colorida (border-t-4 cyan) e shadow como os demais cards do Banking
- [x] Padronizar os 4 cards de métricas do Banking Home com o mesmo estilo dos cards do Extrato de Vendas (ícone à esquerda, borda lateral, gradiente suave)
- [x] Padronizar os 4 cards de resumo (Total Vendas, Valor Bruto, Valor Líquido, Ticket Médio) com estilo Extrato de Vendas
- [x] Bug crítico: pagamento online (PIX/cartão) aparece no menu público antes do KYC estar completo - só mostrar quando todas etapas concluídas
- [x] Reorganizar 4 cards Banking: ordem Saldo, Lançamentos, Faturamento Hoje, Faturamento Mensal e mover para topo acima dos demais cards
- [x] Mover 4 cards de métricas para acima dos 6 botões de atalho no Banking Home
- [x] Bug: Faturamento mensal conta pagamentos pendentes - deve contar apenas concluídos
- [x] Bug: TapOnPhone aparece como Ativo no Banking mas está NÃO HABILITADO no portal Paytime — sistema não busca status real da API
- [x] Adicionar card de Saldo disponível acima do card Enviar PIX na Área PIX do Banking
- [ ] Bug: Erro "Certificado de cliente ausente" ao tentar enviar PIX — verificar documentação Paytime
- [ ] Bug: Lista de Transferências PIX mostra pagamentos recebidos em vez de transferências enviadas — corrigir endpoint/filtro
- [x] Fix: Adicionar https://mindi.com.br ao ALLOWED_ORIGINS para corrigir erro de pedido do Pequena Londres
- [ ] Bug: Chave PIX nativa não está sendo enviada na mensagem WhatsApp do pedido (funcionava ontem, hoje não envia)

## Investigação de Bugs (28/04/2026 - Sessão 2)
- [x] Bug: Transferências PIX na Área PIX mostra pagamentos recebidos (method=IN) em vez de transferências enviadas (method=OUT) - Corrigido filtro no backend para incluir method: 'OUT'
- [x] Bug: Botão PIX nativo não enviado no WhatsApp - Causa: WhatsApp desconectado (status=disconnected) + pixKey com formatação incorreta (espaço no lugar de barra no CNPJ)
- [x] Restaurar card de Notificações SMS na seção Atendimento das Configurações
- [x] Enviar SMS ao cliente quando pedido for aceito (status preparing) com mensagem: "Nome: Olá! Seu pedido #P5 (R$20,00) foi confirmado e já está sendo preparado. Obrigado pela preferência!"
- [x] Implementar card "Vendas por modalidade" (donut chart agrupado por type: PIX, CREDIT, DEBIT)
- [x] Implementar card "Canal de vendas" (donut chart agrupado por point_of_sale.type: ONLINE, PHYSICAL, etc.)
- [x] Implementar card "Conversão de vendas" (donut chart agrupado por status: PAID, PENDING, FAILED)
- [x] Estender backend getTransactionsSummary para retornar agrupamentos
- [x] Adicionar SMS ao cancelar pedido — notificar o cliente caso o pedido seja cancelado pelo estabelecimento (já estava implementado no backend)
- [x] Atualizar texto do card de Notificações SMS nas configurações para refletir os 3 tipos de SMS (aceite, pronto, cancelado) — já estava atualizado
- [x] Adicionar filtro de data no card de Progressão de vendas (Banking) com calendário similar ao dos Fechamentos programados
- [x] Corrigir dropdown do DateRangePickerSales cortado na parte inferior (botões Limpar/Filtrar não visíveis)
- [x] Ajustar visual dos 3 cards de donut (Vendas por modalidade, Canal de vendas, Conversão de vendas) para seguir o padrão visual do Banking
- [x] Corrigir card de Transferências PIX na Área PIX que fica carregando infinitamente
- [x] Corrigir fluxo de Banking que não trata status 'negado' — fica preso no KYC em vez de mostrar que foi negado
- [x] Melhorar botão "Verificar KYC" para dar feedback visual (toast) ao usuário com o status atualizado
- [x] Corrigir card de Transferências PIX que fica carregando infinitamente na Área PIX
- [x] Adicionar transferências PIX recebidas ao card de Transferências PIX
- [x] Investigar por que transferência PIX recebida de R$ 32,93 não aparece no estabelecimento 210019 (removido filtro type:PIX que excluía liquidações)
- [x] Alterar modal de Detalhes da Liquidação para sidebar lateral direita no mesmo estilo do Banking
- [x] Adicionar toggle para desativar/ativar pagamento online por cartão de crédito no card Gateways de pagamento
- [x] Atualizar menu público para respeitar configuração de crédito desativado (já implementado — menu público usa paytimeCardEnabled)
- [x] Incluir plano presencial (ID 22174) automaticamente na ativação do gateway PAYTIME junto com o plano online (ID 22152)
- [x] Associar plano presencial (ID 22174) ao estabelecimento 366140 que já tinha gateway 4 ativo sem planos — testado e confirmado que POST "Ativar gateway" funciona como upsert
- [x] Implementar página/seção de Taxas e Tarifas no Banking exibindo planos online e presencial de cada estabelecimento com taxas detalhadas da API Paytime
- [x] Corrigir página de Taxas e Tarifas no Banking para exibir ambos os planos (online + presencial) em vez de apenas o presencial
- [x] Filtrar página de Taxas e Tarifas para mostrar apenas os planos PHYSICAL e ONLINE (2 planos) em vez de todos os 14 retornados pela API
- [x] Reduzir tamanho das tabs de planos (Presencial/Online) na página de Taxas e Tarifas — devem ser compactas e não ocupar toda a largura
- [x] Remover opções 'Esta semana' e 'Este mês' da página de Relatórios, deixando apenas 'Hoje' com ícone de calendário
- [x] Alterar botão 'Normal' dos complementos para mostrar 'Grátis' com hover verde na página de Catálogo
- [x] Alterar botão 'Normal' dos complementos para mostrar 'Grátis' com hover verde na página de Grupos de Complementos
- [x] Adicionar modal de confirmação ao alterar preço de complemento na página de Grupos
- [x] Adicionar modal de confirmação ao alterar nome de complemento na página de Grupos
- [x] Adicionar modal de confirmação ao marcar complemento como Grátis na página de Grupos
- [x] Adicionar modal de confirmação ao alterar nome do grupo na página de Grupos
- [x] Adicionar modal de confirmação ao alterar Mín/Máx/Obrigatório na página de Grupos
- [x] Remover botão 'Hoje' e manter apenas botão 'Personalizado' com função de abrir DateRangePicker na página de Relatórios
- [x] Substituir DateRangePicker simples da página de Relatórios pelo calendário completo com atalhos laterais (Hoje, Ontem, 07 dias, 30 dias, Este ano, Personalizado) usado na Progressão de vendas do Banking
- [x] Mostrar nome do preset (Hoje, Ontem, 07 dias) no botão trigger do calendário da página de Relatórios em vez de datas; a partir de 30 dias mostrar as datas
- [x] Corrigir estilo do botão de filtro de período na página de Relatórios para usar o mesmo visual SlidingTabs da Dashboard (bg-muted container com pill branca) em vez de botão vermelho sólido
- [x] Alterar label '07 dias' para 'Últimos 7 dias' no filtro DateRangePickerSales
- [x] Alterar botão trigger do filtro na página de Relatórios para mostrar 'Filtro' com ícone SlidersHorizontal em vez de ícone de calendário
- [x] Alterar cor do botão 'Filtro' na página de Relatórios de branco para vermelho (bg-red-500 text-white), mesma cor do botão 'Novo Cliente'
- [x] Alterar cor do botão 'Filtro' na página de Relatórios de vermelho para cinza claro (bg-gray-100 text-gray-700)
- [x] Alterar cor do botão 'Filtro' na página de Relatórios de cinza claro para branco (bg-white text-gray-700 border-gray-200)
- [x] Replicar botão 'Filtro' (branco, ícone SlidersHorizontal, DateRangePickerSales) na página Dashboard
- [x] Replicar botão 'Filtro' (branco, ícone SlidersHorizontal, DateRangePickerSales) na página Minhas Finanças
- [x] Adicionar suporte a período 'custom' (startDate/endDate) no backend da Dashboard para filtro com datas personalizadas
- [x] Fase 1 iFood: Task 1.1 — Webhook HMAC Signature Validation
- [x] Fase 1 iFood: Task 1.2 — Event Deduplication (tabela + lógica)
- [x] Fase 1 iFood: Task 1.3 — Retry com Exponential Backoff (wrapper API)
- [x] Fase 1 iFood: Task 1.4 — Polling Fallback para eventos
- [x] Fase 1 iFood: Task 1.5 — Rate Limiting Awareness
- [x] Fase 1 iFood: Testes unitários para toda a Fase 1

## Fase 2 iFood: Módulo Merchant (Status, Horários, Interrupções)
- [x] Fase 2 iFood: Task 2.1 — getMerchantStatus() e getMerchantDetails() em server/ifoodMerchant.ts
- [x] Fase 2 iFood: Task 2.1 — tRPC procedures ifood.merchantStatus e ifood.merchantDetails
- [x] Fase 2 iFood: Task 2.2 — getOpeningHours() e updateOpeningHours() em server/ifoodMerchant.ts
- [x] Fase 2 iFood: Task 2.2 — tRPC procedures ifood.getOpeningHours e ifood.updateOpeningHours
- [x] Fase 2 iFood: Task 2.3 — createInterruption(), deleteInterruption(), listInterruptions() em server/ifoodMerchant.ts
- [x] Fase 2 iFood: Task 2.3 — tRPC procedures ifood.pauseStore, ifood.resumeStore, ifood.listInterruptions
- [x] Fase 2 iFood: UI — Componente de status do merchant (online/offline) na aba Integrações
- [x] Fase 2 iFood: UI — Grade semanal de horários de funcionamento com edição
- [x] Fase 2 iFood: UI — Botão Pausar/Retomar loja com seletor de duração
- [x] Fase 2 iFood: Testes unitários para todo o módulo Merchant (19 testes passando)

## Fase 3 iFood: Módulo de Catálogo (Sincronização de Produtos)
- [x] Fase 3 iFood: Task 3.1 — getCatalogs(), getCategories(), getProducts(), getFullCatalog() em server/ifoodCatalog.ts
- [x] Fase 3 iFood: Task 3.1 — tRPC procedures ifood.getCatalogs, ifood.getFullCatalog, ifood.getIfoodProducts, ifood.getIfoodCategories
- [x] Fase 3 iFood: Task 3.2 — updateProduct(), updateProductStatus(), updateProductPrice(), syncLocalProductToIfood() em server/ifoodCatalog.ts
- [x] Fase 3 iFood: Task 3.2 — tRPC procedures ifood.updateIfoodProduct, ifood.toggleProductAvailability, ifood.updateIfoodProductPrice, ifood.syncProductToIfood
- [x] Fase 3 iFood: Task 3.3 — updateCategoryStatus(), updateCategory(), bulkUpdateCategoryProductsStatus() em server/ifoodCatalog.ts
- [x] Fase 3 iFood: Task 3.3 — tRPC procedures ifood.toggleCategoryAvailability, ifood.bulkToggleCategoryProducts
- [x] Fase 3 iFood: UI — Painel de catálogo iFood com hierarquia (catálogos > categorias > produtos) em IfoodCatalogPanel.tsx
- [x] Fase 3 iFood: UI — Toggle de disponibilidade de produtos e categorias com switches
- [x] Fase 3 iFood: UI — Edição inline de preços e painel de sincronização
- [x] Fase 3 iFood: Testes unitários para todo o módulo de Catálogo (22 testes passando)

## Fase 4 iFood: Plataforma de Negociação (Handshake)
- [x] Fase 4 iFood: Task 4.1 — Tabela ifood_disputes no schema (disputeId, orderId, action, handshakeType, status, expiresAt, alternatives, metadata)
- [x] Fase 4 iFood: Task 4.1 — Processar evento HANDSHAKE_DISPUTE no webhook handler
- [x] Fase 4 iFood: Task 4.1 — tRPC procedures ifood.listDisputes, ifood.getDispute, ifood.getPendingDisputes
- [x] Fase 4 iFood: Task 4.2 — acceptDispute(), rejectDispute(), sendAlternative() em server/ifoodHandshake.ts
- [x] Fase 4 iFood: Task 4.2 — tRPC procedures ifood.acceptDispute, ifood.rejectDispute, ifood.sendAlternative
- [x] Fase 4 iFood: Task 4.2 — UI de detalhes da disputa com countdown, evidências e botões de ação (IfoodDisputesPanel.tsx)
- [x] Fase 4 iFood: Task 4.3 — Processar evento HANDSHAKE_SETTLEMENT no webhook handler
- [x] Fase 4 iFood: Task 4.3 — Atualizar status da disputa e do pedido conforme settlement (ACCEPTED→cancel, EXPIRED→timeoutAction)
- [x] Fase 4 iFood: Task 4.4 — Enhancement de pedidos agendados (isScheduled, scheduledAt, status=scheduled)
- [x] Fase 4 iFood: Testes unitários para todo o módulo Handshake (18 testes passando)

## Fase 5 iFood: Homologação e Notificações de Disputas

- [x] Fase 5 iFood: Task 5.1 — Endpoint getIfoodHealthStatus para validação de conectividade (homologação)
- [x] Fase 5 iFood: Task 5.2 — Endpoint runHomologationChecklist para verificação do checklist de homologação
- [x] Fase 5 iFood: Task 5.3 — Notificação Push quando nova disputa chegar (com countdown e vibração)
- [x] Fase 5 iFood: Task 5.4 — Notificação Telegram quando nova disputa chegar (com formatação HTML)
- [x] Fase 5 iFood: Task 5.5 — Notificação SSE em tempo real para disputas pendentes (evento ifood_dispute)
- [x] Fase 5 iFood: Task 5.6 — tRPC procedures ifood.healthStatus e ifood.homologationChecklist
- [x] Fase 5 iFood: Testes unitários para homologação e notificações (17 testes passando)
- [x] Bug: Card "Acumulado da semana" demora a carregar — otimizado com Promise.all (queries paralelas) + índice composto (establishmentId, status, createdAt)
- [x] Fix: Resolver 2 erros do TS watcher (Cannot find module '../ifoodInfra' e './ifoodInfra') para CI/CD limpo — convertido dynamic import para static import, tsc --noEmit = 0 erros, build = sucesso
- [x] Bug: Card 'Acumulado da semana' mostra R$ 0,00 — corrigido: custom branch agora agrupa por dia-da-semana (7 slots Mon-Sun) com comparação; getWeeklyRevenue retorna semana atual em vez da anterior
- [x] Bug: Lentidão na navegação para página de Pedidos — corrigido: backend agora limita concluídos/cancelados a 200 mais recentes
- [x] Paginação Kanban: limitar concluídos/cancelados a 50 por página com seta para próxima lista
- [x] Paginação Lista: limitar a 40 pedidos por página com paginação completa
- [x] Otimizar query backend orders.list para limitar pedidos concluídos/cancelados (200 max)
- [x] Adicionar timeout de 5s nas chamadas UAZAPI (makeInstanceRequest) para evitar bloqueio indefinido
- [x] Separar whatsapp.getStatus do batch tRPC no frontend (splitLink) para não bloquear outras queries
- [x] Cachear status do WhatsApp no servidor (60s) para evitar chamadas externas repetidas
- [x] Remover reconfiguração do webhook de dentro do getStatus — agora só reconfigura na transição de status
- [x] Bug: Tooltip do card Acumulado da semana fica cortado atrás da sidebar — z-index aumentado para z-50
- [x] Invalidar cache do WhatsApp no servidor ao clicar em Conectar/Desconectar para feedback imediato
- [ ] Adicionar refetch imediato do whatsapp.getStatus no onSuccess das mutations connect/disconnect no frontend
- [x] Alterar seção 'Clientes que vendem' na landing page para usar estilo do card 'Preview do Perfil Público'
- [x] Corrigir ClientCard na landing page para ficar pixel-perfect igual ao Preview do Perfil Público (capa rosa com padrão, logo circular grande vermelho sobrepondo capa, badge inferior direito, card branco separado abaixo)

## Pagamento de Assinaturas via Paytime (PIX + Cartão)
- [x] Verificar webhooks Paytime registrados via API (updated-sub-transaction ativo em app.mindi.com.br)
- [x] Criar tabela plan_subscriptions no schema (gateway, status, token cartão, datas)
- [x] Adicionar campo paymentGateway na tabela establishments (via gateway_settings)
- [x] Criar tabela/config gateway_settings para admin ativar/desativar métodos
- [x] Implementar endpoint checkout PIX Paytime para planos
- [x] Implementar endpoint checkout Cartão Paytime para planos (com tokenização)
- [x] Adaptar webhook Paytime para confirmar pagamentos de planos e ativar plan
- [x] Painel admin na página Planos para ativar/desativar gateways (Stripe, Paytime PIX, Paytime Cartão)
- [x] Adaptar página de Planos do restaurante para exibir métodos ativos (PIX QR, Cartão Paytime, Stripe)
- [x] Criar endpoint /api/scheduled/plan-renewals + createCardTransactionWithToken para renovações
- [x] Lógica de carência 2 dias para PIX não pago antes de desativar plano (no endpoint scheduled)
- [x] Configurar scheduled task Manus para executar renovações automáticas diariamente (9h BRT)

## WhatsApp da Mindi (Admin) para Cobranças
- [x] Analisar integração UAZAPI existente e padrão de conexão WhatsApp
- [x] Criar schema/config para armazenar instância WhatsApp admin da Mindi
- [x] Implementar backend (router admin) para criar/conectar instância WhatsApp Mindi
- [x] Implementar UI no painel admin para conectar WhatsApp da Mindi (QR Code, status)
- [x] Integrar envio de cobranças via WhatsApp Mindi nas renovações de planos

## Templates de Mensagens WhatsApp (Editáveis)
- [x] Analisar templates existentes no platformWhatsappDb.ts
- [x] Adicionar campos de template na tabela platform_whatsapp_config (já existem no schema)
- [x] Implementar procedures admin para salvar templates personalizados (já existe updateTemplates)
- [x] Criar UI de edição de templates no painel admin (com preview e variáveis)
- [x] Testar e salvar checkpoint
- [x] Fix: Pagamento PIX não confirma plano após pagamento (webhook + polling não funciona)
- [x] Implementar antifraude 3DS no pagamento de plano por cartão (backend + frontend SDK)
- [x] Fix: Modal 3DS bloqueado pelo z-index do Dialog de cartão na página de Planos
- [x] Enviar notificação WhatsApp quando pagamento de plano for confirmado (PIX ou Cartão) - prioridade: celular do responsável > WhatsApp do estabelecimento
- [x] Fix: Remover antifraud_type THREEDS forçado nos planos - deve funcionar igual ao menu público (só pede 3DS quando necessário)
- [x] Trocar establishment_id dos pagamentos de plano de 358314 para 366140 (Bigteck)
- [x] Fix: Modal 3DS ainda bloqueado - aplicar solução com invisible+pointer-events-none
- [x] Fix: Erro TONPAG000 - phone number format inválido no pagamento de plano por cartão
- [x] Fix: Página trava quando 3DS falha (antifraudProcessing não reseta)
- [x] Investigar: 3DS ainda é acionado para valores baixos no estabelecimento 366140
- [x] Fix: 3DS iframe não é clicável - overlay do Dialog bloqueia interação com iframe do banco
- [x] Fix: 3DS iframe não clicável - body[data-threeds-active] desabilita pointer-events no #root para permitir cliques no iframe Cardinal Commerce
- [x] Fix: 3DS iframe DEFINITIVO - visibility:hidden no #root + React Portal para botão cancelar + sem override de position nos iframes Cardinal
- [x] Melhoria visual: Adicionar backdrop escuro com blur durante 3DS em vez de fundo branco
- [x] Fix: Página Conta Digital - quando KYC já foi enviado e está em análise, mostrar "Verificação enviada!" em vez de "Falta a verificação de identidade"
- [x] Feature: Notificação push automática quando KYC for aprovado/rejeitado
- [x] Fix: Badge "Aprovado" na página Conta Digital deve mostrar "Em Análise" quando KYC está pendente
- [x] Fix: Adicionar tabela ifoodProcessedEvents no drizzle/schema.ts e fazer db:push (já existia)
- [x] Configurar webhook do iFood no portal do desenvolvedor (instruções fornecidas)
- [x] Fix: Webhook do iFood falha no teste de conexão - investigar e corrigir endpoint
- [x] Atualizar IFOOD_CLIENT_SECRET com o valor correto do portal
- [x] Fix: Criar tabela ifood_processed_events no banco de dados (migração não foi aplicada)
- [x] Fix: Criar tabela ifood_disputes no banco de dados (migração não foi aplicada)
- [x] Fix: Mover webhook iFood para ANTES do express.json() global (body era consumido pelo middleware JSON antes de chegar ao handler raw)
- [x] Fix: Limpar cache TypeScript stale (tsconfig.tsbuildinfo) que causava falsos erros sobre ifoodInfra
- [x] Homologação: Webhook responde 202 Accepted (antes era 200)
- [x] Homologação: Webhook retorna 500 para erros reais (antes retornava 200)
- [x] Homologação: Evento RPS (Request Preparation Start) adicionado ao handler
- [x] Homologação: createCategory implementado no ifoodCatalog.ts + rota tRPC
- [x] Homologação: updateOptionPrice implementado no ifoodCatalog.ts + rota tRPC
- [x] Homologação: updateOptionStatus implementado no ifoodCatalog.ts + rota tRPC
- [x] Homologação: uploadImage implementado no ifoodCatalog.ts + rota tRPC
- [x] Homologação: Checklist de homologação atualizado com novos critérios
- [x] Bug: Badge de entrega no card de pedido expande com a largura do número do pedido + badge iFood — deve ter largura fixa
- [x] UI: Mover badge iFood para aba vermelha no topo do card de pedido (estilo aba do menu público mobile)
- [x] UI: Corrigir overflow-hidden que cortava a aba iFood no topo do card
- [x] UI: Ocultar botão "Editar itens do pedido" para pedidos vindos do iFood (sem remover o código)
- [x] UI: Mover aba "via iFood" um pouco mais para baixo (mais próxima do card) sem cobrir o texto
- [x] UI: Ajustar aba "via iFood" para ficar atrás do card (z-index negativo), parcialmente escondida, simulando aba saindo por trás
- [x] UI: Adicionar efeito shimmer no texto "via iFood" do badge nos cards de pedido
- [x] iFood Gap 1: Corrigir códigos de evento no switch (PLC→PLACED, CFM→CONFIRMED, CAN→CANCELLED, DSP→DISPATCHED, CON→CONCLUDED)
- [x] iFood Gap 2: Adicionar tratamento do evento CANCELLATION_REQUESTED
- [x] iFood Gap 3: Adicionar tratamento do evento ORDER_PATCHED
- [x] iFood Gap 4: Adicionar tratamento dos eventos de logística (ASSIGN_DRIVER, GOING_TO_ORIGIN, COLLECTED, etc.)
- [x] iFood Gap 5: Adicionar campos iFood no recibo impresso (CPF, código de coleta, observações de entrega, bandeira do cartão)
- [x] UI: Corrigir direção do shimmer no badge "via iFood" - deve ser da esquerda para direita
- [ ] Bug: Erro de query SQL na tabela whatsappConfig ao gerar QR Code do UAZAPI - colunas faltantes no banco
-- [x] Bug: Delay na deteção de conexão do WhatsApp após escanear QR Code - antes era instantâneo, agora demora muito
- [x] UI: Alterar texto do botão de 'Pronto' para 'Despachar' na coluna Preparo da página de Pedidos

## Texto Responsivo nos Cards de Pedido
- [x] Encurtar "Ver detalhes" → "Detalhes" quando tela fica estreita
- [x] Adaptar outros botões e textos dos cards para telas estreitas (pagamento, nome cliente, entregador, valor, gaps)

## Logo iFood como Background nos Cards
- [x] Adicionar logo do iFood como background (10% opacidade, full card) nos cards de pedidos do iFood

## Bug: Catálogo iFood Loading Infinito e Status da Loja
- [x] Investigar catálogo iFood loading infinito e status "não conectado"
  - Causa: Cloudflare bloqueando IP do sandbox (403 "You have been blocked") ao acessar merchant-api.ifood.com.br
  - Fix aplicado: fallback para client_credentials quando não há refresh token
  - Funcionará em produção (IP diferente do sandbox)
  - Status da loja "não conectado" também causado pelo bloqueio Cloudflare (mesma causa raiz)

## Bug: Catálogo iFood mostra 0 categorias e 0 produtos
- [x] Corrigido endpoint de produtos: /catalogs/{catalogId}/products → /catalogs/{catalogId}/sellableItems (endpoint correto da API v2.0) com fallback para /merchants/{merchantId}/products

## Bug: Produtos das categorias iFood não aparecem
- [ ] Categorias carregam OK (2 categorias: Açaí, Ofertas) mas 0 produtos em cada — investigar mapeamento

## Bug Fixes
- [x] Fix iFood catalog products not showing in categories (sellableItems API response field mapping: itemId→id, itemName→name, itemDescription→description, itemPrice→price)
- [x] Cache do catálogo iFood com TTL de 10 minutos e invalidação automática após operações de escrita
- [x] Debug: produtos não aparecem no catálogo iFood do estabelecimento 30001 - corrigido com fallback para /products com paginação
- [x] Bug: catálogo iFood mostra produtos duplicados - removido fallback /products que retornava todos os produtos do merchant (incluindo testes e complementos)
- [x] Bug: catálogo iFood mostra 0 produtos - corrigido usando categories?include_items=true que retorna itens vinculados diretamente nas categorias, com fallback para sellableItems usando groupId

## Sincronização Menu Local → iFood
- [x] Tabela de mapeamento produtos locais ↔ iFood (ifoodProductMapping)
- [x] Função de publicar produto individual no iFood (PUT /items com complementos)
- [x] Upload de imagem para o iFood (POST /image/upload)
- [x] Botão "Publicar no iFood" em cada produto
- [x] Botão "Publicar categoria no iFood" para publicar todos os produtos de uma categoria
- [x] Botão "Sincronizar tudo" para enviar todos os produtos de uma vez
- [x] Sincronização automática de preço quando alterar no nosso sistema
- [x] Sincronização automática de status quando alterar no nosso sistema
- [x] Rotas tRPC para publicação e sincronização
- [x] Testes para as novas funcionalidades

## Sistema Rascunho vs Publicado
- [x] Adicionar campo `version` (draft/published) nas tabelas categories, products, complementGroups, complementItems
- [x] Adicionar campo `publishedSourceId` nas tabelas categories e products
- [x] Script de migração: dados existentes → published + duplicar como draft
- [x] Filtrar queries do menu público por version='published'
- [x] Filtrar queries do WhatsApp bot por version='published'
- [x] Filtrar queries do iFood sync por version='published'
- [x] Todas as operações CRUD do admin operam em version='draft'
- [x] Implementar operação "Publicar" (atômica: deletar published → duplicar draft como published)
- [x] Implementar operação "Descartar Rascunho" (deletar draft → duplicar published como draft)
- [x] Seletor visual Rascunho/Publicado na página de catálogo
- [x] Banner "Você está editando o Rascunho" no topo
- [x] Botão "Publicar" e "Descartar Rascunho"
- [x] Badge com contagem de alterações pendentes
- [x] Modo somente leitura ao visualizar versão Publicada (admin sempre edita rascunho)
- [x] Testes para publish e discard operations

## Correções Painel Rascunho/Publicado
- [x] Card lateral deve ficar fixo (sticky) ao rolar a página
- [x] Remover sombra do card de Rascunho/Publicado

## Bugs Painel Rascunho/Publicado v2
- [x] Visual do card não está igual à versão anterior (restaurar estilo original com sombra e cantos arredondados)
- [x] Versão Publicada mostra 0 itens - produtos não foram duplicados para version='published'

## Correções Visuais CatalogVersionBar v2
- [x] Botões Rascunho/Publicado menores e mais compactos (proporção original)
- [x] Rascunho deve ficar visualmente selecionado quando ativo
- [x] Publicado deve ficar visualmente selecionado quando ativo (red highlight)
- [x] Dividers entre seções (tabs / status / botões)
- [x] Botões Publicar/Descartar como text-style buttons
- [x] Versão passada corretamente para queries de category.list e product.list
- [x] Corrigido product.list router para passar version ao buscar todos os produtos para cálculo de limite do plano

## Correções Visuais CatalogVersionBar v3 - Restaurar estilo original
- [x] Botões Publicar/Descartar com fundo cinza claro e borda (estilo outline) quando desabilitados
- [x] Área de tabs com fundo cinza (bg-zinc-100) para contraste com botão selecionado
- [x] Rascunho selecionado: fundo branco com borda e sombra (pill shape) contra fundo cinza
- [x] Publicado selecionado: fundo vermelho com cantos arredondados (pill shape)
- [x] Corrigido product.list router que não aceitava parâmetro version no schema Zod

## Correções Visuais CatalogVersionBar v4
- [x] Rascunho selecionado deve ser vermelho (não branco) - igual ao Publicado
- [x] Mais espaçamento entre os botões Rascunho e Publicado
- [x] Botões de seleção menores/mais compactos (matching original design)

## Correções Visuais CatalogVersionBar v5
- [x] Cantos arredondados (rounded-xl) nos botões de seleção
- [x] Fundo cinza na área de tabs (bg-zinc-100/80)
- [x] Tamanho moderado dos botões (py-3 px-4)
- [x] Removido debug logging do category.ts e Catalogo.tsx

## Bug: Categorias duplicadas na versão Publicada
- [ ] Investigar e corrigir categorias duplicadas ao visualizar aba Publicado no catálogo

## Bug: Categorias duplicadas na versão Publicada (cardápio público)
- [x] Investigar e corrigir categorias duplicadas no cardápio público (versão published) — causa: produção desatualizada, código local já tem filtro version='published' correto. Precisa deploy.

## Fix Build Error para Deploy
- [x] Corrigido erro de build: dynamic imports em ifoodRouter.ts (../db, ../drizzle/schema, drizzle-orm) substituídos por imports estáticos no topo do arquivo

## Card de Categorias na Sidebar do Catálogo
- [x] Criar componente CategorySidebarCard com lista de categorias
- [x] Botão "Todos" (pill vermelha) com contagem total de produtos
- [x] Botão "+ Nova" para adicionar categoria
- [x] Clique na categoria faz scroll automático até ela na lista do catálogo
- [x] Drag & drop para reordenar categorias
- [x] Edição inline do nome da categoria
- [x] Drag handle (ícone grip) em cada item
- [x] Integrar o card abaixo do CatalogVersionBar na sidebar

## Ajustes no Card de Categorias da Sidebar
- [x] Remover card "Modo visualização" da sidebar (já existe banner acima do conteúdo)
- [x] Ajustar arredondamento dos itens de categoria para rounded-xl (igual ao Rascunho/Publicado)
- [x] Reduzir tamanho dos botões Rascunho/Publicado (estavam desproporcionais/grandes demais)
- [x] Reduzir tamanho dos botões Publicar e Descartar (mais compactos e proporcionais)
- [x] Corrigir modo Publicado para ser somente leitura (desabilitar edição de preços, fotos, drag, botões de ação)
- [x] Persistir preferência de fechar banner "Produtos sem foto" no banco de dados (userPreferences)
- [x] Corrigir reordenação de categorias no card sidebar para atualizar a lista principal em tempo real
- [x] Corrigir complementos no modo Publicado para ser somente visualização (sem edição de mín/máx, obrigatório, sem botões adicionar/excluir)
- [x] Alterar cor do banner "Modo visualização" de azul para amarelo
- [x] Bug: Alteração de nome de categoria não é detectada como pendente para publicação
- [x] Bug: Alteração de estoque na aba Rascunho não é detectada como pendente
- [x] Bug: Alterações em complementos (editar, pausar, adicionar, excluir) na aba Rascunho não são detectadas como pendentes
- [x] Garantir que QUALQUER alteração na aba Rascunho seja detectada como pendente para publicação
- [x] Criar modal de sucesso ao publicar alterações com link do menu, botão copiar e botão Visitar
- [x] Bug: Reordenação de categorias/produtos demora para aparecer como alteração pendente (re-fix sem causar duplicação) — resolvido com restart do servidor (estado stale)
- [x] Remover botão "+ categoria" do header do Catálogo (manter apenas o "Nova" no card de categorias)
- [x] Adicionar efeito pulsante no botão "Publicar" quando há alterações pendentes
- [x] Bug: Investigar e corrigir causa raiz da duplicação de categorias (safeguard filter adicionado + version:'draft' explícito em todas as criações)
- [x] Bug: Processo de publicação não copia novos grupos de complementos do rascunho para publicado (causa raiz: default 'published' no schema + falta de version:'draft' nas criações)
- [x] Bug: Processo de publicação não copia novos itens de complemento do rascunho para publicado (corrigido em todos os pontos de criação)
- [x] Bug: Processo de publicação não sincroniza alterações de isActive dos itens de complemento (será sincronizado na próxima publicação)
- [x] Inverter cores: Rascunho → amarelo/âmbar, Publicar → vermelho
- [x] Bug: Preço promocional exibido como "R$ 10.,05" em vez de "R$ 10,05" (formatPriceBR recebia decimal em vez de centavos)
- [x] Adicionar ícone 'i' com tooltip explicativa ao lado dos botões Rascunho e Publicado
- [x] Adicionar botões mobile de Publicar e Descartar na página Catálogo (à esquerda do botão criar categoria, mesma linha, com diálogos de confirmação)
- [x] Mover ícones (i) tooltip para dentro dos botões Rascunho e Publicado (lado direito do botão, não fora)
- [x] Fix Banking page showing wrong online plan (Mindi-Kelri instead of Venda Online) - usar getEstablishmentDetails para obter planos vinculados ao sub-estabelecimento
- [x] Fix slow publish operation when publishing catalog changes (batch queries instead of N+1 loops)
- [x] Fix "Alterações pendentes" still showing after successful publish (optimized stats comparison)
- [x] Adicionar permissão "Conta Digital" (Banking) na seção FINANCEIRO da página de acessos
- [x] Adicionar permissão "Relatórios" na seção FINANCEIRO da página de acessos
- [x] Fix "Alterações pendentes" persistindo após publicar - comparação por produto (per-product) em vez de global para evitar falsos positivos de ordenação
- [x] Fix: Produto individual deve poder ser ativado mesmo com categoria pausada (effectiveStatus deve respeitar product.status real)
- [x] Fix: Estabilizar IDs no publish do catálogo — UPDATE em vez de DELETE+INSERT para que carrinhos dos clientes não invalidem após publicação
- [x] Fix: Pular step 4 (Crie sua Conta - email/senha) no onboarding quando usuário já está autenticado via Google OAuth
- [x] Fix: Tabela ifood_category_mapping não existe no banco — erro ao clicar 'Sincronizar Tudo' (criadas: ifood_category_mapping, ifood_product_mapping, ifood_complement_mapping)
- [x] Fix: Gráfico 'Progressão de vendas' na página Banking mostrando valores multiplicados por 100 (centavos em vez de reais)
- [x] Fix: Liquidações na página Banking mostrando dados de outros estabelecimentos — faltava filtro establishment.id na API listLiquidations
- [x] Fix: Página de estoque mostrando itens duplicados (versão draft + published) — filtrar para mostrar apenas uma versão + sincronização de estoque entre versões
- [x] Alterar taxas exibidas na página Banking: PIX de 1,39% para 1,49% e Crédito de 3,59% para 2,88%

## Bug Fixes - iFood Sync
- [x] Fix: Sincronizar Tudo com iFood não publicava os itens/produtos, apenas categorias
  - Corrigido formato do payload PUT /items para iFood Catalog v2 (products plural array, optionGroups com optionIds, options separado)
  - Corrigido filtro de versão: agora usa version='published' para categorias e produtos ao sincronizar
  - Adicionada limpeza de mapeamentos com erro antes de re-sincronizar (gera novos UUIDs)
- [x] Fix: Fotos dos produtos não aparecem no iFood após sincronização
  - Corrigido formato de upload: era FormData, agora é JSON com base64 (data URI) conforme documentação iFood
  - Adicionada conversão automática de webp/svg/gif para JPEG (iFood só aceita jpg/jpeg/png)
  - Adicionada compressão automática para imagens > 5MB
- [x] Unificar os dois cards do iFood (Catálogo iFood + Publicar no iFood) em uma interface única simplificada
- [x] Fix: Aceitar pedido iFood no Mindi agora sincroniza com o portal do iFood (confirm + startPreparation)
  - Adicionada lógica no orders.updateStatus para chamar API do iFood quando source='ifood'
  - Suporta: preparing (confirm+startPrep), ready (readyToPickup), out_for_delivery (dispatch), cancelled
- [x] Fix: Cancelar pedido iFood no Mindi deve sincronizar com API do iFood (com motivos de cancelamento do iFood)
- [x] Fix: getCancellationReasons retornava objeto wrapper { reasons: [...] } em vez de array — frontend caía no fallback sempre
  - Corrigido para extrair data.reasons quando API retorna formato { reasons: [...] }
  - Adicionado logging para ver o formato real retornado pela API
- [x] Fix: Cancelamento iFood não deve bloquear cancelamento local
  - Se a API do iFood rejeitar o cancelamento (pedido expirado, estado inválido, etc.), o pedido ainda é cancelado localmente
  - Erro é logado como warning em vez de lançar exceção que bloqueia tudo

## Integração Meta WhatsApp Cloud API (Embedded Signup)
- [x] Extrair seletivamente alterações da integração Meta WhatsApp do commit do GitHub
- [x] Verificar que whatsappOfficial.ts e whatsappProvider.ts já existem no projeto
- [x] Verificar que connectOfficial e disconnectOfficial já existem no router whatsapp.ts
- [x] Verificar que webhook Meta (/api/whatsapp/webhook GET+POST) já existe no index.ts
- [x] Verificar que schema já tem campos provider, wabaId, phoneNumberId, accessToken, businessId, metaWebhookSecret
- [x] Aplicar remoção do cache em memória do whatsapp.ts (melhoria do commit)
- [x] Aplicar webhook auto-reconfigurar movido para fora da condição de mudança de status
- [x] Adicionar variáveis de ambiente: META_APP_ID, META_APP_SECRET, META_CONFIG_ID, WHATSAPP_VERIFY_TOKEN
- [x] Rodar migração idempotente do banco (run-meta-migration.cjs) — colunas já existiam
- [x] Reiniciar servidor e verificar que ambos os webhooks funcionam (Meta e UAZAPI)
- [x] Verificar que fluxo iFood não foi quebrado (webhook iFood retorna 202)

## Correção de erros TypeScript
- [x] Fix: WhatsAppTab.tsx - cast de window para Record<string, unknown> (adicionado `as unknown` intermediário)
- [x] Fix: const.ts - appId possivelmente undefined (adicionado ?? "")
- [x] Fix: ifoodSync.ts - Buffer<ArrayBufferLike> incompatível com Buffer<ArrayBuffer> (type annotation explícita)
- [x] Fix: catalogVersion.ts - Map iteration sem downlevelIteration (usado Array.from)
- [x] Verificado: 0 erros TypeScript após correções
- [x] Verificado: build (pnpm build) passa com sucesso
- [x] Adicionar sub-seção "Conexão" no menu WhatsApp das Configurações (mostra card de conexão com API Oficial Meta e UAZAPI)
- [x] Fix: Build OOM (exit code 137) - otimizar Vite config com code-splitting para reduzir consumo de memória (React.lazy em 57 páginas)
- [x] Substituir loading visível por prefetch em background (chunks baixados automaticamente após page load)
- [x] Remover React.lazy das páginas principais (Dashboard, PDV, MesasComandas, Pedidos, Catalogo, Relatorios, Banking) para eliminar flash branco
- [x] Usar DashboardLayoutSkeleton (mesma tela de loading do login) como fallback do Suspense para páginas lazy
- [x] Fix: META_APP_ID não disponível no frontend - criado endpoint tRPC getMetaConfig que retorna appId e configId do servidor
- [x] Bug: Cancelar pedido no Mindi não está cancelando no iFood (aceitar funciona corretamente)
  - Análise: formato da API está correto (POST { "reason": "501" }), o problema era que erros da API do iFood eram silenciados
  - Fix: Backend agora retorna campo `ifoodWarning` quando cancelamento no iFood falha
  - Fix: Frontend exibe toast.warning com detalhes do erro do iFood (duração 8s)
  - O pedido continua sendo cancelado localmente mesmo se iFood rejeitar
- [x] Fix: API iFood exige campo `cancellationCode` no body (não `reason`) — corrigido de `{ reason: code }` para `{ cancellationCode: code }`
- [x] Alterar links 'Criar Menu' e 'Powered by Bigteck' no menu público para redirecionar para mindi.com.br
- [x] Fix: dispatchIfoodOrder agora envia body { "deliveredBy": "MERCHANT" } conforme documentação iFood
- [x] Adicionado ifoodWarning no markReadyAndAssign com toast de feedback no frontend
- [x] Fix: Despacho iFood agora chama readyToPickup ANTES de dispatch (fluxo completo: confirm → startPreparation → readyToPickup → dispatch)
- [x] Bug: Estabelecimento no plano Free (gratuito) está mostrando 'Teste Grátis (15 dias)' e botão trial no header - deveria mostrar plano Free sem trial
- [x] Fix: Link WhatsApp 'Falar com especialista' na landing page corrigido para número correto (5588999290000)
- [x] Fix: Botão 'Criar conta grátis' na seção CTA da landing page agora redireciona para https://app.mindi.com.br/criar-conta
- [x] Fix: Botões de planos na landing page agora redirecionam para app.mindi.com.br/criar-conta?plan=PLANO com plano pré-selecionado
- [x] Fix: Botão 'Sacola vazia' no menu público desktop deve ser vermelho (não verde) quando sacola está vazia
- [x] Efeito marquee/letreiro no nome do estabelecimento no menu público quando nome é longo (>18 chars) - rola da esquerda para direita no mobile
- [x] Salvar imagem de capa (cover image) preto e branco vintage para estabelecimento 210024 (Parada Obrigatória Burger)
- [x] Sincronizar itens do menu antigo (menu.mindi.com.br) para o novo (ID 210024): adicionadas categorias SMASH BURGUER (7 produtos) e SOBREMESA (3 produtos)
- [x] Pausar os 10 novos itens (SMASH BURGUER + SOBREMESA) no catálogo do estabelecimento 210024
- [x] Mostrar todos os menus na sidebar para plano Lite/Starter mas desabilitados (não clicáveis) com ícone de cadeado em vez de ocultar
- [x] Remover "(Paytime)" dos nomes dos métodos de pagamento no modal de escolha (PIX e Cartão)
- [x] Botão toggle no rodapé da sidebar para ocultar/mostrar menus bloqueados (com localStorage)
- [x] Mostrar sub-menus bloqueados nas Configurações com ícone de cadeado (em vez de ocultar)
- [x] Fix: Itens bloqueados na sidebar agora mais desbotados (opacity-40 + text-muted-foreground/50) para melhor distinção visual dos itens disponíveis
- [x] Bug: Calendário do filtro no Dashboard mobile aparece cortado pela metade (só mostra metade dos dias)
- [x] Botões Publicar/Descartar no mobile sempre visíveis (desabilitados quando sem alterações pendentes)
- [x] Bug: Produtos duplicados na sidebar de criar combo (filtrar apenas versão draft)
- [x] Migrar preferência 'Ocultar bloqueados' de localStorage para tabela user_preferences no banco
- [x] Bug: Filtro Dashboard mobile - mostrar presets (Hoje, Ontem, etc.) como chips horizontais no mobile
- [x] Bug: Popover do filtro Dashboard no mobile tem borda branca cortada na direita - precisa ficar centralizado/full-width no mobile
- [x] Feature: Taxa de entrega por raio (Km) - adicionar nova modalidade nas configurações
- [x] Feature: UI para cadastrar faixas de distância (km + valor) com botão adicionar/remover
- [x] Feature: Cálculo de distância real via Google Maps Distance Matrix no checkout
- [x] Feature: Aplicar taxa de entrega por raio automaticamente no checkout baseado na distância
- [x] Ao selecionar "Por Raio (Km)", verificar se lat/lng está definido - se não, abrir modal de mapa
- [x] Mostrar indicador de localização definida/não definida na seção "Por Raio"
- [x] Usar localização do card "Endereço do Estabelecimento" como fallback
- [x] Quando byRadius ativo, substituir formulário de endereço por campo único com autocomplete Google Places
- [x] Bloquear pedido fora da área - desabilitar botão finalizar e mostrar mensagem quando distância excede raio máximo
- [x] Bug: "Erro ao reordenar grupos" ao reordenar grupos de complementos de combo recém-criado
- [x] Bug: Banner "WhatsApp desconectado" aparece mesmo com WhatsApp conectado
- [x] Bloquear aba WhatsApp nas Configurações para planos Free e Starter (igual Impressora e Integrações)
- [x] Bug: "Erro ao atualizar grupo" ao alterar quantidade mín/máx de grupo de complementos de combo
- [x] Bug: Auditoria completa - TODAS as operações em grupos de complementos de combo dão erro (excluir item, adicionar item, reordenar itens, editar, toggle, etc.)
- [x] Bug: Pausar grupo de complemento do combo não funciona (toggleGroupActive)
- [x] Bug: Combo mostra "5 Complementos" no badge mas "Nenhum complemento configurado" ao expandir (causa: coluna isActive não existia no banco remoto, query falhava silenciosamente)
- [x] Bug: Editar combo e salvar re-insere comboGroups que foram excluídos (ao clicar Editar → Avançar → Salvar, o grupo deletado reaparece) — corrigido syncGroups para reconhecer comboGroups e não recriá-los como complementGroups
- [x] Bug: Reordenar grupos de complementos em combo reseta mín/máx para valores anteriores do servidor — corrigido adicionando campo minQuantity à tabela comboGroups e atualizando todos os routers para usar o valor real
- [x] Aumentar limite de complementos por grupo de 5 para 7 no plano free/trial
- [x] Melhorar mensagem de erro ao atingir limite de complementos para informar sobre limitação do plano
- [x] Alterar background dos toasts de notificação de branco para degradê vermelho para se destacar do fundo da plataforma
- [x] PDV: Ao clicar em Entrega, abrir modal com formulário completo (Dados do Cliente primeiro) em vez de começar pela seleção de bairro
- [x] PDV: Auto-selecionar bairro/taxa quando cliente existente é selecionado e tem bairro cadastrado (byNeighborhood)
- [x] Bug Cardápio Público: Botão "Próximo" no modal de Entrega e Pagamento bloqueado quando deliveryFeeType é byDistance, mesmo com campos preenchidos (estabelecimento 210023)
- [x] Bug Configurações: Ao definir localização via mapa, latitude/longitude não eram salvos no servidor (apenas no estado local) - corrigido adicionando autoSaveField no callback onAddressSelect
- [ ] Configurações: Notificações SMS devem vir desativadas por padrão ao criar nova conta
- [x] Criar-conta: Exibir os recursos dos planos conforme configurados no admin (banco de dados) em vez de lista hardcoded
- [x] Fix "Notificações SMS" card gating: locked only for Free/Starter, unlocked for Basic/Pro
- [x] Fix "Nota do Restaurante" card gating: locked only for Free, unlocked for Starter/Basic/Pro
- [x] Fix: Nota do Restaurante (estilo/cor) não refletia imediatamente no menu público - adicionado invalidatePublicMenuCache em savePublicNote, removePublicNote e update
- [x] Fix: Botão X de fechar notificação (toast) reposicionado para dentro do card, canto superior direito
- [x] Adicionar campo "Nome do titular PIX" no card Formas de Pagamento em Configurações
- [x] Usar pixHolderName na mensagem WhatsApp de PIX ao invés do nome do estabelecimento
- [x] Payment method fee configuration: DB columns (feePixOnline, feePixStatic, feeCard) in establishments table
- [x] Payment method fee configuration: Server procedures (getPaymentFees, setPaymentFees) in cashRegister router
- [x] Payment method fee configuration: Frontend sidebar (Sheet) with fee inputs for Pix online, Pix estático, Cartão
- [x] Payment method fee configuration: Net value display in payment breakdown rows (bruto - taxa = líquido)
- [x] Payment method fee configuration: Taxas button in Vendas por forma de pagamento card header
