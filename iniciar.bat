@echo off
REM ============================================================
REM  iniciar.bat - Levanta BACKEND (Flask) + FRONTEND (http.server)
REM  Todo con un solo clic.
REM  - Backend : http://127.0.0.1:5000
REM  - Frontend: http://127.0.0.1:5500  (se abre el navegador solo)
REM ============================================================
setlocal
cd /d "%~dp0"

echo ============================================================
echo  CANCHAS SINTETICAS - INICIO RAPIDO
echo  Backend : http://127.0.0.1:5000
echo  Frontend: http://127.0.0.1:5500
echo ============================================================
echo.

REM --- 1) Verificar venv ---
if not exist "backend\venv\Scripts\python.exe" (
    echo [ERROR] No se encontro backend\venv. Crea el venv:
    echo   cd backend ^&^& python -m venv venv ^&^& venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

REM --- 2) Configurar creacion de BD si es la primera vez ----
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" >nul
    echo [INFO] Creado backend\.env a partir de .env.example.
    echo        Revisa la contrasena de MySQL (DB_PASSWORD) si es necesaria.
    echo.
)

REM --- 3) Levantar BACKEND en ventana propia ---
echo [1/2] Arrancando backend Flask...
start "API Canchas Sinteticas - Backend" cmd /k "cd /d "%~dp0backend" && venv\Scripts\python.exe -u app.py"

REM --- 4) Esperar a que Flask este listo ---
timeout /t 4 /nobreak >nul

REM --- 5) Levantar FRONTEND estatico en ventana propia ---
echo [2/2] Arrancando servidor estatico frontend...
start "Canchas Sinteticas - Frontend" cmd /k "cd /d "%~dp0frontend" && ..\backend\venv\Scripts\python.exe -m http.server 5500"

REM --- 6) Abrir navegador ---
timeout /t 3 /nobreak >nul
start http://127.0.0.1:5500/index.html

echo.
echo  Listo. Deja las dos ventanas abiertas y cierra esta.
echo  Para detener: cierra las ventanas Backend/Frontend (Ctrl+C).
pause
