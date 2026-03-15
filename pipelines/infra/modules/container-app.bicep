// Azure Container App — generic module for API or Frontend

@description('Container App name')
param appName string

@description('Azure region')
param location string

@description('Container Apps Environment resource ID')
param environmentId string

@description('Full container image reference (e.g. myacr.azurecr.io/app:tag)')
param containerImage string

@description('Container port')
param targetPort int

@description('Is ingress external (true) or internal only (false)')
param externalIngress bool

@description('CPU cores (e.g. 0.25, 0.5, 1.0)')
param cpu string = '0.25'

@description('Memory (e.g. 0.5Gi, 1.0Gi)')
param memory string = '0.5Gi'

@description('Min replicas')
param minReplicas int = 1

@description('Max replicas')
param maxReplicas int = 3

@description('Environment variables')
param envVars array = []

@description('ACR login server for managed identity pull')
param acrLoginServer string

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: appName
  location: location
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      activeRevisionsMode: 'Multiple'
      ingress: {
        external: externalIngress
        targetPort: targetPort
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: acrLoginServer
          identity: 'system'
        }
      ]
    }
    template: {
      containers: [
        {
          name: appName
          image: containerImage
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: envVars
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/'
                port: targetPort
              }
              initialDelaySeconds: 10
              periodSeconds: 30
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/'
                port: targetPort
              }
              initialDelaySeconds: 5
              periodSeconds: 10
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}

@description('Container App FQDN')
output fqdn string = containerApp.properties.configuration.ingress.fqdn

@description('Container App principal ID (for ACR pull role)')
output principalId string = containerApp.identity.principalId

@description('Container App resource ID')
output appId string = containerApp.id
