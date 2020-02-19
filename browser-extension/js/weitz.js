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

let functionText = findGetParameter("functionText");

const uMin = findGetParameter("umin");
const uMax = findGetParameter("umax");
const vMin = findGetParameter("vmin");
const vMax = findGetParameter("vmax");

const xMin = findGetParameter("xmin");
const xMax = findGetParameter("xmax");
const yMin = findGetParameter("ymin");
const yMax = findGetParameter("ymax");

const tMin = findGetParameter("tmin");
const tMax = findGetParameter("tmax");

const aFactor = findGetParameter("afactor");
const aMin = findGetParameter("amin");
const aMax = findGetParameter("amax");
const bFactor = findGetParameter("bfactor");
const bMin = findGetParameter("bmin");
const bMax = findGetParameter("bmax");


let functionParams = []
if (xParam != null) {
    functionParams.push(xParam);
}
if(yParam != null) {
    functionParams.push(yParam);
}
if (zParam) {
    functionParams.push(zParam);
}

let link = "https://xr-graph.now.sh/?function=";
if (tMin == null) {
    if (functionParams.length > 0) {
        link += "[" + functionParams.join(', ') + "]"
    } else {
        link += functionText;
    }
    if (uMin != null) {
        link += "&uMin=" + uMin
    }
    if (uMax != null) {
        link += "&uMax=" + uMax
    }
    if (vMin != null) {
        link += "&vMin=" + vMin
    }
    if (vMax != null) {
        link += "&vMax=" + vMax
    }
    if (xMin != null) {
        link += "&xMin=" + xMin
    }
    if (xMax != null) {
        link += "&xMax=" + xMax
    }
    if (yMin != null) {
        link += "&yMin=" + yMin
    }
    if (yMax != null) {
        link += "&yMax=" + yMax
    }
} else {
    link += "[" + functionParams.join(', ') + "]"
    if (tMin != null) {
        link += "&tMin=" + tMin
    }
    if (tMax != null) {
        link += "&tMax=" + tMax
    }
}
if (aMin != null) {
    link += "&aMin=" + aMin;
}
if (aMax != null) {
    link += "&aMax=" + aMax;
}
parseFloat()
if (aFactor != null) {
    link += "&a=" + (parseFloat(aMin) + parseFloat(aFactor) * (parseFloat(aMax) - parseFloat(aMin)));
}
if (bMin != null) {
    link += "&bMin=" + bMin;
}
if (bMax != null) {
    link += "&bMax=" + bMax;
}
if (bFactor != null) {
    link += "&b=" + (parseFloat(bMin) + parseFloat(bFactor) * (parseFloat(bMax) - parseFloat(bMin)));
}


let button = document.createElement("a");
button.innerText = "View in VR"
button.id = "vr-button"
button.href = link;
button.target = "_blank"
document.body.append(button);