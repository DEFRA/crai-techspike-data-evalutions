require('dotenv')//.config({ path: __dirname + '/../../.env' });
process.env.USE_MODEL = 'ollama';
process.env.VECTOR_SPACE = 'cosine'; // cosine | l2 | ip
process.env.TEXT_SPLITTER_CHUNK_SIZE = 300; // 1000 | 500 | 300
process.env.TEXT_SPLITTER_CHUNK_OVERLAP = 70; // 200 | 100 | 70
process.env.OLLAMA_MODEL = 'mistral'; //'llama3' // mistral, phi3:medium, gemma, aya
const { getVectorStore } = require('../services/vector-store');
const { loadDb } = require('../services/db-loader');
const { useModel, ollamaModel, saveDir } = require('../llm/ai');

(async () => {
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

      if (count % batchSize === 0) {
        await vectorStore.save(`${__dirname}/../data/${saveDir}/HNSWLib_${modelName}/`)
        console.log(`Saving ${count} / ${docs.length}`)
      }
    }

    await vectorStore.save(`${__dirname}/../data/${saveDir}/HNSWLib_${modelName}/`)

    response = `${docs.length} documents processed.`
  }
  catch (error) {
    response = error.toString()
    console.log(response)
  }

  console.log({ response, useModel: useModel === 'ollama' ? 'ollama' : 'oai', modelName, saveDir, chunkSize: parseInt(process.env.TEXT_SPLITTER_CHUNK_SIZE || 1000, 10), chunkOverlap: parseInt(process.env.TEXT_SPLITTER_CHUNK_OVERLAP || 200, 10) })
})()
