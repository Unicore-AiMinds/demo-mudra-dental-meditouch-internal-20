; Mudra Clinic — Inno Setup Installer Script
; Packages the built React app, combined Node.js server, and launcher scripts.
;
; Prerequisites:
;   1. Run `npm run build` to generate the dist/ folder
;   2. Place portable node.exe in the installer/ folder
;   3. Compile with Inno Setup 6: ISCC.exe mudra-setup.iss

[Setup]
AppName=Mudra Clinic
AppVersion=1.0.0
AppPublisher=Mudra Clinic
AppPublisherURL=https://mudraclinic.com
DefaultDirName=C:\Mudra-app
DefaultGroupName=Mudra Clinic
OutputBaseFilename=MudraClinicSetup
OutputDir=E:\DentalMetrix Project\installer\Output\MudraClinicSetup.exe
Compression=lzma2/ultra64
SolidCompression=yes
; Allow user to choose install directory (browse button)
DisableDirPage=no
DisableProgramGroupPage=yes
; No admin required — installs to user-accessible path
PrivilegesRequired=lowest
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
; Portable Node.js runtime (~70MB)
Source: "node.exe"; DestDir: "{app}"; Flags: ignoreversion

; Combined server script
Source: "..\server\mudra-server.mjs"; DestDir: "{app}\server"; Flags: ignoreversion

; Built React app (entire dist/ folder)
Source: "..\dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs

; Launcher and tray scripts
Source: "launcher.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "tray.ps1"; DestDir: "{app}"; Flags: ignoreversion

; Auto-backup script
Source: "..\scripts\backup.mjs"; DestDir: "{app}\scripts"; Flags: ignoreversion

; Restore script
Source: "..\scripts\restore.mjs"; DestDir: "{app}\scripts"; Flags: ignoreversion

[Icons]
; Desktop shortcut
Name: "{autodesktop}\Mudra Clinic"; Filename: "{app}\launcher.vbs"; Comment: "Launch Mudra Clinic"

; Start Menu shortcut
Name: "{group}\Mudra Clinic"; Filename: "{app}\launcher.vbs"
Name: "{group}\Uninstall Mudra Clinic"; Filename: "{uninstallexe}"

