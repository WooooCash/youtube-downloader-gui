const { ipcMain } = require("electron");
const electron = require("electron");
const { getInfo } = require("ytdl-core");
const ipc = electron.ipcMain;

const ytdl = require("ytdl-core");
const ytsr = require("ytsr");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");

const axios = require("axios");

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let win;

app.on("ready", (_) => {
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
			contextIsolation: false
		}
	});
	win.loadFile("./src/search.html");
	win.webContents.openDevTools();
});

ipcMain.on("close-window", () => {
	win.close();
});

ipcMain.on("minimize-window", () => {
	win.minimize();
});

ipcMain.on("videoURL", (event, videoURL) => {
	handleURL(videoURL);
});

ipcMain.on(
	"videoFormat",
	(event, videoQuality, videoURL, videoTitle, format) => {
		console.log("format: " + format);
		if (format == "video")
			downloadWithFormat(videoURL, videoQuality, videoTitle);
		else if (format == "audio") downloadAudio(videoURL, videoTitle);
		else
			console.log(
				"invalid video format passed from video options (check source)"
			);
	}
);

ipcMain.on("selected-video", (event, videoURL) => {
	handleURL(videoURL);
});

async function handleURL(vidURL) {
	console.log("in handle url");
	// win.loadFile("./src/video_options.html");
	ytdl.getInfo(vidURL)
		.then((info) => {
			console.log("sent info");
			console.log("hi");
			win.webContents.send("vidInfo", info);
		})
		.catch(function () {
			// console.log("Unable to retreive video info")
			// win.webContents.send('reject', 'Unable to retrieve video info');
			win.loadFile("./src/search_results.html");
			console.log("loaded and ready to search");
			searchRequest(vidURL);
		});
}

async function searchRequest(request) {
	console.log("begin search");
	let filters = await ytsr.getFilters(request);
	let filter = filters.get("Type").get("Video");
	console.log("set filters. beginning search.");
	let results = await ytsr(filter.url, { limit: 21 });
	console.log("retreived results");
	win.webContents.send("search-results", results);
	// .catch((err) => {
	// 	console.log("unable to finish search: " + err);
	// });
}

function downloadWithFormat(vidURL, vidFormat, vidTitle) {
	console.log("url: " + vidURL);
	console.log("format: " + vidFormat);
	console.log("title: " + vidTitle);
	const tracker = {
		video: 0,
		audio: 0
	};
	const video = ytdl(vidURL, { filter: "videoonly", quality: vidFormat })
		.on("progress", (_, downloaded, total) => {
			let progress = Math.round((downloaded / total) * 100);
			if (progress != tracker.video) {
				tracker.video = progress;
				console.log("Video progress: " + tracker.video + "%");
			}
		})
		.on("error", (err) => {
			console.log("Download Failed in video.");
			console.log(err);
		});
	const audio = ytdl(vidURL, {
		filter: "audioonly",
		quality: "highestaudio"
	})
		.on("progress", (_, downloaded, total) => {
			let progress = Math.round((downloaded / total) * 100);
			if (progress != tracker.audio) {
				tracker.audio = progress;
				console.log("Audio progress: " + tracker.audio + "%");
			}
		})
		.on("error", (err) => {
			console.log("Download Failed in audio.");
			console.log(err);
		});

	let tempPath = path.join(__dirname, "downloads");

	video.pipe(fs.createWriteStream(path.join(tempPath, vidTitle + ".mp4")));
	audio.pipe(fs.createWriteStream(path.join(tempPath, vidTitle + ".mp3")));

	video.on("finish", function () {
		tracker.video = 101;
		if (tracker.audio == 101) {
			mergeFiles(
				path.join(tempPath, vidTitle + ".mp4"),
				path.join(tempPath, vidTitle + ".mp3"),
				path.join(tempPath, "videos", vidTitle + ".mp4")
			);
		}
	});
	audio.on("finish", function () {
		tracker.audio = 101;
		if (tracker.video == 101) {
			mergeFiles(
				path.join(tempPath, vidTitle + ".mp4"),
				path.join(tempPath, vidTitle + ".mp3"),
				path.join(tempPath, "videos", vidTitle + ".mp4")
			);
		}
	});
}

function downloadAudio(url, title) {
	console.log("downloading audio");
	tracker = 0;
	const audio = ytdl(url, {
		filter: "audioonly",
		quality: "highestaudio"
	})
		.on("progress", (_, downloaded, total) => {
			let progress = Math.round((downloaded / total) * 100);
			if (progress != tracker) {
				tracker = progress;
				console.log("Audio progress: " + tracker + "%");
			}
		})
		.on("error", (err) => {
			console.log("Download Failed in audio.");
			console.log(err);
		});

	let tempPath = path.join(__dirname, "downloads", "audio");

	audio.pipe(fs.createWriteStream(path.join(tempPath, title + ".mp3")));
	audio.on("finish", function () {
		//communicate that download is finished
		console.log("done");
	});
}

ipc.on("loadVideo", (event) => {
	var pathToVid = path.join(__dirname, "downloads/videos");

	fs.readdir(pathToVid, function (err, files) {
		if (err) console.log(err);
		if (files[0]) {
			pathToVid = path.join(pathToVid, files[0]);
			event.reply("loadingVid", pathToVid);
		}
	});
});

function mergeFiles(vPath, aPath, oPath) {
	console.log("merging...");
	ffmpeg()
		.addInput(vPath)
		.addInput(aPath)
		.output(oPath)
		.on("end", function () {
			console.log("finished processing");
			fs.unlink(vPath, (err) => {
				if (err) console.log(err);
			});
			fs.unlink(aPath, (err) => {
				if (err) console.log(err);
			});
		})
		.run();
}
