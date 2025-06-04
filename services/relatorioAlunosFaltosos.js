const { jsPDF } = require('jspdf');
const { autoTable } = require('jspdf-autotable');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

async function gerarRelatorioAlunosFaltosos(dados, logoPresencaBase64) {
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
    });

    // Adiciona a logo da escola (base64 recebida)
    if (dados.logoBase64) {
        try {
            doc.addImage(
                dados.logoBase64 ?? logoPresencaBase64,
                'PNG',
                40, 20, // x, y
                60, 60  // width, height (ajuste conforme necessário)
            );
        } catch (e) {
            // Se der erro, apenas ignora a logo
        }
    }

    // Cabeçalho
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(dados.titulo, 120, 50); // Ajuste x para não sobrepor a logo

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Data de geração: ${moment(dados.dataGeracao).format('DD/MM/YYYY HH:mm')}`, 120, 75);

    // Tabela
    const head = [['Nome', 'Total de Presenças', 'Total de Faltas', '% de Faltas']];
    const body = dados.alunos.map(aluno => [
        aluno.nome,
        aluno.totalPresencas,
        aluno.totalFaltas,
        aluno.percentualFaltas.toFixed(1) + '%'
    ]);

    autoTable(doc, {
        startY: 100,
        head,
        body,
        styles: { fontSize: 10, halign: 'center' },
        headStyles: { fillColor: [200, 0, 0], textColor: 255 },
        columnStyles: {
            0: { halign: 'left', cellWidth: 200 }
        }
    });

    // Adiciona a logo do Presença+ ao final (canto inferior direito)
    if (logoPresencaBase64) {
        try {
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const imgWidth = 60;
            const imgHeight = 20;
            doc.addImage(
                logoPresencaBase64,
                'PNG',
                pageWidth - imgWidth - 40, // x
                pageHeight - imgHeight - 40, // y
                imgWidth,
                imgHeight
            );
        } catch (e) {
            // Se der erro, apenas ignora a logo
        }
    }

    // Retorna o buffer do PDF
    return Buffer.from(doc.output('arraybuffer'));
}

module.exports = { gerarRelatorioAlunosFaltosos };