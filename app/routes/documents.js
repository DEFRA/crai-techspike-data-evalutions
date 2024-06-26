const fs = require("fs")
const { getVectorStore } = require('../services/vector-store')
const { loadFile } = require('../services/document-loader')
const { loadDb, loadJson } = require('../services/db-loader')
const { useModel, ollamaModel } = require('../llm/ai')

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

        const directoryPath = `${__dirname}/../data/injest/`
        const dir = fs.opendirSync(directoryPath)

        for await (const entry of dir) {
          response += `Found file: ${entry.name}\r\n`

          const docs = await loadFile(`${directoryPath}${entry.name}`)
          await vectorStore.addDocuments(docs)
        }
        if (useModel === 'ollama') {
          await vectorStore.save(`${__dirname}/../data/HNSWLib_${ollamaModel}/`)
        }
      }
      catch (error) {
        console.log(error)
      }

      return { response: response }
    }
  }
},
{
  method: 'GET',
  path: '/documents/ingestdb',
  options: {
    handler: async (request, h) => {
      let response = ''

      const modelName = useModel === 'ollama' ? ollamaModel : 'oai'
      const tableName = 'sciencesearch'
      const contentColumn = 'Description'
      const metadataColumns = ['id', 'title', 'summary', 'href', 'Contractor / Funded Organisations', 'Keywords',
            'Field of Study', 'Date From', 'Date To', 'Cost', 'Objective', 'Project Documents']
      const batchSize = 100

      try {
        const vectorStore = await getVectorStore()

        const docs = await loadDb(
          tableName,
          contentColumn,
          metadataColumns
        )

        let count = 0
        for await (const doc of docs) {
          count += 1

          await vectorStore.addDocuments([doc])

          if (/*useModel === 'ollama' &&*/ count % batchSize === 0) {
            await vectorStore.save(`${__dirname}/../data/HNSWLib_${modelName}/`)
            console.log(`Saving ${count} / ${docs.length}`)
          }
        }

        //if (useModel === 'ollama') {
          await vectorStore.save(`${__dirname}/../data/HNSWLib_${modelName}/`)
        //}

        response = `${docs.length} documents processed.`
      }
      catch (error) {
        console.log(error)
      }

      return { response: response }
    }
  }
},
{
  method: 'GET',
  path: '/documents/ingestjson',
  options: {
    handler: async (request, h) => {
      let response = ''

      const modelName = useModel === 'ollama' ? ollamaModel : 'oai'
      const contentColumn = 'Description'
      const metadataColumns = ['id', 'title', 'summary', 'href', 'Contractor / Funded Organisations', 'Keywords',
            'Field of Study', 'Date From', 'Date To', 'Cost', 'Objective', 'Project Documents']
      const batchSize = 100

      try {
        const vectorStore = await getVectorStore()
        await vectorStore.addDocuments([doc])

        const directoryPath = `${__dirname}/../data/`
        const fileName = 'pages1.json'

        const docs = await loadJson(
          `${directoryPath}${fileName}`,
          contentColumn,
          metadataColumns
        )

        let count = 0
        for await (const doc of docs) {
          count += 1

          await vectorStore.addDocuments([doc])

          if (useModel === 'ollama' && count % batchSize === 0) {
            await vectorStore.save(`${__dirname}/../data/HNSWLib_${modelName}/`)
            console.log(`Saving ${count} / ${docs.length}`)
          }
        }

        if (useModel === 'ollama') {
          await vectorStore.save(`${__dirname}/../data/HNSWLib_${modelName}/`)
        }

        response = `${docs.length} documents processed.`
      }
      catch (error) {
        console.log(error)
      }

      return { response: response }
    }
  }
}]
