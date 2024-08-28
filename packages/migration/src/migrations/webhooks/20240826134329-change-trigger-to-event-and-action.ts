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

import { Db, MongoClient } from 'mongodb'

// Earlier, the webhook trigger was a string 'BIRTH_REGISTERED', 'DEATH_REGISTERED', etc.
// Now, the webhook has an action e.g. 'ISSUE', 'REGISTER', and event type e.g. 'BIRTH', 'DEATH'

export type RecordEvent =
  | 'sent-notification'
  | 'sent-notification-for-review'
  | 'sent-for-approval'
  | 'waiting-external-validation'
  | 'registered'
  | 'certified'
  | 'issued'
  | 'sent-for-updates'
  | 'archived'
  | 'reinstated'
  | 'updated'
  | 'marked-as-duplicate'
  | 'viewed'
  | 'not-duplicate'
  | 'downloaded'
  | 'assigned'
  | 'unassigned'

export const up = async (db: Db, client: MongoClient) => {
  await db.collection('webhooks').updateMany(
    {
      trigger: {
        $in: [
          'BIRTH_REGISTERED',
          'DEATH_REGISTERED',
          'BIRTH_CERTIFIED',
          'DEATH_CERTIFIED',
          'BIRTH_CORRECTED',
          'DEATH_CORRECTED'
        ]
      }
    },
    [
      {
        $set: {
          event: {
            $switch: {
              branches: [
                {
                  case: {
                    $in: [
                      '$trigger',
                      ['BIRTH_REGISTERED', 'BIRTH_CERTIFIED', 'BIRTH_CORRECTED']
                    ]
                  },
                  then: 'birth'
                },
                {
                  case: {
                    $in: [
                      '$trigger',
                      ['DEATH_REGISTERED', 'DEATH_CERTIFIED', 'DEATH_CORRECTED']
                    ]
                  },
                  then: 'death'
                }
              ],
              default: '$event'
            }
          },
          action: {
            $switch: {
              branches: [
                {
                  case: {
                    $in: ['$trigger', ['BIRTH_REGISTERED', 'DEATH_REGISTERED']]
                  },
                  then: 'REGISTER'
                },
                {
                  case: {
                    $in: ['$trigger', ['BIRTH_CERTIFIED', 'DEATH_CERTIFIED']]
                  },
                  then: 'CERTIFY'
                },
                {
                  case: {
                    $in: ['$trigger', ['BIRTH_CORRECTED', 'DEATH_CORRECTED']]
                  },
                  then: 'CORRECT'
                }
              ],
              default: '$action'
            }
          },
          createdBy: '$createdBy.client_id'
        }
      },
      {
        $unset: 'trigger'
      },
      {
        $unset: 'sha_secret'
      },
      {
        $rename: {
          webhookId: 'id'
        }
      }
    ]
  )
}

export const down = async (db: Db, client: MongoClient) => {
  await db.collection('webhooks').updateMany(
    {
      event: { $in: ['birth', 'death'] },
      action: { $in: ['REGISTER', 'CERTIFY', 'CORRECT'] }
    },
    [
      {
        $set: {
          trigger: {
            $concat: [
              '$event',
              '_',
              {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ['$action', 'REGISTER'] },
                      then: 'REGISTERED'
                    },
                    {
                      case: { $eq: ['$action', 'CERTIFY'] },
                      then: 'CERTIFIED'
                    },
                    { case: { $eq: ['$action', 'CORRECT'] }, then: 'CORRECTED' }
                  ],
                  default: ''
                }
              }
            ]
          },
          createdBy: { client_id: '$createdBy' }
        }
      }
    ]
  )

  // NOTE! This will delete all webhooks created after running this migration up
  await db.collection('webhooks').deleteMany({
    $or: [
      { event: { $nin: ['birth', 'death'] } },
      { action: { $nin: ['REGISTER', 'CERTIFY', 'CORRECT'] } }
    ]
  })
}
