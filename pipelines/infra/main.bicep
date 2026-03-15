// ╔══════════════════════════════════════════════════════════╗
// ║  Main Bicep — Contacts App Infrastructure               ║
// ║  Deploys ACA environment + API + Frontend per region     ║
// ╚══════════════════════════════════════════════════════════╝

@description('Azure region for this deployment')
param location string

@description('Environment suffix (dev, staging, prod-eastus, prod-westeurope)')
param environmentSuffix string

@description('ACR name')
param acrName string

@description('API image tag')
param apiImageTag string

@description('Frontend image tag')
param frontendImageTag string

// ── Container Apps Environment ──────────────────────────
module env 'modules/container-app-env.bicep' = {
  name: 'deploy-env-${environmentSuffix}'
  params: {
    environmentSuffix: environmentSuffix
    location: location
  }
}

// ── ACR (created if not exists, idempotent) ─────────────────
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
  }
}

// ── API Container App (internal ingress) ────────────────
module api 'modules/container-app.bicep' = {
  name: 'deploy-api-${environmentSuffix}'
  params: {
    appName: 'contacts-api-${environmentSuffix}'
    location: location
    environmentId: env.outputs.environmentId
    containerImage: '${acr.properties.loginServer}/contacts-app-api:${apiImageTag}'
    targetPort: 3001
    externalIngress: false
    cpu: '0.25'
    memory: '0.5Gi'
    minReplicas: 1
    maxReplicas: 5
    acrLoginServer: acr.properties.loginServer
    envVars: [
      {
        name: 'PORT'
        value: '3001'
      }
      {
        name: 'NODE_ENV'
        value: 'production'
      }
    ]
  }
}

// ── Grant API app pull access to ACR ────────────────────
resource apiAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, api.outputs.principalId, 'acrpull-api')
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '7f951dda-4ed3-4680-a7ca-43fe172d538d' // AcrPull
    )
    principalId: api.outputs.principalId
    principalType: 'ServicePrincipal'
  }
}

// ── Frontend Container App (external ingress) ───────────
module frontend 'modules/container-app.bicep' = {
  name: 'deploy-frontend-${environmentSuffix}'
  params: {
    appName: 'contacts-frontend-${environmentSuffix}'
    location: location
    environmentId: env.outputs.environmentId
    containerImage: '${acr.properties.loginServer}/contacts-app-frontend:${frontendImageTag}'
    targetPort: 80
    externalIngress: true
    cpu: '0.25'
    memory: '0.5Gi'
    minReplicas: 1
    maxReplicas: 5
    acrLoginServer: acr.properties.loginServer
    envVars: [
      {
        name: 'API_PROXY_PASS'
        value: 'https://${api.outputs.fqdn}/'
      }
    ]
  }
}

// ── Grant Frontend app pull access to ACR ───────────────
resource frontendAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, frontend.outputs.principalId, 'acrpull-frontend')
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '7f951dda-4ed3-4680-a7ca-43fe172d538d' // AcrPull
    )
    principalId: frontend.outputs.principalId
    principalType: 'ServicePrincipal'
  }
}

// ── Outputs ─────────────────────────────────────────────
@description('Frontend FQDN')
output frontendFqdn string = frontend.outputs.fqdn

@description('API internal FQDN')
output apiFqdn string = api.outputs.fqdn

@description('Environment default domain')
output envDomain string = env.outputs.defaultDomain
