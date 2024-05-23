const fs = require("fs")
const { getVectorStore, ingestDocuments } = require('../services/vector-store')
const { loadFile, loadFilesFromFolder } = require('../services/document-loader')
const { model, embeddings } = require('../llm/ai')
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
      let response = 'Finished....\r\n\r\n'

      try {
        /**/const llm = model()
        const prompt = prompts[types.GENERATE_PROMPT]
        response = await generateResponse(llm, prompt, 'What is NEIRF?')/**/

        /**const directoryPath = `${__dirname}/../data/NEIRF/`
        const dir = fs.opendirSync(directoryPath)
        for await (const entry of dir) {
          response += `Found file: ${entry.name}\r\n`

          const docs = await loadFile(`${directoryPath}${entry.name}`)
          console.log(docs)  
          await ingestDocuments(docs)
        }/**/
      }
      catch(error) {
        console.log(error)
      }

      return { response }
    }
  }
}]
