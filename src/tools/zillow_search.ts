import { Log, ApifyClient } from 'apify';
import { createHash } from 'crypto';
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
    // checks for cached stored version
    const key = JSON.stringify(actorInput);
    const algorithm = 'sha256';
    const digest = createHash(algorithm).update(key).digest('hex').slice(0, 16);
    const { username } = await this.apifyClient.user().get();
    const today = new Date().toISOString().slice(0, 10);
    const datasetName = `${today}-${digest}`;
    // const datasetName = '2025-03-11-37d909c75952bc93'; //DEBUG
    this.log.debug(`Searching for datasetId: ${username}/${datasetName}`);
    const existingDataset = await this.apifyClient
      .dataset(`${username}/${datasetName}`)
      .get();
    this.log.debug(`Found existingDataset? ${existingDataset}`);
    let totalItems = existingDataset?.itemCount;
    if (existingDataset) {
      this.log.debug(
        `Cached response found for: ${JSON.stringify(actorInput)}`
      );
    } else {
      this.log.debug(
        `Calling ZillowSearch with input: ${JSON.stringify(actorInput)}`
      );
      const actorRun = await this.apifyClient
        .actor('maxcopell/zillow-zip-search')
        .call(actorInput);
      await this.apifyClient
        .dataset(actorRun.defaultDatasetId)
        .update({ name: datasetName });
      const dataset = await this.apifyClient
        .dataset(actorRun.defaultDatasetId)
        .listItems();
      totalItems = dataset.total;
      await chargeForToolUsage(this.name, dataset.total);
    }
    this.log.debug(`ZillowSearch response: ${username}/${datasetName}`);
    return `Results for Zillow Search can be found in dataset with id '${username}/${datasetName}'. This dataset contains ${totalItems} items in total.`;
  }
}

export default ZillowSearch;
