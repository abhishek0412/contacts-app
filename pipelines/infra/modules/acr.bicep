// Azure Container Registry — Premium SKU for geo-replication

@description('ACR name (globally unique)')
param acrName string

@description('Primary location')
param location string

@description('Geo-replication locations (excluding primary)')
param replicationLocations array = []

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Premium'
  }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
    policies: {
      retentionPolicy: {
        status: 'enabled'
        days: 30
      }
    }
  }
}

// Geo-replicate to additional regions
resource replications 'Microsoft.ContainerRegistry/registries/replications@2023-07-01' = [
  for repl in replicationLocations: {
    parent: acr
    name: repl
    location: repl
    properties: {}
  }
]

@description('ACR login server')
output loginServer string = acr.properties.loginServer

@description('ACR resource ID')
output acrId string = acr.id
