require('aframe');
require('ar.js/aframe/build/aframe-ar')
require('./components/GraphComponent/Graph');



document.addEventListener('DOMContentLoaded', () => {
    const markerEl = document.getElementById("marker");

    const markerUrl = require('./images/pattern-marker.patt').default
    markerEl.setAttribute('url', markerUrl)
}, false);