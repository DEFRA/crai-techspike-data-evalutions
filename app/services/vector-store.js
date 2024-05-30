const { PGVectorStore } = require('@langchain/community/vectorstores/pgvector')
const { QdrantVectorStore } = require('@langchain/community/vectorstores/qdrant')
const { HNSWLib } = require('@langchain/community/vectorstores/hnswlib')
const { useModel, ollamaModel, embeddings } = require('../llm/ai')
const dbConfig = require('../config/db')

let vectorStore

const getVectorStore = async (mode) => {
  if (useModel === 'ollama') {
    if (mode === 'load') {
      vectorStore = await HNSWLib.load(`${__dirname}/../data/HNSWLib_${ollamaModel}/`, embeddings())
    } else {
      vectorStore = new HNSWLib(
        embeddings(),
        {
          space: 'cosine'
        }
      )
    }
  }

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
