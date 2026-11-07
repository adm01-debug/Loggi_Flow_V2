CREATE TEMP TABLE _manifest_full (section text, key text, def text);

INSERT INTO _manifest_full
SELECT 'schema'::text AS section, n.nspname::text AS key, (CASE WHEN n.nspname IN ('public','internal','extensions') THEN regexp_replace(coalesce(n.nspacl::text,'<default>'), '(,)?sandbox_exec=[^,}]*', '', 'g') ELSE 'exists' END)||' owner='||pg_get_userbyid(n.nspowner) AS def
  FROM pg_namespace n WHERE n.nspname IN ('public','internal','auth','storage','cron','net','vault','extensions','graphql','graphql_public','realtime','supabase_migrations')
UNION ALL
SELECT 'ext', e.extname, n.nspname||' v'||CASE WHEN e.extname='pg_net' THEN '*' ELSE e.extversion END
  FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace
UNION ALL
SELECT 'role', r.rolname, r.rolsuper::text||r.rolinherit::text||r.rolcreaterole::text||r.rolcreatedb::text||r.rolcanlogin::text||r.rolreplication::text||r.rolbypassrls::text||' cfg='||CASE WHEN r.rolname IN ('service_role','supabase_realtime_admin') THEN '*' ELSE coalesce(r.rolconfig::text,'') END
  FROM pg_roles r WHERE r.rolname NOT LIKE 'pg\_%' AND r.rolname <> 'sandbox_exec'
UNION ALL
SELECT 'enum', n.nspname||'.'||t.typname, string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder)
  FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace JOIN pg_enum e ON e.enumtypid=t.oid
  WHERE n.nspname IN ('public','internal') GROUP BY 1,2
UNION ALL
SELECT 'type', n.nspname||'.'||t.typname, t.typtype::text||':'||coalesce(format_type(t.typbasetype, t.typtypmod),'')||' '||coalesce((SELECT string_agg(a.attname||' '||format_type(a.atttypid,a.atttypmod), ',' ORDER BY a.attnum) FROM pg_attribute a WHERE a.attrelid=t.typrelid AND a.attnum>0 AND a.atttypid<>0),'')
  FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
  WHERE n.nspname IN ('public','internal') AND t.typtype IN ('c','d') AND NOT EXISTS (SELECT 1 FROM pg_class c WHERE c.oid=t.typrelid AND c.relkind<>'c')
UNION ALL
SELECT 'table', n.nspname||'.'||c.relname, c.relkind::text||' rls='||c.relrowsecurity||' force='||c.relforcerowsecurity||' part='||c.relispartition||' bound='||coalesce(pg_get_expr(c.relpartbound,c.oid),'')||' partkey='||coalesce(pg_get_partkeydef(c.oid),'')||' opts='||coalesce(c.reloptions::text,'')||' parent='||coalesce((SELECT string_agg(i.inhparent::regclass::text, ',') FROM pg_inherits i WHERE i.inhrelid=c.oid),'')||' persist='||c.relpersistence::text
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','internal') AND c.relkind IN ('r','p')
UNION ALL
SELECT 'column', n.nspname||'.'||c.relname||'.'||a.attname, format_type(a.atttypid,a.atttypmod)||' pos='||a.attnum||' nn='||a.attnotnull||' def='||coalesce(pg_get_expr(d.adbin,d.adrelid),'')||' ident='||a.attidentity::text||' gen='||a.attgenerated::text||' coll='||coalesce((SELECT collname FROM pg_collation WHERE oid=a.attcollation),'')
  FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
  LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
  WHERE n.nspname IN ('public','internal') AND c.relkind IN ('r','p','v','m') AND a.attnum>0 AND a.atttypid<>0 AND NOT c.relispartition
UNION ALL
SELECT 'constraint', n.nspname||'.'||c.relname||'.'||k.conname, k.contype::text||' '||pg_get_constraintdef(k.oid)||' defer='||k.condeferrable||k.condeferred||' valid='||k.convalidated
  FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','internal')
UNION ALL
SELECT 'index', i.schemaname||'.'||i.indexname, i.indexdef||' valid='||coalesce((SELECT x.indisvalid::text||x.indisready::text FROM pg_index x JOIN pg_class ic ON ic.oid=x.indexrelid JOIN pg_namespace ni ON ni.oid=ic.relnamespace WHERE ni.nspname=i.schemaname AND ic.relname=i.indexname),'')
  FROM pg_indexes i WHERE i.schemaname IN ('public','internal')
UNION ALL
SELECT 'policy', p.schemaname||'.'||p.tablename||'.'||p.policyname, p.permissive||' '||p.cmd||' roles='||p.roles::text||' using='||coalesce(p.qual,'')||' check='||coalesce(p.with_check,'')
  FROM pg_policies p WHERE p.schemaname IN ('public','internal','storage')
UNION ALL
SELECT 'function', n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')', CASE WHEN p.prokind IN ('f','p') THEN pg_get_functiondef(p.oid) ELSE p.prokind::text||':'||pg_get_function_result(p.oid) END
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','internal') AND p.proname NOT IN ('exec_sql','mcp_exec','mcp_exec_many')
UNION ALL
SELECT 'fn_acl', n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')', regexp_replace(coalesce(p.proacl::text,'<default>'), '(,)?sandbox_exec=[^,}]*', '', 'g')||' owner='||pg_get_userbyid(p.proowner)
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','internal') AND p.proname NOT IN ('exec_sql','mcp_exec','mcp_exec_many')
UNION ALL
SELECT 'trigger', n.nspname||'.'||c.relname||'.'||t.tgname, pg_get_triggerdef(t.oid)||' enabled='||t.tgenabled::text
  FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','internal','storage','auth') AND NOT t.tgisinternal
