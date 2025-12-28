export default {
  api: {
    input: 'http://localhost:8080/v3/api-docs',
    output: {
      mode: 'tags-split',
      target: './src/generated/api/endpoints',
      schemas: './src/generated/api/models',
      client: 'axios',
      override: {
        mutator: {
          path: './src/lib/api.ts',
          name: 'api',
        },
      },
    },
  },

  apiZod: {
    input: 'http://localhost:8080/v3/api-docs',
    output: {
      mode: 'tags-split',
      target: './src/generated/api/schemas',
      client: 'zod',
      fileExtension: '.zod.ts',
    },
  },
};

