const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter')
const { DirectoryLoader } = require('langchain/document_loaders/fs/directory')
const { DocxLoader } = require('langchain/document_loaders/fs/docx')
const { PDFLoader } = require('langchain/document_loaders/fs/pdf')
const { TextLoader } = require('langchain/document_loaders/fs/text')
require('dotenv').config()

const loadFile = async (fileName) => {
  const fileType = fileName.substr(fileName.lastIndexOf('.') + 1).toLowerCase()
  let loader

  if (fileType === "doc") {
    loader = new DocxLoader(fileName)
  } else if (fileType === "pdf") {
    loader = new PDFLoader(fileName)
  } else if (fileType === "docx") {
    loader = new DocxLoader(fileName)
  } else if (fileType === "txt") {
    loader = new TextLoader(fileName)
  } else {
    throw new Error(`Unsupported document type: ${fileType}`)
  }

  const docs = await loader.load()

  console.log(`Splitting into chunk size ${process.env.TEXT_SPLITTER_CHUNK_SIZE || 1000}, overlap ${process.env.TEXT_SPLITTER_CHUNK_OVERLAP || 200}`)
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: parseInt(process.env.TEXT_SPLITTER_CHUNK_SIZE || 1000, 10),
    chunkOverlap: parseInt(process.env.TEXT_SPLITTER_CHUNK_OVERLAP || 200, 10)
  })

  return splitter.splitDocuments(docs)
}

const loadFilesFromFolder = async (folderName) => {
  const directoryLoader = new DirectoryLoader(
    folderName,
    {
      ".doc": (path) => new DocxLoader(path),
      ".DOC": (path) => new DocxLoader(path),
      ".pdf": (path) => new PDFLoader(path),
      ".PDF": (path) => new PDFLoader(path),
      ".docx": (path) => new DocxLoader(path),
      ".DOCX": (path) => new DocxLoader(path),
      ".txt": (path) => new TextLoader(path),
      ".TXT": (path) => new TextLoader(path)
    }
  )

  const docs = await directoryLoader.load()

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: parseInt(process.env.TEXT_SPLITTER_CHUNK_SIZE || 1000, 10),
    chunkOverlap: parseInt(process.env.TEXT_SPLITTER_CHUNK_OVERLAP || 200, 10)
  })

  return splitter.splitDocuments(docs)
}

module.exports = {
  loadFile,
  loadFilesFromFolder
}
