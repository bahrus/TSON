
dim fso
Set fso = CreateObject("Scripting.FileSystemObject")
dim CurrentDirectory
CurrentDirectory = fso.GetAbsolutePathName(".")
Set oShell = WScript.CreateObject ("WScript.Shell")
oShell.run CurrentDirectory & "\nginx.exe -s stop"