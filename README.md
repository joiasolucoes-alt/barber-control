# André Garcia Barber Shop · Barber Control

Sistema web responsivo para **controle de clientes e atendimentos já realizados** em uma barbearia.

A interface usa a identidade visual oficial da **André Garcia Barber Shop** e pode ser instalada no celular como PWA.

> Este projeto **não é uma plataforma de agendamento**. Não existem reservas, horários
> disponíveis, confirmação de presença ou atendimentos futuros. Tudo o que é registrado
> aqui já aconteceu.

## O que dá para fazer

- Cadastrar, visualizar, editar e inativar clientes.
- Acompanhar a **situação de cada cliente** (novo, recorrente, em risco, perdido),
  calculada a partir do ritmo de retorno dele.
- Ver quem está atrasado e falar com o cliente pelo WhatsApp em um clique.
- Consultar os aniversariantes do mês.
- Cadastrar e gerenciar os serviços oferecidos.
- Registrar visitas (atendimentos realizados) com **um ou vários serviços na mesma visita**.
- Consultar todos os clientes atendidos em uma data específica.
- Ver o histórico completo de cada cliente.
- Acompanhar indicadores e gráficos com filtros de 7, 30, 90, 365 dias e período total.

## Stack

| Camada | Tecnologia |
| --- | --- |
| UI | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS (tema preto/grafite/branco com dourado) |
| Componentes | shadcn/ui sobre Radix UI |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |
| Datas | date-fns (locale pt-BR) |
| Dados | Repositório local (mock + localStorage) ou Supabase |

## Como rodar

```bash
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173`.

Outros scripts:

```bash
npm run build     # build de produção
npm run preview   # serve o build
npm run lint      # checagem de tipos (tsc --noEmit)
npm run test      # testes automatizados das regras de negócio
```

## Camada de dados

Toda a UI conversa com um único contrato: [`BarberRepository`](src/data/repository.ts).

- **Com Supabase configurado** (situação atual) → `SupabaseRepository`
  (src/data/supabase-repository.ts).
- **Sem Supabase configurado** → `LocalRepository` (src/data/local-repository.ts): base de
  demonstração gerada por semente fixa, persistida em `localStorage`. Serve de fallback e
  permite rodar o projeto sem credenciais.

A escolha acontece em [`src/data/index.ts`](src/data/index.ts) e depende apenas das variáveis
de ambiente — nenhuma tela precisa mudar.

### Supabase

O schema consolidado e versionado está em [`supabase/schema.sql`](supabase/schema.sql).
O projeto remoto deve ser ativado, auditado e receber esse schema como migration antes
de ser usado em produção; o repositório não presume que o estado remoto esteja sincronizado.

Para rodar em outra máquina, copie `.env.example` para `.env` e preencha:

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<chave publicável>
```

O `.env` é ignorado pelo Git. O rodapé do menu lateral mostra qual fonte de dados
está ativa.

> ⚠️ **Segurança — pendência conhecida da v1**
> Não há autenticação ainda. O RLS está habilitado, mas com policies permissivas
> (`using (true)`) para a role `anon`: quem tiver a chave publicável lê e escreve tudo.
> Ao adicionar login, troque as policies `*_acesso_publico_v1` por regras baseadas em
> `auth.uid()` antes de expor a aplicação publicamente.

O schema declara `GRANT`s de Data API explicitamente, conforme a mudança de padrão do Supabase em 2026. As permissões e as policies RLS devem ser migradas juntas quando o login for introduzido.

## Modelo de dados

```
clientes (id, nome, telefone, data_nascimento, observacoes, status, created_at, updated_at)
servicos (id, nome, descricao, preco, duracao_estimada, status, created_at, updated_at)
visitas  (id, cliente_id → clientes, data_atendimento, observacoes, created_at, updated_at)
visita_servicos (id, visita_id → visitas, servico_id → servicos)
```

- Um cliente possui várias visitas; uma visita pertence a um único cliente.
- Uma visita possui vários serviços e um serviço aparece em várias visitas
  (relação N:N via `visita_servicos`).

## Estrutura

```
src/
├── components/
│   ├── ui/           # primitivos shadcn/ui
│   ├── layout/       # shell, menu lateral, navegação
│   ├── common/       # blocos reutilizáveis (StatCard, EmptyState, DatePicker, ...)
│   ├── dashboard/    # cards, gráficos e filtros de período
│   ├── clientes/     # formulário e seletor de cliente
│   ├── visitas/      # formulário, detalhe e seleção de serviços
│   └── servicos/     # formulário de serviço
├── data/             # contrato do repositório + implementações
├── hooks/            # estado global, tema, debounce, media query
├── lib/              # formatação pt-BR, métricas e validações
├── pages/            # Dashboard, Clientes, Detalhe, Visitas, Serviços
└── types/            # modelo de domínio e períodos
```

## Convenções

- Textos, rótulos e mensagens em **português do Brasil**.
- Datas em `dd/MM/aaaa` e valores em `R$` via `Intl`.
- Campos do domínio em `snake_case`, iguais aos do banco; código da aplicação em
  `camelCase`.
- "Clientes atendidos" sempre conta **clientes distintos** no período — o mesmo cliente
  nunca é contado duas vezes no mesmo atendimento.
- `status` (ativo/inativo) é uma decisão manual: arquivar um cliente. **Situação** é
  calculada e nunca é gravada no banco. As duas coisas respondem perguntas diferentes.
- Telefone/WhatsApp é opcional. Cliente sem telefone fica de fora das ações de retorno.

## Como a situação do cliente é calculada

Em [`src/lib/clientes-analise.ts`](src/lib/clientes-analise.ts). O ritmo é a média de dias
entre as visitas do próprio cliente, limitada entre 7 e 120 dias. Quem tem uma visita só
usa 45 dias como referência até criar histórico.

| Situação | Regra |
| --- | --- |
| Sem visitas | Cadastrado, nenhum atendimento registrado |
| Novo | Uma visita, dentro de 1,5× o ritmo |
| Recorrente | Duas ou mais visitas, dentro de 1,5× o ritmo |
| Em risco | Passou de 1,5× o ritmo |
| Perdido | Passou de 3× o ritmo |

A lista "precisam de atenção" ordena por número de visitas: cliente frequente que sumiu
vale mais um contato do que quem veio uma vez. Lista curta é lista que se usa.
