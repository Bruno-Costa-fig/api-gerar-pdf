const { jsPDF } = require("jspdf");
const { autoTable } = require('jspdf-autotable');
const moment = require("moment");

async function gerarPDF(dados, logoEscolaBase64, logoPresencaBase64) {
  const doc = new jsPDF();
  let currentPage = 1;

  const addHeader = () => {
    doc.addImage(logoEscolaBase64, "PNG", 10, 10, 30, 30); 
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("EEMTI Edson Luiz Cavalcante de Gouvêa", 50, 20); 
    doc.setFontSize(12);
    doc.text(`Relatório de Presença - ${dados.data}`, 50, 30); 
    doc.setFont("helvetica", "normal");
  };

  const centralizarTexto = (text, y, bold = false) => {
    if (bold) {
      doc.setFont("helvetica", "bold");
    }
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2; // Calcula a posição X para centralizar
    doc.text(text, x, y);
    if (bold) {
      doc.setFont("helvetica", "normal");
    }
  }

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
    centralizarTexto("Resumo Geral", y, true);
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [["Total Presentes", "Total Ausentes"]],
      body: [[dados.totalPresentes, dados.totalAusentes]],
    });

    // doc.setFontSize(12);
    // doc.text(`Total de Alunos Presentes: ${dados.totalPresentes}`, 10, y);
    // y += 10;
    // doc.text(`Total de Alunos Ausentes: ${dados.totalAusentes}`, 10, y);
    // y += 20;
    addFooter();
    doc.addPage();
    currentPage++;
    addHeader();
    y = 50;
    return y; // Retorna a posição Y para continuar o conteúdo
  };

  // Adiciona os detalhes de cada turma
  const addTurmaDetails = (turma, y) => {
    doc.setFontSize(16);
    centralizarTexto(`Turma: ${turma.turma}`, y, true);
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [["Total Presentes", "Total Ausentes"]],
      body: [
        [turma.totalPresentes, turma.totalAusentes]
      ],
    });

    y += 30;

    doc.setFontSize(14);
    centralizarTexto("Lista de Alunos:", y, true);
    y += 10;

    if (turma.presentes.length > 0) {

      doc.setFontSize(12);
      centralizarTexto("Presentes:", y, true);
      y += 5;
      autoTable(doc, {
        startY: y,
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
        ],
      });
      y += 8 * turma.presentes.length;
      y += 15;
    }

    if (turma.ausentes.length > 0) {
      doc.setFontSize(12);
      centralizarTexto("Ausentes:", y, true);
      y += 5;
      autoTable(doc, {
        startY: y,
        head: [["Nome"]],
        body: [
          ...turma.ausentes.map((ausente) => [ausente.nome]),
        ],
      });
    }

    // Verifica se a posição Y ultrapassou o limite da página
    if (y > 260) {
      addFooter();
      doc.addPage();
      currentPage++;
      addHeader();
      y = 50;
    }

    return y;
  };

  // Gera o PDF
  addHeader();
  let y = addTotalsTable();
  addFooter();

  dados.turmas.forEach((turma, index) => {
    if(turma.ausentes.length === 0 && turma.presentes.length === 0) {
      return;
    }
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