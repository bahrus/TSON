dim fso
Set fso = CreateObject("Scripting.FileSystemObject")
dim CurrentDirectory
CurrentDirectory = fso.GetAbsolutePathName(".")
dim logsDir 
logsDir = CurrentDirectory & "\logs"
If not fso.FolderExists(logsDir) Then
	fso.CreateFolder(logsDir)
End If
dim tempDir
tempDir = CurrentDirectory & "\temp"
If not fso.FolderExists(tempDir) Then
	fso.CreateFolder(tempDir)
End If
dim accessLogsFilePath
accessLogsFilePath = logsDir & "\access.log"
If not fso.FileExists(accessLogsFilePath) Then
 Set a = fso.CreateTextFile(accessLogsFilePath, True)
    a.WriteLine("")
    a.Close
End If

Set oShell = WScript.CreateObject ("WScript.Shell")
oShell.run CurrentDirectory & "\nginx.exe"
Set oShell = Nothing
set objShell = CreateObject("WScript.Shell")
objShell.run("http://localhost")