/**
 * Variables
 */
var svgexport = require('svgexport');
var i, datafile;

/**
 * Icons
 */
var iconSizes = [16, 19, 32, 38, 48, 128];
var quality = '1%';

datafile = [];

for (i = 0; i < iconSizes.length; i++) {
  datafile.push({
    "input": [__dirname + '/icon.svg'],
    "output": [__dirname + '/icon-' + iconSizes[i] + '.png png ' + quality + ' ' + iconSizes[i] + ':']
  });
}

svgexport.render(datafile, function () {
  console.log('Icons exported');
});
