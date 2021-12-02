const ipc = require("electron").ipcRenderer;

// document
// 	.querySelector("#download-button")
// 	.addEventListener("click", function () {
// 		ipc.send(
// 			"videoFormat",
// 			document.querySelector("#download-options").value,
// 			document.querySelector("#video-url").value,
// 			document.querySelector(".video-data .info h2").innerText
// 		);
// 	});

ipc.on("vidInfo", (event, info) => {
	console.log("on vidInfo");
	// document.querySelector(".video-data .thumbnail img").src =
	// 	info.videoDetails.thumbnails[
	// 		info.videoDetails.thumbnails.length - 1
	// 	].url;
	// document.querySelector(".video-data .info h2").innerText =
	// 	info.videoDetails.title.replaceAll("/", " - ");
	// document.querySelector(".video-data .info p").innerText = info.videoDetails.description;
	// document.querySelector(".video-data .controls #video-url").value =
	// 	info.videoDetails.video_url;

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
	// document.querySelector(
	// 	".video-data .controls #download-options"
	// ).innerHTML = options;

	let video = document.querySelector(".video-data");
	video.innerHTML = `
		<div class="h-100 row justify-content-center">
			<div class="col-8 align-self-center">
				<div class="data">
					<div class="thumbnail">
						<img src="${
							info.videoDetails.thumbnails[
								info.videoDetails.thumbnails.length - 1
							].url
						}"/>
					</div>
					<hr />
					<div class="info">
						<h2>${info.videoDetails.title.replaceAll("/", " - ")}</h2>
						<h4>${info.videoDetails.author.name}</h3>
					</div>
				</div>
				<hr />
				<div class="controls">
					<input type="hidden" id="video-url" value="${info.videoDetails.video_url}"/>
					<div class ="input-group">
						<select class="form-select "name="" id="download-options">${options}</select>
						<button class="btn btn-outline-secondary"  type="button" onclick="send_video_options('video')">Download Video</button>
						<button class="btn btn-outline-secondary"  type="button" onclick="send_video_options('audio')">Download Audio</button>
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
}

ipc.on("reject", (event, message) => {
	alert(message);
});

ipc.on("dinfo", (event, info) => {
	console.log(info);
});
