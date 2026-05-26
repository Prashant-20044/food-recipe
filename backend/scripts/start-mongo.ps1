$ErrorActionPreference = "Stop"

$dataPath = "C:\Program Files\MongoDB\Server\8.2\data"
$logDir = Join-Path $env:LOCALAPPDATA "foodRecipeApp\mongodb-log"
$logPath = Join-Path $logDir "mongod.log"
$mongodPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"

function Test-MongoPort {
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $connection = $client.BeginConnect("127.0.0.1", 27017, $null, $null)
    if (-not $connection.AsyncWaitHandle.WaitOne(500)) {
      return $false
    }

    $client.EndConnect($connection)
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

if (-not (Test-Path $mongodPath)) {
  Write-Error "MongoDB was not found at $mongodPath"
}

New-Item -ItemType Directory -Force $dataPath | Out-Null
New-Item -ItemType Directory -Force $logDir | Out-Null

if (Test-MongoPort) {
  Write-Host "MongoDB is already listening on 127.0.0.1:27017"
  exit 0
}

Start-Process `
  -FilePath $mongodPath `
  -ArgumentList "--dbpath `"$dataPath`" --bind_ip 127.0.0.1 --port 27017 --logpath `"$logPath`" --logappend" `
  -WindowStyle Hidden

for ($i = 0; $i -lt 20; $i++) {
  Start-Sleep -Milliseconds 500

  if (Test-MongoPort) {
    Write-Host "MongoDB started on 127.0.0.1:27017"
    exit 0
  }
}

Write-Error "MongoDB did not start. Check $logPath"
