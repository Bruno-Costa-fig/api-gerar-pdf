const { jsPDF } = require('jspdf');
const { autoTable } = require('jspdf-autotable');

const moment = require('moment'); // facilita o trabalho com datas
require('moment/locale/pt-br'); // opcional: localiza para português
moment.locale('pt-br');



function relatorioTurmaDetalhado(dados, logoPresencaBase64) {
    const { escola, logoBase64, mes, ano, turmas, observacao, alunos } = dados;
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
    });
    let y = 0;
    const diasDoMes = getDiasDoMes(ano, parseInt(mes.split('-')[1], 10) - 1); // abril (mês 3 = abril)

    // Cabeçalho
    const head = ['Aluno', ...diasDoMes.map(d => d.dia.toString())];

    const addHeader = () => {
        const imgProps = doc.getImageProperties(logoBase64);
        const aspectRatio = imgProps.width / imgProps.height;
        const maxDimension = 35; // Define um tamanho máximo para largura ou altura
        const imgWidth = aspectRatio >= 1 ? maxDimension : maxDimension * aspectRatio;
        const imgHeight = aspectRatio >= 1 ? maxDimension / aspectRatio : maxDimension;
        const logoBase64Clean = logoBase64.startsWith('data:image') ? logoBase64.split(',')[1] : logoBase64;
        doc.addImage(logoBase64Clean, "PNG", 15, 5, imgWidth, imgHeight);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(escola || "Nome da Escola", 70, 20);
        doc.setFontSize(12);
        doc.text(`Relatório detalhado por turma - mês ${mes ? mes + '/' + ano : moment().format("MM/YYYY")}`, 70, 30);
        doc.setFont("helvetica", "normal");
        y += 40
    };

    addHeader();
    // Corpo
    // Agora percorre cada turma e monta o body para cada uma
    let body = [];
    turmas.forEach(turma => {
        // Adiciona uma linha de título da turma (opcional)
        body.push([
            { content: `Turma: ${turma.turma || turma.nome || turma.id || 'Sem nome'}`, colSpan: diasDoMes.length + 1, styles: { halign: 'left', fontStyle: 'bold', fillColor: [220, 220, 220] } }
        ]);
        (turma.alunos || []).forEach(aluno => {
            const linha = [aluno.nome];
            diasDoMes.forEach(dia => {
                linha.push({
                    presenca: Array.isArray(aluno.presencas) && aluno.presencas.includes(dia.data),
                    isFimDeSemana: isFinalDeSemana(dia.dateObj),
                });
            });
            body.push(linha);
        });
    });

    y += 10; // Espaço para o cabeçalho da tabela

    // Legenda no topo
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text('Legenda:', 40, y);

    // Bolinha verde - Presente
    doc.setFillColor(0, 200, 0);
    doc.circle(80, y - 2, 4, 'F');
    doc.setTextColor(0);
    doc.text('Presente', 90, y);

    // Bolinha vermelha - Ausente
    doc.setFillColor(220, 0, 0);
    doc.circle(160, y - 2, 4, 'F');
    doc.setTextColor(0);
    doc.text('Ausente', 170, y);

    // Traço - Fim de semana
    doc.setTextColor(100);
    doc.setFontSize(12);
    doc.text('-', 240, y);
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text('Fim de semana', 250, y);

    y += 10; // Espaço para a legenda

    // Gerar tabela
    autoTable(doc, {
        startY: y,
        head: [head],
        body: body,
        styles: {
            fontSize: 6,
            halign: 'center',
            valign: 'middle',
            cellWidth: 'wrap',
        },
        headStyles: {
            fillColor: [100, 100, 100],
            textColor: 255,
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 60 },
            '*': { cellWidth: 16 },
        },
        styles: {
            fontSize: 6,
            halign: 'center',
            valign: 'middle',
            cellPadding: 1,
        },
        didDrawCell: function (data) {
            const colIndex = data.column.index;
            const rowIndex = data.row.index;

            if (data.section === 'head') return;
            if (colIndex === 0) return;

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

    // Ao final, antes de retornar o PDF, adicionar a observação se existir:
    if (observacao) {
        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(`Observação: ${observacao}`, 40, doc.internal.pageSize.getHeight() - 40);
    }

    const addFooterToAllPages = () => {
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i); // Define a página atual
            doc.setFontSize(10);
            doc.text(`Página ${i} de ${totalPages}`, 10, 435); // Número da página no lado esquerdo
            doc.addImage(logoPresencaBase64, "PNG", 580, 420, 40, 15); // Logo do Presença no lado direito
        }
    };

    addFooterToAllPages();

    // Salvar PDF
    const pdfContent = doc.output("arraybuffer");
    return Buffer.from(pdfContent);
}

// Helpers
function getDiasDoMes(ano, mes) {
    const dias = [];
    const data = new Date(ano, mes, 1);
    const hoje = new Date();

    while (data.getMonth() === mes) {
        const isMesAtual = ano === hoje.getFullYear() && mes === hoje.getMonth();
        if (!isMesAtual || data <= hoje) {
            dias.push({
                dia: data.getDate(),
                data: data.toISOString().split('T')[0],
                dateObj: new Date(data),
            });
        }
        data.setDate(data.getDate() + 1);
    }
    return dias;
}

function isFinalDeSemana(date) {
    const diaSemana = date.getDay();
    return diaSemana === 0 || diaSemana === 6;
}

module.exports = { relatorioTurmaDetalhado };
