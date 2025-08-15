#!/usr/bin/env -S npm run tsn -T

import { BrowserUse } from 'browser-use-sdk';

async function main() {
  // gets API Key from environment variable BROWSER_USE_API_KEY
  const browseruse = new BrowserUse();

  console.log('Creating task and starting stream...');

  // Create a task and get the stream
  const gen = browseruse.tasks.stream({
    task: 'What is the weather in San Francisco?',
  });

  for await (const msg of gen) {
    console.log(msg);
  }

  console.log('\nStream completed');
}

main().catch(console.error);
