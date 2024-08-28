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
import {
  ATTACHMENT_DOCS_CODE,
  CHILD_CODE,
  CompositionSectionCode,
  DEATH_ENCOUNTER_CODE,
  DECEASED_CODE,
  EVENT_TYPE,
  FATHER_CODE,
  getComposition,
  getEventType,
  INFORMANT_CODE,
  isTask,
  MOTHER_CODE,
  resourceIdentifierToUUID,
  ValidRecord
} from '@opencrvs/commons/types'
import { ISystem } from './features/manage/service'

export const NATIONAL_ID_BIRTH_PERMISSIONS = [
  MOTHER_CODE,
  FATHER_CODE,
  CHILD_CODE,
  ATTACHMENT_DOCS_CODE,
  INFORMANT_CODE
] as CompositionSectionCode[]

export const NATIONAL_ID_DEATH_PERMISSIONS = [
  DECEASED_CODE,
  ATTACHMENT_DOCS_CODE,
  INFORMANT_CODE,
  DEATH_ENCOUNTER_CODE
] as CompositionSectionCode[]

/** @TODO: Save the EVENT_TYPE to Mongo instead of the custom event type */
const MAP_EVENT_TYPE_TO_WEBHOOK_EVENT_TYPE = {
  [EVENT_TYPE.BIRTH]: 'birth',
  [EVENT_TYPE.DEATH]: 'death',
  [EVENT_TYPE.MARRIAGE]: 'marriage'
} satisfies Record<EVENT_TYPE, string>

const filterRecordByCompositionSections = (
  record: ValidRecord,
  permittedCompositionSectionCodes: CompositionSectionCode[]
) => {
  const composition = getComposition(record)
  const allowedSections = composition.section.filter((section) =>
    section.code.coding.some(({ code }) =>
      permittedCompositionSectionCodes.includes(code)
    )
  )
  const allowedReferences = allowedSections.flatMap((section) =>
    section.entry.map(({ reference }) => resourceIdentifierToUUID(reference))
  )

  return {
    ...record,
    entry: record.entry.filter(
      ({ resource }) =>
        allowedReferences.includes(resource.id) || isTask(resource)
    ) satisfies ValidRecord['entry']
  } as ValidRecord
}

export const filterRecordBySystemPermissions = async (
  system: ISystem,
  record: ValidRecord
) => {
  const event = getEventType(record)

  if (system.type === 'nationalId' && event === EVENT_TYPE.BIRTH) {
    return filterRecordByCompositionSections(
      record,
      NATIONAL_ID_BIRTH_PERMISSIONS
    )
  }

  if (system.type === 'nationalId' && event === EVENT_TYPE.DEATH) {
    return filterRecordByCompositionSections(
      record,
      NATIONAL_ID_DEATH_PERMISSIONS
    )
  }

  const permissions =
    system.settings.webhook.find(
      (x) => x.event === MAP_EVENT_TYPE_TO_WEBHOOK_EVENT_TYPE[event]
    )?.permissions ?? []

  return filterRecordByCompositionSections(record, permissions)
}
