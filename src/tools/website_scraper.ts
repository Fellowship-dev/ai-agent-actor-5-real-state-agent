import { Log, ApifyClient } from 'apify';
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

  description = 'Scrapes a URL aiming the search based on a method (for example: getAllItems) and returns a stringified JSON with the results using the specified output format (for example: {"results":[""]}).';

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
    const callOptions = {
      timeout: 60,
    };
    this.log.debug(
      `Calling WebsiteScraper with input: ${JSON.stringify(actorInput)}`
    );
    const actorRun = await this.apifyClient
      .actor('zeeb0t/web-scraping-api---scrape-any-website')
      .call(actorInput, callOptions);
    const dataset = await this.apifyClient
      .dataset(actorRun.defaultDatasetId)
      .listItems();
    const { items } = dataset;
    this.log.debug(`WebsiteScraper response: ${JSON.stringify(items)}`);
    await chargeForToolUsage(this.name, 1);
    return JSON.stringify(items);
  }
}

export default WebsiteScraper;
