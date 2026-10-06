-- SODAF · Rôle « Gérante » (code : gerant) et lien avec la direction : rapport de la semaine, journal des décisions, demandes d'accord.
-- La gérante voit et fait tout le travail courant (élèves, reçus, planning, groupes, messages, chiffres).
-- Restent réservés à la direction : comptes de l'équipe, sécurité (connexions), sauvegarde complète.
-- Rien ne se supprime : aucune règle de suppression sur les nouvelles tables.

-- 1. Le rôle
alter table public.profils drop constraint profils_role_check;
alter table public.profils add constraint profils_role_check check (role = any (array['admin', 'gerant', 'secretariat', 'moniteur']));

-- 2. Travail courant : mêmes droits que la direction et le secrétariat
drop policy "équipe : ajouter" on public.paiements;
create policy "équipe : ajouter" on public.paiements for insert to authenticated with check (prive.a_role(array['admin', 'gerant', 'secretariat']));
drop policy "équipe : modifier" on public.paiements;
create policy "équipe : modifier" on public.paiements for update to authenticated using (prive.a_role(array['admin', 'gerant', 'secretariat'])) with check (prive.a_role(array['admin', 'gerant', 'secretariat']));
drop policy "équipe : modifier" on public.groupes_code;
create policy "équipe : modifier" on public.groupes_code for update to authenticated using (prive.a_role(array['admin', 'gerant', 'secretariat'])) with check (prive.a_role(array['admin', 'gerant', 'secretariat']));

create or replace function public.groupe_ouvrir(p_id text, p_actif boolean)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare fin date; n int := 0;
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  update groupes_code set actif = p_actif where id = p_id;
  if not found then return 0; end if;
  if p_actif then
    select coalesce(max(jour), current_date) into fin from creneaux_conduite;
    n := prive.seances_groupe(p_id, current_date, fin);
    update seances_code set statut = 'Prévu', note = null where groupe = p_id and jour >= current_date and statut = 'Annulé' and note = 'Groupe fermé';
  else
    update seances_code s set statut = 'Annulé', note = 'Groupe fermé'
     where s.groupe = p_id and s.jour >= current_date and s.statut = 'Prévu'
       and not exists (select 1 from presences p where p.seance_id = s.id);
  end if;
  return n;
end $$;

-- 3. Messages : la gérante lit tous les canaux, et un canal privé Direction ↔ Gérante
update public.canaux set roles = roles || array['gerant'] where roles is not null and not ('gerant' = any (roles));
insert into public.canaux (id, nom, description, roles, ordre, prive)
select 'gerance', 'Direction ↔ Gérante', 'Privé entre la direction et la gérante', array['admin', 'gerant'], coalesce((select max(ordre) from public.canaux), 0) + 1, true
where not exists (select 1 from public.canaux where id = 'gerance');

-- 4. Création de compte : rôle gérante accepté
create or replace function public.compte_creer(p_email text, p_motdepasse text, p_role text)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare v_email text := lower(trim(coalesce(p_email, ''))); v_id uuid := gen_random_uuid();
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  if p_role not in ('admin', 'gerant', 'secretariat', 'moniteur') then raise exception 'rôle inconnu'; end if;
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
  values (v_id, case p_role when 'admin' then 'Direction SODAF' when 'gerant' then 'Gérante SODAF' when 'secretariat' then 'Secrétariat SODAF' else 'Moniteur SODAF' end, p_role, true);
  return v_id;
end $$;

-- 5. Journal des décisions (la gérante note, la direction donne son avis)
create table if not exists public.decisions (
  id bigint generated always as identity primary key,
  le timestamptz not null default now(),
  auteur uuid not null default auth.uid() references public.profils(id),
  categorie text not null default 'Autre' check (categorie in ('Élèves', 'Argent', 'Planning', 'Équipe', 'Autre')),
  texte text not null check (length(texte) between 3 and 600),
  avis text check (avis in ('ok', 'revoir')),
  avis_note text check (length(avis_note) <= 300),
  avis_le timestamptz
);
alter table public.decisions enable row level security;
create policy "gérance : lire décisions" on public.decisions for select to authenticated using (prive.a_role(array['admin', 'gerant']));
create policy "gérance : noter une décision" on public.decisions for insert to authenticated
  with check (prive.a_role(array['admin', 'gerant']) and auteur = auth.uid() and avis is null and avis_note is null and avis_le is null);

create or replace function public.decision_avis(p_id bigint, p_avis text, p_note text)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  if p_avis not in ('ok', 'revoir') then raise exception 'avis inconnu'; end if;
  update public.decisions set avis = p_avis, avis_note = nullif(trim(coalesce(p_note, '')), ''), avis_le = now() where id = p_id;
  if not found then raise exception 'décision introuvable'; end if;
  if p_avis = 'revoir' then perform prive.notifier(jsonb_build_object('type', 'decision_avis', 'id', p_id)); end if;
