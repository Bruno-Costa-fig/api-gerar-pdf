const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

async function gerarCarteirinha(nomeAluno, nomeTurma, qrCodeBase64, nomeEscola) {
    const canvas = createCanvas(1600, 400); // Tamanho da carteirinha
    const ctx = canvas.getContext("2d");

    // Caminhos para as imagens de fundo e modelo
    const fundoPath = path.join(__dirname, "assets", "base", "fundo.png");
    const modeloPath = path.join(__dirname, "assets", "base", "frente.png");

    // Carregar as imagens de fundo e modelo
    const fundo = await loadImage(fundoPath);
    const modelo = await loadImage(modeloPath);

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

    // Adicionar textos
    ctx.font = "18px Arial";
    ctx.fillStyle = "#3339a6";
    ctx.fillText(nomeEscola, 180, 60);

    ctx.font = "20px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(nomeAluno, 895, 170);
    ctx.fillText(new Date().toLocaleDateString(), 895, 245);

    ctx.font = "12px Arial";
    ctx.fillText(`31/12/${new Date().getFullYear()}`, 830, 360);

    ctx.font = "16px Arial";
    ctx.fillText(nomeTurma, 95, 170);

    // Salvar ou retornar a imagem final
    const outputPath = `carteirinha-${nomeAluno.replace(/\s/g, "_")}.png`;
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
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
    const carteirinhaPaths = [];

    for (let i = 0; i < alunos.length; i++) {
        const aluno = alunos[i];

        // Gerar a imagem da carteirinha
        const carteirinhaPath = await gerarCarteirinha(
            aluno.name,
            aluno.turma,
            aluno.qrCode, // QR Code já em Base64
            nomeEscola
        );
        
        carteirinhaPaths.push(carteirinhaPath); // Adicionar o caminho ao array

        // Carregar a imagem gerada
        const carteirinhaBase64 = fs.readFileSync(carteirinhaPath, {
            encoding: "base64",
        });

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

    // Remover os arquivos PNG gerados
    for (const path of carteirinhaPaths) {
        try {
            fs.unlinkSync(path); // Apagar o arquivo
        } catch (error) {
            console.error(`Erro ao apagar o arquivo ${path}:`, error.message);
        }
    }

    // Retornar o PDF como um buffer
    const pdfContent = doc.output("arraybuffer");
    return Buffer.from(pdfContent);
}

module.exports = { gerarPdfCarteirinhas };