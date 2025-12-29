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
  VALUES (gen_random_uuid(), _user_id, _action, TG_TABLE_NAME, NULL, NULL, TG_TABLE_NAME, _record_id, now());

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
