$source = 'D:\Projects\Pathpilot'
$dest   = 'D:\Projects\PathPilot-Share.zip'
$tmpDir = 'D:\Projects\_pathpilot_stage'

# Remove old artifacts
if (Test-Path $dest) { Remove-Item $dest -Force }
if (Test-Path $tmpDir) { Remove-Item $tmpDir -Recurse -Force }
New-Item -ItemType Directory -Path $tmpDir | Out-Null

Write-Host "Collecting files from: $source"

$excludeDirs = @(
    'node_modules', '.git', '__pycache__', 'venv', '.venv', '.venv_new',
    '.idea', '.vscode', 'backend-node-legacy', 'postgres_data', 'datasets',
    '.mypy_cache', '.pytest_cache', 'dist', 'build'
)

$files = Get-ChildItem -Path $source -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring($source.Length + 1)
    $segments = $rel -split '\\'
    $skip = $false
    foreach ($seg in $segments) {
        if ($excludeDirs -contains $seg) { $skip = $true; break }
    }
    if ($_.Name -like '*.zip') { $skip = $true }
    if ($_.Name -eq '.DS_Store') { $skip = $true }
    if ($_.Name -like '*.pyc') { $skip = $true }
    -not $skip
}

Write-Host "Found $($files.Count) files to include."

foreach ($f in $files) {
    $rel = $f.FullName.Substring($source.Length + 1)
    $target = Join-Path $tmpDir $rel
    $targetDir = Split-Path $target -Parent
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    Copy-Item $f.FullName -Destination $target
}

Write-Host "Compressing to $dest ..."
Compress-Archive -Path "$tmpDir\*" -DestinationPath $dest -CompressionLevel Optimal
Remove-Item $tmpDir -Recurse -Force

$sizeMB = [math]::Round((Get-Item $dest).Length / 1MB, 1)
Write-Host "SUCCESS! PathPilot-Share.zip created at: $dest"
Write-Host "Size: $sizeMB MB"
