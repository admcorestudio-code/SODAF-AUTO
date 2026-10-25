-- 0080 : planning de l'équipe, qui tient l'agence (décision du propriétaire, 25 octobre 2026)
-- Le secrétariat est étudiant : une semaine sur deux, il a cours le mercredi et le vendredi.
-- Ces jours-là, la gérante tient l'agence. Semaine du lundi 26 octobre 2026 = semaine de cours ; la suivante = semaine libre ; et ainsi de suite.
-- La direction ou la gérante peut changer un jour précis (autre personne, ou agence fermée) : table agence_jours.
-- La veille à 18 h, la personne qui remplace le secrétariat reçoit un rappel.

create table if not exists public.agence_jours (
  jour date primary key,
  qui text not null check (qui in ('secretariat', 'gerant', 'admin', 'ferme')),
  note text check (length(note) <= 200),
  par uuid not null default auth.uid() references public.profils(id),
  le timestamptz not null default now()
);
alter table public.agence_jours enable row level security;
drop policy if exists "agence : lire" on public.agence_jours;
create policy "agence : lire" on public.agence_jours for select to authenticated using (prive.est_membre());
grant select on public.agence_jours to authenticated;

-- Semaine de cours du secrétariat ? (lundi 26 oct. 2026 = oui, puis une semaine sur deux)
create or replace function prive.semaine_cours(d date)
returns boolean language sql immutable set search_path = '' as $$
  select (((date_trunc('week', d)::date - date '2026-10-26') / 7) % 2 + 2) % 2 = 0
$$;

-- Qui tient l'agence ce jour-là
create or replace function public.agence_qui(d date)
returns text language sql stable security definer set search_path = '' as $$
  select coalesce((select qui from public.agence_jours where jour = d),
    case when extract(isodow from d) = 7 then 'ferme'
         when extract(isodow from d) in (3, 5) and prive.semaine_cours(d) then 'gerant'
         else 'secretariat' end)
$$;

-- Changer un jour (direction, gérante) ; p_qui null = revenir à la règle
create or replace function public.agence_regler(p_jour date, p_qui text, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not prive.a_role(array['admin', 'gerant']) then raise exception 'réservé à la direction et à la gérante' using errcode = '42501'; end if;
  if p_jour is null or p_jour < current_date - 7 then raise exception 'Date incorrecte.'; end if;
  if p_qui is null then
    update public.agence_jours set qui = case when extract(isodow from p_jour) in (3, 5) and prive.semaine_cours(p_jour) then 'gerant' when extract(isodow from p_jour) = 7 then 'ferme' else 'secretariat' end,
           note = 'Retour à la règle', par = auth.uid(), le = now() where jour = p_jour;
    return;
  end if;
  if p_qui not in ('secretariat', 'gerant', 'admin', 'ferme') then raise exception 'Choix inconnu.'; end if;
  insert into public.agence_jours (jour, qui, note, par) values (p_jour, p_qui, nullif(trim(coalesce(p_note, '')), ''), auth.uid())
  on conflict (jour) do update set qui = excluded.qui, note = excluded.note, par = excluded.par, le = now();
end $$;
revoke all on function public.agence_regler(date, text, text) from public, anon;
grant execute on function public.agence_regler(date, text, text) to authenticated;
revoke all on function public.agence_qui(date) from public, anon;
grant execute on function public.agence_qui(date) to authenticated;

-- Rappel la veille à 18 h (Lomé = UTC) à la personne qui remplace le secrétariat
create or replace function prive.agence_rappel()
returns void language plpgsql security definer set search_path = '' as $$
declare d date := current_date + 1; q text := public.agence_qui(current_date + 1);
begin
  if q in ('gerant', 'admin') then
    perform prive.notifier(jsonb_build_object('type', 'agence', 'jour', d, 'qui', q,
      'note', (select note from public.agence_jours where jour = d)));
  end if;
end $$;
revoke all on function prive.agence_rappel() from public, anon, authenticated;
select cron.unschedule('sodaf-agence-rappel') where exists (select 1 from cron.job where jobname = 'sodaf-agence-rappel');
select cron.schedule('sodaf-agence-rappel', '7 18 * * *', $c$ select prive.agence_rappel() $c$);
