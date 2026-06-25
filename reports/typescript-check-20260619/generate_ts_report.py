#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

BASE = Path('/home/ubuntu/cardapio-admin/reports/typescript-check-20260619')
LOG = BASE / 'tsc-no-pretty.log'
REPORT = BASE / 'relatorio-erros-typescript-20260619.md'
CSV_PATH = BASE / 'erros-typescript-20260619.csv'
JSON_PATH = BASE / 'erros-typescript-20260619.json'

HEADER_RE = re.compile(r'^(?P<file>.+?)\((?P<line>\d+),(?P<col>\d+)\): error (?P<code>TS\d+): (?P<message>.*)$')

CODE_DESCRIPTIONS = {
    'TS2322': ('Incompatibilidade de atribuição', 'Um valor de tipo mais amplo ou opcional está sendo atribuído a um tipo mais restrito.', 'Alta quando envolve estado/props de UI; corrigir normalizando `undefined` para `null`, ajustando tipos ou garantindo valor obrigatório.'),
    'TS2353': ('Propriedade desconhecida em objeto literal', 'Um objeto está recebendo uma chave que não existe no tipo esperado.', 'Alta quando indica desalinhamento entre frontend/backend/schema; alinhar contrato ou remover a chave.'),
    'TS2304': ('Identificador não encontrado', 'O código referencia variável, componente ou ícone não importado/declarado.', 'Correção geralmente rápida; importar o símbolo correto ou trocar por nome existente.'),
    'TS2339': ('Propriedade inexistente no tipo', 'O código acessa campo que não faz parte do tipo inferido/declarado.', 'Alta quando envolve payloads de API; alinhar nomenclatura, DTOs e schema compartilhado.'),
    'TS2551': ('Possível erro de nome de propriedade', 'O TypeScript encontrou uma propriedade parecida com a pretendida.', 'Correção direta: trocar para o nome sugerido ou ajustar o tipo se o nome legado ainda for necessário.'),
    'TS2802': ('Iteração incompatível com target do TypeScript', 'O código itera Map/Iterator, mas a configuração de compilação não permite esse padrão no target atual.', 'Corrigir com `Array.from(...)`, mudança de target/lib, ou `downlevelIteration`, avaliando impacto do build.'),
    'TS18047': ('Possível valor nulo', 'Um objeto possivelmente `null` está sendo usado sem guarda de nulidade.', 'Alta em código de banco; adicionar guard clause, narrowing ou garantir inicialização antes do uso.'),
    'TS2769': ('Nenhuma sobrecarga compatível', 'A chamada de função não corresponde às assinaturas aceitas pelo pacote/tipo.', 'Corrigir tipos literais/enum, casts seguros ou normalização de valores antes da chamada.'),
    'TS2345': ('Argumento incompatível', 'Um argumento passado para função não corresponde ao parâmetro esperado.', 'Adicionar fallback/default, validar `undefined` ou ajustar assinatura.'),
}

AREA_RULES = [
    ('client/src/', 'Frontend React'),
    ('server/routers/', 'Backend tRPC/rotas'),
    ('server/_core/', 'Backend core/runtime'),
    ('server/db.ts', 'Backend banco de dados'),
    ('server/og-image.ts', 'Backend imagem dinâmica'),
]

MODULE_RULES = [
    ('AdminLayout', 'Layout administrativo'),
    ('ImageEnhanceModal', 'Modal de melhoria de imagem'),
    ('WhatsAppTab', 'Configurações WhatsApp no frontend'),
    ('LoyaltyComponents', 'Componentes de fidelidade/menu público'),
    ('Clientes', 'Página de clientes/analytics'),
    ('Cozinha', 'Tela de cozinha'),
    ('PublicMenu', 'Menu público'),
    ('server/_core/index.ts', 'Servidor principal/core'),
    ('server/_core/sse.ts', 'SSE/autenticação em tempo real'),
    ('server/db.ts', 'Acesso a dados/queries'),
    ('server/og-image.ts', 'Geração de imagem OG'),
    ('aiCredits', 'Créditos IA/Pagamentos Paytime'),
    ('catalogVersion', 'Versionamento de catálogo'),
    ('printer', 'Impressão de pedidos'),
    ('whatsapp', 'Configuração WhatsApp backend'),
]

def area_for(path: str) -> str:
    for prefix, area in AREA_RULES:
        if path.startswith(prefix) or path == prefix:
            return area
    return 'Outro'

def module_for(path: str) -> str:
    for needle, module in MODULE_RULES:
        if needle in path:
            return module
    return Path(path).stem

