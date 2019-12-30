AFRAME.registerComponent('graph', {
    schema: {
        xMin: {
            default: -10
        },
        xMax: {
            default: 10
        },
        yMin: {
            default: -10
        },
        yMax: {
            default: 10
        },
        zMin: {
            default: -10
        },
        zMax: {
            default: 10
        },
        segmentsMultiplier: {
            default: 2
        }
    },
    init: function() {
        this.graph = null;
        this.root = new THREE.Object3D();
    },
    update: function() {
        this.root = new THREE.Object3D();

        this.root.add(this.makeAxes())
        this.graph = this.createGraph((x,y) => Math.cos(x) + Math.sin(y), {
            xMin: this.data.xMin,
            xMax: this.data.xMax,
            yMin: this.data.yMin,
            yMax: this.data.yMax,
            zMin: this.data.zMin,
            zMax: this.data.zMax,
            segmentsMultiplier: this.data.segmentsMultiplier
        });
        
        this.root.add(this.graph);
        
        //root.add(this.makeZeroPlanes())
        this.el.setObject3D('mesh', this.root)
    },
    createGraph: function(func, setting) {
        // set default values
        const xMin = setting && setting.xMin || -10,
            xMax = setting && setting.xMax || 10,
            zMin = setting && setting.zMin || -10,
            zMax = setting && setting.zMax || 10;
            segmentsMultiplier = setting && setting.segmentsMultiplier || 2;
        
        // calculate ranges
        const xRange = xMax - xMin;
        const zRange = zMax - zMin;

        const segments = Math.max(xRange, zRange) * segmentsMultiplier;

        // x and y from 0 to 1
        const meshFunction = (x, z, vec3) => {
            // map x,y to range
            x = xRange * x + xMin;
            z = zRange * z + zMin;
            // get z value from function
            const y = func(x, z);
            if (!isNaN(y))
                vec3.set(x, y, z);
        };

        this.graphGeometry = new THREE.ParametricGeometry(meshFunction, segments, segments);
        this.graphGeometry.scale(0.1, 0.1, 0.1);

        // set colors based on z value
        this.graphGeometry.computeBoundingBox();
        const yMin = this.graphGeometry.boundingBox.min.y;
        const yMax = this.graphGeometry.boundingBox.max.y;
        const yRange = yMax - yMin;

        let point;
        let color;
        // first, assign colors to vertices
        for (var i = 0; i < this.graphGeometry.vertices.length; i++) {
            point = this.graphGeometry.vertices[i];
            color = new THREE.Color(0xffffff);
            // only change color if not infinte
            if (isFinite(yRange)) {
                color.setHSL(0.7 * (yMax - point.y) / yRange, 1, 0.5);
            }
            this.graphGeometry.colors[i] = color;
        }
        // faces are indexed using characters
        const faceIndices = ['a', 'b', 'c', 'd'];
        // copy the colors as necessary to the face's vertexColors array.
        for (let i = 0; i < this.graphGeometry.faces.length; i++) {
            const face = this.graphGeometry.faces[i];
            const numberOfSides = (face instanceof THREE.Face3) ? 3 : 4;
            for (let j = 0; j < numberOfSides; j++) {
                const vertexIndex = face[faceIndices[j]];
                face.vertexColors[j] = this.graphGeometry.colors[vertexIndex];
            }
        }

        this.wireMaterial = this.createWireMaterial(segments);
        this.wireMaterial.map.repeat.set(segments, segments);

        const graphMesh = new THREE.Mesh(this.graphGeometry, this.wireMaterial);
        return graphMesh;
    },
    createWireMaterial: function(segments = 40) {
        var loader = new THREE.TextureLoader();
        const squareImageUrl = require('../images/square.png').default;
        const wireTexture = loader.load(squareImageUrl);
        wireTexture.wrapS = wireTexture.wrapT = THREE.RepeatWrapping;
        wireTexture.repeat.set(segments, segments);
        return new THREE.MeshBasicMaterial({ map: wireTexture, vertexColors: THREE.VertexColors, side: THREE.DoubleSide });
    },
    makeAxes: function () {
        var axes = new THREE.AxesHelper;
        return axes;
    },
    makeZeroPlanes: function (setting) {

        const xMin = setting && setting.xMin || -10,
            xMax = setting && setting.xMax || 10,
            zMin = setting && setting.yMin || -10,
            zMax = setting && setting.yMin || 10,
            yMin = setting && setting.yMin || -10,
            yMax = setting && setting.yMin || 10;

        var zeroPlaneMaterial = new THREE.MeshLambertMaterial();
        zeroPlaneMaterial.side = THREE.DoubleSide;
        zeroPlaneMaterial.transparent = true;
        zeroPlaneMaterial.opacity = 1 / 8;
        zeroPlaneMaterial.color = new THREE.Color(0x2244BB);
        
        var zeroPlanes = new THREE.Object3D();
        
        var xRange = xMax - xMin;
        var yRange = yMax - yMin;
        var zRange = zMax - zMin;
        
        var zeroZGeometry = new THREE.PlaneGeometry(xRange, yRange);
        var zeroZ = new THREE.Mesh(zeroZGeometry, zeroPlaneMaterial);
        zeroZ.position.set(xMin + xRange / 2, yMin + yRange / 2, 0.0);
        zeroPlanes.add(zeroZ);
        
        var zeroYGeometry = new THREE.PlaneGeometry(xRange, zRange);
        var zeroY = new THREE.Mesh(zeroYGeometry, zeroPlaneMaterial);
        zeroY.position.set(xMin + xRange / 2, 0.0, zMin + zRange / 2);
        zeroY.rotation.set(Math.PI / 2, 0.0, 0.0);
        zeroPlanes.add(zeroY);
        
        var zeroXGeometry = new THREE.PlaneGeometry(zRange, yRange);
        var zeroX = new THREE.Mesh(zeroXGeometry, zeroPlaneMaterial);
        zeroX.position.set(0.0, yMin + yRange / 2, zMin + zRange / 2);
        zeroX.rotation.set(0.0, Math.PI / 2, 0.0);
        zeroPlanes.add(zeroX);
        
        return zeroPlanes;
    }
  })