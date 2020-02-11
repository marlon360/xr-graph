require('aframe');
require('aframe-event-set-component');
require('aframe-environment-component');
require('aframe-log-component');
require('aframe-plot-component');
require('aframe-ui-widgets');

require('aframe-fps-counter-component');

require('./components/aframe-aabb-collider');
require('./components/aframe-parent-constraint');
require('./components/helper');
require('./components/GraphComponent/Graph');

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
        title: { type: 'string', default: "My Slider" }
      },
    
      multiple: true,
    
      init: function () {
        this.box = document.getElementById("box").object3D;
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
        
        const minText = new MeshText2D(this.data.min, { align: textAlign.right,  font: '28px Arial', fillStyle: '#FFFFFF' , antialias: true });
        minText.scale.set(0.001,0.001,0.001);
        minText.position.y = -0.02;
        minText.position.x = this.valueToLeverPosition(this.data.min);
        chassis.add(minText)
        
        const maxText = new MeshText2D(this.data.max, { align: textAlign.right,  font: '28px Arial', fillStyle: '#FFFFFF' , antialias: true });
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
          this.grabbed = hand;
          this.grabbed.visible = false;
          this.knob.material = this.knobGrabbedMaterial;
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
        this.setTextGeometry(value.toFixed(2))
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
            
            if (this.value !== value) {
                this.el.emit('change', { value: value });
                this.value = value;
                this.setTextGeometry(value.toFixed(2))
            }
        }
      },
    
      update: function(old) {
        if(this.data.value !== old.value) {
          this.setValue(this.data.value);
        }
      }
})

AFRAME.registerComponent('interaction-hands', {
    init: function () {
        this.otherHand = null;

        this.stretching = false;
        this.grabbing = false;

        this.hoverEls = [];

        this.grabElement = null;

        this.onHit = this.onHit.bind(this)
        this.onHitEnd = this.onHitEnd.bind(this)
        this.onGrab = this.onGrab.bind(this)
        this.onGrabEnd = this.onGrabEnd.bind(this)

        this.system.registerMe(this);
    },
    update: function () {
        this.registerListeners();
    },
    registerListeners: function () {
        this.el.addEventListener('hitstart', this.onHit)
        this.el.addEventListener('triggerdown', this.onGrab)
        this.el.addEventListener('triggerup', this.onGrabEnd)
        this.el.addEventListener('hitend', this.onHitEnd)
    },
    onGrab: function () {
        if (this.hoverEls.length == 0) {
            this.hoverEls = this.el.components['aabb-collider']['intersectedEls']
        }
        // only grab if hovering over an element
        if (this.hoverEls.length > 0) {
            // grab first element
            this.grabElement = this.hoverEls[0];
            this.grabbing = true;
            // if both hands are grabbing the same element: start strechting
            if (this.grabElement == this.otherHand.grabElement) {
                this.onStretchStart();
            } else {
                // parent to this hand
                this.grabElement.setAttribute("parent-constraint", {
                    parent: this.el
                })
            }
        }
    },
    onGrabEnd: function () {
        this.grabbing = false;
        if (this.grabElement != null) {
            this.grabElement.removeAttribute("parent-constraint");
            this.grabElement = null;
            this.onStretchEnd();
        }
        if (this.otherHand.grabbing) {
            this.otherHand.grabElement.setAttribute("parent-constraint", {
                parent: this.otherHand.el
            })
        }
    },
    onStretchEnd: function () {
        this.stretching = false;
        this.el.removeAttribute("middle");
        this.el.removeAttribute("stretch")
        this.otherHand.el.removeAttribute("middle");
        this.otherHand.el.removeAttribute("stretch")
    },
    onStretchStart: function () {
        this.stretching = true;

        // create middle point between hands
        this.el.setAttribute("middle", {
            otherhand: this.otherHand.el
        });
        // parent element to middle between hands
        this.grabElement.setAttribute("parent-constraint", {
            parent: this.el.components["middle"].center
        });

        // activate stretching
        this.el.setAttribute("stretch", {
            otherhand: this.otherHand.el,
            target: this.grabElement,
            activatedOnInit: true
        })

    },
    onHit: function (evt) {
        const hitEl = evt.detail.el
        //console.log(evt)
        console.log("hit start")
        if (!hitEl) { return }
        if (Array.isArray(hitEl)) {
            for (let i = 0, sect; i < hitEl.length; i++) {
                sect = evt.detail.intersections && evt.detail.intersections[i]
                this.hoverStart(hitEl[i], sect)
            }
        } else {
            this.hoverStart(hitEl, null)
        }
    },
    onHitEnd: function (el) {
        console.log("hit end")
        this.hoverEnd(el)
    },
    hoverStart: function (hitEl, intersection) {
        const hitEnd = () => {
            this.onHitEnd(hitEl);
            hitEl.removeEventListener('hitend', hitEnd)
        }
        hitEl.addEventListener('hitend', hitEnd)
        const hitElIndex = this.hoverEls.indexOf(hitEl)
        if (hitElIndex === -1) {
            this.hoverEls.push(hitEl)
            // only emit hover start if first hover
            if (this.otherHand.hoverEls.indexOf(hitEl) === -1) {
                hitEl.emit('hover-start')
            }
        }
    },
    hoverEnd: function (target) {
        var hoverIndex = this.hoverEls.indexOf(target)
        if (hoverIndex !== -1) {
            // only emit if all hands left
            if (this.otherHand.hoverEls.indexOf(target) === -1) {
                this.hoverEls[hoverIndex].emit('hover-end')
            }
            this.hoverEls.splice(hoverIndex, 1)
        }
    }
})


