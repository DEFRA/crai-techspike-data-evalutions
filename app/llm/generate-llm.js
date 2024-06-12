const { RunnablePassthrough, RunnableMap, RunnableLambda, RunnableSequence } = require('@langchain/core/runnables')
const { StringOutputParser } = require('@langchain/core/output_parsers')
const { ChatPromptTemplate } = require('@langchain/core/prompts')
const { formatDocumentsAsString } = require('langchain/util/document')
const { getVectorStore } = require('../services/vector-store')

const getRetriever = async () => {
  const vectorStore = await getVectorStore('load')

  return vectorStore.asRetriever()
}

const buildGenerateChain = async (llm, prompt) => {
  const retriever = await getRetriever()

  let retrieveChain = new RunnableMap({
    steps: {
      context: new RunnableLambda({
        func: async (input) => {
          const documents = await retriever.invoke(input.document)

          return documents
        }
      }),
      document: (input) => input.document
    }
  })

  const chain = RunnableSequence.from([
    RunnablePassthrough.assign({
      context: (input) => formatDocumentsAsString(input.context)
    }),
    ChatPromptTemplate.fromTemplate(prompt),
    llm,
    new StringOutputParser()
  ])

  retrieveChain = retrieveChain.assign({ response: chain })

  return retrieveChain
}

const generateResponse = async (llm, prompt, document) => {
  const chain = await buildGenerateChain(llm, prompt)

  const generate = await chain.invoke({
    document
  })

  return generate
}

module.exports = {
  buildGenerateChain,
  generateResponse
}
