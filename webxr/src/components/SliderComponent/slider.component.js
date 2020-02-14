
import { MeshText2D, textAlign } from 'three-text2d'

AFRAME.registerComponent('my-slider', {
    schema: {
        color: { type: 'color', default: '#aaa' },
        knobColor: { type: 'color', default: '#fff' },
        size: { type: 'number', default: 0.5 },
        min: { type: 'number', default: -6 },
        max: { type: 'number', default: -4 },
        value: { type: 'number', default: -5 },
        innerSize: { type: 'number', default: 0.8 },
        title: { type: 'string', default: "My Slider" },
        precision: { type: 'number', default: 2 }
      },
    
      multiple: true,
    
      init: function () {
        var loader = new THREE.GLTFLoader();

        var leverMaterial = new THREE.MeshBasicMaterial({color: this.data.color });
        this.knobMaterial = new THREE.MeshLambertMaterial({color: this.data.knobColor });
        this.knobGrabbedMaterial = new THREE.MeshLambertMaterial({color: 0x7cc7ed, emissive:0x46b1ff });
        var chassisMaterial = new THREE.MeshBasicMaterial({color: 0x000000, transparent: true, opacity: 0, side: THREE.DoubleSide });

        let radius = (this.data.size / 5 / 2) * this.data.innerSize;
        // var lever = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.01, 50), this.knobMaterial);
        var lever = new THREE.Group();
        lever.rotateY(Math.PI/2);
        var track = new THREE.Mesh(new THREE.CylinderGeometry(0.005,0.005, this.data.size, 12), leverMaterial);
        track.rotateZ(Math.PI / 2);
        var chassis = new THREE.Group();
    
        this.lever = lever;
        chassis.add(track);
        chassis.add(lever);

        this.el.setObject3D('mesh', chassis);
    
        this.controllers = Array.prototype.slice.call(document.querySelectorAll('a-entity[hand-controls]'));

        this.setValue(this.data.value);

        const knobURL = require('./models/knob.glb').default;
        loader.load( knobURL,(gltf) => {
            var scene = gltf.scene;
            this.knob = scene.children[0];
            this.knob.scale.set(0.2,0.2, 0.2)
            this.knob.rotation.set(0, Math.PI, 0)
            this.knob.material = this.knobMaterial;
            this.lever.add( this.knob );

        }, undefined, function ( error ) {
        
            console.error( error );
        
        } );

        const titleText = new MeshText2D(this.data.title, { align: textAlign.right,  font: '36px Arial', fillStyle: '#FFFFFF' , antialias: true });
        titleText.scale.set(0.001,0.001,0.001);
        titleText.position.y = 0.16;
        titleText.position.z = 0.02;
        titleText.rotateY(-Math.PI / 2);
        this.lever.add(titleText)
        
        const minText = new MeshText2D(this.data.min.toFixed(this.data.precision), { align: textAlign.right,  font: '28px Arial', fillStyle: '#FFFFFF' , antialias: true });
        minText.scale.set(0.001,0.001,0.001);
        minText.position.y = -0.02;
        minText.position.x = this.valueToLeverPosition(this.data.min);
        chassis.add(minText)
        
        const maxText = new MeshText2D(this.data.max.toFixed(this.data.precision), { align: textAlign.left,  font: '28px Arial', fillStyle: '#FFFFFF' , antialias: true });
        maxText.scale.set(0.001,0.001,0.001);
        maxText.position.y = -0.02;
        maxText.position.x = this.valueToLeverPosition(this.data.max);
        chassis.add(maxText)
        

        this.setTextGeometry("0.01")
            
    
      },
      setTextGeometry: function(text) {
        if (this.textmesh != null) {
            this.textmesh.text = text;
        } else {
            this.textmesh = new MeshText2D(text, { align: textAlign.right,  font: '50px Arial', fillStyle: '#FFFFFF' , antialias: true });
            this.textmesh.scale.set(0.001,0.001,0.001);
            this.textmesh.position.y = 0.12;
            this.textmesh.position.z = 0.02;;
            this.textmesh.rotateY(-Math.PI / 2);
            this.lever.add(this.textmesh)
        }
      },
      play: function () {
        this.grabbed = false;
        this.el.addEventListener('rangeout', this.onTriggerUp.bind(this));
        this.controllers.forEach(function (controller){
          controller.addEventListener('triggerdown', this.onTriggerDown.bind(this));
          controller.addEventListener('triggerup', this.onTriggerUp.bind(this));
        }.bind(this));
      },
    
      pause: function () {
        this.el.removeEventListener('rangeout', this.onTriggerUp.bind(this));
        this.controllers.forEach(function (controller){
          controller.removeEventListener('triggerdown', this.onTriggerDown.bind(this));
          controller.removeEventListener('triggerup', this.onTriggerUp.bind(this));
        }.bind(this));
      },
    
      onTriggerDown: function(e) {
        var hand = e.target.object3D;
        var lever = this.lever;
    
        var handBB = new THREE.Box3().setFromObject(hand);
        var leverBB = new THREE.Box3().setFromObject(lever);
        var collision = handBB.intersectsBox(leverBB);
    
        if (collision) {
          let handWorld = new THREE.Vector3();
          hand.getWorldPosition(handWorld);
          let knobWorld = new THREE.Vector3();;
          lever.getWorldPosition(knobWorld);
          let distance = handWorld.distanceTo(knobWorld);
          if (distance < 0.1) {
            this.grabbed = hand;
            this.grabbed.visible = false;
            this.knob.material = this.knobGrabbedMaterial;
          }
        };
      },
    
      onTriggerUp: function() {
        if (this.grabbed) {
          this.grabbed.visible = true;
          this.grabbed = false;
          this.knob.material = this.knobMaterial;
        }
      },
    
      setValue: function(value) {
        var lever = this.lever;
        if (value < this.data.min) {
          value = this.data.min;
        } else if (value > this.data.max) {
          value = this.data.max;
        }
    
        this.value = value;
    
        lever.position.x = this.valueToLeverPosition(value);
        this.setTextGeometry(value.toFixed(this.data.precision))
      },
      valueToLeverPosition: function(value) {
        var sliderRange = this.data.size * this.data.innerSize;
        var valueRange = Math.abs(this.data.max - this.data.min);
        
        let sliderMin = -1 * sliderRange / 2;

        return (((value - this.data.min) * sliderRange) / valueRange) + sliderMin
      },
      leverPositionToValue: function(position) {
        var sliderRange = this.data.size * this.data.innerSize;
        var valueRange = Math.abs(this.data.max - this.data.min);
        
        let sliderMin = -1 * sliderRange / 2;

        return (((position - sliderMin) * valueRange) / sliderRange) + this.data.min
    },
    tick: function() {
        if (this.grabbed) {
          var hand = this.grabbed;
          var lever = this.lever;
          var sliderSize = this.data.size;
          var sliderRange = (sliderSize * this.data.innerSize);
    
          var handWorld = new THREE.Vector3().setFromMatrixPosition(hand.matrixWorld);
          lever.parent.worldToLocal(handWorld);
          
    
            if (Math.abs(handWorld.x) > sliderRange / 2) {
                lever.position.x = sliderRange / 2 * Math.sign(lever.position.x);
            // this.el.emit('rangeout');
            } else {
                lever.position.x = handWorld.x;
            }    
            var value = this.leverPositionToValue(lever.position.x);
            
            if (Math.abs(this.value - value) >= Math.pow(10, -this.data.precision)) {
                this.el.emit('change', { value: value });
                this.value = value;
                this.setTextGeometry(value.toFixed(this.data.precision))
            }
        }
      },
    
      update: function(old) {
        if(this.data.value !== old.value) {
          this.setValue(this.data.value);
        }
      }
})