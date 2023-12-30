const fs = require('fs')
const { exec } = require('child_process')

const defaultModName = 'My Custom Music'
const defaultVolume = 0.8
const musicPath = './music'
const outputPath = './mod'
const audioFormats = ['m4a', 'flac', 'mp3', 'wma', 'ogg']

async function convertTrack(filePath, outputFilePath) {
    return new Promise((resolve, reject) => {
        exec(`ffmpeg -i "${filePath}" -vn -ar 44100 "${outputFilePath}"`, (err) => {
            if (err) {
                console.error(`exec error: ${err}`)
                reject(err)
            }
            resolve()
        })
    })
}

async function getTrackName(filePath) {
    return new Promise((resolve, reject) => {
        exec(`ffprobe "${filePath}" -of json -show_entries format -v quiet`, (err, res) => {
            if (err) {
                console.error(`exec error: ${err}`)
                reject(err)
            }
            const { format } = JSON.parse(res)
            const { tags } = format
            const titles = Object.entries(tags).filter(([key, val]) => {
                if (key.toLowerCase() === 'title') return true
            })
            if (titles.length > 1) throw `Found more than one title? "${titles}"`
            if (titles.length === 1) resolve(titles[0][1])
            else resolve()
        })
    })
}

async function convertTracks(fileDirEnts, outputPath) {
    const metadata = []
    for (const fileDirEnt of fileDirEnts) {
        if (fileDirEnt.isDirectory()) continue

        const filenameSplit = fileDirEnt.name.trim().split('.').filter((text) => text)
        const fileName = filenameSplit.slice(0, -1).join('_')
        const extension = filenameSplit.at(-1)

        if (!audioFormats.includes(extension)) continue

        const pathToFile = `${fileDirEnt.parentPath}/${fileDirEnt.name}`
        const outputFilePath = `${outputPath}/music`
        fs.mkdirSync(outputFilePath, { recursive: true })

        const outputFileName = `${fileName}.ogg`
        const metadataTrackName = await getTrackName(pathToFile)
        metadata.push({
            name: metadataTrackName || fileName,
            file: outputFileName,
            volume: defaultVolume
        })
        if (fs.existsSync(`${outputFilePath}/${outputFileName}`)) {
            console.log(`File "${outputFilePath}/${outputFileName}" already exists, skipping conversion`)
            continue
        }
        await convertTrack(pathToFile, `${outputFilePath}/${outputFileName}`)

        process.stdout.write('.')
    }

    return metadata
}

async function convertFolder(folderDirEnt, outputPath, modName, modId) {
    const folderPath = `${folderDirEnt.parentPath}/${folderDirEnt.name}`
    const folderContents = fs.readdirSync(folderPath, { withFileTypes: true })
    const files = []
    const directories = []
    for (const folderContent of folderContents) {
        if (folderContent.isDirectory()) directories.push(folderContent)
        else files.push(folderContent)
    }

    const modPath = `${outputPath}/${modId}`

    const metadata = await convertTracks(files, modPath)

    for (const directory of directories) {
        const dirMeta = await convertFolder(directory, outputPath, modName, modId)
        metadata.push(...dirMeta)
    }

    return metadata
}

function createModFiles(metadata, modName, modId) {
    const asset = metadata.reduce((accum, { name, file, volume }) => {
        const sanitizedName = name.replaceAll('"', '')
        return accum + `music = {
    name = "${sanitizedName}"
    file = "${file}"
    volume = "${volume}"
}

`
    }, '')
    fs.writeFileSync(`${outputPath}/${modId}/music/${modId}.asset`, asset)

    const txt = metadata.reduce((accum, { name }) => {
        const sanitizedName = name.replaceAll('"', '')
        return accum + `song = {
    name = "${sanitizedName}"
}

`
    }, '')
    fs.writeFileSync(`${outputPath}/${modId}/music/${modId}.txt`, txt)

    const descriptor = `name="${modName}"`
    fs.writeFileSync(`${outputPath}/${modId}/descriptor.mod`, descriptor)

    const mod = `name="${modName}"
path="mod/${modId}"`
    fs.writeFileSync(`${outputPath}/${modId}.mod`, mod)
}

(async function() {
    const musicContents = fs.readdirSync(musicPath, { withFileTypes: true })

    const folders = musicContents.filter((content) => content.isDirectory())
    for (const folder of folders) {
        const modName = `${folder.name} Music`
        const modId = modName.toLowerCase().replaceAll(' ', '-')
        const folderMetadata = await convertFolder(folder, outputPath, modName, modId)
        if (folderMetadata && folderMetadata.length) createModFiles(folderMetadata, modName, modId)
    }

    const looseTracks = musicContents.filter((content) => !content.isDirectory())
    const defaultModId = defaultModName.toLowerCase().replaceAll(' ', '-')

    const trackMetadata = await convertTracks(looseTracks, `${outputPath}/${defaultModId}`)

    if (trackMetadata && trackMetadata.length) createModFiles(trackMetadata, defaultModName, defaultModId)
})()
