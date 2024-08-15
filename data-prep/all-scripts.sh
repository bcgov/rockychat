#!/bin/bash

# Load environment variables from the .env file
export $(grep -v '^#' .env | xargs)

# Step 1: generate website export of Digital.gov.bc.ca
# Note that "digital-website" folder is required to match the data store structure from GCP
python3 website-html-parsing-script.py output/digital-website-original/ output/digital-website output/html_files_metadata.jsonl

# Step 2: export StackOverflow content here
python3 stackoverflow-csv-script.py

# Step 3: clone tech doc repo
python3 clone-tech-doc-repo.py "https://github.com/bcgov/platform-developer-docs.git" output/platform-developer-docs

# Step 4: Azure - Log in to Azure using the Service Principal
az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET --tenant $AZURE_TENANT_ID

# Step 4.1: Azure - transform StackOverflow content into files
python3 azure-data-transformation-script.py output/stackoverflow-questions.csv output/stackoverflow-files

# Step 4.2: Azure - chunk data and create index
python3 data_preparation.py --config config.json --njobs=4
