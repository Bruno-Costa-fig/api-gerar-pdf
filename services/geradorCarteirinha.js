const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

let _fundoCache = null;
let _modeloCache = null;

async function getImagensBase(){
    if(!_fundoCache){
        const fundoPath = path.join(__dirname, "assets", "base", "fundo.png");
        _fundoCache = await loadImage(fundoPath);
    }
    if(!_modeloCache){
        const modeloPath = path.join(__dirname, "assets", "base", "frente.png");
        _modeloCache = await loadImage(modeloPath);
    }
    return { fundo: _fundoCache, modelo: _modeloCache };
}

async function gerarCarteirinhaBuffer(nomeAluno, nomeTurma, qrCodeBase64, nomeEscola) {
    const canvas = createCanvas(1600, 400); // Tamanho da carteirinha
    const ctx = canvas.getContext("2d");

    const { fundo, modelo } = await getImagensBase();

    // Decodificar o QR Code Base64
    const qrCodeBuffer = Buffer.from(qrCodeBase64, "base64");
    const qrCode = await loadImage(qrCodeBuffer);

    // Desenhar as imagens no canvas
    ctx.drawImage(fundo, 0, 0, 800, 400); // Fundo no lado esquerdo
    ctx.drawImage(modelo, 800, 0, 800, 400); // Modelo no lado direito
    ctx.drawImage(qrCode, 550, 90, 200, 200); // QR Code no lado direito

    // Adicionar textos
    ctx.font = "18px Arial";
    ctx.fillStyle = "#3339a6";
    ctx.fillText(nomeEscola, 980, 60);
    ctx.fillText(nomeEscola, 180, 60);

    ctx.font = "20px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(nomeAluno, 895, 170);
    ctx.fillText(new Date().toLocaleDateString(), 895, 245);

    ctx.font = "12px Arial";
    ctx.fillText(`31/12/${new Date().getFullYear()}`, 830, 360);

    ctx.font = "16px Arial";
    ctx.fillText(nomeTurma, 95, 170);

    const buffer = canvas.toBuffer("image/png");

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpar o canvas para liberar memória
    canvas.width = 0; // Redefinir o tamanho do canvas para liberar memória
    canvas.height = 0;

    return buffer;
}

async function gerarPdfCarteirinhas(alunos, nomeEscola) {
    const { jsPDF } = require("jspdf");
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let x = 10; // Margem inicial no eixo X
    let y = 10; // Margem inicial no eixo Y
    const cardWidth = 430; // Largura da carteirinha
    const cardHeight = 150; // Altura da carteirinha

    for (let i = 0; i < alunos.length; i++) {
        const aluno = alunos[i];

        // Gerar a imagem da carteirinha
        const carteirinhaBuffer = await gerarCarteirinhaBuffer(
            aluno.name,
            aluno.turma,
            aluno.qrCode, // QR Code já em Base64
            nomeEscola
        );
        
        const carteirinhaBase64 = carteirinhaBuffer.toString("base64");

        // Adicionar a imagem ao PDF
        doc.addImage(carteirinhaBase64, "PNG", x, y, cardWidth, cardHeight);

        // Atualizar a posição para a próxima carteirinha
        x += cardWidth;
        if (x + cardWidth > pageWidth) {
            x = 10; // Reinicia na margem esquerda
            y += cardHeight;
        }

        // Adicionar uma nova página se ultrapassar o limite da página
        if (y + cardHeight > pageHeight) {
            doc.addPage();
            x = 10;
            y = 10;
        }
    }

    // Retornar o PDF como um buffer
    const pdfContent = doc.output("arraybuffer");
    return Buffer.from(pdfContent);
}

module.exports = { gerarPdfCarteirinhas };