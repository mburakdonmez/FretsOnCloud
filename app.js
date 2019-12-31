/**
 * @file Frets On Cloud
 * @author Mehmet Burak Dönmez
 */

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const fs = require('fs');

const getDirectories = (source, isDirectory) =>
    fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() === isDirectory)
        .map(dirent => dirent.name)


const host = '0.0.0.0';
const http_port = process.env.PORT || 80;
const app = express();

app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }));
app.use(bodyParser.json({ limit: '25mb' }));



app.set('json escape', true);
app.use(express.static('static'));

if (process.env.NODE_ENV == 'production') {
    app.enable('trust proxy');
}

app.use((req, res, next) => {
    console.log(`[${new Date()}] ${req.connection.remoteAddress}|${req.method}|${req.originalUrl}`);
    next();
})

app.get('/ping', (req, res) => {
    res.end("pong");
})

app.get('/allSongs', (req, res) => {
    res.json(getDirectories('static/songs', true));
})

app.get('/song', (req, res) => {
    res.sendFile(path.join(__dirname, 'static/game.html'));
})

app.get('/songDetails', (req, res) => {
    let sn = path.join('./static/songs', req.query.songName);
    if (fs.existsSync(sn)) {
        let response = { mid: 'notes.mid' };
        if (fs.existsSync(path.join(sn, 'song.ogg')))
            response.song = 'song.ogg';
        if (fs.existsSync(path.join(sn, 'guitar.ogg')))
            response.guitar = 'guitar.ogg';
        if (fs.existsSync(path.join(sn, 'rhythm.ogg')))
            response.rhythm = 'rhythm.ogg';
        res.json(response);
    } else {
        res.json({ mid: 'notExists' });
    }
})

app.get('/mistakeSounds', (req, res) => {
    res.json(getDirectories('static/sounds/mistakes', false));
})

http.createServer(app).listen(http_port, () => {
    console.log(`Server is running at http://${host}:${http_port}`);
});
