param([int]$Workers = 8, [int]$Quality = 82)

$srcDir = "images\vid-frames-upsc"
$dstDir = "images\vid-frames-webp"

New-Item -ItemType Directory -Path $dstDir -Force | Out-Null

$pngs = Get-ChildItem $srcDir -Filter "*.png" | Sort-Object Name | Where-Object {
    -not (Test-Path (Join-Path $dstDir ($_.BaseName + ".webp")))
}

if ($pngs.Count -eq 0) { Write-Host "All frames already converted."; exit 0 }

Write-Host "Converting $($pngs.Count) frames with $Workers workers (quality=$Quality)..."

$queue   = [System.Collections.Concurrent.ConcurrentQueue[System.IO.FileInfo]]::new()
$pngs | ForEach-Object { $queue.Enqueue($_) }

$total    = $pngs.Count
$done     = 0
$running  = @()
$start    = [System.Diagnostics.Stopwatch]::StartNew()

while ($done -lt $total) {
    # Reap finished processes
    $finished = $running | Where-Object { $_.HasExited }
    $done += $finished.Count
    $running  = $running  | Where-Object { -not $_.HasExited }

    if ($done % 20 -eq 0 -or $finished.Count -gt 0) {
        $pct = [math]::Round($done / $total * 100, 1)
        $elapsed = $start.Elapsed.TotalSeconds
        $eta = if ($done -gt 0) { [math]::Round(($total - $done) / $done * $elapsed) } else { "?" }
        Write-Host "`r[$done/$total] $pct%  ETA ${eta}s   " -NoNewline
    }

    # Fill worker slots
    while ($running.Count -lt $Workers) {
        $item = $null
        if (-not $queue.TryDequeue([ref]$item)) { break }
        $dst = Join-Path $dstDir ($item.BaseName + ".webp")
        $proc = Start-Process ffmpeg -ArgumentList "-y -i `"$($item.FullName)`" -c:v libwebp -quality $Quality -compression_level 4 `"$dst`"" `
                             -WindowStyle Hidden -PassThru
        $running += $proc
    }

    if ($running.Count -eq 0 -and $queue.IsEmpty) { break }
    Start-Sleep -Milliseconds 50
}

# Wait for last stragglers
$running | ForEach-Object { $_.WaitForExit() }
$final = (Get-ChildItem $dstDir -Filter "*.webp").Count
Write-Host "`nDone! $final WebP files in $dstDir"
