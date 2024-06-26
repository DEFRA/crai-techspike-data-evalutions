require('dotenv').config({ path: __dirname + '/../../.env' });
const { SqlDatabase } = require('langchain/sql_db');
const { BaseMessage } = require('@langchain/core/messages');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const { BufferMemory, ChatMessageHistory } = require('langchain/memory');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnablePassthrough, RunnableSequence } = require('@langchain/core/runnables');
const { CallbackHandler } = require('langfuse-langchain');
const { DataSource } = require('typeorm');
const { model } = require('../llm/ai');
const dbConfig = require('../config/db');


// Ref: https://github.com/langchain-ai/langchain/blob/master/templates/sql-ollama/sql_ollama/chain.py
//      https://js.langchain.com/v0.1/docs/use_cases/sql/quickstart/

//process.env.LANGCHAIN_TRACING_V2 = true
//process.env.LANGCHAIN_API_KEY = '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'

const dbConnection = {
  type: dbConfig.postgresConnectionOptions.type,
  host: 'localhost', //dbConfig.postgresConnectionOptions.host,
  port: dbConfig.postgresConnectionOptions.port,
  username: dbConfig.postgresConnectionOptions.user,
  password: dbConfig.postgresConnectionOptions.password,
  database: dbConfig.postgresConnectionOptions.database
}


const run = async () => {
  const datasource = new DataSource(dbConnection)
  const db = await SqlDatabase.fromDataSourceParams({
    appDataSource: datasource,
    ignoreTables: [dbConfig.tableName]
  })

  const getSchema = async () => db.getTableInfo()
  const llm = model()

  const template1 = `Based on the table schema below, write a SQL query that would answer the user's question:
  {schema}

  Question: {question}
  SQL Query:`

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'Given an input question, convert it to a SQL query. No pre-amble.'],
    new MessagesPlaceholder('chat_history'),
    ['human', template1]
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
    llm.bind(stop=["\nSQLResult:"]),
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
  const template2 = `Based on the table schema below, question, sql query, and sql response, write a natural language response:
  {schema}

  Question: {question}
  SQL Query: {query}
  SQL Response: {response}`

  const promptResponse = ChatPromptTemplate.fromMessages([
    ['system', 'Given an input question and SQL response, convert it to a natural language answer. No pre-amble.'],
    ['human', template2],
  ])

  const chain = RunnableSequence.from([
    RunnablePassthrough.assign({
      query: sqlResponseMemory
    }),
    RunnablePassthrough.assign({
      schema: getSchema,
      response: (x) => db.run(x['query'])
    }),
    promptResponse,
    llm,
    new StringOutputParser()
  ])

  const langfuseHandler = new CallbackHandler()

  const result = await chain.invoke({
    question: 'How many projects were there between 2006 and 2010',
    chat_history: []
  },
  {
    callbacks: [langfuseHandler]
  })
  console.log(result)

  await datasource.destroy()
}

run()
