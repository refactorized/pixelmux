var fs = require("fs");
var getPixels = require("get-pixels")
var savePixels = require("save-pixels")

getPixels("working/ross.jpg", function(err, pixels) {
  if(err) {
    console.log("Bad image path")
    return
  }
  debugger;
  console.log("got pixels", pixels.shape.slice())
  var myFile = fs.createWriteStream("working/ross.png")
  savePixels(pixels, "png").pipe(myFile);
})
