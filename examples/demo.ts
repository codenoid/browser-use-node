#!/usr/bin/env -S npm run tsn -T

import { BrowserUse } from 'browser-use-sdk';
import { spinner } from './utils';
import { TaskView } from 'browser-use-sdk/resources';

// gets API Key from environment variable BROWSER_USE_API_KEY
const browseruse = new BrowserUse();

async function main() {
  let log = 'starting';
  const stop = spinner(() => log);

  // Create Task
  const rsp = await browseruse.tasks.create({
    task: "What's the weather line in SF and what's the temperature?",
  });

  poll: do {
    // Wait for Task to Finish
    const status = (await browseruse.tasks.retrieve(rsp.id, { statusOnly: false })) as TaskView;

    switch (status.status) {
      case 'started':
      case 'paused':
      case 'stopped':
        log = `agent ${status.status} - live: ${status.sessionLiveUrl}`;

        await new Promise((resolve) => setTimeout(resolve, 2000));
        break;

      case 'finished':
        stop();

        console.log(status.doneOutput);
        break poll;
    }
  } while (true);
}

main().catch(console.error);
