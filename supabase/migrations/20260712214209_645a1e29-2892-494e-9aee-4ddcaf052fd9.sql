-- Sprint A #2: Adicionar policies faltantes em 6 partições de audit_logs (2026m07..m12)
DO $$
DECLARE
  m text;
  tbl text;
BEGIN
  FOREACH m IN ARRAY ARRAY['07','08','09','10','11','12']
  LOOP
    tbl := format('public.audit_logs_y2026m%s', m);
    EXECUTE format($f$
      CREATE POLICY "Admins view audit logs" ON %s
        FOR SELECT TO authenticated
        USING (public.has_role(auth.uid(), 'admin'::public.app_role));
    $f$, tbl);
    EXECUTE format($f$
      CREATE POLICY "Authenticated insert audit logs" ON %s
        FOR INSERT TO authenticated
        WITH CHECK (auth.uid() IS NOT NULL);
    $f$, tbl);
  END LOOP;
END $$;