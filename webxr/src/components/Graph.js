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
        }
    },
    init: function() {
        this.graph = null;
        this.root = new THREE.Group();
    },
    update: function() {
        this.root = new THREE.Group();

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
        //this.graph = this.createGraphObject((x,y) => x, 32, this.data, "#AAA", 0.1, 0.1)
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

        this.el.object3D.colliderBox = new THREE.Box3().setFromObject(this.graph);
    },
    tick: function() {
        this.el.object3D.colliderBox = new THREE.Box3().setFromObject(this.graph);
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

        // get min max y
        let yMin = null;
        let yMax = null;
        for(let i = 1; i < this.graphGeometry.attributes.position.array.length; i += 3) {
            const yVal = this.graphGeometry.attributes.position.array[i];
            if(yMin == null || yVal < yMin) {
                yMin = yVal
            }
            if(yMax == null || yVal > yMax) {
                yMax = yVal
            }
        }

        const yRange = yMax - yMin;
        
        var colArr = []
        let color;
        for(let i = 1; i < this.graphGeometry.attributes.position.array.length; i += 3) {
            const yVal = this.graphGeometry.attributes.position.array[i];            
            color = new THREE.Color(0xffffff);
            // only change color if not infinte
            if (isFinite(yRange)) {
                color.setHSL(0.7 * (yMax - yVal) / yRange, 1, 0.5);
            }            
            colArr = colArr.concat([color.r * 255, color.g * 255, color.b * 255]);
        }        
        var colors = new Uint8Array(colArr);
       
       // Don't forget to normalize the array! (third param = true)
       this.graphGeometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 3, true) );
       

        this.wireMaterial = this.createWireMaterial(segments);
        console.log(this.wireMaterial);
        

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
            zMax = setting && setting.zMax,
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

        const grid = new THREE.Group();

        const xMinText = new SpriteText(xMin.toString(), 0.5, "red");
        xMinText.position.set(xMin + 0.2, 0, zMin);
        xMinText.geometry.dispose();
        xMinText.geometry = new THREE.PlaneBufferGeometry();
        var xMaxText = new SpriteText((xMin + xRange).toString(), 0.5, "red");
        xMaxText.position.set(xMin + xRange, 0, zMin)

        grid.add(xMinText);
        grid.add(xMaxText);

        const zMinText = new SpriteText(zMin.toString(), 0.5, "blue");
        zMinText.position.set(xMin, 0, zMin + 0.2);
        var zMaxText = new SpriteText((zMin + zRange).toString(), 0.5, "blue");
        zMaxText.position.set(xMin, 0 ,zMin + zRange)
        grid.add(zMinText);
        grid.add(zMaxText);

        grid.add(graphMesh);

        return grid;
    }
  })