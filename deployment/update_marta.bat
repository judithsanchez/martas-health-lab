@echo off
echo Updating Marta's Lab...
cd C:\martas-lab

:: Pull the latest "Sealed Box" from GitHub
docker compose pull

:: Restart the app with the new code
docker compose up -d

echo Update Complete!
timeout /t 5
