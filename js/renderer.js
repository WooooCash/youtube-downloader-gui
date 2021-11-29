const ipc = require('electron').ipcRenderer;

document.querySelector("#get-video-info-button").addEventListener("click", function() {
    ipc.send('videoURL', document.querySelector('#videoURL').value);
    document.querySelector("#search").hidden = true;
    document.querySelector("#videodata").hidden = false;
})

document.querySelector('#download-button').addEventListener("click", function() {
    ipc.send('videoFormat', document.querySelector('#download-options').value, 
        document.querySelector('#video-url').value, 
        document.querySelector(".video-data .info h2").innerText
    )
})

document.querySelector('#load-video-button').addEventListener('click', function() {
    ipc.send('loadVideo');
})

document.querySelector('#closeBtn').addEventListener('click', function() {
    ipc.send('close-window');
})

document.querySelector('#minimizeBtn').addEventListener('click', function() {
    ipc.send('minimize-window');
})

ipc.on('loadingVid', (event, path) => {
    document.querySelector('.video-player .video').innerHTML = '<video controls><source src="' + path + '" type="video/mp4"></video>'
})

ipc.on('vidInfo', (event, info) => {
    document.querySelector(".video-data .thumbnail img").src = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url
    document.querySelector(".video-data .info h2").innerText = info.videoDetails.title.replaceAll('/', ' - ');
    // document.querySelector(".video-data .info p").innerText = info.videoDetails.description;
    document.querySelector(".video-data .controls #video-url").value = info.videoDetails.video_url;

    let options = "";
    console.log(info)
    for(let i = 0; i < info.formats.length; i++) {
        let format = info.formats[i];
        if (format.container != 'mp4') continue;
        console.log(format.itag);
        if (![134, 135, 298, 299].includes(format.itag)) continue;
        options += `
            <option value="${format.itag}">
                ${format.container} - ${format.qualityLabel}
            </option>
        `;
    }
    document.querySelector(".video-data .controls #download-options").innerHTML = options;

})

ipc.on('reject', (event, message) => {
    alert(message);
})

ipc.on('dinfo', (event, info) => {
    console.log(info);
})



ipc.on('search-results', (event, results) => {
    function gotoVideoOptions(videoElement) {
        console.log("test w stringu");
        console.log(videoElement);
    }
    document.querySelector("#search").hidden = true;
    document.querySelector("#videodata").hidden = true;
    results1 = results;
    console.log(results.items);
    let search_html = document.querySelector(".search-results");
    search_html.hidden = false;
    results.items.forEach(element => {
        console.log("halo");
        search_html.insertAdjacentHTML(
            "beforeend",
            
            `<div class="card" style="width: 18rem; margin: 5px 0 5px 0 !important; background-color: white !important;">
                <img class="card-img-top" src="${element.bestThumbnail.url}" alt="Card image cap">
                <h5 class="card-title">${element.title}</h5>
                <h6 class="card-subtitle mb-2 text-muted">${element.author.name}</h6>
                <div class="card-body">
                    <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                </div>
            </div>
            `
            
        )
        
    })
    
})

document.querySelector(".card").addEventListener("click", function() {
    ipc.send('videoURL', document.querySelector('#videoURL').value);
    document.querySelector("#search").hidden = true;
    document.querySelector("#videodata").hidden = false;
})

// document.querySelectorAll(".card").onclick = function() {
//     console.log('halo');
// }

