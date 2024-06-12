const fs = require("fs")
const { model } = require('../llm/ai')
const { generateResponse } = require('../llm/generate-llm')
const { prompts, types } = require('../llm/prompts')
require('dotenv').config()

module.exports = [{
  method: 'POST',
  path: '/query',
  options: {
    handler: async (request, h) => {
      let q = request.payload.q
      let prompt = request.payload.prompt
      let querytype = request.payload.querytype

      let response = ''
      let context = []

      if (querytype === 'sql') {




      } else {
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

        if (response && response.context) {
          for (item of response.context) {
            let itemContext = {}
            itemContext.pageContent = item.pageContent
            itemContext.source = item.metadata.source.substr(item.metadata.source.lastIndexOf('/') + 1)
            itemContext.pageNumber = item.metadata.loc.pageNumber
            itemContext.lines = { from: item.metadata.loc.lines.from, to: item.metadata.loc.lines.to }
            context.push(itemContext)
          }
        }

        if (response.response) {
          response = response.response
        }
      }

      return h.view('query', { query: q, response, context }).code(200)
    }
  }
}]
