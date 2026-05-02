docker run -it ^
  -p 3000:3000 ^
  -v %cd%:/workspace ^
  -v C:\Users\EXPO_04\.codex:/root/.codex ^
  -w /workspace ^
  ascii-os  
@pause