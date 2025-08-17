import * as dotenv from '@dotenvx/dotenvx';

import { BrowserUse } from '../../';

const ENV_VAR_KEY = 'BROWSER_USE_API_KEY';

/**
 * Creates a new BrowserUse client with the API key from the environment variable.
 */
export function createBrowserUseClient() {
  let apiKey: string | null = null;

  if (process.env[ENV_VAR_KEY]) {
    apiKey = process.env[ENV_VAR_KEY];
  }

  if (apiKey == null) {
    const env = dotenv.config({ path: '.env' });

    const envApiKey = env.parsed?.[ENV_VAR_KEY];

    if (envApiKey) {
      apiKey = envApiKey;
    }
  }

  if (apiKey == null) {
    console.error(`Missing BROWSER_USE_API_KEY environment variable!`);
    process.exit(1);
  }

  return new BrowserUse({ apiKey });
}
