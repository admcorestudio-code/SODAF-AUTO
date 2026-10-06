-- 0033 · Sécurité : journal des connexions, alerte « nouvel appareil », désactivation d'un compte par la direction
-- Rien n'est supprimé.

create table if not exists public.connexions (
  id bigint generated always as identity primary key,
  profil uuid not null references public.profils (id),
  le timestamptz not null default now(),
  appareil text not null check (length(appareil) <= 64),
  description text check (description is null or length(description) <= 120),
  ip text check (ip is null or length(ip) <= 64),
  nouvel boolean not null default false
);
create index if not exists connexions_profil_appareil on public.connexions (profil, appareil);
alter table public.connexions enable row level security;
-- La direction voit toutes les connexions, chacun voit les siennes. Personne n'écrit directement : seulement par la fonction ci-dessous.
create policy "connexions : direction ou soi-même" on public.connexions for select to authenticated
  using (prive.est_equipe() and (prive.a_role(array['admin']) or profil = auth.uid()));
grant select on public.connexions to authenticated;

-- Noter une connexion. p_login = vraie connexion avec mot de passe : si l'appareil est nouveau, alerte à la direction et à la personne.
create or replace function public.connexion_noter(p_appareil text, p_description text, p_login boolean)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
declare v_nouvel boolean; v_ip text; v_id bigint;
begin
  if not prive.est_equipe() then raise exception 'accès refusé' using errcode = '42501'; end if;
  if p_appareil is null or length(p_appareil) < 8 then raise exception 'appareil inconnu'; end if;
  v_nouvel := not exists (select 1 from public.connexions where profil = auth.uid() and appareil = left(p_appareil, 64));
  begin
    v_ip := trim(split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1));
  exception when others then v_ip := null;
  end;
  insert into public.connexions (profil, appareil, description, ip, nouvel)
  values (auth.uid(), left(p_appareil, 64), left(p_description, 120), nullif(left(v_ip, 64), ''), v_nouvel and coalesce(p_login, false))
  returning id into v_id;
  if v_nouvel and coalesce(p_login, false) then
    perform prive.notifier(jsonb_build_object('type', 'connexion', 'id', v_id));
  end if;
  return v_nouvel;
end $$;
revoke all on function public.connexion_noter(text, text, boolean) from public, anon;
grant execute on function public.connexion_noter(text, text, boolean) to authenticated;

-- Désactiver / réactiver un compte (direction seulement, jamais son propre compte). Effet immédiat : plus aucune donnée visible.
create or replace function public.compte_activer(p_id uuid, p_actif boolean)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if not prive.a_role(array['admin']) then raise exception 'réservé à la direction' using errcode = '42501'; end if;
  if p_id = auth.uid() then raise exception 'impossible de désactiver ton propre compte'; end if;
  update public.profils set actif = coalesce(p_actif, false) where id = p_id;
end $$;
revoke all on function public.compte_activer(uuid, boolean) from public, anon;
grant execute on function public.compte_activer(uuid, boolean) to authenticated;

-- Sauvegarde hebdomadaire : ajouter le journal des connexions
do $$
declare d text;
begin
  select pg_get_functiondef('public.sauvegarde_export()'::regprocedure) into d;
  if position('''connexions''' in d) = 0 then
    d := replace(d, '''ecoutes''', '''ecoutes'',''connexions''');
    execute d;
  end if;
end $$;
