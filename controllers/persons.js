const personRouter = require('express').Router()
const Person = require('../models/person')

// personRouter.get('/info', async (request, response) => {
//   const count = await Person.countDocuments()
//   response.send(`<p>Phonebook has info for ${count} people</p> ${new Date()}`)
// })

personRouter.get('/', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

personRouter.get('/:id', (request, response, next) => {
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

personRouter.delete('/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

personRouter.put('/:id', (request, response, next) => {
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

personRouter.post('/', async (request, response, next) => {
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

module.exports = personRouter