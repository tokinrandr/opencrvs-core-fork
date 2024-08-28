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
import fetch from 'node-fetch'
import { ValidRecord } from '@opencrvs/commons/types'
import { WEBHOOKS_URL } from '@workflow/constants'
import { RecordEvent } from '@opencrvs/commons/record-events'
import { logger } from '@opencrvs/commons'

export const triggerWebhooks = async ({
  record,
  action,
  token
}: {
  record: ValidRecord
  action: RecordEvent
  token: string
}) => {
  logger.info(
    `Triggering webhook for ${action} for ${
      record.id ? `saved record ${record.id}` : `unsaved record`
    }`
  )

  const response = await fetch(
    new URL(`/trigger?action=${action}`, WEBHOOKS_URL),
    {
      method: 'POST',
      body: JSON.stringify(record),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(
      `Dispatching webhook failed with [${
        response.status
      }] body: ${await response.text()}`
    )
  }

  return response
}
