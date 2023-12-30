# Stellaris Music Mod Maker

A simple javascript project to automate music mod creation for Stellaris

## Requirements

- Node JS
- FFmpeg

## Usage

1. Copy your music into the "music" folder. The structure isn't important, the script will crawl all subdirectories
2. Optionally update "main.js" with the name of your mod, and add any audio formats missing from the list
3. Run the script
```bash
$ node main.js
```
4. Copy the contents of the "mod" directory to the Stellaris mod directory (refer to [the wiki](https://stellaris.paradoxwikis.com/Modding#Mod_folder_location))
