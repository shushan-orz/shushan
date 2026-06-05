$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$preferredPort = 8089

function Get-FreePort($startPort) {
  for ($candidate = $startPort; $candidate -lt ($startPort + 50); $candidate += 1) {
    $probe = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidate)
    try {
      $probe.Start()
      return $candidate
    } catch {
      continue
    } finally {
      try { $probe.Stop() } catch {}
    }
  }
  throw "No free local preview port found from $startPort."
}

$port = Get-FreePort $preferredPort
$url = "http://localhost:$port/"

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".htm" = "text/html; charset=utf-8"
  ".js" = "text/javascript; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".txt" = "text/plain; charset=utf-8"
  ".obj" = "text/plain"
  ".mtl" = "text/plain"
  ".fbx" = "application/octet-stream"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".png" = "image/png"
  ".webp" = "image/webp"
  ".gif" = "image/gif"
  ".svg" = "image/svg+xml"
  ".mp4" = "video/mp4"
  ".webm" = "video/webm"
  ".ogg" = "video/ogg"
  ".mov" = "video/quicktime"
}

function Get-SafePath($urlPath) {
  $cleanPath = ($urlPath -split "\?")[0]
  $relative = [System.Uri]::UnescapeDataString($cleanPath.TrimStart("/"))
  if (-not $relative) { $relative = "index.html" }
  $relative = $relative -replace '/', '\'
  $target = [System.IO.Path]::GetFullPath((Join-Path $root $relative))
  $rootFull = [System.IO.Path]::GetFullPath($root).TrimEnd('\') + '\'
  if (-not $target.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $null
  }
  if (Test-Path -LiteralPath $target -PathType Container) {
    $target = Join-Path $target "index.html"
  }
  return $target
}

function Write-Bytes($stream, $bytes) {
  $stream.Write($bytes, 0, $bytes.Length)
}

function Write-TextResponse($stream, $statusCode, $statusText, $body) {
  $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
  $header = "HTTP/1.1 $statusCode $statusText`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($bodyBytes.Length)`r`nConnection: close`r`nAccess-Control-Allow-Origin: *`r`n`r`n"
  Write-Bytes $stream ([System.Text.Encoding]::ASCII.GetBytes($header))
  Write-Bytes $stream $bodyBytes
}

function Write-FileResponse($stream, $method, $path) {
  $extension = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
  $contentType = if ($mimeTypes.ContainsKey($extension)) { $mimeTypes[$extension] } else { "application/octet-stream" }
  $file = [System.IO.File]::OpenRead($path)
  try {
    $header = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($file.Length)`r`nConnection: close`r`nAccess-Control-Allow-Origin: *`r`n`r`n"
    Write-Bytes $stream ([System.Text.Encoding]::ASCII.GetBytes($header))
    if ($method -ne "HEAD") {
      $file.CopyTo($stream)
    }
  } finally {
    $file.Dispose()
  }
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
$listener.Start()
Write-Host "Local preview started: $url"
Write-Host "Close this PowerShell window to stop the preview server."
Start-Process $url

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 8192, $true)
      $requestLine = $reader.ReadLine()
      if (-not $requestLine) { continue }
      do {
        $line = $reader.ReadLine()
      } while ($line)

      $parts = $requestLine.Split(" ")
      if ($parts.Count -lt 2) {
        Write-TextResponse $stream 400 "Bad Request" "Bad Request"
        continue
      }

      $method = $parts[0].ToUpperInvariant()
      if ($method -ne "GET" -and $method -ne "HEAD") {
        Write-TextResponse $stream 405 "Method Not Allowed" "Method Not Allowed"
        continue
      }

      $target = Get-SafePath $parts[1]
      if (-not $target) {
        Write-TextResponse $stream 403 "Forbidden" "Forbidden"
        continue
      }
      if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
        Write-TextResponse $stream 404 "Not Found" "Not Found"
        continue
      }

      Write-FileResponse $stream $method $target
    } catch {
      try {
        Write-TextResponse $stream 500 "Internal Server Error" "Internal Server Error"
      } catch {
      }
    } finally {
      $client.Close()
    }
  }
} finally {
  $listener.Stop()
}
