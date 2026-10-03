-- Création automatique du mois suivant, le 24 de chaque mois à 6 h (UTC = heure de Lomé)
create extension if not exists pg_cron;
select cron.schedule('sodaf-mois-suivant', '0 6 24 * *', $$select public.generer_mois((date_trunc('month', current_date) + interval '1 month')::date)$$);
