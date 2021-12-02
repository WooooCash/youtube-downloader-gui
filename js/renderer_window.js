document.querySelector("#closeBtn").addEventListener("click", function () {
	ipc.send("close-window");
});

document.querySelector("#minimizeBtn").addEventListener("click", function () {
	ipc.send("minimize-window");
});

document
	.querySelector("#dashboard_link")
	.addEventListener("click", function () {
		console.log("dashboard :)");
	});

document.querySelector("#search_link").addEventListener("click", function () {
	location.replace("../src/search.html");
});

document.querySelector("#browse_link").addEventListener("click", function () {
	console.log("browse :)");
});
