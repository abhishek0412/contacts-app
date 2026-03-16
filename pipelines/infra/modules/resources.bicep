// ╔══════════════════════════════════════════════════════════╗
// ║  Resources Bicep — All resources in one Resource Group   ║
// ║  ACR + Log Analytics + ACA Environment + Apps + RBAC     ║
// ║  Uses user-assigned identities to avoid circular deps    ║
// ╚══════════════════════════════════════════════════════════╝

@description('Azure region')
param location string

@description('Environment suffix (e.g. dev, staging, prod)')
param environmentSuffix string

@description('ACR name (globally unique)')
param acrName string

@description('API image tag')
param apiImageTag string

@description('Frontend image tag')
param frontendImageTag string

// ── Built-in role definition ────────────────────────────
var acrPullRoleId = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  '7f951dda-4ed3-4680-a7ca-43fe172d538d' // AcrPull
)

// ── Azure Container Registry ────────────────────────────
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
  }
}

// ── User-Assigned Managed Identities ────────────────────
// Created BEFORE container apps so we can assign AcrPull first
resource apiIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-contacts-api-${environmentSuffix}'
  location: location
}

resource frontendIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-contacts-frontend-${environmentSuffix}'
  location: location
}

// ── ACR Pull role assignments ───────────────────────────
// Assigned BEFORE container apps are created so image pull succeeds
resource apiAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, apiIdentity.id, 'acrpull')
  scope: acr
  properties: {
    roleDefinitionId: acrPullRoleId
    principalId: apiIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource frontendAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, frontendIdentity.id, 'acrpull')
  scope: acr
  properties: {
    roleDefinitionId: acrPullRoleId
    principalId: frontendIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ── Log Analytics Workspace ─────────────────────────────
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'log-contacts-${environmentSuffix}'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ── Container Apps Environment ──────────────────────────
resource containerAppEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: 'contacts-env-${environmentSuffix}'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
    zoneRedundant: false
  }
}

// ── API Container App (internal ingress) ────────────────
resource apiApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'contacts-api-${environmentSuffix}'
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${apiIdentity.id}': {}
    }
  }
  dependsOn: [apiAcrPull] // Ensure AcrPull role is assigned before image pull
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: false
        targetPort: 3001
        transport: 'auto'
        allowInsecure: false
        clientCertificateMode: 'ignore'
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: apiIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'contacts-api'
          image: '${acr.properties.loginServer}/contacts-app-api:${apiImageTag}'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            { name: 'PORT', value: '3001' }
            { name: 'NODE_ENV', value: 'production' }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: { path: '/contacts', port: 3001 }
              initialDelaySeconds: 10
              periodSeconds: 30
            }
            {
              type: 'Readiness'
              httpGet: { path: '/contacts', port: 3001 }
              initialDelaySeconds: 5
              periodSeconds: 10
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 2
        rules: [
          {
            name: 'http-scaling'
            http: { metadata: { concurrentRequests: '50' } }
          }
        ]
      }
    }
  }
}

// ── Frontend Container App (external ingress) ───────────
resource frontendApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'contacts-frontend-${environmentSuffix}'
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${frontendIdentity.id}': {}
    }
  }
  dependsOn: [frontendAcrPull] // Ensure AcrPull role is assigned before image pull
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 80
        transport: 'auto'
        allowInsecure: false
        clientCertificateMode: 'ignore'
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: frontendIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'contacts-frontend'
          image: '${acr.properties.loginServer}/contacts-app-frontend:${frontendImageTag}'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            { name: 'API_PROXY_PASS', value: 'https://${apiApp.properties.configuration.ingress.fqdn}/' }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: { path: '/', port: 80 }
              initialDelaySeconds: 10
              periodSeconds: 30
            }
            {
              type: 'Readiness'
              httpGet: { path: '/', port: 80 }
              initialDelaySeconds: 5
              periodSeconds: 10
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 2
        rules: [
          {
            name: 'http-scaling'
            http: { metadata: { concurrentRequests: '50' } }
          }
        ]
      }
    }
  }
}

// ── Outputs ─────────────────────────────────────────────
@description('Frontend FQDN')
output frontendFqdn string = frontendApp.properties.configuration.ingress.fqdn

@description('API internal FQDN')
output apiFqdn string = apiApp.properties.configuration.ingress.fqdn

@description('ACR login server')
output acrLoginServer string = acr.properties.loginServer
