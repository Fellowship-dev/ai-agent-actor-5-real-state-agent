import dotenv from 'dotenv';
import { Actor, ApifyClient, log } from 'apify';
import { StateGraph, StateGraphArgs, START, END } from '@langchain/langgraph';
import LocationExpertAgent from './agents/location_expert.js';
import ResearcherAgent from './agents/researcher.js';
import { chargeForActorStart } from './utils/ppe_handler.js';

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
await chargeForActorStart();

const userToken = Actor.getEnv().token;
if (!userToken) {
  throw new Error('User token is required. Use `apify login` and export your secret as APIFY_TOKEN.');
}

// Handle and validate input
const {
  instructions,
  modelName = 'gpt-4o-mini',
  openaiApiKey,
  debug,
} = await Actor.getInput() as Input;
if (debug) {
  log.setLevel(log.LEVELS.DEBUG);
} else {
  log.setLevel(log.LEVELS.INFO);
}
// if available, the Actor uses the user's openaiApiKey. Otherwise it charges for use.
const tokenCostActive = (openaiApiKey ?? '').length === 0;
if (tokenCostActive) {
  log.info("No openaiApiKey was detected. You'll be charged for token usage.");
} else {
  log.info("Env openaiApiKey detected. You won't be charged for token usage.");
}
if (!instructions) {
  throw new Error('Instructions are required. Create an INPUT.json file in the `storage/key_value_stores/default` folder and add the respective keys.');
}

// Apify is used to call tools and manage datasets
const apifyClient = new ApifyClient({
  token: userToken,
});

/**
 * LangGraph StateGraph schema
 */
type StateSchema = {
  instructions: string;
  bestLocations: string;
  recommendations: string[];
  output: string;
}

const graphState: StateGraphArgs<StateSchema>['channels'] = {
  instructions: {
    value: (x?: string, y?: string) => y ?? x ?? '',
    default: () => instructions,
  },
  bestLocations: {
    value: (x?: string, y?: string) => y ?? x ?? '',
    default: () => '',
  },
  recommendations: {
    value: (x?: string[], y?: string[]) => y ?? x ?? [],
    default: () => [],
  },
  output: {
    value: (x?: string, y?: string) => y ?? x ?? '',
    default: () => '',
  },
};

async function locationExpert(state: StateSchema) {
  // The researcher agent gets initialized
  const locationExpertAgent = new LocationExpertAgent({
    apifyClient,
    modelName,
    openaiApiKey: openaiApiKey ?? process.env.OPENAI_API_KEY,
    log,
  });
  const { agentExecutor, costHandler } = locationExpertAgent;
  const response = await agentExecutor.invoke({ input: state.instructions });
  log.debug(`locationExpert 🤖 : ${response.output}`);
  await costHandler.logOrChargeForTokens(modelName, tokenCostActive);
  return { bestLocations: response.output };
}

async function researcher(state: StateSchema) {
  // The researcher agent gets initialized
  const researcherAgent = new ResearcherAgent({
    apifyClient,
    modelName,
    openaiApiKey: openaiApiKey ?? process.env.OPENAI_API_KEY,
    log,
  });
  const { agentExecutor, costHandler } = researcherAgent;
  const input = 'The user asked sent this exact query:\n\n'
    + `'${state.instructions}'\n\n`
    + 'You asked someone for help to get the best locations in that city and state. '
    + 'The answer you received was this:\n\n'
    + `'${state.bestLocations}'\n\n`
    + 'Please answer the user accordingly.';
  const response = await agentExecutor.invoke({ input });
  await costHandler.logOrChargeForTokens(modelName, tokenCostActive);
  return { output: response.output };
}

const graph = new StateGraph({ channels: graphState })
  .addNode('location_expert', locationExpert)
  .addNode('researcher', researcher)
  .addEdge(START, 'location_expert')
  .addEdge('location_expert', 'researcher')
  .addEdge('researcher', END);

const runnable = graph.compile();
const response = await runnable.invoke(
  { input: instructions },
  { configurable: { thread_id: 42 } }, // this line shows that the agent can be thread-aware
);

log.debug(`Agent 🤖 : ${response.output}`);

await Actor.pushData({
  actorName: 'AI Real State Agent',
  response: response.output,
});

await Actor.exit();
