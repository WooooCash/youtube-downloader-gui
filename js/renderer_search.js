const ipc = require("electron").ipcRenderer;

document
	.querySelector("#get-video-info-button")
	.addEventListener("click", function () {
		ipc.send("videoURL", document.querySelector("#videoURL").value);
	});
