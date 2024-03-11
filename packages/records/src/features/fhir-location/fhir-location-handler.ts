import * as z from 'zod'
import * as Hapi from '@hapi/hapi'
import { getLocationById } from '@records/database'
import { fhirLocation } from '@records/fhir-builders/location'

const paramsSchema = z.object({
  id: z.string().uuid()
})

export const fhirLocationHandler = async (
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) => {
  const { id } = paramsSchema.parse(request.params)

  const location = await getLocationById(id)
  const locationAsFhir = fhirLocation({
    id: location.id,
    partOf: location.parent_id,
    primaryLanguage: 'en',
    level: location.level,
    type: 'ADMIN_STRUCTURE',
    lastUpdated: location.updated_at,
    status: 'active',
    translations: {
      en: 'Nummela'
    }
  })

  return locationAsFhir
}
