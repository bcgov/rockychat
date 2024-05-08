# Data Preparation:

We need to create data stores with platform related knowledge base, which could be fed to the LLM for Retrieval Augmented Generation (RAG).

Here are the knowledge base exported and processed:
- public technical doc website: https://docs.developer.gov.bc.ca/ -> indexed directly
- private cloud website that requires authentication: https://digital.gov.bc.ca/cloud/services/private/ -> export HTML + metadata
- BCGov stackoverflow: https://stackoverflow.developer.gov.bc.ca/ -> export questions and verified answers

### Public doc website

To index a website, we need to [verify the domain](https://cloud.google.com/identity/docs/verify-domain). Once that's ready, just wait for the indexing process to complete.

### Private cloud website

We use `wget` to obtain the html files from all website pages, including the internal resources that requires IDIR authentication:

```bash
# get the session token from cookies:
export DIGITAL_SESSION="wordpress_logged_in_xxx=xxxx"

# no local conversion of the link to keep the original URLs:
wget --header "Cookie: $DIGITAL_SESSION" --mirror -np https://digital.gov.bc.ca/cloud/services/private

# create folder structure to match the GCP storage bucket name:
mkdir data-exports
mv digital.gov.bc.ca/ data-exports/digital-website/

# create the JSONL file with the Title and URL metadata:
python3 website-html-script.py data-exports data-exports/html_files.jsonl
# To check: generate URI should be "gs://digital-website/cloud/services/private/intro/index.html"

```

Note: add this to the docker option

# BCGov StackOverflow:

Use the StackOverflow API endpoint to export questions and answers, an API key generated from a user is required. [Docs for reference](https://api.stackexchange.com/docs).

```bash
# obtain the API key and fill in .env file
cp .env.sample .env

# build the docker container:
docker build -t data-prep .

# Set the output to data-prep folder
docker run -v ./output:/app/output -p 4000:80 --env-file .env data-prep
```
