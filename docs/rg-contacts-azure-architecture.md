# Azure Architecture: rg-contacts-{environmentSuffix}

**Subscription**: Deployment target from subscription-level Bicep  
**Region**: Parameterized via location  
**Resource Count**: 5 resources inside resource group  
**Generated**: March 17, 2026

## Overview

This project deploys a containerized Contact Manager workload to Azure using Bicep. The deployment model creates a resource group per environment and provisions a small set of core platform resources: Azure Container Registry, Log Analytics workspace, Container Apps managed environment, and two Container Apps (frontend and API).

Traffic enters through the external frontend Container App. The frontend container (Nginx) proxies API requests to the internal API Container App over HTTPS by using the API app ingress FQDN. Both apps pull images from ACR using ACR admin credentials stored as Container App secrets.

The monitoring path is centralized in Log Analytics, connected through the managed environment app logs configuration. Scaling is HTTP-driven for both apps, with the API configured for a minimum of one replica and the frontend allowed to scale to zero.

## Resource Inventory

| Resource Name | Type | Tier/SKU | Location | Notes |
|--------------|------|----------|----------|-------|
| rg-contacts-{environmentSuffix} | Microsoft.Resources/resourceGroups | N/A | parameter: location | Environment resource group created at subscription scope |
| {acrName} | Microsoft.ContainerRegistry/registries | Basic | parameter: location | adminUserEnabled true, publicNetworkAccess Enabled |
| log-contacts-{environmentSuffix} | Microsoft.OperationalInsights/workspaces | PerGB2018 | parameter: location | 30-day retention |
| contacts-env-{environmentSuffix} | Microsoft.App/managedEnvironments | N/A | parameter: location | Connected to Log Analytics for app logs |
| contacts-api-{environmentSuffix} | Microsoft.App/containerApps | 0.25 vCPU / 0.5 Gi | parameter: location | Internal ingress on port 3001, minReplicas 1 |
| contacts-frontend-{environmentSuffix} | Microsoft.App/containerApps | 0.25 vCPU / 0.5 Gi | parameter: location | External ingress on port 80, minReplicas 0 |

## Architecture Diagram

```mermaid
graph TB
    subgraph SUB[Subscription]
        RG[Resource Group<br/>rg-contacts-{environmentSuffix}]
    end

    subgraph PLATFORM[Platform Resources]
        ACR[Azure Container Registry<br/>{acrName}<br/>Basic | Admin Enabled]
        LAW[Log Analytics Workspace<br/>log-contacts-{environmentSuffix}<br/>PerGB2018 | 30d]
        ENV[Container Apps Environment<br/>contacts-env-{environmentSuffix}]
    end

    subgraph APPS[Container Apps]
        FE[Frontend Container App<br/>contacts-frontend-{environmentSuffix}<br/>External ingress :80]
        API[API Container App<br/>contacts-api-{environmentSuffix}<br/>Internal ingress :3001]
    end

    USERS[Users]

    RG --> ACR
    RG --> LAW
    RG --> ENV
    RG --> FE
    RG --> API

    LAW -->|App logs sink| ENV
    ENV --> FE
    ENV --> API

    ACR -->|Pull contacts-app-frontend:{frontendImageTag}| FE
    ACR -->|Pull contacts-app-api:{apiImageTag}| API

    FE -->|HTTPS proxy /api| API
    USERS -->|HTTPS| FE

    FE -.->|Registry auth via secret acr-password| ACR
    API -.->|Registry auth via secret acr-password| ACR
```

## Relationship Details

### Network Architecture

- Frontend app has external ingress enabled and acts as the public entry point.
- API app has external ingress disabled and is reachable internally through Container Apps environment networking.
- Frontend container sets API_PROXY_PASS to the API internal ingress FQDN over HTTPS.

### Data Flow

1. User requests arrive at the frontend Container App.
2. Static SPA content is served by Nginx in the frontend container.
3. SPA API calls to /api are proxied by Nginx to the internal API Container App.
4. API responses return through frontend proxy to browser clients.

### Identity and Access

- Container apps authenticate to ACR using admin username/password credentials.
- Credentials are injected into Container Apps configuration as secret references.
- No managed identity is defined in the current IaC for image pull or resource access.

### Dependencies

- Bootstrap deployment creates resource group and ACR first for image push workflows.
- Main deployment creates all resources and wires app images from ACR.
- API app depends on managed environment and ACR credentials.
- Frontend app depends on managed environment, ACR credentials, and API ingress FQDN.

## Notes and Recommendations

- Replace ACR admin credentials with managed identity and AcrPull role assignment.
- Consider private network controls for ACR and tighter ingress restrictions.
- Add explicit secret source integration (for example Key Vault) for runtime sensitive values.
- Validate production readiness for scale-to-zero frontend behavior if always-on UX is required.
- Add deployment-time policy checks for secure defaults across environments.

## Source References

- [pipelines/infra/main.bicep](pipelines/infra/main.bicep)
- [pipelines/infra/bootstrap.bicep](pipelines/infra/bootstrap.bicep)
- [pipelines/infra/modules/resources.bicep](pipelines/infra/modules/resources.bicep)
- [pipelines/infra/modules/acr.bicep](pipelines/infra/modules/acr.bicep)
