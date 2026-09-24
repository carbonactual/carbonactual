import { handleIncomingEventRequest, type EdgeEnvironment } from '../src/routes/events';

export const config = { runtime: 'edge' };

export default function handler(request: Request): Promise<Response> {
  const env: EdgeEnvironment = {
    SUPABASE_URL: process.env.SUPABASE_URL ?? '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    ABBA_EVENT_SIGNING_SECRET: process.env.ABBA_EVENT_SIGNING_SECRET ?? ''
  };
  return handleIncomingEventRequest(request, env);
}
