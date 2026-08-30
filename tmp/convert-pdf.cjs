const fs = require('fs');
const path = require('path');

// Use pdfmake's build directory for Node.js usage
const PdfPrinter = require('pdfmake/src/printer');

const fontsDir = path.join(__dirname, 'node_modules/pdfmake/fonts/Roboto');

const fonts = {
  Roboto: {
    normal: path.join(fontsDir, 'Roboto-Regular.ttf'),
    bold: path.join(fontsDir, 'Roboto-Medium.ttf'),
    italics: path.join(fontsDir, 'Roboto-Italic.ttf'),
    bolditalics: path.join(fontsDir, 'Roboto-MediumItalic.ttf')
  }
};

const printer = new PdfPrinter(fonts);

const specPath = path.join(__dirname, 'newpage-interview-prep.pdf.json');
const outputPath = path.join(__dirname, '..', 'outputs', 'newpage-interview-prep.pdf');

const docDefinition = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const pdfDoc = printer.createPdfKitDocument(docDefinition);

const chunks = [];
pdfDoc.on('data', chunk => chunks.push(chunk));
pdfDoc.on('end', () => {
  const pdfBuffer = Buffer.concat(chunks);
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log(`PDF created: ${outputPath}`);
  console.log(`Size: ${pdfBuffer.length} bytes`);
  console.log(`Signature: ${pdfBuffer.slice(0, 5).toString()}`);
});
pdfDoc.end();
