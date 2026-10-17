-- SODAF · 17 octobre 2026
-- 1. Nouveau rôle « Ambassadeur » (code : ambassadeur) : il porte l'image de SODAF (vidéos TikTok, statuts, live du tirage, pub étudiants).
--    Il voit : Messages (Général + conversation avec la gérante), Documents, sa page Communication, les chiffres de provenance (sans nom).
--    Il ne voit pas : élèves, reçus, planning, argent, gérance.
-- 2. Suivi de la communication : publications notées par l'Ambassadeur, tâches données par la gérante.
-- 3. Frais (déplacement, transport, recharge, petit achat) notés par la gérante, sans devis.
-- Rien ne se supprime : aucune règle de suppression sur les nouvelles tables. Idempotent (peut être collé deux fois).

-- 1. Le rôle
alter table public.profils drop constraint if exists profils_role_check;
alter table public.profils add constraint profils_role_check check (role = any (array['admin', 'gerant', 'secretariat', 'moniteur', 'ambassadeur']));

-- « Équipe » (élèves, reçus, planning…) : tous les comptes actifs SAUF l'Ambassadeur
create or replace function prive.est_equipe()
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.profils where id = auth.uid() and actif and role <> 'ambassadeur')
$$;
-- « Membre » (messages, profils, connexions, notifications) : tous les comptes actifs, Ambassadeur compris
create or replace function prive.est_membre()
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.profils where id = auth.uid() and actif)
$$;

drop policy if exists "équipe : canaux" on public.canaux;
create policy "équipe : canaux" on public.canaux for select to authenticated using (prive.est_membre() and prive.canal_ok(id));
drop policy if exists "équipe : lire messages" on public.messages;
create policy "équipe : lire messages" on public.messages for select to authenticated using (prive.est_membre() and prive.canal_ok(canal));
drop policy if exists "équipe : écrire message" on public.messages;
create policy "équipe : écrire message" on public.messages for insert to authenticated with check (prive.est_membre() and prive.canal_ok(canal) and auteur = auth.uid());
drop policy if exists "équipe : voir les écoutes" on public.ecoutes;
create policy "équipe : voir les écoutes" on public.ecoutes for select to authenticated
  using (prive.est_membre() and exists (select 1 from public.messages m where m.id = ecoutes.message_id and prive.canal_ok(m.canal)));
drop policy if exists "équipe : marquer un vocal écouté" on public.ecoutes;
create policy "équipe : marquer un vocal écouté" on public.ecoutes for insert to authenticated
  with check (prive.est_membre() and profil = auth.uid() and exists (select 1 from public.messages m where m.id = ecoutes.message_id and prive.canal_ok(m.canal)));
drop policy if exists "moi : ajouter" on public.lectures;
create policy "moi : ajouter" on public.lectures for insert to authenticated with check (profil = auth.uid() and prive.est_membre());
drop policy if exists "moi : ajouter" on public.push_abonnements;
create policy "moi : ajouter" on public.push_abonnements for insert to authenticated with check (profil = auth.uid() and prive.est_membre());
drop policy if exists "connexions : direction ou soi-même" on public.connexions;
create policy "connexions : direction ou soi-même" on public.connexions for select to authenticated using (prive.est_membre() and (prive.a_role(array['admin']) or profil = auth.uid()));
drop policy if exists "équipe : profils" on public.profils;
create policy "équipe : profils" on public.profils for select to authenticated using (prive.est_membre());
drop policy if exists "équipe : réglages" on public.reglages;
create policy "équipe : réglages" on public.reglages for select to authenticated using (prive.est_membre());
drop policy if exists "messages : envoyer fichiers" on storage.objects;
create policy "messages : envoyer fichiers" on storage.objects for insert to authenticated
  with check (bucket_id = 'messages' and prive.est_membre() and prive.canal_ok((storage.foldername(name))[1]));
drop policy if exists "messages : lire fichiers" on storage.objects;
create policy "messages : lire fichiers" on storage.objects for select to authenticated
  using (bucket_id = 'messages' and prive.est_membre() and prive.canal_ok((storage.foldername(name))[1]));

