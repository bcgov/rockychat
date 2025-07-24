# Data Preparation:

We need to create data stores with platform related knowledge base, which could be fed to the LLM for Retrieval Augmented Generation (RAG).

Here are the knowledge base exported and processed:
- public technical doc website: https://developer.gov.bc.ca/docs/default/component/platform-developer-docs -> backstage app, markdown files from a GitHub repo
- private cloud website that requires authentication: https://digital.gov.bc.ca/technology/cloud/private/ -> export HTML + metadata
- BCGov StackOverflow: https://stackoverflow.developer.gov.bc.ca/ -> export questions and verified answers

### Public doc website

GCP: To index this website, we need to [verify the domain](https://cloud.google.com/identity/docs/verify-domain). Once that's ready, just wait for the indexing process to complete.

Azure: It's better to use the markdown files from [the tech doc repo](https://github.com/bcgov/platform-developer-docs) instead of sourcing the HTML files directly for data cleanness. This could be done by git cloning the repo and later match each markdown file to it's actual URL from the tech doc website.

### Private cloud website

We use `wget` to obtain the html files from all website pages, including the internal resources that requires IDIR authentication.

### BCGov StackOverflow:

Use the StackOverflow API endpoint to export questions and answers, an API key generated from a user is required. [Docs for reference](https://api.stackexchange.com/docs).

### BCGov GitHub Discussion:

Use GitHub GraphQL API to fetch Discussions from a repo. [Docs for reference](https://docs.github.com/en/graphql/guides/using-the-graphql-api-for-discussions).

### Preparation for the data collection scripts:

You'll need the access tokens for the GH-discussion repo, StackOverflow API and Digital website

How to obtain the `DIGITAL_WEBSITE_SESSION_TOKEN`:
- an IDIR account is needed to obtain the "Internal Resources" from the website
- head to the internal resources section: https://digital.gov.bc.ca/technology/cloud/private/internal-resources/
- login with your account
- open the developer mode -> Application -> find the website Cookies
- copy paste the cookie key and value as `<wordpress_logged_in_xxx>=<value>`

How to obtain the `STACKOVERFLOW_API_TOKEN`:
- stackoverflow Admin access is required
- head to Admin settings -> API -> create new service key

How to create a `GITHUB_TOKEN`:
- Create a classic developer token is needed for individual repo access if you are not the owner of it: https://github.com/settings/tokens
- Click `Generate new token (classic)`
- Under Scopes, check only:
  - repo (for private repo usage)
  - read:discussion (for reading discussions only, no need for write)
- Enable SSO config for the token
- Don't forget to set a reminder to renew the token before it expires!

> Note that when the discussion repo changes, you'll also need to update the URL link in `config.json` to match the new repo name!

The collected data will be chunked and used to create an Azure AI search index as part of the scripts, so a Service Principle (SP) is needed for [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest) authentication. Following are steps on how to create and prepare the SP (refer to [the official doc](https://learn.microsoft.com/en-us/cli/azure/azure-cli-sp-tutorial-1?tabs=bash#create-a-service-principal-with-role-and-scope) if you need more info!):

```bash
# first login
az login
# check for the SubscriptionId
az account list --output table
az account set --subscription <SubscriptionId>
# check you are using the right subscription
az account show
# create a SP with access to manage Search Index in a specific subscription
az ad sp create-for-rbac --name rockysp --role "Search Service Contributor" --scopes /subscriptions/<SubscriptionId>

# this is the output you'll get:
{
  "appId": "xxx",
  "displayName": "rockysp",
  "password": "xxx",
  "tenant": "xxx"
}

# Now, add the Cognitive Services OpenAI Contributor role to the SP:
# look for a specific role: https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/role-based-access-control
az role definition list --query "[?roleName=='Cognitive Services OpenAI Contributor']"
# To add a role to an existing SP:
az ad sp list --display-name "rockysp" --query "[].appId" -o tsv
az role assignment create --assignee <SP_ID> --role "Cognitive Services OpenAI Contributor" --scope /subscriptions/<SubscriptionId>
# Check roles assigned to a SP:
az role assignment list --assignee <SP_ID> --query "[].{Role:roleDefinitionName, Scope:scope}" -o table

# make sure to match the value and put that into the .env file
# NOTE: If you just need to fetch an existing SP info, follow the same steps from the section below - "How to update the Azure Client credential"
AZURE_CLIENT_ID=<appId>
AZURE_TENANT_ID=<tenant>
AZURE_CLIENT_SECRET=<password>

# This client cred expires every 6 months, there is a calendar reminder for the team to update it before expiration time!

# Side note: we'll also need another SP for RocketChat hubot integration: (Not needed anymore - switch to use API key)
az ad sp create-for-rbac --name rc-integration-sp --role "Cognitive Services OpenAI User" --scopes /subscriptions/<SubscriptionId>
```

### How to run the scripts to collect data:

Step 1 - Get the environment config ready:

```bash
cd data-prep

# quick clean up of the output folder
rm -rf output
mkdir output

# obtain all the credentials and configs to fill in .env file
cp .env.sample .env

# update the info needed from the config.json file and update the index_name with current date
cp config.json.sample config.json
```

Step 2 - Fetch the config values from Azure:
```bash
# You'll need the following information to put into the .env file
AZURE_CLIENT_ID=<appId>
AZURE_TENANT_ID=<tenant>
AZURE_CLIENT_SECRET=<password>

# Get the SP info:
az ad sp list --display-name "rockysp" -o tsv

# First ID is AZURE_CLIENT_ID and second is AZURE_TENANT_ID
# If you are using an existing SP, follow the steps from the section below "How to update the Azure Client credential" to get the `AZURE_CLIENT_SECRET`.
```

```bash
# You'll need the following information to put into the config.json file
"subscription_id": "",
"resource_group": "",
"search_service_name": "rockytest",
"index_name": "rocky-<purpose>-<timestamp>",

# Search for `AI Search` from Azure console, you'll see the enabled AI search services. Pick the right one and click open
# You'll see the Essentials information right here, including:
  # - Resource group for resource_group
  # - Subscription ID for subscription_id
  # - search_service_name at the top left corner for the AI Search service you picked
```

Step 3 - Fill in the other information you gathered from the `Preparation for the data collection scripts` section to `.env`

Step 4 - Run the Docker Container

```bash
# Note: if you only need to run partial of the scripts, check out all-scripts.sh

# build the docker container:
docker build -t data-prep .

# Set the output to data-prep folder
docker run -v $(pwd)/output:/app/output -p 4000:80 --env-file .env data-prep
```

Once the content has been exported locally, please check the format:
- Stackoverflow output should have at least 300 items
- Digital website JONSL file should contain a generate URI `gs://digital-website/cloud/services/private/intro/index.html` (for GCP)
- Tech doc markdown files should exist in platform-developer-docs/src/docs
- Azure Search Index should be created now, the total chunk should equal to the sum of all chunks from the different data paths

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

### How setup the Chatbot in Azure OpenAI Foundry:

After running the data collection scripts, there should be an Azure AI Search Index created already.
- test Search Index with some private cloud keywords, such as `Emerald`. The search result should contains references from all three sources!
- head over to OpenAI Foundry. If you don't have any LLM deployed yet, pick a model and deploy it first.
- head over to Chat playground, pick a deployment and config `add your data` to use the Search Index. Now you can interact with the chatbot from the playground!
- for Rocky integration, get the source code and config from `View Code`

## How to update the Azure Client credential:

Data-prep script uses a Azure Service Principle `rockysp` to authenticate az cli and create search index. The credentials will expire every 6 months, and a manual process is involved to update them!

To find the credentials:
- Head to Azure Portal: https://portal.azure.com/
- Search for `App Registration`, you'll see both of the clients listed. The one you are looking for is called `rockysp`
- Click open them, and look for `Certificates & secrets` from the left hand side menu
- You won't be able to update an existing secret, so create a new one!
- Here are the values you'll need:
    ```console
    AZURE_CLIENT_ID - App Registration (left menu) -> rockysp -> Application ID
    AZURE_TENANT_ID - same spot as above, but Directory ID instead of App ID
    AZURE_CLIENT_SECRET - Certificates and secrets (left menu) and generate a new one, with name and creation date `rbac-yyyy-mm-dd` and 6 months expiration period.
    ```
- Once you created the new secret, make sure to take a copy of the secret value before closing!
- Then update it in the corresponding Vault space (secret name `data-prep-sp-cred`) for Rocky and the `.env` for data-prep usage.

## Azure user management:

Team member access management is scoped under the subscription. To create/update someone's role assignment, follow the steps [here](https://developer.gov.bc.ca/docs/default/component/public-cloud-techdocs/azure/design-build-deploy/user-management/).
