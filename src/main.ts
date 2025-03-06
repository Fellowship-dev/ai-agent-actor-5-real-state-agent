import dotenv from "dotenv";
import { Actor, ApifyClient, log } from 'apify';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredToolInterface } from '@langchain/core/tools';
import MagicTool from "./tools/magictool.js";

// if available, .env variables are loaded
dotenv.config()

/**
 * Actor input schema
 */
type Input = {
  instructions: string;
  modelName?: string;
  openaiApiKey?: string;
  debug?: boolean;
}

await Actor.init();

/**
 * Actor code
*/
// await chargeForActorStart();

const userToken = Actor.getEnv().token;
if (!userToken) {
  throw new Error('User token is required. Use `apify login` and export your secret as APIFY_TOKEN.');
}

// Handle input
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
if (!instructions) {
  throw new Error('Instructions are required. Create an INPUT.json file in the `storage/key_value_stores/default` folder and add the respective keys.');
}

// Apify is used to fetch an existing database if available
const apifyClient = new ApifyClient({
  token: userToken,
});

// Tools are initialized to be passed to the agent
const magicTool = new MagicTool({ log })
const tools: StructuredToolInterface[] = [
  magicTool,
]

log.debug(`Using model: ${modelName}`);
const llm = new ChatOpenAI({
  model: modelName,
  apiKey: openaiApiKey,
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant"],
  ["placeholder", "{chat_history}"],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"],
]);

const agent = createToolCallingAgent({
  llm,
  tools,
  prompt,
});

const agentExecutor = new AgentExecutor({
  agent,
  tools,
});

const response = await agentExecutor.invoke({ input: instructions });

log.info(`Agent 🤖 : ${response.output}`);

await Actor.exit();
