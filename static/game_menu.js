const levelChart = {
    4: 'Easy',
    5: 'Medium',
    6: 'Hard',
    7: 'Expert'
}

function showGameMenu(parsedMidiFile) {
    let ul = $('<ul />');
    $(document.body).append(ul);

    const __selectLevel = (track) => {
        ul.children().remove();
        let levels = new Set();  //4: easy, 5: medium, 6: hard, 7: expert
        console.log('track', track);
        track.notes.some(note => {
            levels.add(note.octave);
            return levels.size >= 4;     //stop if all levels are detected
        });
        levels = [...levels];
        levels.forEach(v => {
            ul.append($('<li />').append($('<a />').attr('href', '#').text(levelChart[v]).on('click', () => {
                let notes = [];
                track.notes.forEach(note => {
                    if (note.octave === v) {
                        notes.push(note);
                    }
                });
                notes.sort((a, b) => a.time < b.time ? -1 : (a.time === b.time ? 0 : 1));
                ul.remove();
                initScene(() => startGame(notes, v));
            })))
        })
    }

    parsedMidiFile.tracks.forEach((element, index) => {
        ul.append($('<li />').append($('<a />').text(element.name).attr('href', '#').on('click', () => __selectLevel(parsedMidiFile.tracks[index]))))
    });
}