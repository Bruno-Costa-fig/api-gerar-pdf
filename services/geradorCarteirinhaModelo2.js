const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const { jsPDF } = require("jspdf");
const QRCode = require('qrcode');

async function gerarCarteirinhaModelo2(nomeAluno, nomeTurma, qrCodeBase64, outputPath) {
    const canvas = createCanvas(408, 648); // Tamanho da carteirinha
    const ctx = canvas.getContext("2d");

    // Caminhos para as imagens de fundo
    const frentePath = path.join(__dirname, "assets", "modelos", "edson", "modelo2", "frente2.png");

    // Carregar a imagem de fundo
    const frente = await loadImage(frentePath);

    // Decodificar o QR Code Base64
    // const qrCodeBuffer = Buffer.from(qrCodeBase64, "base64");
    // const qrCode = await loadImage(qrCodeBuffer);

    // Desenhar a frente no canvas
    ctx.drawImage(frente, 0, 0, 408, 648);

    // Configurações de qualidade
    ctx.imageSmoothingEnabled = true;

    // Desenhar QR Code
    // ctx.drawImage(qrCode, 126, 408, 155, 155);
    const qrCodeSvg = await QRCode.toString(JSON.stringify({
        Aluno: nomeAluno,
        ExternalReference: entity.ExternalReference,
        Turma: nomeTurma
    }), { type: 'svg' });
    const qrCodeBuffer = Buffer.from(qrCodeSvg);
    const qrCode = await loadImage(qrCodeBuffer);
    ctx.drawImage(qrCode, 126, 408, 155, 155);

    // Adicionar textos
    ctx.font = "bold 22px Arial"; // Fonte em negrito
    ctx.fillStyle = "#23997d"; // Cor do texto
    ctx.textAlign = "center";

    // Nome do aluno
    ctx.fillText(diminuirNome(capitalizarNome(nomeAluno)), 204, 330);

    // Nome da turma
    ctx.font = "bold 18px Arial"; // Fonte em negrito
    ctx.fillText(nomeTurma, 204, 372);

    // Salvar a imagem em um arquivo temporário
    const filePath = path.join(outputPath, `${nomeAluno.replace(/\s/g, "_")}-${Date.now()}.png`);
    const buffer = canvas.toBuffer("image/png",  { compressionLevel: 6 });
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

async function gerarPdfCarteirinhasModelo2(alunos) {
    // Criar a pasta temp dentro do projeto
    const tempPath = path.join(__dirname, "temp", "carteirinhas", `${Date.now()}`);
    try {
        fs.mkdirSync(tempPath, { recursive: true }); // Garante que a pasta será criada
    } catch (error) {
        console.error("Erro ao criar o diretório temporário:", error.message);
        throw error;
    }

    const carteirinhaPaths = [];

    try {
        for (const aluno of alunos) {
            const carteirinhaPath = await gerarCarteirinhaModelo2(
                aluno.name,
                aluno.turma,
                aluno.externalReference,
                aluno.qrCode,
                tempPath
            );
            carteirinhaPaths.push(carteirinhaPath);
        }

        const doc = new jsPDF({
            orientation: "landscape",
            unit: "px",
            format: "a4",
        });

        let x = 15;
        let y = 17;
        // const cardWidth = 156;
        const cardWidth = 119;
        // const cardHeight = 242;
        const cardHeight = 202;
        let count = 0;
        let countY = 0;

        for (const carteirinhaPath of carteirinhaPaths) {
            if (count === 0) {
                if (countY === 2) {
                    doc.addPage();
                    countY = 0;
                }

                y = countY === 0 ? 17 : 212 + 8;
                x = 15;
                countY++;
                count++;
            } else if (count === 4) {
                x += cardWidth + 2;
                count = 0;
            } else {
                count++;
                x += cardWidth + 2;
            }

            const carteirinhaBase64 = fs.readFileSync(carteirinhaPath, { encoding: "base64" });
            doc.addImage(carteirinhaBase64, "PNG", x, y, cardWidth, cardHeight, undefined, "MEDIUM");
        }

        // Retornar o PDF como um buffer
        const pdfContent = doc.output("arraybuffer");
        return Buffer.from(pdfContent);
    } finally {
        // Apagar os arquivos temporários
        for (const carteirinhaPath of carteirinhaPaths) {
            if (fs.existsSync(carteirinhaPath)) {
                fs.unlinkSync(carteirinhaPath);
            }
        }

        // Apagar a pasta temporária
        if (fs.existsSync(tempPath)) {
            fs.rmSync(tempPath, { recursive: true, force: true });
        }
    }
}

function diminuirNome(nome) {
    const preposicoes = new Set(["da", "de", "do", "das", "dos"]);
    const partes = nome.trim().split(" ");

    // Se o nome tem pelo menos 5 partes, começamos a abreviar os do meio
    if (partes.length >= 5) {
        for (let i = 2; i < partes.length - 1; i++) {
            if (!preposicoes.has(partes[i].toLowerCase())) {
                partes[i] = partes[i][0] + ".";
            }
        }
    }
    // Se o nome tem 4 partes e for muito longo, abreviamos o segundo nome ou primeiro sobrenome
    else if (partes.length >= 4 && nome.length > 24) {
        if (!preposicoes.has(partes[1].toLowerCase())) {
            partes[1] = partes[1][0] + ".";
        } else if (!preposicoes.has(partes[2].toLowerCase())) {
            partes[2] = partes[2][0] + ".";
        }
    }
    // Se o nome tem 3 partes e for longo, abreviamos o sobrenome
    else if (partes.length === 3 && nome.length > 24) {
        if (!preposicoes.has(partes[2].toLowerCase())) {
            partes[2] = partes[2][0] + ".";
        }
    }

    return partes.join(" ");
}

function capitalizarNome(nome) {
    return nome
        .toLowerCase()
        .split(" ")
        .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
        .join(" ");
}

module.exports = { gerarPdfCarteirinhasModelo2 };