const { PGVectorStore } = require('@langchain/community/vectorstores/pgvector')
const { HNSWLib } = require('@langchain/community/vectorstores/hnswlib')
const { useModel, ollamaModel, embeddings } = require('../llm/ai')
const dbConfig = require('../config/db')

let vectorStore

const getVectorStore = async (mode, userModel = useModel) => {
  if (userModel === 'ollama') {
    if (mode === 'load') {
      vectorStore = await HNSWLib.load(
        `${__dirname}/../data/HNSWLib_${ollamaModel}/`,
        embeddings(userModel)
      )
    } else {
      vectorStore = new HNSWLib(
        embeddings(userModel),
        {
          space: 'cosine'
        }
      )
    }

    return vectorStore
  }

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
