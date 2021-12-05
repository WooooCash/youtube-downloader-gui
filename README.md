# Youtube Downloader GUI

## Description

This is a youtube downloader app with a graphical interface. Download youtube videos in either mp3 or mp4 format to a local library.

## Install

### Download ffmpeg

**Linux**:

download ffmpeg from your distribution's package manager

apt manager example:
```
sudo apt-get install ffmpeg
```

**Windows**:

Download ffmpeg binaries from https://www.gyan.dev/ffmpeg/builds/ (I recommend *ffmpeg-release-essentials* in zip or 7z format)

Extract files to desired location

Add the *bin* folder to Path in your system environment variables


### Download the Project

Clone the project

```
git clone https://github.com/WooooCash/youtube-downloader-gui
```

Install dependencies

```
cd youtube-downloader-gui
```
```
npm install
```

## Running the app

To start the app use
```
npm start
```

## Additional info

Downloaded videos can be found in **./downloads/videos** and audio files can be found in **./downloads/audio/**



