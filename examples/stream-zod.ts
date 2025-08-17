#!/usr/bin/env -S npm run tsn -T

import { BrowserUse } from 'browser-use-sdk';
import z from 'zod';

import { env } from './utils';

env();

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
  const task = await browseruse.tasks.create({
    task: 'Extract top 10 Hacker News posts and return the title, url, and score',
    structuredOutputJson: TaskOutput,
  });

  const stream = browseruse.tasks.stream({
    taskId: task.id,
    schema: TaskOutput,
  });

  for await (const msg of stream) {
    // Regular
    process.stdout.write(`${msg.data.status}`);
    if (msg.data.session.liveUrl) {
      process.stdout.write(` | Live URL: ${msg.data.session.liveUrl}`);
    }

    if (msg.data.steps.length > 0) {
      const latestStep = msg.data.steps[msg.data.steps.length - 1];
      process.stdout.write(` | ${latestStep!.nextGoal}`);
    }

    process.stdout.write('\n');

    // Output
    if (msg.data.status === 'finished') {
      process.stdout.write(`\n\nOUTPUT:`);

      for (const post of msg.data.doneOutput!.posts) {
        process.stdout.write(`\n - ${post.title} (${post.score}) ${post.url}`);
      }
    }
  }

  console.log('\nStream completed');
}

main().catch(console.error);
