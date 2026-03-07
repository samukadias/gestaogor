const fs = require('fs');
const path = require('path');

const conflicts = [
    "src/api/fluxoClient.js",
    "src/Pages/DemandDetail.jsx",
    "src/Pages/Demands.jsx",
    "src/Pages/Financeiro/Contracts.jsx",
    "src/Pages/Login.jsx",
    "src/Pages/Financeiro/components/AttestationForm.jsx",
    "src/Pages/Financeiro/components/ContractForm.jsx",
    "src/Pages/Dashboard.jsx",
    "src/Pages/Prazos/Legacy/components/layout/AppLayout.jsx",
    "src/Pages/Prazos/Legacy/components/layout/Sidebar.jsx",
    "src/Pages/Prazos/Legacy/components/dashboard/DexAlert.jsx",
    "src/Components/demands/DemandForm.jsx",
    "src/Components/dashboard/BottleneckBarChart.jsx",
    "src/Components/dashboard/BottleneckChart.jsx",
    "server/package.json",
    "src/Components/dashboard/ComplexityChart.jsx",
    "src/Components/dashboard/StatsCard.jsx",
    "src/Pages/Prazos/Legacy/components/contracts/ContractTable.jsx",
    "src/Pages/Prazos/Legacy/pages/EditContract.jsx"
];

const basePath = "C:/Users/153758/.gemini/antigravity/scratch/fluxoProd-main";

conflicts.forEach(relPath => {
    const fullPath = path.join(basePath, relPath);
    if (fs.existsSync(fullPath)) {
        console.log(`Cleaning ${relPath}...`);
        let content = fs.readFileSync(fullPath, 'utf8');

        // Regex to find conflict blocks and keep only the HEAD section
        // Matches <<<<<<< HEAD ... ======= ... >>>>>>> [hex]
        const pattern = /<<<<<<< HEAD\r?\n([\s\S]*?)\r?\n?=======\r?\n[\s\S]*?\r?\n?>>>>>>> [a-f0-9]+/g;

        const newContent = content.replace(pattern, '$1');

        if (newContent !== content) {
            fs.writeFileSync(fullPath, newContent, 'utf8');
            console.log(`  Successfully cleaned ${relPath}`);
        } else {
            console.log(`  No markers found in ${relPath} (or regex mismatch)`);
        }
    } else {
        console.log(`  File not found: ${relPath}`);
    }
});
