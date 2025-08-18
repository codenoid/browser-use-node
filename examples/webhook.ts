#!/usr/bin/env -S npm run tsn -T

import { BrowserUse } from 'browser-use-sdk';
import {
  verifyWebhookEventSignature,
  type WebhookAgentTaskStatusUpdatePayload,
} from 'browser-use-sdk/lib/webhooks';
import { createServer, IncomingMessage, type Server, type ServerResponse } from 'http';

import { env } from './utils';

env();

const PORT = 3000;
const WAIT_FOR_TASK_FINISH_TIMEOUT = 60_000;

// Environment ---------------------------------------------------------------

const SECRET_KEY = process.env['SECRET_KEY'];

// API -----------------------------------------------------------------------

// gets API Key from environment variable BROWSER_USE_API_KEY
const browseruse = new BrowserUse();

//

const whServerRef: { current: Server | null } = { current: null };

async function main() {
  if (!SECRET_KEY) {
    console.error('SECRET_KEY is not set');
    process.exit(1);
  }

  console.log('Starting Browser Use Webhook Example');
  console.log('Run `browser-use listen http://localhost:3000/webhook`!');

  // Start a Webhook Server

  const callback: { current: ((event: WebhookAgentTaskStatusUpdatePayload) => Promise<void>) | null } = {
    current: null,
  };

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'POST' && req.url === '/webhook') {
      let body = '';

      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const signature = req.headers['x-browser-use-signature'] as string;
          const timestamp = req.headers['x-browser-use-timestamp'] as string;

          const event = await verifyWebhookEventSignature(
            {
              evt: body,
              signature,
              timestamp,
            },
            {
              secret: SECRET_KEY,
            },
          );

          if (!event.ok) {
            console.log('❌ Invalid webhook signature');
            console.log(body);
            console.log(signature, 'signature');
            console.log(timestamp, 'timestamp');
            console.log(SECRET_KEY, 'SECRET_KEY');

            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid signature' }));
            return;
          }

          switch (event.event.type) {
            case 'agent.task.status_update':
              await callback.current?.(event.event.payload);

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ received: true }));
              break;
            case 'test':
              console.log('🧪 Test webhook received');

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ received: true }));
              break;
            default:
              console.log('🧪 Unknown webhook received');

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ received: true }));
              break;
          }
        } catch (error) {
          console.error(error);
        }
      });
    } else if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });

  whServerRef.current = server;

  server.listen(PORT, () => {
    console.log(`🌐 Webhook server listening on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Create Task
  console.log('📝 Creating a new task...');
  const task = await browseruse.tasks.create({
    task: "What's the weather like in San Francisco and what's the current temperature?",
  });

  console.log(`🔗 Task created: ${task.id}`);

  await new Promise<void>((resolve, reject) => {
    // NOTE: We set a timeout so we can catch it when the task is stuck
    //       and stop the example.
    const interval = setTimeout(() => {
      reject(new Error('Task creation timed out'));
    }, WAIT_FOR_TASK_FINISH_TIMEOUT);

    // NOTE: We attach the callback to the current reference so we can receive updates from the server.
    callback.current = async (payload) => {
      if (payload.task_id !== task.id) {
        return;
      }

      console.log('🔄 Task status updated:', payload.status);

      if (payload.status === 'finished') {
        clearTimeout(interval);
        resolve();
      }
    };
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });

  // Fetch final task result
  const status = await browseruse.tasks.retrieve(task.id);

  console.log('🎯 Final Task Status');
  console.log('OUTPUT:');
  console.log(status.doneOutput);

  server.close();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  whServerRef.current?.close();
  process.exit(0);
});

//

if (require.main === module) {
  main().catch(console.error);
}
