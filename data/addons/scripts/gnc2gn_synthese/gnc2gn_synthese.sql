/* START TRANSACTION */
BEGIN;
/* Insert citizen source */

INSERT INTO gn_synthese.t_sources ( name_source
                                  , desc_source
                                  , entity_source_pk_field
                                  , url_source
                                  , meta_create_date
                                  , meta_update_date)
VALUES ( 'gncitizen'
       , 'Instance intégrée de GeoNature-citizen'
       , 'gnc_obstax.t_obstax.id_observation'
       , 'http://<moncitizen.org>/'
       , now()
       , now())
ON CONFLICT (name_source) DO NOTHING;

/* UPSERT project INTO gn_meta.t_acquisition_framework */
DROP TRIGGER IF EXISTS tri_c_upsert_af_to_geonature ON gnc_core.t_projects;
DROP FUNCTION IF EXISTS gnc_core.fct_tri_c_upsert_af_to_geonature () CASCADE;
CREATE OR REPLACE FUNCTION gnc_core.fct_tri_c_upsert_af_to_geonature()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS
$func$
BEGIN
    INSERT INTO gn_meta.t_acquisition_frameworks( acquisition_framework_name
                                                , unique_acquisition_framework_id
                                                , acquisition_framework_desc
                                                , acquisition_framework_start_date
                                                , meta_create_date)
    VALUES ( new.name
           , new.unique_id_project
           , coalesce(new.long_desc, coalesce(new.short_desc, 'Not defined'))
           , new.timestamp_create
           , new.timestamp_update)
    ON CONFLICT (unique_acquisition_framework_id)
        DO UPDATE SET acquisition_framework_name = new.name
                    , acquisition_framework_desc = coalesce(new.long_desc,
                                                            coalesce(new.short_desc, 'Not defined'));
    RETURN new;
END;
$func$;

COMMENT ON FUNCTION gnc_core.fct_tri_c_upsert_af_to_geonature () IS 'Trigger function to upsert acquisition framework from GeoNature-citizen project';
CREATE TRIGGER tri_c_upsert_af_to_geonature
    AFTER INSERT OR UPDATE
    ON gnc_core.t_projects
    FOR EACH ROW
EXECUTE PROCEDURE gnc_core.fct_tri_c_upsert_af_to_geonature();


/* UPSERT program INTO gn_meta.t_datasets */

DROP TRIGGER IF EXISTS tri_c_upsert_dataset_to_geonature ON gnc_core.t_programs;
DROP FUNCTION IF EXISTS gnc_core.fct_tri_c_upsert_dataset_to_geonature () CASCADE;
CREATE OR REPLACE FUNCTION gnc_core.fct_tri_c_upsert_dataset_to_geonature()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS
$func$
DECLARE
    the_id_acquisition_framework INT;
BEGIN
    SELECT id_acquisition_framework
    INTO the_id_acquisition_framework
    FROM gn_meta.t_acquisition_frameworks
             JOIN gnc_core.t_projects ON unique_acquisition_framework_id = t_projects.unique_id_project
    WHERE t_projects.id_project = new.id_project;

    INSERT INTO gn_meta.t_datasets( id_acquisition_framework
                                  , unique_dataset_id
                                  , dataset_name
                                  , dataset_shortname
                                  , dataset_desc
                                  , keywords
                                  , marine_domain
                                  , terrestrial_domain
                                  , meta_create_date
                                  , meta_update_date)
    VALUES ( the_id_acquisition_framework
           , new.unique_id_program
           , new.title
           , coalesce(new.short_desc, 'Not defined')
           , regexp_replace(coalesce(new.long_desc, 'Not defined'), E'<[^>]+>', '', 'gi')
           , 'GeoNature-Citizen'
           , FALSE
           , TRUE
           , new.timestamp_create
           , new.timestamp_update)
    ON CONFLICT (unique_dataset_id)
        DO UPDATE SET id_acquisition_framework = the_id_acquisition_framework
                    , dataset_name             = new.title
                    , dataset_shortname        = coalesce(new.short_desc, 'Not defined')
                    , dataset_desc             = regexp_replace(coalesce(new.long_desc, 'Not defined'), E'<[^>]+>', '',
                                                                'gi');
    RETURN new;
END;
$func$;

