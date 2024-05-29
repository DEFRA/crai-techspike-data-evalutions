const { ChatOpenAI, OpenAIEmbeddings } = require('@langchain/openai')
const { ChatOllama } = require('@langchain/community/chat_models/ollama')
const { OllamaEmbeddings } = require('@langchain/community/embeddings/ollama')

const aiConfig = require('../config/ai')
require('dotenv').config()

const useModel = process.env.USE_MODEL
const ollamaModel = process.env.OLLAMA_MODEL
/*
$ ollama pull llama3
$ ollama run llama3
*/


const onFailedAttempt = async (error) => {
  if (error.retriesLeft === 0) {
    throw new Error(`Failed to get embeddings: ${error}`)
  }
}

const embeddings = () => {
  if (useModel === 'ollama') {
    return new OllamaEmbeddings({
      baseUrl: 'http://host.docker.internal:11434',
      model: ollamaModel,
      requestOptions: {
        useMMap: true,
        numThread: 6,
        numGpu: 1
      }
    })
  }

  return new OpenAIEmbeddings({
    ...aiConfig,
    azureOpenAIApiDeploymentName: 'ada-002'
  })
}

const model = (temperature = 0.9) => {
  if (useModel === 'ollama') {
    return new ChatOllama({
      baseUrl: 'http://host.docker.internal:11434',
      model: ollamaModel
    })
  }

  return new ChatOpenAI({
    ...aiConfig,
    azureOpenAIApiDeploymentName: 'gpt-53-turbo',
    onFailedAttempt,
    temperature: temperature
  })
}

module.exports = {
  useModel,
  ollamaModel,
  embeddings,
  model
}
