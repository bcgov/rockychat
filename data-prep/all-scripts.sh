#!/bin/bash

# Step 1: generate website export of Digital.gov.bc.ca
python3 website-html-parsing-script.py output/digital-website-original/ output/digital-website

# Step 2: export StackOverflow content here
python3 stackoverflow-csv-script.py

# Step 2.1: Azure - transform StackOverflow content into files
python3 azure-data-transformation-script.py output/stackoverflow-questions.csv output/stackoverflow-files

# Step 3: clone tech doc repo
python3 clone-tech-doc-repo.py

# Step 4: Azure - Log in to Azure using the Service Principal
az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET --tenant $AZURE_TENANT_ID

# Step 4.2: Azure - chunk data and create index

# using an embedding model:
# python3 data_preparation.py --config config.json --njobs=4 \
#   --embedding-model-endpoint=$AZURE_EMBEDDING_MODEL_ENDPOINT \
#   --embedding-model-key=$AZURE_EMBEDDING_MODEL_KEY

# simple keyword matching index:
python3 data_preparation.py --config config.json --njobs=4
