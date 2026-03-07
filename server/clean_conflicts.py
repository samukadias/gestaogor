import os
import re

def clean_file(filepath):
    print(f"Cleaning {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to find conflict blocks and keep only the HEAD section
    # <<<<<<< HEAD
    # (HEAD content)
    # =======
    # (REMOTE content)
    # >>>>>>> (commit/branch)
    
    pattern = re.compile(r'<<<<<<< HEAD\n(.*?)\n?=======\n(.*?)\n?>>>>>>> [a-f0-9]+', re.DOTALL)
    
    # We want to keep the FIRST group (HEAD)
    new_content = pattern.sub(r'\1', content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

conflicts = [
    r"src\api\fluxoClient.js",
    r"src\Pages\DemandDetail.jsx",
    r"src\Pages\Demands.jsx",
    r"src\Pages\Financeiro\Contracts.jsx",
    r"src\Pages\Login.jsx",
    r"src\Pages\Financeiro\components\AttestationForm.jsx",
    r"src\Pages\Financeiro\components\ContractForm.jsx",
    r"src\Pages\Dashboard.jsx",
    r"src\Pages\Prazos\Legacy\components\layout\AppLayout.jsx",
    r"src\Pages\Prazos\Legacy\components\layout\Sidebar.jsx",
    r"src\Pages\Prazos\Legacy\components\dashboard\DexAlert.jsx",
    r"src\Components\demands\DemandForm.jsx",
    r"src\Components\dashboard\BottleneckBarChart.jsx",
    r"src\Components\dashboard\BottleneckChart.jsx",
    r"server\package.json",
    r"src\Components\dashboard\ComplexityChart.jsx",
    r"src\Components\dashboard\StatsCard.jsx",
    r"src\Pages\Prazos\Legacy\components\contracts\ContractTable.jsx",
    r"src\Pages\Prazos\Legacy\pages\EditContract.jsx"
]

base_path = r"C:\Users\153758\.gemini\antigravity\scratch\fluxoProd-main"

for rel_path in conflicts:
    full_path = os.path.join(base_path, rel_path)
    if os.path.exists(full_path):
        cleaned = clean_file(full_path)
        if cleaned:
            print(f"  Successfully cleaned {rel_path}")
        else:
            print(f"  No markers found in {rel_path} (or regex mismatch)")
    else:
        print(f"  File not found: {rel_path}")
