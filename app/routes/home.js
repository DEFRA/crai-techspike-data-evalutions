require('dotenv').config()

module.exports = {
  method: 'GET',
  path: '/',
  options: {
    handler: async (request, h) => {
      const llm = process.env.USE_MODEL === 'ollama' ? process.env.OLLAMA_MODEL : 'OpenAI ChatGPT 3.5 Turbo'

      return h.view('home', { llm, localLLM: process.env.OLLAMA_MODEL }).code(200)
    }
  }
}
