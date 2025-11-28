@echo off
REM fix-git-lock-and-push.bat
REM Stops git processes, removes .git\index.lock if present, shows git status, and helps commit+push.

echo ************************************************************
echo Fix Git lock helper for miniERP
echo ************************************************************
echo IMPORTANT: Close editors (VS Code, Git GUI) before running this script.
echo Press any key to continue or Ctrl+C to abort...
pause >nul

echo.
echo Listing git.exe processes (if any):
tasklist | findstr /I "git.exe" >nul
if %ERRORLEVEL%==0 (
  tasklist | findstr /I git
) else (
  echo (no git.exe processes found)
)
echo.

:ASKKILL
rem If git.exe processes exist, offer to kill them.
tasklist | findstr /I "git.exe" >nul
if %ERRORLEVEL%==0 (
  echo Some git.exe processes are running and may hold the index.lock.
  echo Do you want to attempt to kill all git.exe processes now? [Y/N]
  choice /C YN /N >nul
  if errorlevel 2 goto SKIPKILL
  echo Attempting to kill all git.exe processes...
  taskkill /IM git.exe /F 2>nul
  rem give processes a moment to terminate
  timeout /T 2 /NOBREAK >nul
  rem re-check
  tasklist | findstr /I "git.exe" >nul
  if %ERRORLEVEL%==0 (
    echo Some git.exe processes are still running.
    echo If you prefer, close editors or use Task Manager and run this script again.
    echo Retry killing processes? [Y/N]
    choice /C YN /N >nul
    if errorlevel 2 goto SKIPKILL
    goto ASKKILL
  ) else (
    echo No git.exe running.
  )
) else (
  rem no git.exe running
)

:SKIPKILL
echo.
echo Checking for .git\index.lock ...
if exist .git\index.lock (
  echo Found .git\index.lock — attempting to delete...
  del /F /Q .git\index.lock 2>nul
  if exist .git\index.lock (
    echo Failed to delete .git\index.lock. Close applications that might lock it or restart Windows, then try again.
    pause
    exit /b 1
  ) else (
    echo Deleted .git\index.lock successfully.
  )
) else (
  echo No .git\index.lock found.
)

echo.
echo Running `git status --short --branch` to show repository state:
git status --short --branch
if %ERRORLEVEL% neq 0 (
  echo.
  echo git returned an error. If the index seems corrupted, consider running:
  echo   git reset --mixed HEAD
  echo   git status
  pause
  exit /b 1
)

:COMMIT_PUSH
echo.
set /p COMMITMSG=Enter commit message (leave empty to skip commit and only push existing commits): 
if not "%COMMITMSG%"=="" (
  echo Staging all changes...
  git add -A
  if %ERRORLEVEL% neq 0 (
    echo git add failed. Aborting.
    pause
    exit /b 1
  )
  echo Committing...
  git commit -m "%COMMITMSG%"
  if %ERRORLEVEL% neq 0 (
    echo git commit failed or there was nothing to commit. Check messages above.
    pause
  ) else (
    echo Commit succeeded.
  )
)

echo.
choice /C YN /M "Push to origin (current branch) now?" >nul
if errorlevel 2 (
  echo Skipping push.
  echo Done.
  pause
  exit /b 0
)

echo Pushing to origin (current branch)...
git push
if %ERRORLEVEL% neq 0 (
  echo git push failed. Resolve network/auth issues and retry.
  pause
  exit /b 1
) else (
  echo git push succeeded.
)

echo Done. Repository state:
git status --short --branch
pause
exit /b 0
@echo off
REM fix-git-lock-and-push.bat
REM Stops git processes, removes .git\index.lock if present, shows git status, and helps commit+push.

echo ************************************************************
echo Fix Git lock helper for miniERP
echo ************************************************************
echo IMPORTANT: Close editors (VS Code, Git GUI) before running this script.
echo Press any key to continue or Ctrl+C to abort...
pause >nul

echo.
echo Listing git.exe processes (if any):
tasklist | findstr /I git || echo (no git.exe processes found)
echo.



































































pause >nulecho Script finished. Press any key to close.echo ************************************************************git status --short --branchecho Done. Repository state:)  exit /b 1  pause  echo git push failed. Resolve network/auth issues and retry.git push
nif %ERRORLEVEL% neq 0 (echo Pushing to origin (current branch)...)  )    exit /b 1    pause    echo git commit failed. Check messages above.  if %ERRORLEVEL% neq 0 (  git commit -m "%COMMITMSG%"  echo Committing...  git add -A  echo Staging all changes...) else (  echo Skipping commit step.if "%COMMITMSG%"=="" (set /p COMMITMSG=Enter commit message (leave empty to skip commit and only push existing commits): echo.)  exit /b 1  pause  echo git returned an error. If index seems corrupted, consider: git reset --mixed HEADgit status
nif %ERRORLEVEL% neq 0 (echo.
necho Running git status...)  echo No .git\index.lock found.) else (  )    echo Deleted .git\index.lock successfully.  ) else (    exit /b 1    pause    echo Failed to delete .git\index.lock. Close applications that might lock it or restart Windows, then try again.  if exist .git\index.lock (  del .git\index.lock  echo Found .git\index.lock — deleting...if exist .git\index.lock (echo.
necho Checking for .git\index.lock ...
n:SKIPKILL)  echo No git.exe running.) else (  goto CHECKAGAIN  taskkill /IM git.exe /F 2>nul  if errorlevel 2 goto SKIPKILL  choice /M "Retry killing git.exe processes?"  echo You may need to close editors or use Task Manager. Retry choice.  echo Some git.exe processes still running.tasklist | findstr /I git >nul
nif %ERRORLEVEL%==0 (
n:CHECKAGAINping -n 2 127.0.0.1 >nulecho Sleeping 1s to allow processes to terminate...taskkill /IM git.exe /F 2>nul || echo No git.exe processes were killed or none running.echo Killing git.exe processes...if errorlevel 2 goto SKIPKILLchoice /M "Do you want to attempt to kill all git.exe processes now?":ASKKILL