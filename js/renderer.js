const ipc = require("electron").ipcRenderer;
const format_seconds = require("format-duration");

let container = document.querySelector("#content-container");

window.onload = setDashboardPage();

function clearPage(word) {
	container.innerHTML = `
		<div class="row h-100 justify-content-center">
			<div class="col-4 align-self-center">
				<h3>${word}</h3>
			</div>
		</div>
		`;
}

function setSearchPage() {
	console.log("setting search page");
	container.innerHTML = `
		<div
			id="search"
			class="h-100 row justify-content-center"
		>
			<div class="col-8 align-self-center">
				<div class="header" style="text-align: center">
		<!--	<h2>Youtube Video Search and Download</h2> -->
				</div>
				<div class="input-group">
					<input
						type="text"
						class="form-control"
						id="videoURL"
						placeholder="Enter youtube url or search query"
						style="padding: 12px 20px"
					/>
					<button
						class="btn btn-outline-secondary"
						id="get-video-info-button"
					>
						Search
					</button>
				</div>
			</div>
		</div>
	`;
	document
		.querySelector("#get-video-info-button")
		.addEventListener("click", function () {
			ipc.send("videoURL", document.querySelector("#videoURL").value);
			clearPage("Loading...");
		});
}

function setResultsPage() {
	container.innerHTML = `<div class="search-results"></div>`;
}

function setVidOptionsPage() {
	container.innerHTML = `
					<div id="videodata" class="video-data w-100">
						<h2>Loading...</h2>
					</div>`;
}

function setProgressPageAudio() {
	container.innerHTML = `
		<div class="h-100 row justify-content-center">
			<div class="col-8 align-self-center">
				<span>Audio</span>
				<div class="progress w-80 pbar">
					<div class="progress-bar pbar-inner" id="download-progress-audio"
						role="progressbar"
						style="width: 0%"
						aria-valuenow="0"
						aria-valuemin="0"
						aria-valuemax="100"
					>
					</div>
				</div>
			</div>
		</div>
	`;
}

function setProgressPageVideo() {
	container.innerHTML = `
		<div class="h-100 row justify-content-center">
			<div class="col-8 align-self-center">
				<span>Audio</span>
				<div class="progress w-80 pbar">
					<div class="progress-bar pbar-inner" id="download-progress-audio"
						role="progressbar"
						style="width: 0%"
						aria-valuenow="0"
						aria-valuemin="0"
						aria-valuemax="100"
					>
					</div>
				</div>
				<br />
				<span>Video</span>
				<div class="progress w-80 pbar">
					<div class="progress-bar pbar-inner" id="download-progress-video"
						role="progressbar"
						style="width: 0%"
						aria-valuenow="0"
						aria-valuemin="0"
						aria-valuemax="100"
					>
					</div>
				</div>
			</div>
		</div>
	`;
}

function setDashboardPage() {
	container.innerHTML = `
		<div class="row text-center h-25 justify-content-center">
			<div id="title-border" class="col-md-8 d-flex align-items-center justify-content-center">
				<h1>YOUTUBE DOWNLOADER</h1>
			</div>
		</div>
		<div class="row text-center h-50 justify-content-center">
			<div class="col-md-4 text-center my-auto">
				<div class="card card-block d-flex choice-card" >
					<div class="card-body align-items-center d-flex justify-content-center"
		                 onclick="setSearchPage()">
						<h3>Search</h3>
					</div>
				</div>
			</div>
			<div class="col-md-4 text-center my-auto">
				<div class="card card-block d-flex choice-card" >
					<div class="card-body align-items-center d-flex justify-content-center" 
						 onclick="setBrowsePage()">
						<h3>Browse</h3>
					</div>
				</div>
			</div>
		</div>
	`;
}

function setBrowsePage() {}

// document
// 	.querySelector("#load-video-button")
// 	.addEventListener("click", function () {
// 		ipc.send("loadVideo");
// 	});

