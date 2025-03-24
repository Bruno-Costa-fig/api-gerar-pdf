const { jsPDF } = require("jspdf"); // will automatically load the node version
const moment = require("moment"); // Biblioteca para manipulação de datas

function gerarPDF(dados) {
  const doc = new jsPDF();

  // Título do documento
  doc.setFontSize(16);
  doc.text("Relatório de Presença", 10, 10);

  let y = 20; // Posição inicial no eixo Y

  dados.forEach((turma) => {
    // Adiciona o título da turma
    doc.setFontSize(14);
    doc.text(`Turma: ${turma.turma}`, 10, y);
    y += 10;

    // Adiciona os presentes
    doc.setFontSize(12);
    doc.text("Presentes:", 10, y);
    y += 10;

    if (turma.presentes.length > 0) {
      turma.presentes.forEach((presente) => {
        // Ajusta o horário de entrada subtraindo 3 horas
        let horarioEntrada = presente.horarioEntrada;
        if (horarioEntrada && horarioEntrada !== "N/A") {
          horarioEntrada = moment(horarioEntrada, "HH:mm")
            .subtract(3, "hours")
            .format("HH:mm");
        }

        doc.text(`- ${presente.nome} (Entrada: ${horarioEntrada})`, 10, y);
        y += 10;

        // Verifica se a posição Y ultrapassou o limite da página
        if (y > 280) {
          doc.addPage();
          y = 10;
        }
      });
    } else {
      doc.text("- Nenhum presente", 10, y);
      y += 10;
    }

    // Adiciona os ausentes
    doc.text("Ausentes:", 10, y);
    y += 10;

    if (turma.ausentes.length > 0) {
      turma.ausentes.forEach((ausente) => {
        doc.text(`- ${ausente.nome}`, 10, y);
        y += 10;

        // Verifica se a posição Y ultrapassou o limite da página
        if (y > 280) {
          doc.addPage();
          y = 10;
        }
      });
    } else {
      doc.text("- Nenhum ausente", 10, y);
      y += 10;
    }

    // Adiciona um espaço entre as turmas
    y += 10;

    // Verifica se a posição Y ultrapassou o limite da página
    if (y > 280) {
      doc.addPage();
      y = 10;
    }
  });

  // Retorna o conteúdo do PDF como uma string em formato URI
  const pdfContent = doc.output("datauristring");
  return pdfContent;
}

module.exports = gerarPDF;