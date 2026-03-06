# Mudra Clinic — System Tray Icon
# Shows a tray icon with right-click menu: Open in Browser, Show LAN IP, Exit

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$script:appDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$iconPath = Join-Path $script:appDir "mudra-icon.ico"
$script:nodeExe = Join-Path $script:appDir "node.exe"

# Create notify icon
$notifyIcon = New-Object System.Windows.Forms.NotifyIcon

# Use custom icon if available, otherwise use default
if (Test-Path $iconPath) {
    $notifyIcon.Icon = New-Object System.Drawing.Icon($iconPath)
} else {
    $notifyIcon.Icon = [System.Drawing.SystemIcons]::Application
}

$notifyIcon.Text = "Mudra Clinic"
$notifyIcon.Visible = $true

# Create context menu
$menu = New-Object System.Windows.Forms.ContextMenuStrip

# "Open in Browser" menu item
$openItem = New-Object System.Windows.Forms.ToolStripMenuItem("Open in Browser")
$openItem.Add_Click({ Start-Process "http://localhost:8080" })
$menu.Items.Add($openItem) | Out-Null

# Separator
$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

# "Show LAN Address" menu item
$lanItem = New-Object System.Windows.Forms.ToolStripMenuItem("Show LAN Address")
$lanItem.Add_Click({
    $ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi", "Ethernet" -ErrorAction SilentlyContinue |
           Where-Object { $_.IPAddress -notlike "169.*" } |
           Select-Object -First 1).IPAddress

    if (-not $ip) {
        $ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
               Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.IPAddress -notlike "169.*" } |
               Select-Object -First 1).IPAddress
    }

    if ($ip) {
        $lanUrl = "http://${ip}:8080"
        [System.Windows.Forms.Clipboard]::SetText($lanUrl)
        $script:notifyIcon.ShowBalloonTip(
            5000,
            "Mudra Clinic - LAN Address",
            "Other devices on your network can access:`n$lanUrl`n`n(Copied to clipboard)",
            [System.Windows.Forms.ToolTipIcon]::Info
        )
    } else {
        $script:notifyIcon.ShowBalloonTip(
            3000,
            "Mudra Clinic",
            "No LAN connection found. Connect to Wi-Fi or Ethernet.",
            [System.Windows.Forms.ToolTipIcon]::Warning
        )
    }
})
$menu.Items.Add($lanItem) | Out-Null

# Separator
$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

# "Backup Now" menu item
$backupItem = New-Object System.Windows.Forms.ToolStripMenuItem("Backup Now")
$backupItem.Add_Click({
    try {
        $session = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/session" -Method GET -ErrorAction Stop
        if ($session.user_name) {
            $body = @{ user_name = $session.user_name } | ConvertTo-Json
            Invoke-RestMethod -Uri "http://localhost:8080/api/backup/trigger" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
            $script:notifyIcon.ShowBalloonTip(3000, "Mudra Clinic", "Backup started by $($session.user_name).", [System.Windows.Forms.ToolTipIcon]::Info)
        } else {
            $script:notifyIcon.ShowBalloonTip(5000, "Mudra Clinic", "Please log in to the application first and then take backup.", [System.Windows.Forms.ToolTipIcon]::Warning)
        }
    } catch {
        $script:notifyIcon.ShowBalloonTip(5000, "Mudra Clinic", "Please log in to the application first and then take backup.", [System.Windows.Forms.ToolTipIcon]::Warning)
    }
})
$menu.Items.Add($backupItem) | Out-Null

# Separator
$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

# "Exit" menu item
$exitItem = New-Object System.Windows.Forms.ToolStripMenuItem("Exit")
$exitItem.Add_Click({
    # Kill only OUR node.exe by exact path (CIM query + PowerShell filter avoids WQL escaping issues)
    Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.ExecutablePath -ieq $script:nodeExe } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

    $script:notifyIcon.Visible = $false
    $script:notifyIcon.Dispose()
    [System.Windows.Forms.Application]::Exit()
})
$menu.Items.Add($exitItem) | Out-Null

$notifyIcon.ContextMenuStrip = $menu

# Double-click opens browser
$notifyIcon.Add_DoubleClick({ Start-Process "http://localhost:8080" })

# Show startup notification
$notifyIcon.ShowBalloonTip(
    3000,
    "Mudra Clinic",
    "Server is running. Right-click for options.",
    [System.Windows.Forms.ToolTipIcon]::Info
)

# Watchdog timer: auto-exit tray if the node server process dies
$watchdog = New-Object System.Windows.Forms.Timer
$watchdog.Interval = 5000   # check every 5 seconds
$watchdog.Add_Tick({
    $running = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.ExecutablePath -ieq $script:nodeExe }
    if (-not $running) {
        $script:notifyIcon.Visible = $false
        $script:notifyIcon.Dispose()
        [System.Windows.Forms.Application]::Exit()
    }
})
$watchdog.Start()

# Run the Windows Forms message loop (keeps the tray icon alive)
[System.Windows.Forms.Application]::Run()
