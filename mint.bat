@echo off
set TIMES=10
for /L %%i in (1,1,%TIMES%) do (
    echo Đang chạy lần %%i/%TIMES%
    npx hardhat otom:mint --amount 3 --network shape
    timeout /t 2 >nul
)
pause
