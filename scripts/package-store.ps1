param([string]$OutputDirectory = '')

$ErrorActionPreference = 'Stop'
$taskRepoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = Join-Path $taskRepoRoot 'dist'
}
$taskOutputRoot = [System.IO.Path]::GetFullPath($OutputDirectory)
$taskManifest = Get-Content -LiteralPath (Join-Path $taskRepoRoot 'manifest.json') -Raw | ConvertFrom-Json
$taskFiles = @(
    'manifest.json', 'background.js', 'extract.js', 'picker.js',
    'offscreen.html', 'offscreen.js', 'guide.html', 'guide.css', 'guide.js',
    'privacy.html', 'icons/icon16.png', 'icons/icon32.png', 'icons/icon48.png', 'icons/icon128.png'
)

foreach ($taskFile in $taskFiles) {
    $taskSource = [System.IO.Path]::GetFullPath((Join-Path $taskRepoRoot $taskFile))
    if (-not $taskSource.StartsWith($taskRepoRoot + [System.IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Package source is outside the repository: $taskFile"
    }
    if (-not (Test-Path -LiteralPath $taskSource -PathType Leaf)) {
        throw "Missing package file: $taskFile"
    }
}

New-Item -ItemType Directory -Path $taskOutputRoot -Force | Out-Null
$taskZipPath = Join-Path $taskOutputRoot "TextLift-$($taskManifest.version)-chrome-web-store.zip"
if (Test-Path -LiteralPath $taskZipPath) { Remove-Item -LiteralPath $taskZipPath }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$taskArchive = [System.IO.Compression.ZipFile]::Open($taskZipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($taskFile in $taskFiles) {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $taskArchive, (Join-Path $taskRepoRoot $taskFile), $taskFile,
            [System.IO.Compression.CompressionLevel]::Optimal
        ) | Out-Null
    }
} finally { $taskArchive.Dispose() }

Write-Output "Created $taskZipPath ($($taskFiles.Count) runtime files; manifest.json at ZIP root)."