COMMENT ON FUNCTION gnc_core.fct_tri_c_upsert_dataset_to_geonature () IS 'Trigger function to upsert acquisition framework from GeoNature-citizen project';
DROP TRIGGER IF EXISTS tri_c_upsert_dataset_to_geonature ON gnc_core.t_programs;
CREATE TRIGGER tri_c_upsert_dataset_to_geonature
    AFTER INSERT OR UPDATE
    ON gnc_core.t_programs
    FOR EACH ROW
EXECUTE PROCEDURE gnc_core.fct_tri_c_upsert_dataset_to_geonature();

/* UPSERT observation INTO gn_synthese.synthese */

DROP TRIGGER IF EXISTS tri_c_upsert_obstax_to_geonature ON gnc_core.t_programs;
DROP FUNCTION IF EXISTS gnc_core.fct_tri_c_upsert_obstax_to_geonature () CASCADE;
CREATE OR REPLACE FUNCTION gnc_core.fct_tri_c_upsert_obstax_to_geonature()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS
$func$
DECLARE
    the_id_dataset   INT;
    the_id_source    INT;
    the_nom_cite     TEXT;
    the_alt_min      INT;
    the_alt_max      INT;
    the_local_srid   INT;
    the_observer     TEXT;
    the_id_digitizer INT;

