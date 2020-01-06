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

xParam = xParam.replace('a', aFactor);
xParam = xParam.replace('b', bFactor);

yParam = yParam.replace('a', aFactor);
yParam = yParam.replace('b', bFactor);

zParam = zParam.replace('a', aFactor);
zParam = zParam.replace('b', bFactor);

let link = "https://vr-graph.now.sh?func=";
if (tMin == null) {
    link += "[" + [xParam, yParam, zParam].join(', ') + "]"
} else {
    link += "[" + [xParam, yParam, zParam].join(', ') + "]"
}

let button = document.createElement("a");
button.innerText = "View in VR"
button.id = "vr-button"
button.href = link;
document.body.append(button);