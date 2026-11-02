-- Corps habillés au même prix que tout le monde (2 nov. 2026) : le tarif à 50 000 F (0083) est retiré.
-- Aucune inscription, aucun reçu, aucune fiche ne l'utilisait. On les vise seulement dans la publicité.
create or replace function prive.formule_prix(p_formule text)
 returns table(prix integer, ins integer)
 language sql immutable set search_path to ''
as $function$
  select x.p, x.i from (values ('Formation complète (permis B)', 55000, 5000), ('Formule rapide (permis B)', 35000, 5000),
    ('Formation complète, tarif étudiant (permis B)', 30000, 5000), ('Formation complète, gagnant du tirage (permis B)', 15000, 0),
    ('Remise à niveau', 25000, 0), ('Formation privée (permis B)', 85000, 5000)) x(f, p, i) where x.f = p_formule
$function$;
