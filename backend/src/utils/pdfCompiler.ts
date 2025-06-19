import {exec} from 'child_process';
import fs from 'fs';
import path from 'path';
import tmp from 'tmp';

export async function compileLatexToPDF(latex: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const tmpDir = tmp.dirSync({unsafeCleanup: true});
        const texPath = path.join(tmpDir.name, 'document.tex');
        const pdfPath = path.join(tmpDir.name, 'document.pdf');

        fs.writeFileSync(texPath, latex);

        exec(`pdflatex -interaction=nonstopmode -output-directory=${tmpDir.name} ${texPath}`, (error) => {
            if (error) {
                reject(`Erro ao compilar LaTeX: ${error.message}`);
            } else {
                const pdfBuffer = fs.readFileSync(pdfPath);
                tmpDir.removeCallback(); // Limpa temporários
                resolve(pdfBuffer);
            }
        });
    });
}
