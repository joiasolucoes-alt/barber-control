-- Barber Control — schema aplicado no projeto Supabase `barber-control`.
-- Reproduz as migrations: initial_schema, rls_acesso_publico_v1, servicos_iniciais.

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
  telefone text not null,
  data_nascimento date,
  observacoes text,
  status status_registro not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clientes_nome_idx on public.clientes (nome);
create index if not exists clientes_telefone_idx on public.clientes (telefone);

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

-- Serviços realizados em cada visita (N:N) -----------------------------------
create table if not exists public.visita_servicos (
  id uuid primary key default gen_random_uuid(),
  visita_id uuid not null references public.visitas (id) on delete cascade,
  servico_id uuid not null references public.servicos (id) on delete restrict,
  unique (visita_id, servico_id)
);

create index if not exists visita_servicos_visita_idx on public.visita_servicos (visita_id);
create index if not exists visita_servicos_servico_idx on public.visita_servicos (servico_id);

-- updated_at automático -------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

-- Serviços iniciais ----------------------------------------------------------
insert into public.servicos (nome, descricao, preco, duracao_estimada, status)
select v.nome, v.descricao, v.preco, v.duracao, 'ativo'::status_registro
from (values
  ('Corte de cabelo', 'Corte na máquina e tesoura com acabamento.', 45.00, 40),
  ('Barba', 'Barba feita na navalha com toalha quente.', 35.00, 30),
  ('Corte e barba', 'Combo completo de corte e barba.', 70.00, 65),
  ('Acabamento', 'Retoque de pézinho e contornos entre os cortes.', 20.00, 15),
  ('Sobrancelha', 'Design de sobrancelha masculina na navalha.', 15.00, 10)
) as v(nome, descricao, preco, duracao)
where not exists (select 1 from public.servicos s where s.nome = v.nome);
