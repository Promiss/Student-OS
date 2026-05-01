@echo off
chcp 65001 >nul
echo ==================================================
echo    一站式学生综合服务系统 (SUDT) - 数据库上云迁移脚本
echo ==================================================
echo.

set "REMOTE_HOST=49.232.58.170"
set "REMOTE_USER=root"
set "REMOTE_PORT=3306"
set "REMOTE_PASS=70c3667ee5edef98"
set "DB_NAME=sudt_db"
set "BACKUP_FILE=sudt_db_backup.sql"

echo 目标服务器: %REMOTE_HOST%
echo 目标端口: %REMOTE_PORT%
echo 目标数据库: %DB_NAME%
echo 备份文件: %BACKUP_FILE%
echo.

if not exist "%BACKUP_FILE%" (
    echo [错误] 找不到备份文件 %BACKUP_FILE%。请确保脚本与 SQL 文件在同一目录下。
    pause
    exit /b 1
)

echo 正在连接远程数据库并导入数据...
mysql -h "%REMOTE_HOST%" -P "%REMOTE_PORT%" -u "%REMOTE_USER%" -p"%REMOTE_PASS%" "%DB_NAME%" < "%BACKUP_FILE%"

if %ERRORLEVEL% equ 0 (
    echo.
    echo [成功] 数据库迁移完成！
) else (
    echo.
    echo [失败] 数据库迁移异常，请检查网络连接、账密或 MySQL 客户端是否已配置环境变量。
)

pause
