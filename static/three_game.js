let gameStartTime;
let gameStarted = false;
let notes = [];
let currentNotes = [];
let currentTime;
let penaStates = {};
let lastHit = new Date();
let lastFastHit = new Date();
let playAudio;
let sounds = [];

const note_point = 10;
let gp = 0; //gğ: game points
let gp_multiplier = 1;
let gp_multiplier_level = 0;

let level = 7; //4: easy, 5: medium, 6: hard, 7: expert

let mistakeVolumeLevel = 0.01;

let mistakeSounds = [];

const beforeTime = 2;
const afterTime = 0.1;
const hitTimeDelta = beforeTime / 8;
const fastHitTimeDelta = hitTimeDelta / 3;

let combo = 0;
let points = 0;
let totalNotes = 0;

const positions = {
    'C': 0,
    'C#': 1,
    'D': 2,
    'D#': 3,
    'E': 4
}

const config = {
    hb1: 112,   //F1
    hb2: 113,   //F2
    hb3: 114,   //F3
    hb4: 115,   //F4
    hb5: 116,   //F5
    pena: [13, 16]  //ENTER, SHIFT
}

let states = {
    hb1: false,
    hb2: false,
    hb3: false,
    hb4: false,
    hb5: false
}

let colorTimes = [
    {
        r: new Date(),
        g: new Date(),
        b: new Date()
    },
    {
        r: new Date(),
        g: new Date(),
        b: new Date()
    },
    {
        r: new Date(),
        g: new Date(),
        b: new Date()
    }
]

let colorValues = [
    {
        r: 0,
        g: 0,
        b: 0
    },
    {
        r: 0,
        g: 0,
        b: 0
    },
    {
        r: 0,
        g: 0,
        b: 0
    }
]

let colorTimeOut = 3000; //millisecond(s)

function startGame(notesToSet, levelToSet) {
    level = levelToSet;
    notes = notesToSet;
    totalNotes = notes.length;
    writePoints(`(${combo}) ${points}/${totalNotes}`);
    createEventListeners();

    // gameStartTime = new Date();
    gameStartTime = new Date(Date.now() + 3000);
    sounds.forEach(s => s.play());
    refreshCurrentNotes(gameStartTime);


    gameStarted = true;
    const countDown = (number = 3) => {
        $('#countDownDiv').text(number).fadeIn(500, () => {
            $('#countDownDiv').fadeOut(500, () => {
                if (number > 1) {
                    countDown(number - 1);
                }
            });
        });
    };
    countDown();
    animate();

}

function sync_sounds(note_time = null) {
    if (gameStartTime < currentTime) {
        playAudio.play();
        sounds.forEach(s => s.play());
        if (note_time && Math.abs(note_time - playAudio.currentTime) > hitTimeDelta) {
            playAudio.currentTime = note_time;
            sounds.forEach(s => { s.currentTime = note_time; });
        }
    } else {
        playAudio.pause();
        playAudio.currentTime = 0;
        sounds.forEach(s => {
            s.currentTime = 0;
            s.pause();
        });
    }
}

function initGame(songName) {
    $.ajax({
        method: 'GET',
        url: '/songDetails',
        data: { songName: songName },
        success: response => {
            if (response.mid === 'notExists') {
                alert(`The song '${songName}' does not exists`);
                window.location.href = '/'
            } else {
                if (response.guitar) {
                    playAudio = new Audio(`/songs/${songName}/${response.guitar}`);
                }
                if (response.song) {
                    let ad = new Audio(`/songs/${songName}/${response.song}`);
                    if (!playAudio)
                        playAudio = ad;
                    else
                        sounds.push(ad);
                }
                if (response.rhythm) {
                    let ad = new Audio(`/songs/${songName}/${response.rhythm}`);
                    if (!playAudio)
                        playAudio = ad;
                    else
                        sounds.push(ad);
                }

                $.ajax({
                    method: 'GET',
                    url: '/mistakeSounds',
                    success: mistakeSoundResponse => {
                        mistakeSoundResponse.forEach(v => mistakeSounds.push(new Audio(`/sounds/mistakes/${v}`)));
                        (new Midi.fromUrl(`/songs/${songName}/${response.mid}`)).then(midiFile => {
                            showGameMenu(midiFile);
                        });
                    }
                })


            }
        }
    })
}

