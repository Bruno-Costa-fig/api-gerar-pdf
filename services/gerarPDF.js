const { jsPDF } = require("jspdf"); // will automatically load the node version
const doc = new jsPDF();

function gerarPDF(texto) {
  doc.text("Lista de alunos", 10, 10);
  for(let i = 0; i < 100; i++) {
    doc.text(texto, 10, 20);
  }
  const pdfContent = doc.output("datauristring");
  return pdfContent;
}

module.exports = gerarPDF;