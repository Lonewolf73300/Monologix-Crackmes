# Diagnostic LED - LECTURE SEULE - Windows 7 / PowerShell 2.0
# Aucune commande CIM/NetAdapter, aucun Stop-Transcript, aucun reglage modifie.
$ErrorActionPreference = 'Continue'

# --- Racine de la cle : jamais vide ---
$here = $null
try { $here = Split-Path -Parent $MyInvocation.MyCommand.Path } catch {}
if (-not $here) { $here = (Get-Location).Path }
$root = Split-Path -Parent $here          # ...\chamois_led_usb
if (-not $root) { $root = $here }

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$out   = Join-Path (Join-Path $root 'RAPPORTS') ("RAPPORT_" + $stamp)
New-Item -ItemType Directory -Path $out -Force | Out-Null
$rep   = Join-Path $out 'rapport.txt'
$errs  = Join-Path $out 'erreurs.txt'

function W($t)  { Add-Content -Path $rep -Value $t -Encoding UTF8 }
function H($t)  { W ''; W ('==== ' + $t + ' ====') }
function Run($name, [scriptblock]$sb) {
    H $name
    try { & $sb 2>&1 | Out-String -Width 220 | ForEach-Object { W $_ } }
    catch { W ('ECHEC: ' + $_); Add-Content -Path $errs -Value ($name + ': ' + $_) }
}

W ("Diagnostic LED - " + (Get-Date))
W ("PowerShell: " + $PSVersionTable.PSVersion + " | Cle: " + $root)

Run 'Windows'        { Get-WmiObject Win32_OperatingSystem | Select-Object Caption,Version,OSArchitecture,CSName | Format-List }
Run 'Machine'        { Get-WmiObject Win32_ComputerSystem | Select-Object Manufacturer,Model,TotalPhysicalMemory | Format-List
                       Get-WmiObject Win32_Processor | Select-Object Name,NumberOfCores | Format-List }
Run 'Cartes graphiques et resolution' {
    Get-WmiObject Win32_VideoController | Select-Object Name,DriverVersion,AdapterRAM,CurrentHorizontalResolution,CurrentVerticalResolution,CurrentRefreshRate,VideoProcessor | Format-List }
Run 'Ecrans (Windows)' {
    [void][Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms')
    [System.Windows.Forms.Screen]::AllScreens | ForEach-Object { "{0} primaire={1} zone={2}" -f $_.DeviceName,$_.Primary,$_.Bounds } }
Run 'Moniteurs (WMI)' { Get-WmiObject Win32_DesktopMonitor | Select-Object Name,ScreenWidth,ScreenHeight,PNPDeviceID | Format-List }
Run 'Interfaces reseau' {
    Get-WmiObject Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled } |
      Select-Object Description,MACAddress,IPAddress,IPSubnet,DefaultIPGateway,DHCPEnabled | Format-List }
Run 'Cartes reseau (toutes)' {
    Get-WmiObject Win32_NetworkAdapter | Where-Object { $_.PhysicalAdapter } | Select-Object Name,NetConnectionID,NetConnectionStatus,Speed | Format-List }
Run 'Peripheriques PCI' {
    Get-WmiObject Win32_PnPEntity | Where-Object { $_.DeviceID -like 'PCI*' } | Select-Object Name,Status,DeviceID | Format-Table -AutoSize }
Run 'Peripheriques USB' {
    Get-WmiObject Win32_PnPEntity | Where-Object { $_.DeviceID -like 'USB*' } | Select-Object Name,Status | Format-Table -AutoSize }
Run 'Peripheriques en erreur' {
    Get-WmiObject Win32_PnPEntity | Where-Object { $_.ConfigManagerErrorCode -ne 0 } | Select-Object Name,ConfigManagerErrorCode,DeviceID | Format-Table -AutoSize }
Run 'Processus lies a l ecran LED' {
    Get-Process | Where-Object { $_.ProcessName -match 'led|linsn|lsn|eurodisplay|easyscreen|novastar|player|sender' } | Select-Object ProcessName,Id,Path | Format-Table -AutoSize }

# --- Logiciels installes (registre) ---
Run 'Logiciels installes (LED/Linsn/Euro/easy)' {
    $keys = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall','HKLM:\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall'
    foreach ($k in $keys) { if (Test-Path $k) { Get-ChildItem $k | ForEach-Object { Get-ItemProperty $_.PSPath } |
        Where-Object { $_.DisplayName -match 'led|linsn|euro|easy|screen|display' } | Select-Object DisplayName,DisplayVersion,InstallLocation } } |
    Format-Table -AutoSize }

# --- Fichiers de config LED : recherche + copie (source non modifiee) ---
H 'Recherche fichiers Linsn / Eurodisplay / LED'
$cfgOut = Join-Path $out 'configs_copiees'
New-Item -ItemType Directory -Path $cfgOut -Force | Out-Null
$roots = @($env:ProgramFiles, ${env:ProgramFiles(x86)}, 'C:\', "$env:USERPROFILE\Desktop", "$env:USERPROFILE\Documents") | Where-Object { $_ -and (Test-Path $_) }
$dirs = @()
foreach ($r in $roots) {
    try { $dirs += Get-ChildItem $r -ErrorAction SilentlyContinue | Where-Object { $_.PSIsContainer -and $_.Name -match 'linsn|led|euro|easy|screen' } } catch {}
}
foreach ($d in ($dirs | Select-Object -Unique)) {
    W ('Dossier: ' + $d.FullName)
    try {
        Get-ChildItem $d.FullName -Recurse -ErrorAction SilentlyContinue |
          Where-Object { -not $_.PSIsContainer -and $_.Extension -match '^\.(ini|cfg|xml|conf|lsn|led|dat|txt|log)$' -and $_.Length -lt 2MB } |
          ForEach-Object {
              W ('  ' + $_.FullName + '  (' + $_.Length + ' o)')
              try { Copy-Item $_.FullName -Destination (Join-Path $cfgOut ($d.Name + '__' + $_.Name)) -Force } catch { Add-Content $errs ('copie ' + $_.FullName + ': ' + $_) }
          }
    } catch { Add-Content $errs ('scan ' + $d.FullName + ': ' + $_) }
}

W ''; W ('FIN. Erreurs eventuelles: ' + $errs)
Write-Host ('Rapport: ' + $rep)
