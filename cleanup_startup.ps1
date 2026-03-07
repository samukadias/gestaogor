$startupPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$filesToDelete = @("GestaoGor_AutoStart.vbs", "GestaoGOR.lnk")

foreach ($file in $filesToDelete) {
    if (Test-Path "$startupPath\$file") {
        Remove-Item "$startupPath\$file" -Force
        Write-Host "Removido $file da pasta Inicializar para evitar duplicidade."
    }
}
