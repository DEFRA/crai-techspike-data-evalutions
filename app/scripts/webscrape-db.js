require('dotenv').config()
const fs = require('fs');
const pg = require('pg');
var format = require('pg-format');
let converter = require('json-2-csv');


const inspect = async (fileName) => {
  const data = fs.readFileSync(fileName)
  const results = JSON.parse(data)

  const fields = []
  const lengths = {}
  for (const item of results) {
    for (const key in item) {
      if (fields.indexOf(key) === -1) {
        fields.push(key)
        lengths[key] = item[key].length
      } else {
        if (item[key].length > lengths[key]) {
          lengths[key] = item[key].length
        }
      }
    }
  }

  return lengths

  /*fields {
    id: 11,
    title: 262,
    summary: 83,
    href: 65,
    Description: 32060,
    'Contractor / Funded Organisations': 620,
    Keywords: 699,
    'Fields of Study': 60,
    'Date From': 4,
    'Date To': 4,
    Cost: 12,
    Objective: 34566,
    'Project Documents': 18720
  }*/
}

const saveCsv = async (fileName) => {
  const data = fs.readFileSync(fileName)
  const results = JSON.parse(data)

  const csv = await converter.json2csv(results)

  fs.writeFile(fileName.replace('.json', '.csv'), csv,
  err => {
    if (err) throw err
    console.log('Finished')
  })
}

const importData = async (fileName) => {
  const data = fs.readFileSync(fileName)
  const results = JSON.parse(data) //.splice(0, 1)

  const { Client } = pg

  const client = new Client({
    host: 'localhost', //process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USERNAME,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB
  })

  const fields = [
    'id', 'title', 'summary', 'href', 'Description', 'Contractor / Funded Organisations',
    'Keywords', 'Field of Study', 'Date From', 'Date To', 'Cost', 'Objective', 'Project Documents'
  ]
  const arr = results.map(x => {
    const row = []
    fields.forEach(y => row.push(y in x ? x[y] : ''))
    return row
  })
  //console.log(arr)
  //console.log('')
  //console.log('')
  //console.log(results)


  sql = format(`INSERT INTO sciencesearch ("${fields.join('", "')}") VALUES %L`, arr)
  //console.log(sql)

  await client.connect()
  try {
    await client.query(sql)
  } catch (err) {
    console.error(err)
  } finally {
    await client.end()
  }
}


(async () => {
  const url = 'https://sciencesearch.defra.gov.uk/'
  const directoryPath = `${__dirname}/../data/`
  const fileName = 'pages1.json'

  //const fields = await inspect(fileName)
  //console.log('fields', fields)

  //await saveCsv(fileName)

  await importData(`${directoryPath}${fileName}`)
})()
