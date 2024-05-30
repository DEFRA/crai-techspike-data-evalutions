const fs = require("fs")
const { getVectorStore, ingestDocuments } = require('../services/vector-store')
const { loadFile, loadFilesFromFolder } = require('../services/document-loader')
const { model, embeddings } = require('../llm/ai')
const { generateResponse } = require('../llm/generate')
const { prompts, types } = require('../llm/prompts')
require('dotenv').config()

module.exports = [{
  method: 'GET',
  path: '/query',
  options: {
    handler: async (request, h) => {
      let { q, prompt } = request.query

      let response = ''

      try {
        const llm = model()
        if (!(prompt && prompt in types)) {
          prompt = process.env.PROMPT
        }
        response = await generateResponse(llm, prompts[types[prompt]], q)
      }
      catch(error) {
        console.log(error)
      }

      return { response: response?.response }
    }
  }
}]
