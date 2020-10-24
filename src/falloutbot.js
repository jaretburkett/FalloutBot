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
const scriptFolder = path.join(documentsFolder, 'FalloutBot');
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

let _isRunning = false;

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
    _isRunning = true;
    // set needs to setup to true to trigget setup on first loop
    fobNeedsToSetup = true;
    status('Setting up script');
}

function stop() {
    $('#play-btn').show();
    $('#stop-btn').hide();
    // set running to false to stop running script
    _isRunning = false;
    status('Stopped');
    globalShortcut.unregisterAll();
    programLoop = null;
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
        const scriptFolder = path.join(documentsFolder, 'FalloutBot');
        const filePath = path.join(scriptFolder, currentFilename);
        fs.writeFileSync(filePath, fileContent);
        updateFileMenu();
        console.log(`Saved file to ${filePath}`);
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

function logError(err){
    console.log('ERROR', err)
    status('Error');
    hud('Error');
    stop();
    // alert(err);
}

async function _runLoop(){
    try{
        if(_isRunning && fobNeedsToSetup){
            const codeToRun = editor.getValue();
            eval(codeToRun);
            try {
                programLoop = loop;
            } catch (e){
                status('Loop is not defined');
                console.log(e)
                programLoop = null;
            }
            fobNeedsToSetup = false;
            status('Switch to the game to run loop');
            try{
                await setup();
            } catch (e){
                console.log(e)
                // setup not required
            }
        }
    } catch (e){
        status('Error running code');
        console.log(e)
    }
    try {
        let activeWinInfo = await activeWin();
        if (activeWinInfo && _isRunning && activeWinInfo.title === 'Fallout76') {
            // console.log('Running code');
            // console.log(await activeWin());
            // const codeToRun = editor.getValue();
            // eval("(async () => {" + codeToRun + "})()");
            if(programLoop !== null){
                await programLoop();
                status('Running loop');
            }
        }
    } catch (e){
        console.log(e);
        status('Loop error')
    }
    await delay(programLoop !== null ? loopDelay : 200);
    _runLoop();
}

function setupConsole(){
    // if (typeof console  != "undefined") {
    //     if (typeof console.log != 'undefined')
    //         console.olog = console.log;
    //     else
    //         console.olog = function() {};
    // }
    console.olog = console.log;

    console.log = function(message) {
        const maxLength = 20;

        console.olog(message);
        const $pre = $('#console pre');
        const $console = $('#console');
        const txt = $pre.html();
        let arr = txt.split('\n');
        // remove empty vals
        arr = arr.filter((el) => { 
            return el !== '' && el !== ' ';
        })
        arr.push(message);
        if(arr.length > maxLength){
            arr = arr.slice(arr.length - maxLength)
        }

        $pre.html(arr.join('\n'));
        $console.scrollTop($console.prop("scrollHeight"));
    };
    console.error = console.debug = console.info =  console.log
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
        if(_isRunning){
        stop();
        start();
        }
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
    setupConsole();

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
    console.log('Fallout Bot Ready')
    _runLoop();
});
