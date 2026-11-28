create table if not exists public.trazo_galeria (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  modo text not null default 'estampita' check (modo in ('estampita','fondo')),
  svg text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','aprobado','rechazado')),
  creado timestamptz not null default now(),
  revisado timestamptz
);
create index if not exists trazo_galeria_estado on public.trazo_galeria (estado, revisado desc);
alter table public.trazo_galeria enable row level security;
