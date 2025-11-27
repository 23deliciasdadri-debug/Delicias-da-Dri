# Delicias da Dri

Painel administrativo em React + Vite para gerir pedidos, orçamentos e produtos da confeitaria. O MVP esta sendo estruturado em fases, com Supabase como backend.

## Requisitos

- Node.js 18+
- Variaveis `GEMINI_API_KEY`, `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` definidas em `.env.local`

### Configurando o `.env.local`

```
GEMINI_API_KEY=PLACEHOLDER_API_KEY               # pode ficar vazio se você não usa fluxos AI
VITE_SUPABASE_URL=https://<PROJECT>.supabase.co  # URL do seu projeto Supabase
VITE_SUPABASE_ANON_KEY=seu_anon_key              # chave anon gerada pelo Supabase
```

> As chaves do Supabase sao obrigatorias a partir desta fase. Crie um projeto, copie os valores em **Settings -> API** e atualize o arquivo antes de rodar `npm run dev`.

## Scripts

- `npm install`: instala dependencias.
- `npm run dev`: sobe o servidor de desenvolvimento.
- `npm run build`: gera o bundle de produção.
- `npm run preview`: valida o build localmente apos `npm run build`.
- `npm run lint`: executa ESLint em todos os arquivos `.ts/.tsx`.
- `npm run format`: aplica Prettier no projeto.
- `npm run format:check`: verifica se o formato esta em conformidade sem sobrescrever arquivos.
- `npm run typecheck`: roda o TypeScript (`tsc --noEmit`) para garantir tipagem valida.

## Estrutura de pastas

```
.
|-- index.html
|-- src
|   |-- App.tsx
|   |-- main.tsx
|   |-- assets/            # arquivos estaticos (imagens, fontes)
|   |-- components/        # componentes reutilizaveis (layout, ui)
|   |-- features/          # paginas e fluxos de negocio
|   |-- hooks/             # hooks customizados
|   |-- lib/               # utilitarios globais (ex: helpers de estilo)
|   |-- providers/         # provedores/contextos React
|   |-- services/          # integrações externas (Supabase, APIs)
|   |-- styles/            # estilos globais
|   |-- types/             # definições de tipos compartilhados
|   `-- utils/             # funções auxiliares puras
`-- spec/                  # documentação e planejamento (roadmap, proposals, tasks)
```

## Convenções atuais

- Imports absolutos com prefixo `@/` apontam para `src/`.
- Estilos globais residem em `src/styles/index.css` e sao construidos via Tailwind + PostCSS (sem dependencia de CDN).
- ESLint (+ Prettier) sao a base para padrao de codigo (aplicados sobre `src/` e arquivos de config na raiz); use `npm run lint`/`npm run format` antes de abrir PRs.
- Pastas `providers/`, `services/`, `types/` e `utils/` possuem READMEs descrevendo o proposito ate receberem implementações.

## Configurando o Supabase

- Copie o conteudo de `spec/schema_sql.md` para o SQL Editor e execute cada bloco (extensoes, tabelas, triggers/policies, seeds) no modo "Run as owner".
- Crie usuários em **Auth -> Users** (ex.: <admin@delicias.com>) e depois execute os `UPDATE` em `profiles` para ajustar o campo `role`.
- Apos rodar os seeds, confirme que `clients`, `products`, `quotes`, `quote_items` e `orders` possuem registros para testes locais.
- Ajuste as variaveis do `.env.local` com a URL/anon key do seu projeto antes de iniciar `npm run dev`.

## Papéis e permissões

| Papel     | Pode acessar / editar                                                                                                                        | Restrições principais                                                                                                                                                                             |
|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `admin`   | CRUD completo de produtos, clientes, orçamentos e pedidos, criar novos pedidos/orçamentos, alterar qualquer status.                           | Nenhuma restrição de UI/RLS além das políticas padrão do Supabase.                                                                                                                                |
| `kitchen` | Visualiza pedidos em **Aprovado** e **Em Produção**; pode mover `Aprovado → Em Produção` e `Em Produção → Pronto para Entrega`.               | Não consegue criar/editar produtos, clientes ou orçamentos; não vê pedidos finalizados ou em entrega; não pode editar status fora dessas transições (bloqueado por RLS e pela interface).          |
| `delivery`| Visualiza pedidos em **Pronto para Entrega** e **Em Entrega**; pode mover `Pronto para Entrega → Em Entrega` e `Em Entrega → Entregue`.       | Não acessa módulos de cadastro; não vê pedidos em produção/aprovados; não edita status anteriores; dashboard mostra apenas os pedidos que o papel consegue enxergar de acordo com as políticas RLS. |

> Dica: após criar um usuário em Auth, atualize o campo `profiles.role` manualmente via SQL ou Table Editor para alternar entre os cenários acima.

## Fluxo operacional sugerido (E2E)

1. **Catálogo**: como `admin`, cadastre/edite produtos em `Produtos`. Os demais papéis não enxergam o modal de edição.
2. **Clientes**: ainda como `admin`, cadastre o cliente no módulo `Clientes`.
3. **Orçamento**: em `Orçamentos`, busque o cliente e monte os itens reais (produtos + componentes). Salve e aprove.
4. **Pedido**: a partir do orçamento aprovado, gere o pedido (ou faça manualmente no Supabase) e valide que ele aparece no Kanban de `Pedidos`.
5. **Fluxo de status**: troque para um usuário `kitchen`, realize as duas transições permitidas; troque para `delivery` e finalize a entrega.
6. **Dashboard**: volte como `admin` e atualize o seletor de período – os KPIs e o gráfico usarão os dados reais dos pedidos entregues nesse fluxo.

Esse roteiro é o mesmo usado na validação manual da fase. Se qualquer etapa falhar, revise o módulo correspondente antes de liberar a versão.

## Checklist de validação

Sempre rodar antes de abrir PR ou liberar versão:

```
npm run lint
npm run typecheck
npm run build
```

> Após os comandos acima, execute o fluxo operacional sugerido para garantir que produto → cliente → orçamento → pedido → dashboard esteja íntegro.

## Desenvolvimento atual

- Fase 0 concluida (pipeline local, lint/format, typecheck).
- Fase 1: autentição real com Supabase e seeds registrados; etapas seguintes abordam CRUD dos modulos principais (ver `spec/roadmap.md`).
