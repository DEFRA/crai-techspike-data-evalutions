const fs = require("fs")
const { getVectorStore, ingestDocuments } = require('../services/vector-store')
const { loadFile, loadFilesFromFolder } = require('../services/document-loader')
const { model, embeddings } = require('../llm/ai')
const { generateResponse } = require('../llm/generate')
const { prompts, types } = require('../llm/prompts')

module.exports = [{
  method: 'GET',
  path: '/query',
  options: {
    handler: async (request, h) => {
      const { q } = request.query
      let response = ''

      try {
        const llm = model()
        const prompt = prompts[types.GENERATE_PROMPT]
        response = await generateResponse(llm, prompt, q)
      }
      catch(error) {
        console.log(error)
      }

      return { response: response?.response }
    }
  }
}]
