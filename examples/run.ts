#!/usr/bin/env -S npm run tsn -T

import { BrowserUse } from 'browser-use-sdk';

import { env } from './utils';

env();

// gets API Key from environment variable BROWSER_USE_API_KEY
const browseruse = new BrowserUse();

async function main() {
  console.log(`Creating Task...`);

  // Create Task
  const rsp = await browseruse.tasks.run({
    task: "What's the weather line in SF and what's the temperature?",
  });

  console.log(rsp.doneOutput);
}

main().catch(console.error);
