const { ipcMain } = require("electron");
const electron = require("electron");
const { getInfo } = require("ytdl-core");
const ipc = electron.ipcMain;

const ytdl = require("ytdl-core");
const ytsr = require("ytsr");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const duration = require("get-video-duration").getVideoDurationInSeconds;
const format_seconds = require("format-duration");

const axios = require("axios");

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let win;

app.on("ready", (_) => {
	win = new BrowserWindow({
		width: 1470,
		height: 810,
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
	win.loadFile("./src/index2.html");
	// win.webContents.openDevTools();
	win.webContents.send("app-start");
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

ipc.on("load-files", (event, dir) => {
	loadFilesFromDir(dir);
});

async function handleURL(vidURL) {
	console.log("in handle url");
	ytdl.getInfo(vidURL)
		.then((info) => {
			console.log("hi");
			console.log(info);
			win.webContents.send("vidInfo", info);
			console.log("sent info");
		})
		.catch(function () {
			// console.log("Unable to retreive video info")
			// win.webContents.send('reject', 'Unable to retrieve video info');
			// win.loadFile("./src/search_results.html");
			console.log("loaded and ready to search");
			searchRequest(vidURL);
		});
}

async function searchRequest(request) {
	console.log("begin search");
	let filters = await ytsr.getFilters(request);
	let filter = filters.get("Type").get("Video");
	console.log("set filters. beginning search.");
	// ytsr(filter.url, { limit: 21 }).then((results) => {
	// 	console.log(results);
	// 	console.log("search finished");
	// 	win.webContents.send("search-results", results);
	// });

	const results = await ytsr(filter.url, { pages: 1 });
	console.log("done searching!");
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
				win.webContents.send("update-progress", tracker.video, "video");
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
				win.webContents.send("update-progress", tracker.audio, "audio");
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
				win.webContents.send("update-progress", tracker, "audio");
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
		win.webContents.send("finished-download");
		console.log("done");
	});
}

async function loadFilesFromDir(dir) {
	let f_path = path.join(__dirname, "downloads", dir);
	console.log("Retreiving files from " + f_path);
	let files = fs.readdirSync(f_path);
	files.splice(files.indexOf(".gitkeep"), 1);
	console.log("files: ");
	console.log(files);
	let dir_info = [];
	for (const file of files) {
		console.log("checking out " + file);
		const dur = await duration(path.join(f_path, file));
		let file_duration = format_seconds(dur * 1000);
		dir_info.push({
			name: file.substring(0, file.length - 4),
			duration: file_duration,
			// path: f_path + "/" + file
			path: `../downloads/${dir}/${file}`
		});
	}
	win.webContents.send("dir-info", dir_info);
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
	win.webContents.send("merging");
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
			win.webContents.send("finished-download");
		})
		.run();
}
