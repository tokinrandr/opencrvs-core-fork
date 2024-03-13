import * as z from 'zod'
import * as Hapi from '@hapi/hapi'
import { fhirLocation } from '@records/fhir-builders/location'
import { getDefaultLanguage } from '@records/database/languages'
import { getAdministrativeRegionById } from '@records/database/administrative-regions'

const paramsSchema = z.object({
  id: z.string().uuid()
})

export const getFhirLocationHandler = async (
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) => {
  const { id } = paramsSchema.parse(request.params)

  const location = await getAdministrativeRegionById(id)
  const defaultLanguage = await getDefaultLanguage()
  const locationAsFhir = fhirLocation({
    id: location.id,
    partOf: location.parentId,
    defaultLanguage,
    level: location.level,
    type: 'ADMIN_STRUCTURE',
    lastUpdated: location.updatedAt,
    status: 'active',
    translations: location.translations
  })

  return locationAsFhir
}
