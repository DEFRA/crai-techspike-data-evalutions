require('dotenv').config({ path: __dirname + '/../../.env' });
const { getVectorStore } = require('../services/vector-store');
const { model, useModel, ollamaModel } = require('../llm/ai');

(async () => {
  const modelName = useModel === `ollama (${ollamaModel})` ? useModel : 'oai'
  console.log('modelName:', modelName)
  let testStr = 'who established the Inshore Fisheries and Conservation Authorities'
  const vectorStore = await getVectorStore('load', useModel)

  /*
  const result = await vectorStore.similaritySearch(testStr, 3)
  const result = await vectorStore.similaritySearchWithScore(testStr, 3)
  */

  const result = await vectorStore.similaritySearchWithScore(testStr, 1)
  console.log(result)
})()