function isNoteInHitBox(note) {
    return note && Math.abs(getCurrentSecond() - note.time) < hitTimeDelta;
}

function hitBoxToColor(hitBox) {
    return colors[parseInt(hitBox[hitBox.length - 1]) - 1];
}

function hexToRgb(hex) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b }
}

function hitNote(note) {
    mainObj.remove(note.obj);
    lastHit = currentTime;
    playAudio.volume = 1;
    combo++;
    points++;
    gp += gp_multiplier * note_point;
    if (gp_multiplier < 4 && ++gp_multiplier_level >= 8) {
        gp_multiplier_level = 0;
        gp_multiplier++;
    }
    $('#gamePointDiv').text(`x${gp_multiplier} (${gp_multiplier_level}) ${gp} pts`);

    let hb = noteToHitBox(note);
    let clr = hitBoxToColor(hb);
    let color_hex = `000000${clr.toString(16)}`.substr(-6);
    addScoreBoardColor(color_hex);
    hitBoxes[hb].material.color.set(clr);
    setTimeout(() => hitBoxes[hb].material.color.set(0xfef5ff), 500)
    writePoints(`(${combo}) ${points}/${totalNotes}`);
    sync_sounds(note.time);
}

function addScoreBoardColor(hex_color) {
    let { r, g, b } = hexToRgb(hex_color);
    let pick = Math.floor(Math.random() * 3);
    if (r) {
        colorValues[pick].r = r / 255;
        colorTimes[pick].r = currentTime;
    }
    if (g) {
        colorValues[pick].g = g / 255;
        colorTimes[pick].g = currentTime;
    }
    if (b) {
        colorValues[pick].b = b / 255;
        colorTimes[pick].b = currentTime;
    }
}

function setScoreBoardColor() {
    sc_light.forEach((lt, index) => {
        let r_passed = currentTime - colorTimes[index].r;
        if (r_passed <= colorTimeOut) {
            lt.color.r = ((colorTimeOut - r_passed) / colorTimeOut) * colorValues[index].r;
        } else {
            lt.color.r = 0;
        }

        //g
        let g_passed = currentTime - colorTimes[index].g;
        if (g_passed <= colorTimeOut) {
            lt.color.g = ((colorTimeOut - g_passed) / colorTimeOut) * colorValues[index].g;
        } else {
            lt.color.g = 0;
        }

        //b
        let b_passed = currentTime - colorTimes[index].b;
        if (b_passed <= colorTimeOut) {
            lt.color.b = ((colorTimeOut - b_passed) / colorTimeOut) * colorValues[index].b;
        } else {
            lt.color.b = 0;
        }
    });

}

function isPenaDown() {
    return Object.values(penaStates).some(v => v === true);
}

async function setState(key, state) {
    if (states[key] !== state) {
        states[key] = state;
        hitBoxes[key].visible = state;
        if (state && (currentTime - lastHit) <= fastHitTimeDelta * 1000) {
            while (currentNotes.length > 0 && isNoteInHitBox(currentNotes[0])) {
                if (currentNotes.length > 0 && noteToHitBox(currentNotes[0]) === key) {
                    lastFastHit = currentTime;
                    hitNote(currentNotes.shift());
                } else {
                    break;
                }
                await new Promise(r => setTimeout(r, 100)); //helps with async call 
            }
        }
    }
}

function wrongPena() {
    if (currentTime - lastFastHit > fastHitTimeDelta) {
        let i = Math.floor(Math.random() * mistakeSounds.length);
        mistakeSounds[i].play();
        punish();
    }
}

function missedNote(note) {
    mainObj.remove(note.obj);
    punish();
}

function punish() {
    combo = 0;
    gp_multiplier = 1;
    gp_multiplier_level = 0;
    writePoints(`(${combo}) ${points}/${totalNotes}`);
    $('#gamePointDiv').text(`x${gp_multiplier} (${gp_multiplier_level}) ${gp} pts`);
    playAudio.volume = mistakeVolumeLevel;
}

