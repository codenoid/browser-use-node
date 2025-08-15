#!/usr/bin/env -S npm run tsn -T

import { BrowserUse } from 'browser-use-sdk';

async function main() {
  // gets API Key from environment variable BROWSER_USE_API_KEY
  const browseruse = new BrowserUse();

  console.log('Creating task and starting stream...\n');

  // Create a task and get the stream
  const stream = browseruse.tasks.stream({
    task: 'What is the weather in San Francisco?',
  });

  // Get a reader from the stream
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  try {
    // Read the stream chunk by chunk
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('\nStream completed');
        break;
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
              const parsed = JSON.parse(data) as BrowserUse.TaskView;

              process.stdout.write(`${parsed.status}`);
              if (parsed.sessionLiveUrl) {
                process.stdout.write(` | Live URL: ${parsed.sessionLiveUrl}`);
              }

              if (parsed.steps.length > 0) {
                const latestStep = parsed.steps[parsed.steps.length - 1];
                process.stdout.write(` | ${latestStep!.nextGoal}`);
              }

              if (parsed.status === 'finished') {
                process.stdout.write(`\n\nOUTPUT: ${parsed.doneOutput}`);
                // Close the reader and exit the main loop when task is finished
                reader.releaseLock();
                return;
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
