const ipc = require("electron").ipcRenderer;

ipc.on("search-results", (event, results) => {
	results1 = results;
	console.log(results.items);
	let search_html = document.querySelector(".search-results");
	// search_html.hidden = false;
	results.items.forEach((element) => {
		search_html.insertAdjacentHTML(
			"beforeend",
			`<div class="card" style="width: 18rem; margin: 5px 0 5px 0 !important; background-color: white !important;" onclick="gotoVideoOptions('${element.url}')">
                <img class="card-img-top" src="${element.bestThumbnail.url}" alt="Card image cap">
                <h5 class="card-title">${element.title}</h5>
                <h6 class="card-subtitle mb-2 text-muted">${element.author.name}</h6>
                <div class="card-body">
                    <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                </div>
            </div>
            `
		);
	});
});

function gotoVideoOptions(videoUrl) {
	console.log("test w stringu");
	console.log(videoUrl);
	// window.location.replace("../src/video_options.html");
	ipc.send("selected-video", videoUrl);
	//goto video options html
}
