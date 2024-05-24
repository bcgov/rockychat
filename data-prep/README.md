# Data Preparation:

We need to create data stores with platform related knowledge base, which could be fed to the LLM for Retrieval Augmented Generation (RAG).

Here are the knowledge base exported and processed:
- public technical doc website: https://docs.developer.gov.bc.ca/ -> indexed directly
- private cloud website that requires authentication: https://digital.gov.bc.ca/cloud/services/private/ -> export HTML + metadata
- BCGov stackoverflow: https://stackoverflow.developer.gov.bc.ca/ -> export questions and verified answers

### Public doc website

To index a website, we need to [verify the domain](https://cloud.google.com/identity/docs/verify-domain). Once that's ready, just wait for the indexing process to complete.

### Private cloud website

We use `wget` to obtain the html files from all website pages, including the internal resources that requires IDIR authentication.

> Note that if you want to include the IDIR protected data, a login session token could be obtained from the browser -> developer settings -> cookies. The format is like `wordpress_logged_in_xxxx=xxx`.
`

Use the docker option:
```bash
# obtain the API key and fill in .env file
cp .env.sample .env

# check in the dockerFile to make sure the right script is used

# build the docker container:
docker build -t data-prep .

# Set the output to data-prep folder
rm -rf output
mkdir output
docker run -v $(pwd)/output:/app/output -p 4000:80 --env-file .env data-prep

# to check: in the JONSL file, there should be a generate URI should be "gs://digital-website/cloud/services/private/intro/index.html"
```

# BCGov StackOverflow:

Use the StackOverflow API endpoint to export questions and answers, an API key generated from a user is required. [Docs for reference](https://api.stackexchange.com/docs).

```bash
# obtain the API key and fill in .env file
cp .env.sample .env

# check in the dockerFile to make sure the right script is used

# build the docker container:
docker build -t data-prep .

# Set the output to data-prep folder
mkdir output
docker run -v $(pwd)/output:/app/output -p 4000:80 --env-file .env data-prep
```
