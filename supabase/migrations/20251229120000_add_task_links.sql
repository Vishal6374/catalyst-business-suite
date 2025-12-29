-- Add optional links from tasks to leads and deals
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS lead_id uuid NULL,
ADD COLUMN IF NOT EXISTS deal_id uuid NULL;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_lead_id_fkey
FOREIGN KEY (lead_id) REFERENCES public.leads (id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_deal_id_fkey
FOREIGN KEY (deal_id) REFERENCES public.deals (id) ON UPDATE CASCADE ON DELETE SET NULL;

