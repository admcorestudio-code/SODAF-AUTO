-- 0063 : numéros Mixx de l'équipe et « pas reçu » = d'abord vérifier le numéro (décision du propriétaire, 21 octobre 2026)
-- Sur Mixx / Moov, l'argent ne se perd presque jamais : un « pas reçu » vient presque toujours d'un mauvais numéro.
-- 1. La direction enregistre une fois le numéro Mixx de chaque personne ; la carte de paiement l'affiche en gros.
-- 2. « Pas reçu » : la direction ouvre son reçu → « Le numéro est bon » (la personne regarde son solde) ou « Mauvais numéro ».
--    Seulement après « Mauvais numéro » : renvoi au bon numéro ; l'argent parti au mauvais numéro reste « à récupérer » (service client Yas)
--    jusqu'à « Argent récupéré ».

create table if not exists prive.numeros_mixx (
  profil uuid primary key references public.profils(id),
  numero text check (numero ~ '^[0-9]{8}$'),
  le timestamptz not null default now(),
  par uuid references public.profils(id)
);
alter table prive.numeros_mixx enable row level security;

alter table public.taches add column if not exists mauvais_numero_le timestamptz;

-- Liste des numéros (direction seulement)
create or replace function public.numeros_mixx()
returns table (profil uuid, numero text) language sql stable security definer set search_path = '' as $$
  select n.profil, n.numero from prive.numeros_mixx n where prive.a_role(array['admin'])
$$;

-- Enregistrer ou changer un numéro (direction seulement ; vide = effacer le numéro)
create or replace function public.numero_mixx_regler(p_profil uuid, p_numero text)
returns void language plpgsql security definer set search_path = '' as $$
declare n text := nullif(regexp_replace(coalesce(p_numero, ''), '\D', '', 'g'), '');
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  if n is not null and length(n) = 11 and left(n, 3) = '228' then n := right(n, 8); end if;
  if n is not null and n !~ '^[0-9]{8}$' then raise exception 'Numéro à 8 chiffres (ex. 72 54 41 66).'; end if;
  if not exists (select 1 from public.profils where id = p_profil) then raise exception 'compte introuvable'; end if;
  insert into prive.numeros_mixx (profil, numero, le, par) values (p_profil, n, now(), auth.uid())
  on conflict (profil) do update set numero = excluded.numero, le = now(), par = auth.uid();
end $$;

-- Paiement : chaque envoi garde le numéro vers lequel il est parti ; renvoi seulement après « Mauvais numéro »
create or replace function public.tache_payer(p_id bigint, p_moyen text, p_montant integer, p_ref text, p_recu text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_vers text;
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  if p_moyen not in ('Mixx', 'Moov Money', 'Espèces', 'Autre') then raise exception 'Choisis le moyen de paiement.'; end if;
  if p_montant is null or p_montant <= 0 then raise exception 'Écris le montant envoyé.'; end if;
  if p_moyen <> 'Espèces' and coalesce(p_recu, '') = '' then raise exception 'Joins le reçu du paiement.'; end if;
  if p_recu is not null and p_recu not like 'taches/%' then raise exception 'pièce invalide'; end if;
  select n.numero into v_vers from public.taches t join prive.numeros_mixx n on n.profil = t.pour where t.id = p_id;
  update public.taches set etape = 'envoye', paye_le = now(), paye_par = auth.uid(), paye_moyen = p_moyen, paye_montant = p_montant,
         paye_ref = nullif(trim(coalesce(p_ref, '')), ''), paye_recu = nullif(p_recu, ''),
         pas_recu_le = null, pas_recu_note = null, relance_le = null, mauvais_numero_le = null,
         envois = envois || jsonb_build_array(jsonb_build_object('le', now(), 'moyen', p_moyen, 'montant', p_montant, 'recu', nullif(p_recu, ''),
                                                                 'vers', case when p_moyen = 'Espèces' then null else v_vers end))
   where id = p_id and argent and (etape = 'payer' or (etape = 'envoye' and mauvais_numero_le is not null));
  if not found then raise exception 'tâche introuvable, déjà payée, ou « Mauvais numéro » pas encore noté'; end if;
  perform prive.tache_notif(p_id, 'argent');
end $$;

-- « Le numéro est bon » : la personne est prévenue de regarder son solde Mixx (le SMS n'arrive pas toujours)
create or replace function public.tache_numero_bon(p_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  update public.taches set pas_recu_le = null, pas_recu_note = null, relance_le = null
   where id = p_id and etape = 'envoye' and pas_recu_le is not null;
  if not found then raise exception 'tâche introuvable'; end if;
  perform prive.tache_notif(p_id, 'numero_bon');
end $$;

-- « Mauvais numéro » : le dernier envoi est marqué (argent à récupérer), le renvoi devient possible
create or replace function public.tache_mauvais_numero(p_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  update public.taches set mauvais_numero_le = now(),
         envois = case when jsonb_array_length(envois) > 0
                       then jsonb_set(envois, array[(jsonb_array_length(envois) - 1)::text], envois -> (jsonb_array_length(envois) - 1) || '{"mauvais_numero": true}'::jsonb)
                       else envois end
   where id = p_id and etape = 'envoye' and pas_recu_le is not null and mauvais_numero_le is null;
  if not found then raise exception 'tâche introuvable ou déjà notée'; end if;
end $$;

-- Argent parti au mauvais numéro, récupéré (après le service client Yas)
create or replace function public.tache_envoi_recupere(p_id bigint, p_index integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  update public.taches set envois = jsonb_set(envois, array[p_index::text], envois -> p_index || jsonb_build_object('recupere', true, 'recupere_le', now()))
   where id = p_id and p_index >= 0 and p_index < jsonb_array_length(envois) and (envois -> p_index ->> 'mauvais_numero') = 'true';
  if not found then raise exception 'envoi introuvable'; end if;
end $$;

do $$
declare f text;
begin
  foreach f in array array['numeros_mixx()', 'numero_mixx_regler(uuid, text)', 'tache_payer(bigint, text, integer, text, text)', 'tache_numero_bon(bigint)',
                           'tache_mauvais_numero(bigint)', 'tache_envoi_recupere(bigint, integer)'] loop
    execute 'revoke all on function public.' || f || ' from public, anon';
    execute 'grant execute on function public.' || f || ' to authenticated';
  end loop;
end $$;
