import { tool } from '@langchain/core/tools';
import { z } from "zod";

const magicTool = tool(
  async ({ input }: { input: number }) => {
    return `${input + 2}`;
  },
  {
    name: "magic_function",
    description: "Applies a magic function to an input.",
    schema: z.object({
      input: z.number(),
    }),
  }
)

export default magicTool;
