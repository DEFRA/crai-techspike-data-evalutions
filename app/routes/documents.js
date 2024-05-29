const fs = require("fs")
const { getVectorStore, ingestDocuments } = require('../services/vector-store')
const { loadFile, loadFilesFromFolder } = require('../services/document-loader')
const { useModel, ollamaModel, model, embeddings } = require('../llm/ai')
const { generateResponse } = require('../llm/generate')
const { prompts, types } = require('../llm/prompts')

module.exports = [{
  method: 'GET',
  path: '/documents',
  options: {
    handler: async (request, h) => {
      return { status: '200 ok - Documents' }
    }
  }
},
{
  method: 'GET',
  path: '/documents/ingest',
  options: {
    handler: async (request, h) => {
      let response = ''

      try {
        const vectorStore = await getVectorStore()

        const directoryPath = `${__dirname}/../data/NEIRF/`
        const dir = fs.opendirSync(directoryPath)

        for await (const entry of dir) {
          response += `Found file: ${entry.name}\r\n`

          const docs = await loadFile(`${directoryPath}${entry.name}`)
          console.log(docs)
          await vectorStore.addDocuments(docs)
          //await ingestDocuments(docs)
        }
        await vectorStore.save(`${__dirname}/../data/HNSWLib_${ollamaModel}/`)
      }
      catch(error) {
        console.log(error)
      }

      return { response: response }
    }
  }
}]
