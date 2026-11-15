# Read-only NapCat/OneBot monitor. Never stores or reads QQ credentials.
[CmdletBinding()]
param(
    [string]$NapCatRoot = 'Z:\NapCat',
    [string]$Account = '3641212827',
    [int]$OneBotPort = 3001,
    [string]$StateFile = "$env:USERPROFILE\.dsh\qq-monitor\state.json",
    [string]$LogFile = 'Z:\NapCat\login-current.log',
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$stateDir = Split-Path -Parent $StateFile
New-Item -ItemType Directory -Force -Path $stateDir | Out-Null

function Get-Snapshot {
    $napcat = @(Get-Process -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -like "$NapCatRoot\app\*" -and $_.ProcessName -eq 'node'
    })
    $qq = @(Get-Process -Name 'QQ' -ErrorAction SilentlyContinue)
    $sockets = @(Get-NetTCPConnection -LocalPort $OneBotPort -ErrorAction SilentlyContinue)
    $listener = @($sockets | Where-Object State -eq 'Listen').Count -gt 0
    $established = @($sockets | Where-Object State -eq 'Established').Count
    $logTail = ''
    if (Test-Path -LiteralPath $LogFile) {
        $logTail = (Get-Content -LiteralPath $LogFile -Tail 80 -ErrorAction SilentlyContinue) -join "`n"
    }
    # Compare the latest login success and failure, so old errors cannot poison recovery.
    $lastSuccess = -1
    $lastFailure = -1
    $lines = $logTail -split "`n"
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '已登录成功|通知主进程登录成功|快速登录成功') { $lastSuccess = $i }
        if ($lines[$i] -match '登录已失效|身份已失效|KickedOffLine|Account Offline|Login Error') { $lastFailure = $i }
    }
    $loginExpired = $lastFailure -gt $lastSuccess
    [pscustomobject]@{
        utc = [DateTime]::UtcNow.ToString('o')
        napcatProcess = $napcat.Count -gt 0
        qqProcess = $qq.Count -gt 0
        onebotListener = $listener
        onebotEstablished = $established
        loginErrorInTail = $loginExpired
        healthy = ($napcat.Count -gt 0 -and $qq.Count -gt 0 -and $listener -and $established -gt 0 -and -not $loginExpired)
    }
}

function Send-Alert([string]$Title, [string]$Body) {
    $message = "$Title`n$Body"
    if ($DryRun) { Write-Output $message; return }
    # Interactive Windows message; no credentials or QR tokens are included.
    & "$env:SystemRoot\System32\msg.exe" '*' $message 2>$null | Out-Null
    Add-Content -LiteralPath "$stateDir\alerts.log" -Value ("{0} {1}: {2}" -f (Get-Date -Format o), $Title, $Body)
}

$snapshot = Get-Snapshot
$previous = $null
if (Test-Path -LiteralPath $StateFile) {
    try { $previous = Get-Content -LiteralPath $StateFile -Raw | ConvertFrom-Json } catch { $previous = $null }
}

$previousHealthy = if ($null -eq $previous) { $null } else { [bool]$previous.healthy }
if ($previousHealthy -ne $snapshot.healthy) {
    if ($snapshot.healthy) {
        Send-Alert 'QQ 通道已恢复' ("NapCat/OneBot 3001 已恢复，连接数: {0}。" -f $snapshot.onebotEstablished)
    } else {
        $reason = @()
        if (-not $snapshot.napcatProcess) { $reason += 'NapCat 进程不存在' }
        if (-not $snapshot.qqProcess) { $reason += 'QQ 进程不存在' }
        if (-not $snapshot.onebotListener) { $reason += "OneBot $OneBotPort 未监听" }
        elseif ($snapshot.onebotEstablished -eq 0) { $reason += 'OneBot 没有已建立连接' }
        if ($snapshot.loginErrorInTail) { $reason += '日志出现登录失效/登录错误' }
        Send-Alert 'QQ 通道已掉线' ((($reason -join '；') + '。通道将自动重连；若登录失效，请在 NapCat WebUI 扫码。'))
        # An offline QQ cannot deliver its own QR. Open the local login UI once per outage.
        # The WebUI generates/displays the current QR after its normal authentication.
        if (-not $DryRun -and -not $snapshot.onebotListener) {
            Start-Process 'http://127.0.0.1:6099/webui' -ErrorAction SilentlyContinue | Out-Null
        }
    }
}

$snapshot | ConvertTo-Json -Compress | Set-Content -LiteralPath $StateFile -Encoding UTF8
$snapshot | ConvertTo-Json -Compress
