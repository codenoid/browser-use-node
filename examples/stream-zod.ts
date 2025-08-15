#!/usr/bin/env -S npm run tsn -T

import { BrowserUse } from 'browser-use-sdk';
import { TaskViewWithSchema } from 'browser-use-sdk/lib/parse';
import z from 'zod';

const HackerNewsResponse = z.object({
  title: z.string(),
  url: z.string(),
  score: z.number(),
});

const TaskOutput = z.object({
  posts: z.array(HackerNewsResponse),
});

async function main() {
  // gets API Key from environment variable BROWSER_USE_API_KEY
  const browseruse = new BrowserUse();

  console.log('Creating task and starting stream...\n');

  // Create a task and get the stream
  const stream = browseruse.tasks.stream({
    task: 'Extract top 10 Hacker News posts and return the title, url, and score',
    structuredOutputJson: TaskOutput,
  });

  // Get a reader from the stream
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  try {
    // Read the stream chunk by chunk
    loop: while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('\nStream completed');
        break loop;
      }

      // Decode the chunk and parse the Server-Sent Events format
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          const event = line.slice(7);
          process.stdout.write(`\n[${event}] `);
        } else if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data.trim() && data !== '{}') {
            try {
              const parsed = JSON.parse(data) as TaskViewWithSchema<typeof TaskOutput>;

              process.stdout.write(`${parsed.status}`);
              if (parsed.sessionLiveUrl) {
                process.stdout.write(` | Live URL: ${parsed.sessionLiveUrl}`);
              }

              if (parsed.steps.length > 0) {
                const latestStep = parsed.steps[parsed.steps.length - 1];
                process.stdout.write(` | ${latestStep!.nextGoal}`);
              }

              if (parsed.status === 'finished') {
                process.stdout.write(`\n\nOUTPUT:`);

                for (const post of parsed.doneOutput!.posts) {
                  process.stdout.write(`\n - ${post.title} (${post.score}) ${post.url}`);
                }

                break loop;
              }
            } catch (e) {
              process.stdout.write(`Raw data: ${data}`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading stream:', error);
  } finally {
    reader.releaseLock();
  }
}

main().catch(console.error);
