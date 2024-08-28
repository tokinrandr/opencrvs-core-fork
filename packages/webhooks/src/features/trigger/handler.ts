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

import { ValidRecord } from '@opencrvs/commons/types'
import * as Hapi from '@hapi/hapi'
import { filterRecordBySystemPermissions } from '@webhooks/permissions'
import * as Joi from 'joi'
import { getQueue } from '@webhooks/queue'
import Webhook from '@webhooks/model/webhook'
import { ActionIdentifier, ACTIONS } from '@opencrvs/commons/state-transitions'
import { createRequestSignature } from '@webhooks/crypto'
import { getUUID, logger } from '@opencrvs/commons'
import { fetchSystem } from '@webhooks/user-mgnt-api'

export const triggerWebhooksSchema = Joi.object({
  action: Joi.string()
    .valid(...Object.values(ACTIONS))
    .required()
})

export async function triggerWebhooksHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const record = request.payload as ValidRecord
  const action = request.query.action as ActionIdentifier

  console.log('We are here', action, record)

  const queue = getQueue()
  const webhooks = await Webhook.find({
    trigger: action
  })

  for (const webhook of webhooks) {
    const system = await fetchSystem(webhook.createdBy, {
      Authorization: request.headers.authorization
    })
    const permittedRecord = await filterRecordBySystemPermissions(
      system,
      record
    )

    const payload = {
      timestamp: new Date().toISOString(),
      id: webhook.webhookId,
      event: {
        hub: {
          topic: action
        },
        context: [permittedRecord]
      }
    }
    const hmac = createRequestSignature(
      'sha256',
      system.sha_secret,
      JSON.stringify(payload)
    )

    logger.info(`Queueing webhook with id ${webhook.webhookId}`)

    queue.add(
      `${webhook.webhookId}_${action}`,
      {
        payload,
        url: webhook.address,
        hmac
      },
      {
        jobId: `WEBHOOK_${getUUID()}_${webhook.webhookId}`,
        attempts: 3
      }
    )
  }

  return h.response({ success: true }).code(200)
}
