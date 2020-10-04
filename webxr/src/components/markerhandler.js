AFRAME.registerComponent('markerhandler', {
    init: function () {
        this.el.sceneEl.addEventListener("markerFound", (e) => {
            document.body.classList.add("tracked");
        });
        this.el.sceneEl.addEventListener("markerLost", (e) => {
            document.body.classList.remove("tracked");
        });
    }
});