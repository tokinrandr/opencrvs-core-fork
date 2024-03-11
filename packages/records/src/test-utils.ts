import { readFileSync } from 'node:fs'
import { client } from './database'

export async function cleanDatabase() {
  await client.query('DROP TABLE IF EXISTS config.languages;')
  await client.query('DROP TABLE IF EXISTS config.administrative_regions;')
  await client.query(
    'DROP TABLE IF EXISTS config.administrative_regions_translations;'
  )
  await client.query('DROP TABLE IF EXISTS config.locations;')
  await client.query('DROP TABLE IF EXISTS auth.system_roles;')
  await client.query('DROP TABLE IF EXISTS auth.scopes;')
  await client.query('DROP TABLE IF EXISTS auth.user_roles;')
  await client.query('DROP TABLE IF EXISTS auth.user_role_translations;')
  await client.query('DROP TABLE IF EXISTS auth.system_roles_user_roles;')
  await client.query('DROP TABLE IF EXISTS auth.users;')
  await client.query('DROP TABLE IF EXISTS auth.users_scopes;')
  await client.query('DROP TABLE IF EXISTS auth.records;')
  await client.query('DROP TABLE IF EXISTS locations;')
  await client.query('DROP TABLE IF EXISTS task;')

  await client.query(readFileSync('./migrations/0001-config.sql').toString())
  await client.query(readFileSync('./migrations/0002-auth.sql').toString())
}
