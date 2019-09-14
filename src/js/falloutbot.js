const {app} = require('electron').remote;
const {remote} = require('electron');
const fs = require('fs');
const path = require('path');
let currentFilename = null;
const activeWin = require('active-win');
var Mousetrap = require('mousetrap');
let variable = null;
let fobNeedsToSetup = true;

let config = {
    lastFile:null
};

let programLoop = ()=>{};

var loopDelay = 500;

// read config
const documentsFolder = app.getPath('documents');
const scriptFolder = path.join(documentsFolder, 'FalloutBot');
const configFile = path.join(scriptFolder, 'config.json');
if (fs.existsSync(configFile)){
    try {
        config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    } catch (e){
        console.log(e);
    }
}

var editor = ace.edit("editor");
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

var isRunning = false;

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
}


function openFile(filename) {
    const documentsFolder = app.getPath('documents');
    const scriptFolder = path.join(documentsFolder, 'FalloutBot');
    const content = fs.readFileSync(path.join(scriptFolder, filename), 'utf8');
    // console.log(content);
    editor.session.setValue(content);
    $('#dropdownMenuButton').html(filename.split('.js')[0]);
    currentFilename = filename;
    saveConfig();
}

function newFile() {
    editor.session.setValue(`async function loop(){
    
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
        const scriptFolder = path.join(documentsFolder, 'FalloutBot');
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
    )
    for (let i = 0; i < scriptFiles.length; i++) {
        htmlArr.push(
            `<a class="dropdown-item file-select" href="#" data-filename="${scriptFiles[i]}">${scriptFiles[i].split('.js')[0]}</a>`
        )
    }

    $('#drop-down-menu').html(htmlArr);
    $('.file-select').click(function () {
        const filename = $(this).attr("data-filename");
        openFile(filename);
    })
    $('.file-new').click(function () {
        newFile();
    });

}

function getJsFiles() {
    let scriptFiles = [];
    const documentsFolder = app.getPath('documents');
    const scriptFolder = path.join(documentsFolder, 'FalloutBot');
    const allFiles = fs.readdirSync(scriptFolder);
    // console.log('AllFiles', allFiles);
    for (let i = 0; i < allFiles.length; i++) {
        if (allFiles[i].endsWith(".js")) {
            scriptFiles.push(allFiles[i]);
        }
    }
    return scriptFiles;
}

async function runLoop(){
    try{
        if(isRunning && fobNeedsToSetup){
            const codeToRun = editor.getValue();
            eval(codeToRun);
            programLoop = loop;
            fobNeedsToSetup = false;
            status('Switch to the game to run loop');
            setup();
        }
    } catch (e){
        status('Error running code');
    }
    try {
        const activeWinInfo = await activeWin();
        if (isRunning && activeWinInfo.title === 'Fallout76') {
            console.log('Running code');
            // console.log(await activeWin());
            // const codeToRun = editor.getValue();
            // eval("(async () => {" + codeToRun + "})()");
            await programLoop();
            status('Running loop');
        }
    } catch (e){
        console.log(e);
        status('Loop error')
    }
    await delay(loopDelay);
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
