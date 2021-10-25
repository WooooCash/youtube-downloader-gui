const ipc = require('electron').ipcRenderer;

document.querySelector("#get-video-info-button").addEventListener("click", function() {
    ipc.send('videoURL', document.querySelector('#videoURL').value);
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
    console.log(results);
})

