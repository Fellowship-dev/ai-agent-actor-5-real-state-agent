import { Log, ApifyClient } from 'apify';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatOpenAI } from '@langchain/openai';
import { StructuredToolInterface } from '@langchain/core/tools';
import DuckDuckGo from '../tools/duck_duck_go.js';
import WebsiteScraper from '../tools/website_scraper.js';
// import ZipCodeSearch from '../tools/zip_code_search.js';
import { CostHandler } from '../utils/cost_handler.js';

/**
 * Interface for parameters required by LocationExpertAgent class.
 */
export interface LocationExpertAgentParams {
  apifyClient: ApifyClient,
  modelName: string,
  openaiApiKey: string,
  log: Log | Console;
}

/**
 * Tool that uses the MagicTool function. This is an example function to use as template.
 */
export class LocationExpertAgent {
  protected log: Log | Console;
  protected apifyClient: ApifyClient;
  public agentExecutor: AgentExecutor;
  public costHandler: CostHandler;

  constructor(fields?: LocationExpertAgentParams) {
    this.log = fields?.log ?? console;
    this.apifyClient = fields?.apifyClient ?? new ApifyClient();
    this.costHandler = new CostHandler(fields?.modelName ?? 'gpt-4o-mini');
    const llm = new ChatOpenAI({
      model: fields?.modelName,
      apiKey: fields?.openaiApiKey,
      temperature: 0,
      callbacks: [
        this.costHandler,
      ],
    });
    const tools = this.buildTools(this.apifyClient, this.log);
    const prompt = this.buildPrompt();
    const agent = createToolCallingAgent({
      llm,
      tools,
      prompt,
    });
    this.agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: false,
      maxIterations: 5,
    });
  }

  protected buildTools(
    apifyClient: ApifyClient, log: Log | Console
  ): StructuredToolInterface[] {
    // Tools are initialized to be passed to the agent
    const duckDuckGo = new DuckDuckGo({ apifyClient, log });
    const websiteScraper = new WebsiteScraper({ apifyClient, log });
    // const zipCodeSearch = new ZipCodeSearch({ log });
    return [
      duckDuckGo,
      websiteScraper,
      // zipCodeSearch,
    ];
  }

  protected buildPrompt(): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages([
      ['system',
        'You are a experienced real state agent that wants to help the user to find the perfect home. '
        + "You will stick to the following steps, but notify the user if you get stuck or can't continue. "
        + 'Step 1. The user will ask you for advice regarding a specific city in the US. '
        + 'If the user does not provide a state (like CA or NY), try to guess to which state a city belongs to. '
        + 'If the user does not provide a state, try to guess to which state a city belongs to. '
        + 'If from the input you cannot get a city and a state or you think that the city is not in US territory, '
        + 'end the conversation and help the user with the input. '
        + "Make sure to convert the state to a two-letter ISO standard. For example, if the user says 'New York', store it as 'NY' before using it. \n"
        // 2. Fetch best Zip Codes to live using DuckDuckGo
        + 'Step 2. With the city and state in hand, use DuckDuckGo replacing the following query: '
        + "'best places to live near [city], [state] by zip code site:niche.com'. "
        + 'If there the results, use a website scraper on the URLs you think will show you this information. '
        + 'Iterate until you find the best 3 Zip Codes near the selected city. '
        + "For best performance when using the website scraper, you can use method='getBestZipCodesToLive' and output=null'. "
        + 'Instead of answering the original question, just return the top 3 Zip Codes and explain to the user why you selected those Zip Codes. \n'
      ],
      ['placeholder', '{chat_history}'],
      ['human', '{input}'],
      ['placeholder', '{agent_scratchpad}'],
    ]);
  }
}

export default LocationExpertAgent;
