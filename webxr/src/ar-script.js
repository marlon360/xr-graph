require('aframe');
require('ar.js/aframe/build/aframe-ar');
require('./components/gestures');
require('./components/markerhandler');
require('./components/GraphComponent/Graph');

import './styles/vr.css';

document.addEventListener('DOMContentLoaded', () => {
    const markerEl = document.getElementById("marker");

    const markerUrl = require('./images/pattern-marker.patt').default
    markerEl.setAttribute('url', markerUrl)

    const markerLink = document.getElementById("marker-link");
    const markerLinkInapp = document.getElementById("marker-link-inapp");
    const markerImgURL = require("./images/marker.png").default;
    markerLink.setAttribute("href", markerImgURL);
    markerLinkInapp.setAttribute("href", markerImgURL);

    document.addEventListener('gesturestart', function (e) {
        e.preventDefault();
    });
}, false);