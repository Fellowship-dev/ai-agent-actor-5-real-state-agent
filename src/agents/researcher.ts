import { Log, ApifyClient } from 'apify';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatOpenAI } from '@langchain/openai';
import { StructuredToolInterface } from '@langchain/core/tools';
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
    const zillowSearch = new ZillowSearch({ apifyClient, log });
    return [
      zillowSearch,
    ];
  }

  protected buildPrompt(): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages([
      ['system',
        'You are a experienced real state agent that wants to help the user to find the perfect home. '
        + "You will stick to the following steps, but notify the user if you get stuck or can't continue. "
        + 'Step 1. Using the selected Zip Codes, search on Zillow for properties that match the user requirements. '
        // + "Remember: Don't perform a Zillow Search until you find a good ranking (every search costs money and you want to save). "
        + 'The user must specify if he or she is looking to rent or buy a property (default to rent if the information is not given). '
        + 'The user can specify if the ideal property has a minimum value (default to 1 if the information is not given). '
        + 'The user can specify if the ideal property has a maximum value (default to 1000 if the information is not given). '
        + 'Inform the user of the assumptions you make before delivering any results. \n'
        + 'Step 2. Based on the results, use your expertise to recommend the best 5 properties that you found. '
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