def classify_priority(path: str, code: str, message: str) -> str:
    if path.startswith('server/db.ts') or 'PaytimeTransaction' in message or 'whatsapp' in path.lower():
        return 'Alta'
    if code in {'TS2304', 'TS2551'}:
        return 'Média'
    if path.startswith('client/src/'):
        return 'Média'
    return 'Média'

def probable_cause(code: str, message: str, path: str) -> str:
    if 'PaytimeTransaction' in message:
        return 'Tipo `PaytimeTransaction` está desatualizado em relação ao payload usado pelo código, especialmente campos de pagamento/metadados.'
    if 'notifyOnOutForDelivery' in message:
        return 'O contrato/tipo de configuração WhatsApp ainda não inclui o campo `notifyOnOutForDelivery`, mas frontend/backend já tentam usá-lo.'
    if 'clientesFrequentes' in message or 'diaMaisPedem' in message or 'itemMaisPedido' in message or 'preferencias' in message:
        return 'A página usa nomes em português de um contrato que atualmente expõe nomes em inglês, como `frequentCustomers`, `peakDay`, `topProduct` e `preferences`.'
    if 'UtensilsCrossed' in message or 'RotateCcw' in message or 'ShoppingBag' in message:
        return 'Ícones/componentes foram referenciados sem importação ou com nome diferente do exportado pela biblioteca.'
    if "'db' is possibly 'null'" in message:
        return 'A instância `db` é tipada como possivelmente nula e está sendo usada sem guarda local de nulidade.'
    if 'pending_confirmation' in message:
        return 'O enum `OrderStatus` inclui estados adicionais que o componente/tipo local ainda não aceita.'
    if 'categoryId' in message:
        return 'O código consome `categoryId` em objetos de item/produto cujo tipo declarado não contém esse campo.'
    if 'No overload matches this call' in message or 'delivered' in message or 'string[]' in message:
        return 'Query Drizzle usa valores de status como `string[]` ou status legado `delivered` fora do enum tipado atual.'
    if code == 'TS2345':
        return 'Valor opcional está sendo passado para uma função que exige mapa definido; neste caso, `Map<...> | undefined` chega onde a função exige `Map<...>`.'
    if code == 'TS2802' or 'MapIterator' in message or "can only be iterated" in message:
        return 'Há iteração direta sobre `Map`/iterator incompatível com a configuração atual de target/downlevel do TypeScript.'
    if code == 'TS2322':
        return 'Valor opcional ou union type está sendo passado para uma variável/propriedade com tipo mais restrito.'
    return CODE_DESCRIPTIONS.get(code, ('Erro TypeScript', 'Requer inspeção do trecho indicado.', 'Corrigir conforme contrato do tipo.'))[1]

def recommendation(code: str, message: str, path: str) -> str:
    if 'PaytimeTransaction' in message:
        return 'Atualizar a interface/tipo `PaytimeTransaction` para incluir `authentication_url` e `info_additional` com tipos seguros, ou adaptar o código para o contrato real retornado pela Paytime.'
    if 'notifyOnOutForDelivery' in message:
        return 'Adicionar `notifyOnOutForDelivery` ao schema/tipo compartilhado de WhatsApp e persistência, ou remover o campo dos objetos enviados se a feature não estiver ativa.'
    if 'clientesFrequentes' in message or 'diaMaisPedem' in message or 'itemMaisPedido' in message or 'preferencias' in message:
        return 'Padronizar os acessos para os campos atuais em inglês ou criar adapter que traduza o payload antigo para o novo formato antes da renderização.'
    if 'UtensilsCrossed' in message or 'RotateCcw' in message or 'ShoppingBag' in message:
        return 'Importar os ícones corretos no topo do arquivo ou substituir por ícones já importados/exportados.'
    if "'db' is possibly 'null'" in message:
        return 'Inserir guarda explícita antes das queries, criar helper que retorna `db` não nulo, ou ajustar inicialização/tipagem para garantir disponibilidade.'
    if 'pending_confirmation' in message:
        return 'Expandir o tipo aceito pelo componente para todos os estados do enum ou mapear estados não suportados para uma categoria visual válida.'
    if 'categoryId' in message:
        return 'Incluir `categoryId` no tipo/seleção dos itens quando necessário ou remover o acesso onde o campo não existe.'
    if 'No overload matches this call' in message or 'delivered' in message or 'string[]' in message:
        return 'Tipar arrays de status como union literal do enum aceito e substituir status legado `delivered` por `completed` ou outro status válido do schema.'
    if code == 'TS2345':
        return 'Fornecer `new Map()` como fallback quando o valor puder ser `undefined`, ou alterar a função chamada para aceitar ausência do mapa.'
    if code == 'TS2802' or 'MapIterator' in message or "can only be iterated" in message:
        return 'Trocar iteração direta por `Array.from(map.entries())`/`Array.from(iterator)` ou revisar `tsconfig` para target/lib compatível.'
    if code == 'TS2322':
        return 'Normalizar `undefined` para `null`/valor padrão ou ampliar o tipo alvo quando o valor opcional for realmente válido.'
    return CODE_DESCRIPTIONS.get(code, ('Erro TypeScript', 'Requer inspeção.', 'Corrigir conforme contrato do tipo.'))[2]