; Auto-start on Windows boot (current user's Startup folder)
Name: "{userstartup}\Mudra Clinic"; Filename: "{app}\launcher.vbs"

[Run]
; Launch the app after installation completes
Filename: "{app}\launcher.vbs"; Description: "Launch Mudra Clinic now"; Flags: postinstall nowait shellexec skipifsilent

[UninstallRun]
; Remove the scheduled backup task on uninstall
Filename: "schtasks"; Parameters: "/delete /tn ""MudraClinicBackup"" /f"; Flags: runhidden; RunOnceId: "RemoveBackupTask"

[UninstallDelete]
; Clean up startup shortcut
Type: files; Name: "{userstartup}\Mudra Clinic.lnk"
; Clean up backup folder
Type: filesandordirs; Name: "{app}\backup"

[Messages]
WelcomeLabel2=This will install Mudra Clinic on your computer.%n%nThe application runs as a local server accessible from any device on your network (LAN).

[Code]
var
  AutoBackupCheckbox: TNewCheckBox;
  BackupInfoLabel: TNewStaticText;

procedure InitializeWizard();
var
  BackupPage: TWizardPage;
begin
  // Create a custom wizard page after the directory selection page
  BackupPage := CreateCustomPage(
    wpSelectDir,
    'Auto-Backup Settings',
    'Configure automatic daily backup of your clinic data.'
  );

  AutoBackupCheckbox := TNewCheckBox.Create(BackupPage);
  AutoBackupCheckbox.Parent := BackupPage.Surface;
  AutoBackupCheckbox.Caption := 'Enable daily auto-backup of clinic data';
  AutoBackupCheckbox.Checked := True;
  AutoBackupCheckbox.Width := BackupPage.SurfaceWidth;
  AutoBackupCheckbox.Top := 20;
  AutoBackupCheckbox.Font.Style := [fsBold];

  BackupInfoLabel := TNewStaticText.Create(BackupPage);
  BackupInfoLabel.Parent := BackupPage.Surface;
  BackupInfoLabel.Top := 50;
  BackupInfoLabel.Width := BackupPage.SurfaceWidth;
  BackupInfoLabel.WordWrap := True;
  BackupInfoLabel.AutoSize := True;
  BackupInfoLabel.Caption :=
    'A daily backup will be taken automatically at 2:00 AM.' + #13#10 + #13#10 +
    'Please ensure the following for a smooth backup process:' + #13#10 +
    '  - The computer must be powered on at 2:00 AM' + #13#10 +
    '  - A proper internet connection is required';
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ResultCode: Integer;
  Msg: String;
begin
  if CurStep = ssPostInstall then
  begin
    // Create backup directory
    CreateDir(ExpandConstant('{app}\backup'));

    if AutoBackupCheckbox.Checked then
    begin
      // Create scheduled task for daily backup at 2:00 AM
      Exec(
        'schtasks',
        '/create /tn "MudraClinicBackup" /tr "\"'
          + ExpandConstant('{app}') + '\node.exe\" \"'
          + ExpandConstant('{app}') + '\scripts\backup.mjs\"" '
          + '/sc daily /st 02:00 /f /rl LIMITED',
        '', SW_HIDE, ewWaitUntilTerminated, ResultCode
      );
    end;
  end;

end;

function IsAppRunning(): Boolean;
var
  ResultCode: Integer;
begin
  // Check if our node.exe file is locked (= process is running)
  Exec(
    ExpandConstant('{sys}\cmd.exe'),
    ExpandConstant('/c if exist "{app}\node.exe" (copy /b "{app}\node.exe"+NUL "{app}\node.exe" > nul 2>&1 && exit 1 || exit 0) else (exit 1)'),
    '', SW_HIDE, ewWaitUntilTerminated, ResultCode
  );
  Result := (ResultCode = 0);
end;

procedure KillAppProcesses();
var
  ResultCode: Integer;
  AppPath: String;
begin
  AppPath := ExpandConstant('{app}');

  // Kill only OUR node.exe by exact path using PowerShell (avoids cmd.exe escaping issues)
  Exec('powershell.exe',
    '-ExecutionPolicy Bypass -Command "Get-Process node -EA SilentlyContinue | Where-Object { $_.Path -ieq ''' + AppPath + '\node.exe'' } | Stop-Process -Force -EA SilentlyContinue"',
    '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

  // Kill the tray PowerShell process that was launched from our app directory
  Exec('powershell.exe',
    '-ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process -Filter \"Name=''powershell.exe''\" -EA SilentlyContinue | Where-Object { $_.CommandLine -imatch [regex]::Escape(''' + AppPath + '\tray.ps1'') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -EA SilentlyContinue }"',
    '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

  // Wait for file handles to release
  Sleep(2000);
end;

function InitializeUninstall(): Boolean;
begin
  Result := True;

  if IsAppRunning() then
  begin
    if MsgBox(
      'Mudra Clinic is currently running.' + #13#10 + #13#10 +
      'Click "OK" to close the application and continue with uninstallation.' + #13#10 + #13#10 +
      'Click "Cancel" to abort and exit the application manually from the system tray (right-click tray icon > Exit).',
      mbConfirmation, MB_OKCANCEL
    ) = IDOK then
    begin
      // User chose to continue — auto-kill all app processes first
      KillAppProcesses();

      // Verify processes are terminated before proceeding
      if IsAppRunning() then
      begin
        MsgBox('Could not close the application automatically.' + #13#10 + #13#10 +
          'Please exit from the system tray (right-click tray icon > Exit) and try uninstalling again.',
          mbError, MB_OK);
        Result := False;
      end;
    end
    else
    begin
      // User chose to cancel — let them exit manually from the tray
      Result := False;
    end;
  end;
end;
