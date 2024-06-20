const { loadEvaluator } = require('langchain/evaluation')
const { model } = require('../llm/ai')
const { generateResponse: generateLLMResponse } = require('../llm/generate-llm')
const { generateResponse: generateSQLResponse } = require('../llm/generate-sql')
const { prompts, types } = require('../llm/prompts')
const { useModel } = require('../llm/ai')

module.exports = [{
  method: 'POST',
  path: '/query',
  options: {
    handler: async (request, h) => {
      let query = request.payload.q
      let prompt = request.payload.prompt
      let queryType = request.payload.querytype
      let referenceSQL = request.payload.referencesql
      let referenceOai = request.payload.referenceoai

      let response1 = ''
      let response2 = ''
      let context = []
      let evaluation = ''

      if (queryType === 'sql') {
        try {
          const llm = model(useModel, 0.95)
          response1 = await generateSQLResponse(llm, query)

          if (response1.response) {
            context = [{ source: response1.sql }]
            response1 = response1.response
          }
        }
        catch (error) {
          console.log(error)
        }
      } else if (queryType === 'compare-sql-llm') {
        try {
        }
        catch (error) {
          console.log(error)
        }
      } else if (queryType === 'compare-oai-llm') {
        try {
          const llm = model('')
          if (!(prompt && prompt in types)) {
            prompt = process.env.PROMPT
          }
          response1 = await generateLLMResponse(llm, prompts[types[prompt]], query, '')
        }
        catch (error) {
          console.log(error)
        }

        if (response1.response) {
          response1 = response1.response
        }

        try {
          const llm = model(useModel)
          if (!(prompt && prompt in types)) {
            prompt = process.env.PROMPT
          }
          response2 = await generateLLMResponse(llm, prompts[types[prompt]], query, useModel)
        }
        catch (error) {
          console.log(error)
        }

        if (response2.response) {
          response2 = response2.response
        }

        /*if (referenceOai && referenceOai !== '') {
          const chain = await loadEvaluator('labeled_pairwise_string', {
            criteria: 'correctness'
          })

          const res = await chain.evaluateStringPairs({
            prediction: response1,
            predictionB: response2,
            input: query,
            reference: referenceOai
          })

          console.log(res)
        }*/
      } else {console.log(useModel)
        try {
          const llm = model(useModel)
          if (!(prompt && prompt in types)) {
            prompt = process.env.PROMPT
          }
          response1 = await generateLLMResponse(llm, prompts[types[prompt]], query, useModel)
        }
        catch (error) {
          console.log(error)
        }
/*
        if (response1 && response1.context) {
          for (item of response1.context) {
            let itemContext = {}
            itemContext.pageContent = item.pageContent

            if (item.metadata.source && item.metadata.source.indexOf('/') > -1) {
              itemContext.source = item.metadata.source.substr(item.metadata.source.lastIndexOf('/') + 1)
            }
            if (item.metadata.href) {
              itemContext.href = item.metadata.href
            }
            itemContext.pageNumber = item.metadata.loc.pageNumber
            itemContext.lines = { from: item.metadata.loc.lines.from, to: item.metadata.loc.lines.to }
            context.push(itemContext)
          }
        }
*/
        if (response1.response) {
          response1 = response1.response
        }
      }

      const llm = process.env.USE_MODEL === 'ollama' ? process.env.OLLAMA_MODEL : 'OpenAI ChatGPT 3.5 Turbo'

      return h.view('query', { query, response1, response2, referenceSQL, referenceOai, context, evaluation, queryType, llm, localLLM: process.env.OLLAMA_MODEL }).code(200)
    }
  }
}]
