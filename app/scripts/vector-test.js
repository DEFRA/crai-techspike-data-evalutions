require('dotenv')//.config({ path: __dirname + '/../../.env' });
process.env.USE_MODEL = 'ollama';
process.env.VECTOR_SPACE = 'cosine'; // cosine | l2 | ip
process.env.TEXT_SPLITTER_CHUNK_SIZE = 300; // 1000 | 500 | 300
process.env.TEXT_SPLITTER_CHUNK_OVERLAP = 70; // 200 | 100 | 70
process.env.OLLAMA_MODEL = 'mistral'; //'llama3' // mistral, phi3:medium, gemma, aya
const { getVectorStore } = require('../services/vector-store');
const { useModel, ollamaModel, saveDir } = require('../llm/ai');

(async () => {
  const modelName = useModel === 'ollama' ? ollamaModel : 'oai'

  console.log('modelName:', modelName)
  console.log('saveDir:', saveDir)

  let testStr = 'who established the Inshore Fisheries and Conservation Authorities'
  const vectorStore = await getVectorStore('load', useModel)

  const result = await vectorStore.similaritySearchWithScore(testStr, 1)
  console.log(result)
})()
