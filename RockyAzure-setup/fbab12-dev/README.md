# Rocky AI (fbab12-dev) — Recreate Guide (CLI)

This guide recreates the **networking baseline** from:
- `fbab12-dev-networking-export.json`
- `params.json`

…and then recreates **Azure OpenAI** + **Azure Cognitive Search** (which are **not** included in this cleaned template).

> Assumptions:
> - Subscription: `fbab12-dev - Rocky AI Chatbot`
> - Resource Group: `fbab12-dev-networking`
> - VNet: `fbab12-dev-vwan-spoke` (Canada Central)
> - Action Group: `budget-alert`
> - Azure OpenAI: `rocky-test` (Canada East, S0)
> - Search: `rockytest` (Canada East, Basic)

---

## 0) Prereqs

- Azure CLI logged in: `az login`
- You are in the folder containing:
  - `fbab12-dev-networking-export.json`
  - `params.json`

---

## 1) Set subscription + variables

```bash
az account set --subscription "fbab12-dev - Rocky AI Chatbot"

RG="fbab12-dev-networking"
LOC_NET="canadacentral"

EXPORT="fbab12-dev-networking-export.json"
PARAMS="params.json"
```

Optional sanity check:

```
az account show -o table
```
---


## 2) Create / confirm the resource group

```
az group create -n "$RG" -l "$LOC_NET"
```

## 3)Recreate networking baseline from the template
3.1 Validate (recommended)

```bash
az deployment group validate \
  -g "$RG" \
  --template-file "$EXPORT" \
  --parameters @"$PARAMS"
```

3.2 Deploy
```bash
az deployment group create \
  -g "$RG" \
  -n "recreate-net-$(date +%Y%m%d-%H%M)" \
  --template-file "$EXPORT" \
  --parameters @"$PARAMS"
```

3.3 Verify
```
az resource list -g "$RG" --query "[].{name:name,type:type,location:location}" -o table
az network vnet list -g "$RG" -o table
```

## 4) Recreate Azure OpenAI (rocky-test)

This resource is not in the cleaned RG export template.

### 4.1 Create OpenAI account
LOC_AI="canadaeast"
OPENAI_NAME="rocky-test"

```
az cognitiveservices account create \
  -g "$RG" -n "$OPENAI_NAME" -l "$LOC_AI" \
  --kind "OpenAI" \
  --sku "S0" \
  --yes
```
### 4.2 Confirm
```
az cognitiveservices account show -g "$RG" -n "$OPENAI_NAME" --query "{name:name,location:location,kind:kind,sku:sku.name,publicNetworkAccess:properties.publicNetworkAccess}" -o json
```

## 5) Recreate Azure Cognitive Search (rockytest)

This resource is not in the cleaned RG export template.

### 5.1 Create Search service
```bash
SEARCH_NAME="rockytest"

az search service create \
  -g "$RG" -n "$SEARCH_NAME" -l "$LOC_AI" \
  --sku "basic" \
  --replica-count 1 \
  --partition-count 1
```

### 5.2 Comfirm
```
az resource show -g "$RG" -n "$SEARCH_NAME" --resource-type "Microsoft.Search/searchServices" \
  --query "{name:name,location:location,sku:sku.name}" -o json
```