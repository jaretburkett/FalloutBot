const {app} = require('electron').remote;
const {remote} = require('electron');
const fs = require('fs');
const path = require('path');
let currentFilename = null;
const activeWin = require('active-win');
const Mousetrap = require('mousetrap');
const memory = require('./js/modules/memory');
const {shell} = require('electron').remote;
let variable = null;
let fobNeedsToSetup = true;
const { globalShortcut } = require('electron').remote;
//https://electronjs.org/docs/api/accelerator



let config = {
    lastFile:null
};

let programLoop = null;

const loopDelay = 1;

// read config
const documentsFolder = app.getPath('documents');
const scriptFolder = path.join(documentsFolder, 'NMSbot');
const configFile = path.join(scriptFolder, 'config.json');
if (fs.existsSync(configFile)){
    try {
        config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    } catch (e){
        console.log(e);
    }
}

function openScriptFolder(){
    shell.openItem(scriptFolder);
}

const editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/javascript");

function saveConfig(){
    config.lastFile = currentFilename;
    const jsonContent = JSON.stringify(config, null, 2);
    fs.writeFileSync(configFile, jsonContent, 'utf8');
    status('Saved')
}

function delay(ms){
    return new Promise(resolve =>{
        setTimeout(()=>{
            resolve();
        }, ms);
    })
}

let isRunning = false;

function status(message){
    $('.status-bar').html(message);
}

function hud(message){
    remote.getGlobal('sharedObj').hud = message;
}

function start() {
    $('#play-btn').hide();
    $('#stop-btn').show();
    // set running to true so loop will run
    isRunning = true;
    // set needs to setup to true to trigget setup on first loop
    fobNeedsToSetup = true;
    status('Setting up script');
}

function stop() {
    $('#play-btn').show();
    $('#stop-btn').hide();
    // set running to false to stop running script
    isRunning = false;
    status('Stopped');
    globalShortcut.unregisterAll();
    programLoop = null;
}


function openFile(filename) {
    const documentsFolder = app.getPath('documents');
    const scriptFolder = path.join(documentsFolder, 'NMSbot');
    const content = fs.readFileSync(path.join(scriptFolder, filename), 'utf8');
    // console.log(content);
    editor.session.setValue(content);
    $('#dropdownMenuButton').html(filename.split('.js')[0]);
    currentFilename = filename;
    saveConfig();
}

function newFile() {
    editor.session.setValue(`
async function setup(){
    
}

async function loop(){
    
}`);
    $('#dropdownMenuButton').html('Unsaved File');
    currentFilename = null;
    saveConfig();
}

function saveFile() {
    // console.log('save file', currentFilename);
    if(currentFilename === null){
        $('.dialog').show();
        $('#formScriptNameBox').focus();
    } else {
        // save the file
        console.log('Saving file');
        const fileContent = editor.getValue();
        const documentsFolder = app.getPath('documents');
        const scriptFolder = path.join(documentsFolder, 'NMSbot');
        const filePath = path.join(scriptFolder, currentFilename);
        fs.writeFileSync(filePath, fileContent);
        updateFileMenu();
        $('#dropdownMenuButton').html(currentFilename.split('.js')[0]);
    }
    saveConfig();
}

function updateFileMenu() {
    const scriptFiles = getJsFiles();
    let htmlArr = [];
    htmlArr.push(
        `<a class="dropdown-item file-new" href="#">**New**</a>`
    );
    for (let i = 0; i < scriptFiles.length; i++) {
        htmlArr.push(
            `<a class="dropdown-item file-select" href="#" data-filename="${scriptFiles[i]}">${scriptFiles[i].split('.js')[0]}</a>`
        )
    }

    $('#drop-down-menu').html(htmlArr);
    $('.file-select').click(function () {
        const filename = $(this).attr("data-filename");
        openFile(filename);
    });
    $('.file-new').click(function () {
        newFile();
    });

}

function getJsFiles() {
    let scriptFiles = [];
    const documentsFolder = app.getPath('documents');
    const scriptFolder = path.join(documentsFolder, 'NMSbot');
    const allFiles = fs.readdirSync(scriptFolder);
    // console.log('AllFiles', allFiles);
    for (let i = 0; i < allFiles.length; i++) {
        if (allFiles[i].endsWith(".js")) {
            scriptFiles.push(allFiles[i]);
        }
    }
    return scriptFiles;
}

function logError(err){
    status('Error');
    hud('Error');
    stop();
    alert(err);
}

async function runLoop(){
    try{
        if(isRunning && fobNeedsToSetup){
            const codeToRun = editor.getValue();
            eval(codeToRun);
            try {
                programLoop = loop;
            } catch (e){
                status('Loop is not defined');
                programLoop = null;
            }
            fobNeedsToSetup = false;
            status('Switch to the game to run loop');
            try{
                await setup();
            } catch (e){
                // setup not required
            }
        }
    } catch (e){
        console.log(e);
        status('Error running code');
    }
    try {
        let activeWinInfo = await activeWin();
        // console.log(activeWinInfo);
        if (activeWinInfo && isRunning && activeWinInfo.title === 'No Man\'s Sky') {
            // console.log('Running code');
            // console.log(await activeWin());
            // const codeToRun = editor.getValue();
            // eval("(async () => {" + codeToRun + "})()");
            try{
                if(programLoop !== null){
                    await programLoop();
                    status('Running loop');
                }
            } catch(e){
                logError(e);
            }
        }
    } catch (e){
        console.log(e);
        status('Loop error')
    }
    await delay(isRunning ? loopDelay : 200);
    runLoop();
}

$(document).ready(function () {

    // setup callbacks
    $('.close-icon').click(function(){
       saveConfig();
       saveFile();
        var window = remote.getCurrentWindow();
        window.close();
    });
    $('#play-btn').click(function (event) {
        event.preventDefault();
        start();
    });
    $('#stop-btn').click(function (event) {
        event.preventDefault();
        stop();
    });

    $('.cancel-save').click(function (event) {
        event.preventDefault();
        $('.dialog').hide();
    });

    $('.dialog-bg').click(function (event) {
        event.preventDefault();
        $('.dialog').hide();
    });

    Mousetrap.bind(['command+s', 'ctrl+s'], function () {
        console.log('command s or control s');
        saveFile();
        // return false to prevent default browser behavior
        // and stop event from bubbling
        return false;
    });

    $('#formScriptName').submit(function( event ) {
        event.preventDefault();
        let fileName = $('#formScriptNameBox').val();
        if(fileName === ''){
            fileName = 'My Script';
        }

        if(!(fileName.endsWith('.js'))){
            fileName = `${fileName}.js`;
        }
        currentFilename = fileName;
        saveFile();
        $('.dialog').hide();
    });

    $('#openScriptFolderBtn').click(function(event){
        event.preventDefault();
        openScriptFolder();
    });

    editor.commands.addCommand({
        name: 'saveFile',
        bindKey: {
            win: 'Ctrl-S',
            mac: 'Command-S',
            sender: 'editor|cli'
        },
        exec: function(env, args, request) {
            saveFile();
        }
    });

    if(config.lastFile !== null){
        openFile(config.lastFile);
    }
    updateFileMenu();
    runLoop();
});
