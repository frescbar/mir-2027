-- Applied to the existing database after the authorized transfer completed.
-- Migration: close_completed_bank_transfer_and_limit_client_grants.
REVOKE ALL PRIVILEGES ON TABLE public.mir_content, public.mir_media, public.user_state, public.mir_transfer_jobs FROM anon;
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.mir_content, public.mir_media, public.user_state FROM authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.mir_transfer_jobs FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.mir_transfer_exact(uuid,text,integer,text) FROM PUBLIC, anon, authenticated;
