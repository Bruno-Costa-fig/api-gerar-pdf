const { createCanvas, loadImage } = require('canvas');
const path = require('path');

async function gerarImagemPrimeiroAcesso(nome, link, qrCodeBase64) {
    // Remove o prefixo "data:image/png;base64," se existir
    const base64Data = qrCodeBase64.startsWith('data:image')
        ? qrCodeBase64.split(',')[1]
        : qrCodeBase64;

    // Caminho da imagem base
    const imagePath = path.join(__dirname, 'assets', 'primeiro-acesso.png');

    // Carrega a imagem base
    const baseImage = await loadImage(imagePath);

    // Decodifica o QR Code em base64
    const qrCodeBuffer = Buffer.from(base64Data, 'base64');
    const qrCodeImage = await loadImage(qrCodeBuffer);

    // Cria o canvas com as dimensões da imagem base
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext('2d');

    // Desenha a imagem base no canvas
    ctx.drawImage(baseImage, 0, 0);

    // Redimensiona e desenha o QR Code no canvas
    const qrCodeSize = 200; // Ajuste o tamanho conforme necessário
    ctx.drawImage(qrCodeImage, 430, 680, qrCodeSize, qrCodeSize); // Ajuste as coordenadas conforme necessário

    // Adiciona o nome à imagem
    ctx.font = '32px Roboto';
    ctx.fillStyle = 'black';
    ctx.fillText(nome, 160, 300); // Ajuste as coordenadas conforme necessário
    
    ctx.font = '16px Arial';
    // Adiciona o link à imagem
    ctx.fillText(link, 160, 670); // Ajuste as coordenadas conforme necessário

    // Converte a imagem final para base64
    const finalImageBase64 = canvas.toDataURL().split(',')[1];

    console.log('Imagem gerada com sucesso!');
    // Retorna a imagem em base64
    return { imageBase64: finalImageBase64 };
}

module.exports = { gerarImagemPrimeiroAcesso };