import { Log, ApifyClient } from 'apify';
import { createHash } from 'crypto';
import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { chargeForToolUsage } from '../utils/ppe_handler.js';

/**
 * Interface for parameters required by DuckDuckGo class.
 */
export interface DuckDuckGoParams {
  apifyClient: ApifyClient;
  log: Log | Console;
}

/**
 * Tool that uses the DuckDuckGo function
 */
export class DuckDuckGo extends StructuredTool {
  protected log: Log | Console;
  protected apifyClient: ApifyClient;

  name = 'duck_duck_go';

  description = 'Performs a search on the search engine DuckDuckGo and returns a stringified JSON with the results.';

  schema = z.object({
    keywords: z.string(),
    locale: z.enum(['us-en', 'uk-en', 'cz-cs', 'cl-es']) || undefined,
    maximum: z.number() || undefined,
  });

  constructor(fields?: DuckDuckGoParams) {
    super(...arguments);
    this.log = fields?.log ?? console;
    this.apifyClient = fields?.apifyClient ?? new ApifyClient();
  }

  override async _call(arg: z.output<typeof this.schema>) {
    const actorInput = {
      keywords: arg.keywords,
      proxy: {
        useApifyProxy: true,
        apifyProxyGroups: [
          'RESIDENTIAL'
        ],
        apifyProxyCountry: 'US'
      },
      locale: arg.locale ?? 'us-en',
      operation: 'st',
      safe: 'Partial',
      daterange: 'all',
      img_type: 'all',
      img_size: 'all',
      vid_duration: 'all',
      maximum: arg.maximum ?? 5,
      timeout: 30
    };
    // checks for cached stored version
    const key = JSON.stringify(actorInput);
    const algorithm = 'sha256';
    const digest = createHash(algorithm).update(key).digest('hex').slice(0, 16);
    const { username } = await this.apifyClient.user().get();
    const today = new Date().toISOString().slice(0, 10);
    const datasetName = `${today}-${digest}`;
    this.log.debug(`Searching for datasetId: ${username}/${datasetName}`);
    const existingDataset = await this.apifyClient
      .dataset(`${username}/${datasetName}`)
      .get();
    this.log.debug(`Found existingDataset? ${existingDataset}`);
    let dataset;
    if (existingDataset) {
      this.log.debug(
        `Cached response found for: ${JSON.stringify(actorInput)}`
      );
      dataset = await this.apifyClient
        .dataset(`${username}/${datasetName}`)
        .listItems();
    } else {
      this.log.debug(
        `Calling DuckDuckGo with input: ${JSON.stringify(actorInput)}`
      );
      const actorRun = await this.apifyClient
        .actor('canadesk/duckduckgo-serp-api')
        .call(actorInput);
      dataset = await this.apifyClient
        .dataset(actorRun.defaultDatasetId)
        .listItems();
      await this.apifyClient
        .dataset(actorRun.defaultDatasetId)
        .update({ name: datasetName });
      await chargeForToolUsage(this.name, 1);
    }
    const { items } = dataset;
    this.log.debug(`DuckDuckGo response: ${JSON.stringify(items)}`);
    return JSON.stringify(items);
  }
}

export default DuckDuckGo;
