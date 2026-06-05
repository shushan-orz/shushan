$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$entryName = -join @([char]0x7ef4, [char]0x62a4, [char]0x5165, [char]0x53e3)
$levelName = -join @([char]0x5730, [char]0x7f16)
$modelName = -join @([char]0x6a21, [char]0x578b)
$blueprintName = -join @([char]0x84dd, [char]0x56fe)
$videoName = -join @([char]0x89c6, [char]0x9891)
$profileName = -join @([char]0x4e2a, [char]0x4eba, [char]0x4fe1, [char]0x606f)
$trailName = -join @([char]0x62d6, [char]0x5c3e)
$entryRoot = Join-Path (Join-Path $root "assets") $entryName
$imageExts = @(".jpg", ".jpeg", ".png", ".webp")
$trailImageExts = @(".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg")
$modelExts = @(".obj", ".fbx")
$materialExts = @(".mtl")
$videoExts = @(".mp4", ".webm", ".ogg", ".mov")

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

function Get-SortKey($name) {
  $fileName = [System.IO.Path]::GetFileNameWithoutExtension($name)
  if ($fileName -match "^(\d+)") {
    return ("{0:D8}-{1}" -f [int]$Matches[1], $fileName.ToLowerInvariant())
  }
  return "99999999-$($fileName.ToLowerInvariant())"
}

function Get-TokenName($text) {
  return ($text.ToLowerInvariant() -replace "[^a-z0-9]", "")
}

function Get-FirstImage($folder, $preferredName) {
  foreach ($ext in $imageExts) {
    $candidate = Join-Path $folder "$preferredName$ext"
    if (Test-Path -LiteralPath $candidate) { return $candidate }
  }
  return $null
}

