import { Log, ApifyClient } from 'apify';
import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Interface for parameters required by ZillowSearch class.
 */
export interface ZillowSearchParams {
  apifyClient: ApifyClient;
  log: Log | Console;
}

/**
 * Tool that uses the ZillowSearch function
 */
export class ZillowSearch extends StructuredTool {
  protected log: Log | Console;
  protected apifyClient: ApifyClient;

  name = "zillow_search";

  description = "Searches for properties on Zillow and returns a stringified JSON with the results."

  schema = z.object({
    zipCodes: z.string().array(),
    minimumPrice: z.number(),
    maximumPrice: z.number(),
    forRent: z.boolean(),
  });

  constructor(fields?: ZillowSearchParams) {
    super(...arguments);
    const log = fields?.log ?? console;
    this.log = log;
    const apifyClient = fields?.apifyClient ?? new ApifyClient();;
    this.apifyClient = apifyClient;
  }

  override async _call(arg: z.output<typeof this.schema>) {
    const actorInput = {
      "forRent": arg.forRent,
      "forSaleByAgent": true,
      "forSaleByOwner": true,
      "priceMax": arg.maximumPrice,
      "priceMin": arg.minimumPrice,
      "sold": false,
      "zipCodes": arg.zipCodes,
    }
    // this.log.debug(`Zillow Search input: ${JSON.stringify(actorInput)}`);
    const actorRun = await this.apifyClient.actor('maxcopell/zillow-zip-search').call(actorInput)
    const dataset = await this.apifyClient.dataset(actorRun.defaultDatasetId).listItems()
    const items = dataset.items.slice(0, 10); // return only the top 10 properties to avoid sending too much data
    this.log.debug(`Zillow Search input: ${JSON.stringify(items)}`);
    return JSON.stringify(items);
  }
}

export default ZillowSearch;
