import { Log, ApifyClient } from 'apify';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatOpenAI } from '@langchain/openai';
import { StructuredToolInterface } from '@langchain/core/tools';
import DatasetExplorer from '../tools/dataset_explorer.js';
import ZillowSearch from '../tools/zillow_search.js';
import { CostHandler } from '../utils/cost_handler.js';

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
  public costHandler: CostHandler;

  constructor(fields?: ResearcherAgentParams) {
    this.log = fields?.log ?? console;
    this.apifyClient = fields?.apifyClient ?? new ApifyClient();
    this.costHandler = new CostHandler(fields?.modelName ?? 'gpt-4o-mini', this.log);
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
    const datasetExplorer = new DatasetExplorer({ apifyClient, log });
    const zillowSearch = new ZillowSearch({ apifyClient, log });
    return [
      datasetExplorer,
      zillowSearch,
    ];
  }

  protected buildPrompt(): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages([
      ['system',
        'You are a experienced real state agent that wants to help the user to find the perfect home. '
        + "You will stick to the following steps, but notify the user if you get stuck or can't continue. "
        + 'Step 1. Using the selected Zip Codes, search on Zillow for properties that match the user requirements. '
        + 'The user must specify if he or she is looking to rent or buy a property (default to rent if the information is not given). '
        + 'The user can specify if the ideal property has a minimum value (default to 1 if the information is not given). '
        + 'The user can specify if the ideal property has a maximum value (default to 1000 if the information is not given). '
        + 'Inform the user of the assumptions you make before delivering any results. \n'
        + "You'll receive a datasetId and the amount of items to explore the results. "
        + 'Step 2. Explore the results using the datasetId and use your expertise to recommend the best 5 properties that you can find. '
        + "When exploring the dataset, use a limit of 25 and include only these fields exactly as written here: ['id','rawHomeStatusCd','marketingStatusSimplifiedCd','imgSrc','hasImage','detailUrl','statusType','statusText','price','unformattedPrice','addressStreet','addressCity','addressState','addressZipcode','beds','baths','area','flexFieldText','contentType','hasAdditionalAttributions','brokerName']"
        + 'The user may have specified other requests like pets, pool, beds, baths, sqft, gym, etc. '
        + 'Filter the results based on this information or notify the user if you are unable to do so. '
        + 'Make sure that you show the address, price, beds, baths, amenities (or other useful information) and a link to view more information about the chosen properties. '
        + 'At the end, please explain why you chose those properties and how many you explored before making your choice. '
      ],
      ['placeholder', '{chat_history}'],
      ['human', '{input}'],
      ['placeholder', '{agent_scratchpad}'],
    ]);
  }
}

export default ResearcherAgent;
