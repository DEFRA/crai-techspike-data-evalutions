require('dotenv').config()

const aiConfig = {
  azureOpenAIApiInstanceName: process.env.OAI_INSTANCE_NAME,
  azureOpenAIApiKey: process.env.OAI_API_KEY,
  azureOpenAIApiVersion: process.env.OAI_API_VERSION
}

module.exports = aiConfig
