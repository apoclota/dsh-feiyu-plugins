param([int]$DelaySeconds = 20)
Start-Sleep -Seconds $DelaySeconds
$hostPid = 31592
try { Stop-Process -Id $hostPid -Force -ErrorAction Stop } catch {}
Start-Sleep -Seconds 4
$exe = 'Z:\DSH new\DeepSeek Harness.exe'
$args = @(
  '--expose-internals',
  'Z:\DSH new\resources\app.asar\dsh\node_modules\@deepseek-ai\dsh-desktop-host\lib\index.js',
  'Z:\DSH new\resources\app.asar\dsh',
  'C:\Users\26102\.dsh\profiles\desktop',
  'Z:\DSH new\resources\runtime\primary-runtime',
  'Z:\DSH new\resources\runtime\primary-runtime\dependencies\pnpm\bin\pnpm.mjs',
  'Z:\DSH new\resources\runtime\bin'
)
Start-Process -FilePath $exe -ArgumentList $args
