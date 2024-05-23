const { ingestDocuments } = require('../services/vector-store')
const { loadFile } = require('../services/document-loader')
const { invokeModel } = require('../services/llm')
// const { loadFilesFromFolder } = require('../services/document-loader')

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
      await invokeModel()
      
      const docs = await loadFile('./data/NEIRF/15458_NEIRF_YR1_REPORT_FINAL.PDF')
      
      console.log(docs)
      
      //const docs = loadFilesFromFolder('./data/NEIRF')
    
      await ingestDocuments(docs)
      
      return { status: '200 ok' }
    }
  }
}]
