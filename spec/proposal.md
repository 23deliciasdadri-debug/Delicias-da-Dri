# Proposta: Fase A - Fundamentos & Qualidade

## Objetivo
Garantir que o projeto tenha uma base confiável antes das próximas iterações: arquivos com encoding consistente em UTF-8, políticas de segurança (RLS) explícitas e documentadas, além de automações locais que impeçam merges sem lint/typecheck/build. Ao final da fase, qualquer contribuinte deve conseguir aplicar o script SQL no Supabase e executar `npm run verify` localmente com o mesmo comportamento da CI.

## Diagnóstico Atual
- Arquivos de especificação como `spec/roadmap.md` e `spec/schema_sql.md` apresentam caracteres corrompidos, não existe `.editorconfig` e não há garantia de que novos arquivos sigam UTF-8.
- O arquivo `spec/schema_sql.md` contém apenas parte das políticas (quotes e orders) e não orienta quem e como deve executar o script no Supabase.
- O README não explica o playbook de policies nem validações pós-execução.
- O `package.json` não possui um comando único que encadeie `lint`, `typecheck` e `build`, tampouco há ganchos locais (Husky/lefthook) que rodem esses passos antes de um push/merge.

## Entregáveis Principais
1. Repositório inteiro em UTF-8 (inclusive specs) e regra registrada em `.editorconfig`, acompanhada de um script que impede regressões de encoding.
2. `spec/schema_sql.md` reestruturado com playbook, matriz de acesso por papel e SQL completo habilitando RLS em `profiles`, `clients`, `products`, `quotes`, `quote_items` e `orders`.
3. README com seção “Playbook de Policies” explicando quando rodar o script, quem pode executá-lo e como validar permissões no Supabase.
4. Automação local `npm run verify` + gancho (ex.: Husky `pre-push`) rodando `npm run lint && npm run typecheck && npm run build`, com instruções de uso/bypass.

## Estratégia por Pilar

### 1. Normalização de encoding + `.editorconfig`
- Inventariar arquivos de texto (`spec/`, `src/`, configs) usando um script Node (`scripts/check-encoding.mjs`) que rejeita qualquer arquivo detectado como não UTF-8 e ignora `dist/` e `node_modules/`.
- Converter arquivos problemáticos com `iconv` ou `Get-Content -Encoding`/`Set-Content -Encoding utf8`, priorizando specs e configs. Durante a conversão, revisar termos como “Produ��o” e reescrever corretamente.
- Criar `.editorconfig` com `charset = utf-8`, `end_of_line = lf`, `indent_style/indent_size` para TS/TSX, Markdown e JSON. Registrar no README como aplicar no editor.
- Adicionar o script `npm run check-encoding` (chamando `node scripts/check-encoding.mjs`) e garantir que ele rode no mesmo gancho de verificação antes do merge.

### 2. RLS completo no `spec/schema_sql.md`
- Reescrever o arquivo em Markdown estruturado: resumo do objetivo, instruções de uso, matriz de papéis e blocos ` ```sql ` por tabela.
- Para cada tabela:
  - `profiles`: leitura/escrita apenas do próprio registro.
  - `clients`/`products`: leitura para todos os papéis autenticados; mutações restritas a `admin`.
  - `quotes`/`quote_items`: leitura para `admin|kitchen|delivery`, inserção/edição/deleção apenas `admin`.
  - `orders`: políticas específicas por status (admin total, kitchen controla `Aprovado`→`Pronto para Entrega`, delivery controla `Pronto para Entrega`→`Entregue`). Incluir `force row level security`.
- Sempre dropar políticas antigas antes de criar novas, mantendo nomes legíveis e consistentes com os papéis.

### 3. Playbook de policies (spec + README)
- Incluir no topo de `spec/schema_sql.md`:
  - Quem está autorizado a rodar (admin do Supabase com `service_role`).
  - Passo a passo (SQL Editor, copiar blocos por tabela, validar com `select tablename, is_rls_enabled ...`).
  - Checklist de validação manual (ex.: tentar inserir cliente com usuário `kitchen` para garantir bloqueio).
- No README, adicionar seção resumida apontando para `spec/schema_sql.md`, descrevendo:
  - Quando rerodar o script (mudança de role/tabela, novos ambientes).
  - Comandos SQL auxiliares (`select * from pg_policies where schemaname='public'`).
  - Como reverter (rodar novamente o script oficial).

### 4. Automação lint/typecheck/build no “CI local”
- Criar script `npm run verify` que executa `npm run lint && npm run typecheck && npm run build`.
- Configurar Husky (ou Lefthook) com `pre-push` chamando `npm run check-encoding && npm run verify`. Documentar como instalar Husky (`npm run prepare`) e como pular (`HUSKY=0 git push`).
- Opcional: expor workflow GitHub Actions reutilizando `npm run verify` para manter paridade local/CI.
- Atualizar README > “Como contribuir” com instruções para instalar dependências, habilitar Husky e interpretar falhas do gancho.

## Sequência Recomendada
1. Normalizar encoding + criar `.editorconfig` (evita retrabalho posterior).
2. Reescrever `spec/schema_sql.md` com playbook e novos blocos SQL.
3. Atualizar README (referenciando o arquivo já corrigido).
4. Implementar `npm run verify`, scripts auxiliares e Husky `pre-push`, validando tudo com `npm run verify`.

## Validação e Critérios de Aceite
- `git status` sem arquivos reconvertidos de forma parcial e `scripts/check-encoding.mjs` retornando exit code 0.
- Execução bem-sucedida do script SQL no Supabase seguida de `select tablename, is_rls_enabled from pg_tables where schemaname='public'` com todas as tabelas marcadas como true.
- README descrevendo claramente o processo e apontando para o spec.
- `npm run verify` executando os três comandos em cadeia localmente e no gancho `pre-push`.

## Riscos e Mitigações
- **Arquivos binários acidentalmente convertidos:** limitar o script de conversão a extensões conhecidas e manter backups temporários.
- **Lock de acesso após novas policies:** testar cada papel em ambiente de staging via Supabase Auth e manter as políticas agrupadas por tabela para facilitar rollback.
- **Ganchos demorados:** documentar como usar `SKIP_VERIFY=1` (ou variável similar) em hotfixes, mas exigir justificativa no PR.
- **Ambientes divergentes:** registrar no README que qualquer novo ambiente (ex.: preview) deve rodar o mesmo `spec/schema_sql.md` para manter paridade.
