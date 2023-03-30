const express = require('express')
const app = express()

// respond with "hello world" when a GET request is made to the homepage
app.get('/', (req, res) => {
  res.send('hello world')
})

app.get('/user_register', (req, res) => {
  res.send('otp notification')
})
app.get('/user_inputotp', (req, res) => {
  res.send('register complete')
})
app.get('/candidate_register', (req, res) => {
  res.send('candidate_register')
})
app.get('/user_login', (req, res) => {
  res.send('login complete')
})
app.get('/voter_vote', (req, res) => {
  res.send('notif voting complete')
})
app.get('/user_viewvoting', (req, res) => {
  res.send('voting status')
})
app.get('/kpu_conductvoting', (req, res) => {
  res.send('voting start')
})


app.post('/kpu_verificationcandidate', (req, res) => {
  res.send('kpu confirm registration')
})
app.get('/kpu_conductvoting', (req, res) => {
  res.send('notification voting start')
})
app.post('/', (req, res) => {
  res.send('POST request to the homepage')
})