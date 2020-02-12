-- Ajout d'un champ actif pour la validation auto de création de compte (par email)
ALTER TABLE gnc_core.t_users ADD COLUMN active boolean DEFAULT FALSE;
UPDATE gnc_core.t_users set active = TRUE;

-- Ajout d'un champ "avatar" pour la personnalisation de l'avatar utilisateur
ALTER TABLE gnc_core.t_users ADD COLUMN avatar VARCHAR;