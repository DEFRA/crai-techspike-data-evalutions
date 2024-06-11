# Core AI Data evaluation

PoC created to test LLM and database integration. Uses a GOVUK web frontend to allow LLM to be queried.

## Prerequisites

- Docker
- Docker Compose

Optional:
- Kubernetes
- Helm

## Running the application

The application is designed to run in containerised environments, using Docker Compose in development and Kubernetes in production. use `docker-compose up --build` to start the application. Creates web and postgres instances.

- A Helm chart is provided for production deployments to Kubernetes.

## Env variables

Environment variables are stored in .env file, ask a current developer for details. The file should contain the following:

- `OAI_INSTANCE_NAME`
- `OAI_API_KEY`
- `OAI_API_VERSION`
- `POSTGRES_HOST`: pg connection details, e.g. host.docker.internal
- `POSTGRES_PORT`: e.g. 5432
- `POSTGRES_USERNAME`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`: e.g. api
- `USE_MODEL`: OpenAI / Ollama
- `PROMPT`
- `OLLAMA_MODEL`: e.g. gemma, llama3
- LANGFUSE_SECRET_KEY=""
- LANGFUSE_PUBLIC_KEY=""
- LANGFUSE_BASEURL="http://localhost:4000"
- LANGFUSE_SALT=""
- NEXTAUTH_SECRET=""

## Langfuse

Local setup instructions:

  - https://langfuse.com/docs/deployment/self-host#additional-configuration


## LLM's

The site currently supports 2 flavours of LLM, access is specified in `.env` file:

- OpenAI ChatGTP
- Ollama

If Ollama is the chosen model, Ollama will need to be installed and run locally, e.g.:

- `$ ollama serve`
- `$ ollama run <model name>` e.g. gemma, llama3 etc. Model must match the model specified in `.env` file by entering the `OLLAMA_MODEL=...` and `USE_MODEL="ollama"` variables.

## Endpoints

Navigate a web browser to http://localhost:3000

- `/documents/ingest` - creates embeddings for the contents of the `/app/data/NEIRF` folder and inserts into the PG database.
- `/query` - perform RAG on the ingested documents.

## SQL Agents

**Currently in development.** SQL agents are WIP, with the aim of connecting to a local SQL Postgres database. The database used for testing contains embeddings from PDF files in the /`app/data/NEIRF` folder in the `knowledge_vectors` table and the contents of the `https://sciencesearch.defra.gov.uk/` website (13k+ entries). The data is currently stored in the `/data` folder in the project root. Data is stored in the `data.7z` file, which should be uncompressed using the 7-zip compression utility.

Data has been web-scrapped using scripts in the `/app/scripts` folder, the results being stored in .csv and .json format.

## Building and running

### Build container image

Container images are built using Docker Compose, with the same images used to run the service with either Docker Compose or Kubernetes.

When using the Docker Compose files in development the local `app` folder will
be mounted on top of the `app` folder within the Docker container, hiding the CSS files that were generated during the Docker build.  For the site to render correctly locally `npm run build` must be run on the host system.


By default, the start script will build (or rebuild) images so there will
rarely be a need to build images manually. However, this can be achieved
through the Docker Compose
[build](https://docs.docker.com/compose/reference/build/) command:

```
# Build container images
docker-compose build
```

### Start

Use Docker Compose to run service locally.

```
docker-compose up
```

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
