import { Log, ApifyClient } from 'apify';
import { createHash } from 'crypto';
import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { chargeForToolUsage } from '../utils/ppe_handler.js';

/**
 * Interface for parameters required by WebsiteScraper class.
 */
export interface WebsiteScraperParams {
  apifyClient: ApifyClient;
  log: Log | Console;
}

/**
 * An example input that serves as a good default
 */
const sampleInput = {
  method: 'getAllItems',
  output: '{"results":[""]}',
};

/**
 * Tool that uses the WebsiteScraper function
 */
export class WebsiteScraper extends StructuredTool {
  protected log: Log | Console;
  protected apifyClient: ApifyClient;

  name = 'website_scraper';

  description = 'Scrapes a URL and then performs a search based on a specified method (for example: getAllItems) and returns a stringified JSON with the results using the default output format (for example: {"results":[""]}).';

  schema = z.object({
    url: z.string(),
    method: z.string() || undefined,
    // output: z.string() || undefined || null,
  });

  constructor(fields?: WebsiteScraperParams) {
    super(...arguments);
    this.log = fields?.log ?? console;
    this.apifyClient = fields?.apifyClient ?? new ApifyClient();
  }

  override async _call(arg: z.output<typeof this.schema>) {
    const actorInput = {
      url: arg.url,
      method: arg.method ?? sampleInput.method,
      output: sampleInput.output,
    };
    // checks for cached stored version
    const key = JSON.stringify(actorInput);
    const algorithm = 'sha256';
    const digest = createHash(algorithm).update(key).digest('hex').slice(0, 16);
    const { username } = await this.apifyClient.user().get();
    const thisMonth = new Date().toISOString().slice(0, 7);
    const datasetName = `${thisMonth}-${digest}`;
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
      const callOptions = {
        timeout: 60,
      };
      this.log.debug(
        `Calling WebsiteScraper with input: ${JSON.stringify(actorInput)}`
      );
      const actorRun = await this.apifyClient
        .actor('zeeb0t/web-scraping-api---scrape-any-website')
        .call(actorInput, callOptions);
      dataset = await this.apifyClient
        .dataset(actorRun.defaultDatasetId)
        .listItems();
      if (dataset.total > 0) {
        await this.apifyClient
          .dataset(actorRun.defaultDatasetId)
          .update({ name: datasetName });
      }
      await chargeForToolUsage(this.name, 1);
    }
    const { items } = dataset;
    this.log.debug(`WebsiteScraper response: ${JSON.stringify(items)}`);
    return `Scraped ${arg.url}, ran the method ${arg.method} on the content and obtained: ${JSON.stringify(items)}`;
  }
}

export default WebsiteScraper;
