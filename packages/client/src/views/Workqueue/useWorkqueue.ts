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
import { useQuery, useReadQuery } from '@apollo/client'
import { useWorkqueueParams } from '@client/hooks/useTypedParams'
import { WORKQUEUE_QUERY } from './workqueueQueries'

/** TODO: Fetch this from gateway, which fetches it from config/country-config */
const WORKQUEUE_DEFINITION = [
  {
    slug: 'in-progress',
    name: 'In progress',
    query: { registrationStatuses: ['IN_PROGRESS'] }
  },
  {
    slug: 'correction-needed',
    name: 'Correction needed',
    query: { registrationStatuses: ['CORRECTION_REQUESTED'] }
  }
]

export const useWorkqueue = () => {
  const { slug } = useWorkqueueParams()
  const currentWorkqueue = WORKQUEUE_DEFINITION.find(
    (workqueue) => workqueue.slug === slug
  )
  const { data } = useQuery(WORKQUEUE_QUERY, {
    variables: currentWorkqueue?.query,
    skip: Boolean(currentWorkqueue)
  })

  return { data }
}