lines = LOG.read_text(encoding='utf-8', errors='replace').splitlines()
errors = []
current = None
for line in lines:
    m = HEADER_RE.match(line)
    if m:
        if current:
            errors.append(current)
        data = m.groupdict()
        code = data['code']
        current = {
            'file': data['file'],
            'line': int(data['line']),
            'column': int(data['col']),
            'code': code,
            'message': data['message'].strip(),
            'details': [],
        }
    elif current and line.strip():
        current['details'].append(line.strip())
if current:
    errors.append(current)

for idx, err in enumerate(errors, start=1):
    desc, meaning, generic_rec = CODE_DESCRIPTIONS.get(err['code'], ('Erro TypeScript', 'Requer análise individual.', 'Corrigir conforme tipo esperado.'))
    err['id'] = idx
    err['area'] = area_for(err['file'])
    err['module'] = module_for(err['file'])
    err['category'] = desc
    err['meaning'] = meaning
    full_message = (err['message'] + ' ' + ' '.join(err['details'])).strip()
    err['priority'] = classify_priority(err['file'], err['code'], full_message)
    err['probable_cause'] = probable_cause(err['code'], full_message, err['file'])
    err['recommendation'] = recommendation(err['code'], full_message, err['file'])
    err['details_text'] = ' '.join(err['details'])

by_file = Counter(e['file'] for e in errors)
by_code = Counter(e['code'] for e in errors)
by_area = Counter(e['area'] for e in errors)

