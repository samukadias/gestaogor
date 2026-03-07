$taskName = "FluxoProd_AutoStart"
$scriptPath = "C:\Users\153758\.gemini\antigravity\scratch\fluxoProd-main\start_service.bat"

# Cria a acao (executar o batch)
$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c $scriptPath"

# Cria o trigger (ao iniciar o sistema)
$Trigger = New-ScheduledTaskTrigger -AtStartup

# Define o usuario como SYSTEM (roda sem estar logado)
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Configuracoes adicionais
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Registra a tarefa (forca se ja existir)
Register-ScheduledTask -TaskName $taskName -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Force

Write-Host "Tarefa $taskName registrada com sucesso para rodar no Boot do Windows!"
