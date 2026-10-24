-- 0075 · Inscription seule à 5 000 F, et inscription à 5 000 F pour tous (décision du propriétaire, 24 oct. 2026)
-- « Tu paies 5 000 F, tu es inscrit. Pour commencer les cours, tu paies au moins la moitié. »
-- 1. Droit d'inscription : 5 000 F pour tout le monde (étudiants : 3 000 → 5 000). Gagnant du tirage et remise à niveau : inchangés.
-- 2. Nouveau paiement « Droit d'inscription seul » : il est inscrit (commission du parrain créée tout de suite, comme avant).
--    Il ne commence ni le code en salle ni la conduite tant qu'il n'a pas payé au moins la moitié de la formation
--    (reçus « 1re moitié de la formation » ou « Toute la formation »).
-- 3. Les 3 mois de formation et les 2 semaines pour le solde partent du premier paiement de la formation, pas de l'inscription seule.
-- 4. L'inscription seule reste valable 2 mois : après, le reçu de formation est refusé (il refait « inscription + moitié »).
-- Rien n'est supprimé. Idempotent.

create or replace function prive.formule_prix(p_formule text)
returns table (prix integer, ins integer) language sql immutable set search_path = '' as $$
  select x.p, x.i from (values ('Formation complète (permis B)', 55000, 5000), ('Formule rapide (permis B)', 35000, 5000),
    ('Formation complète, tarif étudiant (permis B)', 30000, 5000), ('Formation complète, gagnant du tirage (permis B)', 15000, 0),
    ('Remise à niveau', 25000, 0)) x(f, p, i) where x.f = p_formule
$$;

-- Lien d'inscription : choix « inscription seule »
alter table public.inscriptions_web drop constraint if exists inscriptions_web_paiement_check;
alter table public.inscriptions_web add constraint inscriptions_web_paiement_check check (paiement in ('moitie', 'total', 'inscription'));

create or replace function prive.trg_insc_garde()
returns trigger language plpgsql security definer set search_path = '' as $$
declare fp record;
begin
  if tg_op = 'INSERT' then
    select * into fp from prive.formule_prix(new.formule);
    if not found then raise exception 'Formule inconnue.'; end if;
    if new.paiement = 'inscription' and fp.ins = 0 then raise exception 'Pas d''inscription seule pour cette formule.'; end if;
    if new.prix <> fp.prix or new.a_payer <> fp.ins + (select case when new.paiement = 'total' then fp.prix when new.paiement = 'inscription' then 0 else fp.prix / 2 end) then
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

