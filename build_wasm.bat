@echo off
call C:\Dev\emsdk\emsdk_env.bat
if not exist build_wasm mkdir build_wasm
cd build_wasm
set "PATH=C:\Program Files\CMake\bin;%PATH%"
call emcmake cmake .. -G "MinGW Makefiles" -DCMAKE_BUILD_TYPE=Release
call emmake mingw32-make -j4
cd ..
echo [LabCore WASM] Build complete!
