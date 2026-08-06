# LabCore WebAssembly Build & Local Test Server Launcher

param (
    [int]$Port = 8080
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " LabCore WASM Build & Local Server Launcher 🚀" -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Environment Setup
$env:PATH = "C:\Program Files\CMake\bin;C:\Dev\emsdk;C:\Dev\emsdk\upstream\emscripten;C:\Dev\emsdk\node\20.18.0_64bit\bin;C:\Dev\emsdk\mingw\7.1.0_64bit\bin;$env:PATH"
$env:EMSDK = "C:/Dev/emsdk"
$env:EMSDK_NODE = "C:\Dev\emsdk\node\20.18.0_64bit\bin\node.exe"
$env:EMSDK_PYTHON = "C:\Dev\emsdk\python\3.13.3_64bit\python.exe"

# 2. Build WebAssembly Module
Write-Host "`n[1/4] Compiling C++ WebAssembly Module..." -ForegroundColor Yellow
if (-not (Test-Path "build_wasm")) {
    New-Item -ItemType Directory -Path "build_wasm" | Out-Null
}

Set-Location build_wasm
cmd.exe /c "emcmake cmake .. -G `"MinGW Makefiles`" -DCMAKE_BUILD_TYPE=Release && emmake mingw32-make -j4"
if ($LASTEXITCODE -ne 0) {
    Write-Error "[Error] WebAssembly build failed."
    Set-Location ..
    exit 1
}
Set-Location ..

Write-Host "[Success] C++ WASM compilation completed!" -ForegroundColor Green

# 3. Terminate Existing Server on Port
Write-Host "`n[2/4] Checking for existing server processes on port $Port..." -ForegroundColor Yellow
$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($connections) {
    foreach ($conn in $connections) {
        $procId = $conn.OwningProcess
        if ($procId -gt 0) {
            Write-Host "Closing existing process (PID $procId) on port $Port..." -ForegroundColor DarkYellow
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 1
} else {
    Write-Host "Port $Port is clear." -ForegroundColor Green
}

# 4. Launch Local Web Server
Write-Host "`n[3/4] Starting local HTTP Web Server on http://localhost:$Port..." -ForegroundColor Yellow
$pythonExe = "C:\Dev\emsdk\python\3.13.3_64bit\python.exe"
if (Test-Path $pythonExe) {
    $serverProcess = Start-Process -FilePath $pythonExe -ArgumentList "-m", "http.server", "$Port" -PassThru -WindowStyle Hidden
} else {
    $serverProcess = Start-Process -FilePath "python" -ArgumentList "-m", "http.server", "$Port" -PassThru -WindowStyle Hidden
}

Start-Sleep -Seconds 2
Write-Host "[Success] Server running (PID $($serverProcess.Id)) on port $Port!" -ForegroundColor Green

# 5. Open Web App in Browser
Write-Host "`n[4/4] Opening Web App in browser..." -ForegroundColor Yellow
$targetUrl = "http://localhost:$Port/index.html"
Start-Process $targetUrl

Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host " App URL: $targetUrl" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan

