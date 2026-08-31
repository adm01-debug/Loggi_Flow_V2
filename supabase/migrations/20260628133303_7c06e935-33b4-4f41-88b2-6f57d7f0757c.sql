
-- Patch #7: bitrix_sync_config
DROP POLICY IF EXISTS "Full access to bitrix_sync_config for authenticated" ON public.bitrix_sync_config;
CREATE POLICY "Admins manage bitrix_sync_config"
  ON public.bitrix_sync_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Patch #8: freight_webhooks
DROP POLICY IF EXISTS "Enable all for authenticated users on webhooks" ON public.freight_webhooks;
CREATE POLICY "Admins manage freight_webhooks"
  ON public.freight_webhooks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Patch #9: avatars (storage policies)
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;

CREATE POLICY "Avatars publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Patch #10: delivery_receipt_audit
DROP POLICY IF EXISTS "Users can view delivery receipt audit" ON public.delivery_receipt_audit;
DROP POLICY IF EXISTS "Users can insert delivery receipt audit" ON public.delivery_receipt_audit;

CREATE POLICY "Admins view delivery receipt audit"
  ON public.delivery_receipt_audit FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System inserts delivery receipt audit"
  ON public.delivery_receipt_audit FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
