import { UUID } from '@opencrvs/commons'
import * as db from './database'

type AdministrativeRegionRow = {
  id: UUID
  parentId: UUID
  createdAt: string
  updatedAt: string
  translations: Record<string, string>
}

const RECURSIVE_ADMININSTRATIVE_REGION_TREE_WITH_TRANSLATIONS_QUERY = `
WITH regions AS (
  WITH RECURSIVE path_cte AS (
    -- Base case: Select the initial node and its information
    SELECT
      id,
      parent_id,
      created_at,
      updated_at,
      1 AS depth -- Start counting at 1
    FROM
      config.administrative_regions
    WHERE
      id = $1

    UNION ALL

    -- Recursive step: Join with the parent to continue tracking the hierarchy
    SELECT
      ar.id,
      ar.parent_id,
      ar.created_at,
      ar.updated_at,
      pc.depth + 1 AS depth
    FROM
      config.administrative_regions ar
    JOIN path_cte pc ON ar.id = pc.parent_id -- Join on parent_id
  )
  -- Select all rows from the CTE, which includes the initial node and all its ancestors up to the root
  SELECT
    id,
    parent_id,
    created_at,
    updated_at,
    depth
  FROM path_cte
)
-- Aggregate translations to a Record<string, string> with JSONB_OBJECT_AGG
SELECT
  r.id,
  r.parent_id AS "parentId",
  r.created_at AS "createdAt",
  r.updated_at AS "updatedAt",
  JSONB_OBJECT_AGG(rt.language_code, rt.translation) AS translations
FROM
  regions r
LEFT JOIN
  config.administrative_regions_translations rt ON r.id = rt.administrative_region_id
GROUP BY
  r.id, r.parent_id, r.created_at, r.updated_at, r.depth
ORDER BY r.depth ASC
`

export const getAdministrativeRegionTreeById = async (id: string) => {
  const response = await db.query<AdministrativeRegionRow>(
    RECURSIVE_ADMININSTRATIVE_REGION_TREE_WITH_TRANSLATIONS_QUERY,
    [id]
  )

  return response.rows
}

export const getAdministrativeRegionById = async (id: string) => {
  const [region, ...parents] = await getAdministrativeRegionTreeById(id)
  return { ...region, level: parents.length + 1 }
}

export const getAllAdministrativeRegions = async (
  limit?: number,
  offset = 0
) => {
  const client = await db.connect()

  await client.query('BEGIN')
  const total = await client.query<{ total: string }>(
    'SELECT COUNT(*) AS total FROM config.administrative_regions;'
  )
  const response = await client.query<AdministrativeRegionRow>(
    `
SELECT
  id,
  parent_id,
  created_at AS "createdAt",
  updated_at AS "updatedAt",
  JSONB_OBJECT_AGG(rt.language_code, rt.translation) AS translations
FROM
  config.administrative_regions r
LEFT JOIN
  config.administrative_regions_translations rt ON r.id = rt.administrative_region_id
GROUP BY
  r.id, r.parent_id, r.created_at, r.updated_at
LIMIT $1
OFFSET $2
`,
    [limit ?? 'ALL', offset]
  )
  await client.query('COMMIT')

  return {
    administrativeRegions: response.rows,
    total: Number(total.rows[0].total)
  }
}
