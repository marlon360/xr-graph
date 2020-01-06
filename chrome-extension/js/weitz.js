'use strict';

function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
  }

let xParam = findGetParameter("xFunctionText");
let yParam = findGetParameter("yFunctionText");
let zParam = findGetParameter("zFunctionText");

const uMin = findGetParameter("umin");
const uMax = findGetParameter("umax");
const vMin = findGetParameter("vmin");
const vMax = findGetParameter("vmax");

const tMin = findGetParameter("tmin");
const tMax = findGetParameter("tmax");

const aFactor = findGetParameter("afactor");
const bFactor = findGetParameter("bfactor");

xParam = xParam.replace(/a/g, aFactor);
xParam = xParam.replace(/b/g, bFactor);

yParam = yParam.replace(/a/g, aFactor);
yParam = yParam.replace(/b/g, bFactor);

zParam = zParam.replace(/a/g, aFactor);
zParam = zParam.replace(/b/g, bFactor);

let link = "https://vr-graph.now.sh?func=";
if (tMin == null) {
    link += encodeURIComponent("[" + [xParam, yParam, zParam].join(', ') + "]")
    if (uMin != null) {
        link += "&xmin=" + uMin
    }
    if (uMax != null) {
        link += "&xmax=" + uMax
    }
    if (vMin != null) {
        link += "&zmin=" + vMin
    }
    if (vMax != null) {
        link += "&zmax=" + vMax
    }
} else {
    link += "[" + [xParam, yParam, zParam].join(', ') + "]"
    if (tMin != null) {
        link += "&tmin=" + tMin
    }
    if (tMax != null) {
        link += "&tmax=" + tMax
    }
}


let button = document.createElement("a");
button.innerText = "View in VR"
button.id = "vr-button"
button.href = link;
button.target = "_blank"
document.body.append(button);