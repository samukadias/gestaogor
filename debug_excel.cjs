const XLSX = require('xlsx');
const path = '/Users/macbookair/Downloads/Lista VIP.xlsx';

try {
    console.log(`Lendo arquivo: ${path}`);
    const workbook = XLSX.readFile(path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Ler como JSON (header na linha 1)
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length === 0) {
        console.log("Planilha vazia!");
    } else {
        console.log("--- Linha 1 (Cabeçalhos) ---");
        console.log(JSON.stringify(data[0], null, 2));

        console.log("\n--- Linha 2 (Primeiro Registro) ---");
        console.log(JSON.stringify(data[1], null, 2));

        console.log("\n--- Linha 3 (Segundo Registro) ---");
        console.log(JSON.stringify(data[2], null, 2));
    }

    // Tentar ler com objeto para ver chaves
    const jsonData = XLSX.utils.sheet_to_json(sheet);
    if (jsonData.length > 0) {
        console.log("\n--- Exemplo de Objeto JSON (Chaves Detectadas) ---");
        console.log(JSON.stringify(jsonData[0], null, 2));
    }

} catch (e) {
    console.error("Erro ao ler arquivo:", e.message);
}
