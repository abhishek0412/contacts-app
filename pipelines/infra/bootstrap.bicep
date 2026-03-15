// ╔══════════════════════════════════════════════════════════╗
// ║  Bootstrap Bicep — Resource Group + ACR only            ║
// ║  Runs BEFORE image push so ACR exists for docker push   ║
// ║  Deploy with: az deployment sub create                   ║
// ╚══════════════════════════════════════════════════════════╝

targetScope = 'subscription'

@description('Azure region')
param location string

@description('Environment suffix (e.g. dev, staging, prod)')
param environmentSuffix string

@description('ACR name (globally unique)')
param acrName string

// ── Resource Group ──────────────────────────────────────
var resourceGroupName = 'rg-contacts-${environmentSuffix}'

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
}

// ── ACR ─────────────────────────────────────────────────
module acr 'modules/acr.bicep' = {
  name: 'deploy-acr-${environmentSuffix}'
  scope: rg
  params: {
    location: location
    acrName: acrName
  }
}

// ── Outputs ─────────────────────────────────────────────
output resourceGroupName string = rg.name
output acrLoginServer string = acr.outputs.loginServer
