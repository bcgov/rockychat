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

### BCGov StackOverflow:

Use the StackOverflow API endpoint to export questions and answers, an API key generated from a user is required. [Docs for reference](https://api.stackexchange.com/docs).

### How to run the scripts to collect data:

You'll need the access tokens for both StackOverflow API and Digital website

How to obtain the `DIGITAL_WEBSITE_SESSION_TOKEN`:
- head to the internal resources section: https://digital.gov.bc.ca/cloud/services/private/internal-resources/
- login with your account
- open the developer mode -> Application -> find the website Cookies
- copy paste the cookie key and value as `<wordpress_logged_in_xxx>=<value>`

How to obtain the `STACKOVERFLOW_API_TOKEN`:
- Admin access is required
- head to Admin settings -> API -> create new service key

```bash
cd rockychat/data-prep

# quick clean up of the output folder
rm -rf output
mkdir output

# obtain all the credentials and configs to fill in .env file
cp .env.sample .env

# check in the dockerfile to make sure the right script is used

# build the docker container:
docker build -t data-prep .

# Set the output to data-prep folder
docker run -v $(pwd)/output:/app/output -p 4000:80 --env-file .env data-prep
```

Once the content has been exported locally, please check the format:
- Stackoverflow output should have at least 300 items
- Digital website JONSL file should contain a generate URI `gs://digital-website/cloud/services/private/intro/index.html`


### How to upload the knowledge base to GCP Agent Builder:
GCP Agent Builder uses datastores to automatically generate responses, here are the steps to upload the KB:

- head over to GCP cloud storage: https://console.cloud.google.com/storage/browser?project=private-cloud-chat-bot
- upload the outputs to the corresponding buckets, make sure to overwrite the existing content:
  - digital-website
  - digital-website-jsonl
  - stackoverflow-csv
- once the bucket import is completed (check from the `Last modified` timestamp), add them to the datastore: https://console.cloud.google.com/gen-app-builder/engines?project=private-cloud-chat-bot
  - `tech-doc-website` is website direct import of https://developer.gov.bc.ca/docs/default/component/platform-developer-docs
  - `metadata and stackoverflow csv` contains both the files from `stackoverflow-csv` and `digital-website-jsonl`
- wait for the data import to complete, then add them to the agent from DialogFlow CX
