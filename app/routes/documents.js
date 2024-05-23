const { model } = require('../llm/ai')
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
      }
      catch(error) {
        console.log(error)
      }
      
      return { response }
    }
  }
}]
