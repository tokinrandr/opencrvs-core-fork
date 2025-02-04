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
import { IFormData } from '@client/forms'
import { transformStatusData } from '@client/forms/register/mappings/query/utils'
import { EventType } from '@client/utils/gateway'
import type { GQLRegWorkflow } from '@client/utils/gateway-deprecated-do-not-use'

export function getDeathRegistrationSectionTransformer(
  transformedData: IFormData,
  queryData: any,
  _sectionId: string
) {
  if (!transformedData['registration']) {
    transformedData['registration'] = {}
  }

  if (queryData['registration'].id) {
    transformedData['registration']._fhirID = queryData['registration'].id
  }
  if (queryData['registration'].trackingId) {
    transformedData['registration'].trackingId =
      queryData['registration'].trackingId
  }

  if (queryData['registration'].registrationNumber) {
    transformedData['registration'].registrationNumber =
      queryData['registration'].registrationNumber
  }

  if (
    queryData['registration'].type &&
    queryData['registration'].type === 'DEATH'
  ) {
    transformedData['registration'].type = EventType.Death
  }

  if (queryData['registration'].status) {
    transformStatusData(
      transformedData,
      queryData['registration'].status as GQLRegWorkflow[],
      'registration'
    )
  }
}
