AFRAME.registerComponent('parent-constraint', {
    schema: {
        parent: { type: "selector", default: null },
        positionOn: { type: "boolean", default: true },
        rotationOn: { type: "boolean", default: true },
        scaleOn: { type: "boolean", default: false },
        updateRate: { type: 'number', default: 2 }
    },
    multiple: false, //do not allow multiple instances of this component on this entity
    init: function () {
        this.psuedoParent = null;
        this.worldMat_Constraint = new THREE.Matrix4();
        this.position_P = new THREE.Vector3();
        this.position_C = new THREE.Vector3();
        this.rotation_P = new THREE.Quaternion();
        this.rotation_P_start = new THREE.Quaternion();
        this.rotation_C = new THREE.Quaternion();
        this.scale_P = new THREE.Vector3();
        this.scale_C = new THREE.Vector3();
        this.posMat = new THREE.Matrix4();
        this.posMat_Off = new THREE.Matrix4();
        this.rotMat = new THREE.Matrix4();
        this.rotMat_Off = new THREE.Matrix4();
        this.scaleMat = new THREE.Matrix4();
        this.scaleMat_Off = new THREE.Matrix4();
        this.prevTime = 0;
    },
    update: function (oldData) {
        const Context_AF    = this;
            const data = this.data;

            if (Object.keys(data).length === 0) { return; } // No need to update. as nothing here yet

            let constraintLoop = null
            //model change
            if ( (oldData.parent !== data.parent) && data.parent !== null ) {
                //have to keep checking if everything is ready first ...
                let loopCounter = 0;
                const checkChildParentLoadStatus = () => {
                    if ( data.parent.hasLoaded && Context_AF.el.hasLoaded ) {
                        Context_AF.psuedoParent = data.parent;
                        Context_AF.setupConstraint();
                        if (constraintLoop != null) {
                            clearInterval(constraintLoop);
                        }
                    }

                    if (++loopCounter > 20) {
                        console.log( "Warning! : problems setting parentConstraint" );
                        if (constraintLoop != null) {
                            clearInterval(constraintLoop);
                        }
                    }
                    if (constraintLoop == null) {
                        constraintLoop = setInterval(checkChildParentLoadStatus, 100);
                    }
                };

                checkChildParentLoadStatus()
                 
            }
    },
    setupConstraint: function () {
        console.log('setting up constraint');

        // save original position of child
        this.originalPos = this.el.object3D.position.clone();
        this.originalRot = this.el.object3D.quaternion.clone();
        this.originalSca = this.el.object3D.scale.clone();

        // get world rotation/position of parent
        this.psuedoParent.object3D.getWorldQuaternion(this.rotation_P);
        this.psuedoParent.object3D.getWorldPosition(this.position_P);
        // save start rotation of parent
        this.rotation_P_start.copy(this.rotation_P);

        // get world position/rotation/scale of child
        const childWorldPosition = new THREE.Vector3();
        this.el.object3D.getWorldPosition(childWorldPosition);
        this.el.object3D.getWorldQuaternion(this.rotation_C);
        this.el.object3D.getWorldScale(this.scale_C)

        // vector between child and parent position (local child position in parent space)
        this.position_C.subVectors(childWorldPosition, this.position_P);
    },
    tick: function (time, timeDelta) {
        if (time - this.prevTime > this.data.updateRate) {
            if (this.psuedoParent !== null) {

                // reset matrices
                this.worldMat_Constraint.identity();
                this.posMat.identity();
                this.posMat_Off.identity();
                this.rotMat.identity();
                this.rotMat_Off.identity();
                this.scaleMat.identity();
                this.scaleMat_Off.identity();

                // get local scale
                this.el.object3D.getWorldScale(this.scale_C)

                //get world matrix of pseudo-parent we want to constrain to
                this.worldMat_Constraint.copy(this.psuedoParent.object3D.matrixWorld);

                //break down into individual transforms
                this.worldMat_Constraint.decompose(this.position_P, this.rotation_P, this.scale_P);

                //set matrices
                this.posMat.makeTranslation(this.position_P.x, this.position_P.y, this.position_P.z);
                this.posMat_Off.makeTranslation(this.position_C.x, this.position_C.y, this.position_C.z);

                this.rotMat_Off.makeRotationFromQuaternion(this.rotation_C);
                if (this.scale_P.length() > Number.EPSILON) { // zero-vector will throw a bunch of errors here ...
                    this.scaleMat.makeScale(this.scale_P.x, this.scale_P.y, this.scale_P.z);
                }

                // new world matrix
                this.worldMat_Constraint.identity();
                this.worldMat_Constraint.scale(this.scale_C);

                if (this.data.rotationOn) {
                    this.worldMat_Constraint.premultiply(this.rotMat_Off);
                }
                if (this.data.positionOn) {
                    this.worldMat_Constraint.premultiply(this.posMat_Off);
                }

                const p_start = new THREE.Quaternion();
                p_start.copy(this.rotation_P_start)
                const rot = new THREE.Quaternion();
                rot.multiplyQuaternions(this.rotation_P, p_start.inverse());
                this.rotMat.makeRotationFromQuaternion(rot);

                //set matrix copies
                if (this.data.rotationOn) {
                    this.worldMat_Constraint.premultiply(this.rotMat);
                }
                if (this.data.scaleOn) {
                    this.worldMat_Constraint.premultiply(this.scaleMat);
                }
                if (this.data.positionOn) {
                    this.worldMat_Constraint.premultiply(this.posMat);
                }

                //set new matrix and manually update
                this.invOriginal = new THREE.Matrix4().getInverse(this.el.object3D.matrixWorld);
                this.el.object3D.applyMatrix(this.invOriginal); //reset this objects matrices
                this.el.object3D.applyMatrix(this.worldMat_Constraint);
            }

            this.prevTime = time;
        }
    },
    remove: function () {
        console.log('removing constraint');
    }
});