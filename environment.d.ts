declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APIFY_TOKEN: string;
      LANGSMITH_TRACING: string;
      LANGSMITH_ENDPOINT: string;
      LANGSMITH_API_KEY: string;
      LANGSMITH_PROJECT: string;
      OPENAI_API_KEY: string;
      ZIP_API_KEY: string;
      NODE_ENV: 'development' | 'production';
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}