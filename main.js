const { app, BrowserWindow } = require('electron')
const path = require('path');

function createWindow(){
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true, // 自动隐藏菜单栏，按Alt键可临时显示
        webPreferences: {
        nodeIntegration: true,
        contextIsolation: false// 需要设置为 false
      }
    })
    win.loadFile('pages/index.html')
    
}

app.on('ready', () => {
  createWindow()
})