# Push ANSDT project to GitHub repository
# Usage: Run this script from the project root in PowerShell: .\push_to_repo.ps1

param(
    [string]$RepoUrl = "https://github.com/prasadk2304/News_Agent.git",
    [string]$Branch = "main",
    [switch]$DryRun
)

# Helper to check for git command results
function Invoke-GitCommand {
    param([scriptblock]$Command)
    Write-Host "$ $Command" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Git command failed with exit code $LASTEXITCODE."
        exit $LASTEXITCODE
    }
}

Write-Host "This will add, commit, and push the current project to: $RepoUrl on branch $Branch" -ForegroundColor Yellow
$proceed = Read-Host "Proceed? (y/n)"
if ($proceed -ne 'y') {
    Write-Host "Aborted by user." -ForegroundColor Gray
    exit 0
}

if ($DryRun) {
    Write-Host "Dry run: showing git status" -ForegroundColor Yellow
    Invoke-GitCommand { git status --short }
    exit 0
}

# Initialize git if needed
if (-not (Test-Path ".git")) {
    Write-Host "No git repository found. Initializing..." -ForegroundColor Yellow
    Invoke-GitCommand { git init }
}

# Add remote if missing or different
$remotes = git remote -v 2>$null
if (-not $remotes -or ($remotes -notmatch $RepoUrl)) {
    Write-Host "Setting remote origin to $RepoUrl" -ForegroundColor Yellow
    if (git remote get-url origin 2>$null) {
        Invoke-GitCommand { git remote remove origin }
    }
    Invoke-GitCommand { git remote add origin $RepoUrl }
}

# Add all files
Invoke-GitCommand { git add . }

# Commit message prompt
$commitMsg = Read-Host "Enter commit message (default: 'Add project files')"
if (-not $commitMsg) { $commitMsg = 'Add project files' }

# Run commit natively in PowerShell (handles space strings securely)
Invoke-GitCommand { git commit -m $commitMsg }

# Ensure branch name matches
Invoke-GitCommand { git branch -M $Branch }

# Push to remote branch
Invoke-GitCommand { git push -u origin $Branch }

Write-Host "Push complete." -ForegroundColor Green
