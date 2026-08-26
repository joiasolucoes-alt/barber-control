-- Barber Control — schema aplicado no projeto Supabase `barber-control`.
-- O schema não inclui carga inicial: clientes, serviços e visitas começam vazios.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'status_registro') then
    create type status_registro as enum ('ativo', 'inativo');
  end if;
end
$$;

-- Clientes ------------------------------------------------------------------
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text, -- opcional: telefone/WhatsApp
  data_nascimento date,
  observacoes text,
  status status_registro not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clientes_nome_idx on public.clientes (nome);
create index if not exists clientes_telefone_idx on public.clientes (telefone);

alter table public.clientes drop constraint if exists clientes_nome_tamanho_check;
alter table public.clientes add constraint clientes_nome_tamanho_check
  check (char_length(trim(nome)) between 3 and 120);
alter table public.clientes drop constraint if exists clientes_telefone_tamanho_check;
alter table public.clientes add constraint clientes_telefone_tamanho_check
  check (telefone is null or char_length(telefone) <= 25);
alter table public.clientes drop constraint if exists clientes_nascimento_check;
alter table public.clientes add constraint clientes_nascimento_check
  check (data_nascimento is null or data_nascimento <= current_date);
alter table public.clientes drop constraint if exists clientes_observacoes_tamanho_check;
alter table public.clientes add constraint clientes_observacoes_tamanho_check
  check (observacoes is null or char_length(observacoes) <= 500);

-- Serviços ------------------------------------------------------------------
create table if not exists public.servicos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  preco numeric(10, 2),
  duracao_estimada integer, -- minutos
  status status_registro not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists servicos_nome_unico_idx on public.servicos (lower(trim(nome)));
alter table public.servicos drop constraint if exists servicos_nome_tamanho_check;
alter table public.servicos add constraint servicos_nome_tamanho_check
  check (char_length(trim(nome)) between 2 and 80);
alter table public.servicos drop constraint if exists servicos_descricao_tamanho_check;
alter table public.servicos add constraint servicos_descricao_tamanho_check
  check (descricao is null or char_length(descricao) <= 300);
alter table public.servicos drop constraint if exists servicos_preco_check;
alter table public.servicos add constraint servicos_preco_check
  check (preco is null or preco between 0 and 999999.99);
alter table public.servicos drop constraint if exists servicos_duracao_check;
alter table public.servicos add constraint servicos_duracao_check
  check (duracao_estimada is null or duracao_estimada between 0 and 1440);

-- Visitas (atendimentos já realizados) --------------------------------------
create table if not exists public.visitas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  data_atendimento date not null,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists visitas_cliente_idx on public.visitas (cliente_id);
create index if not exists visitas_data_idx on public.visitas (data_atendimento desc);

alter table public.visitas drop constraint if exists visitas_data_check;
alter table public.visitas add constraint visitas_data_check
  check (data_atendimento <= current_date);
alter table public.visitas drop constraint if exists visitas_observacoes_tamanho_check;
alter table public.visitas add constraint visitas_observacoes_tamanho_check
  check (observacoes is null or char_length(observacoes) <= 500);

-- Serviços realizados em cada visita (N:N) -----------------------------------
create table if not exists public.visita_servicos (
  id uuid primary key default gen_random_uuid(),
  visita_id uuid not null references public.visitas (id) on delete cascade,
  servico_id uuid not null references public.servicos (id) on delete restrict,
  preco_cobrado numeric(10,2),
  unique (visita_id, servico_id)
);

-- Bancos criados antes da agenda ainda não possuem o preço histórico. O bloco
-- adiciona e preenche a coluna uma única vez, sem regravar visitas futuras.
do $$
declare
  coluna_ja_existia boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'visita_servicos'
      and column_name = 'preco_cobrado'
  ) into coluna_ja_existia;

  if not coluna_ja_existia then
    alter table public.visita_servicos add column preco_cobrado numeric(10,2);

    update public.visita_servicos as vinculo
    set preco_cobrado = servico.preco
    from public.servicos as servico
    where servico.id = vinculo.servico_id;
  end if;
end;
$$;

alter table public.visita_servicos drop constraint if exists visita_servicos_preco_cobrado_check;
alter table public.visita_servicos add constraint visita_servicos_preco_cobrado_check
  check (preco_cobrado is null or preco_cobrado between 0 and 999999.99);

create index if not exists visita_servicos_visita_idx on public.visita_servicos (visita_id);
create index if not exists visita_servicos_servico_idx on public.visita_servicos (servico_id);

-- updated_at automático -------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

drop trigger if exists clientes_set_updated_at on public.clientes;
create trigger clientes_set_updated_at before update on public.clientes
  for each row execute function public.set_updated_at();

drop trigger if exists servicos_set_updated_at on public.servicos;
create trigger servicos_set_updated_at before update on public.servicos
  for each row execute function public.set_updated_at();

drop trigger if exists visitas_set_updated_at on public.visitas;
create trigger visitas_set_updated_at before update on public.visitas
  for each row execute function public.set_updated_at();

-- RLS ------------------------------------------------------------------------
-- ATENÇÃO: a primeira versão ainda não tem autenticação. Estas policies liberam
-- leitura e escrita para a chave publicável (role `anon`). Ao introduzir login,
-- substitua cada policy por regras baseadas em auth.uid()/auth.role().
alter table public.clientes enable row level security;
alter table public.servicos enable row level security;
alter table public.visitas enable row level security;
alter table public.visita_servicos enable row level security;

-- A exposição é explícita para compatibilidade com os novos padrões da Data API.
-- Este grant continua público apenas enquanto a aplicação não possui autenticação.
grant select, insert, update, delete on table
  public.clientes, public.servicos, public.visitas, public.visita_servicos
  to anon, authenticated;

drop policy if exists clientes_acesso_publico_v1 on public.clientes;
create policy clientes_acesso_publico_v1 on public.clientes
  for all to anon, authenticated using (true) with check (true);

drop policy if exists servicos_acesso_publico_v1 on public.servicos;
create policy servicos_acesso_publico_v1 on public.servicos
  for all to anon, authenticated using (true) with check (true);

drop policy if exists visitas_acesso_publico_v1 on public.visitas;
create policy visitas_acesso_publico_v1 on public.visitas
  for all to anon, authenticated using (true) with check (true);

drop policy if exists visita_servicos_acesso_publico_v1 on public.visita_servicos;
create policy visita_servicos_acesso_publico_v1 on public.visita_servicos
  for all to anon, authenticated using (true) with check (true);
