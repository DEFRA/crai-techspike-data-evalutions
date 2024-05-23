const { ingestDocuments } = require('../services/vector-store')
const { loadFile } = require('../services/document-loader')
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
      let response;
      
      try {
        const llm = model()
        const prompt = prompts[types.GENERATE_PROMPT]
        response = await generateResponse(llm, prompt, 'What is NEIRF?')
      
      
        //const response = await run('Translate "Hello World" into German.')
        console.log(response)
      }
      catch(error) {
        console.log(error)
      }
      
      // const docs = await loadFile('./data/NEIRF/15458_NEIRF_YR1_REPORT_FINAL.PDF')
      
      // console.log(docs)
      
      // //const docs = loadFilesFromFolder('./data/NEIRF')
  
      // await ingestDocuments(docs)
      
      return { response }
    }
  }
}]
