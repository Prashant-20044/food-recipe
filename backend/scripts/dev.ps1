$ErrorActionPreference = "Stop"

$backendDir = Split-Path -Parent $PSScriptRoot
$repoRoot = Resolve-Path (Join-Path $backendDir "..\..")
$dataPath = Join-Path $repoRoot ".mongodb-data"
$logDir = Join-Path $repoRoot ".mongodb-log"
$logPath = Join-Path $logDir "mongod.log"
$mongodPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"

if (-not (Test-Path $mongodPath)) {
  Write-Error "MongoDB was not found at $mongodPath"
}

New-Item -ItemType Directory -Force $dataPath | Out-Null
New-Item -ItemType Directory -Force $logDir | Out-Null

function Test-Mongo {
  & node -e "require('dotenv').config({path: require('path').resolve(__dirname, '../../.env')}); const mongoose=require('mongoose'); mongoose.connect(process.env.CONNECTION_STRING,{serverSelectionTimeoutMS:1000}).then(()=>mongoose.disconnect()).then(()=>process.exit(0)).catch(()=>process.exit(1))" 2>$null
  return $LASTEXITCODE -eq 0
}

if (Test-Mongo) {
  Write-Host "MongoDB is already running on 127.0.0.1:27017"
} else {
  Write-Host "Starting MongoDB..."
  $mongoProcess = Start-Process -FilePath $mongodPath -ArgumentList @(
    "--dbpath", $dataPath,
    "--bind_ip", "127.0.0.1",
    "--port", "27017",
    "--logpath", $logPath,
    "--logappend"
  ) -WindowStyle Hidden -PassThru

  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500

    if ($mongoProcess.HasExited) {
      Get-Content $logPath -Tail 40
      Write-Error "MongoDB exited early."
    }

    if (Test-Mongo) {
      Write-Host "MongoDB started on 127.0.0.1:27017"
      break
    }
  }

  if (-not (Test-Mongo)) {
    Get-Content $logPath -Tail 40
    Write-Error "MongoDB did not start."
  }
}

Write-Host "Starting backend..."
Set-Location $backendDir
& ".\node_modules\.bin\nodemon.cmd" server.js
