/**
 * @file Frets On Cloud
 * @author Mehmet Burak Dönmez
 */

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const https = require('https');
const fs = require('fs');

const getDirectories = (source, isDirectory) =>
    fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() === isDirectory)
        .map(dirent => dirent.name)


const host = '0.0.0.0';
const http_port = process.env.PORT || 80;
const https_port = process.env.PORT || 443;
const app = express();

app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }));
app.use(bodyParser.json({ limit: '25mb' }));

app.use(function (req, res, next) {
    if (!req.secure)
        return res.redirect(['https://', req.get('Host'), req.url].join(''))
    next();
});

app.set('json escape', true);
app.use(express.static('static'));

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

/*http.createServer(app).listen(http_port, () => {
    console.log(`Server is running at http://${host}:${http_port}`);
});*/

http.createServer(app).listen(http_port, () => {
    console.log(`Server is redirecting http://${host}:${http_port} to https://${host}:${https_port}`);
});

https.createServer({
    key: fs.readFileSync('./ssl/domain.key'),
    cert: fs.readFileSync('./ssl/domain.crt'),
}, app).listen(https_port, host, function () {
    console.log(`Server is running at https://${host}:${https_port}`);
});