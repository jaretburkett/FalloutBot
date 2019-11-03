

// class Player{
//     constructor(options){
//         this.props = {
//             offset:options.offset || 0x583CA98,
//             sig:options.sig || 'C3 48 8D 0D ?? ?? ?? ?? E8 ?? ?? ?? ?? 83 3D ?? ?? ?? ?? FF 75 DF 48 8D 05 ?? ?? ?? ?? 0F 57 C0'
//         }
//         // x: 0xE0
//         // y: 0xE4
//         // z: 0xE8
//     }
// }
const memory = require('./memory');
const robot = require('robotjs');

function getAngle(startVec, endVec){
    let deltaX = startVec.x - endVec.x;
    let deltaY = startVec.y - endVec.y;
    let rad = Math.atan2(deltaY, deltaX);
    const deg = rad * (180 / Math.PI);

    // 0 = West
    // -90 = North
    //-180/180 = East
    // 90 / South
    return deg;
}

function delay(ms){
    return new Promise(resolve =>{
        setTimeout(()=>{
            resolve();
        }, ms);
    })
}

function isFocused(){
    let activeWinInfo = activeWin.sync();
    return activeWinInfo && isRunning && activeWinInfo.title === 'Fallout76';
}

async function moveTo(destVect, errMargin = 100){
    try {
        const locPlayerPointer = memory.read(0x583CA98, true, 'uint64');
        const startVec = memory.read(locPlayerPointer + 0xE0, false, 'vector3');
        const distance = Math.abs(startVec.x - destVect.x) + Math.abs(startVec.y - destVect.y);
        if(distance > errMargin){
            // console.log('startVect', startVec);
            // robot.keyToggle('w', 'down');
            // await delay(100);
            // robot.keyToggle('w', 'up');
            // const angleVec = memory.read(locPlayerPointer + 0xE0, false, 'vector3');
            //
            // const angleFacing = getAngle(startVec, angleVec);
            // const angleNeeded = getAngle(angleVec, destVect);
            // console.log({
            //
            //     angleFacing:angleFacing,
            //     angleNeeded:angleNeeded
            // });
            // // zero facing angle.
            //
            // // first get heading
            // let directionNeeded = angleNeeded - angleFacing;
            // if(directionNeeded > 180){
            //     directionNeeded = directionNeeded - 360;
            // }
            // if(directionNeeded < -180) {
            //     directionNeeded = directionNeeded + 360
            // }
            // const moveForward = Math.abs(directionNeeded) < 90;
            // const moveRight = directionNeeded < 0;

            let oldReading = memory.read(locPlayerPointer + 0xE0, false, 'vector3');
            robot.keyToggle('w', 'down');
            await delay(100);
            robot.keyToggle('w', 'up');
            let newReading = memory.read(locPlayerPointer + 0xE0, false, 'vector3');
            let oldDiff = Math.abs(oldReading.x - destVect.x) + Math.abs(oldReading.y - destVect.y);
            let newDiff = Math.abs(newReading.x - destVect.x) + Math.abs(newReading.y - destVect.y);
            robot.keyToggle('s', 'down');
            await delay(100);
            robot.keyToggle('s', 'up');

            let moveForward = newDiff < oldDiff;
            console.log('moveForward', moveForward);

            oldReading = memory.read(locPlayerPointer + 0xE0, false, 'vector3');
            robot.keyToggle('d', 'down');
            await delay(100);
            robot.keyToggle('d', 'up');
            newReading = memory.read(locPlayerPointer + 0xE0, false, 'vector3');
            oldDiff = Math.abs(oldReading.x - destVect.x) + Math.abs(oldReading.y - destVect.y);
            newDiff = Math.abs(newReading.x - destVect.x) + Math.abs(newReading.y - destVect.y);
            robot.keyToggle('a', 'down');
            await delay(100);
            robot.keyToggle('a', 'up');

            let moveRight = newDiff < oldDiff;
            console.log('moveRight', moveRight);
            console.log('diff', newDiff);

            robot.keyToggle(moveForward ? 'w' : 's', 'down');
            robot.keyToggle(moveRight ? 'd' : 'a', 'down');
            await delay(newDiff < 1000 ? 200 : 2000);
            robot.keyToggle(moveForward ? 'w' : 's', 'up');
            robot.keyToggle(moveRight ? 'd' : 'a', 'up');
        }





    } catch(e){
        console.log(e);
    }
}

module.exports.moveTo = moveTo;