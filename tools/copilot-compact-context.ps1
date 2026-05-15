param(
    [string]$OutputPath = "copilot-context.md",
    [int]$LogTail = 80
)

$ErrorActionPreference = "Stop"

function Add-Section {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [string]$Title
    )
    $Lines.Add("")
    $Lines.Add("## $Title")
}

function Add-CommandOutput {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [string]$Command,
        [string]$WorkingDirectory = "."
    )
    $Lines.Add("")
    $Lines.Add('```powershell')
    $Lines.Add($Command)
    $Lines.Add('```')
    $Lines.Add("")
    $Lines.Add('```text')
    try {
        $result = Invoke-Expression "Set-Location -LiteralPath '$WorkingDirectory'; $Command" 2>&1
        if ($null -eq $result) {
            $Lines.Add("(no output)")
        } else {
            foreach ($line in $result) {
                $Lines.Add((Mask-Secrets "$line"))
            }
        }
    } catch {
        $Lines.Add((Mask-Secrets $_.Exception.Message))
    } finally {
        Set-Location -LiteralPath $script:RepoRoot
    }
    $Lines.Add('```')
}

function Add-GitStatus {
    param([System.Collections.Generic.List[string]]$Lines)
    $Lines.Add("")
    $Lines.Add('```powershell')
    $Lines.Add('git status --short')
    $Lines.Add('```')
    $Lines.Add("")
    $Lines.Add('```text')
    try {
        $result = & git -c "safe.directory=*" status --short 2>&1
        if ($null -eq $result) {
            $Lines.Add("(no output)")
        } else {
            foreach ($line in $result) {
                $Lines.Add((Mask-Secrets "$line"))
            }
        }
    } catch {
        $Lines.Add((Mask-Secrets $_.Exception.Message))
    }
    $Lines.Add('```')
}

function Mask-Secrets {
    param([string]$Text)
    if ($null -eq $Text) {
        return ""
    }
    $masked = $Text
    $masked = $masked -replace '(?i)(password|api[_-]?key|token|secret|credential)(\s*[:=]\s*)\S+', '$1$2[REDACTED]'
    $masked = $masked -replace '(?i)(DB_PASSWORD|FOOD_API_KEY|CLOUD_SQL_CONNECTION_NAME|DB_URL)(\s*=\s*).*', '$1$2[REDACTED]'
    return $masked
}

function Add-EnvSummary {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [string]$EnvPath
    )
    $Lines.Add("")
    $Lines.Add('```text')
    if (-not (Test-Path -LiteralPath $EnvPath)) {
        $Lines.Add(".env missing")
        $Lines.Add('```')
        return
    }
    Get-Content -LiteralPath $EnvPath | ForEach-Object {
        if ($_ -match '^\s*#' -or $_ -notmatch '=') {
            return
        }
        $key = ($_ -replace '=.*$', '').Trim()
        if ($key) {
            $Lines.Add("$key=[REDACTED]")
        }
    }
    $Lines.Add('```')
}

$script:RepoRoot = (Resolve-Path ".").Path
$lines = [System.Collections.Generic.List[string]]::new()

$lines.Add("# Compact Copilot Context")
$lines.Add("")
$lines.Add("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
$lines.Add("Repo: $script:RepoRoot")
$lines.Add("")
$lines.Add("Purpose: provide a small, sanitized context packet for Copilot CLI or another local assistant.")

Add-Section $lines "Current Focus"
$lines.Add("- Backend DB connection and recipe image API verification.")
$lines.Add("- Frontend calls `/api/v1/recipes` and falls back to mock data if the backend is unavailable.")
$lines.Add("- Do not expose `.env` values; only key presence is included.")

Add-Section $lines "Sanitized Env Keys"
Add-EnvSummary $lines (Join-Path $script:RepoRoot "BackEnd\.env")

Add-Section $lines "Git Status"
Add-GitStatus $lines

Add-Section $lines "Backend Config"
Add-CommandOutput $lines "Get-Content -Path BackEnd\src\main\resources\application-local.yml"

Add-Section $lines "Recent Backend Log"
$backendLog = Join-Path $script:RepoRoot "BackEnd\backend-run.log"
$lines.Add("")
$lines.Add('```text')
if (Test-Path -LiteralPath $backendLog) {
    Get-Content -LiteralPath $backendLog -Tail $LogTail | ForEach-Object {
        $lines.Add((Mask-Secrets $_))
    }
} else {
    $lines.Add("BackEnd\backend-run.log not found.")
}
$lines.Add('```')

Add-Section $lines "Verification Commands"
$lines.Add('- `cd BackEnd; .\gradlew.bat build`')
$lines.Add('- `cd BackEnd; .\gradlew.bat bootRun --args="--spring.profiles.active=local"`')
$lines.Add('- `Invoke-RestMethod http://localhost:8080/api/v1/recipes?limit=3`')
$lines.Add('- `cd FrontEnd_In; npx tsc --noEmit`')
$lines.Add('- `cd FrontEnd_In; npm run lint`')

$resolvedOutput = Join-Path $script:RepoRoot $OutputPath
$lines | Set-Content -LiteralPath $resolvedOutput -Encoding UTF8
Write-Output $resolvedOutput