end $$;
revoke all on function public.decision_avis(bigint, text, text) from public, anon;
grant execute on function public.decision_avis(bigint, text, text) to authenticated;

-- 6. Demandes d'accord (la gérante demande, la direction accorde ou refuse)
create table if not exists public.demandes (
  id bigint generated always as identity primary key,
  le timestamptz not null default now(),
  auteur uuid not null default auth.uid() references public.profils(id),
  type text not null check (type in ('Remise', 'Annulation de reçu', 'Report de paiement', 'Dépense', 'Autre')),
  montant integer check (montant is null or montant > 0),
  eleve_id bigint references public.eleves(id),
  texte text not null check (length(texte) between 3 and 600),
  statut text not null default 'attente' check (statut in ('attente', 'accordee', 'refusee')),
  reponse text check (length(reponse) <= 300),
  repondu_le timestamptz,
  repondu_par uuid references public.profils(id)
);
alter table public.demandes enable row level security;
create policy "gérance : lire demandes" on public.demandes for select to authenticated using (prive.a_role(array['admin', 'gerant']));
create policy "gérance : faire une demande" on public.demandes for insert to authenticated
  with check (prive.a_role(array['admin', 'gerant']) and auteur = auth.uid() and statut = 'attente' and reponse is null and repondu_le is null and repondu_par is null);

create or replace function public.demande_repondre(p_id bigint, p_accord boolean, p_note text)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  update public.demandes set statut = case when p_accord then 'accordee' else 'refusee' end,
         reponse = nullif(trim(coalesce(p_note, '')), ''), repondu_le = now(), repondu_par = auth.uid()
   where id = p_id and statut = 'attente';
  if not found then raise exception 'demande introuvable ou déjà traitée'; end if;
  perform prive.notifier(jsonb_build_object('type', 'demande_reponse', 'id', p_id));
end $$;
revoke all on function public.demande_repondre(bigint, boolean, text) from public, anon;
grant execute on function public.demande_repondre(bigint, boolean, text) to authenticated;

-- 7. Rapport de la semaine (un par semaine, envoyé par la gérante, lu par la direction)
create table if not exists public.rapports (
  id bigint generated always as identity primary key,
  semaine date not null unique check (extract(isodow from semaine) = 1),
  auteur uuid not null default auth.uid() references public.profils(id),
  chiffres jsonb not null default '{}'::jsonb,
  texte text not null default '' check (length(texte) <= 3000),
  envoye_le timestamptz not null default now(),
  lu_le timestamptz
);
alter table public.rapports enable row level security;
create policy "gérance : lire rapports" on public.rapports for select to authenticated using (prive.a_role(array['admin', 'gerant']));
create policy "gérance : envoyer le rapport" on public.rapports for insert to authenticated
  with check (prive.a_role(array['admin', 'gerant']) and auteur = auth.uid() and lu_le is null);

create or replace function public.rapport_lu(p_id bigint)
returns void language sql volatile security definer set search_path = '' as $$
  update public.rapports set lu_le = coalesce(lu_le, now()) where id = p_id and prive.a_role(array['admin'])
$$;
revoke all on function public.rapport_lu(bigint) from public, anon;
grant execute on function public.rapport_lu(bigint) to authenticated;

-- 8. Notifications (fonction notifier : types demande, demande_reponse, decision, decision_avis, rapport, rapport_rappel)
create or replace function prive.trg_gerance()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform prive.notifier(jsonb_build_object('type', case tg_table_name when 'demandes' then 'demande' when 'decisions' then 'decision' else 'rapport' end, 'id', new.id));
  return new;
end $$;
create trigger notifier_demande after insert on public.demandes for each row execute function prive.trg_gerance();
create trigger notifier_decision after insert on public.decisions for each row execute function prive.trg_gerance();
create trigger notifier_rapport after insert on public.rapports for each row execute function prive.trg_gerance();

-- Dimanche 18 h (Lomé) : rappel à la gérante si le rapport de la semaine n'est pas encore envoyé
select cron.schedule('sodaf-rapport-dimanche', '0 18 * * 0', $c$
  select prive.notifier(jsonb_build_object('type', 'rapport_rappel'))
   where exists (select 1 from public.profils where role = 'gerant' and actif)
     and not exists (select 1 from public.rapports where semaine = date_trunc('week', current_date)::date)
$c$);

-- 9. Sauvegarde : ajouter les trois nouvelles tables
do $$
declare d text;
begin
  select pg_get_functiondef('public.sauvegarde_export()'::regprocedure) into d;
  if position('''rapports''' in d) = 0 then
    d := replace(d, '''connexions''', '''connexions'',''decisions'',''demandes'',''rapports''');
    execute d;
  end if;
end $$;
