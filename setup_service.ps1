$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c $($PWD.Path)\start_gestaogor.bat"
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName "GestaoGor_AutoStart" -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Force
