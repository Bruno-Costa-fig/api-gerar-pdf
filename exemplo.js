const { jsPDF } = require("jspdf"); // Biblioteca para geração de PDFs
const { autoTable } = require('jspdf-autotable') // Biblioteca para criação de tabelas
const moment = require("moment"); // Biblioteca para manipulação de datas

async function gerarPDF(dados, logoEscolaBase64, logoPresencaBase64) {
  const doc = new jsPDF();
  let currentPage = 1;

  // Função para adicionar cabeçalho
  const addHeader = () => {
    doc.addImage(logoEscolaBase64, "PNG", 10, 10, 30, 30); // Adiciona a logo da escola
    doc.setFontSize(14);
    doc.text("EEMTI Edson Luiz Cavalcante de Gouvêa", 50, 20); // Nome da escola
    doc.setFontSize(12);
    doc.text("Relatório de Presença", 50, 30); // Subtítulo do relatório
  };

  // Função para adicionar rodapé
  const addFooter = () => {
    doc.setFontSize(10);
    doc.text(`Página ${currentPage}`, 10, 290); // Número da página no lado esquerdo
    doc.addImage(logoPresencaBase64, "PNG", 170, 280, 30, 10); // Logo do Presença no lado direito
  };

  // Adiciona a tabela de totais na primeira página
  const addTotalsTable = () => {
    let y = 50; // Posição inicial no eixo Y
    doc.setFontSize(14);
    doc.text("Resumo Geral", 10, y);
    y += 10;

    // Cria a tabela com os totais
    autoTable(doc, {
      startY: y,
      head: [["Total Presentes", "Total Ausentes"]],
      body: [[dados.totalPresentes, dados.totalAusentes]],
    });

    return doc.lastAutoTable.finalY + 10; // Retorna a posição Y após a tabela
  };

  // Adiciona os detalhes de cada turma em forma de tabela
  const addTurmaDetails = (turma) => {
    doc.setFontSize(14);
    doc.text(`Turma: ${turma.turma}`, 10, 50);

    // Cria a tabela com os detalhes da turma
    autoTable(doc,{
      startY: 60,
      head: [["Nome", "Horário de Entrada"]],
      body: [
        ...turma.presentes.map((presente) => [
          presente.nome,
          presente.horarioEntrada !== "N/A"
            ? moment(presente.horarioEntrada, "HH:mm")
                .subtract(3, "hours")
                .format("HH:mm")
            : "N/A",
        ]),
        ...turma.ausentes.map((ausente) => [ausente.nome, "Ausente"]),
      ],
    });

    return doc.lastAutoTable.finalY + 10; // Retorna a posição Y após a tabela
  };

  // Gera o PDF
  addHeader();
  let y = addTotalsTable(); // Adiciona a tabela de totais na primeira página
  addFooter();

  dados.turmas.forEach((turma, index) => {
    if (index > 0) {
      doc.addPage();
      currentPage++;
      addHeader();
    }

    addTurmaDetails(turma);
    addFooter();
  });

  // Retorna o conteúdo do PDF como um buffer
  const pdfContent = doc.output("arraybuffer");
  return Buffer.from(pdfContent);
}

module.exports = gerarPDF;