function noteToHitBox(note) {
    if (note.pitch === 'C') {
        return 'hb1';
    } else if (note.pitch === 'C#') {
        return 'hb2';
    } else if (note.pitch === 'D') {
        return 'hb3';
    } else if (note.pitch === 'D#') {
        return 'hb4';
    } else if (note.pitch === 'E') {
        return 'hb5';
    }
}

function matchHitBoxesAndStates(currentHitBoxes) {
    if (states.hb1) {
        if (!currentHitBoxes.includes('hb1')) {
            return false;
        }
    } else {
        if (currentHitBoxes.includes('hb1')) {
            return false
        }
    }
    if (states.hb2) {
        if (!currentHitBoxes.includes('hb2')) {
            return false;
        }
    } else {
        if (currentHitBoxes.includes('hb2')) {
            return false
        }
    }
    if (states.hb3) {
        if (!currentHitBoxes.includes('hb3')) {
            return false;
        }
    } else {
        if (currentHitBoxes.includes('hb3')) {
            return false
        }
    }
    if (states.hb4) {
        if (!currentHitBoxes.includes('hb4')) {
            return false;
        }
    } else {
        if (currentHitBoxes.includes('hb4')) {
            return false
        }
    }
    if (states.hb5) {
        if (!currentHitBoxes.includes('hb5')) {
            return false;
        }
    } else {
        if (currentHitBoxes.includes('hb5')) {
            return false
        }
    }
    return true;
}

function setHitBoxHeights(penaState) {
    if (penaState) {
        if (states.hb1) {
            hitBoxes.hb1.position.x = 0.1;
        }
        if (states.hb2) {
            hitBoxes.hb2.position.x = 0.1;
        }
        if (states.hb3) {
            hitBoxes.hb3.position.x = 0.1;
        }
        if (states.hb4) {
            hitBoxes.hb4.position.x = 0.1;
        }
        if (states.hb5) {
            hitBoxes.hb5.position.x = 0.1;
        }
    } else {
        hitBoxes.hb1.position.x = 0;
        hitBoxes.hb2.position.x = 0;
        hitBoxes.hb3.position.x = 0;
        hitBoxes.hb4.position.x = 0;
        hitBoxes.hb5.position.x = 0;
    }
}

function hitPena(keyId, state) {
    if (penaStates[keyId] !== state) {
        penaStates[keyId] = state;
        setHitBoxHeights(state);
        if (state) {
            let hitBoxes = [];
            let first = currentNotes[0];
            if (isNoteInHitBox(first)) {
                hitBoxes.push(noteToHitBox(first));
                let noteCount = 0;
                while (currentNotes[++noteCount] && currentNotes[noteCount].time === first.time) {
                    hitBoxes.push(noteToHitBox(currentNotes[noteCount]));
                }
                if (matchHitBoxesAndStates(hitBoxes)) {
                    for (let i = 0; i < noteCount; i++) {
                        hitNote(currentNotes.shift());
                    }
                } else {
                    wrongPena();
                }
            } else {
                wrongPena();
            }
        } else {

        }
    }

}

function get_next_notes() {
    let next_notes = [currentNotes[0]];
    let noteCount = 0;
    while (currentNotes[++noteCount] && currentNotes[noteCount].time === next_notes[0].time) {
        next_notes.push(currentNotes[noteCount]);
    }
    return next_notes;
}

async function touchKey(key, state) {
    if (states[key] !== state) {
        states[key] = state;
        hitBoxes[key].visible = state;
        setHitBoxHeights(state);
        const next_notes = get_next_notes();
        if (next_notes.length > 0 && isNoteInHitBox(next_notes[0])) {
            next_notes.some(v => {
                if (noteToHitBox(v) === key) {
                    v.state = state;
                    return true;
                }
            });
            if (next_notes.every(v => v.state === true)) {
                for (let i = 0; i < next_notes.length; i++) {
                    hitNote(currentNotes.shift());
                }
            }
        } else {
            if (state) {
                wrongPena();
            }
        }
    }
}

