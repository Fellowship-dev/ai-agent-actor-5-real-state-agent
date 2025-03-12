import { Log, ApifyClient } from 'apify';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatOpenAI } from '@langchain/openai';
import { StructuredToolInterface } from '@langchain/core/tools';
import ZillowSearch from '../tools/zillow_search.js';
import { CostHandler } from '../utils/cost_handler.js';

/**
 * Interface for parameters required by ZillowAgent class.
 */
export interface ZillowAgentParams {
  apifyClient: ApifyClient,
  modelName: string,
  openaiApiKey: string,
  log: Log | Console;
}

/**
 * An AI Agent that searches Zillow for specific Zip Codes and stores the results in a dataset.
 */
export class ZillowAgent {
  protected log: Log | Console;
  protected apifyClient: ApifyClient;
  public agentExecutor: AgentExecutor;
  public costHandler: CostHandler;

  constructor(fields?: ZillowAgentParams) {
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
      maxIterations: 3,
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
        'You are a experienced real state agent that knows that Zillow is a place where you can search for properties based on criteria like zip code and price. '
        + 'Using the recommended Zip Codes, search on Zillow for properties that match the user price requirements. '
        + 'The user must specify if he or she is looking to rent or buy a property (default to rent if the information is not given). '
        + 'The user can specify if the ideal property has a minimum value (default to 1 if the information is not given). '
        + 'The user can specify if the ideal property has a maximum value (default to 1000 if the information is not given). '
        + 'Inform the user of the assumptions you made to make the Zillow search.'
        + 'Inform the user the datasetId and the amount of items you received from the zillow_search tool in order to explore the results later. '
        + "As your response, return only a JSON object (and nothing more! not even a ```json or ``` wrapper) with the keys 'datasetId' and 'assumptions', with their corresponding values in string format, along with the key 'totalItems' with the number of items in the dataset in number format."
      ],
      ['placeholder', '{chat_history}'],
      ['human', '{input}'],
      ['placeholder', '{agent_scratchpad}'],
    ]);
  }
}

export default ZillowAgent;
