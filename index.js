const app = require('./app') // the actual Express application
const config = require('./utils/config')
const logger = require('./utils/logger')

require('dotenv').config()
var morgan = require('morgan')
app.use(morgan('tiny'))

morgan.token('person', (req) => {
  return req.method === 'POST' ? JSON.stringify(req.body) : ''
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :person'))

app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`)
})