BEGIN
    SELECT id_dataset
    INTO the_id_dataset
    FROM gn_meta.t_datasets
             JOIN gnc_core.t_programs ON t_programs.unique_id_program = t_datasets.unique_dataset_id
    WHERE t_programs.id_program = new.id_program;

    SELECT id_source INTO the_id_source FROM gn_synthese.t_sources WHERE name_source LIKE 'gncitizen';

    SELECT lb_nom INTO the_nom_cite FROM taxonomie.taxref WHERE taxref.cd_nom = new.cd_nom;

    SELECT parameter_value::INT INTO the_local_srid FROM gn_commons.t_parameters WHERE parameter_name = 'local_srid';

    SELECT CASE
               WHEN t_roles.id_role IS NOT NULL THEN
                   t_roles.nom_role || ' ' || t_roles.prenom_role
               WHEN t_users.id_user IS NOT NULL THEN
                   t_users.surname || ' ' || t_users.name
               ELSE t_obstax.obs_txt END
    INTO the_observer
    FROM gnc_obstax.t_obstax
             LEFT JOIN gnc_core.t_users ON t_obstax.id_role = t_users.id_user
             LEFT JOIN utilisateurs.t_roles ON t_users.email = t_roles.email
    WHERE t_obstax.id_observation = new.id_observation;

    SELECT
        t_roles.id_role
        INTO the_id_digitizer
        FROM
            gnc_obstax.t_obstax
                join gnc_core.t_users on t_obstax.id_role = t_users.id_user
                JOIN utilisateurs.t_roles ON t_roles.email = t_users.email
        where
            t_obstax.id_role = new.id_role;

    SELECT * FROM ref_geo.fct_get_altitude_intersection(new.geom) INTO the_alt_min, the_alt_max;

    INSERT INTO gn_synthese.synthese( unique_id_sinp
                                    , id_source
                                    , entity_source_pk_value
                                    , id_dataset
                                    , id_nomenclature_geo_object_nature
                                    , id_nomenclature_grp_typ
                                    , id_nomenclature_obs_technique
                                    , id_nomenclature_bio_status
                                    , id_nomenclature_bio_condition
                                    , id_nomenclature_naturalness
                                    , id_nomenclature_exist_proof
                                    , id_nomenclature_valid_status
                                    , id_nomenclature_diffusion_level
                                    , id_nomenclature_life_stage
                                    , id_nomenclature_sex
                                    , id_nomenclature_obj_count
                                    , id_nomenclature_type_count
                                    , id_nomenclature_sensitivity
                                    , id_nomenclature_observation_status
                                    , id_nomenclature_blurring
                                    , id_nomenclature_source_status
                                    , id_nomenclature_info_geo_type
                                    , count_min
                                    , count_max
                                    , cd_nom
                                    , nom_cite
--                             , digital_proof
                                    , altitude_min
                                    , altitude_max
                                    , the_geom_4326
                                    , the_geom_point
                                    , the_geom_local
                                    , date_min
                                    , date_max
                                    , observers
                                    , id_digitiser
                                    , id_nomenclature_determination_method
                                    , comment_description
                                    , meta_create_date
                                    , meta_update_date
                                    , last_action)
    VALUES ( new.uuid_sinp
           , the_id_source
           , new.id_observation
           , the_id_dataset
           , ref_nomenclatures.get_id_nomenclature(
                     'NAT_OBJ_GEO',
                     new.json_data ->> 'nomenclature_geo_object_nature')
           , ref_nomenclatures.get_id_nomenclature(
                     'TYP_GRP',
                     new.json_data ->> 'nomenclature_grp_typ')
           , ref_nomenclatures.get_id_nomenclature(
                     'TECHNIQUE_OBS',
                     new.json_data ->> 'nomenclature_obs_technique')
           , ref_nomenclatures.get_id_nomenclature(
                     'STATUT_BIO',
                     new.json_data ->> 'nomenclature_bio_status')
           , ref_nomenclatures.get_id_nomenclature(
                     'ETA_BIO',
                     new.json_data ->> 'nomenclature_bio_condition')
           , ref_nomenclatures.get_id_nomenclature(
                     'NATURALITE',
                     new.json_data ->> 'nomenclature_naturalness')
           , ref_nomenclatures.get_id_nomenclature(
                     'PREUVE_EXIST',
                     new.json_data ->> 'nomenclature_exist_proof')
           , ref_nomenclatures.get_id_nomenclature(
                     'STATUT_VALID',
                     coalesce(new.json_data ->> 'nomenclature_valid_status', '0'))
           , ref_nomenclatures.get_id_nomenclature(
                     'NIV_PRECIS',
                     coalesce(new.json_data ->> 'nomenclature_diffusion_level', '0'))
           , ref_nomenclatures.get_id_nomenclature(
                     'STADE_VIE',
                     new.json_data ->> 'nomenclature_life_stage')
           , ref_nomenclatures.get_id_nomenclature(
                     'SEXE',
                     new.json_data ->> 'nomenclature_sex')
           , ref_nomenclatures.get_id_nomenclature(
                     'OBJ_DENBR',
                     new.json_data ->> 'nomenclature_obj_count')
           , ref_nomenclatures.get_id_nomenclature(
                     'TYP_DENBR',
                     new.json_data ->> 'nomenclature_type_count')
           , ref_nomenclatures.get_id_nomenclature(
                     'SENSIBILITE',
                     coalesce(new.json_data ->> 'nomenclature_sensivivity', '0'))
           , ref_nomenclatures.get_id_nomenclature(
                     'STATUT_OBS',
                     coalesce(new.json_data ->> 'nomenclature_observation_status', 'Pr'))
           , ref_nomenclatures.get_id_nomenclature(
                     'DEE_FLOU',
                     coalesce(new.json_data ->> 'nomenclature_blurring', 'NON'))
           , ref_nomenclatures.get_id_nomenclature(
                     'STATUT_SOURCE',
                     new.json_data ->> 'nomenclature_source_status')
           , ref_nomenclatures.get_id_nomenclature(
                     'TYP_INF_GEO',
                     new.json_data ->> 'nomenclature_info_geo_type')
           , new.count
           , new.count
           , new.cd_nom
           , the_nom_cite
--         ,                                                        digital_proof
           , the_alt_min
           , the_alt_max
           , new.geom
           , st_centroid(new.geom)
           , st_transform(new.geom, the_local_srid)
           , new.date
           , new.date
           , the_observer
           , the_id_digitizer
           , ref_nomenclatures.get_id_nomenclature(
                     'METH_DETERMIN',
                     new.json_data ->> 'nomenclature_determination_method')
           , new.comment
           , new.timestamp_create
           , new.timestamp_update
           , 'I')
    ON CONFLICT (unique_id_sinp)
        DO UPDATE SET (unique_id_sinp, id_source, entity_source_pk_value, id_dataset, id_nomenclature_geo_object_nature,
                       id_nomenclature_grp_typ, id_nomenclature_obs_technique, id_nomenclature_bio_status,
                       id_nomenclature_bio_condition, id_nomenclature_naturalness, id_nomenclature_exist_proof,
                       id_nomenclature_valid_status, id_nomenclature_diffusion_level, id_nomenclature_life_stage,
                       id_nomenclature_sex,
                       id_nomenclature_obj_count, id_nomenclature_type_count, id_nomenclature_sensitivity,
                       id_nomenclature_observation_status, id_nomenclature_blurring, id_nomenclature_source_status,
                       id_nomenclature_info_geo_type, count_min, count_max, cd_nom, nom_cite
--                             , digital_proof
                          , altitude_min, altitude_max, the_geom_4326, the_geom_point, the_geom_local, date_min,
                       date_max, observers,
                       id_digitiser, id_nomenclature_determination_method, comment_description, meta_create_date,
                       meta_update_date,
                       last_action)= (new.uuid_sinp, the_id_source, new.id_observation, the_id_dataset,
                                      ref_nomenclatures.get_id_nomenclature(
                                              'NAT_OBJ_GEO',
                                              new.json_data ->> 'nomenclature_geo_object_nature'),
                                      ref_nomenclatures.get_id_nomenclature(
                                              'TYP_GRP',
                                              new.json_data ->> 'nomenclature_grp_typ'),
                                      ref_nomenclatures.get_id_nomenclature(
                                              'TECHNIQUE_OBS',
                                              new.json_data ->> 'nomenclature_obs_technique'),
                                      ref_nomenclatures.get_id_nomenclature(
                                              'STATUT_BIO',
                                              new.json_data ->> 'nomenclature_bio_status'),
                                      ref_nomenclatures.get_id_nomenclature(
                                              'ETA_BIO',
                                              new.json_data ->> 'nomenclature_bio_condition'),
                                      ref_nomenclatures.get_id_nomenclature(
                                              'NATURALITE',
                                              new.json_data ->> 'nomenclature_naturalness'),
                                      ref_nomenclatures.get_id_nomenclature(
                                              'PREUVE_EXIST',
                                              new.json_data ->> 'nomenclature_exist_proof'),
                                      ref_nomenclatures.get_id_nomenclature(
                                              'STATUT_VALID',
                                              coalesce(new.json_data ->> 'nomenclature_valid_status', '0')),
                                      ref_nomenclatures.get_id_nomenclature(
                                              'NIV_PRECIS',
                                              coalesce(new.json_data ->> 'nomenclature_diffusion_level', '0')),
                                      ref_nomenclatures.get_id_nomenclature(
                                              'STADE_VIE',
                                              new.json_data ->> 'nomenclature_life_stage'),
                                      ref_nomenclatures.get_id_nomenclature(
                                              'SEXE',
                                              new.json_data ->> 'nomenclature_sex'),
                                      ref_nomenclatures.get_id_nomenclature(
                                              'OBJ_DENBR',
                                              new.json_data ->> 'nomenclature_obj_count'),
                                      ref_nomenclatures.get_id_nomenclature(
                                              'TYP_DENBR',
                                              new.json_data ->> 'nomenclature_type_count'),
                                      ref_nomenclatures.get_id_nomenclature(
                                              'SENSIBILITE',
                                              coalesce(new.json_data ->> 'nomenclature_sensivivity', '0')),
                                      ref_nomenclatures.get_id_nomenclature(
                                              'STATUT_OBS',
                                              coalesce(new.json_data ->> 'nomenclature_observation_status', 'Pr')),
                                      ref_nomenclatures.get_id_nomenclature(
                                              'DEE_FLOU',
                                              coalesce(new.json_data ->> 'nomenclature_blurring', 'NON')),
                                      ref_nomenclatures.get_id_nomenclature(
                                              'STATUT_SOURCE',
                                              new.json_data ->> 'nomenclature_source_status'),
                                      ref_nomenclatures.get_id_nomenclature(
                                              'TYP_INF_GEO',
                                              new.json_data ->> 'nomenclature_info_geo_type'), new.count, new.count,
                                      new.cd_nom,
                                      the_nom_cite
--         ,                                                        digital_proof
        , the_alt_min, the_alt_max, new.geom, st_centroid(new.geom), st_transform(new.geom, the_local_srid),
                                      new.date, new.date, the_observer, the_id_digitizer,
                                      ref_nomenclatures.get_id_nomenclature('METH_DETERMIN',
                                                                            new.json_data ->>
                                                                            'nomenclature_determination_method'),
                                      new.comment, new.timestamp_create, new.timestamp_update, 'U');
    RETURN new;
END;
$func$;

COMMENT ON FUNCTION gnc_core.fct_tri_c_upsert_obstax_to_geonature () IS 'Trigger function to upsert acquisition framework from GeoNature-citizen project';
DROP TRIGGER IF EXISTS tri_c_upsert_obstax_to_geonature ON gnc_obstax.t_obstax;
CREATE TRIGGER tri_c_upsert_obstax_to_geonature
    AFTER INSERT OR UPDATE
    ON gnc_obstax.t_obstax
    FOR EACH ROW
EXECUTE PROCEDURE gnc_core.fct_tri_c_upsert_obstax_to_geonature();

COMMIT;
/* END TRANSACTION */

