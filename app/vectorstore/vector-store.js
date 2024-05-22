const { PGVectorStore } = require('@langchain/community/vectorstores/pgvector')
const { embeddings } = require('../llm/ai')
const dbConfig = require('../config/db')

let vectorStore

const getVectorStore = async () => {
  if (vectorStore) {
    return vectorStore
  }

  vectorStore = await PGVectorStore.initialize(
    embeddings(),
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
