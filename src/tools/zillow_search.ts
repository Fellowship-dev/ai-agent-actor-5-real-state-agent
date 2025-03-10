import { Log, ApifyClient } from 'apify';
import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { chargeForToolUsage } from '../utils/ppe_handler.js';

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

  name = 'zillow_search';

  description = 'Searches for properties on Zillow based on a list of Zip Codes (at least one) and returns a stringified JSON with the results.';

  schema = z.object({
    zipCodes: z.string().array(),
    minimumPrice: z.number(),
    maximumPrice: z.number(),
    forRent: z.boolean(),
  });

  constructor(fields?: ZillowSearchParams) {
    super(...arguments);
    this.log = fields?.log ?? console;
    this.apifyClient = fields?.apifyClient ?? new ApifyClient();
  }

  override async _call(arg: z.output<typeof this.schema>) {
    const actorInput = {
      forRent: arg.forRent,
      forSaleByAgent: true,
      forSaleByOwner: true,
      priceMax: arg.maximumPrice,
      priceMin: arg.minimumPrice,
      sold: false,
      zipCodes: arg.zipCodes,
    };
    this.log.debug(
      `Calling ZillowSearch with input: ${JSON.stringify(actorInput)}`
    );
    const actorRun = await this.apifyClient
      .actor('maxcopell/zillow-zip-search')
      .call(actorInput);
    const dataset = await this.apifyClient
      .dataset(actorRun.defaultDatasetId)
      .listItems();
    await chargeForToolUsage(this.name, dataset.total);
    // returns only the top 10 properties to avoid sending too much data
    // NOTE: this tool could return the dataset-id and use another tool to read it
    const cappedItems = dataset.items.slice(0, 10);
    this.log.debug(`ZillowSearch response: ${JSON.stringify(cappedItems)}`);
    return JSON.stringify(cappedItems);
  }
}

export default ZillowSearch;
