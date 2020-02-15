import { MeshText2D, textAlign } from 'three-text2d'

AFRAME.registerComponent('graph-parameter-ui', {
    schema: {
        graph: {
            type: "selector"
        }
    },
    init: function() {
        if (this.data.graph == null) {
            throw new Error("Graph Object not found!")
        }
        this.graph = this.data.graph.components["graph"];
        if (this.graph == null) {
            throw new Error("Graph Component not found!")
        }  
        this.data.graph.addEventListener('function-changed', () => {
            this.setup()
        })

        this.setup();
    },
    setup: function() {
        this.group = new THREE.Group();
        
        this.controllers = Array.prototype.slice.call(document.querySelectorAll('a-entity[hand-controls]'));
        
        this.parameterInfos = Object.values(this.graph.getParameterExtrema());
        this.parameters = Object.keys(this.graph.getParameterExtrema());

        const planeWidth = this.parameterInfos[0].range;
        let planeHeight = 0.5;
        if (this.parameterInfos[1] != null) {
            planeHeight = this.parameterInfos[1].range;
        }

        this.planeGeo = new THREE.PlaneBufferGeometry(planeWidth, planeHeight, 1, 1);
        this.planeGeo.clearGroups();
        this.planeGeo.addGroup( 0, Infinity, 0 );
        this.planeGeo.addGroup( 0, Infinity, 1 );

        const transparentWireMaterial = new THREE.MeshBasicMaterial({side: THREE.DoubleSide});
        if (this.alphaTexture == null) {
            const alphaMapURL = require('../../images/square_inv.png').default;
            var loader = new THREE.TextureLoader();
            this.alphaTexture = loader.load(alphaMapURL);
        }
        this.alphaTexture.wrapS = this.alphaTexture.wrapT =  THREE.MirroredRepeatWrapping;

        const gridXOffset = this.parameterInfos[0].min % 1
        let gridYOffset = -0.25
        if (this.parameterInfos[1] != null) {
            gridYOffset = this.parameterInfos[1].min % 1;
        }

        this.alphaTexture.offset.x = gridXOffset;
        this.alphaTexture.offset.y = gridYOffset;
        this.alphaTexture.repeat.set(planeWidth, planeHeight);
        transparentWireMaterial.alphaMap = this.alphaTexture;
        transparentWireMaterial.transparent = true;
        transparentWireMaterial.opacity = 1;
        transparentWireMaterial.color.setHex(0xFFFFFF);           
        
        const transparentWireMaterial2 = new THREE.MeshBasicMaterial({side: THREE.DoubleSide});
        if (this.alphaTexture2 == null) {
            const alphaMapURL = require('../../images/cross_inv.png').default;
            var loader = new THREE.TextureLoader();
            this.alphaTexture2 = loader.load(alphaMapURL);
        }
        this.alphaTexture2.wrapS = this.alphaTexture2.wrapT =  THREE.ClampToEdgeWrapping;

        const originXOffset = this.parameterInfos[0].min + 0.5;
        let originYOffset = 1;
        if (this.parameterInfos[1] != null) {
            originYOffset = this.parameterInfos[1].min + 0.5
        }

        this.alphaTexture2.offset.x = originXOffset;
        this.alphaTexture2.offset.y = originYOffset;
        this.alphaTexture2.repeat.set(planeWidth, planeHeight);
        transparentWireMaterial2.alphaMap = this.alphaTexture2;
        transparentWireMaterial2.transparent = true;
        transparentWireMaterial2.opacity = 1;
        transparentWireMaterial2.color.setHex(0xDD0000);           

        this.planeMesh = new THREE.Mesh(this.planeGeo, [transparentWireMaterial, transparentWireMaterial2]);

        this.title = new MeshText2D(`${this.parameters.join("")} parameter`, { align: textAlign.left,  font: '80px Arial', fillStyle: '#FFFFFF' , antialias: true });
        this.title.scale.set(0.01,0.01, 0.01);
        this.title.position.z = 0.02;
        this.group.add(this.title);

        this.uMinText = new MeshText2D(this.parameterInfos[0].min.toFixed(2), { align: textAlign.right,  font: '50px Arial', fillStyle: '#FFFFFF' , antialias: true });
        this.uMinText.scale.set(0.01,0.01, 0.01);
        this.uMinText.position.z = 0.02;

        this.uMaxText = new MeshText2D(this.parameterInfos[0].max.toFixed(2), { align: textAlign.right,  font: '50px Arial', fillStyle: '#FFFFFF' , antialias: true });
        this.uMaxText.scale.set(0.01,0.01, 0.01);
        this.uMaxText.position.z = 0.02;

        
        this.group.add(this.uMinText);
        this.group.add(this.uMaxText);


        if (this.parameterInfos[1] != null) {

            this.vMinText = new MeshText2D(this.parameterInfos[1].min.toFixed(2), { align: textAlign.right,  font: '50px Arial', fillStyle: '#FFFFFF' , antialias: true });
            this.vMinText.scale.set(0.01,0.01, 0.01);
            this.vMinText.position.z = 0.02;

            this.vMaxText = new MeshText2D(this.parameterInfos[1].max.toFixed(2), { align: textAlign.right,  font: '50px Arial', fillStyle: '#FFFFFF' , antialias: true });
            this.vMaxText.scale.set(0.01,0.01, 0.01);
            this.vMaxText.position.z = 0.02;

            this.group.add(this.vMinText);
            this.group.add(this.vMaxText);
        }

        this.updateTextPosition();
        
        const knobGeo = new THREE.ConeBufferGeometry(0.4, 1, 24);
        this.knobMaterial = new THREE.MeshLambertMaterial({color: 0xFFFFFF});
        this.knobGrabbedMaterial = new THREE.MeshLambertMaterial({color: 0x7cc7ed, emissive:0x46b1ff });
        this.rightKnobMesh = new THREE.Mesh(knobGeo, this.knobMaterial);
        this.rightKnobMesh.rotation.z = -Math.PI / 2
        this.leftKnobMesh = new THREE.Mesh(knobGeo, this.knobMaterial);
        this.leftKnobMesh.rotation.z = Math.PI / 2
        this.topKnobMesh = new THREE.Mesh(knobGeo, this.knobMaterial);
        this.bottomKnobMesh = new THREE.Mesh(knobGeo, this.knobMaterial);
        this.bottomKnobMesh.rotation.z = Math.PI

        this.rightKnobStartPosition = this.planeGeo.parameters.width / 2 + 1;
        this.leftKnobStartPosition = -this.planeGeo.parameters.width / 2 - 1;
        this.topKnobStartPosition = this.planeGeo.parameters.height / 2 + 1;
        this.bottomKnobStartPosition = -this.planeGeo.parameters.height / 2 - 1;

        this.rightKnobMesh.position.set(this.rightKnobStartPosition, 0 ,0)
        this.rightKnobMesh.startPosition = this.rightKnobStartPosition
        this.rightKnobMesh.axis = "x"
        this.rightKnobMesh.direction = 1

        this.leftKnobMesh.position.set(this.leftKnobStartPosition, 0 ,0)
        this.leftKnobMesh.startPosition = this.leftKnobStartPosition
        this.leftKnobMesh.axis = "x"
        this.leftKnobMesh.direction = -1

        this.topKnobMesh.position.set(0, this.topKnobStartPosition ,0)
        this.topKnobMesh.startPosition = this.topKnobStartPosition
        this.topKnobMesh.axis = "y"
        this.topKnobMesh.direction = 1

        this.bottomKnobMesh.position.set(0, this.bottomKnobStartPosition,0)
        this.bottomKnobMesh.startPosition = this.bottomKnobStartPosition
        this.bottomKnobMesh.axis = "y"
        this.bottomKnobMesh.direction = -1

        
        this.group.add(this.planeMesh);

        this.group.add(this.rightKnobMesh);
        this.group.add(this.leftKnobMesh);
        if (this.parameterInfos[1] != null) {
            this.group.add(this.topKnobMesh);
            this.group.add(this.bottomKnobMesh);
        }

        this.group.scale.set(0.03, 0.03, 0.03);

        this.el.setObject3D('mesh', this.group)
        
        this.grabbedKnob = null;     
    },
    updateTextPosition: function() {

        this.title.position.x = this.planeMesh.position.x - this.planeGeo.parameters.width * this.planeMesh.scale.x / 2 - 0.5;
        this.title.position.y = this.planeMesh.position.y + this.planeGeo.parameters.height * this.planeMesh.scale.y / 2 + 2.5;

        this.uMinText.position.x = this.planeMesh.position.x - this.planeGeo.parameters.width * this.planeMesh.scale.x / 2 + 0.5 * 1 / this.el.object3D.scale.x;
        this.uMinText.position.y = this.planeMesh.position.y - this.planeGeo.parameters.height * this.planeMesh.scale.y / 2 - 0.3 * 1 / this.el.object3D.scale.y;

        this.uMaxText.position.x = this.planeMesh.position.x + this.planeGeo.parameters.width * this.planeMesh.scale.x / 2;
        this.uMaxText.position.y = this.planeMesh.position.y - this.planeGeo.parameters.height * this.planeMesh.scale.y / 2 - 0.3* 1 / this.el.object3D.scale.y;

        if (this.parameterInfos[1] != null) {
            this.vMinText.position.x = this.planeMesh.position.x - this.planeGeo.parameters.width * this.planeMesh.scale.x / 2 - 0.5* 1 / this.el.object3D.scale.x;
            this.vMinText.position.y = this.planeMesh.position.y - this.planeGeo.parameters.height * this.planeMesh.scale.y / 2 + 0.5* 1 / this.el.object3D.scale.y;

            this.vMaxText.position.x = this.planeMesh.position.x - this.planeGeo.parameters.width * this.planeMesh.scale.x / 2 - 0.5* 1 / this.el.object3D.scale.x;
            this.vMaxText.position.y = this.planeMesh.position.y + this.planeGeo.parameters.height * this.planeMesh.scale.y / 2;
        }
    },
    play: function () {
        this.grabbed = false;
        this.controllers.forEach(function (controller){
          controller.addEventListener('triggerdown', this.onTriggerDown.bind(this));
          controller.addEventListener('triggerup', this.onTriggerUp.bind(this));
        }.bind(this));
      },
    
      pause: function () {
        this.controllers.forEach(function (controller){
          controller.removeEventListener('triggerdown', this.onTriggerDown.bind(this));
          controller.removeEventListener('triggerup', this.onTriggerUp.bind(this));
        }.bind(this));
      },
      onTriggerDown: function(e) {
        var hand = e.target.object3D;
    
        var handBB = new THREE.Box3().setFromObject(hand);
        var rightKnobBB = new THREE.Box3().setFromObject(this.rightKnobMesh);
        var leftKnobBB = new THREE.Box3().setFromObject(this.leftKnobMesh);
        var topKnobBB = new THREE.Box3().setFromObject(this.topKnobMesh);
        var bottomKnobBB = new THREE.Box3().setFromObject(this.bottomKnobMesh);
    
        if (handBB.intersectsBox(rightKnobBB)) {
          this.grabbed = hand;
          this.grabbed.visible = false;
          this.grabbedKnob = this.rightKnobMesh;
        } else if (handBB.intersectsBox(leftKnobBB)) {
            this.grabbed = hand;
            this.grabbed.visible = false;
            this.grabbedKnob = this.leftKnobMesh;
        } else if (handBB.intersectsBox(topKnobBB) && this.parameterInfos[1] != null) {
            this.grabbed = hand;
            this.grabbed.visible = false;
            this.grabbedKnob = this.topKnobMesh;
        } else if (handBB.intersectsBox(bottomKnobBB) && this.parameterInfos[1] != null) {
            this.grabbed = hand;
            this.grabbed.visible = false;
            this.grabbedKnob = this.bottomKnobMesh;
        }
        if (this.grabbedKnob != null) {
            //this.grabOffset = this.hand.getWorldPosition().x - this.grabbedKnob.getWorldPosition().x;
            this.grabbedKnob.material = this.knobGrabbedMaterial;
        }
      },
    
      onTriggerUp: function() {
        if (this.grabbed) {
          this.grabbed.visible = true;
          this.grabbed = false;
          if (this.grabbedKnob != null) {
            this.grabbedKnob.material = this.knobMaterial;
          }
          this.grabbedKnob = null;
          this.grabOffset = null;
        }
      },
    tick: function() {
        if (this.grabbed && this.grabbedKnob) {
            
            var hand = this.grabbed;
            var knob = this.grabbedKnob;
      
            var handWorld = new THREE.Vector3().setFromMatrixPosition(hand.matrixWorld);
            knob.parent.worldToLocal(handWorld);

            if (this.grabOffset == null) {
                this.grabOffset = knob.position[knob.axis] - handWorld[knob.axis];
            }
            
            let nextKnobPosition = handWorld[knob.axis] + this.grabOffset;
            
            if (knob == this.leftKnobMesh) {
                let scale = (nextKnobPosition - this.grabbedKnob.startPosition) * knob.direction + this.planeGeo.parameters.width - (this.rightKnobMesh.position.x - this.rightKnobMesh.startPosition) * knob.direction;
                if (scale > 0.01) {
                    this.scaleLeft(scale / this.planeGeo.parameters.width)
                    knob.position[knob.axis] = nextKnobPosition;
                }
            }
            if (knob == this.rightKnobMesh) {
                let scale = (nextKnobPosition - this.grabbedKnob.startPosition) * knob.direction + this.planeGeo.parameters.width - (this.leftKnobMesh.position.x - this.leftKnobMesh.startPosition) * knob.direction;
                if (scale > 0.01) {
                    this.scaleRight(scale / this.planeGeo.parameters.width)
                    knob.position[knob.axis] = nextKnobPosition;
                }
            }
            if (knob == this.topKnobMesh) {
                let scale = (nextKnobPosition - this.grabbedKnob.startPosition) * knob.direction + this.planeGeo.parameters.height - (this.bottomKnobMesh.position.y - this.bottomKnobMesh.startPosition) * knob.direction;
                if (scale > 0.01) {
                    this.scaleTop(scale / this.planeGeo.parameters.height)
                    knob.position[knob.axis] = nextKnobPosition;
                }
            }
            if (knob == this.bottomKnobMesh) {
                let scale = (nextKnobPosition - this.grabbedKnob.startPosition) * knob.direction + this.planeGeo.parameters.height - (this.topKnobMesh.position.y - this.topKnobMesh.startPosition) * knob.direction;
                if (scale > 0.01) {
                    this.scaleBottom(scale / this.planeGeo.parameters.height)
                    knob.position[knob.axis] = nextKnobPosition;
                }
            }
            
            this.leftKnobMesh.position.y = this.bottomKnobMesh.position.y + (this.topKnobMesh.position.y - this.bottomKnobMesh.position.y) / 2;
            this.rightKnobMesh.position.y = this.bottomKnobMesh.position.y + (this.topKnobMesh.position.y - this.bottomKnobMesh.position.y) / 2;
            this.topKnobMesh.position.x = this.leftKnobMesh.position.x + (this.rightKnobMesh.position.x - this.leftKnobMesh.position.x) / 2;
            this.bottomKnobMesh.position.x = this.leftKnobMesh.position.x + (this.rightKnobMesh.position.x - this.leftKnobMesh.position.x) / 2;
            
            let oldURange = this.planeGeo.parameters.width;
            let oldVRange = this.planeGeo.parameters.height;
            let newURange = this.planeMesh.scale.x * this.planeGeo.parameters.width;
            let newVRange = this.planeMesh.scale.y * this.planeGeo.parameters.height;
            let newUmax = this.parameterInfos[0].max + this.planeMesh.position.x + (newURange - oldURange) / 2
            let newUmin = this.parameterInfos[0].min + this.planeMesh.position.x - (newURange - oldURange) / 2

            let newVmax;
            let newVmin;
            if (this.parameterInfos[1] != null) {
                newVmax = this.parameterInfos[1].max + this.planeMesh.position.y + (newVRange - oldVRange) / 2
                newVmin = this.parameterInfos[1].min + this.planeMesh.position.y - (newVRange - oldVRange) / 2
            }
            
            let attributeValues = {}
            attributeValues[`${this.parameters[0]}Min`] = newUmin;
            attributeValues[`${this.parameters[0]}Max`] = newUmax;
            if (this.parameterInfos[1] != null) {
                attributeValues[`${this.parameters[1]}Min`] = newVmin;
                attributeValues[`${this.parameters[1]}Max`] = newVmax;
            }
            
            this.data.graph.setAttribute('graph', attributeValues)
            
            let xRepeat = newURange;
            let yRepeat = newVRange;
            if (xRepeat < 2 || yRepeat < 2) {
                if (this.parameterInfos[1] != null) {
                    xRepeat = newURange * 4;
                    yRepeat = newVRange * 4;
                }
            }

            this.alphaTexture.repeat.set(xRepeat, yRepeat);            
            this.alphaTexture.offset.x = newUmin % 1;
            if (this.parameterInfos[1] != null) {
                this.alphaTexture.offset.y = newVmin % 1;
            }

            this.alphaTexture2.offset.x = newUmin + 0.5;
            if (this.parameterInfos[1] != null) {
                this.alphaTexture2.offset.y = newVmin  + 0.5;
            }
            this.alphaTexture2.repeat.set(newURange, newVRange);

            this.uMinText.text = newUmin.toFixed(2);
            this.uMaxText.text = newUmax.toFixed(2);

            if (this.parameterInfos[1] != null) {
                this.vMinText.text = newVmin.toFixed(2);
                this.vMaxText.text = newVmax.toFixed(2);
            }
            
        }    

        this.topKnobMesh.scale.set(Math.min(1.3 / this.el.object3D.scale.x, 1), Math.min(1.3 / this.el.object3D.scale.y, 1), Math.min(1.3 / this.el.object3D.scale.z, 1))
        this.bottomKnobMesh.scale.set(Math.min(1.3 / this.el.object3D.scale.x, 1), Math.min(1.3 / this.el.object3D.scale.y, 1), Math.min(1.3 / this.el.object3D.scale.z, 1))
        this.leftKnobMesh.scale.set(Math.min(1.3 / this.el.object3D.scale.x, 1), Math.min(1.3 / this.el.object3D.scale.y, 1), Math.min(1.3 / this.el.object3D.scale.z, 1))
        this.rightKnobMesh.scale.set(Math.min(1.3 / this.el.object3D.scale.x, 1), Math.min(1.3 / this.el.object3D.scale.y, 1), Math.min(1.3 / this.el.object3D.scale.z, 1))

        this.uMinText.scale.set(Math.min(1.3 / this.el.object3D.scale.x * 0.01, 0.01), Math.min(1.3 / this.el.object3D.scale.y * 0.01, 0.01), Math.min(1.3 / this.el.object3D.scale.z * 0.01, 0.01))
        this.uMaxText.scale.set(Math.min(1.3 / this.el.object3D.scale.x * 0.01, 0.01), Math.min(1.3 / this.el.object3D.scale.y * 0.01, 0.01), Math.min(1.3 / this.el.object3D.scale.z * 0.01, 0.01))
        if (this.parameterInfos[1] != null) {
            this.vMinText.scale.set(Math.min(1.3 / this.el.object3D.scale.x * 0.01, 0.01), Math.min(1.3 / this.el.object3D.scale.y * 0.01, 0.01), Math.min(1.3 / this.el.object3D.scale.z * 0.01, 0.01))
            this.vMaxText.scale.set(Math.min(1.3 / this.el.object3D.scale.x * 0.01, 0.01), Math.min(1.3 / this.el.object3D.scale.y * 0.01, 0.01), Math.min(1.3 / this.el.object3D.scale.z * 0.01, 0.01))
        }

        this.updateTextPosition()
        
    },
    scaleRight: function(value) {
        let oldScale = this.planeMesh.scale.x;
        this.planeMesh.scale.set(value ,this.planeMesh.scale.y,this.planeMesh.scale.z)
        this.planeMesh.applyMatrix( new THREE.Matrix4().makeTranslation(this.planeMesh.geometry.parameters.width * (value - oldScale) / 2, 0, 0 ));
    },
    scaleLeft: function(value) {
        let oldScale = this.planeMesh.scale.x;
        this.planeMesh.scale.set(value ,this.planeMesh.scale.y,this.planeMesh.scale.z)
        this.planeMesh.applyMatrix( new THREE.Matrix4().makeTranslation(-this.planeMesh.geometry.parameters.width * (value - oldScale) / 2, 0, 0 ));
    },
    scaleTop: function(value) {
        let oldScale = this.planeMesh.scale.y;
        this.planeMesh.scale.set(this.planeMesh.scale.x,value,this.planeMesh.scale.z)
        this.planeMesh.applyMatrix( new THREE.Matrix4().makeTranslation(0, this.planeMesh.geometry.parameters.height * (value - oldScale) / 2, 0 ));
    },
    scaleBottom: function(value) {
        let oldScale = this.planeMesh.scale.y;
        this.planeMesh.scale.set(this.planeMesh.scale.x,value,this.planeMesh.scale.z)
        this.planeMesh.applyMatrix( new THREE.Matrix4().makeTranslation(0, -this.planeMesh.geometry.parameters.height * (value - oldScale) / 2, 0 ));
    },
})