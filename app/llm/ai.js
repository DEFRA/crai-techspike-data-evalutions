const { ChatOpenAI, OpenAIEmbeddings } = require('@langchain/openai')
const { ChatOllama } = require('@langchain/community/chat_models/ollama')
const { OllamaEmbeddings } = require('@langchain/community/embeddings/ollama')
const isDocker = require('is-docker')
const aiConfig = require('../config/ai')
require('dotenv').config()

const useModel = process.env.USE_MODEL
const ollamaModel = process.env.OLLAMA_MODEL
const ollamaModels = ['llama3', 'mistral', 'phi3:medium', 'gemma', 'aya']
const ollamaUrl = isDocker() ? 'host.docker.internal' : 'localhost'
const vectorSpace = process.env.VECTOR_SPACE || 'cosine'
const saveDir = `${vectorSpace}-${process.env.TEXT_SPLITTER_CHUNK_SIZE || '1000'}-${process.env.TEXT_SPLITTER_CHUNK_OVERLAP || '200'}`
/*
$ ollama pull llama3
$ ollama run llama3
*/


const onFailedAttempt = async (error) => {
  if (error.retriesLeft === 0) {
    throw new Error(`Failed to get embeddings: ${error}`)
  }
}

const embeddings = (userModel = useModel) => {
  if (userModel === 'ollama') {
    return new OllamaEmbeddings({
      baseUrl: `http://${ollamaUrl}:11434`,
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

const model = (userModel = useModel, temperature = 0.9) => {
  if (userModel === 'ollama') {
    return new ChatOllama({
      baseUrl: `http://${ollamaUrl}:11434`,
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
  model,
  vectorSpace,
  saveDir
}
