import { ABBAOrchestrator } from '@carbon-actual/orchestration';

export interface EdgeEnvironment {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_ANON_KEY?: string;
  ABBA_EVENT_SIGNING_SECRET: string;
}

type IncomingEvent = {
  actorEntityId: string;
  principalEntityId?: string;
  eventType: Parameters<ABBAOrchestrator['createMutationProposal']>[0]['eventType'];
  payload: Record<string, unknown>;
  authoritySignature: string;
  authorityRef?: string;
  policyVersion: string;
  correlationId?: string;
  causationId?: string;
  idempotencyKey: string;
  riskClass?: string;
  provenance?: { source: string; [key: string]: unknown };
};

async function verifyIngressSignature(body: string, header: string, secret: string): Promise<boolean> {
  const presented = header.startsWith('sha256=') ? header.slice(7) : header;
  const expected = new Uint8Array(
    await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      ),
      new TextEncoder().encode(body)
    )
  );
  let encoded = '';
  for (const byte of expected) encoded += String.fromCharCode(byte);
  const expectedBase64 = btoa(encoded);
  return presented === expectedBase64;
}

async function validateUserToken(url: string, apiKey: string, token: string): Promise<boolean> {
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${token}`
    }
  });
  return response.ok;
}

async function appendEvent(env: EdgeEnvironment, event: unknown): Promise<unknown> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/append_canonical_event`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_event: event })
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`SUPABASE_RPC_${response.status}: ${text}`);
  return JSON.parse(text);
}

export async function handleIncomingEventRequest(
  request: Request,
  env: EdgeEnvironment
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }), {
      status: 405,
      headers: { 'content-type': 'application/json' }
    });
  }

  try {
    const authHeader = request.headers.get('Authorization');
    const signatureHeader = request.headers.get('X-Carbon-Actual-Signature');
    if (!authHeader?.startsWith('Bearer ') || !signatureHeader) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED_MISSING_AUTHENTICATION' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    const rawBody = await request.text();
    if (!(await verifyIngressSignature(rawBody, signatureHeader, env.ABBA_EVENT_SIGNING_SECRET))) {
      return new Response(JSON.stringify({ error: 'INVALID_INGRESS_SIGNATURE' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    const userToken = authHeader.slice(7);
    const authKey = env.SUPABASE_ANON_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
    if (!(await validateUserToken(env.SUPABASE_URL, authKey, userToken))) {
      return new Response(JSON.stringify({ error: 'INVALID_USER_TOKEN' }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      });
    }

    const input = JSON.parse(rawBody) as IncomingEvent;
    const abba = new ABBAOrchestrator('ABBA_PRIMARY_CONTROL_PLANE');
    const proposal = abba.createMutationProposal(input);

    if (!proposal.policyCheckPassed) {
      return new Response(JSON.stringify({
        error: proposal.policyDecision,
        proposalId: proposal.proposalId
      }), {
        status: 403,
        headers: { 'content-type': 'application/json' }
      });
    }

    const event = {
      ...proposal.proposedEvent,
      provenance: {
        ...proposal.proposedEvent.provenance,
        ingress: 'authenticated-edge',
        ingressSignatureVerified: true
      }
    };
    const eventId = await appendEvent(env, event);

    return new Response(JSON.stringify({
      status: 'ACCEPTED',
      proposalId: proposal.proposalId,
      eventId
    }), {
      status: 201,
      headers: { 'content-type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'INTERNAL_ORCHESTRATION_FAILURE',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}
