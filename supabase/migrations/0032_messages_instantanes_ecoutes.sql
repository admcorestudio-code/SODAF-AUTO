-- 0032 · Messages instantanés et vocaux écoutés
-- 1. Temps réel : les nouveaux messages arrivent tout de suite chez les autres (Supabase Realtime, règles RLS respectées).
-- 2. messages.cle : identifiant choisi par le téléphone qui envoie ; il évite d'afficher deux fois le même message.
-- 3. ecoutes : qui a écouté quel vocal (couleur « pas encore écouté » et « Écouté par … » sous ses propres vocaux).
-- Rien n'est supprimé.

alter table public.messages add column if not exists cle text check (cle is null or length(cle) <= 40);

create table if not exists public.ecoutes (
  message_id bigint not null references public.messages (id),
  profil uuid not null default auth.uid() references public.profils (id),
  le timestamptz not null default now(),
  primary key (message_id, profil)
);
alter table public.ecoutes enable row level security;

create policy "équipe : voir les écoutes" on public.ecoutes for select to authenticated
  using (prive.est_equipe() and exists (select 1 from public.messages m where m.id = message_id and prive.canal_ok(m.canal)));
create policy "équipe : marquer un vocal écouté" on public.ecoutes for insert to authenticated
  with check (prive.est_equipe() and profil = auth.uid() and exists (select 1 from public.messages m where m.id = message_id and prive.canal_ok(m.canal)));
grant select, insert on public.ecoutes to authenticated;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ecoutes') then
    alter publication supabase_realtime add table public.ecoutes;
  end if;
end $$;

-- Sauvegarde hebdomadaire : ajouter la table des écoutes
do $$
declare d text;
begin
  select pg_get_functiondef('public.sauvegarde_export()'::regprocedure) into d;
  if position('''ecoutes''' in d) = 0 then
    d := replace(d, '''messages'',''canaux''', '''messages'',''canaux'',''ecoutes''');
    execute d;
  end if;
end $$;
