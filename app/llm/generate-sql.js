const { SqlDatabase } = require('langchain/sql_db')
const { BaseMessage } = require('@langchain/core/messages')
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts')
const { BufferMemory, ChatMessageHistory } = require('langchain/memory')
const { StringOutputParser } = require('@langchain/core/output_parsers')
const { RunnablePassthrough, RunnableSequence } = require('@langchain/core/runnables')
const { CallbackHandler } = require('langfuse-langchain')
const { DataSource } = require('typeorm')
const { prompts, types } = require('./prompts')
const dbConfig = require('../config/db')

const generateResponse = async (llm, document) => {
  const datasource = new DataSource({
    type: dbConfig.postgresConnectionOptions.type,
    host: dbConfig.postgresConnectionOptions.host,
    port: dbConfig.postgresConnectionOptions.port,
    username: dbConfig.postgresConnectionOptions.user,
    password: dbConfig.postgresConnectionOptions.password,
    database: dbConfig.postgresConnectionOptions.database
  })
  const db = await SqlDatabase.fromDataSourceParams({
    appDataSource: datasource,
    ignoreTables: [dbConfig.tableName]
  })

  const getSchema = async () => db.getTableInfo()
  let sql

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'Given an input question, convert it to a SQL query. No pre-amble.'],
    new MessagesPlaceholder('chat_history'),
    ['human', prompts[types.GENERATE_PROMPT_SQL1]]
  ])

  // Chain to query with memory
  let memory = new BufferMemory({
    chatHistory: new ChatMessageHistory(),
    returnMessages: true,
    memoryKey: 'chat_history'
  })

  const sqlChain = RunnableSequence.from([
    RunnablePassthrough.assign({
      schema: getSchema,
      chat_history: async (x) => {
        const mem = await memory.loadMemoryVariables(x)
        return mem['chat_history'].map((x) => new BaseMessage(x))
      }
    }),
    prompt,
    llm.bind(stop=['\nSQLResult:']),
    new StringOutputParser()
  ])

  const save = (result) => {
    const input = { input: result.question }
    const output = { output: result.output }
    memory.saveContext(input, output)
    return output.output
  }

  const sqlResponseMemory = RunnableSequence.from([
    RunnablePassthrough.assign({
      output: sqlChain
    }),
    save
  ])

  // Chain to answer
  const promptResponse = ChatPromptTemplate.fromMessages([
    ['system', 'Given an input question and SQL response, convert it to a natural language answer. No pre-amble.'],
    ['human', prompts[types.GENERATE_PROMPT_SQL2]],
  ])

  const chain = RunnableSequence.from([
    RunnablePassthrough.assign({
      query: sqlResponseMemory
    }),
    RunnablePassthrough.assign({
      schema: getSchema,
      response: (x) => {
        sql = x['query']
        return db.run(sql)
      }
    }),
    promptResponse,
    llm,
    new StringOutputParser()
  ])

  const langfuseHandler = new CallbackHandler()

  const generate = await chain.invoke({
    question: document,
    chat_history: []
  },
  {
    callbacks: [langfuseHandler]
  })

  await datasource.destroy()

  return {
    response: generate,
    sql: sql
  }
}

module.exports = {
  generateResponse
}
