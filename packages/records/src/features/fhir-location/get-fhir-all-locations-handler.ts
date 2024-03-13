import * as z from 'zod'
import * as Hapi from '@hapi/hapi'
import { getAllAdministrativeRegions } from '@records/database/administrative-regions'
import { fhirLocation } from '@records/fhir-builders/location'
import { getDefaultLanguage } from '@records/database/languages'

const paramsSchema = z.object({
  type: z.enum(['ADMIN_STRUCTURE', 'HEALTH_FACILITY', 'CRVS_OFFICE']),
  _count: z.coerce.number().optional().default(20),
  _getpagesoffset: z.coerce.number().optional().default(0)
})

export const getFhirAllLocationsHandler = async (
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) => {
  const { type, _count, _getpagesoffset } = paramsSchema.parse(request.query)

  if (type === 'ADMIN_STRUCTURE') {
    const defaultLanguage = await getDefaultLanguage()
    const { administrativeRegions } = await getAllAdministrativeRegions(
      _count,
      _getpagesoffset
    )
    return administrativeRegions.map((administrativeRegion) =>
      fhirLocation({
        id: administrativeRegion.id,
        partOf: administrativeRegion.parentId,
        defaultLanguage,
        type: 'ADMIN_STRUCTURE',
        lastUpdated: administrativeRegion.updatedAt,
        status: 'active',
        translations: administrativeRegion.translations
      })
    )
  }

  return null
}