AFRAME.registerSystem('interaction-hands', {
    init: function () {
        this.interactionHands = []
    },
    registerMe: function (comp) {
        // when second hand registers, store links
        if (this.interactionHands.length === 1) {
            this.interactionHands[0].otherHand = comp
            comp.otherHand = this.interactionHands[0]
        }
        this.interactionHands.push(comp)
    },
    unregisterMe: function (comp) {
        var index = this.interactionHands.indexOf(comp)
        if (index !== -1) {
            this.interactionHands.splice(index, 1)
        }
        this.interactionHands.forEach(x => {
            if (x.otherHand === comp) { x.otherHand = null }
        })
    }
})

AFRAME.registerComponent('slider-text', {
    schema: {
        slider: {
            type: 'selector'
        }
    },
    init: function () {
        this.onChange = this.onChange.bind(this);
        this.setText = this.setText.bind(this);
        this.forceUpdate = this.forceUpdate.bind(this);

        this.data.slider.addEventListener('change', this.onChange)
    },
    update: function () {
        this.forceUpdate();
    },
    forceUpdate: function () {
        const sliderComp = this.data.slider.components['ui-slider'];
        this.onChange({
            detail: {
                value: sliderComp.value || sliderComp.data.value
            }
        })
    },
    onChange: function (evt) {
        var roundedValue = Math.floor(evt.detail.value * 10) / 10
        if (this.data.slider.dataset['sliderPiMultiplier'] != null) {
            this.setText(roundedValue + " * PI");
        } else {
            this.setText(roundedValue);
        }
    },
    setText: function (text) {
        this.el.setAttribute("text", {
            value: text
        })
    }
})

AFRAME.registerComponent('slider-events', {
    schema: {},
    init: function () {
        this.value = 0;
        this.lastValue = 0;

        this.controllers = Array.prototype.slice.call(document.querySelectorAll('a-entity[hand-controls]'));

        this.controllers.forEach(function (controller) {
            controller.addEventListener('triggerup', this.onGrabEnd.bind(this));
        }.bind(this));
    },
    onGrabEnd: function () {
        const sliderComp = this.el.components['ui-slider'];
        this.value = sliderComp.value || sliderComp.data.value;
        if (this.el.dataset['sliderPiMultiplier'] != null) {
            this.value = this.value * Math.PI
        }
        if (this.value != this.lastValue) {
            this.el.emit('slider-released', {
                value: this.value
            })
        }
        this.lastValue = this.value;
    }
})