with CSV_PATH.open('w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['id','file','line','column','code','category','priority','message','details_text','probable_cause','recommendation'])
    writer.writeheader()
    for e in errors:
        writer.writerow({k: e.get(k, '') for k in writer.fieldnames})

JSON_PATH.write_text(json.dumps(errors, ensure_ascii=False, indent=2), encoding='utf-8')

md = []
md.append('# Relatório técnico dos erros TypeScript — cardapio-admin\n')
md.append('**Data da coleta:** 2026-06-19  \n')
md.append('**Ambiente analisado:** servidor remoto `35.231.96.229`, projeto `/home/ubuntu/cardapio-admin`  \n')
md.append('**Comando principal:** `pnpm run check` / `tsc --noEmit --pretty false`  \n')
md.append('**Escopo:** diagnóstico estático TypeScript; nenhum arquivo de código, `.env`, banco de dados, Nginx, DNS ou firewall foi alterado para produzir este relatório.\n')
md.append('> A validação TypeScript retornou **45 erros em 15 arquivos**. O build de produção executado anteriormente passou, mas o check estrito continua falhando; isso indica dívida técnica de tipagem que deve ser tratada em PR/manutenção própria antes de depender do `pnpm run check` como gate obrigatório de deploy.\n')

md.append('## Resumo executivo\n')
md.append('| Métrica | Valor |\n|---|---:|')
md.append(f'| Total de erros TypeScript | {len(errors)} |')
md.append(f'| Arquivos afetados | {len(by_file)} |')
md.append(f'| Códigos TypeScript distintos | {len(by_code)} |')
md.append(f'| Erros em frontend | {sum(v for k, v in by_area.items() if k == "Frontend React")} |')
md.append(f'| Erros em backend | {len(errors) - sum(v for k, v in by_area.items() if k == "Frontend React")} |\n')

md.append('## Distribuição por arquivo\n')
md.append('| Arquivo | Área | Módulo funcional | Erros | Prioridade sugerida |\n|---|---|---|---:|---|')
for file, count in sorted(by_file.items(), key=lambda kv: (-kv[1], kv[0])):
    file_errors = [e for e in errors if e['file'] == file]
    priority = 'Alta' if any(e['priority'] == 'Alta' for e in file_errors) else 'Média'
    md.append(f'| `{file}` | {area_for(file)} | {module_for(file)} | {count} | {priority} |')
md.append('')

md.append('## Distribuição por código de erro\n')
md.append('| Código | Categoria | Ocorrências | Leitura técnica |\n|---|---|---:|---|')
for code, count in sorted(by_code.items(), key=lambda kv: (-kv[1], kv[0])):
    desc, meaning, _ = CODE_DESCRIPTIONS.get(code, ('Erro TypeScript', 'Requer análise individual.', ''))
    md.append(f'| `{code}` | {desc} | {count} | {meaning} |')
md.append('')

md.append('## Principais agrupamentos de causa\n')
md.append('| Agrupamento | Arquivos principais | Evidência | Ação recomendada |\n|---|---|---|---|')
md.append('| Contratos de API/payload desalinhados | `client/src/pages/Clientes.tsx`, `server/routers/aiCredits.ts`, `server/_core/index.ts`, `server/routers/whatsapp.ts`, `client/src/components/WhatsAppTab.tsx` | Acessos a propriedades inexistentes ou renomeadas, como `clientesFrequentes`, `preferencias`, `info_additional` e `notifyOnOutForDelivery`. | Padronizar DTOs/schemas compartilhados e adaptar nomes legados para os nomes atuais antes da renderização ou persistência. |')
md.append('| Tipagem de banco/queries Drizzle | `server/db.ts` | `db` possivelmente nulo e chamadas com status fora do enum aceito. | Criar guarda de `db`, helper não nulo e tipar arrays de status com literals do enum. |')
md.append('| Componentes frontend com tipos incompletos | `AdminLayout.tsx`, `ImageEnhanceModal.tsx`, `Cozinha.tsx`, `PublicMenu.tsx` | Valores opcionais ou estados extras não aceitos pelos tipos locais. | Normalizar valores, ampliar unions onde fizer sentido e atualizar tipos de props/estado. |')
md.append('| Imports/ícones ausentes | `LoyaltyComponents.tsx` | `UtensilsCrossed`, `RotateCcw` e `ShoppingBag` não encontrados. | Importar símbolos corretos ou substituir por ícones existentes. |')
md.append('| Configuração/compatibilidade de iteração | `server/_core/sse.ts`, `server/og-image.ts` | Iteração direta sobre `Map`/`MapIterator` incompatível com o target atual. | Usar `Array.from(...)` ou revisar `target`/`downlevelIteration`. |\n')

md.append('## Lista detalhada dos 45 erros\n')
md.append('| # | Arquivo | Linha:Coluna | Código | Categoria | Mensagem | Causa provável | Recomendação objetiva |\n|---:|---|---:|---|---|---|---|---|')
for e in errors:
    msg = e['message'].replace('|', '\\|')
    if e['details_text']:
        msg += '<br><br>Detalhe: ' + e['details_text'].replace('|', '\\|')
    md.append(f"| {e['id']} | `{e['file']}` | {e['line']}:{e['column']} | `{e['code']}` | {e['category']} | {msg} | {e['probable_cause'].replace('|', '\\|')} | {e['recommendation'].replace('|', '\\|')} |")
md.append('')

md.append('## Ordem sugerida de correção\n')
md.append('| Ordem | Grupo | Motivo | Resultado esperado |\n|---:|---|---|---|')
md.append('| 1 | `server/db.ts` | Concentra 12 erros e envolve acesso a dados/status de pedidos. | Reduzir risco em queries e remover a maior concentração de falhas. |')
md.append('| 2 | Tipos Paytime/AI Credits | `PaytimeTransaction` gera erros em dois pontos do backend. | Alinhar pagamentos/créditos IA ao payload real. |')
md.append('| 3 | Contrato WhatsApp `notifyOnOutForDelivery` | Erro aparece no frontend e backend. | Sincronizar configuração de notificação de saída para entrega. |')
md.append('| 4 | `client/src/pages/Clientes.tsx` | Oito erros parecem resultado de renomeação de campos. | Corrigir analytics de clientes com baixo impacto estrutural. |')
md.append('| 5 | Erros pontuais de UI/imports | Ícones ausentes, valores opcionais e unions incompletas. | Eliminar erros remanescentes rapidamente. |\n')

md.append('## Observações operacionais\n')
md.append('O relatório foi produzido a partir dos logs salvos em `reports/typescript-check-20260619/`. A saída bruta do `pnpm run check` foi preservada em `pnpm-run-check.raw.log`, e a saída parseável foi preservada em `tsc-no-pretty.log`. Como o objetivo era diagnóstico, nenhuma correção de código foi aplicada.\n')

REPORT.write_text('\n'.join(md), encoding='utf-8')
print(REPORT)
print(CSV_PATH)
print(JSON_PATH)
print(f'TOTAL_ERRORS={len(errors)}')
print(f'TOTAL_FILES={len(by_file)}')
