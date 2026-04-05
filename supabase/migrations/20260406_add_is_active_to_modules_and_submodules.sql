alter table public.modules
add column if not exists is_active boolean not null default true;

alter table public.submodules
add column if not exists is_active boolean not null default true;

create index if not exists idx_modules_is_active
on public.modules (is_active);

create index if not exists idx_submodules_module_active_sort
on public.submodules (module_id, is_active, sort_order);

comment on column public.modules.is_active is 'Controls whether this module is visible to learners.';
comment on column public.submodules.is_active is 'Controls whether this submodule is visible to learners.';
