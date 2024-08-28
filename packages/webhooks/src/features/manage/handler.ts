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
import * as Hapi from '@hapi/hapi'
import * as Joi from 'joi'
import {
  getTokenPayload,
  getSystem,
  ISystem,
  ITokenPayload,
  generateChallenge
} from '@webhooks/features/manage/service'
import Webhook from '@webhooks/model/webhook'
import { logger } from '@opencrvs/commons'
import { ActionIdentifier, ACTIONS } from '@opencrvs/commons/state-transitions'
import * as uuid from 'uuid/v4'
import fetch from 'node-fetch'
import { resolve } from 'url'
import { EVENT_TYPE } from '@webhooks/../../commons/build/dist/record'

const actionAndEventToTopic = (action: ActionIdentifier, event: EVENT_TYPE) => {
  return `http://opencrvs.org/specs/webhooks/${event}/${action}`
}

const ALL_TOPICS = Object.values(EVENT_TYPE).flatMap((event) =>
  Object.values(ACTIONS).map((action) => actionAndEventToTopic(action, event))
)

type Topic = `http://opencrvs.org/specs/webhooks/${string}/${string}`

const topicToActionAndEvent = (topic: Topic) => {
  const topicParts = topic.split('/')
  return {
    action: topicParts.at(-1)!,
    event: topicParts.at(-2)!
  }
}

interface IHub {
  callback: string
  mode: string
  topic: Topic
  secret: string
}

interface ISubscribePayload {
  hub: IHub
}

/**
 * Subscribe to a webhook. The responses are based on [WebSub spec](https://www.w3.org/TR/websub/)
 */
export async function subscribeWebhooksHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { hub } = request.payload as ISubscribePayload
  const { action, event } = topicToActionAndEvent(hub.topic)

  if (!ALL_TOPICS.includes(hub.topic)) {
    return h
      .response({
        hub: {
          mode: 'denied',
          topic: hub.topic,
          reason: `Unsupported topic: ${hub.topic}`
        }
      })
      .code(400)
  }

  const token = getTokenPayload(request.headers.authorization.split(' ')[1])
  const systemId = token.sub

  const system: ISystem = await getSystem(
    { systemId },
    request.headers.authorization
  )
  if (!system || system.status !== 'active') {
    return h
      .response({
        hub: {
          mode: 'denied',
          topic: hub.topic,
          reason:
            'Active system details cannot be found.  This system is no longer authorized'
        }
      })
      .code(400)
  }

  if (hub.secret !== system.sha_secret) {
    return h
      .response({
        hub: {
          mode: 'denied',
          topic: hub.topic,
          reason: 'hub.secret is incorrect'
        }
      })
      .code(400)
  }

  if (hub.mode !== 'subscribe') {
    return h
      .response({
        hub: {
          mode: 'denied',
          topic: hub.topic,
          reason: 'hub.mode must be set to subscribe'
        }
      })
      .code(400)
  }
  const webhookId = uuid()
  const challenge = generateChallenge()

  // The purpose of a challenge check is to verify you own the URL
  const challengeCheck = await fetch(
    resolve(
      hub.callback,
      `?mode=subscribe&challenge=${encodeURIComponent(challenge)}&topic=${
        hub.topic
      }`
    ),
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )

  if (challengeCheck.status !== 200) {
    logger.error(
      `Challenge endpoint returned non 200 status code: ${await challengeCheck.text()}`
    )

    return h
      .response(`Challenge was not equal. Subscription endpoint check failed`)
      .code(400)
  }

  const response = await challengeCheck.text()

  if (challenge !== response) {
    logger.error(
      `${challenge} is not equal to ${response}. Subscription endpoint check failed`
    )
    return h
      .response(`Challenge was not equal. Subscription endpoint check failed`)
      .code(400)
  }

  const webhook = {
    id: webhookId,
    createdBy: system.client_id,
    address: hub.callback,
    action,
    event
  }

  await Webhook.create(webhook)

  return h.response(challenge).code(200)
}

export const reqSubscribeWebhookSchema = Joi.object({
  hub: Joi.object({
    callback: Joi.string(),
    mode: Joi.string(),
    topic: Joi.string(),
    secret: Joi.string()
  })
})

export async function listWebhooksHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const token: ITokenPayload = getTokenPayload(
    request.headers.authorization.split(' ')[1]
  )
  const systemId = token.sub
  const system: ISystem = await getSystem(
    { systemId },
    request.headers.authorization
  )

  if (!system || system.status !== 'active') {
    return h
      .response(
        'Active system details cannot be found.  This system is no longer authorized'
      )
      .code(400)
  }

  const webhooks = await Webhook.find({
    createdBy: system.client_id
  }).sort({
    createdAt: 'asc'
  })

  const entries = webhooks.map((webhook) => ({
    id: webhook.id,
    callback: webhook.address,
    createdAt: new Date((webhook.createdAt as number) * 1000).toISOString(),
    createdBy: {
      client_id: system.client_id,
      name: system.name,
      type: system.type,
      username: system.username
    },
    topic: actionAndEventToTopic(webhook.action, webhook.event)
  }))

  return h.response({ entries }).code(200)
}

export async function deleteWebhookHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const webhookId = request.params.webhookId
  if (!webhookId) {
    return h.response('No webhook id in URL params').code(400)
  }
  try {
    await Webhook.findOneAndRemove({ id: webhookId })
  } catch (err) {
    return h.response(`Could not delete webhook: ${webhookId}`).code(400)
  }
  return h.response().code(204)
}

interface IDeleteWebhooksByClientIdPayload {
  clientId: string
}

export async function deleteWebhookByClientIdHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { clientId } = request.payload as IDeleteWebhooksByClientIdPayload
  if (!clientId) {
    return h.response('No clientId in URL params').code(400)
  }

  try {
    await Webhook.deleteMany({ createdBy: clientId })
  } catch (err) {
    logger.info(
      `Could not delete webhooks associated with client_id: ${clientId}`
    )
  }
  return h.response().code(204)
}
