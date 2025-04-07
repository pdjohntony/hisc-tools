const fs = require('fs')
const path = require('path')

const pkg = require('../src-tauri/tauri.conf.json')
const version = pkg.version

const peName = `hisc-tools.exe`
const msiName = `hisc-tools_${version}_x64_en-US.msi`

const updateUrl = `https://github.com/pdjohntony/hisc-tools/releases/download/v${version}/${msiName}`

const pubDate = new Date().toISOString()

const peFilePath = path.join(__dirname, '../src-tauri/target/release', peName)

const msiFilePath = path.join(__dirname, '../src-tauri/target/release/bundle/msi', msiName)

const signatureFilePath = path.join(
  __dirname,
  '../src-tauri/target/release/bundle/msi',
  `${msiName}.sig`
)

const signature = fs.readFileSync(signatureFilePath, 'utf8').trim()

const latestJson = {
  version: version,
  notes: 'See the assets to download this version and install.',
  pub_date: pubDate,
  platforms: {
    'windows-x86_64': {
      signature,
      url: updateUrl
    }
  }
}

const outputDir = path.join(__dirname, '../dist')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const outputPath = path.join(outputDir, 'latest.json')
fs.writeFileSync(outputPath, JSON.stringify(latestJson, null, 2))

console.log(`latest.json created at ${outputPath}`)

// Copy pe, msi, and sig files to the output directory
const filesToCopy = [peFilePath, msiFilePath, signatureFilePath]
filesToCopy.forEach((filePath) => {
  const fileName = path.basename(filePath)
  const destPath = path.join(outputDir, fileName)
  fs.copyFileSync(filePath, destPath)
  console.log(`Copied ${fileName} to ${outputDir}`)
})
