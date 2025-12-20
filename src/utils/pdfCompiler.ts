import PDFDocument from 'pdfkit';
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({filename: 'error.log', level: 'error'}),
        new winston.transports.File({filename: 'combined.log'}),
        new winston.transports.Console({format: winston.format.simple()}),
    ],
});

interface PDFData {
    paciente: { nome: string; cpf: string; cns: string; dataNascimento: string };
    profissional: { nome: string; papel: string; crm?: string };
    unidade: { nome: string; telefone: string };
    prontuario: { descricao: string };
    triagens: { createdAt: string; queixaPrincipal: string; nivelGravidade: string }[];
}

export async function compileToPDF(data: PDFData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({margin: 50, size: 'A4'});
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            logger.info(`PDF generated with pdfkit, size: ${pdfBuffer.length} bytes`);
            resolve(pdfBuffer);
        });
        doc.on('error', (err) => {
            logger.error('PDFKit error', {message: err.message});
            reject(err);
        });

        doc.fontSize(20).fillColor('blue').text('Prontuário Médico', {align: 'center'});
        doc.fontSize(12).fillColor('gray').text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, {align: 'center'});
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

        doc.moveDown(1).fontSize(14).fillColor('black').text('Informações Gerais');
        doc.fontSize(12)
            .text(`Paciente: ${data.paciente.nome || 'N/A'}`)
            .text(`CPF: ${data.paciente.cpf || 'N/A'}`)
            .text(`CNS: ${data.paciente.cns || 'N/A'}`)
            .text(`Data de Nascimento: ${data.paciente.dataNascimento || 'N/A'}`)
            .text(`Profissional: ${data.profissional.nome || 'N/A'} (${data.profissional.papel === 'MEDICO' ? `Médico, CRM: ${data.profissional.crm || 'N/A'}` : 'Enfermeiro'})`)
            .text(`Unidade de Saúde: ${data.unidade.nome || 'N/A'}`)
            .text(`Telefone: ${data.unidade.telefone || 'N/A'}`);
        doc.moveDown(1);

        doc.fontSize(14).text('Descrição do Prontuário');
        doc.fontSize(12).text(data.prontuario.descricao || 'Nenhuma descrição fornecida.', {paragraphGap: 10});
        doc.moveDown(1);

        doc.fontSize(14).text('Triagens Associadas');
        if (data.triagens.length > 0) {
            data.triagens.forEach((t) => {
                doc.fontSize(12).text(`• ${new Date(t.createdAt).toLocaleDateString('pt-BR')}: ${t.queixaPrincipal || 'N/A'} (Gravidade: ${t.nivelGravidade || 'N/A'})`);
            });
        } else {
            doc.fontSize(12).text('• Nenhuma triagem registrada.');
        }
        doc.moveDown(1);

        doc.fontSize(10).fillColor('gray').text('Confidencial - Uso exclusivo do Sistema Hospitalar', 50, doc.page.height - 50, {align: 'center'});
        doc.text('sistema-hospitalar.onrender.com', {align: 'center', link: 'http://localhost:3000'});

        doc.end();
    });
}