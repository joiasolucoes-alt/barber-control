alter table public.visita_servicos
  add column if not exists preco_cobrado numeric(10,2);

update public.visita_servicos as vinculo
set preco_cobrado = servico.preco
from public.servicos as servico
where servico.id = vinculo.servico_id
  and vinculo.preco_cobrado is null;

alter table public.visita_servicos
  drop constraint if exists visita_servicos_preco_cobrado_check;

alter table public.visita_servicos
  add constraint visita_servicos_preco_cobrado_check
  check (preco_cobrado is null or preco_cobrado between 0 and 999999.99);
