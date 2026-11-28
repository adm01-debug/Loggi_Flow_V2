CREATE OR REPLACE FUNCTION audit_tmp.first_diff(a text, b text, ctx integer DEFAULT 60)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$ DECLARE i int := 1; n int := least(length(a), length(b)); BEGIN WHILE i <= n AND substr(a,i,1) = substr(b,i,1) LOOP i := i+1; END LOOP; RETURN '@'||i||' SRC:'||substr(a, greatest(1,i-ctx), 2*ctx)||' || DST:'||substr(b, greatest(1,i-ctx), 2*ctx); END $function$
