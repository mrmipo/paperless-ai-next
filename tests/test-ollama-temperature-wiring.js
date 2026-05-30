const assert = require('assert');

const configModulePath = require.resolve('../config/config');
const ollamaServiceModulePath = require.resolve('../services/ollamaService');
const axiosModulePath = require.resolve('axios');

const originalEnv = { ...process.env };
const originalAxiosExport = require.cache[axiosModulePath]?.exports;

function restoreEnvironment() {
  process.env = originalEnv;
  delete require.cache[configModulePath];
  delete require.cache[ollamaServiceModulePath];
  delete require.cache[axiosModulePath];

  if (typeof originalAxiosExport !== 'undefined') {
    require.cache[axiosModulePath] = {
      id: axiosModulePath,
      filename: axiosModulePath,
      loaded: true,
      exports: originalAxiosExport
    };
  }
}

function loadOllamaServiceWithAxiosMock(axiosMock) {
  delete require.cache[configModulePath];
  delete require.cache[ollamaServiceModulePath];
  delete require.cache[axiosModulePath];

  require.cache[axiosModulePath] = {
    id: axiosModulePath,
    filename: axiosModulePath,
    loaded: true,
    exports: axiosMock
  };

  return require('../services/ollamaService');
}

async function main() {
  const capturedRequests = [];

  const axiosMock = {
    create() {
      return {
        post: async (_url, requestBody) => {
          capturedRequests.push(requestBody);

          return {
            data: {
              response: {
                tags: [],
                correspondent: null,
                title: '',
                document_date: '',
                document_type: '',
                language: ''
              }
            }
          };
        }
      };
    }
  };

  try {
    process.env.AI_TEMPERATURE_ANALYSIS = '0.2';
    process.env.AI_TEMPERATURE_GENERATION = '1.1';

    const ollamaService = loadOllamaServiceWithAxiosMock(axiosMock);

    await ollamaService._callOllamaAPI('prompt', 'system', 512, { type: 'object' });

    ollamaService._calculatePromptTokenCount = () => 12;
    ollamaService._calculateNumCtx = () => 1024;
    await ollamaService.generateText('hello');

    assert.strictEqual(capturedRequests.length, 2, 'Expected two outgoing Ollama requests');
    assert.strictEqual(
      capturedRequests[0].options.temperature,
      0.2,
      'Expected analysis request temperature to use AI_TEMPERATURE_ANALYSIS'
    );
    assert.strictEqual(
      capturedRequests[1].options.temperature,
      1.1,
      'Expected generation request temperature to use AI_TEMPERATURE_GENERATION'
    );
  } finally {
    restoreEnvironment();
  }
}

main()
  .then(() => {
    console.log('[PASS] Ollama temperature wiring uses configured analysis and generation values');
  })
  .catch((error) => {
    console.error('[FAIL] Ollama temperature wiring test failed:', error.message);
    process.exitCode = 1;
  });
