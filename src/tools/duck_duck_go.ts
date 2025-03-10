import { Log, ApifyClient } from 'apify';
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
    this.log.debug(
      `Calling DuckDuckGo with input: ${JSON.stringify(actorInput)}`
    );
    const actorRun = await this.apifyClient
      .actor('canadesk/duckduckgo-serp-api')
      .call(actorInput);
    const dataset = await this.apifyClient
      .dataset(actorRun.defaultDatasetId)
      .listItems();
    const { items } = dataset;
    this.log.debug(`DuckDuckGo response: ${JSON.stringify(items)}`);
    await chargeForToolUsage(this.name, 1);
    return JSON.stringify(items);
  }
}

export default DuckDuckGo;
