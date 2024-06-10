/*
const { OpenAI, ChatOpenAI } = require('@langchain/openai')
//const { ChatMistralAI } = require('@langchain/mistralai')
const { SqlDatabase } = require('langchain/sql_db')
const { DataSource } = require('typeorm')
const { createSqlAgent, SqlToolkit } = require('langchain/agents/toolkits/sql')
const { model } = require('./app/llm/ai')
const { Pool } = require('pg')
*/


require('dotenv').config({ path: __dirname + '/../../.env' })
const { ChatOpenAI } = require('@langchain/openai')
const { createSqlQueryChain } = require('langchain/chains/sql_db')
const { SqlDatabase } = require('langchain/sql_db')
const { DataSource } = require('typeorm')
const { QuerySqlTool } = require('langchain/tools/sql')
const { PromptTemplate } = require('@langchain/core/prompts')
const { StringOutputParser } = require('@langchain/core/output_parsers')
const { RunnablePassthrough, RunnableSequence, RunnableLambda } = require('@langchain/core/runnables')
const { model } = require('../llm/ai')
const dbConfig = require('../config/db')



const { BufferMemory } = require('langchain/memory')
const { ChatOllama } = require('@langchain/community/chat_models/ollama')
//const { SqlDatabase } = require('langchain/sql_db')
//const { StringOutputParser } = require('@langchain/core/output_parsers')
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts')
//const { RunnablePassthrough, RunnableSequence } = require('@langchain/core/runnables')

/*
from langchain.memory import ConversationBufferMemory
from langchain_community.chat_models import ChatOllama
from langchain_community.utilities import SQLDatabase
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.pydantic_v1 import BaseModel
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
*/


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
    //new MessagesPlaceholder('history'),
    ['human', template1]
  ])

  // Chain to query with memory
  let memory = new BufferMemory({ returnMessages: true, memoryKey: 'history' })
  /*new ConversationSummaryBufferMemory({
    llm,
    returnMessages: true
  })*/

  const sqlChain = RunnableSequence.from([
    RunnablePassthrough.assign({
      schema: getSchema,
      history: (x) => memory.loadMemoryVariables(x)['history']
      /*history: new RunnableLambda({
        func: async (x) => {
          const history = await memory.loadMemoryVariables(x)['history']
          return history
        }
      })*/
    }),
    prompt,
    llm.bind(stop=["\nSQLResult:"]),
    new StringOutputParser()
  ])

  const save = (io) => {
    const output = { output: io.output }
    memory.saveContext(io, output)
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



  // Supply the input types to the prompt
  //class InputType(BaseModel):
  //    question: str


  const chain = RunnableSequence.from([
    RunnablePassthrough.assign({
      query: sqlResponseMemory
    //}).withTypes({
    //    inputType: String
    }),
    RunnablePassthrough.assign({
      schema: getSchema,
      response: (x) => db.run(x['query'])
    }),
    promptResponse,
    llm
  ])


  console.log(await chain.invoke({ question: 'How many projects were there between 2006 and 2010', history: [] }))
/*
  let sqlChain123 = (
    RunnablePassthrough.assign({
      schema: schema,
      history: new RunnableLambda({
        func: async (x) => {
          const history = await memory.load_memory_variables(x)['history']
          return history
        }
      })
    }),
    prompt,
    llm.bind(stop=["\nSQLResult:"]),
    StrOutputParser()
  )
*/









  /*
  const executeQuery = new QuerySqlTool(db)
  const writeQuery = await createSqlQueryChain({
    llm,
    db,
    dialect: 'postgres'
  })

  const answerPrompt =
    PromptTemplate.fromTemplate(`Given the following user question, corresponding SQL query, and SQL result, answer the user question.

  Question: {question}
  SQL Query: {query}
  SQL Result: {result}
  Answer: `)

  const answerChain = answerPrompt.pipe(llm).pipe(new StringOutputParser())

  const chain = RunnableSequence.from([
    RunnablePassthrough.assign({ query: writeQuery }).assign({
      result: x => executeQuery.invoke(x.query)
    }),
    answerChain
  ])
  console.log(await chain.invoke({ question: 'How many projects were there between 2006 and 2010' }))
*/
  await datasource.destroy()
}






const run1 = async () => {
  // // Set up and connect to PostgreSQL database
  // const pool = new Pool({
  //   user: 'your_username',
  //   host: 'your_host',
  //   database: 'your_database',
  //   password: 'your_password',
  //   port: 5432, // default PostgreSQL port
  // });

  // const client = await pool.connect();

  // // Use the connected client for database operations
  // // Example: const result = await client.query('SELECT * FROM your_table');

  // // Release the client after use
  // client.release();

  const datasource = new DataSource(dbConnection)

  const db = await SqlDatabase.fromDataSourceParams({
    appDataSource: datasource,
  })

  const llm = model()
  const toolkit = new SqlToolkit(db, llm)
  const executor = createSqlAgent(llm, toolkit)

  const input = `List the total sales per country. Which country's customers spent the most?`

  console.log(`Executing with input '${input}'...`)

  const result = await executor.invoke({ input })

  console.log(`Got output ${result.output}`)

  console.log(
    `Got intermediate steps ${JSON.stringify(
      result.intermediateSteps,
      null,
      2
    )}`
  )

  await datasource.destroy()
}

run()