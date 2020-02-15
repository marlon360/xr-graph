import { MeshText2D, textAlign } from 'three-text2d'

AFRAME.registerComponent('my-text', {
    schema: {
        text: { type: 'string', default: "Hello World!" },
        color: { type: 'color', default: "#fff" },
      },
    init: function() {
        const group = new THREE.Group();
        this.titleText = new MeshText2D(this.data.text, { align: textAlign.center,  font: '64px Arial', fillStyle: this.data.color , antialias: true, shadowColor: '#333', shadowBlur: 10, shadowOffsetY: 4 });
        this.titleText.scale.set(0.001,0.001,0.001);
        group.add(this.titleText);
        this.el.setObject3D('mesh',group);
    },
    update: function() {
        this.titleText.text = this.data.text;
    }
});