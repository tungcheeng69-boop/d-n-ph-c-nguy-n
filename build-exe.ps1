# Tu dong hoa build file EXE chay offline local cho TECHPROJECT (Desktop App Mode)

# Load PATH environment variables so that node, npm and npx are recognized
$env:PATH = [System.Environment]::GetEnvironmentVariable("Path", "User") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "Machine")

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   DANG DONG GOI BAN DESKTOP APP CHO TECHPROJECT..." -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Dam bao thu muc dau ra sach se
$distDir = "dist/techproject-windows"
if (Test-Path $distDir) {
    Write-Host "> Don dep thu muc dist cu..."
    Remove-Item -Recurse -Force $distDir
}
New-Item -ItemType Directory -Path "$distDir/bin" -Force | Out-Null

# 2. Copy files Next.js Standalone
Write-Host "> Dang copy code may chu Next.js Standalone..."
Copy-Item -Recurse -Force ".next/standalone/*" $distDir

# 3. Copy assets tinh (.next/static va public)
Write-Host "> Dang copy static assets va folder public..."
New-Item -ItemType Directory -Path "$distDir/.next/static" -Force | Out-Null
Copy-Item -Recurse -Force ".next/static/*" "$distDir/.next/static"
if (Test-Path "public") {
    Copy-Item -Recurse -Force "public" "$distDir/public"
}

# 4. Copy node.exe portable tu node he thong
Write-Host "> Dang copy Node.js portable engine..."
$nodePath = (Get-Command node).Source
if ($nodePath) {
    Copy-Item -Force $nodePath "$distDir/bin/node.exe"
    Write-Host "  Copy thanh cong: $nodePath -> $distDir/bin/node.exe" -ForegroundColor Green
} else {
    Write-Error "Khong tim thay node.exe tren he thong! Vui long cai Node.js truoc."
    Exit 1
}

# 5. Bien dich launcher C# thanh techproject.exe bang Add-Type cua PowerShell (Target: WindowsApplication de an console)
Write-Host "> Dang bien dich launcher.cs thanh file .exe cua so Desktop..."
$code = Get-Content -Raw -Path "launcher.cs"
Add-Type -TypeDefinition $code -Language CSharp -ReferencedAssemblies "System.Windows.Forms", "System.Drawing" -OutputAssembly "$distDir/techproject.exe" -OutputType WindowsApplication

# 6. Kiem tra va thong bao ket qua
if (Test-Path "$distDir/techproject.exe") {
    Write-Host "=========================================================" -ForegroundColor Green
    Write-Host "  DONG GOI THANH CONG BAN DESKTOP LOCAL PORTABLE!" -ForegroundColor Green
    Write-Host "  Thu muc ung dung: dist\techproject-windows" -ForegroundColor Yellow
    Write-Host "  File khoi chay chinh: techproject.exe (Cua so doc lap)" -ForegroundColor Yellow
    Write-Host "  Nhan doi techproject.exe de chay app ma khong co cua so console den!" -ForegroundColor Green
    Write-Host "=========================================================" -ForegroundColor Green
} else {
    Write-Error "Loi bien dich techproject.exe!"
}
