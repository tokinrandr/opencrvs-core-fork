import fetch from 'node-fetch'
import { COUNTRY_CONFIG_HOST } from './constants'
import { TypeOf, z } from 'zod'

const LocationSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    alias: z.string().optional(),
    partOf: z.string(),
    locationType: z.enum(['ADMIN_STRUCTURE', 'HEALTH_FACILITY', 'CRVS_OFFICE']),
    jurisdictionType: z
      .enum([
        'STATE',
        'DISTRICT',
        'LOCATION_LEVEL_3',
        'LOCATION_LEVEL_4',
        'LOCATION_LEVEL_5'
      ])
      .optional(),
    statistics: z
      .array(
        z.object({
          year: z.number(),
          male_population: z.number(),
          female_population: z.number(),
          population: z.number(),
          crude_birth_rate: z.number()
        })
      )
      .optional()
  })
)

async function getLocations() {
  const url = new URL('locations', COUNTRY_CONFIG_HOST).toString()
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Expected to get the locations from ${url}`)
  }
  const parsedLocations = LocationSchema.parse(await res.json())
}
