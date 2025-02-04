/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
 */
import healthCheckHandler from '@gateway/features/healthCheck/handler'
import {
  eventNotificationHandler,
  fhirBundleSchema,
  validationFailedAction
} from '@gateway/features/eventNotification/eventNotificationHandler'
import { ServerRoute } from '@hapi/hapi'
import { authProxy, catchAllProxy, rateLimitedAuthProxy } from './proxies'
import sendVerifyCodeHandler, {
  requestSchema,
  responseSchema
} from '@gateway/routes/verifyCode/handler'

export const getRoutes = () => {
  const routes: ServerRoute[] = [
    // used for tests to check JWT auth
    {
      method: 'GET',
      path: '/tokenTest',
      handler: () => {
        return 'success'
      }
    },
    // health check endpoint for all services
    {
      method: 'GET',
      path: '/ping',
      handler: healthCheckHandler,
      options: {
        auth: false,
        description: 'Checks the health of all services.',
        notes: 'Pass the service as a query param: service'
      }
    },
    // create event notification
    {
      method: 'POST',
      path: '/notification',
      handler: eventNotificationHandler,
      options: {
        tags: ['api'],
        description: 'Create a health notification',
        auth: {
          scope: ['declare', 'notification-api']
        },
        validate: {
          payload: fhirBundleSchema,
          failAction: validationFailedAction
        }
      }
    },
    {
      method: 'POST',
      path: '/sendVerifyCode',
      handler: sendVerifyCodeHandler,
      options: {
        description: 'Send verify code to user contact',
        notes:
          'Generate a 6 digit verification code.' +
          'Sends an SMS/email to the user with verification code.',
        validate: {
          payload: requestSchema
        },
        response: {
          schema: responseSchema
        }
      }
    },

    catchAllProxy.locations,
    catchAllProxy.locationsSuffix,

    catchAllProxy.location,
    catchAllProxy.locationId,

    catchAllProxy.auth,
    authProxy.token,
    rateLimitedAuthProxy.authenticate,
    rateLimitedAuthProxy.authenticateSuperUser,
    rateLimitedAuthProxy.verifyUser
  ]

  return routes
}
