import { UUID } from '@opencrvs/commons'
import { Location } from '@opencrvs/commons/types'

type LocationInput<Translations = Record<string, string>> = {
  id: UUID
  partOf: UUID
  translations: Translations
  defaultLanguage: keyof Translations
  type: 'ADMIN_STRUCTURE' | 'HEALTH_FACILITY' | 'CRVS_OFFICE'
  level?: number
  lastUpdated: string
  status: 'active' | 'inactive'
}

export const fhirLocation = ({
  id,
  partOf,
  translations,
  defaultLanguage,
  type,
  level,
  lastUpdated,
  status
}: LocationInput) => {
  const physicalTypeCoding =
    type === 'ADMIN_STRUCTURE'
      ? {
          code: 'jdn',
          display: 'Jurisdiction'
        }
      : { code: 'bu', display: 'Building' }

  const locationLevel = level
    ? [
        {
          system: 'http://opencrvs.org/specs/id/jurisdiction-type',
          value: `LOCATION_LEVEL_${level}`
        }
      ]
    : []

  return {
    id,
    resourceType: 'Location',
    identifier: [
      // @TODO ?
      // {
      //   system: 'http://opencrvs.org/specs/id/statistical-code',
      //   value: 'ADMIN_STRUCTURE_ELC'
      // },
      ...locationLevel
    ],
    name: translations[defaultLanguage],
    alias: [],
    status,
    mode: 'instance',
    partOf: {
      reference: `Location/${partOf}`
    },
    type: {
      coding: [
        {
          system: 'http://opencrvs.org/specs/location-type',
          code: type
        }
      ]
    },
    physicalType: {
      coding: [physicalTypeCoding]
    },
    extension: [],
    meta: {
      lastUpdated
    }
  } satisfies Location
}
