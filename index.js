const express = require('express');
const app = express();
const port = 3003;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/gerarPDF', (req, res) => {
  const gerarPDF = require('./services/gerarPDF');
  
  try {
    // Verifica se os dados foram enviados
    const dados = req.body;

    if (!dados || !Array.isArray(dados)) {
      res.status(400).send('Dados inválidos ou não informados');
      return;
    }

    // Converte as propriedades do JSON para letras minúsculas
    const dadosConvertidos = dados.map((turma) => ({
      turma: turma.Turma,
      presentes: turma.Presentes.map((presente) => ({
        nome: presente.Nome,
        horarioEntrada: presente.HorarioEntrada,
      })),
      ausentes: turma.Ausentes.map((ausente) => ({
        nome: ausente.Nome,
        horarioEntrada: ausente.HorarioEntrada,
      })),
    }));

    // Gera o conteúdo do PDF
    const pdfContent = gerarPDF(dadosConvertidos);

    // Converte o conteúdo base64 para um buffer
    const base64Data = pdfContent.split(',')[1];
    const pdfBuffer = Buffer.from(base64Data, 'base64');

    // Define o nome do arquivo
    const fileName = 'relatorio.pdf';

    // Define os cabeçalhos para download do arquivo
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Envia o arquivo PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Erro ao gerar o PDF:', error);
    res.status(500).send('Erro ao gerar o PDF');
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});