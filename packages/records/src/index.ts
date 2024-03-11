import { createServer } from './server'

createServer().then(async (server) => {
  await server.start()
})
