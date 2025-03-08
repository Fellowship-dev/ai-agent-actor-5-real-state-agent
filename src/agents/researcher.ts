import { Log, ApifyClient } from 'apify';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatOpenAI } from '@langchain/openai';
import { StructuredToolInterface } from '@langchain/core/tools';
import DuckDuckGo from '../tools/duck_duck_go.js';
import WebsiteScraper from '../tools/website_scraper.js';
import ZillowSearch from '../tools/zillow_search.js';
// import ZipCodeSearch from '../tools/zip_code_search.js';

/**
 * Interface for parameters required by ResearcherAgent class.
 */
export interface ResearcherAgentParams {
  apifyClient: ApifyClient,
  modelName: string,
  openaiApiKey: string,
  log: Log | Console;
}

/**
 * Tool that uses the MagicTool function. This is an example function to use as template.
 */
export class ResearcherAgent {
  protected log: Log | Console;
  protected apifyClient: ApifyClient;
  public agentExecutor: AgentExecutor;

  constructor(fields?: ResearcherAgentParams) {
    this.log = fields?.log ?? console;
    this.apifyClient = fields?.apifyClient ?? new ApifyClient();
    const llm = new ChatOpenAI({
      model: fields?.modelName,
      apiKey: fields?.openaiApiKey,
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
    const zillowSearch = new ZillowSearch({ apifyClient, log });
    // const zipCodeSearch = new ZipCodeSearch({ log });
    return [
      duckDuckGo,
      websiteScraper,
      zillowSearch,
      // zipCodeSearch,
    ];
  }

  protected buildPrompt(): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages([
      ['system',
        'You are a experienced real state agent that wants to help the user to find the perfect home. '
        + "You will stick to the following steps, but notify the user if you get stuck or can't continue. "
        // 1. Determine City and State
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
        + "Don't perform a Zillow Search until you find a good ranking (every search costs money and you want to save). "
        + 'Explain to the user why you selected those Zip Codes. \n'
        // 3. With a set of Zip Codes in hand, search Zillow for options
        + 'Step 3. Using the selected Zip Codes, search on Zillow for properties that match the user requirements. '
        + "Remember: Don't perform a Zillow Search until you find a good ranking (every search costs money and you want to save). "
        + 'The user must specify if he or she is looking to rent or buy a property (default to rent if the information is not given). '
        + 'The user can specify if the ideal property has a minimum value (default to 1 if the information is not given). '
        + 'The user can specify if the ideal property has a maximum value (default to 1000 if the information is not given). '
        + 'Inform the user of the assumptions you make before delivering any results. \n'
        // 4. With the results
        + 'Step 4. Based on the results, use your expertise to recommend the best 5 properties that you found. '
        + 'The user may have specified other requests like pets, pool, beds, baths, sqft, gym, etc. '
        + 'Filter the results based on this information or notify the user if you are unable to do so. '
        + 'Make sure that you show the address, price and a link to view more information about the chosen properties. '
        + 'At the end, please explain why you chose those properties. '
      ],
      ['placeholder', '{chat_history}'],
      ['human', '{input}'],
      ['placeholder', '{agent_scratchpad}'],
    ]);
  }
}

export default ResearcherAgent;
