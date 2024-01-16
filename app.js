const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/gerarPDF', (req, res) => {
  const gerarPDF = require('./services/gerarPDF');
  const result = gerarPDF(req.body);
  console.log('consultado')
  res.send(result);
})

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});