function createEventListeners() {
    window.onkeydown = event => {
        if (config.pena.includes(event.keyCode)) {
            event.preventDefault();
            hitPena(event.keyCode, true);
        } else if (config.hb1 === event.keyCode) {
            event.preventDefault();
            setState('hb1', true);
        } else if (config.hb2 === event.keyCode) {
            event.preventDefault();
            setState('hb2', true);
        } else if (config.hb3 === event.keyCode) {
            event.preventDefault();
            setState('hb3', true);
        } else if (config.hb4 === event.keyCode) {
            event.preventDefault();
            setState('hb4', true);
        } else if (config.hb5 === event.keyCode) {
            event.preventDefault();
            setState('hb5', true);
        }
    };

    window.onkeyup = event => {
        if (config.pena.includes(event.keyCode)) {
            event.preventDefault();
            hitPena(event.keyCode, false);
        } else if (config.hb1 === event.keyCode) {
            event.preventDefault();
            setState('hb1', false);
        } else if (config.hb2 === event.keyCode) {
            event.preventDefault();
            setState('hb2', false);
        } else if (config.hb3 === event.keyCode) {
            event.preventDefault();
            setState('hb3', false);
        } else if (config.hb4 === event.keyCode) {
            event.preventDefault();
            setState('hb4', false);
        } else if (config.hb5 === event.keyCode) {
            event.preventDefault();
            setState('hb5', false);
        }
    };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const touches = {};

    window.addEventListener('touchstart', (e) => {
        e.preventDefault();

        mouse.x = +(e.changedTouches[0].pageX / window.innerWidth) * 2 + -1;
        mouse.y = -(e.changedTouches[0].pageY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        let intersect = raycaster.intersectObjects(scene.children).filter(v => v.object === mainObj);
        if (intersect.length > 0) {
            intersect = intersect[0];
            const x_ = Math.ceil(intersect.uv.x * 5);
            const key = `hb${x_}`
            touches[e.changedTouches[0].identifier] = { key: key };
            touchKey(key, true);
        }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (touches[e.changedTouches[0].identifier]) {
            touchKey(touches[e.changedTouches[0].identifier].key, false);
        }
    }, { passive: false })
}

function getCurrentSecond() {
    return (currentTime - gameStartTime) / 1000;
}

function gameRender(currentTimeLocal) {
    currentTime = currentTimeLocal;
    setScoreBoardColor();
    planeTexture.offset.y = getTextureOffset();
    refreshCurrentNotes();
    getPositions();
    sync_sounds();
}

function getTextureOffset() {
    let offset = (currentTime - gameStartTime) * (0.0018 / beforeTime);  //0.0018: I don't exactly know why, probably contains something about the height of the texture, but I found it with trial error method :)
    while (offset >= 1) {
        offset--;
    }
    return offset;
}

function refreshCurrentNotes() {
    let currentSecond = getCurrentSecond();
    let from = currentSecond - afterTime;
    let to = currentSecond + beforeTime;

    if (currentNotes.length > 0) {
        let first = currentNotes[0];
        while (first.time < from) {
            missedNote(currentNotes.shift());
            if (currentNotes.length > 0)
                first = currentNotes[0];
            else
                break;
        }
    }
    if (notes.length > 0) {
        let first = notes[0];
        while (to > first.time) {
            let newNote = notes.shift();
            newNote.pos = positions[newNote.pitch];
            newNote.obj = createNoteObj(newNote.pos);
            mainObj.add(newNote.obj);
            currentNotes.push(newNote);
            first = notes[0];
            if (notes.length > 0)
                first = notes[0];
            else
                break;
        }
    }


}

function getPositions() {
    let currentSecond = getCurrentSecond();
    let to = currentSecond + beforeTime;
    let katsayi = 29 / beforeTime;  // 30 is the size of the mainObj, 29 is the size of the area before a note is in the hitbox
    let katsayi2 = 0.6 / afterTime;  // 0.6 is the size of the area after a note passes the hitbox
    for (let i = 0; i < currentNotes.length; i++) {
        if (currentSecond <= currentNotes[i].time) {
            currentNotes[i].obj.position.z = ((to - currentNotes[i].time) * katsayi) - 15;
        } else {
            currentNotes[i].obj.position.z = 14 - ((currentNotes[i].time - currentSecond) * katsayi2); //this creates a disorientation in notes speed, but helps for syncronisation
        }
    }
}