create or replace function public.connexion_noter(p_appareil text, p_description text, p_login boolean)
returns boolean language plpgsql security definer set search_path to '' as $$
declare v_nouvel boolean; v_ip text; v_h json; v_id bigint;
begin
  if not prive.est_membre() then raise exception 'accès refusé' using errcode = '42501'; end if;
  if p_appareil is null or length(p_appareil) < 8 then raise exception 'appareil inconnu'; end if;
  v_nouvel := not exists (select 1 from public.connexions where profil = auth.uid() and appareil = left(p_appareil, 64));
  begin
    v_h := current_setting('request.headers', true)::json;
    v_ip := coalesce(nullif(trim(v_h ->> 'cf-connecting-ip'), ''), nullif(trim(v_h ->> 'x-real-ip'), ''), trim(split_part(coalesce(v_h ->> 'x-forwarded-for', ''), ',', 1)));
  exception when others then v_ip := null;
  end;
  insert into public.connexions (profil, appareil, description, ip, nouvel)
  values (auth.uid(), left(p_appareil, 64), left(p_description, 120), nullif(left(v_ip, 64), ''), v_nouvel and coalesce(p_login, false))
  returning id into v_id;
  perform prive.notifier(jsonb_build_object('type', 'connexion', 'id', v_id));
  return v_nouvel;
end $$;

create or replace function public.push_enregistrer(p_endpoint text, p_p256dh text, p_auth text, p_appareil text)
returns void language plpgsql security definer set search_path to '' as $$
begin
  if not prive.est_membre() then raise exception 'accès refusé' using errcode = '42501'; end if;
  insert into public.push_abonnements (profil, endpoint, p256dh, auth, appareil)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, left(p_appareil, 200))
  on conflict (endpoint) do update set profil = excluded.profil, p256dh = excluded.p256dh, auth = excluded.auth, appareil = excluded.appareil;
end $$;

create or replace function public.push_test()
returns void language plpgsql security definer set search_path to '' as $$
begin
  if not prive.est_membre() then raise exception 'accès refusé' using errcode = '42501'; end if;
  perform prive.notifier(jsonb_build_object('type', 'test', 'profil', auth.uid()));
end $$;

-- Conversation privée Gérante ↔ Ambassadeur (la direction peut lire)
insert into public.canaux (id, nom, description, roles, ordre, prive)
select 'ambassadeur', 'Gérante ↔ Ambassadeur', 'Privé entre la gérante et l''ambassadeur', array['admin', 'gerant', 'ambassadeur'], coalesce((select max(ordre) from public.canaux), 0) + 1, true
where not exists (select 1 from public.canaux where id = 'ambassadeur');

-- Création de compte : rôle Ambassadeur accepté
create or replace function public.compte_creer(p_email text, p_motdepasse text, p_role text)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare v_email text := lower(trim(coalesce(p_email, ''))); v_id uuid := gen_random_uuid();
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  if p_role not in ('admin', 'gerant', 'secretariat', 'moniteur', 'ambassadeur') then raise exception 'rôle inconnu'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'adresse invalide'; end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then raise exception 'adresse déjà utilisée par un autre compte'; end if;
  if length(coalesce(p_motdepasse, '')) < 6 then raise exception 'mot de passe trop court (6 caractères au moins)'; end if;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at,
                          raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new,
                          email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token, is_sso_user, is_anonymous)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
          extensions.crypt(p_motdepasse, extensions.gen_salt('bf')), now(), now(), now(),
          '{"provider":"email","providers":["email"]}', '{"email_verified":true}', '', '', '', '', '', '', '', '', false, false);
  insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
  values (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false), 'email', now(), now());
  insert into public.profils (id, nom, role, actif)
  values (v_id, case p_role when 'admin' then 'Direction SODAF' when 'gerant' then 'Gérante SODAF' when 'secretariat' then 'Secrétariat SODAF'
                            when 'ambassadeur' then 'Ambassadeur SODAF' else 'Moniteur SODAF' end, p_role, true);
  return v_id;
end $$;

-- 2. Communication : ce que l'Ambassadeur publie
create table if not exists public.com_actions (
  id bigint generated always as identity primary key,
  le timestamptz not null default now(),
  jour date not null default current_date,
  auteur uuid not null default auth.uid() references public.profils(id),
  type text not null check (type in ('TikTok', 'Statut WhatsApp', 'Atelier filmé', 'Live du tirage', 'Pub étudiants', 'Autre')),
  lien text check (lien is null or (length(lien) <= 500 and lien ~ '^https?://')),
  note text check (note is null or length(note) <= 300)
);
alter table public.com_actions enable row level security;
drop policy if exists "com : lire" on public.com_actions;
create policy "com : lire" on public.com_actions for select to authenticated using (prive.a_role(array['admin', 'gerant', 'ambassadeur']));
drop policy if exists "com : noter" on public.com_actions;
create policy "com : noter" on public.com_actions for insert to authenticated
  with check (prive.a_role(array['admin', 'ambassadeur']) and auteur = auth.uid() and jour between current_date - 7 and current_date);

