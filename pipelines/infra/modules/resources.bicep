// ╔══════════════════════════════════════════════════════════╗
// ║  Resources Bicep — All resources in one Resource Group   ║
// ║  ACR + Log Analytics + ACA Environment + Apps            ║
// ║  Uses ACR admin credentials (Contributor role only)      ║
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

// ── Azure Container Registry ────────────────────────────
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
    publicNetworkAccess: 'Enabled'
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
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
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
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
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
