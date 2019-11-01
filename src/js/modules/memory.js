const memoryjs = require('memoryjs');
const processName = "Fallout76.exe";
const processTitle = "Fallout76";
const activeWin = require('active-win');


function openMemory(processName){
    const process = memoryjs.openProcess(processName);
    if (!process.szExeFile) throw ('Fallout 76 is not open');
    const handle = process.handle;
    const address = process.modBaseAddr;
    return [handle, address];
}

function writeMemory(address, isOffset, value, type){
    let activeWinInfo = activeWin.sync();
    if(activeWinInfo && activeWinInfo.title === processTitle){
        const processIdentifier = activeWinInfo.owner.processId;
        const [handle, moduleAddress] = openMemory(processIdentifier);
        const memAddress = isOffset ? moduleAddress + address : address;
        memoryjs.writeMemory(handle, memAddress, value, type);
        memoryjs.closeProcess(handle);
    }
}

function readMemory(address, isOffset, type){
    let activeWinInfo = activeWin.sync();
    if(activeWinInfo && activeWinInfo.title === processTitle) {
        // const [handle1, moduleAddress1] = openMemory(processName);
        // console.log('handle1', handle1);
        // console.log('moduleAddress1',moduleAddress1);
        // console.log('activeWinInfo',activeWinInfo);
        const processIdentifier = activeWinInfo.owner.processId;
        const [handle, moduleAddress] = openMemory(processIdentifier);
        const memAddress = isOffset ? moduleAddress + address : address;
        const value = memoryjs.readMemory(handle, memAddress, type);
        memoryjs.closeProcess(handle);
        return value;
    } else {
        console.log('activeWinInfo', activeWinInfo);
        return null;
    }
}

function findCodeSig(sigString){
    let activeWinInfo = activeWin.sync();
    if(activeWinInfo && activeWinInfo.title === processTitle) {
        // const [handle1, moduleAddress1] = openMemory(processName);
        // console.log('handle1', handle1);
        // console.log('moduleAddress1',moduleAddress1);
        // console.log('activeWinInfo',activeWinInfo);
        const processIdentifier = activeWinInfo.owner.processId;
        const [handle, moduleAddress] = openMemory(processIdentifier);
        const offset = memoryjs.findPattern(handle, processName, sigString, memoryjs.SUBSTRACT, 0, 0);
        memoryjs.closeProcess(handle);
        return offset;
    } else {
        console.log('activeWinInfo', activeWinInfo);
        return null;
    }
}


module.exports.write = writeMemory;
module.exports.read = readMemory;
module.exports.findCodeSig = findCodeSig;

