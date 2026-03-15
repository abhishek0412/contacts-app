// Azure Container Apps Environment + Log Analytics Workspace

@description('Environment suffix (e.g. dev, staging, prod-eastus)')
param environmentSuffix string

@description('Azure region')
param location string

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

@description('Container Apps Environment ID')
output environmentId string = containerAppEnv.id

@description('Container Apps Environment default domain')
output defaultDomain string = containerAppEnv.properties.defaultDomain

@description('Container Apps Environment name')
output environmentName string = containerAppEnv.name
