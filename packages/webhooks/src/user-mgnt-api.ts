import { IAuthHeader } from '@opencrvs/commons'
import { USER_MANAGEMENT_URL } from './constants'
import { ISystem } from './features/manage/service'

export const fetchSystem = async (
  clientId: string,
  authHeader: IAuthHeader
) => {
  const response = await fetch(`${USER_MANAGEMENT_URL}getSystem`, {
    method: 'POST',
    body: JSON.stringify({ clientId }),
    headers: {
      'Content-Type': 'application/json',
      ...authHeader
    }
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch system integration details: ${await response.text()}`
    )
  }

  return (await response.json()) as ISystem
}
