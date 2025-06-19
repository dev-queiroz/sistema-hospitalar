import {exec} from 'child_process';
import fs from 'fs';
import path from 'path';
import tmp from 'tmp';
import util from 'util';
import winston from 'winston';

const execPromise = util.promisify(exec);

const logger = winston.createLogger({
    level: 'error',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({filename: 'error.log'}),
        new winston.transports.Console(),
    ],
});

export async function compileLatexToPDF(latex: string): Promise<Buffer> {
    const tmpDir = tmp.dirSync({unsafeCleanup: true});
    const texPath = path.join(tmpDir.name, 'document.tex');
    const pdfPath = path.join(tmpDir.name, 'document.pdf');

    try {
        fs.writeFileSync(texPath, latex);
        logger.info(`LaTeX file written to ${texPath}`);

        const {stdout, stderr} = await execPromise(
            `pdflatex -interaction=nonstopmode -output-directory=${tmpDir.name} ${texPath}`,
            {timeout: 30000} // 30s timeout
        );

        if (stderr) {
            logger.warn(`pdflatex stderr: ${stderr}`);
        }
        logger.info(`pdflatex stdout: ${stdout}`);

        if (!fs.existsSync(pdfPath)) {
            throw new Error('PDF output not found');
        }

        const pdfBuffer = fs.readFileSync(pdfPath);
        logger.info(`PDF generated successfully, size: ${pdfBuffer.length} bytes`);
        return pdfBuffer;
    } catch (error: any) {
        logger.error('LaTeX compilation error', {
            message: error.message,
            stderr: error.stderr || '',
            stdout: error.stdout || '',
        });
        throw new Error(`Failed to compile LaTeX: ${error.message}`);
    } finally {
        try {
            tmpDir.removeCallback();
            logger.info(`Temporary directory ${tmpDir.name} cleaned up`);
        } catch (cleanupError: any) {
            logger.error('Failed to clean up temporary directory', {message: cleanupError.message});
        }
    }
}