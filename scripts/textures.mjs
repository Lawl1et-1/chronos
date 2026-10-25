// Converts the source earth textures into compressed webp files in public/textures.
import sharp from 'sharp'

const src = 'node_modules/three-globe/example/'
const jobs = [
  ['img/earth-blue-marble.jpg', 'earth-day', 85],
  ['img/earth-night.jpg', 'earth-night', 85],
  ['img/earth-water.png', 'earth-water', 80],
  ['clouds/clouds.png', 'clouds', 80, 2048],
]

for (const [file, name, quality, size] of jobs) {
  // clouds keep their coverage in the alpha channel — store it as greyscale
  const base = () => (size ? sharp(src + file).extractChannel('alpha') : sharp(src + file))
  let img = base()
  if (size) img = img.resize(size, size / 2)
  const { width, height } = await img.metadata()
  await img.webp({ quality }).toFile(`public/textures/${name}.webp`)
  // low-res variant for progressive loading
  await base().resize(1024, 512).webp({ quality: 70 }).toFile(`public/textures/${name}-lo.webp`)
  console.log(name, width, height)
}
