-- 0015 · Étape « Examen » : fin de formation → papiers + dépôt 30 000 F → dossier déposé → convocation → résultat
-- Ajouts seulement (aucune suppression).

alter table public.eleves
  add column if not exists examen_etape text check (examen_etape in ('pret','complet','depose','convoque')),
  add column if not exists examen_pret_le timestamptz,
  add column if not exists examen_lien_le timestamptz,
  add column if not exists examen_relance_le timestamptz,
  add column if not exists examen_depose_le date,
  add column if not exists examen_date date,
  add column if not exists examen_lieu text check (length(examen_lieu) <= 160),
  add column if not exists examen_passages smallint not null default 0 check (examen_passages between 0 and 10),
  add column if not exists examen_paye boolean not null default false,
  add column if not exists examen_docs jsonb not null default '{}'::jsonb,
  add column if not exists examen_paiement jsonb;

-- La pré-inscription publique ne peut toucher à aucun champ interne
alter policy "site : pré-inscription" on public.eleves
  with check (statut = 'Nouveau' and notes is null and source = 'site' and appels = 0 and rappel is null
              and accueil_le is null and archive_motif is null and archive_le is null and dossier = '{}'::jsonb
              and dossier_envoye_le is null and dossier_relance_le is null and jeton is null
              and provenance is null and dernier_appel_le is null
              and examen_etape is null and examen_paye = false and examen_docs = '{}'::jsonb and examen_paiement is null);

-- Lien personnel d'examen : valable tant que le dossier n'est pas déposé
create or replace function prive.jeton_examen_ok(p_id bigint, p_jeton text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.eleves e
                 where e.id = p_id and e.jeton is not null and e.jeton = p_jeton
                   and e.statut in ('Inscrit','En formation') and e.examen_etape in ('pret','complet'))
$$;
revoke all on function prive.jeton_examen_ok(bigint, text) from public;
grant execute on function prive.jeton_examen_ok(bigint, text) to anon, authenticated;

-- Chemin d'un fichier envoyé : "<n° élève>/<code>/<pièce>-<horodatage>.<ext>"
create or replace function prive.examen_chemin_ok(p_name text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare a text[] := string_to_array(p_name, '/');
begin
  if array_length(a, 1) <> 3 or a[1] !~ '^[0-9]{1,12}$' or a[2] !~ '^[A-Za-z0-9]{10,32}$'
     or a[3] !~ '^(cni|acte|photo1|photo2)-[0-9]{10,16}\.(jpg|jpeg|png|webp|heic|heif|pdf)$' then
    return false;
  end if;
  return prive.jeton_examen_ok(a[1]::bigint, a[2]);
end $$;
revoke all on function prive.examen_chemin_ok(text) from public;
grant execute on function prive.examen_chemin_ok(text) to anon, authenticated;

-- Ce que la page d'examen de l'élève affiche
create or replace function public.examen_info(p_id bigint, p_jeton text)
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'p', coalesce(nullif(split_part(trim(coalesce(e.prenoms, '')), ' ', 1), ''), split_part(trim(e.nom), ' ', 1)),
    'f', coalesce(e.formation, ''),
    'e', e.examen_etape,
    'docs', (select coalesce(json_object_agg(k, json_build_object('le', v->>'le', 'main', coalesce((v->>'main')::boolean, false))), '{}'::json)
             from jsonb_each(e.examen_docs) as d(k, v)),
    'paye', e.examen_paye,
    'pm', e.examen_paiement->>'mode',
    'm', coalesce((select r.valeur from public.reglages r where r.cle = 'mixx_numero'), ''),
    'n', coalesce((select r.valeur from public.reglages r where r.cle = 'mixx_nom'), ''))
  from public.eleves e
  where e.id = p_id and e.jeton is not null and e.jeton = p_jeton
    and e.statut in ('Inscrit','En formation','Permis obtenu') and e.examen_etape is not null
$$;

-- L'élève signale une pièce envoyée (le fichier est déjà dans le stockage privé)
create or replace function public.examen_envoi_doc(p_id bigint, p_jeton text, p_piece text, p_chemin text)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
begin
  if p_piece not in ('cni','acte','photo1','photo2') or not prive.jeton_examen_ok(p_id, p_jeton)
     or p_chemin not like (p_id::text || '/' || p_jeton || '/' || p_piece || '-%')
     or not exists (select 1 from storage.objects o where o.bucket_id = 'examen' and o.name = p_chemin) then
    return false;
  end if;
  update public.eleves
     set examen_docs = examen_docs || jsonb_build_object(p_piece, jsonb_build_object('chemin', p_chemin, 'le', now()))
   where id = p_id;
  return true;
end $$;

-- L'élève choisit comment il paie le dépôt de 30 000 F
create or replace function public.examen_choix_paiement(p_id bigint, p_jeton text, p_mode text, p_tel text, p_ref text)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
begin
  if p_mode not in ('agence','mixx') or not prive.jeton_examen_ok(p_id, p_jeton)
     or (p_mode = 'mixx' and coalesce(p_tel, '') = '' and coalesce(p_ref, '') = '')
     or length(coalesce(p_tel, '')) > 20 or length(coalesce(p_ref, '')) > 60 then
    return false;
  end if;
  update public.eleves
     set examen_paiement = jsonb_build_object('mode', p_mode, 'tel', nullif(p_tel, ''), 'ref', nullif(p_ref, ''), 'le', now())
   where id = p_id and examen_paye = false;
  return true;
end $$;

revoke all on function public.examen_info(bigint, text) from public;
revoke all on function public.examen_envoi_doc(bigint, text, text, text) from public;
revoke all on function public.examen_choix_paiement(bigint, text, text, text, text) from public;
grant execute on function public.examen_info(bigint, text) to anon, authenticated;
grant execute on function public.examen_envoi_doc(bigint, text, text, text) to anon, authenticated;
grant execute on function public.examen_choix_paiement(bigint, text, text, text, text) to anon, authenticated;

-- Stockage privé des papiers (photos ou PDF, 10 Mo max)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('examen', 'examen', false, 10485760,
        array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf'])
on conflict (id) do nothing;

create policy "examen : envoi par l'élève" on storage.objects for insert to anon
  with check (bucket_id = 'examen' and prive.examen_chemin_ok(name));
create policy "examen : l'équipe lit" on storage.objects for select to authenticated
  using (bucket_id = 'examen' and prive.est_equipe());
create policy "examen : l'équipe ajoute" on storage.objects for insert to authenticated
  with check (bucket_id = 'examen' and prive.est_equipe());
