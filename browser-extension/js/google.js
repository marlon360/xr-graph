'use strict';

setTimeout(function () {

const header = document.getElementById("graph_heading");

if (header != null) {

    const fns = document.getElementsByClassName("scobfn");
    if (fns.length > 0) {
        const functionText = fns[0].innerText;

        let additionalParams = "";

        const tables = header.parentElement.getElementsByTagName("table");
        
        if (tables.length > 0) {
            const table = tables[0];
            const trs = table.getElementsByTagName("tr");
            for (let i = 1; i < trs.length; i++) {
                const varName = trs[i].getElementsByTagName("td")[0].innerText;
                const minVal = trs[i].getElementsByTagName("td")[1].innerText;
                const maxVal = trs[i].getElementsByTagName("td")[2].innerText;
                additionalParams += `&${varName}Min=${minVal}`;
                additionalParams += `&${varName}Max=${maxVal}`;
            }
        }
        const canvas = document.getElementsByTagName("canvas")[0];
        updateButton(canvas.parentElement, functionText, additionalParams);
    }
}

function updateButton(el, func, additionalParams) {

    if (func != "") {
        const encodedFunction = encodeURIComponent(func);        

        if (document.getElementById("vr-button") == null) {
            const anchor = document.createElement("a");
            anchor.id = "vr-button";
            anchor.href = "https://xr-graph.now.sh/?function=" + encodedFunction + additionalParams;
            anchor.target = "_blank";
            anchor.text = "View in VR";
            el.appendChild(anchor);
        } else {
            document.getElementById("vr-button").href = "https://xr-graph.now.sh/?function=" + encodedFunction + additionalParams;
        }

    }
}

}, 1000);