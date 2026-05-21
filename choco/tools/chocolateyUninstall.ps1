$installDir = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"
Remove-Item "$installDir\hyle.exe" -Force -ErrorAction SilentlyContinue
Uninstall-ChocolateyPath "$installDir"

Write-ChocolateySuccess $env:ChocolateyPackageName
