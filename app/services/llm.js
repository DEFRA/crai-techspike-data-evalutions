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

const invokeModel = async (temperature = 0.9) => {
  try {
    const llm = new ChatOpenAI({
      ...aiConfig,
      azureOpenAIApiDeploymentName: "gpt-53-turbo",
      onFailedAttempt,
      temperature: temperature
    })
    
    const response = await llm.invoke()
    return response
  } catch(error) {
    console.log('error', error)
  }
}

module.exports = {
  embeddings,
  invokeModel
}
