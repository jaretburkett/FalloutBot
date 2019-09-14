const {app, BrowserWindow} = require('electron');
const fs = require('fs');
const path = require('path');
const contextMenu = require('electron-context-menu');
contextMenu({
    showInspectElement: true
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let hudWindow;
let config = {
    lastFile:null
};

global.sharedObj = {hud: 'Waiting'};

const createWindow = () => {

    //make storage folder if it does not exist
    const documentsFolder = app.getPath('documents');
    const scriptFolder = path.join(documentsFolder, 'FalloutBot');
    if (!fs.existsSync(scriptFolder)){
        fs.mkdirSync(scriptFolder);
    }

// make config file if it does nto exist
    const configFile = path.join(scriptFolder, 'config.json');
    if (!fs.existsSync(configFile)){
        const jsonContent = JSON.stringify(config, null, 2);
        fs.writeFileSync(configFile, jsonContent, 'utf8');
    }

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/index.html`);
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
        hudWindow = null;
        app.quit();
    });

    // Create the browser window.
    hudWindow = new BrowserWindow({
        width: 200,
        height: 15,
        x:0,
        y:0,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        },
        transparent:true
    });
    hudWindow.setAlwaysOnTop(true, "floating", 1);
    // allows the window to show over a fullscreen window
    hudWindow.setVisibleOnAllWorkspaces(true);

    // and load the index.html of the app.
    hudWindow.loadURL(`file://${__dirname}/hud.html`);

    // Emitted when the window is closed.
    hudWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        hudWindow = null;
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
