import dotenv from "dotenv";
import { Actor, ApifyClient, log } from 'apify';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredToolInterface } from '@langchain/core/tools';
import ZillowSearch from "./tools/zillow_search.js";
import ZipCodeSearch from "./tools/zip_code_search.js";

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
const zillowSearch = new ZillowSearch({ apifyClient, log })
const zipCodeSearch = new ZipCodeSearch({ log })
const tools: StructuredToolInterface[] = [
  zillowSearch,
  zipCodeSearch,
]

log.debug(`Using model: ${modelName}`);
const llm = new ChatOpenAI({
  model: modelName,
  apiKey: openaiApiKey,
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system",
    "You are a experienced real state agent that wants to help the user to find the perfect home. " +
    "The user will ask you for advice regarding a specific city in the US. " +
    "If the user does not provide a state (like CA or NY), try to guess to which state a city belongs to. " +
    "If the user does not provide a state, try to guess to which state a city belongs to. " +
    "If from the input you cannot get a city and a state or you think that the city is not in US territory, end the conversation and help the user with the input. " +
    "Make sure to convert the state to a two-letter ISO standard. For example, if the user says 'New York', store it as 'NY' before using it. " +
    "Using the Zip Codes that belong to the selected city, search on Zillow for properties that match the user requirements. " +
    "Only select one random zip code from the list. " + // DEBUG
    "The user must specify if he or she is looking to rent or buy a property (default to rent if the information is not given). " +
    "The user can specify if the ideal property has a minimum value (default to 1 if the information is not given). " +
    "The user can specify if the ideal property has a maximum value (default to 1000 if the information is not given). " +
    "Inform the user of the assumptions you make before delivering any results. " +
    "Based on the results, use your expertise to recommend the best 5 properties that you found. " +
    "Make sure that you show the address, price and a link to view more information about the chosen properties. " +
    "At the end, please explain why you chose those properties. "
  ],
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
  verbose: false,
  maxIterations: 3,
});

const response = await agentExecutor.invoke({ input: instructions });

log.info(`Agent 🤖 : ${response.output}`);

await Actor.exit();