-- Tâches données par la gérante (ou la direction) à l'Ambassadeur
create table if not exists public.com_taches (
  id bigint generated always as identity primary key,
  le timestamptz not null default now(),
  par uuid not null default auth.uid() references public.profils(id),
  texte text not null check (length(texte) between 3 and 300),
  pour_le date,
  fait_le timestamptz,
  fait_par uuid references public.profils(id)
);
alter table public.com_taches enable row level security;
drop policy if exists "com : lire tâches" on public.com_taches;
create policy "com : lire tâches" on public.com_taches for select to authenticated using (prive.a_role(array['admin', 'gerant', 'ambassadeur']));
drop policy if exists "com : donner une tâche" on public.com_taches;
create policy "com : donner une tâche" on public.com_taches for insert to authenticated
  with check (prive.a_role(array['admin', 'gerant']) and par = auth.uid() and fait_le is null and fait_par is null);

create or replace function public.com_tache_faite(p_id bigint)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if not prive.a_role(array['admin', 'gerant', 'ambassadeur']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  update public.com_taches set fait_le = now(), fait_par = auth.uid() where id = p_id and fait_le is null;
  if not found then raise exception 'tâche introuvable ou déjà faite'; end if;
end $$;
revoke all on function public.com_tache_faite(bigint) from public, anon;
grant execute on function public.com_tache_faite(bigint) to authenticated;

-- Chiffres pour l'Ambassadeur : d'où viennent les nouveaux élèves, combien d'étudiants (aucun nom, aucun montant)
create or replace function public.com_chiffres(p_debut date, p_fin date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare r jsonb;
begin
  if not prive.a_role(array['admin', 'gerant', 'ambassadeur']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  select jsonb_build_object(
    'nouveaux', (select count(*) from public.eleves e where e.cree_le >= p_debut and e.cree_le < p_fin + 1),
    'provenance', coalesce((select jsonb_object_agg(k, n) from (
        select case when e.source = 'site' then 'site' else coalesce(e.provenance, 'agence') end k, count(*) n
          from public.eleves e where e.cree_le >= p_debut and e.cree_le < p_fin + 1 group by 1) t), '{}'::jsonb),
    'etudiants_contacts', (select count(*) from public.eleves e where e.cree_le >= p_debut and e.cree_le < p_fin + 1
                              and (e.formation ilike '%tudiant%' or e.notes ilike '%je suis étudiant%')),
    'etudiants_inscrits', (select count(*) from public.paiements p where not p.annule and p.jour between p_debut and p_fin
                              and p.motif ilike 'Droit d''inscription%' and p.motif ilike '%tudiant%'),
    'inscrits', (select count(*) from public.paiements p where not p.annule and p.jour between p_debut and p_fin and p.motif ilike 'Droit d''inscription%')
  ) into r;
  return r;
end $$;
revoke all on function public.com_chiffres(date, date) from public, anon;
grant execute on function public.com_chiffres(date, date) to authenticated;

-- 3. Frais (sans devis) notés par la gérante
create table if not exists public.frais (
  id bigint generated always as identity primary key,
  le timestamptz not null default now(),
  jour date not null default current_date,
  auteur uuid not null default auth.uid() references public.profils(id),
  quoi text not null check (quoi in ('Déplacement', 'Transport', 'Recharge', 'Petit achat', 'Autre')),
  pour text not null check (pour in ('Direction', 'Gérante', 'Secrétariat', 'Moniteur', 'Ambassadeur', 'Mécanicienne', 'Autre')),
  montant integer not null check (montant between 100 and 1000000),
  note text check (note is null or length(note) <= 300),
  photo text check (photo is null or photo like 'frais/%')
);
alter table public.frais enable row level security;
drop policy if exists "frais : lire" on public.frais;
create policy "frais : lire" on public.frais for select to authenticated using (prive.a_role(array['admin', 'gerant']));
drop policy if exists "frais : noter" on public.frais;
create policy "frais : noter" on public.frais for insert to authenticated
  with check (prive.a_role(array['admin', 'gerant']) and auteur = auth.uid() and jour between current_date - 31 and current_date);

-- 4. Sauvegarde du dimanche : ajouter les trois nouvelles tables
do $$
declare d text;
begin
  select pg_get_functiondef('public.sauvegarde_export()'::regprocedure) into d;
  if position('''frais''' in d) = 0 then
    d := replace(d, '''commissions''', '''commissions'',''com_actions'',''com_taches'',''frais''');
    execute d;
  end if;
end $$;
