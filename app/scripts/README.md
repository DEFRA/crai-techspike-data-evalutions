# Populating data

When downloading this repo, data may or may not be present, and the data present may not be the required data.

For test purposes, the website [Science Search](https://sciencesearch.defra.gov.uk/) has been used, specifically projects marked using the 'Evaluations' keyword.

To download the data, use the `webscrape.js` node script. If a different subset of data is required, modify the screen scraping script as required. This will save a `.json` file in the `/app/data` folder. 2 files should already be present in this folder - one containing the full science search site, and 1 containing the evaluations only.

the `webscrape.js` script downloads all project details and transposes the data to create columns that separate dates and costs from the data on the site.

# Populating the database

In order to test SQL RAG agents, the data from the generated .json file needs to be added to a (Postgres) database. Use the `webscrape-db.js` node script to perform this action.

The script relies on a Postgres database hosted through Docker, ensure that Docker is running: `docker-compose up --build`.

Edit `webscrape-db.js` to ensure the correct json file is populated. The script requires a database containing a table called `sciencesearch`, if this is not present it will need to be created.

If the `sciencesearch` table is present and contains existing data, delete present data as required.

# Creating vector embeddings

To create vector embeddings, spin up the html app `docker-compose up --build` and navigate to the page [http://localhost:3000/documents/injestdb](http://localhost:3000/documents/injestdb).

This will read the following environment variables:

- `USE_MODEL`
- `OLLAMA_MODEL`

if `USE_MODEL` is *ollama*, the HNSW library is used to create and store embeddings using the locally running `OLLAMA_MODEL` mode. Please ensure that ollama is installed, running and the correct model is served:

- `$ ollama run llama3`

if `USE_MODEL` is not ollama ChatGPT is assumed and connected to using credentials stored in the `.env` file, these embeddings are stored in the local Postgres database.
