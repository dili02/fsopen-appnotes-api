/* let notes = [
  {
    id: 1,
    content: 'HTML is easy',
    date: '2019-05-30T17:30:31.098Z',
    important: true
  },
  {
    id: 2,
    content: 'Browser can execute only Javascript',
    date: '2019-05-30T18:39:34.091Z',
    important: false
  },
  {
    id: 3,
    content: 'GET and POST are the most important methods of HTTP protocol',
    date: '2019-05-30T19:20:14.298Z',
    important: true
  }
] */
require('dotenv').config()

const express = require('express')
const cors = require('cors')

const Note = require('./models/note')

const app = express()

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}

app.use(express.json())
app.use(cors())
app.use(express.static('build'))
app.use(requestLogger)

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/notes', (request, response, next) => {
  Note.find({})
    .then(notes => {
      response.json(notes)
    })
    .catch(error => next(error))
})

app.get('/api/notes/:id', (request, response, next) => {
  const id = request.params.id

  Note.findById(id).then(note => {
    (note)
      ? response.json(note)
      : response.status(404).end()
  }).catch(error => next(error))
})

app.delete('/api/notes/:id', (request, response, next) => {
  const id = request.params.id

  Note.findByIdAndDelete(id).then(() => {
    response.status(204).end()
  }).catch(error => next(error))
})

app.post('/api/notes', (request, response, next) => {
  const body = request.body

  if (body.content === undefined) {
    return response.status(400).json({
      error: 'content missing'
    })
  }

  const note = new Note({
    content: body.content,
    important: body.important || false,
    date: new Date()
  })

  note.save().then(savedNote => {
    response.json(savedNote)
  }).catch(error => next(error))
})

app.put('/api/notes/:id', (request, response, next) => {
  const id = request.params.id
  const note = request.body

  const noteToUpdate = {
    content: note.content,
    important: note.important
  }

  Note.findByIdAndUpdate(id, noteToUpdate, { new: true })
    .then(updatedNote => {
      response.json(updatedNote)
    }).catch(error => next(error))
})

const unknownEndpoint = (request, response) => response.status(404).send({ error: 'unknown endpoint' })
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }

  if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
