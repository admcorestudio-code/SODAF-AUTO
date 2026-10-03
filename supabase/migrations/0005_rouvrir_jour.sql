-- Permet de « rouvrir » un jour fermé par erreur (concerne seulement le calendrier des fermetures, aucune donnée d'élève)
create policy "jours_feries équipe : retirer" on public.jours_feries for delete to authenticated using (prive.est_equipe());
grant delete on public.jours_feries to authenticated;
