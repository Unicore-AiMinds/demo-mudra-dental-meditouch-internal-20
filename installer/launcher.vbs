' Mudra Clinic — Hidden Launcher
' Starts the Node.js server, OpenClaw gateway, and system tray icon.
' All processes run without a console window.

Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)

Set WshShell = CreateObject("WScript.Shell")

' Start Node.js server hidden (window style 0 = hidden)
WshShell.Run """" & appDir & "\node.exe"" """ & appDir & "\server\mudra-server.mjs""", 0, False

' Wait a moment for the server to start
WScript.Sleep 2000

' Start system tray icon (PowerShell, hidden window)
WshShell.Run "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & appDir & "\tray.ps1""", 0, False

' Open default browser to the app
WshShell.Run "http://localhost:8080", 1, False
