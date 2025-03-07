import { Log } from 'apify';
import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Interface for parameters required by ZipCodeSearch class.
 */
export interface ZipCodeSearchParams {
  apiKey?: string;
  log: Log | Console;
}

/**
 * Tool that uses the ZipCodeSearch function
 */
export class ZipCodeSearch extends StructuredTool {
  protected log: Log | Console;
  protected apiKey: string;

  name = 'zip_code_search';

  description = 'Returns a list of Zip Codes for a city and the state it belongs to.';

  schema = z.object({
    city: z.string(),
    state: z.string(),
  });

  constructor(fields?: ZipCodeSearchParams) {
    super(...arguments);
    const log = fields?.log ?? console;
    const apiKey = fields?.apiKey ?? process.env.ZIP_API_KEY ?? '';
    if (apiKey === undefined) {
      log.debug(
        "Secret API key not set. You can set it as 'ZIP_API_KEY' in your environment variables."
      );
    }
    this.apiKey = apiKey;
    this.log = log;
  }

  protected buildUrl = (city: string, state: string): string => {
    const baseUrl = `https://www.zipcodeapi.com/rest/${this.apiKey}/city-zips.json`;
    return `${baseUrl}/${city}/${state}`;
  };

  override async _call(arg: z.output<typeof this.schema>) {
    const serviceUrl = this.buildUrl(arg.city, arg.state);
    this.log.debug(
      `Calling ZipCodeSearch with city='${arg.city}' and state='${arg.state}'`
    );
    const resp = await fetch(serviceUrl);
    const json = await resp.json();
    this.log.debug(`ZipCodeSearch response: ${JSON.stringify(json)}`);
    const zipCodes = (json.zip_codes || []).join(', ');
    return zipCodes;
  }
}

export default ZipCodeSearch;
