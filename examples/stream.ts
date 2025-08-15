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
        console.log(line);
      }
    }
  } catch (error) {
    console.error('Error reading stream:', error);
  } finally {
    reader.releaseLock();
  }
}

main().catch(console.error);
