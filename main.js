const fs = require('fs')
const { exec } = require('child_process')

const modName = 'My Custom Music'
const computerModName = modName.toLowerCase().replaceAll(' ', '-')
const audioFormats = ['m4a', 'flac', 'mp3', 'wma', 'ogg']

const basePath = './music'
const baseModOutPath = './mod'
const modOutPath = `${baseModOutPath}/${computerModName}`
const musicOutPath = `${modOutPath}/music`

fs.mkdirSync(musicOutPath, {recursive: true})

async function convertAllToOgg(path) {
    const contents = fs.readdirSync(path, {withFileTypes: true})
    const metadata = []
    for (const content of contents) {
        const { name } = content

        const filenameSplit = name.trim().split('.').filter((text) => text)
        const trackName = filenameSplit.slice(0, -1).join('.')
        const extension = filenameSplit.at(-1)
        if (audioFormats.includes(extension)) {
            const probeResult = await new Promise((resolve, reject) => {
                exec(`ffprobe "${path}/${name}" -of json -show_entries format -v quiet`, (err, res) => {
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
                    else resolve(trackName)
                })
            })
            metadata.push({
                name: probeResult,
                file: `${trackName}.ogg`,
                volume:  0.5
            })
            const oggName = `${musicOutPath}/${trackName}.ogg`
            if (fs.existsSync(oggName)) {
                console.log(`File "${oggName}" already exists, skipping conversion`)
                continue
            }
            await new Promise((resolve, reject) => {
                exec(`ffmpeg -i "${path}/${name}" -ar 44100 "${oggName}"`, (err, stdout, stderr) => {
                    if (err) {
                        console.error(`exec error: ${err}`)
                        reject(err)
                    }
                    process.stdout.write('.')
                    resolve()
                })
            })
        }

        if (content.isDirectory()) {
            const subConversions = await convertAllToOgg([path, name].join('/'))
            if (subConversions.length) metadata.push(...subConversions)
        }
    }
    return metadata
}

convertAllToOgg(basePath).then((res) => {
    console.log('Done converting')
    console.log(`Track count: ${res.length}`)
    const asset = res.reduce((accum, {name, file, volume}) => {
        return accum + `music = {
    name = "${name}"
    file = "${file}"
    volume = ${volume}
}

`}, '')

    const txt = res.reduce((accum, {name}) => {
        return accum + `song = {
    name = "${name}"
}

`}, '')

    fs.writeFileSync(`${musicOutPath}/${computerModName}.asset`, asset)
    fs.writeFileSync(`${musicOutPath}/${computerModName}.txt`, txt)

    const descriptor = `name="${modName}"`
    fs.writeFileSync(`${modOutPath}/descriptor.mod`, descriptor)

    const modFile = `name="${modName}"
path="mod/${computerModName}"`
    fs.writeFileSync(`${baseModOutPath}/${computerModName}.mod`, modFile)
})
