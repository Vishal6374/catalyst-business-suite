-- Core modules schema alignment and activity logging triggers

-- 1) Calendar Events
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
    CREATE TYPE public.event_type AS ENUM ('task','meeting','leave');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  type public.event_type NOT NULL,
  related_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);
CREATE INDEX IF NOT EXISTS idx_events_time ON public.events(start_time, end_time);

-- 2) Settings
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);

-- 3) Payments (for revenue and dashboards)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM ('pending','paid','failed');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_deal ON public.payments(deal_id);

-- 4) Leads convenience field
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS name text;
UPDATE public.leads SET name = COALESCE(company_name, title) WHERE name IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_name ON public.leads(name);

-- 5) Contacts convenience field
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS name text GENERATED ALWAYS AS (
  first_name || CASE WHEN last_name IS NOT NULL AND length(last_name) > 0 THEN ' ' || last_name ELSE '' END
) STORED;
CREATE INDEX IF NOT EXISTS idx_contacts_name ON public.contacts(name);

-- 6) Deals amount mirror for analytics compatibility
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS amount numeric(12,2);
UPDATE public.deals SET amount = value WHERE amount IS NULL AND value IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_amount ON public.deals(amount);

-- 7) Tasks linking to CRM entities
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS related_type text CHECK (related_type IN ('lead','deal','contact'));
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS related_id uuid;
CREATE INDEX IF NOT EXISTS idx_tasks_related ON public.tasks(related_type, related_id);

-- 8) Attendance naming alignment
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS punch_in timestamptz;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS punch_out timestamptz;

-- 9) Payroll naming alignment
ALTER TABLE public.payroll ADD COLUMN IF NOT EXISTS basic numeric(12,2);
ALTER TABLE public.payroll ADD COLUMN IF NOT EXISTS net_pay numeric(12,2);
UPDATE public.payroll SET basic = basic_salary WHERE basic IS NULL AND basic_salary IS NOT NULL;
UPDATE public.payroll SET net_pay = net_salary WHERE net_pay IS NULL AND net_salary IS NOT NULL;

-- 10) Activity Logs: add required fields
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS module text;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS record_id uuid;
ALTER TABLE public.activity_logs ALTER COLUMN created_at SET DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_activity_logs_module ON public.activity_logs(module);
CREATE INDEX IF NOT EXISTS idx_activity_logs_record ON public.activity_logs(record_id);

-- 11) Activity logging function and triggers
CREATE OR REPLACE FUNCTION public.log_activity_fn() RETURNS trigger AS $$
DECLARE
  _user_id uuid;
  _action text;
  _record_id uuid;
BEGIN
  _user_id := auth.uid();
  IF TG_OP = 'INSERT' THEN
    _action := 'create';
    _record_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    _action := 'update';
    _record_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'delete';
    _record_id := OLD.id;
  END IF;

  INSERT INTO public.activity_logs (id, user_id, action, entity_type, entity_id, description, module, record_id, created_at)
  VALUES (gen_random_uuid(), COALESCE(_user_id::text, NULL), _action, TG_TABLE_NAME, COALESCE((_record_id)::text, NULL), NULL, TG_TABLE_NAME, _record_id, now());

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_log_leads') THEN
    CREATE TRIGGER trg_log_leads
    AFTER INSERT OR UPDATE OR DELETE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.log_activity_fn();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_log_contacts') THEN
    CREATE TRIGGER trg_log_contacts
    AFTER INSERT OR UPDATE OR DELETE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION public.log_activity_fn();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_log_companies') THEN
    CREATE TRIGGER trg_log_companies
    AFTER INSERT OR UPDATE OR DELETE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.log_activity_fn();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_log_deals') THEN
    CREATE TRIGGER trg_log_deals
    AFTER INSERT OR UPDATE OR DELETE ON public.deals
    FOR EACH ROW EXECUTE FUNCTION public.log_activity_fn();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_log_tasks') THEN
    CREATE TRIGGER trg_log_tasks
    AFTER INSERT OR UPDATE OR DELETE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.log_activity_fn();
  END IF;
END
$$;

