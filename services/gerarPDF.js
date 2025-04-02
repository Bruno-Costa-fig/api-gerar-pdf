const { jsPDF } = require("jspdf");
const { autoTable } = require('jspdf-autotable');
const moment = require("moment");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

async function gerarPDF(dados, logoEscolaBase64, logoPresencaBase64) {
  const doc = new jsPDF();
  let currentPage = 1;

  // Configuração do ChartJSNodeCanvas
  const width = 800; // Largura do gráfico
  const height = 400; // Altura do gráfico
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  // Função para gerar o gráfico de barras
  const generateBarChart = async () => {
    const labels = dados.turmas.map((turma) => turma.turma);
    const presentes = dados.turmas.map((turma) => turma.totalPresentes);
    const ausentes = dados.turmas.map((turma) => turma.totalAusentes);

    const configuration = {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Presentes",
            data: presentes,
            backgroundColor: "rgba(0, 128, 0, 0.6)",
            borderColor: "rgba(0, 128, 0)",
            borderWidth: 1,
          },
          {
            label: "Ausentes",
            data: ausentes,
            backgroundColor: "rgba(161, 35, 16, 0.6)",
            borderColor: "rgba(161, 35, 16)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
        },
        scales: {
          x: {
            beginAtZero: true,
          },
          y: {
            beginAtZero: true,
          },
        },
      },
    };

    // Gera o gráfico como uma imagem Base64
    return await chartJSNodeCanvas.renderToDataURL(configuration);
  };

  // Função para adicionar cabeçalho
  const addHeader = () => {
    const imgProps = doc.getImageProperties(logoEscolaBase64);
    const aspectRatio = imgProps.width / imgProps.height;
    const maxDimension = 40; // Define um tamanho máximo para largura ou altura
    const imgWidth = aspectRatio >= 1 ? maxDimension : maxDimension * aspectRatio;
    const imgHeight = aspectRatio >= 1 ? maxDimension / aspectRatio : maxDimension;
    doc.addImage(logoEscolaBase64, "PNG", 10, 10, imgWidth, imgHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(dados.empresa, 70, 20); 
    doc.setFontSize(12);
    doc.text(`Relatório de Presença - ${dados.data}`, 70, 30); 
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
  const addTotalsTable = async () => {
    let y = 50; // Posição inicial no eixo Y
    doc.setFontSize(14);
    centralizarTexto("Resumo Geral", y, true);
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [["Total Presentes", "Total Ausentes"]],
      body: [[dados.totalPresentes, dados.totalAusentes]],
      didParseCell: function (data) {
        if (data.section === 'head') { // Estilo do cabeçalho
          if (data.column.dataKey === 0) {
            data.cell.styles.fillColor = [0, 128, 0]; // Verde escuro
            data.cell.styles.textColor = [255, 255, 255]; // Branco
          }
          if (data.column.dataKey === 1) {
            data.cell.styles.fillColor = [161, 35, 16]; // Vermelho escuro
            data.cell.styles.textColor = [255, 255, 255]; // Branco
          }
        } else { // Estilo das células da tabela
          if (data.column.dataKey === 0) {
            data.cell.styles.fillColor = [230, 247, 234]; // Verde claro
          }
          if (data.column.dataKey === 1) {
            data.cell.styles.fillColor = [245, 223, 223]; // Vermelho claro
          }
        }
      }
    });

      // Gera o gráfico de barras
    const barChartBase64 = await generateBarChart();
    doc.addImage(barChartBase64, "PNG", 10, 90, 190, 80); // Adiciona o gráfico de barras
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
      didParseCell: function (data) {
        if (data.section === 'head') { // Estilo do cabeçalho
          if (data.column.dataKey === 0) {
            data.cell.styles.fillColor = [0, 128, 0]; // Verde escuro
            data.cell.styles.textColor = [255, 255, 255]; // Branco
          }
          if (data.column.dataKey === 1) {
            data.cell.styles.fillColor = [161, 35, 16]; // Vermelho escuro
            data.cell.styles.textColor = [255, 255, 255]; // Branco
          }
        } else { // Estilo das células da tabela
          if (data.column.dataKey === 0) {
            data.cell.styles.fillColor = [230, 247, 234]; // Verde claro
          }
          if (data.column.dataKey === 1) {
            data.cell.styles.fillColor = [245, 223, 223]; // Vermelho claro
          }
        }
      }
    });

    y += 30;

    doc.setFontSize(14);
    centralizarTexto("Lista de Alunos:", y, true);
    y += 10;

    if (turma.presentes.length > 0) {

      doc.setFontSize(12);
      centralizarTexto("Presentes:", y, true);
      y += 10;
      autoTable(doc, {
        startY: y,
        head: [["Nome", "Horário de Entrada", "Horário de Saída"]],
        body: [
          ...turma.presentes.map((presente) => [
            presente.nome,
            presente.horarioEntrada !== "N/A" && presente.horarioEntrada !== null
              ? moment(presente.horarioEntrada, "HH:mm")
                // .subtract(3, "hours")
                .format("HH:mm")
              : "N/A",
            presente.horarioSaida !== "N/A"  && !!presente.horarioSaida
              ? moment(presente.horarioSaida, "HH:mm")
                // .subtract(3, "hours")
                .format("HH:mm")
              : "-",
          ]),
        ],
        didParseCell: function (data) {
          if (data.section === 'head') { // Estilo do cabeçalho
            if (data.column.dataKey === 0) {
              data.cell.styles.fillColor = [0, 128, 0]; // Verde escuro
              data.cell.styles.textColor = [255, 255, 255]; // Branco
            }
          } else { // Estilo das células da tabela
            if (data.column.dataKey === 0) {
              data.cell.styles.fillColor = [230, 247, 234]; // Verde claro
            }
          }
        }
      });
      y += 8 * turma.presentes.length;
      y += 10;
    }

    if (turma.ausentes.length > 0) {
      if(y > 260) {
        // y -= 190 - (8 * (turma.ausentes.length - 22));
        y -= 260;
      }
      doc.setFontSize(12);
      centralizarTexto("Ausentes:", y, true);
      y += 5;
      autoTable(doc, {
        startY: y,
        head: [["Nome"]],
        body: [
          ...turma.ausentes.map((ausente) => [ausente.nome]),
        ],
        didParseCell: function (data) {
          if (data.section === 'head') { // Estilo do cabeçalho
            if (data.column.dataKey === 0) {
              data.cell.styles.fillColor = [161, 35, 16]; // Vermelho escuro
              data.cell.styles.textColor = [255, 255, 255]; // Branco
            }
          } else { // Estilo das células da tabela
            if (data.column.dataKey === 0) {
              data.cell.styles.fillColor = [245, 223, 223]; // Vermelho claro
            }
          }
        }
      });
    }

    // Verifica se a posição Y ultrapassou o limite da página
    if(turma.ausentes.length == 0) {
      return y;
    }

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
  let y = await addTotalsTable(); // Adiciona a tabela de totais na primeira página
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