// ACR module — used by bootstrap.bicep
// Also defined inline in resources.bicep (idempotent — same config)

@description('Azure region')
param location string

@description('ACR name (globally unique)')
param acrName string

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
    dataEndpointEnabled: false
    policies: {
      exportPolicy: {
        status: 'disabled'
      }
    }
  }
}

output loginServer string = acr.properties.loginServer
