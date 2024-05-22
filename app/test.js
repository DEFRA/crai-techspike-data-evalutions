require('dotenv').config({ path: `${__dirname}/../.env`, debug: false })
const { getVectorStore, ingestDocuments } = require('./vectorstore/vector-store')
const { loadFile, loadFilesFromFolder } = require('./vectorstore/document-loader')
const { model, embeddings } = require('./llm/ai')
const { generateResponse } = require('./llm/generate')
const { prompts, types } = require('./llm/prompts')


async function run(str) {
  let llm = model()

  const response = await llm.invoke(str)
  return response
}

(async() => {
  console.log('starting...')

  /*const docs = await loadFile('./data/NEIRF/15458_NEIRF_YR1_REPORT_FINAL.PDF')
  console.log(docs)
  //const docs = loadFilesFromFolder('./data/NEIRF')

  await ingestDocuments(docs)*/



  const llm = model()
  const prompt = prompts[types.GENERATE_PROMPT]
  const response = await generateResponse(llm, prompt, 'What is NEIRF?')


  //const response = await run('Translate "Hello World" into German.')
  console.log(response)
  
  console.log('finished...')
})()
