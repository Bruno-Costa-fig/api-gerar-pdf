const { jsPDF } = require("jspdf");
const { autoTable } = require('jspdf-autotable');
const moment = require("moment");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const { loadImage } = require("canvas");
const path = require("path");
const montserrat = require('./montserratFont');

const barChartCanvas = new ChartJSNodeCanvas({ width: 800, height: 400 });
const pieChartCanvas = new ChartJSNodeCanvas({ width: 400, height: 400 });


async function gerarPDF(dados, logoEscolaBase64, logoPresencaBase64) {
  const doc = new jsPDF();
  let currentPage = 1;
  let countTurmas = 0;

  doc.addFileToVFS('Montserrat-Regular.ttf', montserrat.regular);
  doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');

  doc.addFileToVFS('Montserrat-Bold.ttf', montserrat.bold);
  doc.addFont('Montserrat-Bold.ttf', 'Montserrat', 'bold');

  const imgProps = doc.getImageProperties(logoEscolaBase64);
  const aspectRatio = imgProps.width / imgProps.height;
  const maxDimension = 40;
  const imgWidth = aspectRatio >= 1 ? maxDimension : maxDimension * aspectRatio;
  const imgHeight = aspectRatio >= 1 ? maxDimension / aspectRatio : maxDimension;

  const addHeader = () => {
    doc.addImage(logoEscolaBase64, "PNG", 10, 10, imgWidth, imgHeight);
    doc.setFont("Montserrat", "bold");
    doc.setFontSize(16);
    doc.text(dados.empresa, 60, 20);
    doc.setFontSize(12);
    doc.text(`Relatório de Presença - ${dados.data}`, 60, 30);
    doc.setFont("Montserrat", "normal");
  };

  const centralizarTexto = (text, y, bold = false) => {
    if (bold) doc.setFont("Montserrat", "bold");
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);
    if (bold) doc.setFont("Montserrat", "normal");
  };

  const generateBarChart = async () => {
    const labels = dados.turmas.map((turma) => turma.turma);
    const presentes = dados.turmas.map((turma) => turma.totalPresentes);
    const ausentes = dados.turmas.map((turma) => turma.totalAusentes);
    const justificados = dados.turmas.map((turma) => turma.totalJustificados);

    const configuration = {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Alunos Presentes",
            data: presentes,
            backgroundColor: "rgba(0, 128, 0)",
            borderColor: "rgba(0, 128, 0)",
            borderWidth: 1,
          },
          {
            label: "Alunos Ausentes",
            data: ausentes,
            backgroundColor: "rgba(161, 35, 16)",
            borderColor: "rgba(161, 35, 16)",
            borderWidth: 1,
          },
          {
            label: "Falta Justificada",
            data: justificados,
            backgroundColor: "rgba(230, 160, 0)",
            borderColor: "rgba(230, 160, 0)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "top" } },
        scales: { x: { beginAtZero: true }, y: { beginAtZero: true } },
      },
    };

    return await barChartCanvas.renderToDataURL(configuration);
  };

  const generatePieChart = async (turma) => {
    const totalAlunos = turma.totalPresentes + turma.totalAusentes + turma.totalJustificados;

    const pPresentes = ((turma.totalPresentes / totalAlunos) * 100).toFixed(2);
    const pAusentes = ((turma.totalAusentes / totalAlunos) * 100).toFixed(2);
    const pJustificados = ((turma.totalJustificados / totalAlunos) * 100).toFixed(2);

    const labels = [
      `Presentes - ${pPresentes}%`,
      `Ausentes - ${pAusentes}%`,
      `Justificados - ${pJustificados}%`,
    ];

    const configuration = {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            data: [turma.totalPresentes, turma.totalAusentes, turma.totalJustificados],
            backgroundColor: ["rgba(0, 128, 0)", "rgba(161, 35, 16)", "rgba(230, 160, 0)"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
            labels: { font: { size: 20 } },
          },
        },
      },
    };

    return await pieChartCanvas.renderToDataURL(configuration);
  };

  const addTotalsTable = async () => {
    let y = 50;
    doc.setFontSize(14);
    centralizarTexto("Resumo Geral", y, true);
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [["Total Presentes", "Total Ausentes", "Total Justificados"]],
      body: [[dados.totalPresentes, dados.totalAusentes, dados.totalJustificados]],
      didParseCell: function (data) {
        if (data.section === 'head') {
          if (data.column.dataKey === 0) {
            data.cell.styles.fillColor = [0, 128, 0];
            data.cell.styles.textColor = [255, 255, 255];
          }
          if (data.column.dataKey === 1) {
            data.cell.styles.fillColor = [161, 35, 16];
            data.cell.styles.textColor = [255, 255, 255];
          }
          if (data.column.dataKey === 2) {
            data.cell.styles.fillColor = [230, 160, 0];
            data.cell.styles.textColor = [255, 255, 255];
          }
        } else {
          if (data.column.dataKey === 0) data.cell.styles.fillColor = [230, 247, 234];
          if (data.column.dataKey === 1) data.cell.styles.fillColor = [245, 223, 223];
          if (data.column.dataKey === 2) data.cell.styles.fillColor = [255, 243, 205];
        }
      },
    });

    const barChartBase64 = await generateBarChart();
    doc.addImage(barChartBase64, "PNG", 10, 90, 190, 80);
    doc.addPage();
    currentPage++;
    addHeader();
    return 50;
  };

  const addTurmaDetails = async (turma, y, last) => {
    countTurmas++;
    doc.setFontSize(16);
    centralizarTexto(`Turma: ${turma.turma}`, y, true);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [["Total Presentes", "Total Ausentes", "Total Justificados"]],
      body: [[turma.totalPresentes, turma.totalAusentes, turma.totalJustificados]],
      didParseCell: function (data) {
        if (data.section === "head") {
          if (data.column.dataKey === 0) {
            data.cell.styles.fillColor = [0, 128, 0];
            data.cell.styles.textColor = [255, 255, 255];
          }
          if (data.column.dataKey === 1) {
            data.cell.styles.fillColor = [161, 35, 16];
            data.cell.styles.textColor = [255, 255, 255];
          }
          if (data.column.dataKey === 2) {
            data.cell.styles.fillColor = [230, 160, 0];
            data.cell.styles.textColor = [255, 255, 255];
          }
        } else {
          if (data.column.dataKey === 0) data.cell.styles.fillColor = [230, 247, 234];
          if (data.column.dataKey === 1) data.cell.styles.fillColor = [245, 223, 223];
          if (data.column.dataKey === 2) data.cell.styles.fillColor = [255, 243, 205];
        }
      },
    });

    y = doc.lastAutoTable.finalY + 5;

    const pieChartBase64 = await generatePieChart(turma);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pieWidth = 60;
    const x = (pageWidth - pieWidth) / 2;
    doc.addImage(pieChartBase64, "PNG", x, y, pieWidth, pieWidth);
    y += pieWidth + 10;

    doc.setFontSize(14);
    centralizarTexto("Lista de Alunos:", y, true);
    y += 10;

    // Tabela de presentes
    if (turma.presentes.length > 0) {
      doc.setFontSize(12);
      centralizarTexto("Presentes:", y, true);
      y += 3;
      autoTable(doc, {
        startY: y,
        head: [["Nome", "Horário de Entrada", "Horário de Saída"]],
        rowHeight: 6,
        body: turma.presentes.map((p) => [
          p.nome,
          p.horarioEntrada !== "N/A" && p.horarioEntrada !== null ? p.horarioEntrada : "N/A",
          p.horarioSaida !== "N/A" && !!p.horarioSaida ? p.horarioSaida : "-",
        ]),
        didParseCell: function (data) {
          if (data.section === 'body') {
            data.cell.styles.fillColor = data.row.index % 2 === 0 ? [230, 247, 234] : [255, 255, 255];
          }
          if (data.section === 'head') {
            data.cell.styles.fillColor = [0, 128, 0];
            data.cell.styles.textColor = [255, 255, 255];
          }
        },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // Tabela de ausentes + justificados juntos
    const todosAusentes = [
      ...turma.ausentes.map((a) => ({ nome: a.nome, justificativa: "" })),
      ...turma.justificados.map((j) => ({ nome: j.nome, justificativa: j.justificativa || "" })),
    ].sort((a, b) => a.nome.localeCompare(b.nome));

    if (todosAusentes.length > 0) {
      if (y > 260) {
        doc.addPage();
        currentPage++;
        addHeader();
        y = 50;
      }
      doc.setFontSize(12);
      centralizarTexto("Ausentes:", y, true);
      y += 3;
      autoTable(doc, {
        startY: y,
        head: [["Nome", "Justificativa"]],
        body: todosAusentes.map((a) => [a.nome, a.justificativa]),
        rowHeight: 6,
        columnStyles: {
          0: { cellWidth: 90 },
          1: { cellWidth: 100 },
        },
        didParseCell: function (data) {
          if (data.section === 'body') {
            const justificativa = data.row.raw[1];
            if (justificativa) {
              // Justificado → amarelo claro
              data.cell.styles.fillColor = data.row.index % 2 === 0 ? [255, 243, 205] : [255, 249, 230];
            } else {
              // Ausente simples → vermelho claro
              data.cell.styles.fillColor = data.row.index % 2 === 0 ? [245, 223, 223] : [255, 255, 255];
            }
          }
          if (data.section === 'head') {
            data.cell.styles.fillColor = [161, 35, 16];
            data.cell.styles.textColor = [255, 255, 255];
          }
        },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    if (countTurmas === dados.turmas.length) return;

    doc.addPage();
    currentPage++;
    addHeader();
    return 50;
  };

  addHeader();
  let y = await addTotalsTable();

  for (const turma of dados.turmas) {
    if (turma.ausentes.length === 0 && turma.presentes.length === 0 && turma.justificados.length === 0) {
      continue;
    }
    y = await addTurmaDetails(turma, y);
  }

  const addFooterToAllPages = () => {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Página ${i} de ${totalPages}`, 10, 290);
      doc.addImage(logoPresencaBase64, "PNG", 170, 280, 30, 10);
    }
  };

  addFooterToAllPages();

  const pdfContent = doc.output("arraybuffer");
  return Buffer.from(pdfContent);
}

module.exports = gerarPDF;