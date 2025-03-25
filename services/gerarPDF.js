const { jsPDF } = require("jspdf"); // Biblioteca para geração de PDFs
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

    doc.setFontSize(12);
    doc.text(`Total de Alunos Presentes: ${dados.totalPresentes}`, 10, y);
    y += 10;
    doc.text(`Total de Alunos Ausentes: ${dados.totalAusentes}`, 10, y);
    y += 20;

    return y; // Retorna a posição Y para continuar o conteúdo
  };

  // Adiciona os detalhes de cada turma
  const addTurmaDetails = (turma, y) => {
    doc.setFontSize(14);
    doc.text(`Turma: ${turma.turma}`, 10, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Total Presentes: ${turma.totalPresentes}`, 10, y);
    y += 10;
    doc.text(`Total Ausentes: ${turma.totalAusentes}`, 10, y);
    y += 10;

    doc.text("Presentes:", 10, y);
    y += 10;

    if (turma.presentes.length > 0) {
      turma.presentes.forEach((presente) => {
        let horarioEntrada = presente.horarioEntrada;
        if (horarioEntrada && horarioEntrada !== "N/A") {
          horarioEntrada = moment(horarioEntrada, "HH:mm")
            .subtract(3, "hours")
            .format("HH:mm");
        }

        doc.text(`- ${presente.nome} (Entrada: ${horarioEntrada})`, 10, y);
        y += 10;

        // Verifica se a posição Y ultrapassou o limite da página
        if (y > 260) {
          addFooter();
          doc.addPage();
          currentPage++;
          addHeader();
          y = 50;
        }
      });
    } else {
      doc.text("- Nenhum presente", 10, y);
      y += 10;
    }

    doc.text("Ausentes:", 10, y);
    y += 10;

    if (turma.ausentes.length > 0) {
      turma.ausentes.forEach((ausente) => {
        doc.text(`- ${ausente.nome}`, 10, y);
        y += 10;

        // Verifica se a posição Y ultrapassou o limite da página
        if (y > 260) {
          addFooter();
          doc.addPage();
          currentPage++;
          addHeader();
          y = 50;
        }
      });
    } else {
      doc.text("- Nenhum ausente", 10, y);
      y += 10;
    }

    return y;
  };

  // Gera o PDF
  addHeader();
  let y = addTotalsTable(); // Adiciona a tabela de totais na primeira página
  addFooter();

  dados.turmas.forEach((turma, index) => {
    if (index > 0 || y > 260) {
      doc.addPage();
      currentPage++;
      addHeader();
      y = 50;
    }

    y = addTurmaDetails(turma, y);
    addFooter();
  });

  // Retorna o conteúdo do PDF como um buffer
  const pdfContent = doc.output("arraybuffer");
  return Buffer.from(pdfContent);
}

module.exports = gerarPDF;