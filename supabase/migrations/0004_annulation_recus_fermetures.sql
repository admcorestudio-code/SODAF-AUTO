-- Reçus : on n'efface jamais, on annule (le reçu reste visible, barré, hors des totaux)
alter table public.paiements
  add column if not exists annule boolean not null default false,
  add column if not exists annule_motif text check (length(annule_motif) <= 200),
  add column if not exists annule_le timestamptz;

-- Jours fériés et fermetures exceptionnelles : l'équipe peut en ajouter depuis le site
create policy "jours_feries équipe : ajouter" on public.jours_feries for insert to authenticated with check (prive.est_equipe());
create policy "jours_feries équipe : modifier" on public.jours_feries for update to authenticated using (prive.est_equipe()) with check (prive.est_equipe());
grant insert, update on public.jours_feries to authenticated;
