import { Log, ApifyClient } from 'apify';
import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Interface for parameters required by DatasetExplorer class.
 */
export interface DatasetExplorerParams {
  apifyClient: ApifyClient;
  log: Log | Console;
}

/**
 * Allows the LLM to explore a paginated set. Useful if the dataset is too big.
 */
export class DatasetExplorer extends StructuredTool {
  protected log: Log | Console;
  protected apifyClient: ApifyClient;

  name = 'dataset_explorer';

  description = 'Retrieves paginated data from an Apify dataset. If no "limit" is specified, it returns only 10 results. Increate "offset" to return other results and make sure that "offset" + "limit" does not exceed the "total" of items.';

  schema = z.object({
    datasetId: z.string(),
    fields: z.string().array(),
    offset: z.number() || 0,
    limit: z.number() || 10,
  });

  constructor(fields?: DatasetExplorerParams) {
    super(...arguments);
    this.log = fields?.log ?? console;
    this.apifyClient = fields?.apifyClient ?? new ApifyClient();
  }

  override async _call(arg: z.output<typeof this.schema>) {
    this.log.debug(
      `Calling DatasetExplorer with input: ${JSON.stringify(arg)}`
    );
    const dataset = await this.apifyClient.dataset(arg.datasetId).get();
    if (!dataset) return 'Dataset not found.';
    const datasetItems = await this.apifyClient
      .dataset(arg.datasetId)
      .listItems({
        clean: true,
        fields: arg.fields,
        offset: arg.offset,
        limit: arg.limit,
      });
    this.log.debug(
      `DatasetExplorer response: ${JSON.stringify(datasetItems).slice(0, 100)}...`
    );
    return `The data for dataset ${arg.datasetId} with offset ${arg.offset} and limit ${arg.limit} is as follows: ${JSON.stringify(datasetItems)}`;
  }
}

export default DatasetExplorer;
