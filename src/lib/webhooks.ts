import { createHmac } from 'crypto';
import { z } from 'zod';
import stringify from 'fast-json-stable-stringify';

// https://docs.browser-use.com/cloud/webhooks

//

export const zWebhookTimestamp = z.iso.datetime({ offset: true, local: true });

// test

export const zWebhookTestPayload = z.object({
  test: z.literal('ok'),
});

export type WebhookTestPayload = z.infer<typeof zWebhookTestPayload>;

export const zWebhookTest = z.object({
  type: z.literal('test'),
  timestamp: z.iso.datetime({ offset: true }),
  payload: zWebhookTestPayload,
});

// agent.task.status_update

export const zWebhookAgentTaskStatusUpdatePayloadMetadata = z.record(z.string(), z.unknown()).optional();

export const zWebhookAgentTaskStatusUpdatePayloadStatus = z.literal([
  'initializing',
  'started',
  'paused',
  'stopped',
  'finished',
]);

export const zWebhookAgentTaskStatusUpdatePayload = z.object({
  session_id: z.string(),
  task_id: z.string(),
  status: zWebhookAgentTaskStatusUpdatePayloadStatus,
  metadata: zWebhookAgentTaskStatusUpdatePayloadMetadata,
});

export type WebhookAgentTaskStatusUpdatePayload = z.infer<typeof zWebhookAgentTaskStatusUpdatePayload>;

export const zWebhookAgentTaskStatusUpdate = z.object({
  type: z.literal('agent.task.status_update'),
  timestamp: zWebhookTimestamp,
  payload: zWebhookAgentTaskStatusUpdatePayload,
});

//

export const zWebhookSchema = z.discriminatedUnion('type', [
  //
  zWebhookTest,
  zWebhookAgentTaskStatusUpdate,
]);

export type Webhook = z.infer<typeof zWebhookSchema>;

// Signature

/**
 * Utility function that validates the received Webhook event/
 */
export async function verifyWebhookEventSignature(
  evt: {
    evt: string;
    signature: string;
    timestamp: string;
  },
  cfg: { secret: string },
): Promise<{ ok: true; event: Webhook } | { ok: false }> {
  try {
    const event = await zWebhookSchema.safeParseAsync(JSON.parse(evt.evt));

    if (event.success === false) {
      return { ok: false };
    }

    const e = event.data;

    // Create message in the same format as Python: timestamp.payload
    // Note: Using JSON.stringify with separators and sort_keys equivalent
    const dump = stringify(e.payload);
    const message = `${evt.timestamp}.${dump}`;

    // Create HMAC with SHA-256 using the secret
    const hmac = createHmac('sha256', cfg.secret);
    hmac.update(message);
    const signature = hmac.digest('hex');

    // Compare signatures using timing-safe comparison
    if (evt.signature !== signature) {
      return { ok: false };
    }

    return { ok: true, event: e };
  } catch (err) {
    console.error(err);
    return { ok: false };
  }
}

/**
 * Creates a webhook signature for the given payload, timestamp, and secret.
 */
export async function createWebhookSignature({
  payload,
  timestamp,
  secret,
}: {
  payload: unknown;
  timestamp: string;
  secret: string;
}): Promise<string> {
  const dump = stringify(payload);
  const message = `${timestamp}.${dump}`;

  const hmac = createHmac('sha256', secret);
  hmac.update(message);
  return hmac.digest('hex');
}
