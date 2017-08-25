@echo off 
echo cpÎÄ¼þ
setlocal enabledelayedexpansion
for /R %%s in (a1\*) do ( 
echo %%s
move %%s a2
if !n!==999 (
exit
) 
set /a n=n+1
) 
pause