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

import { UUID } from '@opencrvs/commons'
import { query } from '@metrics/influxdb/client'
import { fetchChildLocationIds } from '@metrics/utils/location'

export async function getAllTotalCertifications(
  timeFrom: string,
  timeTo: string
) {
  return query<Array<{ total: number; eventType: string }>>(
    `SELECT COUNT(DISTINCT(compositionId)) AS total
      FROM certification
    WHERE time > $timeFrom
      AND time <= $timeTo
    GROUP BY eventType`,
    {
      placeholders: {
        timeFrom,
        timeTo
      }
    }
  )
}

export async function getTotalCertifications(
  timeFrom: string,
  timeTo: string,
  locationId: UUID
) {
  const locationIds = await fetchChildLocationIds(locationId)
  const totalMetrics = await query<Array<{ total: number; eventType: string }>>(
    `SELECT COUNT(DISTINCT(compositionId)) AS total
      FROM certification
    WHERE time > $timeFrom
      AND time <= $timeTo
      AND officeLocation IN ($locationIds)
    GROUP BY eventType`,
    {
      placeholders: {
        locationIds,
        timeFrom,
        timeTo
      }
    }
  )

  return totalMetrics
}
