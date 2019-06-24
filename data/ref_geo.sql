set search_path = ref_geo, pg_catalog
;


/* Création du type 'Communes' */
insert into ref_geo.bib_areas_types(id_type, type_name, type_code, type_desc, ref_name, ref_version, num_version)
values (25, 'Communes', 'COM', 'Type commune', 'IGN admin_express', '2017', null)

truncate table l_areas;

/* Insertion des géométries dans l_areas */
insert into l_areas (id_type, area_code, area_name, geom)
select 25, insee_com, nom_com, geom
from temp_fr_municipalities
-- on ne met pas les arrondissement
where id ilike 'commune%'
;

truncate table li_municipalities
;

/* Insertion des communs dans li_municipality */
insert into li_municipalities (id_municipality, id_area, status, insee_com, nom_com, insee_arr, nom_dep, insee_dep,
                               nom_reg, insee_reg, code_epci)
select id, a.id_area, statut, insee_com, nom_com, insee_arr, nom_dep, insee_dep, nom_reg, insee_reg, code_epci
from temp_fr_municipalities t
         join l_areas a on a.area_code = t.insee_com
-- on ne met pas les arrondissement
where id ilike 'commune%'
;

reindex index index_l_areas_geom
;
