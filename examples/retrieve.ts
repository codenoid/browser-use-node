#!/usr/bin/env -S npm run tsn -T

import { BrowserUse } from 'browser-use-sdk';

import { env, spinner } from './utils';
import z from 'zod';

env();

// gets API Key from environment variable BROWSER_USE_API_KEY
const browseruse = new BrowserUse();

async function basic() {
  let log = 'starting';
  const stop = spinner(() => log);

  // Create Task
  const rsp = await browseruse.tasks.create({
    task: "What's the weather line in SF and what's the temperature?",
    agentSettings: { llm: 'gemini-2.5-flash' },
  });

  poll: do {
    // Wait for Task to Finish
    const status = await browseruse.tasks.retrieve(rsp.id);

    switch (status.status) {
      case 'started':
      case 'paused':
      case 'stopped':
        log = `agent ${status.status} - live: ${status.session.liveUrl}`;

        await new Promise((resolve) => setTimeout(resolve, 2000));
        break;

      case 'finished':
        stop();

        console.log(status.doneOutput);
        break poll;
    }
  } while (true);
}

// Define Structured Output Schema
const HackerNewsResponse = z.object({
  title: z.string(),
  url: z.string(),
  score: z.number(),
});

const TaskOutput = z.object({
  posts: z.array(HackerNewsResponse),
});

async function structured() {
  let log = 'starting';
  const stop = spinner(() => log);

  // Create Task
  const rsp = await browseruse.tasks.create({
    task: 'Extract top 10 Hacker News posts and return the title, url, and score',
    schema: TaskOutput,
    agentSettings: { llm: 'gpt-4.1' },
  });

  poll: do {
    // Wait for Task to Finish
    const status = await browseruse.tasks.retrieve({
      taskId: rsp.id,
      schema: TaskOutput,
    });

    switch (status.status) {
      case 'started':
      case 'paused':
      case 'stopped': {
        log = `agent ${status.status} ${status.session.liveUrl} | ${status.steps.length} steps`;

        await new Promise((resolve) => setTimeout(resolve, 2000));

        break;
      }

      case 'finished':
        if (status.parsedOutput == null) {
          throw new Error('No output');
        }

        stop();

        // Print Structured Output
        console.log('Top Hacker News Posts:');

        for (const post of status.parsedOutput.posts) {
          console.log(` - ${post.title} (${post.score}) ${post.url}`);
        }

        break poll;
    }
  } while (true);
}

basic()
  .then(() => structured())
  .catch(console.error);
