CREATE TABLE IF NOT EXISTS gnc_core.t_projects
(
    id_project        serial       NOT NULL
        CONSTRAINT t_projects_pkey
            PRIMARY KEY,
    unique_id_project uuid         NOT NULL
        CONSTRAINT t_projects_unique_id_project_key
            UNIQUE,
    name              varchar(50)  NOT NULL,
    short_desc        varchar(200) NOT NULL,
    long_desc         text         NOT NULL,
    timestamp_create  timestamp    NOT NULL,
    timestamp_update  timestamp
)
;



ALTER TABLE gnc_core.t_programs
    ADD COLUMN id_project integer,
    ADD CONSTRAINT t_programs_id_project_fkey FOREIGN KEY (id_project)
        REFERENCES gnc_core.t_projects (id_project)
        ON DELETE NO ACTION
;

ALTER TABLE gnc_core.t_programs
    ADD COLUMN  unique_id_program uuid NOT NULL DEFAULT uuid_generate_v4()
;

ALTER TABLE gnc_core.t_programs
    ADD CONSTRAINT t_programs_unique_id_program_key UNIQUE (unique_id_program)
;


DO LANGUAGE plpgsql
$$
    DECLARE
        pr             record;
        the_id_project INT;
    BEGIN


        IF (SELECT COUNT(*) FROM gnc_core.t_projects) = 0 AND (SELECT COUNT(*) FROM gnc_core.t_programs) > 0 THEN
            RAISE NOTICE 'Création d''un projet générique et association aux programmes existants';
            INSERT INTO
                gnc_core.t_projects (unique_id_project, name, short_desc, long_desc, timestamp_create, timestamp_update)
            VALUES
            (uuid_generate_v4(), 'Projet générique', 'Projet générique par défaut', '<p>Projet générique par défaut</p>'
            , NOW(), NOW())
            RETURNING id_project INTO the_id_project;
            RAISE NOTICE 'id_project is %', the_id_project;
        ELSE
            RAISE NOTICE 'Un projet est déjà existant ou l''instance ne contient encore pas de programmes';
        END IF;
        FOR pr IN SELECT id_program, title FROM gnc_core.t_programs WHERE id_project IS NULL
            LOOP
                RAISE NOTICE 'Paramétrage id_project à % pour le programme %', the_id_project, pr.title;
                UPDATE gnc_core.t_programs
                SET
                    id_project = the_id_project
                WHERE
                    t_programs.id_program = pr.id_program;
            END LOOP;
    END
$$
;

ALTER TABLE gnc_core.t_programs
    ALTER COLUMN id_program SET NOT NULL
;

