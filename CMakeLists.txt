cmake_minimum_required(VERSION 3.25)
project(eatSFXR LANGUAGES CXX C)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(EMSCRIPTEN)
    message(STATUS "[eatSFXR] Configuring WebAssembly build via Emscripten...")
    set(CMAKE_EXECUTABLE_SUFFIX ".html")
    
    add_compile_options(-O2 -DEMSCRIPTEN)
    add_link_options(
        -O2
        "SHELL:-s WASM=1"
        "SHELL:-s USE_WEBGPU=1"
        "SHELL:-s USE_WEBGL2=1"
        "SHELL:-s ALLOW_MEMORY_GROWTH=1"
        "SHELL:-s EXPORTED_RUNTIME_METHODS=['ccall','cwrap','UTF8ToString']"
        "SHELL:-s EXPORTED_FUNCTIONS=['_main','_triggerPad','_setPitchSemitones','_setActiveBank']"
        --shell-file ${CMAKE_CURRENT_SOURCE_DIR}/shell_minimal.html
    )

    include_directories(${CMAKE_CURRENT_SOURCE_DIR}/src)

    set(SOURCES
        src/main.cpp
        src/LabSampler.cpp
        src/LabSampler.hpp
        src/LabUI.cpp
        src/LabUI.hpp
        src/Lab3DUI.cpp
        src/Lab3DUI.hpp
        src/nanovg.c
        src/nanovg.h
    )

    add_executable(eatsfxr ${SOURCES})
else()
    if(CMAKE_BUILD_TYPE STREQUAL "Debug")
        if(MSVC)
            add_compile_options(/fsanitize=address)
        else()
            add_compile_options(-fsanitize=address -fno-omit-frame-pointer)
            add_link_options(-fsanitize=address)
        endif()
    endif()

    find_package(Filament REQUIRED)
    find_package(LabSound REQUIRED)
    find_package(Lua REQUIRED)
    find_package(sol2 REQUIRED)

    include_directories(
        ${CMAKE_CURRENT_SOURCE_DIR}/src
        ${FILAMENT_INCLUDE_DIRS}
        ${LABSOUND_INCLUDE_DIRS}
        ${LUA_INCLUDE_DIR}
        ${SOL2_INCLUDE_DIRS}
    )

    set(SOURCES
        src/main.cpp
        src/LabSampler.cpp
        src/LabSampler.hpp
        src/LabUI.cpp
        src/LabUI.hpp
        src/Lab3DUI.cpp
        src/Lab3DUI.hpp
        src/nanovg.c
        src/nanovg.h
        src/LuaTranspiler.hpp
    )

    add_executable(eatsfxr ${SOURCES})

    target_link_libraries(eatsfxr PRIVATE
        filament::filament
        filament::backend
        filament::math
        LabSound::LabSound
        ${LUA_LIBRARIES}
        sol2::sol2
    )

    add_custom_command(TARGET eatsfxr POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_directory
        ${CMAKE_CURRENT_SOURCE_DIR}/scripts $<TARGET_FILE_DIR:eatsfxr>/scripts
    )
endif()

