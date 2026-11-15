Set shell = CreateObject("WScript.Shell")
script = "Z:\肥鱼的一生0.1\tools\qq-napcat-monitor.ps1"
command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & script & """"
shell.Run command, 0, False
