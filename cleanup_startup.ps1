$startupPath = "C:\Users\153758\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup"
$filesToDelete = @("FluxoProd_AutoStart.vbs", "FluxoProd.lnk")

foreach ($file in $filesToDelete) {
    if (Test-Path "$startupPath\$file") {
        Remove-Item "$startupPath\$file" -Force
        Write-Host "Removido $file da pasta Inicializar para evitar duplicidade."
    }
}
