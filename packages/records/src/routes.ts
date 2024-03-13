import type * as Hapi from '@hapi/hapi'
import { healthcheckHandler } from './features/healthcheck/healthcheck-handler'
import { getFhirLocationHandler } from './features/fhir-location/get-fhir-location-handler'
import { ReqResWithAuthorization } from './server'
import { postFhirLocationHandler } from './features/fhir-location/post-fhir-location.handler'
import { getFhirAllLocationsHandler } from './features/fhir-location/get-fhir-all-locations-handler'

export const routes = [
  {
    method: 'GET',
    path: '/health',
    handler: healthcheckHandler
  },
  // FHIR
  {
    method: 'GET',
    path: '/Location/{id}',
    handler: getFhirLocationHandler
  },
  {
    method: 'GET',
    path: '/Location',
    handler: getFhirAllLocationsHandler
  },
  {
    method: 'POST',
    path: '/Location',
    handler: postFhirLocationHandler
  }
] satisfies Array<Hapi.ServerRoute<ReqResWithAuthorization>>
