import { Actor, log } from 'apify';
import { PPE_EVENT } from './ppe_events.js';

/**
 * Charges for the tokens used by a specific model.
 *
 * @param modelName - The name of the model.
 * @param tokens - The number of tokens to charge for.
 * @throws Will throw an error if the model name is unknown.
 */
export async function chargeForModelTokens(modelName: string, tokens: number) {
  const tokensK = Math.ceil(tokens / 1000);
  log.debug(`Charging for ${tokens} tokens (${tokensK}k) for model ${modelName}`);
  let eventName: string = PPE_EVENT.GPT_4O;
  switch (modelName) {
  case 'gpt-4o-mini':
    eventName = PPE_EVENT.GPT_4O_MINI;
    break;
  case 'gpt-3.5-turbo':
    eventName = PPE_EVENT.GPT_3_5_TURBO;
    break;
  case 'gpt-o3-mini':
    eventName = PPE_EVENT.GPT_O3_MINI;
    break;
  case 'gpt-o1-mini':
    eventName = PPE_EVENT.GPT_O1_MINI;
    break;
  default:
    eventName = PPE_EVENT.GPT_4O;
    break;
  }
  await Actor.charge(
    { eventName, count: tokensK }
  );
}

export async function chargeForActorStart() {
  if (
    Actor.getChargingManager()
      .getChargedEventCount(PPE_EVENT.ACTOR_START_GB) === 0
  ) {
    const count = Math.ceil((Actor.getEnv().memoryMbytes || 1024) / 1024);
    await Actor.charge({ eventName: PPE_EVENT.ACTOR_START_GB, count });
  }
}

export async function chargeForToolUsage(toolName: string, count: number) {
  log.debug(`Charging #${count} times for tool ${toolName}`);
  let eventName: string = '';
  switch (toolName) {
  case 'duck_duck_go':
    eventName = PPE_EVENT.DUCK_DUCK_GO;
    break;
  case 'website_scraper':
    eventName = PPE_EVENT.WEBSITE_SCRAPER;
    break;
  case 'zillow_search':
    eventName = PPE_EVENT.ZILLOW_SEARCH;
    break;
  case 'zip_code_search':
    eventName = PPE_EVENT.ZIP_CODE_SEARCH;
    break;
  default:
    eventName = '';
    break;
  }
  await Actor.charge({ eventName, count });
}
