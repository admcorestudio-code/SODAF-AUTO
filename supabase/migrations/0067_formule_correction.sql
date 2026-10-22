-- 0067 : formule de l'inscription en ligne (décision du propriétaire, 22 octobre 2026)
-- Un client étudiant a choisi « Formation complète » (55 000 F) au lieu du tarif étudiant (30 000 F).
-- 1. Le prix envoyé par le client est contrôlé par la base (il ne peut pas envoyer un faux montant).
-- 2. La formule ne peut plus être changée librement : le secrétariat signale l'erreur, la gérante appelle le client
--    (et vérifie la carte d'étudiant si besoin), puis corrige. Une tâche lui arrive dans « À faire ».
-- 3. Le reçu d'inscription doit porter la même formule que l'inscription en ligne (sinon : refus, passer par la gérante).

alter table public.inscriptions_web
  add column if not exists formule_demandee text check (length(formule_demandee) <= 80),
  add column if not exists correction_motif text check (length(correction_motif) <= 300),
  add column if not exists correction_demande_le timestamptz,
  add column if not exists correction_demande_par uuid references public.profils(id),
  add column if not exists correction_tache bigint references public.taches(id),
  add column if not exists corrige_le timestamptz,
  add column if not exists corrige_par uuid references public.profils(id),
  add column if not exists correction_note text check (length(correction_note) <= 300);
update public.inscriptions_web set formule_demandee = formule where formule_demandee is null;

-- Prix officiels (mêmes chiffres que le site)
create or replace function prive.formule_prix(p_formule text)
returns table (prix integer, ins integer) language sql immutable set search_path = '' as $$
  select x.p, x.i from (values ('Formation complète (permis B)', 55000, 5000), ('Formule rapide (permis B)', 35000, 5000),
    ('Formation complète, tarif étudiant (permis B)', 30000, 3000), ('Formation complète, gagnant du tirage (permis B)', 15000, 0),
    ('Remise à niveau', 25000, 0)) x(f, p, i) where x.f = p_formule
$$;

create or replace function prive.trg_insc_garde()
returns trigger language plpgsql security definer set search_path = '' as $$
declare fp record;
begin
  if tg_op = 'INSERT' then
    select * into fp from prive.formule_prix(new.formule);
    if not found then raise exception 'Formule inconnue.'; end if;
    if new.prix <> fp.prix or new.a_payer <> fp.ins + (select case when new.paiement = 'total' then fp.prix else fp.prix / 2 end) then
      raise exception 'Montant incorrect pour cette formule.';
    end if;
    new.formule_demandee := new.formule;
    return new;
  end if;
  if (new.formule, new.prix, new.a_payer, new.paiement) is distinct from (old.formule, old.prix, old.a_payer, old.paiement)
     and coalesce(current_setting('sodaf.correction', true), '') <> 'oui' then
    raise exception 'La formule ne se change pas ici : touche « Le client s''est trompé de formule », la gérante vérifie.';
  end if;
  return new;
end $$;
drop trigger if exists insc_garde on public.inscriptions_web;
create trigger insc_garde before insert or update on public.inscriptions_web for each row execute function prive.trg_insc_garde();

-- Le secrétariat signale l'erreur → tâche pour la gérante
create or replace function public.inscription_correction_demander(p_id bigint, p_motif text)
returns void language plpgsql security definer set search_path = '' as $$
declare w public.inscriptions_web; g uuid; t bigint; m text := trim(coalesce(p_motif, ''));
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  if length(m) < 3 then raise exception 'Écris ce qui ne va pas (ex. il est étudiant).'; end if;
  select * into w from public.inscriptions_web where id = p_id for update;
  if not found or w.statut = 'Rejeté' then raise exception 'inscription introuvable'; end if;
  if exists (select 1 from public.paiements where eleve_id = w.eleve_id and not annule) then
    raise exception 'Un reçu est déjà fait : demande d''abord l''annulation du reçu à la gérante.';
  end if;
  if w.correction_demande_le is not null and w.corrige_le is null then raise exception 'Déjà signalé : la gérante vérifie.'; end if;
  select id into g from public.profils where role = 'gerant' and actif order by nom limit 1;
  if g is null then select id into g from public.profils where role = 'admin' and actif order by nom limit 1; end if;
  insert into public.taches (par, pour, titre, etape)
  values (auth.uid(), g, left('SO' || w.eleve_id || ' : vérifier la formule. Il a choisi « ' || replace(w.formule, ' (permis B)', '') || ' » sur son lien d''inscription. Le secrétariat signale : ' || m ||
          '. Appelle le client (carte d''étudiant à voir si tarif étudiant), puis fiche de l''élève → Corriger la formule.', 600), 'afaire')
  returning id into t;
  update public.inscriptions_web set correction_motif = m, correction_demande_le = now(), correction_demande_par = auth.uid(), correction_tache = t,
         corrige_le = null, corrige_par = null, correction_note = null
   where id = p_id;
  if g <> auth.uid() then perform prive.tache_notif(t, 'nouvelle'); end if;
end $$;

-- La gérante (ou la direction) corrige, après avoir appelé le client
create or replace function public.inscription_corriger(p_id bigint, p_formule text, p_paiement text, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare w public.inscriptions_web; fp record; n text := trim(coalesce(p_note, '')); tp uuid;
begin
  if not prive.a_role(array['admin', 'gerant']) then raise exception 'réservé à la gérante' using errcode = '42501'; end if;
  if length(n) < 3 then raise exception 'Écris ce que tu as vérifié (ex. client appelé, carte d''étudiant vue).'; end if;
  if p_paiement not in ('moitie', 'total') then raise exception 'Choisis : la moitié ou tout.'; end if;
  select * into fp from prive.formule_prix(p_formule);
  if not found then raise exception 'Formule inconnue.'; end if;
  select * into w from public.inscriptions_web where id = p_id for update;
  if not found or w.statut = 'Rejeté' then raise exception 'inscription introuvable'; end if;
  if exists (select 1 from public.paiements where eleve_id = w.eleve_id and not annule) then
    raise exception 'Un reçu est déjà fait : passe par l''annulation du reçu.';
  end if;
  perform set_config('sodaf.correction', 'oui', true);
  update public.inscriptions_web set formule = p_formule, prix = fp.prix, paiement = p_paiement,
         a_payer = fp.ins + case when p_paiement = 'total' then fp.prix else fp.prix / 2 end,
         corrige_le = now(), corrige_par = auth.uid(), correction_note = n
   where id = p_id;
  perform set_config('sodaf.correction', '', true);
  if w.correction_tache is not null then
    update public.taches set etape = 'fait', fait_le = now(), fait_par = auth.uid(), fait_note = left('Corrigé : ' || replace(p_formule, ' (permis B)', '') || '. ' || n, 300)
     where id = w.correction_tache and etape = 'afaire' returning par into tp;
    if tp is not null and tp <> auth.uid() then perform prive.tache_notif(w.correction_tache, 'faite'); end if;
  end if;
end $$;

do $$
declare f text;
begin
  foreach f in array array['inscription_correction_demander(bigint, text)', 'inscription_corriger(bigint, text, text, text)'] loop
    execute 'revoke all on function public.' || f || ' from public, anon';
    execute 'grant execute on function public.' || f || ' to authenticated';
  end loop;
end $$;

-- Reçu d'inscription : même formule que l'inscription en ligne
create or replace function prive.trg_recu_formule()
returns trigger language plpgsql security definer set search_path = '' as $$
declare w public.inscriptions_web;
begin
  if new.eleve_id is not null and new.motif like 'Droit d''inscription%' then
    select * into w from public.inscriptions_web where eleve_id = new.eleve_id and statut <> 'Rejeté' order by le desc limit 1;
    if found then
      if w.correction_demande_le is not null and w.corrige_le is null then
        raise exception 'La gérante vérifie encore sa formule : attends sa réponse avant de faire le reçu.';
      end if;
      if new.formation is distinct from w.formule then
        raise exception 'Formule différente de son inscription en ligne (« % ») : touche « Le client s''est trompé de formule » sur sa fiche, la gérante vérifie.', replace(w.formule, ' (permis B)', '');
      end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists recu_formule on public.paiements;
create trigger recu_formule before insert on public.paiements for each row execute function prive.trg_recu_formule();
