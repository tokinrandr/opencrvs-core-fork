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
import { EVENT_TYPE } from '@opencrvs/commons/types'
import { ActionIdentifier, ACTIONS } from '@opencrvs/commons/state-transitions'
import { model, Schema, Document } from 'mongoose'

export interface IWebhook {
  webhookId: string
  address: string
  createdBy: string
  createdAt: number
  action: ActionIdentifier
  event: EVENT_TYPE
}

export interface IWebhookModel extends IWebhook, Document {}

const webhookSchema = new Schema({
  webhookId: { type: String, required: true },
  address: { type: String, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Number, default: Date.now },
  action: { type: String, required: true, enum: ACTIONS },
  event: { type: String, required: true, enum: Object.values(EVENT_TYPE) }
})

export default model<IWebhookModel>('Webhook', webhookSchema)
