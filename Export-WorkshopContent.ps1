<#
    Export-WorkshopContent.ps1

    Copies ONLY the files that make up the Civ VII mod (the payload that gets
    uploaded to the Steam Workshop) into a fixed folder on your Desktop
    (Desktop\settler-lens-turn-1). Repeat runs overwrite that same
    folder and delete anything in it that is no longer part of the mod, so the
    Workshop upload path never changes. Skips repo/build scaffolding: .git,
    *.md (README/WORKSHOP), workshop_item.vdf, .gitignore/.gitattributes, and
    this script itself.

    Kept: settler-lens-turn-1.modinfo, config\, text\, ui\, preview.png

    Usage (from anywhere):
        powershell -ExecutionPolicy Bypass -File .\Export-WorkshopContent.ps1

    If Windows blocks the script, right-click > Properties > Unblock, or run
    the command above (the -ExecutionPolicy Bypass handles it).
#>

[CmdletBinding()]
param(
    # Source = the repo. Defaults to the folder this script lives in.
    [string]$Source = $PSScriptRoot,

    # Where to drop the clean copy. Defaults to your Desktop.
    [string]$DestRoot = [Environment]::GetFolderPath('Desktop'),

    # Folder name under $DestRoot. Fixed so the upload path never changes.
    [string]$DestName = 'settler-lens-turn-1'
)

$ErrorActionPreference = 'Stop'

if (-not $Source) { $Source = (Get-Location).Path }
$Source = (Resolve-Path $Source).Path

# Always the same folder, so Steam's upload path stays put between runs.
$Dest = Join-Path $DestRoot $DestName

Write-Host "Source: $Source"
Write-Host "Dest:   $Dest"
Write-Host ""

# --- What to leave out -------------------------------------------------------
# Directories excluded anywhere in the tree (robocopy /XD).
$excludeDirs = @('.git')

# Files excluded by name/pattern anywhere in the tree (robocopy /XF).
$excludeFiles = @(
    '*.md'                      # README.md, WORKSHOP.md
    'workshop_item.vdf'         # steamcmd build script, not mod content
    '.gitignore'
    '.gitattributes'
    '*.ps1'                     # this script (in case it lives in the repo)
)

# Reusing one folder means stale files can linger, so mirror instead of merge.
# Only ever purge a folder we recognise as a previous export (or a brand new
# one) — never blow away something the user happens to have pointed us at.
$purge = $true
if (Test-Path -LiteralPath $Dest) {
    $looksLikeExport = Test-Path -LiteralPath (Join-Path $Dest 'settler-lens-turn-1.modinfo')
    if (-not $looksLikeExport) {
        if (@(Get-ChildItem -Force -LiteralPath $Dest).Count -gt 0) {
            Write-Error "$Dest already exists and doesn't look like a previous export (no settler-lens-turn-1.modinfo). Move or rename it, or pass -DestName."
            exit 1
        }
        $purge = $false   # empty folder: nothing to clean up
    }
}

# robocopy: /E copy subdirs incl. empty, /PURGE drop files gone from the source,
# /NFL /NDL quiet file/dir lists, /NJH no job header, /NP no per-file percentage.
$roboArgs = @($Source, $Dest, '/E', '/NFL', '/NDL', '/NJH', '/NP')
if ($purge) { $roboArgs += '/PURGE' }
$roboArgs += '/XD'; $roboArgs += $excludeDirs
$roboArgs += '/XF'; $roboArgs += $excludeFiles

& robocopy @roboArgs | Out-Null

# robocopy exit codes 0-7 are success (8+ = error). Don't let 1/2/3 look like a failure.
if ($LASTEXITCODE -ge 8) {
    Write-Error "robocopy failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "Done. Clean upload folder:"
Write-Host "  $Dest"
Write-Host ""
Write-Host "Contents:"
Get-ChildItem -Recurse -File $Dest |
    ForEach-Object { "  " + $_.FullName.Substring($Dest.Length + 1) } |
    Sort-Object

# Open it in Explorer.
Start-Process explorer.exe $Dest