const { ChatOpenAI, OpenAIEmbeddings } = require('@langchain/openai')
const aiConfig = require('../config/ai')

const onFailedAttempt = async (error) => {
  if (error.retriesLeft === 0) {
    throw new Error(`Failed to get embeddings: ${error}`)
  }
}

const embeddings = () => {
  return new OpenAIEmbeddings({
    ...aiConfig,
    azureOpenAIApiDeploymentName: "ada-002"
  })
}

const model = (temperature = 0.9) => {
  console.log(aiConfig)
  return new ChatOpenAI({
    ...aiConfig,
    azureOpenAIApiDeploymentName: "gpt-53-turbo",
    onFailedAttempt,
    temperature: temperature
  })
}

module.exports = {
  embeddings,
  model
}
