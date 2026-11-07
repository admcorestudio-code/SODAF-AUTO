-- 7 nov. : le mercredi et le vendredi des semaines où le secrétariat a cours, l'accueil est fermé (journée terrain des ambassadeurs) ; avant : la direction tenait l'agence
create or replace function public.agence_qui(d date)
returns text language sql stable security definer set search_path to '' as $$
  select coalesce((select qui from public.agence_jours where jour = d),
    case when extract(isodow from d) = 7 then 'ferme'
         when extract(isodow from d) in (3, 5) and prive.semaine_cours(d) then 'ferme'
         else 'secretariat' end)
$$;
create or replace function public.agence_regler(p_jour date, p_qui text, p_note text)
returns void language plpgsql security definer set search_path to '' as $$
begin
  if not prive.a_role(array['admin', 'gerant']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  if p_jour is null or p_jour < current_date - 7 then raise exception 'Date incorrecte.'; end if;
  if p_qui is null then
    update public.agence_jours set qui = case when extract(isodow from p_jour) = 7 then 'ferme' when extract(isodow from p_jour) in (3, 5) and prive.semaine_cours(p_jour) then 'ferme' else 'secretariat' end,
           note = 'Retour à la règle', par = auth.uid(), le = now() where jour = p_jour;
    return;
  end if;
  if p_qui not in ('secretariat', 'gerant', 'admin', 'ferme') then raise exception 'Choix inconnu.'; end if;
  insert into public.agence_jours (jour, qui, note, par) values (p_jour, p_qui, nullif(trim(coalesce(p_note, '')), ''), auth.uid())
  on conflict (jour) do update set qui = excluded.qui, note = excluded.note, par = excluded.par, le = now();
end $$;
comment on column public.amb_rotation.terrain_jour is 'Plus utilisé depuis le 7 nov. (0117) : la journée terrain = mercredi et vendredi des semaines de cours du secrétariat (prive.semaine_cours).';
