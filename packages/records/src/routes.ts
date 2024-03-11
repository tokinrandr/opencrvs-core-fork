import type * as Hapi from '@hapi/hapi'
import { healthcheckHandler } from './features/healthcheck/healthcheck-handler'
import { fhirLocationHandler } from './features/fhir-location/fhir-location-handler'
import { ReqResWithAuthorization } from './server'

export const routes = [
  {
    method: 'GET',
    path: '/health',
    handler: healthcheckHandler
  },
  {
    method: 'GET',
    path: '/Location/{id}',
    handler: fhirLocationHandler
  }
] satisfies Array<Hapi.ServerRoute<ReqResWithAuthorization>>
