create extension if not exists "uuid-ossp";

create table if not exists tenants (
  id uuid primary key default uuid_generate_v4(),
  name text,
  created_at timestamptz not null default now()
);

create table if not exists user_tenants (
  user_id uuid primary key,
  tenant_id uuid not null references tenants(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists api_keys (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  hashed_secret text not null,
  scopes text[] not null default array['agent:write','agent:manage']::text[],
  created_at timestamptz not null default now(),
  revoked boolean not null default false,
  last_used timestamptz,
  created_by uuid
);

insert into tenants (id, name)
values ('00000000-0000-0000-0000-000000000001', 'ClawSight Demo Tenant')
on conflict (id) do nothing;
