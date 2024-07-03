const { PGVectorStore } = require('@langchain/community/vectorstores/pgvector')
const { HNSWLib } = require('@langchain/community/vectorstores/hnswlib')
const { useModel, ollamaModel, embeddings, vectorSpace, saveDir } = require('../llm/ai')
const dbConfig = require('../config/db')

let vectorStore

/*
HNSWLib available spaces are:
- cosine: cosine similarity
- ip: inner product
- l2: squared L2
ref: https://github.com/nmslib/hnswlib
*/

const getVectorStore = async (mode, userModel = useModel) => {
  const modelName = userModel === 'ollama' ? ollamaModel : 'oai'
  const model = userModel === 'ollama' ? userModel : ''

  //if (userModel === 'ollama') {
    if (mode === 'load') {
      vectorStore = await HNSWLib.load(
        `${__dirname}/../data/${saveDir}/HNSWLib_${modelName}/`,
        embeddings(model)
      )
    } else {
      vectorStore = new HNSWLib(
        embeddings(model),
        {
          space: vectorSpace
        }
      )
    }

    return vectorStore
  //}

  vectorStore = await PGVectorStore.initialize(
    embeddings(userModel),
    dbConfig
  )

  return vectorStore
}

const ingestDocuments = async (docs) => {
  const vectorStore = await getVectorStore()
  await vectorStore.addDocuments(docs)
}

module.exports = {
  getVectorStore,
  ingestDocuments
}
