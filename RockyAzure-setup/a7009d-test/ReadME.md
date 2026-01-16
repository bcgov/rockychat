## Rocky AI Azure (a7009d-test) Recreate Template
**Files**

* Template: a7009d-test-networking-export.json

* Parameters: params.json

These two files are intended to recreate the Rocky AI networking + PaaS footprint in the a7009d-test subscription.

What is excluded from the template (by design)

This template is a cleaned export. The following items are intentionally removed because they are either centrally managed, environment-managed, or not safely redeployable as part of this template:


Cmd to check what we currently have:
```
az resource list -g "$RG" -o table

```


### 1) Private DNS wiring for Private Endpoints

Excluded resource types:

Microsoft.Network/privateEndpoints/privateDnsZoneGroups

Microsoft.Network/privateDnsZones

Microsoft.Network/privateDnsZones/virtualNetworkLinks

Reason: private DNS zones and their links are commonly managed outside this subscription (centralized) and shouldn’t be created/linked here.

### 2) VNet Peerings

Excluded resource type:

Microsoft.Network/virtualNetworks/virtualNetworkPeerings

Reason: peerings require the remote (hub) VNet resource ID and are typically managed separately.

### 3) Route Tables and subnet route table attachments

Excluded resource type:

Microsoft.Network/routeTables
Also removed from subnets:

properties.routeTable

Reason: route tables are not intended to be recreated through this template; subnets will be created without route table bindings.

### 4) Azure OpenAI “system-managed” settings

Excluded resource types:

Microsoft.CognitiveServices/accounts/raiPolicies (e.g., system policy like Microsoft.Default)

Microsoft.CognitiveServices/accounts/defenderForAISettings

Reason: system-managed policies/settings cannot be updated via ARM deployment in a reliable way.

Note: The OpenAI account itself and private endpoints remain in the template; only the above child resources are excluded.

What the template recreates (high-level)

Typical resources included:

VNet + subnets + NSGs (and NSG rules)

Bastion + Public IP

Jumpbox VM + NIC + SSH key (if present in export)

Azure OpenAI account + private endpoint

Azure Cognitive Search service + private endpoint

APIM service + configuration objects (as exported)

**How to recreate**
### 1) Set subscription + variables
az login
az account set --subscription "a7009d-test - Platform Services GenAI Chatbot"

RG="a7009d-test-networking"
LOC="canadacentral"
TEMPLATE="a7009d-test-networking-export.json"
PARAMS="params.json"

### 1) Create the resource group
az group create -n "$RG" -l "$LOC"

### 2) Validate the deployment (no changes made)
az deployment group validate \
  -g "$RG" \
  --template-file "$TEMPLATE" \
  --parameters @"$PARAMS"

### 3) Preview changes (recommended)

If the RG already has resources, use what-if to see exactly what it would do.

az deployment group what-if \
  -g "$RG" \
  --template-file "$TEMPLATE" \
  --parameters @"$PARAMS"

### 4) Deploy (create resources)
az deployment group create \
  -g "$RG" \
  -n "recreate-$(date +%Y%m%d-%H%M)" \
  --template-file "$TEMPLATE" \
  --parameters @"$PARAMS"

Post-deploy tasks (manual / out-of-template)

After deployment completes, do these checks/actions as needed:

A) Private Endpoint DNS resolution

Because DNS wiring is excluded, confirm name resolution from inside the network (e.g., jumpbox):

nslookup <openai-name>.privatelink.openai.azure.com
nslookup <search-name>.privatelink.search.windows.net

B) VNet peering (if required)

If your environment requires peering to a hub VNet, create/verify it separately (not included in template).

C) OpenAI RAI policy / Defender for AI

These are excluded from the template. Manage them through the portal/org standard process if needed.
