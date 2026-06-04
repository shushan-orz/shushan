$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$entryName = -join @([char]0x7ef4, [char]0x62a4, [char]0x5165, [char]0x53e3)
$levelName = -join @([char]0x5730, [char]0x7f16)
$modelName = -join @([char]0x6a21, [char]0x578b)
$blueprintName = -join @([char]0x84dd, [char]0x56fe)
$profileName = -join @([char]0x4e2a, [char]0x4eba, [char]0x4fe1, [char]0x606f)
$entryRoot = Join-Path (Join-Path $root "assets") $entryName
$imageExts = @(".jpg", ".jpeg", ".png", ".webp")

function Get-RelativeWebPath($path) {
  $rootFull = [System.IO.Path]::GetFullPath($root).TrimEnd("\")
  $pathFull = [System.IO.Path]::GetFullPath($path)
  $relative = $pathFull.Substring($rootFull.Length).TrimStart("\")
  return ($relative -replace "\\", "/")
}

function Get-CleanTitle($path) {
  $name = [System.IO.Path]::GetFileNameWithoutExtension($path)
  return ($name -replace "^\d+[-_. ]*", "")
}

function Get-FirstImage($folder, $preferredName) {
  foreach ($ext in $imageExts) {
    $candidate = Join-Path $folder "$preferredName$ext"
    if (Test-Path -LiteralPath $candidate) { return $candidate }
  }
  return $null
}

function Read-KeyValueFile($path) {
  $data = [ordered]@{}
  if (-not (Test-Path -LiteralPath $path)) { return $data }
  Get-Content -LiteralPath $path -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $parts = $line.Split("=", 2)
    if ($parts.Count -eq 2) {
      $data[$parts[0].Trim()] = $parts[1].Trim()
    }
  }
  return $data
}

$profileInfo = Read-KeyValueFile (Join-Path (Join-Path $entryRoot $profileName) "info.txt")

$levelProjects = @()
$levelRoot = Join-Path $entryRoot $levelName
if (Test-Path -LiteralPath $levelRoot) {
  Get-ChildItem -LiteralPath $levelRoot -Directory | Sort-Object Name | ForEach-Object {
    $projectDir = $_.FullName
    $cover = Get-FirstImage $projectDir "cover"
    if (-not $cover) { return }

    $infoPath = Join-Path $projectDir "info.txt"
    $info = @()
    if (Test-Path -LiteralPath $infoPath) {
      $info = Get-Content -LiteralPath $infoPath -Encoding UTF8
    }

    $detailsDir = Join-Path $projectDir "details"
    $details = @()
    if (Test-Path -LiteralPath $detailsDir) {
      $details = Get-ChildItem -LiteralPath $detailsDir -File |
        Where-Object { $imageExts -contains $_.Extension.ToLowerInvariant() } |
        Sort-Object Name |
        ForEach-Object { Get-RelativeWebPath $_.FullName }
    }

    $levelProjects += [ordered]@{
      title = if ($info.Count -ge 1 -and $info[0].Trim()) { $info[0].Trim() } else { Get-CleanTitle $projectDir }
      subtitle = if ($info.Count -ge 2 -and $info[1].Trim()) { $info[1].Trim() } else { "Level Project" }
      cover = Get-RelativeWebPath $cover
      details = @($details)
    }
  }
}

$modelingWorks = @()
$modelRoot = Join-Path $entryRoot $modelName
if (Test-Path -LiteralPath $modelRoot) {
  $modelingWorks = Get-ChildItem -LiteralPath $modelRoot -File |
    Where-Object { $imageExts -contains $_.Extension.ToLowerInvariant() } |
    Sort-Object Name |
    ForEach-Object {
      [ordered]@{
        title = Get-CleanTitle $_.FullName
        image = Get-RelativeWebPath $_.FullName
        tag = "Modeling"
      }
    }
}

$blueprints = @()
$blueprintRoot = Join-Path $entryRoot $blueprintName
if (Test-Path -LiteralPath $blueprintRoot) {
  $blueprints = Get-ChildItem -LiteralPath $blueprintRoot -File -Filter "*.txt" |
    Sort-Object Name |
    ForEach-Object {
      [ordered]@{
        title = Get-CleanTitle $_.FullName
        txtFile = Get-RelativeWebPath $_.FullName
        text = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
        note = "TXT: $($_.Name)"
      }
    }
}

$stamp = (Get-Date).ToString("yyyyMMddHHmmss")
$manifest = [ordered]@{
  generatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
  profile = $profileInfo
  levelProjects = @($levelProjects)
  modelingWorks = @($modelingWorks)
  blueprints = @($blueprints)
}

$json = $manifest | ConvertTo-Json -Depth 8
$output = "window.PORTFOLIO_MANIFEST = $json;`n"
$outputPath = Join-Path $root "portfolio-manifest.js"
Set-Content -LiteralPath $outputPath -Value $output -Encoding UTF8

$indexPath = Join-Path $root "index.html"
if (Test-Path -LiteralPath $indexPath) {
  $manifestSrc = "portfolio-manifest.js"
  $indexText = Get-Content -LiteralPath $indexPath -Raw -Encoding UTF8
  $indexText = [regex]::Replace(
    $indexText,
    '<script src="(?:assets/[^"]*/)?portfolio-manifest\.js(?:\?v=[^"]*)?" defer></script>',
    "<script src=`"$manifestSrc`" defer></script>"
  )
  Set-Content -LiteralPath $indexPath -Value $indexText -Encoding UTF8
}

Write-Host "Manifest refreshed: $outputPath"
Write-Host "Level projects: $($levelProjects.Count); Models: $($modelingWorks.Count); Blueprints: $($blueprints.Count); Profile keys: $($profileInfo.Count)"
