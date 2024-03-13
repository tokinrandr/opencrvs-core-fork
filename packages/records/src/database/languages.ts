import * as db from './database'

export const getDefaultLanguage = async () => {
  const response = await db.query<{ code: string }>(
    `SELECT code FROM config.languages WHERE is_default IS TRUE`
  )

  return response.rows[0].code
}

export const getSecondaryLanguages = async () => {
  const response = await db.query<{ code: string }>(
    `SELECT code FROM config.languages WHERE is_default IS FALSE`
  )

  return response.rows.map(({ code }) => code)
}
