import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PdfPrinter = (await import('pdfmake')).default;

const fonts = {
  Roboto: {
    normal: join(__dirname, 'node_modules/pdfmake/build/vfs_fonts.js').replace('vfs_fonts.js', '../fonts/Roboto/Roboto-Regular.ttf'),
    bold: join(__dirname, 'node_modules/pdfmake/build/vfs_fonts.js').replace('vfs_fonts.js', '../fonts/Roboto/Roboto-Medium.ttf'),
    italics: join(__dirname, 'node_modules/pdfmake/build/vfs_fonts.js').replace('vfs_fonts.js', '../fonts/Roboto/Roboto-Italic.ttf'),
    bolditalics: join(__dirname, 'node_modules/pdfmake/build/vfs_fonts.js').replace('vfs_fonts.js', '../fonts/Roboto/Roboto-MediumItalic.ttf')
  }
};

const printer = new PdfPrinter(fonts);

const specPath = join(__dirname, 'newpage-interview-prep.pdf.json');
const outputPath = join(__dirname, '..', 'outputs', 'newpage-interview-prep.pdf');

const docDefinition = JSON.parse(readFileSync(specPath, 'utf8'));
const pdfDoc = printer.createPdfKitDocument(docDefinition);

const chunks = [];
pdfDoc.on('data', chunk => chunks.push(chunk));
pdfDoc.on('end', () => {
  const pdfBuffer = Buffer.concat(chunks);
  writeFileSync(outputPath, pdfBuffer);
  console.log(`PDF created: ${outputPath}`);
  console.log(`Size: ${pdfBuffer.length} bytes`);
  console.log(`Signature: ${pdfBuffer.slice(0, 5).toString()}`);
});
pdfDoc.end();
