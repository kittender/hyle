$ErrorActionPreference = 'Stop'

# Extract version from nuspec or package.json
# For Chocolatey: version comes from the .nupkg filename or nuspec
$version = $env:chocolateyPackageVersion
if (-not $version) {
  # Fallback: read from package name if not set
  $version = "0.1.0"
}

$packageArgs = @{
  packageName   = $env:ChocolateyPackageName
  fileType      = 'exe'
  url64bit      = "https://github.com/kittender/hyle/releases/download/v${version}/hyle-windows-x64.exe"
  checksum64    = 'PLACEHOLDER_SHA256_X64'  # Updated by CI/CD during release
  checksumType64= 'sha256'
  validExitCodes= @(0)
  silentArgs    = ''
  destination   = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"
}

# Download and verify binary
Get-ChocolateyWebFile @packageArgs -OutFile "$($packageArgs.destination)\hyle.exe"

# Add to PATH
Install-ChocolateyPath "$($packageArgs.destination)"

# Verify installation
& "$($packageArgs.destination)\hyle.exe" --version | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Installation verification failed: hyle --version returned exit code $LASTEXITCODE"
}

Write-ChocolateySuccess $env:ChocolateyPackageName
