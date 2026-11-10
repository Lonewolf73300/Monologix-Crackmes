-- Boîte d'équipe du Chamois : comptes Supabase Auth, Postgres, droits par restaurant.
-- À lancer dans le SQL Editor APRÈS 001_init.sql, quand Lou a un projet Supabase.
-- Ne stocke pas de salaire, de santé, ni de pièce d'identité.
-- L'application n'envoie aucun e-mail. L'envoi d'invitation dépend du SMTP réglé dans Supabase Auth, sinon le lien se transmet à la main.
-- Le temps réel n'est pas activé ici. Ne pas annoncer une synchro entre téléphones tant que le client n'est pas branché.

create table if not exists chamois_restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  managers_may_send boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists chamois_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  restaurant_id uuid not null references chamois_restaurants (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 40),
  last_name text not null check (char_length(last_name) between 1 and 40),
  role text not null check (role in ('patron', 'manager', 'salarie')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists chamois_invites (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references chamois_restaurants (id) on delete cascade,
  email text not null,
  first_name text not null,
  last_name text not null,
  role text not null check (role in ('manager', 'salarie')),
  token text not null unique,
  created_by uuid not null references chamois_profiles (id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists chamois_directives (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references chamois_restaurants (id) on delete cascade,
  author_id uuid not null references chamois_profiles (id),
  body text not null check (char_length(body) between 1 and 2000),
  priority text not null check (priority in ('basse', 'normale', 'haute')),
  due date,
  audience_type text not null check (audience_type in ('tous', 'role', 'personne')),
  audience_role text check (audience_role in ('manager', 'salarie')),
  audience_profile uuid references chamois_profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists chamois_reads (
  directive_id uuid not null references chamois_directives (id) on delete cascade,
  profile_id uuid not null references chamois_profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (directive_id, profile_id)
);

create table if not exists chamois_notes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references chamois_restaurants (id) on delete cascade,
  directive_id uuid references chamois_directives (id) on delete cascade,
  author_id uuid not null references chamois_profiles (id),
  kind text not null check (kind in ('reponse', 'fait', 'rapport')),
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'ouvert' check (status in ('ouvert', 'vu', 'traite')),
  created_at timestamptz not null default now()
);

create index if not exists chamois_profiles_restaurant on chamois_profiles (restaurant_id);
create index if not exists chamois_directives_restaurant on chamois_directives (restaurant_id, created_at desc);
create index if not exists chamois_notes_restaurant on chamois_notes (restaurant_id, created_at desc);

create or replace function chamois_my_restaurant()
returns uuid language sql stable security definer set search_path = public as $$
  select restaurant_id from chamois_profiles where id = auth.uid() and active
$$;

create or replace function chamois_my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from chamois_profiles where id = auth.uid() and active
$$;

alter table chamois_restaurants enable row level security;
alter table chamois_profiles enable row level security;
alter table chamois_invites enable row level security;
alter table chamois_directives enable row level security;
alter table chamois_reads enable row level security;
alter table chamois_notes enable row level security;

drop policy if exists chamois_restaurant_read on chamois_restaurants;
drop policy if exists chamois_restaurant_patron on chamois_restaurants;
drop policy if exists chamois_profiles_read on chamois_profiles;
drop policy if exists chamois_profiles_patron on chamois_profiles;
drop policy if exists chamois_invites_patron on chamois_invites;
drop policy if exists chamois_directives_read on chamois_directives;
drop policy if exists chamois_directives_insert on chamois_directives;
drop policy if exists chamois_reads_read on chamois_reads;
drop policy if exists chamois_reads_insert on chamois_reads;
drop policy if exists chamois_notes_read on chamois_notes;
drop policy if exists chamois_notes_insert on chamois_notes;
drop policy if exists chamois_notes_status on chamois_notes;

create policy chamois_restaurant_read on chamois_restaurants for select using (id = chamois_my_restaurant());
create policy chamois_restaurant_patron on chamois_restaurants for update using (id = chamois_my_restaurant() and chamois_my_role() = 'patron') with check (id = chamois_my_restaurant());

create policy chamois_profiles_read on chamois_profiles for select using (restaurant_id = chamois_my_restaurant());
create policy chamois_profiles_patron on chamois_profiles for update using (restaurant_id = chamois_my_restaurant() and chamois_my_role() = 'patron' and id <> auth.uid()) with check (restaurant_id = chamois_my_restaurant() and role <> 'patron');

create policy chamois_invites_patron on chamois_invites for all using (restaurant_id = chamois_my_restaurant() and chamois_my_role() = 'patron') with check (restaurant_id = chamois_my_restaurant() and chamois_my_role() = 'patron');

create policy chamois_directives_read on chamois_directives for select using (
  restaurant_id = chamois_my_restaurant() and (
    author_id = auth.uid()
    or audience_type = 'tous'
    or (audience_type = 'role' and audience_role = chamois_my_role())
    or (audience_type = 'personne' and audience_profile = auth.uid())
    or chamois_my_role() in ('patron', 'manager')
  )
);
create policy chamois_directives_insert on chamois_directives for insert with check (
  restaurant_id = chamois_my_restaurant() and author_id = auth.uid() and (
    chamois_my_role() = 'patron'
    or (chamois_my_role() = 'manager' and exists (select 1 from chamois_restaurants r where r.id = restaurant_id and r.managers_may_send))
  )
);

create policy chamois_reads_read on chamois_reads for select using (
  exists (select 1 from chamois_directives d where d.id = directive_id and d.restaurant_id = chamois_my_restaurant())
);
create policy chamois_reads_insert on chamois_reads for insert with check (
  profile_id = auth.uid() and exists (select 1 from chamois_directives d where d.id = directive_id and d.restaurant_id = chamois_my_restaurant())
);

create policy chamois_notes_read on chamois_notes for select using (
  restaurant_id = chamois_my_restaurant() and (author_id = auth.uid() or chamois_my_role() in ('patron', 'manager'))
);
create policy chamois_notes_insert on chamois_notes for insert with check (restaurant_id = chamois_my_restaurant() and author_id = auth.uid());
create policy chamois_notes_status on chamois_notes for update using (restaurant_id = chamois_my_restaurant() and chamois_my_role() in ('patron', 'manager')) with check (restaurant_id = chamois_my_restaurant());
