const { RunnablePassthrough, RunnableMap, RunnableLambda, RunnableSequence } = require('@langchain/core/runnables')
const { StringOutputParser } = require('@langchain/core/output_parsers')
const { ChatPromptTemplate } = require('@langchain/core/prompts')
const { CallbackHandler } = require('langfuse-langchain')
const { formatDocumentsAsString } = require('langchain/util/document')
const { getVectorStore } = require('../services/vector-store')
const { useModel } = require('../llm/ai')

const getRetriever = async (userModel) => {
  const vectorStore = await getVectorStore('load', userModel)
console.log(JSON.stringify(vectorStore))
  return vectorStore.asRetriever()
}

const buildGenerateChain = async (llm, prompt, userModel) => {
  const retriever = await getRetriever(userModel)

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

const generateResponse = async (llm, prompt, document, userModel = useModel) => {
  const chain = await buildGenerateChain(llm, prompt, userModel)

  const langfuseHandler = new CallbackHandler()

  const generate = await chain.invoke({
    document
  //},
  //{
  //  callbacks: [langfuseHandler]
  })

  return generate
}

module.exports = {
  buildGenerateChain,
  generateResponse
}
