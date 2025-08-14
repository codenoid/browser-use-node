#!/usr/bin/env -S npm run tsn -T

import { BrowserUse } from 'browser-use-sdk';
import { z } from 'zod';
import { spinner } from './utils';

// gets API Key from environment variable BROWSER_USE_API_KEY
const browseruse = new BrowserUse();

// Define Structured Output Schema
const HackerNewsResponse = z.object({
  title: z.string(),
  url: z.string(),
  score: z.number(),
});

const TaskOutput = z.object({
  posts: z.array(HackerNewsResponse),
});

async function main() {
  let log = 'starting';
  const stop = spinner(() => log);

  // Create Task
  const rsp = await browseruse.tasks.createWithStructuredOutput({
    task: 'Extract top 10 Hacker News posts and return the title, url, and score',
    structuredOutputJson: TaskOutput,
  });

  poll: do {
    // Wait for Task to Finish
    const status = await browseruse.tasks.retrieveWithStructuredOutput(rsp.id, {
      structuredOutputJson: TaskOutput,
    });

    switch (status.status) {
      case 'started':
      case 'paused':
      case 'stopped': {
        const stepsCount = status.steps ? status.steps.length : 0;
        const steps = `${stepsCount} steps`;
        const lastGoalDescription = stepsCount > 0 ? status.steps![stepsCount - 1]!.nextGoal : undefined;
        const lastGoal = lastGoalDescription ? `, last: ${lastGoalDescription}` : '';
        const liveUrl = status.sessionLiveUrl ? `, live: ${status.sessionLiveUrl}` : '';

        log = `agent ${status.status} (${steps}${lastGoal}${liveUrl}) `;

        await new Promise((resolve) => setTimeout(resolve, 2000));

        break;
      }

      case 'finished':
        stop();

        // Print Structured Output
        console.log('TOP POSTS:');

        for (const post of status.doneOutput!.posts) {
          console.log(` - ${post.title} (${post.score}) ${post.url}`);
        }

        break poll;
    }
  } while (true);
}

main().catch(console.error);
