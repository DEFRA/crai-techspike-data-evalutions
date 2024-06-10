const { OpenAI, ChatOpenAI } = require("@langchain/openai");
const { ChatMistralAI } = require("@langchain/mistralai");
const { SqlDatabase } = require("langchain/sql_db");
const { DataSource } = require("typeorm");
const { createSqlAgent, SqlToolkit } = require("langchain/agents/toolkits/sql");
const { model } = require('../llm/ai');
require('dotenv').config();

const run = async () => {
  // Create a DataSource for TypeORM
  const dataSource = new DataSource({
    type: "postgres",
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    username: process.env.POSTGRES_USERNAME,
    password: process.env.POSTGRES_PASSWORD,
    database: 'api',
    synchronize: false,  // Set to true if you want TypeORM to automatically sync the schema
  })

  try {
    // Initialize the DataSource
    await dataSource.initialize()
    console.log('Connected to PostgreSQL database')

    // Create an SqlDatabase instance using the DataSource
    const db = new SqlDatabase({ appDataSource: dataSource })

    // Initialize Langchain model
    const llm = model()

    // Set up SqlToolkit and createSqlAgent
    const toolkit = new SqlToolkit({ db, llm })
    const executor = createSqlAgent({ llm, toolkit })

    // Define input query
    const input = `what does the content say about greenhouse gases in the sciencesearch table?`

    console.log(`Executing with input "${input}"...`)

    // Execute the query using the SQL agent
    const result = await executor.invoke({ input })

    // Output the results
    console.log(`Got output: ${result.output}`);
    console.log(
      `Got intermediate steps: ${JSON.stringify(result.intermediateSteps, null, 2)}`
    )

    // Properly destroy the DataSource after use
    await dataSource.destroy()
  } catch (err) {
    console.error('Error:', err.stack)
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  }
}

run()
