import dotenv from 'dotenv';
import { Actor, ApifyClient, log } from 'apify';
import ResearcherAgent from './agents/researcher.js';

// if available, .env variables are loaded
dotenv.config();

/**
 * Actor input schema
 */
type Input = {
  instructions: string;
  modelName?: string;
  openaiApiKey?: string;
  debug?: boolean;
}

/**
 * Actor initialization code
*/
await Actor.init();
// await chargeForActorStart();

const userToken = Actor.getEnv().token;
if (!userToken) {
  throw new Error('User token is required. Use `apify login` and export your secret as APIFY_TOKEN.');
}

// Handle and validate input
const {
  instructions,
  modelName = 'gpt-4o-mini',
  openaiApiKey = process.env.OPENAI_API_KEY,
  debug,
} = await Actor.getInput() as Input;
if (debug) {
  log.setLevel(log.LEVELS.DEBUG);
}
if (!instructions) {
  throw new Error('Instructions are required. Create an INPUT.json file in the `storage/key_value_stores/default` folder and add the respective keys.');
}

// Apify is used to call tools and manage datasets
const apifyClient = new ApifyClient({
  token: userToken,
});

// The researcher agent gets initialized
const researcherAgent = new ResearcherAgent({
  apifyClient,
  modelName,
  openaiApiKey,
  log,
});

const { agentExecutor } = researcherAgent;
const response = await agentExecutor.invoke({ input: instructions });

log.info(`Agent 🤖 : ${response.output}`);

await Actor.exit();
