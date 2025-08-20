#!/usr/bin/env -S npm run tsn -T

import { BrowserUse } from 'browser-use-sdk';
import { z } from 'zod';

import { env } from './utils';

env();

// gets API Key from environment variable BROWSER_USE_API_KEY
const browseruse = new BrowserUse();

async function basic() {
  console.log(`Basic: Running Task...`);

  // Create Task
  const rsp = await browseruse.tasks.run({
    task: "What's the weather line in SF and what's the temperature?",
    agentSettings: { llm: 'gemini-2.5-flash' },
  });

  console.log(`Basic: ${rsp.doneOutput}`);

  console.log(`Basic: DONE`);
}

const HackerNewsResponse = z.object({
  title: z.string(),
  url: z.string(),
  score: z.number(),
});

const TaskOutput = z.object({
  posts: z.array(HackerNewsResponse),
});

async function structured() {
  console.log(`Structured: Running Task...`);

  // Create Task
  const rsp = await browseruse.tasks.run({
    task: 'Search for the top 10 Hacker News posts and return the title, url, and score',
    schema: TaskOutput,
    agentSettings: { llm: 'gpt-4.1' },
  });

  const posts = rsp.parsedOutput?.posts;

  if (posts == null) {
    throw new Error('Structured: No posts found');
  }

  console.log(`Structured: Top Hacker News posts:`);

  for (const post of posts) {
    console.log(`${post.title} (${post.score}) - ${post.url}`);
  }

  console.log(`\nStructured: DONE`);
}

basic()
  .then(() => structured())
  .catch(console.error);
