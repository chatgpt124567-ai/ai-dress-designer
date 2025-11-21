@echo off
chcp 65001 >nul
cls

echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║              إنشاء اختصار على سطح المكتب                      ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM الحصول على مسار المجلد الحالي
set "CURRENT_DIR=%CD%"

REM الحصول على مسار سطح المكتب
set "DESKTOP=%USERPROFILE%\Desktop"

REM إنشاء ملف VBScript لإنشاء الاختصار
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = "%DESKTOP%\AI Dress Designer.lnk" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%CURRENT_DIR%\start-server.bat" >> CreateShortcut.vbs
echo oLink.WorkingDirectory = "%CURRENT_DIR%" >> CreateShortcut.vbs
echo oLink.Description = "AI Dress Designer - مصمم الفساتين بالذكاء الاصطناعي" >> CreateShortcut.vbs
echo oLink.IconLocation = "%SystemRoot%\System32\SHELL32.dll,13" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs

REM تشغيل VBScript
cscript CreateShortcut.vbs >nul

REM حذف ملف VBScript المؤقت
del CreateShortcut.vbs

echo ✅ تم إنشاء الاختصار على سطح المكتب بنجاح!
echo.
echo 📍 الاختصار: %DESKTOP%\AI Dress Designer.lnk
echo.
echo 💡 يمكنك الآن تشغيل التطبيق من سطح المكتب!
echo.
pause

