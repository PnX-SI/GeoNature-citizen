INSERT INTO gn_commons.t_parameters (id_organism, parameter_name, parameter_desc, parameter_value,
                                     parameter_extra_value)
values (NULL, 'gnc_default_acquisition_framework', 'Cadre d''acquisition par défaut pour les données GeoNature-citizen',
        '<gnc_unclassified>', NULL);


DROP FUNCTION IF EXISTS gnc_core.fct_get_or_insert_basic_acquisition_framework(_name TEXT, _desc TEXT, _startdate DATE);

CREATE OR REPLACE FUNCTION gnc_core.fct_get_or_insert_basic_acquisition_framework(_name TEXT,
                                                                                  _desc TEXT DEFAULT 'Description to complete',
                                                                                  _startdate DATE default NOW()) RETURNS INTEGER
AS
$$
DECLARE
    the_new_id INT ;
BEGIN
    IF (SELECT exists(SELECT 1
                      FROM gn_meta.t_acquisition_frameworks
                      WHERE acquisition_framework_name LIKE _name)) THEN
        SELECT id_acquisition_framework
        INTO the_new_id
        FROM gn_meta.t_acquisition_frameworks
        WHERE acquisition_framework_name = _name;
        RAISE NOTICE 'Acquisition framework named % already exists', _name;
    ELSE

        INSERT INTO gn_meta.t_acquisition_frameworks( acquisition_framework_name
                                                    , acquisition_framework_desc
                                                    , acquisition_framework_start_date
                                                    , meta_create_date)
        VALUES (_name, _desc, _startdate, now())
        RETURNING id_acquisition_framework INTO the_new_id;
        RAISE NOTICE 'Acquisition framework named % inserted with id %', _name, the_new_id;
    END IF;
    RETURN the_new_id;
END
$$
    LANGUAGE plpgsql;

ALTER FUNCTION gnc_core.fct_get_or_insert_basic_acquisition_framework(_name TEXT, _desc TEXT, _startdate DATE) OWNER TO geonature;

COMMENT ON FUNCTION gnc_core.fct_get_or_insert_basic_acquisition_framework(_name TEXT, _desc TEXT, _startdate DATE) IS 'function to basically create acquisition framework';

/* Function to basically create new dataset attached to an acquisition_framework find by name */

DROP FUNCTION IF EXISTS gnc_core.fct_get_or_insert_dataset_from_title(_title TEXT, _default_acquisition_framework TEXT);

CREATE OR REPLACE FUNCTION gnc_core.fct_get_or_insert_dataset_from_title(_title TEXT, _acquisition_framework TEXT default NULL) RETURNS INTEGER
AS
$$
DECLARE
    the_id_dataset               INT ;
    the_id_acquisition_framework INT;
BEGIN
    /*  Si shortname est NULL:
            Si Dataset par défaut existe alors on récupère l'ID de ce dataset
            Sinon, on créée le dataset et on récupère son ID
        Si shortname est non NULL:
            Si Dataset basé sur ce shortname existe, alors on récupère l'ID de ce dataset
            Sinon, on le créée et on récupère son ID
    */

    RAISE NOTICE '<fct_c_get_or_insert_dataset_from_title> Data dataset is % ', _title;

    IF (SELECT exists(SELECT 1 FROM gn_meta.t_datasets WHERE dataset_shortname LIKE _title)) THEN
        /* Si le JDD par défaut existe déjà, on récupère son ID */
        SELECT id_dataset INTO the_id_dataset FROM gn_meta.t_datasets WHERE dataset_shortname LIKE _title;
        RAISE NOTICE '<fct_c_get_or_insert_dataset_from_title> Dataset with shortname % exists with get ID : %', _title, the_id_dataset;
    ELSE
        INSERT INTO gn_meta.t_datasets( id_acquisition_framework
                                      , dataset_name
                                      , dataset_shortname
                                      , dataset_desc
                                      , marine_domain
                                      , terrestrial_domain
                                      , meta_create_date)
        VALUES ( gnc_core.fct_get_or_insert_basic_acquisition_framework(
                         coalesce(_acquisition_framework,
                                  gn_commons.get_default_parameter('gnc_default_acquisition_framework')))
               , '[' || _title || '] Jeu de données compléter'
               , _title
               , 'A compléter'
               , FALSE
               , TRUE
               , now())
        RETURNING id_dataset INTO the_id_dataset;
        RAISE NOTICE '<fct_c_get_or_insert_dataset_from_title> Data dataset doesn''t exists, new dataset with shortname % created with ID : %', _title, the_id_dataset;
    END IF;

    RETURN the_id_dataset;
