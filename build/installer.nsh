!macro customInit
  ; Create FFmpeg directory
  CreateDirectory "$PROGRAMFILES\ffmpeg"
  CreateDirectory "$PROGRAMFILES\ffmpeg\bin"
  
  ; Extract FFmpeg to the proper location
  SetOutPath "$PROGRAMFILES\ffmpeg\bin"
  File "${BUILD_RESOURCES_DIR}\extraResources\ffmpeg\ffmpeg.exe"
  
  ; Add FFmpeg to system PATH
  ReadRegStr $0 HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path"
  WriteRegExpandStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "Path" "$0;$PROGRAMFILES\ffmpeg\bin"
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

!include "WinMessages.nsh" 