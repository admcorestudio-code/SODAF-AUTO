-- 0088 · Rapport de la semaine : chaque samedi (30 oct. 2026, décision du propriétaire). Appliqué par Claude.
-- Rappels au secrétariat : samedi 9 h et samedi 16 h (l'ancien rappel du dimanche 18 h passe au samedi 16 h), lundi 9 h si toujours pas envoyé.
-- À l'écran : envoi possible dès le samedi ; un rapport envoyé à partir du dimanche est marqué « En retard ».
select cron.alter_job((select jobid from cron.job where jobname = 'sodaf-rapport-dimanche'), schedule := '0 16 * * 6');
