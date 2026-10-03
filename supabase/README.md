# Base de données SODAF (Supabase)

Projet : `sodaf-auto-ecole` (région Paris, eu-west-3).

- `migrations/` : toute la structure de la base, dans l'ordre. Chaque changement = un nouveau fichier numéroté, appliqué tel quel. Jamais de modification à la main en production.
- Sécurité : RLS activé partout. Les visiteurs du site peuvent seulement créer une pré-inscription et envoyer un devoir. L'équipe connectée (table `profils`) lit, ajoute et modifie. Aucune suppression (sauf décocher une présence).
- Le 24 de chaque mois, `prive.generer_mois` crée créneaux de conduite, séances de code et semaines de devoirs du mois suivant (jours fériés exclus, table `jours_feries`).
