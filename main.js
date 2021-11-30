const { ipcMain } = require('electron');
const electron = require ('electron');
const { getInfo } = require('ytdl-core');
const ipc = electron.ipcMain;

const ytdl = require("ytdl-core");
const ytsr = require('ytsr');
const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

const axios = require('axios');

const app = electron.app; 
const BrowserWindow = electron.BrowserWindow; 

let win;



app.on('ready', _ => {
    win = new BrowserWindow({
        width: 1200,
        height: 680,
        minWidth: 940,
        minHeight: 560,
        frame: false,
        autoHideMenuBar: true,

        // title: 'Youtube Downloader',

        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    win.loadFile('./src/index2.html');
    win.webContents.openDevTools();
    

    

    
});

ipcMain.on('close-window', () => {
    win.close();
})

ipcMain.on('minimize-window', () => {
    win.minimize();
})

ipcMain.on('videoURL', (event, videoURL) => {
    handleURL(videoURL);
})

ipcMain.on('videoFormat', (event, videoFormat, videoURL, videoTitle) => {
    downloadWithFormat(videoURL, videoFormat, videoTitle);
})

ipcMain.on('selected-video', (event, videoURL) => {
    handleURL(videoURL);
})

async function handleURL(vidURL) {
    ytdl.getInfo(vidURL).then(info => {
        win.webContents.send('vidInfo', info);
    }).catch(function() {
        // console.log("Unable to retreive video info")
        // win.webContents.send('reject', 'Unable to retrieve video info');
        searchRequest(vidURL);
    })
}

async function searchRequest(request) {
    console.log('begin search')
    let filters = await ytsr.getFilters(request);
    let filter = filters.get('Type').get('Video');
    ytsr(filter.url, {limit: 21}).then(results => {
        console.log('searching')
        win.webContents.send('search-results', results);
    })
}

function downloadWithFormat(vidURL, vidFormat, vidTitle) {
    const tracker = {
        video: 0,
        audio: 0,
    };
    const video = ytdl(vidURL, {filter: 'videoonly', quality: vidFormat})
        .on('progress', (_, downloaded, total) => {
            let progress = Math.round(downloaded/total*100);
            if (progress != tracker.video) {
                tracker.video = progress;
                console.log('Video progress: ' + tracker.video + '%');
            }
        });
    const audio = ytdl(vidURL, {filter: 'audioonly', quality: 'highestaudio'})
        .on('progress', (_, downloaded, total) => {
            let progress = Math.round(downloaded/total*100);
            if (progress != tracker.audio) {
                tracker.audio = progress;
                console.log('Audio progress: ' + tracker.audio + '%');
            }
        });

    let tempPath = path.join(__dirname, 'downloads');
    
    video.pipe(fs.createWriteStream(path.join(tempPath, vidTitle+'.mp4')));
    audio.pipe(fs.createWriteStream(path.join(tempPath, vidTitle+'.mp3')));
    
    video.on('finish', function() {
        tracker.video = 101;
        if (tracker.audio == 101) {
            mergeFiles(
                path.join(tempPath, vidTitle+'.mp4'), 
                path.join(tempPath, vidTitle+'.mp3'), 
                path.join(tempPath, 'videos', vidTitle+'.mp4')
            );
        }
    });
    audio.on('finish', function() {
        tracker.audio = 101;
        if (tracker.video == 101) {
            mergeFiles(
                path.join(tempPath, vidTitle+'.mp4'), 
                path.join(tempPath, vidTitle+'.mp3'), 
                path.join(tempPath, 'videos', vidTitle+'.mp4')
            );
        }
    });

}

ipc.on('loadVideo', (event) => {
    var pathToVid = path.join(__dirname, 'downloads/videos');
    
    fs.readdir(pathToVid, function(err, files) {
        if (err) console.log(err);
        if (files[0]) {
            pathToVid = path.join(pathToVid, files[0]);
            event.reply('loadingVid', pathToVid);
        }
    })
})

function mergeFiles(vPath, aPath, oPath) {
    console.log('merging...')
    ffmpeg()
        .addInput(vPath)
        .addInput(aPath)
        .output(oPath)
        .on('end', function() {
            console.log('finished processing');
            fs.unlink(vPath, (err => {
                if (err) console.log(err);
            }));
            fs.unlink(aPath, (err => {
                if (err) console.log(err);
            }));
        })
        .run();
}