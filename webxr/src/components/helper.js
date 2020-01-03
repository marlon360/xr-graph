AFRAME.registerComponent('stretch', {
    schema: {
      otherhand: {
          type: "selector"
      },
      target: {
          type: "selector"
      },
      activatedOnInit: {
          default: false
      }
    },
    init: function() {
        this.firstPressed = false;
        this.secondPressed = false;
        this.startDistance = null;
        this.currentDistance = null;
        this.scaling = 1;
        this.startScale = new THREE.Vector3();

        this.el.addEventListener('triggerdown', () => {
            this.firstPressed = true;
        })
        this.data.otherhand.addEventListener('triggerdown', () => {
            this.secondPressed = true;
        })
        this.el.addEventListener('triggerup', () => {
            this.firstPressed = false;
        })
        this.data.otherhand.addEventListener('triggerup', () =>  {
            this.secondPressed = false;
        })
    },
    update: function() {
      this.target = this.data.target;
    },
    tick: function() {
        if ((this.firstPressed && this.secondPressed) || this.data.activatedOnInit) {
          this.currentDistance = this.el.object3D.position.distanceTo(this.data.otherhand.object3D.position);
          if (this.startDistance == null) {
              this.startDistance = this.currentDistance;
              this.startScale = this.target.getAttribute('scale').clone();
          }
          this.scaling = this.currentDistance / (this.startDistance + 0.0001);

          const newScale = new THREE.Vector3();
          newScale.copy(this.startScale);
          newScale.multiplyScalar(this.scaling);
          this.target.setAttribute("scale", newScale);
        } else {
            this.startDistance = null;
        }
    }
})

AFRAME.registerComponent('middle', {
    schema: {
        otherhand: {
            type: "selector"
        }
    },
    init: function() {
        this.otherhand = null;
        this.center = document.createElement('a-entity');
        this.el.sceneEl.appendChild(this.center );
        this.subvector = new THREE.Vector3();
    },
    update: function() {
        if (this.data.otherhand.object3D != null) {
            this.otherhand = this.data.otherhand.object3D;
        } else {
            console.log("cant find other hand")
        }
    },
    tick: function() {
        if (this.otherhand != null) {
            this.subvector.subVectors(this.otherhand.position, this.el.object3D.position);
            this.subvector.multiplyScalar(0.5)
            const newPosition = new THREE.Vector3(0,0,0);
            newPosition.add(this.el.object3D.position);
            newPosition.add(this.subvector);
            this.center.object3D.position.set(newPosition.x, newPosition.y, newPosition.z);  
            this.center.object3D.lookAt(this.el.object3D.position)       
        }
    }
  });


  AFRAME.registerComponent('grabbable', {
    schema: {
        debug: {
            default: false
        }
    },
    init: function() {
        this.boxHelper = new THREE.BoxHelper();
    },
    update: function() {

    },
    tick: function() {
        if (this.data.debug) {
            try {
                this.boxHelper.setFromObject(this.el.object3D, new THREE.Color(Math.random(), Math.random(), Math.random()));
                if (!this.boxHelper.parent) { this.el.sceneEl.object3D.add(this.boxHelper); }
            } catch(error) {
                AFRAME.log(error);
            }
            
        }
    }
  });