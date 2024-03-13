import * as Hapi from '@hapi/hapi'
import { ZodError } from 'zod'
import { fromZodError } from 'zod-validation-error'
import { DEFAULT_TIMEOUT_MS, HOST, PORT } from './constants'
import { error } from './error'
import { routes } from './routes'

export async function createServer() {
  const server = new Hapi.Server({
    host: HOST,
    port: PORT,
    routes: {
      cors: { origin: ['*'] },
      payload: { maxBytes: 52428800, timeout: DEFAULT_TIMEOUT_MS }
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

    server.log('info', `Records API started on ${HOST}:${PORT}`)
  }

  async function stop() {
    await server.stop()
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