create or replace function public.inscription_corriger(p_id bigint, p_formule text, p_paiement text, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare w public.inscriptions_web; fp record; n text := trim(coalesce(p_note, '')); tp uuid;
begin
  if not prive.a_role(array['admin', 'gerant']) then raise exception 'réservé à la gérante' using errcode = '42501'; end if;
  if length(n) < 3 then raise exception 'Écris ce que tu as vérifié (ex. client appelé, carte d''étudiant vue).'; end if;
  if p_paiement not in ('moitie', 'total', 'inscription') then raise exception 'Choisis : l''inscription seule, la moitié ou tout.'; end if;
  select * into fp from prive.formule_prix(p_formule);
  if not found then raise exception 'Formule inconnue.'; end if;
  select * into w from public.inscriptions_web where id = p_id for update;
  if not found or w.statut = 'Rejeté' then raise exception 'inscription introuvable'; end if;
  if exists (select 1 from public.paiements where eleve_id = w.eleve_id and not annule) then
    raise exception 'Un reçu est déjà fait : passe par l''annulation du reçu.';
  end if;
  perform set_config('sodaf.correction', 'oui', true);
  update public.inscriptions_web set formule = p_formule, prix = fp.prix, paiement = p_paiement,
         a_payer = fp.ins + case when p_paiement = 'total' then fp.prix when p_paiement = 'inscription' then 0 else fp.prix / 2 end,
         corrige_le = now(), corrige_par = auth.uid(), correction_note = n
   where id = p_id;
  perform set_config('sodaf.correction', '', true);
  if w.correction_tache is not null then
    update public.taches set etape = 'fait', fait_le = now(), fait_par = auth.uid(), fait_note = left('Corrigé : ' || replace(p_formule, ' (permis B)', '') || '. ' || n, 300)
     where id = w.correction_tache and etape = 'afaire' returning par into tp;
    if tp is not null and tp <> auth.uid() then perform prive.tache_notif(w.correction_tache, 'faite'); end if;
  end if;
end $$;

-- La formation est-elle payée (au moins la moitié) ?
create or replace function prive.formation_payee(e bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.paiements p
                  where p.eleve_id = e and coalesce(p.annule, false) = false
                    and (p.motif like 'Droit d''inscription +%' or p.motif in ('1re moitié de la formation', 'Toute la formation')))
$$;
revoke all on function prive.formation_payee(bigint) from public;

-- Date du premier paiement de la formation (début des 3 mois et des 2 semaines)
create or replace function prive.debut_formation(e bigint)
returns date language sql stable security definer set search_path = '' as $$
  select min(p.cree_le)::date from public.paiements p
   where p.eleve_id = e and coalesce(p.annule, false) = false
     and (p.motif like 'Droit d''inscription +%' or p.motif in ('1re moitié de la formation', 'Toute la formation'))
$$;
revoke all on function prive.debut_formation(bigint) from public;

-- Code en salle : seulement quand la formation est payée (au moins la moitié)
create or replace function prive.en_code(el public.eleves) returns boolean
language sql stable set search_path = public as $$
  select el.statut in ('Inscrit', 'En formation') and el.examen_etape is null
     and coalesce(el.formation, '') !~* '(remise à niveau|entreprise)'
     and prive.formation_payee(el.id)
$$;

-- Place suspendue : solde impayé 2 semaines après le premier paiement de la formation
create or replace function prive.place_suspendue(e bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(prive.solde_eleve(e) > 0 and now() - prive.debut_formation(e)::timestamptz >= interval '14 days', false)
$$;

-- Reçu de formation après une inscription seule : l'inscription doit dater de moins de 2 mois
create or replace function prive.trg_recu_inscription_valide()
returns trigger language plpgsql security definer set search_path = '' as $$
declare d timestamptz;
begin
  if new.eleve_id is null or new.motif not in ('1re moitié de la formation', 'Toute la formation') then return new; end if;
  select max(p.cree_le) into d from public.paiements p
   where p.eleve_id = new.eleve_id and coalesce(p.annule, false) = false and p.motif like 'Droit d''inscription%';
  if d is null then raise exception 'Pas encore d''inscription pour cet élève : choisis « Il s''inscrit et paie la moitié » (ou tout).'; end if;
  if d < now() - interval '2 months' then
    raise exception 'Son inscription du % a plus de 2 mois : elle n''est plus valable. Choisis « Il s''inscrit et paie la moitié » (inscription à repayer).', to_char(d at time zone 'Africa/Lome', 'DD/MM/YYYY');
  end if;
  return new;
end $$;
drop trigger if exists recu_inscription_valide on public.paiements;
create trigger recu_inscription_valide before insert on public.paiements for each row execute function prive.trg_recu_inscription_valide();

-- 5. Code en ligne réservé aux inscrits : le site vérifie le lien personnel (n° + jeton) ou le n° client + téléphone.
--    Accès donné dès qu'un reçu d'inscription existe (inscription seule ou avec la formation). Ne renvoie que le prénom.
create or replace function public.acces_code(p_id bigint, p_jeton text default null, p_tel text default null)
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object('p', coalesce(nullif(split_part(trim(coalesce(e.prenoms, '')), ' ', 1), ''), split_part(trim(e.nom), ' ', 1)))
    from public.eleves e
   where e.id = p_id
     and ((p_jeton is not null and e.jeton is not null and e.jeton = p_jeton)
          or (p_tel is not null and length(regexp_replace(p_tel, '\D', '', 'g')) >= 8
              and right(regexp_replace(coalesce(e.telephone, ''), '\D', '', 'g'), 8) = right(regexp_replace(p_tel, '\D', '', 'g'), 8)))
     and exists (select 1 from public.paiements p where p.eleve_id = e.id and coalesce(p.annule, false) = false and p.motif like 'Droit d''inscription%')
$$;
revoke all on function public.acces_code(bigint, text, text) from public;
grant execute on function public.acces_code(bigint, text, text) to anon, authenticated;
