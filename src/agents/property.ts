import { Log, ApifyClient } from 'apify';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatOpenAI } from '@langchain/openai';
import { StructuredToolInterface } from '@langchain/core/tools';
import DatasetExplorer from '../tools/dataset_explorer.js';
import { CostHandler } from '../utils/cost_handler.js';

/**
 * Interface for parameters required by PropertyAgent class.
 */
export interface PropertyAgentParams {
  apifyClient: ApifyClient,
  modelName: string,
  openaiApiKey: string,
  log: Log | Console;
}

/**
 * An AI Agent that explores an Apify dataset in search for the perfect home.
 */
export class PropertyAgent {
  protected log: Log | Console;
  protected apifyClient: ApifyClient;
  public agentExecutor: AgentExecutor;
  public costHandler: CostHandler;

  constructor(fields?: PropertyAgentParams) {
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
    return [
      datasetExplorer,
    ];
  }

  protected buildPrompt(): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages([
      ['system',
        'You are a experienced real state agent that wants to help the user to find the perfect home. '
        + "You'll have a datasetId and the total amount of items available to explore. "
        + 'Explore only one batch of 100 properties (using limit=100). '
        + 'Skip the first items based on the number of items that were already checked (using offset=itemsChecked). '
        + "When exploring the dataset, include only these fields exactly as written here: ['id','rawHomeStatusCd','marketingStatusSimplifiedCd','imgSrc','hasImage','detailUrl','statusType','statusText','price','unformattedPrice','addressStreet','addressCity','addressState','addressZipcode','beds','baths','area','flexFieldText','contentType','hasAdditionalAttributions','brokerName']"
        + 'Remember: do not call the DatasetExplorer tool more than once, or you will die. \n\n'
        + 'The user may have specified other requests like pets, pool, beds, baths, sqft, gym, etc. '
        + 'Filter the results based on this information or notify the user if you are unable to do so. '
        + 'Use your expertise to recommend the best properties that you can find that matches the user criteria. '
        + 'If the total amount of items (totalItems) is over 100, select up to 3 properties otherwise pick up to 5. Try to at least pick one. '
        + "As your response, return only a JSON object (and nothing more! not even a ```json or ``` wrapper) with the key 'itemsChecked' as a number with the amount of properties that you received from the dataset_explorer and the key 'recommendations' with your recommendations in JSON format, using the same fields that you specified when calling the dataset_explorer."
      ],
      ['placeholder', '{chat_history}'],
      ['human', '{input}'],
      ['placeholder', '{agent_scratchpad}'],
    ]);
  }
}

export default PropertyAgent;