UNION ALL
SELECT 'view', n.nspname||'.'||c.relname, c.relkind::text||' '||pg_get_viewdef(c.oid, true)||' opts='||coalesce(c.reloptions::text,'')||' owner='||pg_get_userbyid(c.relowner)
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','internal') AND c.relkind IN ('v','m')
UNION ALL
SELECT 'sequence', n.nspname||'.'||c.relname, s.seqtypid::regtype::text||' start='||s.seqstart||' min='||s.seqmin||' max='||s.seqmax||' inc='||s.seqincrement||' cycle='||s.seqcycle||' cache='||s.seqcache||' owned='||coalesce((SELECT d.refobjid::regclass::text||'.'||a.attname FROM pg_depend d JOIN pg_attribute a ON a.attrelid=d.refobjid AND a.attnum=d.refobjsubid WHERE d.objid=c.oid AND d.classid='pg_class'::regclass AND d.deptype IN ('a','i') LIMIT 1),'')
  FROM pg_sequence s JOIN pg_class c ON c.oid=s.seqrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','internal')
UNION ALL
SELECT 'grant', n.nspname||'.'||c.relname, regexp_replace(coalesce(c.relacl::text,'<default>'), '(,)?sandbox_exec=[^,}]*', '', 'g')||' owner='||pg_get_userbyid(c.relowner)
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','internal') AND c.relkind IN ('r','p','v','m','S') AND NOT c.relispartition
UNION ALL
SELECT 'defacl', coalesce(n.nspname,'<global>')||' '||d.defaclobjtype::text||' '||pg_get_userbyid(d.defaclrole), regexp_replace(d.defaclacl::text, '(,)?sandbox_exec=[^,}]*', '', 'g')
  FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace WHERE NOT EXISTS (SELECT 1 FROM pg_roles r WHERE r.oid=d.defaclrole AND r.rolname='sandbox_exec')
UNION ALL
SELECT 'event_trigger', e.evtname, e.evtevent||' '||e.evtenabled::text||' '||e.evtfoid::regproc::text||' tags='||coalesce(e.evttags::text,'')
  FROM pg_event_trigger e
UNION ALL
SELECT 'publication', p.pubname, p.puballtables::text||p.pubinsert::text||p.pubupdate::text||p.pubdelete::text||' tables='||coalesce((SELECT string_agg(pt.schemaname||'.'||pt.tablename, ',' ORDER BY 1) FROM pg_publication_tables pt WHERE pt.pubname=p.pubname),'')
  FROM pg_publication p;

-- pg_cron pode não estar instalado; trata a ausência sem quebrar o manifesto
DO $$
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    INSERT INTO _manifest_full
    SELECT 'cron', j.jobname, j.schedule||' active='||j.active||' db='||j.database||' user='||j.username||' cmd='||regexp_replace(regexp_replace(regexp_replace(j.command, '\s+', ' ', 'g'), 'https://[a-z]+\.supabase\.co', '<URL>', 'g'), 'eyJ[A-Za-z0-9_.-]+', '<KEY>', 'g')
      FROM cron.job j;
  ELSE
    INSERT INTO _manifest_full VALUES ('cron', '<ausente>', 'pg_cron não instalado');
  END IF;
END
$$;

INSERT INTO _manifest_full
SELECT 'bucket', b.id, b.public::text||' limit='||coalesce(b.file_size_limit::text,'')||' mime='||coalesce(b.allowed_mime_types::text,'')
  FROM storage.buckets b
UNION ALL
SELECT 'comment', n.nspname||'.'||c.relname||coalesce('.'||a.attname,''), d.description
  FROM pg_description d JOIN pg_class c ON c.oid=d.objoid AND d.classoid='pg_class'::regclass JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum=d.objsubid AND d.objsubid>0
  WHERE n.nspname IN ('public','internal')
UNION ALL
SELECT 'comment', n.nspname||'.'||p.proname||'()', d.description
  FROM pg_description d JOIN pg_proc p ON p.oid=d.objoid AND d.classoid='pg_proc'::regclass JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','internal')
UNION ALL
SELECT 'migration', m.version, coalesce(m.name,'') FROM supabase_migrations.schema_migrations m
UNION ALL
SELECT 'auth_user', u.email, u.id::text||' providers='||coalesce(u.raw_app_meta_data->>'providers','')||' confirmed='||(u.email_confirmed_at IS NOT NULL)::text FROM auth.users u
UNION ALL
SELECT 'storage_objects', x.b, x.n::text FROM (SELECT coalesce(o.bucket_id,'<none>') AS b, count(*) AS n FROM storage.objects o GROUP BY 1) x;

-- vault pode não estar instalado; trata a ausência sem quebrar o manifesto
DO $$
BEGIN
  IF to_regclass('vault.secrets') IS NOT NULL THEN
    INSERT INTO _manifest_full
    SELECT 'vault', s.name, coalesce(s.description,'') FROM vault.secrets s;
  ELSE
    INSERT INTO _manifest_full VALUES ('vault', '<ausente>', 'vault não instalado');
  END IF;
END
$$;

SELECT section, key, def FROM _manifest_full ORDER BY section, key;

DROP TABLE _manifest_full;
