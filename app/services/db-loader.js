const fs = require("fs")
const { Client } = require('pg')
const { Document } = require ('langchain/document')
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter')
const dbConfig = require('../config/db')

const loadDb = async (tableName, contentColumn, metadataColumns) => {
  const docs = []

  const client = new Client({
    host: dbConfig.postgresConnectionOptions.host,
    port: dbConfig.postgresConnectionOptions.port,
    user: dbConfig.postgresConnectionOptions.user,
    password: dbConfig.postgresConnectionOptions.password,
    database: dbConfig.postgresConnectionOptions.database
  })

  await client.connect()
  const rs = await client.query(`SELECT * FROM ${tableName} LIMIT 1000`)

  for (const item of rs.rows) {
    const doc = createDocument(item, contentColumn, metadataColumns)

    docs.push(doc)
  }

  await client.end()

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  })

  return splitter.splitDocuments(docs)
}

const loadJson = async (fileName, contentColumn, metadataColumns) => {
  const data = fs.readFileSync(fileName)
  const docs = JSON.parse(data)

  for (const item of docs) {
    const doc = createDocument(item, contentColumn, metadataColumns)

    docs.push(doc)
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  })

  return splitter.splitDocuments(docs)
}

const createDocument = (item, contentColumn, metadataColumns) => {
  const pageContent = item[contentColumn]
  const metadata = {}

  for (const column of metadataColumns) {
    metadata[column] = item[column]
  }

  const doc = new Document({
    pageContent,
    metadata
  })

  return doc
}

const createBlankDocument = (metadataColumns) => {
  const pageContent = 'BLANK DOCUMENT'
  const metadata = {}

  for (const column of metadataColumns) {
    metadata[column] = 'BLANK DOCUMENT'
  }

  const doc = new Document({
    pageContent,
    metadata
  })

  return doc
}

module.exports = {
  loadDb,
  loadJson,
  createDocument,
  createBlankDocument
}