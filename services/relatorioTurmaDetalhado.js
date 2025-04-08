const { jsPDF } = require('jspdf');
const { autoTable } = require('jspdf-autotable');

const moment = require('moment'); // facilita o trabalho com datas
require('moment/locale/pt-br'); // opcional: localiza para português
moment.locale('pt-br');

function gerarRelatorio(alunos) {
    console.log(alunos)
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: "a4",
    });
    const diasDoMes = getDiasDoMes(2025, 3); // abril (mês 3 = abril)

    // Cabeçalho
    const head = ['Aluno', ...diasDoMes.map(d => d.dia.toString())];

    // Corpo
    const body = alunos.map(aluno => {
        const linha = [aluno.nome];
        diasDoMes.forEach(dia => {
            linha.push({
                presenca: Array.isArray(aluno.presencas) && aluno.presencas.includes(dia.data),
                isFimDeSemana: isFinalDeSemana(dia.dateObj),
            });
        });
        return linha;
    });

    // Legenda no topo
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text('Legenda:', 40, 30);

    // Bolinha verde - Presente
    doc.setFillColor(0, 200, 0);
    doc.circle(80, 26, 4, 'F');
    doc.setTextColor(0);
    doc.text('Presente', 90, 30);

    // Bolinha vermelha - Ausente
    doc.setFillColor(220, 0, 0);
    doc.circle(160, 26, 4, 'F');
    doc.setTextColor(0);
    doc.text('Ausente', 170, 30);

    // Traço - Fim de semana
    doc.setTextColor(100);
    doc.setFontSize(12);
    doc.text('-', 240, 30);
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text('Fim de semana', 250, 30);


    // Gerar tabela
    autoTable(doc, {
        head: [head],
        body: body.map(linha => linha.map(cel => (typeof cel === 'object' ? '' : cel))),
        styles: {
            fontSize: 4, // Reduce font size to fit more content
            halign: 'center',
            valign: 'middle',
            cellWidth: 'wrap', // Allow cells to wrap content
        },
        headStyles: {
            fillColor: [100, 100, 100],
            textColor: 255,
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 50 }, // Increase width for the first column
            // Dynamically adjust other columns
            '*': { cellWidth: 'auto' },
        },
        didDrawCell: function (data) {
            const colIndex = data.column.index;
            const rowIndex = data.row.index;
        
            if (data.section === 'head') return; // ← Isso impede de desenhar no cabeçalho
            if (colIndex === 0) return; // pula coluna do nome
        
            const celInfo = body[rowIndex]?.[colIndex];
            if (!celInfo || typeof celInfo !== 'object') return;
        
            const { x, y, height, width } = data.cell;
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            const radius = 2.5;
        
            if (celInfo.isFimDeSemana) {
                doc.setFillColor(230);
                doc.rect(x, y, width, height, 'F');
                doc.setTextColor(100);
                doc.setFontSize(6);
                doc.text('-', centerX, centerY + 2, { align: 'center', baseline: 'middle' });
            } else {
                const isPresente = celInfo.presenca === true;
                doc.setFillColor(isPresente ? 0 : 220, isPresente ? 200 : 0, isPresente ? 0 : 0);
                doc.circle(centerX, centerY, radius, 'F');
            }
        }        

    });

    // Salvar PDF
    const pdfContent = doc.output("arraybuffer");
    return Buffer.from(pdfContent);
}

// Helpers
function getDiasDoMes(ano, mes) {
    const dias = [];
    const data = new Date(ano, mes, 1);
    while (data.getMonth() === mes) {
        dias.push({
            dia: data.getDate(),
            data: data.toISOString().split('T')[0],
            dateObj: new Date(data),
        });
        data.setDate(data.getDate() + 1);
    }
    return dias;
}

function isFinalDeSemana(date) {
    const diaSemana = date.getDay();
    return diaSemana === 0 || diaSemana === 6;
}

module.exports = { gerarRelatorio };
