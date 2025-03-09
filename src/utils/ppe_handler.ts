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
  const tokensThousands = Math.ceil(tokens / 1000);
  log.debug(`Charging for ${tokens} tokens (${tokensThousands} thousands) for model ${modelName}`);
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
    { eventName, count: tokensThousands }
  );
}

export async function chargeForActorStart() {
  if (
    Actor.getChargingManager()
      .getChargedEventCount(PPE_EVENT.ACTOR_START_GB) === 0
  ) {
    const count = Math.ceil((Actor.getEnv().memoryMbytes || 1024) / 1024);
    await Actor.charge({ eventName: 'actor-start-gb', count });
  }
}
