-- Add policies to each partition of rastreamento_historico
-- 2026m01
CREATE POLICY "Admins can view tracking history y2026m01" ON public.rastreamento_historico_y2026m01 FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can insert tracking data y2026m01" ON public.rastreamento_historico_y2026m01 FOR INSERT TO authenticated WITH CHECK (true);

-- 2026m02
CREATE POLICY "Admins can view tracking history y2026m02" ON public.rastreamento_historico_y2026m02 FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can insert tracking data y2026m02" ON public.rastreamento_historico_y2026m02 FOR INSERT TO authenticated WITH CHECK (true);

-- 2026m03
CREATE POLICY "Admins can view tracking history y2026m03" ON public.rastreamento_historico_y2026m03 FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can insert tracking data y2026m03" ON public.rastreamento_historico_y2026m03 FOR INSERT TO authenticated WITH CHECK (true);

-- 2026m04
CREATE POLICY "Admins can view tracking history y2026m04" ON public.rastreamento_historico_y2026m04 FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can insert tracking data y2026m04" ON public.rastreamento_historico_y2026m04 FOR INSERT TO authenticated WITH CHECK (true);

-- 2026m05
CREATE POLICY "Admins can view tracking history y2026m05" ON public.rastreamento_historico_y2026m05 FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can insert tracking data y2026m05" ON public.rastreamento_historico_y2026m05 FOR INSERT TO authenticated WITH CHECK (true);

-- 2026m06
CREATE POLICY "Admins can view tracking history y2026m06" ON public.rastreamento_historico_y2026m06 FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can insert tracking data y2026m06" ON public.rastreamento_historico_y2026m06 FOR INSERT TO authenticated WITH CHECK (true);
