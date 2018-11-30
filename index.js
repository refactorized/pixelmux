const ndarray = require('ndarray')
const fs = require('fs')
const getPixels = require('get-pixels')
const savePixels = require('save-pixels')
const ops = require('ndarray-ops')
const fft = require('ndarray-fft')
const lum = require('luminance')
const zeros = require('zeros')
const show = require('ndarray-show')
const pool = require('ndarray-scratch')
const blur = require('ndarray-gaussian-filter')
const normalize = require('ndarray-normalize')
const resample = require('ndarray-resample')

// take four channel image data and just get RGB as 64 bit floats
const rgb64 = src => {
  let shape = src.shape.slice()
  shape[2] = 3
  let rgb = pool.malloc(shape, 'float64')

  let rsrc = src.pick(null, null, 0)
  let gsrc = src.pick(null, null, 1)
  let bsrc = src.pick(null, null, 2)

  let r = rgb.pick(null, null, 0)
  let g = rgb.pick(null, null, 1)
  let b = rgb.pick(null, null, 2)

  ops.assign(r, rsrc)
  ops.assign(g, gsrc)
  ops.assign(b, bsrc)

  return rgb
}

// not actually pixelating
const pixelate = factor => nd => {
  let shape = nd.shape.slice()
  shape[0] = Math.floor(shape[0] / factor)
  shape[1] = Math.floor(shape[1] / factor)
  let temp = pool.malloc(shape, 'float64')
  resample(temp, nd)
  resample(nd, temp)
  pool.free(temp)
}

// todo: lots of fn in the shape of (**) => (nd) => {mutate}
const scale = (min, max) => arr => {
  let srcMin = ops.inf(arr)
  let srcMax = ops.sup(arr)
  let ratio = (max - min) / (srcMax - srcMin)
  let offset = min - srcMin
  ops.addseq(arr, offset)
  ops.mulseq(arr, ratio)
  let destMin = ops.inf(arr)
  let destMax = ops.sup(arr)
  console.log({ destMin, destMax })
}

const getPixelAsync = filepath => {
  return new Promise((resolve, reject) => {
    getPixels(filepath, (err, nd) => {
      if (err) {
        reject(err)
      }
      resolve(nd)
    })
  })
}

async function run() {
  let nativePixels = await getPixelAsync('testimg/ross.jpg')
  let w = nativePixels.shape[0]
  let h = nativePixels.shape[1]

  let npixels = rgb64(nativePixels)
  let ipixels = rgb64(nativePixels)

  // ipixels.data.reverse()

  let R = npixels.pick(null, null, 0)
  let G = npixels.pick(null, null, 1)
  let B = npixels.pick(null, null, 2)

  let Ri = ipixels.pick(null, null, 0)
  let Gi = ipixels.pick(null, null, 1)
  let Bi = ipixels.pick(null, null, 2)

  // todo: generalize into multichannel operations
  let nFn = fn => {
    fn(R)
    fn(G)
    fn(B)
  }
  let iFn = fn => {
    fn(Ri)
    fn(Gi)
    fn(Bi)
  }
  let niFn = fn => {
    fn(R, Ri)
    fn(G, Gi)
    fn(B, Bi)
  }
  let uFn = fn => {
    nFn(fn)
    iFn(fn)
  }

  niFn((n, i) => fft(1, n, i))
  niFn((n, i) => fft(-1, n, i))
  // uFn(scale(0, 255))

  let norm = fs.createWriteStream('working/rossn.png')
  let imag = fs.createWriteStream('working/rossi.png')

  savePixels(npixels, 'png').pipe(norm)
  savePixels(ipixels, 'png').pipe(imag)
}

run()
