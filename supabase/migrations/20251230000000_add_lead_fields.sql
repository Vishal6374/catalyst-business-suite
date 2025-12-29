-- Add new fields to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing rows to populate new fields from old ones
UPDATE public.leads 
SET 
  company_name = title,
  contact_name = 'Unknown', 
  notes = description
WHERE company_name IS NULL;

-- Make required fields not null
ALTER TABLE public.leads ALTER COLUMN company_name SET NOT NULL;
ALTER TABLE public.leads ALTER COLUMN contact_name SET NOT NULL;

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_leads_company_name ON public.leads(company_name);
CREATE INDEX IF NOT EXISTS idx_leads_contact_name ON public.leads(contact_name);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

