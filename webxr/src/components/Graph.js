import SpriteText from 'three-spritetext';

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
        },
        showGrid: {
            default: true
        },
        showGridLabels: {
            default: true
        },
        showAxes: {
            default: false
        },
        showWireframe: {
            default: false
        }
    },
    init: function() {
        this.graph = null;
        this.root = new THREE.Group();
    },
    update: function() {
        this.root = new THREE.Group();
 
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
        this.root.add(this.graph);

        if (this.data.showGrid) {
            this.grid = this.createGrid();
            this.root.add(this.grid);
        }
        if (this.data.showGridLabels) {
            this.labels = this.createAxesLabels();
            this.root.add(this.labels);
        }
        if (this.data.showAxes) {
            this.root.add(this.makeAxes())
        }
        
        this.root.scale.set(0.1,0.1,0.1)
        
        //root.add(this.makeZeroPlanes())
        this.el.setObject3D('mesh', this.root)

        this.el.object3D.colliderBox = new THREE.Box3().setFromObject(this.graph);
    },
    tick: function() {
        this.el.object3D.colliderBox = new THREE.Box3().setFromObject(this.graph);
    },
    computeMinMaxRange: function (geometry) {

        // reset
        this.xMin = null;
        this.xMax = null;
        this.yMin = null;
        this.yMax = null;
        this.zMin = null;
        this.zMax = null;

        let xValue;
        let yValue;
        let zValue;
        for(let i = 0; i < geometry.attributes.position.array.length; i += 3) {

            xValue = geometry.attributes.position.array[i];
            yValue = geometry.attributes.position.array[i + 1];
            zValue = geometry.attributes.position.array[i + 2];

            if(this.xMin == null || xValue < this.xMin) {
                this.xMin = xValue
            }
            if(this.xMax == null || xValue > this.xMax) {
                this.xMax = xValue
            }
            if(this.yMin == null || yValue < this.yMin) {
                this.yMin = yValue
            }
            if(this.yMax == null || yValue > this.yMax) {
                this.yMax = yValue
            }
            if(this.zMin == null || zValue < this.zMin) {
                this.zMin = zValue
            }
            if(this.zMax == null || zValue > this.zMax) {
                this.zMax = zValue
            }
        }
        this.xRange = this.xMax - this.xMin;
        this.yRange = this.yMax - this.yMin;
        this.zRange = this.zMax - this.zMin;

    },
    createGraph: function(func, setting) {
        // set default values
        const xMin = setting && setting.xMin,
            xMax = setting && setting.xMax,
            zMin = setting && setting.zMin,
            zMax = setting && setting.zMax,
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

        this.graphGeometry = new THREE.ParametricBufferGeometry(meshFunction, segments, segments);
        this.graphGeometry.scale(1, 1, 1);

        this.computeMinMaxRange(this.graphGeometry);
        
        var colArr = []
        let color;
        for(let i = 1; i < this.graphGeometry.attributes.position.array.length; i += 3) {
            const yVal = this.graphGeometry.attributes.position.array[i];            
            color = new THREE.Color(0xffffff);
            // only change color if not infinte
            if (isFinite(this.yRange)) {
                color.setHSL(0.7 * (this.yMax - yVal) / this.yRange, 1, 0.5);
            }            
            colArr = colArr.concat([color.r * 255, color.g * 255, color.b * 255]);
        }        
        var colors = new Uint8Array(colArr);
       
       // Don't forget to normalize the array! (third param = true)
       this.graphGeometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 3, true) );
       
        this.wireMaterial = this.createWireMaterial(segments);        

        const graphMesh = new THREE.Mesh(this.graphGeometry, this.wireMaterial);
        return graphMesh;
    },
    createWireMaterial: function(segments = 40) {
        var loader = new THREE.TextureLoader();
        const squareImageUrl = require('../images/square.png').default;
        const wireTexture = loader.load(squareImageUrl);
        wireTexture.wrapS = wireTexture.wrapT = THREE.RepeatWrapping;
        wireTexture.repeat.set(segments, segments);
        return new THREE.MeshBasicMaterial({ map: this.data.showWireframe ? wireTexture : null, vertexColors: THREE.VertexColors, side: THREE.DoubleSide });
    },
    createTransparentWireMaterial: function(width, height){
        const transparentWireMaterial = new THREE.MeshBasicMaterial();
        const alphaMapURL = require('../images/square_inv.png').default;
        var loader = new THREE.TextureLoader();
        const alphaTexture = loader.load(alphaMapURL);
        alphaTexture.wrapS = alphaTexture.wrapT = THREE.RepeatWrapping;
        alphaTexture.repeat.set(width, height);
        transparentWireMaterial.alphaMap = alphaTexture;
        transparentWireMaterial.transparent = true;
        transparentWireMaterial.opacity = 0.5;
        transparentWireMaterial.color.setHex(0x000000);
        return transparentWireMaterial;
    },
    makeAxes: function () {
        var size = Math.min(this.xRange, this.yRange, this.zRange) / 2
        var axes = new THREE.AxesHelper(size);
        axes.position.set(this.xMin, this.yMin, this.zMin)
        return axes;
    },
    createGrid: function() {
        
        this.gridGeometry = new THREE.PlaneGeometry(this.xRange, this.zRange);
        this.gridGeometry.scale(1, 1, 1);
        this.gridGeometry.rotateX(-Math.PI / 2)
        this.gridGeometry.rotateY(Math.PI)

        const graphMesh = new THREE.Mesh(this.gridGeometry, this.createTransparentWireMaterial(this.xRange, this.zRange));
        graphMesh.position.set(this.xMin + this.xRange / 2, this.yMin, this.zMin + this.zRange / 2);

        const grid = new THREE.Group();

        // back
        this.gridGeometry2 = new THREE.PlaneBufferGeometry(this.xRange, this.yRange);
        this.gridGeometry2.scale(1, 1, 1);
        const graphMesh2 = new THREE.Mesh(this.gridGeometry2, this.createTransparentWireMaterial(this.xRange, this.yRange));
        graphMesh2.position.set(this.xMin + this.xRange / 2, this.yMin + this.yRange / 2, this.zMin);
        
        // front
        this.gridGeometry3 = new THREE.PlaneBufferGeometry(this.xRange, this.yRange);
        this.gridGeometry3.scale(1, 1, 1);
        this.gridGeometry3.rotateX(Math.PI)
        const graphMesh3 = new THREE.Mesh(this.gridGeometry3, this.createTransparentWireMaterial(this.xRange, this.yRange));
        graphMesh3.position.set(this.xMin + this.xRange / 2,  this.yMin + this.yRange / 2, this.zMax);

        // left
        this.gridGeometry4 = new THREE.PlaneBufferGeometry(this.zRange, this.yRange);
        this.gridGeometry4.scale(1, 1, 1);
        this.gridGeometry4.rotateY(Math.PI / 2)
        this.gridGeometry4.rotateX(Math.PI)
        const graphMesh4 = new THREE.Mesh(this.gridGeometry4, this.createTransparentWireMaterial(this.zRange, this.yRange));
        graphMesh4.position.set(this.xMin, this.yMin + this.yRange / 2, this.zMin + this.zRange / 2);
        
        // right
        this.gridGeometry5 = new THREE.PlaneBufferGeometry(this.zRange, this.yRange);
        this.gridGeometry5.scale(1, 1, 1);
        this.gridGeometry5.rotateY(Math.PI / 2 + Math.PI)
        const graphMesh5 = new THREE.Mesh(this.gridGeometry5, this.createTransparentWireMaterial(this.zRange, this.yRange));
        graphMesh5.position.set(this.xMax,  this.yMin + this.yRange / 2, this.zMin + this.zRange / 2);

        grid.add(graphMesh);
        grid.add(graphMesh2);
        grid.add(graphMesh3);
        grid.add(graphMesh4);
        grid.add(graphMesh5);

        return grid;
    },
    createAxesLabels: function() {

        const labels = new THREE.Group();

        const xMinText = new SpriteText((Math.floor(this.xMin * 100) / 100).toString(), 0.5, "red");
        xMinText.position.set(this.xMin + 0.2, this.yMin, this.zMin);
        var xMaxText = new SpriteText((Math.floor(this.xMax * 100) / 100).toString(), 0.5, "red");
        xMaxText.position.set(this.xMin + this.xRange, this.yMin, this.zMin)

        labels.add(xMinText);
        labels.add(xMaxText);

        const yMinText = new SpriteText((Math.floor(this.yMin * 100) / 100).toString(), 0.5, "green");
        yMinText.position.set(this.xMin, this.yMin + 0.2, this.zMin);
        var yMaxText = new SpriteText((Math.floor(this.yMax * 100) / 100).toString(), 0.5, "green");
        yMaxText.position.set(this.xMin, this.yMax, this.zMin)

        labels.add(yMinText);
        labels.add(yMaxText);

        const zMinText = new SpriteText((Math.floor(this.zMin * 100) / 100).toString(), 0.5, "blue");
        zMinText.position.set(this.xMin, this.yMin, this.zMin + 0.2);
        var zMaxText = new SpriteText((Math.floor(this.zMax * 100) / 100).toString(), 0.5, "blue");
        zMaxText.position.set(this.xMin, this.yMin ,this.zMin + this.zRange)

        labels.add(zMinText);
        labels.add(zMaxText);

        return labels;
    }
  })