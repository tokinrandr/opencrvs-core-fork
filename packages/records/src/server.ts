import * as Hapi from '@hapi/hapi'
import { HOST, PORT, DEFAULT_TIMEOUT_MS, NODE_ENV } from './constants'
import { routes } from './routes'
import pino from 'hapi-pino'
import { error } from './error'
import { client } from './database'
import { ZodError } from 'zod'
import { fromZodError } from 'zod-validation-error'

export async function createServer() {
  const server = new Hapi.Server({
    host: HOST,
    port: PORT,
    routes: {
      cors: { origin: ['*'] },
      payload: { maxBytes: 52428800, timeout: DEFAULT_TIMEOUT_MS }
    }
  })

  await server.register({
    // @TODO why as any, works in dci crvs api
    plugin: pino,
    options: {
      redact: ['req.headers.authorization'],
      ...(NODE_ENV === 'production'
        ? {}
        : {
            transport: {
              target: 'pino-pretty'
            }
          })
    }
  })

  server.route(routes)

  server.ext('onPreResponse', (request, reply) => {
    if (request.response instanceof ZodError) {
      return error(reply, fromZodError(request.response).toString(), 400)
    }

    if ('isBoom' in request.response) {
      console.error(request.response)
      return error(
        reply,
        request.response.output.payload.error,
        request.response.output.statusCode
      )
    }

    return reply.continue
  })

  async function start() {
    await server.start()
    await client.connect()

    server.log('info', `Records API started on ${HOST}:${PORT}`)
  }

  async function stop() {
    await server.stop()
    await client.end()
    server.log('info', 'Search server stopped')
  }

  async function init() {
    await server.initialize()
    return server
  }

  return { start, init, stop }
}

export interface ReqResWithAuthorization extends Hapi.ReqRefDefaults {
  Headers: { authorization?: string }
}
