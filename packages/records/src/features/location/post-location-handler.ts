import * as Hapi from '@hapi/hapi'
import * as db from '@records/database/database'
import {
  getDefaultLanguage,
  getSecondaryLanguages
} from '@records/database/languages'
import * as z from 'zod'

const payloadSchema = z.object({
  statisticalID: z.string(),
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

export const postFhirLocationHandler = async (request: Hapi.Request) => {
  const { name, alias } = payloadSchema.parse(request.payload)

  try {
    await db.query('BEGIN;')
    const defaultLanguage = await getDefaultLanguage()
    // Note! The FHIR endpoint only supports 2 languages.
    const [secondaryLanguage] = await getSecondaryLanguages()

    const response = await db.query<{ id: string; parentId: string }>(
      'INSERT INTO config.administrative_regions DEFAULT VALUES RETURNING id, parent_id AS "parentId";'
    )
    await db.query(
      'INSERT INTO config.administrative_regions_translations (administrative_region_id, language_code, translation) VALUES ($1, $2, $3);',
      [response.rows[0].id, defaultLanguage, name]
    )
    await db.query(
      'INSERT INTO config.administrative_regions_translations (administrative_region_id, language_code, translation) VALUES ($1, $2, $3);',
      [response.rows[0].id, secondaryLanguage, alias]
    )
    await db.query('COMMIT;')
  } catch (e) {
    await db.query('ROLLBACK;')
    throw e
  }
}
