-- https://wiki.postgresql.org/wiki/Fixing_Sequences
-- psql -h localhost -p 5432 -U geonatadmin -d geonature2db -Atq -f reset.sql -o temp
-- psql -h localhost -p 5432 -U geonatadmin -d geonature2db -f temp
-- rm temp

SELECT
    'SELECT SETVAL('
    || quote_literal(quote_ident(PGT.SCHEMANAME) || '.'
    || quote_ident(S.RELNAME))
    || ', COALESCE(MAX(' || quote_ident(C.ATTNAME) || '), 1) ) FROM '
    || quote_ident(PGT.SCHEMANAME) || '.' || quote_ident(T.RELNAME) || ';'
FROM PG_CLASS AS S,
    PG_DEPEND AS D,
    PG_CLASS AS T,
    PG_ATTRIBUTE AS C,
    PG_TABLES AS PGT
WHERE
    S.RELKIND = 'S'
    AND S.OID = D.OBJID
    AND D.REFOBJID = T.OID
    AND D.REFOBJID = C.ATTRELID
    AND D.REFOBJSUBID = C.ATTNUM
    AND T.RELNAME = PGT.TABLENAME
    AND PGT.SCHEMANAME LIKE 'gnc_%'
ORDER BY S.RELNAME;
