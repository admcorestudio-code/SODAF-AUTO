-- Les fonctions internes passent dans un schéma privé, non exposé par l'API
create schema if not exists prive;
alter function public.est_equipe() set schema prive;
alter function public.generer_mois(date) set schema prive;
revoke all on schema prive from public, anon;
grant usage on schema prive to authenticated;
revoke execute on function prive.est_equipe() from public, anon;
grant execute on function prive.est_equipe() to authenticated;
select cron.unschedule('sodaf-mois-suivant');
select cron.schedule('sodaf-mois-suivant', '0 6 24 * *', $$select prive.generer_mois((date_trunc('month', current_date) + interval '1 month')::date)$$);
