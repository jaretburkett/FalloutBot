const memoryjs = require('memoryjs');
const processName = "Fallout76.exe";


function openMemory(processName){
    const process = memoryjs.openProcess(processName);
    if (!process.szExeFile) throw ('Fallout 76 is not open');
    const handle = process.handle;
    const address = process.modBaseAddr;
    return [handle, address];
}

function writeMemory(address, isOffset, value, type){
    const [handle, moduleAddress] = openMemory(processName);
    const memAddress = isOffset ? moduleAddress + address : address;
    memoryjs.writeMemory(handle, memAddress, value, type);
    memoryjs.closeProcess(handle);
}

function readMemory(address, isOffset, type){
    const [handle, moduleAddress] = openMemory(processName);
    const memAddress = isOffset ? moduleAddress + address : address;
    const value = memoryjs.readMemory(handle, memAddress, type);
    memoryjs.closeProcess(handle);
    return value;
}


module.exports.writeMemory = writeMemory;
module.exports.readMemory = readMemory;

