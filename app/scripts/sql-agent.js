require('dotenv').config({ path: __dirname + '/../../.env' })
const { ChatOpenAI } = require('@langchain/openai')
const { ChatOllama } = require('@langchain/community/chat_models/ollama')
const { createSqlQueryChain } = require('langchain/chains/sql_db')
const { SqlDatabase } = require('langchain/sql_db')
const { QuerySqlTool } = require('langchain/tools/sql')
const { BaseMessage, HumanMessage, AIMessage, mapStoredMessageToChatMessage, isBaseMessage } = require('@langchain/core/messages')
const { PromptTemplate, ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts')
const { BufferMemory, ChatMessageHistory, ConversationSummaryBufferMemory } = require('langchain/memory')
const { StringOutputParser } = require('@langchain/core/output_parsers')
const { RunnablePassthrough, RunnableSequence, RunnableLambda, RunnableWithMessageHistory } = require('@langchain/core/runnables')
const { DataSource } = require('typeorm')
const { model } = require('../llm/ai')
const dbConfig = require('../config/db')

// Ref: https://github.com/langchain-ai/langchain/blob/master/templates/sql-ollama/sql_ollama/chain.py

process.env.LANGCHAIN_TRACING_V2 = false //true
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
  const dbSchema = await getSchema()

  const template1 = `Based on the table schema below, write a SQL query that would answer the user's question:
  {schema}

  Question: {question}
  SQL Query:`

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'Given an input question, convert it to a SQL query. No pre-amble.'],
    new MessagesPlaceholder('chat_history'),
    ['human', template1]
  ])






/*
  const json1 = [
    {
      type: "human",
      data: { content: "hi my name is Mario", additional_kwargs: {} },
    },
    {
      type: "ai",
      data: {
        content: "Hello, Mario! How can I assist you today?",
        additional_kwargs: {},
      },
    },
  ]
  const messages = json1.map((x) => mapStoredMessageToChatMessage(x));
  const ok = messages.every((x) => isBaseMessage(x));
  console.log("ok", ok); // prints true
  const memory1 = new BufferMemory({
    chatHistory: new ChatMessageHistory(messages),
    memoryKey: "chat_history",
  });
*/








  // Chain to query with memory
  let memory = new BufferMemory({
    chatHistory: new ChatMessageHistory(),
    //chatHistory: new ChatMessageHistory(messages),
    returnMessages: true,
    memoryKey: 'chat_history'
  })

  const sqlChain = RunnableSequence.from([
    RunnablePassthrough.assign({
      schema: getSchema,
      chat_history: async (x) => {
        console.log('memory', memory)
        //console.log('x', x)
        return await memory.loadMemoryVariables(x)['chat_history']
      }
      /*chat_history: new RunnableLambda({
        func: async (x) => {console.log(x, await memory.loadMemoryVariables(x))
          const history = await memory.loadMemoryVariables(x)['chat_history']
          return history
        }
      })*/
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
    llm
  ])
let history=[]
  console.log(
    await chain.invoke({
      question: 'How many projects were there between 2006 and 2010',/* chat_history: [], history: []*/
      chat_history: history ? history.map(msg => new HumanMessage(msg)) : [],
    })
  )

  await datasource.destroy()
}

run()