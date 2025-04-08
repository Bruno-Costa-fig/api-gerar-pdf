const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3003;

app.use(express.json({ limit: "50mb" }));

// Lê os arquivos Base64 das logos
const logoEdsonBase64 = fs.readFileSync(path.join(__dirname, 'logosbase64', 'edson.txt'), 'utf-8');
const logoPresencaBase64 = fs.readFileSync(path.join(__dirname, 'logosbase64', 'presencamais.txt'), 'utf-8');

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/gerarPDF', async (req, res) => {
  const gerarPDF = require('./services/gerarPDF');
  let logoEscolaBase64 = logoPresencaBase64; // Logo padrão
  try {
    // Verifica se os dados foram enviados
    const dados = req.body;

    if (!dados) {
      res.status(400).send('Dados inválidos ou não informados');
      return;
    }

    // Converte as propriedades do JSON para letras minúsculas
    const dadosTotais = {
      empresa: dados.Empresa,
      organizationId: dados.OrganizationId,
      turmas: dados.Turmas,
      totalPresentes: dados.TotalPresentes,
      data: dados.Data,
      totalAusentes: dados.TotalAusentes,
    }

    if (dadosTotais.organizationId == 1) {
      logoEscolaBase64 = logoEdsonBase64;
    }

    dadosTotais.turmas = dados.Turmas.map((turma) => ({
      turma: turma.Turma,
      totalPresentes: turma.TotalPresentes,
      totalAusentes: turma.TotalAusentes,
      presentes: turma.Presentes.map((presente) => ({
        nome: presente.Nome,
        horarioEntrada: presente.HorarioEntrada,
        horarioSaida: presente.HorarioSaida,
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

app.post('/gerar-carteirinhas', async (req, res) => {
  const { gerarPdfCarteirinhas } = require('./services/geradorCarteirinha');
  const { gerarPdfCarteirinhasModelo2 } = require('./services/geradorCarteirinhaModelo2');
  try {
    const dados = req.body;

    const alunos = dados.Alunos.map((aluno) => ({
      name: aluno.Name,
      turma: aluno.Turma.Name,
      qrCode: aluno.QrCode,
    }));
    const nomeEscola = dados.NomeEscola;

    if (!alunos || !nomeEscola) {
      return res.status(400).json({ error: 'Dados inválidos ou não informados' });
    }

    // Gera o PDF com as carteirinhas
    let pdfBuffer;

    if (!!req.query.modelo && req.query.modelo == 2) {
      pdfBuffer = await gerarPdfCarteirinhasModelo2(alunos, nomeEscola);
    } else {
      pdfBuffer = await gerarPdfCarteirinhas(alunos, nomeEscola);
    }

    // Define o nome do arquivo
    const fileName = 'carteirinhas.pdf';

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

app.post('/relatorio-turma-detalhado', async (req, res) => {
  let logoEscolaBase64 = logoPresencaBase64;
  const alunos = [
    {
      nome: 'João Silva',
      presencas: ['2025-04-01', '2025-04-02', '2025-04-03', '2025-04-04'], 
    },
    {
      nome: 'Maria Souza',
      presencas: ['2025-04-01', '2025-04-04']
    }
  ];

  try {
    const { gerarRelatorio } = require('./services/relatorioTurmaDetalhado');

    const pdfBuffer = await gerarRelatorio(alunos, logoEscolaBase64, logoPresencaBase64);

    // Define o nome do arquivo
    const fileName = 'relatorio.pdf';

    // Define os cabeçalhos para download do arquivo
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    // Salva o arquivo PDF localmente
    const filePath = path.join(__dirname, 'downloads', 'relatorio.pdf');
    fs.writeFileSync(filePath, pdfBuffer);
    console.log(`PDF salvo em: ${filePath}`);
    // Envia o arquivo PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Erro ao gerar o PDF:', error);
    res.status(500).send('Erro ao gerar o PDF');
  }
})

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});