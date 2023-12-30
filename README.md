# Stellaris Music Mod Maker

A simple javascript project to automate music mod creation for Stellaris

Music in Stellaris must use the ogg format, and are recommended to use a sample rate of 44.1 kHz

## Requirements

* Node JS
* FFmpeg

## Usage

1. Copy your music into the "music" folder. Tracks put directly in the folder will go into a mod called "My Custom Music". Any sub-folders will be put into separate mods
``` bash
music/Keygen Church # will create a mod called "Keygen Church Music" with id "keygen-church-music"
music/Keygen Church/█ ▓ # will be included in the mod "Keygen Church"
music/Going Under # will create a mod called "Going Under Music" with id "going-under-music"
music/my-song.mp3 # will be put into a mod called "My Custom Music" with id "my-custom-music"
```
2. Run the script
```bash
$ node main.js
```
3. Copy the contents of the "mod" directory to the Stellaris mod directory (refer to [the wiki](https://stellaris.paradoxwikis.com/Modding#Mod_folder_location))

Currently attempts to convert the following file types:

* m4a
* flac
* mp3
* wma
* ogg
