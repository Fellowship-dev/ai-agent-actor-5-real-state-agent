import { Log } from 'apify';
import { BaseTracer } from 'langchain/callbacks';
import { Run } from '@langchain/core/tracers/tracer_langchain';
import { GPT_MODEL_LIST, OpenaiAPICost } from './openai_models.js';
import { chargeForModelTokens } from './ppe_handler.js';

interface TotalCost {
  usd: number;
  inputTokens: number;
  outputTokens: number;
  totalModelCalls: number;
}

export class CostHandler extends BaseTracer {
  protected log: Log | Console;
  name: string;
  modelName: string;
  modelCost: OpenaiAPICost;
  totalCost: TotalCost;

  constructor(modelName: string, log?: Log | Console) {
    super();
    this.log = log ?? console;
    this.name = 'cost_handler';
    this.modelName = modelName;
    this.modelCost = GPT_MODEL_LIST[this.modelName].cost;
    this.totalCost = {
      usd: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalModelCalls: 0,
    };
  }

  // NOTE: We do not need to persist runs in this handler.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  persistRun(_run: Run) {
    return Promise.resolve();
  }

  /**
   * Logs tokens usage in $.
   * @returns void
   */
  override onLLMEnd(run: Run) {
    const tokenUsage = run?.outputs?.llmOutput?.tokenUsage;
    if (tokenUsage) {
      const inputCostsUSD = this.modelCost.input
        * (tokenUsage.promptTokens / 1000);
      const outputCostsUSD = this.modelCost.output
        * (tokenUsage.completionTokens / 1000);
      const callCostUSD = inputCostsUSD + outputCostsUSD;
      this.totalCost.usd += inputCostsUSD + outputCostsUSD;
      this.totalCost.inputTokens += tokenUsage.promptTokens;
      this.totalCost.outputTokens += tokenUsage.completionTokens;
      this.totalCost.totalModelCalls++;
      const durationSecs = run.end_time && run.start_time
        && (run.end_time - run.start_time) / 1000;
      this.log.debug(`LLM model call processed`,
        {
          durationSecs,
          callCostUSD,
          totalCostUSD: this.totalCost.usd,
          inputTokens: this.totalCost.inputTokens,
          outputTokens: this.totalCost.outputTokens,
        }
      );
    }
  }

  override onLLMStart(run: Run) {
    this.log.debug(`Calling LLM model`, run);
  }

  getTotalCost() {
    return this.totalCost;
  }

  async logOrChargeForTokens(modelName: string, tokenCostActive: boolean) {
    const costs = this.totalCost;
    if (tokenCostActive) {
      const tokens = costs.inputTokens + costs.outputTokens;
      const tokensCost = this.modelCost.output * (tokens / 1000);
      this.log.info(`Total tokens processed: ${tokens}. Usage cost: ${tokensCost}`);
      await chargeForModelTokens(modelName, tokens);
    } else {
      this.log.info(`Estimated OpenAI cost: $${costs.usd} USD`);
    }
  }
}
