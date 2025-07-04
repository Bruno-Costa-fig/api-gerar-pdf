const express = require('express');
const fs = require('fs');
const path = require('path');
const { gerarImagemPrimeiroAcesso } = require('./services/gerarImagemPrimeiroAcesso');
const app = express();
const port = 3003;

app.use(express.json({ limit: "50mb" }));

// Lê os arquivos Base64 das logos
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

    let logoEscolaBase64 = dados.LogoEscolaBase64 ?? logoPresencaBase64; // Logo padrão
    // Converte as propriedades do JSON para letras minúsculas
    const dadosTotais = {
      empresa: dados.Empresa,
      organizationId: dados.OrganizationId,
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
  try {
    const { relatorioTurmaDetalhado } = require('./services/relatorioTurmaDetalhado');
    const dados = req.body;

    if (!dados || !dados.escola || !dados.logoBase64 || !dados.mes) {
      return res.status(400).json({ error: 'Dados inválidos ou não informados' });
    }

    // Passa o objeto completo e a logo do Presença+
    const pdfBuffer = await relatorioTurmaDetalhado(dados, logoPresencaBase64);

    // Define o nome do arquivo
    const fileName = 'relatorio.pdf';

    // Define os cabeçalhos para download do arquivo
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Salva o arquivo PDF localmente (opcional)
    const filePath = path.join(__dirname, 'downloads', 'relatorio.pdf');
    fs.writeFileSync(filePath, pdfBuffer);
    console.log(`PDF salvo em: ${filePath}`);

    // Envia o arquivo PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Erro ao gerar o PDF:', error);
    res.status(500).send('Erro ao gerar o PDF');
  }
});

app.post('/gerar-imagem-primeiro-acesso', async (req, res) => {
  try {
    const { nome, link, qrCodeBase64 } = req.body;

    if (!nome || !link || !qrCodeBase64) {
      return res.status(400).json({ error: 'Os campos nome, link e qrCodeBase64 são obrigatórios.' });
    }

    res.json(await gerarImagemPrimeiroAcesso(nome, link, qrCodeBase64));
  } catch (error) {
    console.error('Erro ao gerar a imagem:', error);
    res.status(500).json({ error: 'Erro ao gerar a imagem.' });
  }
});

app.post('/relatorio-alunos-faltosos', async (req, res) => {
  try {
    const { gerarRelatorioAlunosFaltosos } = require('./services/relatorioAlunosFaltosos');
    const dados = req.body;

    if (!dados || !dados.alunos) {
      return res.status(400).json({ error: 'Dados inválidos ou não informados' });
    }

    const pdfBuffer = await gerarRelatorioAlunosFaltosos(dados, logoPresencaBase64);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio-alunos-faltosos.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Erro ao gerar o relatório:', error);
    res.status(500).send('Erro ao gerar o relatório');
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});