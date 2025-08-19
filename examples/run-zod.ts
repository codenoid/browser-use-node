#!/usr/bin/env -S npm run tsn -T

import { BrowserUse } from 'browser-use-sdk';

import z from 'zod';
import { env } from './utils';

env();

// gets API Key from environment variable BROWSER_USE_API_KEY
const browseruse = new BrowserUse();

const HackerNewsResponse = z.object({
  title: z.string(),
  url: z.string(),
  score: z.number(),
});

const TaskOutput = z.object({
  posts: z.array(HackerNewsResponse),
});

async function main() {
  console.log(`Running Task...`);

  // Create Task
  const rsp = await browseruse.tasks.run({
    task: 'Search for the top 10 Hacker News posts and return the title, url, and score',
    schema: TaskOutput,
  });

  const posts = rsp.doneOutput?.posts;

  if (posts == null) {
    throw new Error('No posts found');
  }

  for (const post of posts) {
    console.log(`${post.title} (${post.score}) - ${post.url}`);
  }

  console.log(`\nFound ${posts.length} posts`);
}

main().catch(console.error);
