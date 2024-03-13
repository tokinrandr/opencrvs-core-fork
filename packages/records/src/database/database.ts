import { Pool, QueryConfig, QueryResultRow } from 'pg'
import { DATABASE } from '@records/constants'

const pool = new Pool({
  user: 'postgres',
  password: 'postgres',
  database: DATABASE
})

export const query = <R extends QueryResultRow = any, I extends any[] = any[]>(
  queryTextOrConfig: string | QueryConfig<I>,
  values?: I
) => {
  return pool.query<R, I>(queryTextOrConfig, values)
}

export const connect = () => pool.connect()
