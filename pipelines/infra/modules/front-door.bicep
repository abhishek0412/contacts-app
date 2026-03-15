// Azure Front Door — global load balancer with WAF

@description('Front Door profile name')
param profileName string

@description('Frontend app FQDNs per region')
param backendFqdns array

resource frontDoorProfile 'Microsoft.Cdn/profiles@2024-02-01' = {
  name: profileName
  location: 'global'
  sku: {
    name: 'Standard_AzureFrontDoor'
  }
}

resource endpoint 'Microsoft.Cdn/profiles/afdEndpoints@2024-02-01' = {
  parent: frontDoorProfile
  name: 'contacts-endpoint'
  location: 'global'
  properties: {
    enabledState: 'Enabled'
  }
}

resource originGroup 'Microsoft.Cdn/profiles/originGroups@2024-02-01' = {
  parent: frontDoorProfile
  name: 'contacts-origins'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/'
      probeRequestType: 'GET'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 30
    }
    sessionAffinityState: 'Disabled'
  }
}

resource origins 'Microsoft.Cdn/profiles/originGroups/origins@2024-02-01' = [
  for (fqdn, i) in backendFqdns: {
    parent: originGroup
    name: 'origin-${i}'
    properties: {
      hostName: fqdn
      httpPort: 80
      httpsPort: 443
      originHostHeader: fqdn
      priority: 1
      weight: 1000
      enabledState: 'Enabled'
    }
  }
]

resource route 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-02-01' = {
  parent: endpoint
  name: 'default-route'
  properties: {
    originGroup: {
      id: originGroup.id
    }
    supportedProtocols: [
      'Https'
    ]
    patternsToMatch: [
      '/*'
    ]
    forwardingProtocol: 'HttpsOnly'
    httpsRedirect: 'Enabled'
    linkToDefaultDomain: 'Enabled'
  }
  dependsOn: [
    origins
  ]
}

@description('Front Door endpoint hostname')
output endpointHostname string = endpoint.properties.hostName

@description('Front Door profile ID')
output profileId string = frontDoorProfile.id
