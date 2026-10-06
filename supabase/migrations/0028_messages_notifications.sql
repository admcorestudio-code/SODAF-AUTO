-- 0028 · Messages de l'équipe (canaux) et notifications sur téléphone
-- Canaux : Général, Secrétariat ↔ Moniteur (toute l'équipe), Direction (direction + secrétariat).
-- Notifications envoyées par la fonction « notifier » (Edge Function) : nouveau message, nouvelle pré-inscription du site,
-- inscription finalisée en ligne (paiement Mixx à vérifier ou paiement à l'agence).
-- Les clés de notification (VAPID) et le secret de la fonction sont rangés dans prive.config_push, remplis à part :
-- ils ne sont jamais écrits dans le dépôt public.
-- Rien n'est supprimé.

create extension if not exists pg_net with schema extensions;

create table if not exists public.canaux (
  id text primary key check (id ~ '^[a-z0-9-]{2,30}$'),
  nom text not null check (length(nom) between 2 and 40),
  description text check (length(description) <= 120),
  roles text[],                       -- null = toute l'équipe
  ordre smallint not null default 0
);
alter table public.canaux enable row level security;

create or replace function prive.canal_ok(c text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.canaux k
                  where k.id = c and (k.roles is null or exists (select 1 from public.profils p where p.id = auth.uid() and p.role = any (k.roles))))
$$;
revoke all on function prive.canal_ok(text) from public, anon;
grant execute on function prive.canal_ok(text) to authenticated;

create policy "équipe : canaux" on public.canaux for select to authenticated using (prive.est_equipe() and prive.canal_ok(id));

insert into public.canaux (id, nom, description, roles, ordre) values
  ('general', 'Général', 'Toute l''équipe : infos, consignes, questions', null, 1),
  ('planning', 'Secrétariat ↔ Moniteur', 'Planning, élèves, cours de code et séances de conduite', null, 2),
  ('direction', 'Direction', 'Direction et secrétariat : paiements, décisions', array['admin', 'secretariat'], 3)
on conflict (id) do nothing;

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  canal text not null references public.canaux(id),
  auteur uuid not null default auth.uid() references public.profils(id),
  texte text not null check (length(btrim(texte)) between 1 and 2000),
  le timestamptz not null default now()
);
create index if not exists messages_canal_le on public.messages (canal, le desc);
alter table public.messages enable row level security;
create policy "équipe : lire messages" on public.messages for select to authenticated using (prive.est_equipe() and prive.canal_ok(canal));
create policy "équipe : écrire message" on public.messages for insert to authenticated
  with check (prive.est_equipe() and prive.canal_ok(canal) and auteur = auth.uid());

-- Dernière lecture de chaque canal, par personne (messages non lus)
create table if not exists public.lectures (
  profil uuid not null default auth.uid() references public.profils(id),
  canal text not null references public.canaux(id),
  lu_le timestamptz not null default now(),
  primary key (profil, canal)
);
alter table public.lectures enable row level security;
create policy "moi : lire" on public.lectures for select to authenticated using (profil = auth.uid());
create policy "moi : ajouter" on public.lectures for insert to authenticated with check (profil = auth.uid() and prive.est_equipe());
create policy "moi : modifier" on public.lectures for update to authenticated using (profil = auth.uid()) with check (profil = auth.uid());

-- Téléphones abonnés aux notifications (chacun ne voit et ne gère que les siens)
create table if not exists public.push_abonnements (
  id bigint generated always as identity primary key,
  profil uuid not null default auth.uid() references public.profils(id),
  endpoint text not null unique check (endpoint ~ '^https://' and length(endpoint) <= 1000),
  p256dh text not null check (length(p256dh) <= 200),
  auth text not null check (length(auth) <= 100),
  appareil text check (length(appareil) <= 200),
  cree_le timestamptz not null default now()
);
alter table public.push_abonnements enable row level security;
create policy "moi : lire" on public.push_abonnements for select to authenticated using (profil = auth.uid());
create policy "moi : ajouter" on public.push_abonnements for insert to authenticated with check (profil = auth.uid() and prive.est_equipe());
create policy "moi : retirer" on public.push_abonnements for delete to authenticated using (profil = auth.uid());

-- Réglages privés des notifications (clés VAPID, secret de la fonction) : jamais lisibles depuis l'API
create table if not exists prive.config_push (cle text primary key, valeur text not null);
alter table prive.config_push enable row level security;

-- Appel de la fonction « notifier » (ne bloque jamais l'enregistrement si l'envoi échoue)
create or replace function prive.notifier(payload jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare s text;
begin
  select valeur into s from prive.config_push where cle = 'secret_fonction';
  if s is null then return; end if;
  perform net.http_post(
    url := 'https://fpfmpiodbznjofxjfyjf.supabase.co/functions/v1/notifier',
    body := payload,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-sodaf-secret', s),
    timeout_milliseconds := 8000);
exception when others then
  null;
end $$;
revoke all on function prive.notifier(jsonb) from public, anon, authenticated;

create or replace function prive.trg_message() returns trigger
language plpgsql security definer set search_path = '' as $$
begin perform prive.notifier(jsonb_build_object('type', 'message', 'id', new.id)); return new; end $$;
create or replace function prive.trg_preinscription() returns trigger
language plpgsql security definer set search_path = '' as $$
begin if new.source = 'site' then perform prive.notifier(jsonb_build_object('type', 'preinscription', 'id', new.id)); end if; return new; end $$;
create or replace function prive.trg_inscription_web() returns trigger
language plpgsql security definer set search_path = '' as $$
begin perform prive.notifier(jsonb_build_object('type', 'inscription', 'id', new.id)); return new; end $$;
revoke all on function prive.trg_message(), prive.trg_preinscription(), prive.trg_inscription_web() from public, anon, authenticated;

create trigger notifier_message after insert on public.messages for each row execute function prive.trg_message();
create trigger notifier_preinscription after insert on public.eleves for each row execute function prive.trg_preinscription();
create trigger notifier_inscription_web after insert on public.inscriptions_web for each row execute function prive.trg_inscription_web();

-- Bouton « Tester » : envoie une notification d'essai à mes propres téléphones
create or replace function public.push_test() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not prive.est_equipe() then raise exception 'accès refusé' using errcode = '42501'; end if;
  perform prive.notifier(jsonb_build_object('type', 'test', 'profil', auth.uid()));
end $$;
revoke all on function public.push_test() from public, anon;
grant execute on function public.push_test() to authenticated;

-- Sauvegardes : messages et canaux ajoutés aux exports
do $$
declare d text;
begin
  select pg_get_functiondef('prive.export_csv(text, date, date)'::regprocedure) into d;
  if position('''messages''' in d) = 0 then
    d := replace(d, '''inscriptions_web'',''groupes_code'')', '''inscriptions_web'',''groupes_code'',''messages'',''canaux'')');
    execute d;
  end if;
  select pg_get_functiondef('public.sauvegarde_export()'::regprocedure) into d;
  if position('''messages''' in d) = 0 then
    d := replace(d, '''profils'',''groupes_code''', '''profils'',''groupes_code'',''messages'',''canaux''');
    execute d;
  end if;
end $$;