END
$$ LANGUAGE plpgsql;

ALTER FUNCTION gnc_core.fct_get_or_insert_dataset_from_title(_title TEXT, _default_acquisition_framework TEXT) OWNER TO geonature;

COMMENT ON FUNCTION gnc_core.fct_get_or_insert_dataset_from_title(_title TEXT,_default_acquisition_framework TEXT) IS 'function to basically create acquisition framework';

/* New function to get acquisition framework id by name */

DROP FUNCTION IF EXISTS gnc_core.fct_get_id_acquisition_framework_by_name(_name TEXT);

CREATE OR REPLACE FUNCTION gnc_core.fct_get_id_acquisition_framework_by_name(_name TEXT) RETURNS INTEGER
    LANGUAGE plpgsql
AS
$$
DECLARE
    theidacquisitionframework INTEGER;
BEGIN
    --Retrouver l'id du module par son code
    SELECT INTO theidacquisitionframework id_acquisition_framework
    FROM gn_meta.t_acquisition_frameworks
    WHERE acquisition_framework_name ILIKE _name
    LIMIT 1;
    RETURN theidacquisitionframework;
END;
$$;

ALTER FUNCTION gnc_core.fct_get_id_acquisition_framework_by_name(_name TEXT) OWNER TO geonature;

COMMENT ON FUNCTION gnc_core.fct_get_id_acquisition_framework_by_name(_name TEXT) IS 'function to get acquisition framework id by name';

/* New function to get dataset id by shortname */

DROP FUNCTION IF EXISTS gnc_core.fct_get_id_dataset_by_shortname(_title TEXT);

CREATE OR REPLACE FUNCTION gnc_core.fct_get_id_dataset_by_shortname(_title TEXT) RETURNS INTEGER
    LANGUAGE plpgsql
AS
$$
DECLARE
    theiddataset INTEGER;
BEGIN
    --Retrouver l'id du module par son code
    SELECT INTO theiddataset id_dataset
    FROM gn_meta.t_datasets
    WHERE dataset_shortname ILIKE _title;
    RETURN theiddataset;
END;
$$;

ALTER FUNCTION gnc_core.fct_get_id_dataset_by_shortname(_title TEXT) OWNER TO geonature;

COMMENT ON FUNCTION gnc_core.fct_get_id_dataset_by_shortname(_title TEXT) IS 'function to get dataset id by shortname';


/* Triggers */

CREATE OR REPLACE FUNCTION gnc_core.fct_tri_upsert_meta_datasets() RETURNS TRIGGER
    LANGUAGE plpgsql
AS
$$
DECLARE
    the_title TEXT;
BEGIN
    IF (tg_op = 'INSERT')
    THEN
        PERFORM gnc_core.fct_get_or_insert_dataset_from_title(new.title::text);
    ELSE
        UPDATE gn_meta.t_datasets set dataset_shortname = new.title where dataset_shortname = old.title;
    END IF;
    RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER tri_upsert_meta_datasets
    AFTER INSERT OR UPDATE
    ON gnc_core.t_programs
    FOR EACH ROW
EXECUTE PROCEDURE gnc_core.fct_tri_upsert_meta_datasets();
