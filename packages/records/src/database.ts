import { UUID } from '@opencrvs/commons'
import { Client } from 'pg'
import { DATABASE } from './constants'

export const client = new Client({
  user: 'postgres',
  password: 'postgres',
  database: DATABASE
})

type LocationRow = {
  id: UUID
  parent_id: UUID
  created_at: string
  updated_at: string
  depth: number
}

export const getLocationTreeById = async (id: string) => {
  const query = await client.query<LocationRow>(
    `
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
ORDER BY depth ASC;
`,
    [id]
  )

  console.log(query.rows)

  return query.rows
}

export const getLocationById = async (id: string) => {
  const locationTree = await getLocationTreeById(id)
  return { ...locationTree[0], level: locationTree.length }
}
