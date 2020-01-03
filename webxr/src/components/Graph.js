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
 
        //this.root.add(this.makeGrid(xRange,zRange))
        this.graph = this.createGraph((x,y) => Math.cos(x) + Math.sin(y), {
            xMin: this.data.xMin,
            xMax: this.data.xMax,
            yMin: this.data.yMin,
            yMax: this.data.yMax,
            zMin: this.data.zMin,
            zMax: this.data.zMax,
            segmentsMultiplier: this.data.segmentsMultiplier
        });
        this.grid = this.createGrid({
            xMin: this.data.xMin,
            xMax: this.data.xMax,
            yMin: this.data.yMin,
            yMax: this.data.yMax,
            zMin: this.data.zMin,
            zMax: this.data.zMax,
            segmentsMultiplier: this.data.segmentsMultiplier
        });
        
        this.root.add(this.graph);
        this.root.add(this.grid);
        this.root.scale.set(0.1,0.1,0.1)
        
        //root.add(this.makeZeroPlanes())
        this.el.setObject3D('mesh', this.root)
    },
    createGraph: function(func, setting) {
        // set default values
        const xMin = setting && setting.xMin,
            xMax = setting && setting.xMax,
            zMin = setting && setting.zMin,
            zMax = setting && setting.zMax;
            segmentsMultiplier = setting && setting.segmentsMultiplier;
        
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
        this.graphGeometry.scale(1, 1, 1);

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
        //this.wireMaterial.map.repeat.set(segments, segments);

        const graphMesh = new THREE.Mesh(this.graphGeometry, this.wireMaterial);
        return graphMesh;
    },
    createWireMaterial: function(segments = 40) {
        var loader = new THREE.TextureLoader();
        const squareImageUrl = require('../images/square.png').default;
        // const wireTexture = loader.load(squareImageUrl);
        // wireTexture.wrapS = wireTexture.wrapT = THREE.RepeatWrapping;
        // wireTexture.repeat.set(segments, segments);
        return new THREE.MeshBasicMaterial({vertexColors: THREE.VertexColors, side: THREE.DoubleSide });
    },
    makeAxes: function () {
        var axes = new THREE.AxesHelper;
        return axes;
    },
    makeGrid: function () {
        // calculate ranges
        const xRange = this.data.xMax - this.data.xMin;
        const zRange = this.data.zMax - this.data.zMin;

        const segments = Math.max(xRange, zRange);

        const zeroPlaneMaterial = new THREE.MeshBasicMaterial({side: THREE.DoubleSide });
        const alphaMapURL = require('../images/square_inv.png').default;
        var loader = new THREE.TextureLoader();
        const alphaTexture = loader.load(alphaMapURL);
        alphaTexture.wrapS = alphaTexture.wrapT = THREE.RepeatWrapping;
        alphaTexture.repeat.set(segments, segments);
        zeroPlaneMaterial.alphaMap = alphaTexture;
        zeroPlaneMaterial.transparent = true;
        zeroPlaneMaterial.opacity = 0.5;
        zeroPlaneMaterial.color.setHex(0x000000);

        var zeroZGeometry = new THREE.PlaneGeometry(xRange * 2 + 2, zRange * 2 + 2);
        zeroZGeometry.rotateX(Math.PI / 2)

        return new THREE.Mesh(zeroZGeometry, zeroPlaneMaterial);
    },
    createGrid: function(setting) {
        // set default values
        const xMin = setting && setting.xMin,
            xMax = setting && setting.xMax,
            zMin = setting && setting.zMin,
            zMax = setting && setting.zMax;
            segmentsMultiplier = setting && setting.segmentsMultiplier;
        
        // calculate ranges
        const xRange = xMax - xMin;
        const zRange = zMax - zMin;

        const segments = Math.max(xRange, zRange);

        // x and y from 0 to 1
        const meshFunction = (x, z, vec3) => {
            // map x,y to range
            x = xRange * x + xMin;
            z = zRange * z + zMin;
            vec3.set(x, 0, z);
        };

        this.gridGeometry = new THREE.ParametricGeometry(meshFunction, segments, segments);
        this.gridGeometry.scale(1, 1, 1);

        const zeroPlaneMaterial = new THREE.MeshBasicMaterial({side: THREE.DoubleSide });
        const alphaMapURL = require('../images/square_inv.png').default;
        var loader = new THREE.TextureLoader();
        const alphaTexture = loader.load(alphaMapURL);
        alphaTexture.wrapS = alphaTexture.wrapT = THREE.RepeatWrapping;
        alphaTexture.repeat.set(xRange, zRange);
        zeroPlaneMaterial.alphaMap = alphaTexture;
        zeroPlaneMaterial.transparent = true;
        zeroPlaneMaterial.opacity = 0.5;
        zeroPlaneMaterial.color.setHex(0x000000);

        const graphMesh = new THREE.Mesh(this.gridGeometry, zeroPlaneMaterial);
        return graphMesh;
    },
  })