ipc.on("merging", () => {
	clearPage("Merging Files...");
});

ipc.on("test", (event, str) => {
	console.log("test: " + str);
});

ipc.on("loadingVid", (event, path) => {
	document.querySelector(".video-player .video").innerHTML =
		'<video controls><source src="' + path + '" type="video/mp4"></video>';
});

ipc.on("vidInfo", (event, info) => {
	console.log("obtained vid info");
	setVidOptionsPage();

	let options = "";
	console.log(info);
	for (let i = 0; i < info.formats.length; i++) {
		let format = info.formats[i];
		if (format.container != "mp4") continue;
		console.log(format.itag);
		if (![134, 135, 298, 299].includes(format.itag)) continue;
		options += `
            <option value="${format.itag}">
                ${format.container} - ${format.qualityLabel}
            </option>
        `;
	}

	console.log(info.videoDetails.lengthSeconds);
	let video = document.querySelector(".video-data");
	video.innerHTML = `
		<div class="h-100 row justify-content-center">
			<div class="col-8 align-self-center">
				<div class="data">
					<div class="thumbnail">
						<img class="img-thumbnail"
							src="${
								info.videoDetails.thumbnails[
									info.videoDetails.thumbnails.length - 1
								].url
							}"
						/>
					</div>
					<hr />
					<div class="info">
						<h2>${info.videoDetails.title.replaceAll("/", " - ")}</h2>
						<h4>${info.videoDetails.author.name}</h4>
						<h5>Duration: ${format_seconds(
							parseInt(info.videoDetails.lengthSeconds) * 1000
						)}</h5>
					</div>
				</div>
				<hr />
				<div class="controls">
					<input
						type="hidden"
						id="video-url"
						value="${info.videoDetails.video_url}"
					/>
					<div class="input-group">
						<select class="form-select" name="" id="download-options">
							${options}
						</select>
						<button
							class="btn btn-outline-secondary"
							type="button"
							style="border-color: #949aa7;"
							onclick="send_video_options('video')"
						>
							Download Video
						</button>
					</div>
					<div class="input-group">
						<input type="text" id="dinput" class="form-control" placeholder="mp3" disabled>
						<button
							class="btn btn-outline-secondary"
							type="button"
							onclick="send_video_options('audio')"
							style="margin-top: 5px; border-color: #949aa7;"
						>
							Download Audio
						</button>
					</div>
				</div>
			</div>
		</div>
		`;
});

function send_video_options(format) {
	ipc.send(
		"videoFormat",
		document.querySelector("#download-options").value,
		document.querySelector("#video-url").value,
		document.querySelector(".video-data .info h2").innerText,
		format
	);
	if (format == "audio") setProgressPageAudio();
	else if (format == "video") setProgressPageVideo();
}

ipc.on("update-progress", (event, newVal, barname) => {
	document.getElementById("download-progress-" + barname).style.width =
		newVal + "%";
});

ipc.on("reject", (event, message) => {
	alert(message);
});

ipc.on("dinfo", (event, info) => {
	console.log(info);
});

ipc.on("search-results", (event, results) => {
	console.log(results);
	setResultsPage();

	console.log(results.items);
	let search_html = document.querySelector(".search-results");
	// search_html.hidden = false;
	results.items.forEach((element) => {
		search_html.insertAdjacentHTML(
			"beforeend",
			`
			<div
				class="card text-center"
				onclick="gotoVideoOptions('${element.url}')"
			>
				<img
					class="card-img-top"
					src="${element.bestThumbnail.url}"
					alt="Card image cap"
				/>
				<h5 class="card-title">${element.title}</h5>
				<h6 class="card-subtitle mb-2 text-muted">${element.author.name}</h6>
			</div>
            `
		);
	});
});

function gotoVideoOptions(videoUrl) {
	console.log("test w stringu");
	console.log(videoUrl);
	ipc.send("selected-video", videoUrl);
	clearPage("Loading...");
}
