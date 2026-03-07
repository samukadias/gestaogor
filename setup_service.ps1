$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c C:\Users\153758\.gemini\antigravity\scratch\fluxoProd-main\start_fluxoprod.bat"
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName "FluxoProd_AutoStart" -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Force
