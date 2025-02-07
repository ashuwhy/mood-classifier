!macro customInit
  ; Determine architecture
  ${If} ${RunningX64}
    SetRegView 64
    StrCpy $INSTDIR "$PROGRAMFILES64\${PRODUCT_NAME}"
  ${Else}
    SetRegView 32
    StrCpy $INSTDIR "$PROGRAMFILES32\${PRODUCT_NAME}"
  ${EndIf}

  ; Create FFmpeg directory
  CreateDirectory "$INSTDIR\ffmpeg"
  CreateDirectory "$INSTDIR\ffmpeg\bin"
  
  ; Extract FFmpeg to the proper location
  SetOutPath "$INSTDIR\ffmpeg\bin"
  ${If} ${RunningX64}
    File "${BUILD_RESOURCES_DIR}\extraResources\ffmpeg\x64\ffmpeg.exe"
  ${Else}
    File "${BUILD_RESOURCES_DIR}\extraResources\ffmpeg\arm64\ffmpeg.exe"
  ${EndIf}
  
  ; Add FFmpeg to system PATH
  ReadRegStr $0 HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path"
  WriteRegExpandStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path" "$0;$INSTDIR\ffmpeg\bin"
  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000
  
  ; Create proper shortcuts with working directory set
  CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
  SetOutPath "$INSTDIR"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_NAME}.exe" "" "$INSTDIR\${PRODUCT_NAME}.exe" 0
  CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_NAME}.exe" "" "$INSTDIR\${PRODUCT_NAME}.exe" 0
!macroend

!macro customUnInit
  ; Remove FFmpeg
  RMDir /r "$PROGRAMFILES\ffmpeg"
  
  ; Remove shortcuts
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  RMDir "$SMPROGRAMS\${PRODUCT_NAME}"
!macroend

!include "x64.nsh"
!include "WinMessages.nsh"

; NSIS include file to customize installer

; Disable data block optimization to fix memory mapping issues
; Commenting out the following line will enable NSIS optimization:
; SetDatablockOptimize off

; Set the custom finish page background image.
; Ensure the file (finish.bmp) exists in your build folder and is in BMP format.
!define MUI_FINISHPAGE_BITMAP "${BUILD_RESOURCES_DIR}\finish.bmp"