function Get-ModelTextureInfo($folder) {
  $textures = [ordered]@{
    baseColor = ""
    roughness = ""
    metalness = ""
    normal = ""
    textureSets = @()
  }
  $textureSetMap = [ordered]@{}
  $imageFiles = Get-ChildItem -LiteralPath $folder -File -Recurse |
    Where-Object { $imageExts -contains $_.Extension.ToLowerInvariant() } |
    Sort-Object FullName

  foreach ($file in $imageFiles) {
    $token = Get-TokenName ([System.IO.Path]::GetFileNameWithoutExtension($file.Name))
    $relativePath = Get-RelativeWebPath $file.FullName
    $kind = ""
    if ($token -match "basecolor|basecolour|albedo|diffuse|colormap") { $kind = "baseColor" }
    elseif ($token -match "occlusionroughnessmetallic|roughnessmetallic") { $kind = "packedRoughnessMetalness" }
    elseif ($token -match "roughness|rough") { $kind = "roughness" }
    elseif ($token -match "metalness|metallic|metal") { $kind = "metalness" }
    elseif ($token -match "normal|normalmap|nrm") { $kind = "normal" }

    if ($kind) {
      $setKey = $token `
        -replace "basecolor|basecolour|albedo|diffuse|colormap", "" `
        -replace "occlusionroughnessmetallic|roughnessmetallic", "" `
        -replace "roughness|rough", "" `
        -replace "metalness|metallic|metal", "" `
        -replace "normalmap|normal|nrm", ""
      if (-not $setKey) { $setKey = "default" }
      if (-not $textureSetMap.Contains($setKey)) {
        $textureSetMap[$setKey] = [ordered]@{
          name = $setKey
          baseColor = ""
          roughness = ""
          metalness = ""
          normal = ""
        }
      }
      if ($kind -eq "packedRoughnessMetalness") {
        if (-not $textureSetMap[$setKey]["roughness"]) { $textureSetMap[$setKey]["roughness"] = $relativePath }
        if (-not $textureSetMap[$setKey]["metalness"]) { $textureSetMap[$setKey]["metalness"] = $relativePath }
      } elseif (-not $textureSetMap[$setKey][$kind]) {
        $textureSetMap[$setKey][$kind] = $relativePath
      }
    }

    if (-not $textures["baseColor"] -and ($token -match "basecolor|basecolour|albedo|diffuse|colormap")) {
      $textures["baseColor"] = $relativePath
    }
    if (-not $textures["roughness"] -and ($token -match "roughness|rough")) {
      $textures["roughness"] = $relativePath
    }
    if (-not $textures["metalness"] -and ($token -match "metalness|metallic|metal")) {
      $textures["metalness"] = $relativePath
    }
    if (-not $textures["normal"] -and ($token -match "normal|normalmap|nrm")) {
      $textures["normal"] = $relativePath
    }
    if ($token -match "occlusionroughnessmetallic|roughnessmetallic") {
      if (-not $textures["roughness"]) { $textures["roughness"] = $relativePath }
      if (-not $textures["metalness"]) { $textures["metalness"] = $relativePath }
    }
  }

  $textures["textureSets"] = @($textureSetMap.Values | Where-Object {
    $_["baseColor"] -or $_["roughness"] -or $_["metalness"] -or $_["normal"]
  })
  return $textures
}

function Test-IsTextureLikeImageFile($file) {
  $token = Get-TokenName ([System.IO.Path]::GetFileNameWithoutExtension($file.Name))
  return ($token -match "basecolor|basecolour|albedo|diffuse|colormap|roughness|rough|metalness|metallic|metal|normal|normalmap|nrm|emissive|opacity|alpha|ambientocclusion|occlusion|height|displacement")
}

function Test-IsModelTextureFile($file, $textures) {
  $relative = Get-RelativeWebPath $file.FullName
  foreach ($value in $textures.Values) {
    if ($value -is [string] -and $value -and $value -eq $relative) { return $true }
    if ($value -is [array]) {
      foreach ($set in $value) {
        foreach ($setValue in $set.Values) {
          if ($setValue -is [string] -and $setValue -eq $relative) { return $true }
        }
      }
    }
  }
  return $false
}

function Get-ModelPreviewImage($folder, $modelFile, $textures) {
  foreach ($name in @("cover", "preview", "thumbnail", "poster", "image")) {
    $preferred = Get-FirstImage $folder $name
    if ($preferred) { return $preferred }
  }

  if ($modelFile) {
    $stem = [System.IO.Path]::GetFileNameWithoutExtension($modelFile.Name)
    $sameName = Get-FirstImage $folder $stem
    if ($sameName) { return $sameName }
  }

  $image = Get-ChildItem -LiteralPath $folder -File -Recurse |
    Where-Object { $imageExts -contains $_.Extension.ToLowerInvariant() } |
    Where-Object { -not (Test-IsModelTextureFile $_ $textures) -and -not (Test-IsTextureLikeImageFile $_) } |
    Sort-Object FullName |
    Select-Object -First 1
  if ($image) { return $image.FullName }
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

function Read-MaterialMapFile($path) {
  $data = @()
  if (-not (Test-Path -LiteralPath $path)) { return $data }
  Get-Content -LiteralPath $path -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $parts = $line.Split("=", 2)
    if ($parts.Count -eq 2) {
      $data += [ordered]@{
        material = $parts[0].Trim()
        textureSet = $parts[1].Trim()
      }
    }
  }
  return $data
}

$profileInfo = Read-KeyValueFile (Join-Path (Join-Path $entryRoot $profileName) "info.txt")

$cursorTrail = [ordered]@{
  enabled = "1"
  scale = "1"
  opacity = "0.86"
  image = ""
}
$trailRoot = Join-Path $entryRoot $trailName
if (Test-Path -LiteralPath $trailRoot) {
  $trailInfo = Read-KeyValueFile (Join-Path $trailRoot "config.txt")
  if ($trailInfo["enabled"]) { $cursorTrail["enabled"] = $trailInfo["enabled"] }
  if ($trailInfo["scale"]) { $cursorTrail["scale"] = $trailInfo["scale"] }
  if ($trailInfo["opacity"]) { $cursorTrail["opacity"] = $trailInfo["opacity"] }
  $trailImage = Get-ChildItem -LiteralPath $trailRoot -File |
    Where-Object { $trailImageExts -contains $_.Extension.ToLowerInvariant() } |
    Sort-Object Name |
    Select-Object -First 1
  if ($trailImage) {
    $cursorTrail["image"] = Get-RelativeWebPath $trailImage.FullName
  }
}

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
  $folderTitleKeys = New-Object "System.Collections.Generic.HashSet[string]"
  Get-ChildItem -LiteralPath $modelRoot -Directory |
    Sort-Object Name |
    ForEach-Object {
      $projectDir = $_.FullName
      $modelFile = Get-ChildItem -LiteralPath $projectDir -File -Recurse |
        Where-Object { $modelExts -contains $_.Extension.ToLowerInvariant() } |
        Sort-Object FullName |
        Select-Object -First 1
      if (-not $modelFile) { return }

      $infoPath = Join-Path $projectDir "info.txt"
      $info = @()
      if (Test-Path -LiteralPath $infoPath) {
        $info = Get-Content -LiteralPath $infoPath -Encoding UTF8
      }
      $title = if ($info.Count -ge 1 -and $info[0].Trim()) { $info[0].Trim() } else { Get-CleanTitle $projectDir }
      $textures = Get-ModelTextureInfo $projectDir
      $materialMap = Read-MaterialMapFile (Join-Path $projectDir "material-map.txt")
      $preview = Get-ModelPreviewImage $projectDir $modelFile $textures
      if (-not $preview) {
        $preview = Get-FirstImage $modelRoot ([System.IO.Path]::GetFileNameWithoutExtension($_.Name))
      }
      if (-not $preview) { return }

      $materialFile = Get-ChildItem -LiteralPath $projectDir -File -Recurse |
        Where-Object { $materialExts -contains $_.Extension.ToLowerInvariant() } |
        Sort-Object FullName |
        Select-Object -First 1

      [void]$folderTitleKeys.Add((Get-TokenName $title))
      $modelingWorks += [ordered]@{
        sortKey = Get-SortKey $_.Name
        title = $title
        image = Get-RelativeWebPath $preview
        model = Get-RelativeWebPath $modelFile.FullName
        material = if ($materialFile) { Get-RelativeWebPath $materialFile.FullName } else { "" }
        textures = $textures
        materialMap = @($materialMap)
        tag = "Modeling"
      }
    }

  $modelFiles = Get-ChildItem -LiteralPath $modelRoot -File |
    Where-Object { $modelExts -contains $_.Extension.ToLowerInvariant() }
  $legacyWorks = Get-ChildItem -LiteralPath $modelRoot -File |
    Where-Object { $imageExts -contains $_.Extension.ToLowerInvariant() } |
    Sort-Object Name |
    ForEach-Object {
      $imageFile = $_
      $imageStem = [System.IO.Path]::GetFileNameWithoutExtension($imageFile.Name)
      $imageCleanName = Get-CleanTitle $imageFile.FullName
      if ($folderTitleKeys.Contains((Get-TokenName $imageCleanName))) { return }
      $matchedModel = $modelFiles |
        Where-Object { [System.IO.Path]::GetFileNameWithoutExtension($_.Name) -eq $imageStem } |
        Select-Object -First 1
      if (-not $matchedModel) {
        $matchedModel = $modelFiles |
          Where-Object { (Get-CleanTitle $_.FullName) -eq $imageCleanName } |
          Select-Object -First 1
      }
      [ordered]@{
        sortKey = Get-SortKey $imageFile.Name
        title = $imageCleanName
        image = Get-RelativeWebPath $imageFile.FullName
        model = if ($matchedModel) { Get-RelativeWebPath $matchedModel.FullName } else { "" }
        material = ""
        textures = [ordered]@{
          baseColor = ""
          roughness = ""
          metalness = ""
          normal = ""
          textureSets = @()
        }
        materialMap = @()
        tag = "Modeling"
      }
    }
  $modelingWorks += @($legacyWorks)
  $modelingWorks = $modelingWorks |
    Sort-Object { $_.sortKey } |
    ForEach-Object {
      [ordered]@{
        title = $_.title
        image = $_.image
        model = $_.model
        material = $_.material
        textures = $_.textures
        materialMap = @($_.materialMap)
        tag = $_.tag
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

$videos = @()
$videoRoot = Join-Path $entryRoot $videoName
if (Test-Path -LiteralPath $videoRoot) {
  Get-ChildItem -LiteralPath $videoRoot -File -Filter "*.txt" |
    Sort-Object Name |
    ForEach-Object {
      $info = Read-KeyValueFile $_.FullName
      if ($info["type"] -eq "gradient") {
        $videos += [ordered]@{
          title = if ($info["title"]) { $info["title"] } else { Get-CleanTitle $_.FullName }
          type = "gradient"
          duration = if ($info["duration"]) { [double]$info["duration"] } else { 5 }
          tag = if ($info["tag"]) { $info["tag"] } else { "Video" }
          text = if ($info["text"]) { $info["text"] } else { "" }
        }
      }
    }

  Get-ChildItem -LiteralPath $videoRoot -File |
    Where-Object { $videoExts -contains $_.Extension.ToLowerInvariant() } |
    Sort-Object Name |
    ForEach-Object {
      $base = [System.IO.Path]::GetFileNameWithoutExtension($_.FullName)
      $infoPath = Join-Path $videoRoot "$base.txt"
      $info = Read-KeyValueFile $infoPath
      $poster = Get-FirstImage $videoRoot $base
      $item = [ordered]@{
        title = if ($info["title"]) { $info["title"] } else { Get-CleanTitle $_.FullName }
        source = Get-RelativeWebPath $_.FullName
        type = "video"
        tag = if ($info["tag"]) { $info["tag"] } else { "Video" }
        text = if ($info["text"]) { $info["text"] } else { "" }
      }
      if ($poster) { $item["poster"] = Get-RelativeWebPath $poster }
      $videos += $item
    }
}

$stamp = (Get-Date).ToString("yyyyMMddHHmmss")
$manifest = [ordered]@{
  generatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
  profile = $profileInfo
  levelProjects = @($levelProjects)
  modelingWorks = @($modelingWorks)
  blueprints = @($blueprints)
  videos = @($videos)
  cursorTrail = $cursorTrail
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
Write-Host "Level projects: $($levelProjects.Count); Models: $($modelingWorks.Count); Blueprints: $($blueprints.Count); Videos: $($videos.Count); Trail image: $($cursorTrail.image); Profile keys: $($profileInfo.Count)"
