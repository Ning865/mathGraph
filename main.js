const { app, BrowserWindow } = require('electron')
const path = require('path');

function createWindow(){
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
        nodeIntegration: true,
        contextIsolation: false// 需要设置为 false
        //enableRemoteModule: true,
        //webSecurity: false,
        //preload: path.join(__dirname, 'preload.js')
      }    //窗口总在顶部
    })
    win.loadFile('pages/aaa.html')
    
}

app.on('ready', () => {
  createWindow()
})