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

import { IAuthHeader, UUID } from '@opencrvs/commons'

import { GQLResolver, GQLSignatureInput } from '@gateway/graphql/schema'
import {
  Bundle,
  Extension,
  OPENCRVS_SPECIFICATION_URL,
  findExtension,
  PractitionerRole,
  ResourceIdentifier,
  resourceIdentifierToUUID
} from '@opencrvs/commons/types'
import { fetchFHIR } from '@gateway/features/fhir/service'
import { getPresignedUrlFromUri } from '@gateway/features/registration/utils'
interface IAuditHistory {
  auditedBy: string
  auditedOn: number
  action: string
  reason: string
  comment?: string
}

interface IAvatar {
  type: string
  data: string
}

type Label = {
  lang: string
  label: string
}
interface IUserRole {
  labels: Label[]
}

export interface IUserModelData {
  _id: string
  username: string
  name: {
    use: string
    family: string
    given: string[]
  }[]
  scope?: string[]
  email: string
  emailForNotification?: string
  mobile?: string
  status: string
  systemRole: string
  role: IUserRole
  creationDate?: string
  practitionerId: string
  primaryOfficeId: string
  device: string
  auditHistory?: IAuditHistory[]
  avatar?: IAvatar
}

export interface ISystemModelData {
  scope?: string[]
  name: string
  createdBy: string
  client_id: string
  username: string
  status: string
  sha_secret: string
  type: 'HEALTH'
  practitionerId: string
  settings: {
    dailyQuota: number
  }
}

export function isSystem(
  systemOrUser: IUserModelData | ISystemModelData
): systemOrUser is ISystemModelData {
  return (systemOrUser as ISystemModelData).client_id !== undefined
}

export interface IUserPayload
  extends Omit<
    IUserModelData,
    '_id' | 'status' | 'practitionerId' | 'username' | 'identifiers' | 'role'
  > {
  id?: string
  systemRole: string
  status?: string
  username?: string
  password?: string
  role: string
  signature?: GQLSignatureInput
}

export interface IUserSearchPayload {
  username?: string
  mobile?: string
  status?: string
  systemRole?: string
  primaryOfficeId?: string
  locationId?: string
  count: number
  skip: number
  sortOrder: string
}

async function getPractitionerByOfficeId(
  primaryOfficeId: string,
  authHeader: IAuthHeader
) {
  const roleBundle: Bundle = await fetchFHIR(
    `/PractitionerRole?location=${primaryOfficeId}&role=LOCAL_REGISTRAR`,
    authHeader
  )

  const practitionerRole =
    roleBundle &&
    roleBundle.entry &&
    roleBundle.entry &&
    roleBundle.entry.length > 0 &&
    (roleBundle.entry[0].resource as PractitionerRole)

  const roleCode =
    practitionerRole &&
    practitionerRole.code &&
    practitionerRole.code.length > 0 &&
    practitionerRole.code[0].coding &&
    practitionerRole.code[0].coding[0].code

  return {
    practitionerId:
      practitionerRole && practitionerRole.practitioner
        ? (practitionerRole.practitioner.reference as ResourceIdentifier)
        : undefined,
    practitionerRole: roleCode || undefined
  }
}

export function getSignatureExtension(extensions: Extension[] | undefined) {
  return findExtension(
    `${OPENCRVS_SPECIFICATION_URL}extension/employee-signature`,
    extensions || []
  )
}

export const userTypeResolvers: GQLResolver = {
  User: {
    id(userModel: IUserModelData) {
      return userModel._id
    },
    userMgntUserID(userModel: IUserModelData) {
      return userModel._id
    },
    underInvestigation(userModel: IUserModelData) {
      return (
        userModel &&
        userModel.status &&
        userModel.status === 'deactivated' &&
        userModel.auditHistory &&
        userModel.auditHistory[userModel.auditHistory.length - 1].reason ===
          'SUSPICIOUS'
      )
    },
    email(userModel: IUserModelData) {
      return userModel.emailForNotification
    },
    async primaryOffice(userModel: IUserModelData, _, { dataSources }) {
      return dataSources.locationsAPI.getLocation(userModel.primaryOfficeId)
    },
    async localRegistrar(
      userModel: IUserModelData,
      _,
      { headers: authHeader, dataSources }
    ) {
      const scope = userModel.scope

      if (!scope) {
        return null
      }

      const { practitionerId, practitionerRole } = !scope.includes('register')
        ? await getPractitionerByOfficeId(userModel.primaryOfficeId, authHeader)
        : {
            practitionerId: `Practitioner/${
              userModel.practitionerId as UUID
            }` as const,
            practitionerRole: userModel.systemRole
          }

      if (!practitionerId) {
        return
      }

      const practitioner = await dataSources.fhirAPI.getPractitioner(
        resourceIdentifierToUUID(practitionerId)
      )

      if (!practitioner) {
        return
      }

      const signatureExtension = getSignatureExtension(practitioner.extension)

      const presignedUrl =
        userModel.systemRole === 'FIELD_AGENT'
          ? null
          : signatureExtension &&
            (await getPresignedUrlFromUri(
              signatureExtension.valueAttachment.url,
              authHeader
            ))
      return {
        role: practitionerRole,
        name: practitioner.name,
        signature: presignedUrl
      }
    },
    async signature(
      userModel: IUserModelData,
      _,
      { headers: authHeader, dataSources }
    ) {
      const practitioner = await dataSources.fhirAPI.getPractitioner(
        userModel.practitionerId
      )

      const signatureExtension = getSignatureExtension(practitioner.extension)

      const presignedUrl =
        signatureExtension &&
        (await getPresignedUrlFromUri(
          signatureExtension.valueAttachment.url,
          authHeader
        ))

      if (!presignedUrl) return null

      return {
        type: signatureExtension.valueAttachment.contentType,
        data: presignedUrl
      }
    }
  },

  Avatar: {
    async data(avatar: IAvatar, _, { dataSources }) {
      if (avatar.data) {
        const { presignedURL } = await dataSources.minioAPI.getStaticData(
          avatar.data
        )
        return presignedURL
      }
      return null
    }
  }
}
