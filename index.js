const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3003;

app.use(express.json());

// Lê os arquivos Base64 das logos
const logoEscolaBase64 = fs.readFileSync(path.join(__dirname, 'logosbase64', 'edson.txt'), 'utf-8');
const logoPresencaBase64 = fs.readFileSync(path.join(__dirname, 'logosbase64', 'presencamais.txt'), 'utf-8');

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/gerarPDF', async (req, res) => {
  const gerarPDF = require('./services/gerarPDF');
  
  try {
    // Verifica se os dados foram enviados
    const dados = req.body;

    if (!dados) {
      res.status(400).send('Dados inválidos ou não informados');
      return;
    }

    // Converte as propriedades do JSON para letras minúsculas
    const dadosTotais = {
      turmas: dados.Turmas,
      totalPresentes: dados.TotalPresentes,
      data: dados.Data,
      totalAusentes: dados.TotalAusentes,
    }

    dadosTotais.turmas = dados.Turmas.map((turma) => ({
      turma: turma.Turma,
      totalPresentes: turma.TotalPresentes,
      totalAusentes: turma.TotalAusentes,
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
    const pdfBuffer = await gerarPDF(dadosTotais, logoEscolaBase64, logoPresencaBase64);

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