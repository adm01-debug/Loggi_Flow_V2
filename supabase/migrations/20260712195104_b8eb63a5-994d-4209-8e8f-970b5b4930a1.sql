
CREATE TABLE public.remediation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical','warning','ok')),
  title TEXT NOT NULL,
  detail TEXT,
  recommended_action TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','resolved','ignored')),
  admin_notes TEXT,
  applied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  applied_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_remediation_status ON public.remediation_actions (status, created_at DESC);
CREATE INDEX idx_remediation_suggestion ON public.remediation_actions (suggestion_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.remediation_actions TO authenticated;
GRANT ALL ON public.remediation_actions TO service_role;

ALTER TABLE public.remediation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view remediation actions"
  ON public.remediation_actions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert remediation actions"
  ON public.remediation_actions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update remediation actions"
  ON public.remediation_actions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete remediation actions"
  ON public.remediation_actions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_remediation_updated_at
  BEFORE UPDATE ON public.remediation_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
