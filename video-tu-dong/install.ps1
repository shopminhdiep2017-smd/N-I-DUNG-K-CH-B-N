# Bo cai video-use tu dong cho Windows. Chay bang CAI-DAT-WINDOWS.bat
$ErrorActionPreference = 'Stop'
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Repo = Join-Path $env:USERPROFILE '.claude\skills\video-use'
$Desktop = [Environment]::GetFolderPath('Desktop')
$Root = Join-Path $Desktop 'VIDEO-TU-DONG'

function Have($c) { [bool](Get-Command $c -ErrorAction SilentlyContinue) }
function Refresh-Path {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
              [Environment]::GetEnvironmentVariable('Path', 'User') + ';' +
              (Join-Path $env:USERPROFILE '.local\bin')
}
function Winget-Install($id) {
  winget install --id $id -e --silent --accept-source-agreements --accept-package-agreements
}

Write-Host '== 1/6 Cai cong cu nen (Git, FFmpeg, uv)' -ForegroundColor Cyan
if (-not (Have winget)) { throw 'May chua co winget. Hay cap nhat "App Installer" tu Microsoft Store roi chay lai.' }
if (-not (Have git))    { Winget-Install 'Git.Git' }
if (-not (Have ffmpeg)) { Winget-Install 'Gyan.FFmpeg' }
if (-not (Have uv))     { Winget-Install 'astral-sh.uv' }
Refresh-Path

Write-Host '== 2/6 Cai Claude Code' -ForegroundColor Cyan
if (-not (Have claude)) { Invoke-RestMethod https://claude.ai/install.ps1 | Invoke-Expression }
Refresh-Path

Write-Host "== 3/6 Tai video-use ve $Repo" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path (Split-Path $Repo) | Out-Null
if (Test-Path (Join-Path $Repo '.git')) { git -C $Repo pull --ff-only }
else { git clone https://github.com/browser-use/video-use $Repo }
Push-Location $Repo; uv sync; Pop-Location

Write-Host '== 4/6 Khoa API ElevenLabs (nhan dang giong noi)' -ForegroundColor Cyan
$EnvFile = Join-Path $Repo '.env'
if ((Test-Path $EnvFile) -and (Select-String -Path $EnvFile -Pattern '^ELEVENLABS_API_KEY=..' -Quiet)) {
  Write-Host 'Da co khoa, bo qua.'
} else {
  Write-Host 'Lay khoa tai: https://elevenlabs.io/app/settings/api-keys'
  $sec = Read-Host 'Dan khoa vao day roi nhan Enter' -AsSecureString
  $key = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
  [IO.File]::WriteAllText($EnvFile, "ELEVENLABS_API_KEY=$($key.Trim())`n")
}

Write-Host "== 5/6 Tao thu muc tren Desktop: $Root" -ForegroundColor Cyan
foreach ($d in '_he-thong', '1-THA-VIDEO-VAO-DAY', '2-VIDEO-HOAN-CHINH') {
  New-Item -ItemType Directory -Force -Path (Join-Path $Root $d) | Out-Null
}
Copy-Item (Join-Path $Here 'watcher.py') (Join-Path $Root '_he-thong\watcher.py') -Force
if (-not (Test-Path (Join-Path $Root 'yeu-cau.txt'))) { Copy-Item (Join-Path $Here 'yeu-cau.txt') $Root }
$bat = @"
@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
set PATH=%USERPROFILE%\.local\bin;%PATH%
cd /d "%~dp0"
uv run --project "$Repo" python "_he-thong\watcher.py" --root "%~dp0." --repo "$Repo"
pause
"@
[IO.File]::WriteAllText((Join-Path $Root 'BAT-DAU.bat'), ($bat -replace "`r?`n", "`r`n"))

Write-Host '== 6/6 Dang nhap Claude' -ForegroundColor Cyan
Write-Host 'Cua so Claude se mo. Dang nhap tai khoan Claude, xong go /exit roi Enter.'
Read-Host 'Nhan Enter de tiep tuc' | Out-Null
try { claude } catch { Write-Host 'Khong mo duoc claude, hay mo lai may roi chay lai bo cai.' }

Write-Host ''
Write-Host 'HOAN TAT! Mo thu muc VIDEO-TU-DONG tren Desktop, bam dup BAT-DAU.bat,' -ForegroundColor Green
Write-Host 'roi tha video vao 1-THA-VIDEO-VAO-DAY. Video xong nam trong 2-VIDEO-HOAN-CHINH.' -ForegroundColor Green
Start-Process explorer.exe $Root
