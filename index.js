var express = require('express')
var morgan = require('morgan')
const cors = require('cors')

var app = express()

app.use(express.static('dist'))
app.use(cors())
app.use(morgan('tiny'))
app.use(express.json())

morgan.token('person', (req) => {
  return req.method === 'POST' ? JSON.stringify(req.body) : ''
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :person'))


const mongoose = require('mongoose')
require('dotenv').config()

mongoose.set('strictQuery',false)

const url = process.env.MONGODB_URI

console.log('connecting to', url)

mongoose.connect(url)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch(error => {
    console.log('error connecting to MongoDB:', error.message)
  })

const Person = require('./models/person')


app.get('/info', async (request, response) => {
  const count = await Person.countDocuments()
  response.send(`<p>Phonebook has info for ${count} people</p> ${new Date()}`)
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const { number } = request.body

  Person.findByIdAndUpdate(
    request.params.id,
    { number },
    { new: true, runValidators: true, context: 'query' }
  )
    .then(updatedPerson => {
      if (!updatedPerson) {
        return response.status(404).json({ error: 'Person not found' })
      }
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})


const alreadyNane = async (name) => {
  const person = await Person.findOne({ name })
  return person !== null
}

app.post('/api/persons', async (request, response, next) => {
  const { name , number } = request.body

  if (!name) {
    return response.status(400).json({ error: 'name missing' })
  }
  if (!number) {
    return response.status(400).json({ error: 'number missing' })
  }
  if (await alreadyNane(name)) {
    return response.status(400).json({ error: 'name must be unique' })
  }

  const person = new Person({ name, number })

  person.save()
    .then(savedPerson => response.json(savedPerson))
    .catch(error => next(error))
})

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).json({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

