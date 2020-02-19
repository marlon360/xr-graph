'use strict';

if (document.getElementsByClassName("_3mX7MD-u").length > 0) {

    document.getElementsByClassName("_3mX7MD-u")[0].addEventListener('input', () => {
        console.log("input");
        
        updateButton()
    });
    document.getElementsByClassName("_3mX7MD-u")[0].addEventListener('blur', () => {
        updateButton()
    });
    document.getElementsByClassName("_3mX7MD-u")[0].addEventListener('submit', () => {
        updateButton()
    });
    updateButton();
}

function updateButton() {
    let funcInput = document.getElementsByClassName("_3mX7MD-u")[0].value;

    if (funcInput != "") {
        let container = document.getElementsByClassName("_2yyIar7m")[0];

        const encodedFunction = encodeURIComponent(funcInput);

        if (document.getElementById("vr-button") == null) {
            const anchor = document.createElement("a");
            anchor.id = "vr-button";
            anchor.href = "https://xr-graph.now.sh/?function=" + encodedFunction;
            anchor.target = "_blank";
            anchor.text = "View in VR";
            container.appendChild(anchor);
        } else {
            document.getElementById("vr-button").href = "https://xr-graph.now.sh/?function=" + encodedFunction;
        }

    }
}