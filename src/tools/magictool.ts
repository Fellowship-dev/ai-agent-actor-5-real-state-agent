import { Log } from 'apify';
import { Tool } from '@langchain/core/tools';

/**
 * Interface for parameters required by MagicTool class.
 */
export interface MagicToolParams {
  apiKey?: string;
  log: Log | Console;
}

/**
 * Tool that uses the MagicTool function. This is an example function to use as template.
 */
export class MagicTool extends Tool {
  static override lc_name() {
    return 'MagicTool';
  }

  protected log: Log | Console;
  protected apiKey: string;

  name = 'magic_function';

  description = 'Applies a magic function to an input.';

  constructor(fields?: MagicToolParams) {
    super(...arguments);
    const log = fields?.log ?? console;
    const apiKey = fields?.apiKey ?? process.env.SECRET_API_KEY ?? '';
    if (apiKey === undefined) {
      log.debug(
        "Secret API key not set. You can set it as 'SECRET_API_KEY' in your environment variables."
      );
    }
    this.apiKey = apiKey;
    this.log = log;
  }

  async _call(rawInput: string) {
    this.log.debug(`rawInput: ${rawInput}`);
    const number = parseInt(rawInput, 10);
    return `${number + 2}`;
  }
}

export default MagicTool;
