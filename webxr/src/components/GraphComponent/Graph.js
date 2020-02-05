import SpriteText from 'three-spritetext';
import { MathExpression } from './MathExpression';
import { MathGraphMaterial } from './MathGraphShader';
import { MathCurveMaterial } from './MathCurveShader';
const createTubeGeometry = require('./createTubeGeometry');

AFRAME.registerComponent('graph', {
    schema: {
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
        },
        function: {
            default: "f(u, v) = [1.5 * u, 0.1 * u^2 * cos(v), 0.1 * u^2 * sin(v)]"
        }
    },
    init: function () {
        this.el.object3D.colliderBox = new THREE.Box3();
    },
    update: function () {

        // function mapping:
        // 1 input 1 output = curve
        // 1 input 2 output = curve
        // 1 input 3 output = curve
        // 2 input 1 output = graph (x,y,f(x,y))
        // 2 input 3 output = graph

        this.expression = new MathExpression(this.data.function);

        this.function = this.expression.getJSFunction();

        const inputSize = this.expression.getInputSize();
        const outputSize = this.expression.getOutputSize();
        if (inputSize == 1) {
            this.createCurve(this.expression);
        } else if (inputSize == 2) {
            if (outputSize == 1) {
                this.createGraph(this.expression);
            } else {
                this.createGraph(this.expression);
            }
        }

        this.root = new THREE.Group();
        this.root.add(this.graph);

        var boundingBox = this.createColliderBox(this.expression, 20);
        this.el.object3D.colliderBox.copy( boundingBox ).applyMatrix4( this.graph.matrixWorld );

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

        this.root.scale.set(0.1, 0.1, 0.1)

        //root.add(this.makeZeroPlanes())
        this.el.setObject3D('mesh', this.root)

        
    },
    getParameterExtrema: function (expression) {
        let parameterExtrema = {};
        expression.getParameters().forEach(param => {
            let min = -6;
            let max = 6;
            if (this.data[param+"Min"] != null) {
                min = parseFloat(this.data[param+"Min"])
            }
            if (this.data[param+"Max"] != null) {
                max = parseFloat(this.data[param+"Max"])
            }
            parameterExtrema[param] = {
                min: min,
                max: max,
                range: max - min
            }
        });
        
        return parameterExtrema;
    },
    createColliderBox: function (expression, segments = 100) {

        const extrema = this.getParameterExtrema(expression);        
        const parameters = expression.getParameters();        

        let explicitFunctionParameter = [];

        for (let i = 0; i < parameters.length; i++) {
            const extremum = extrema[parameters[i]];
            for (let segmentIndex = 0; segmentIndex <= segments; segmentIndex++) {
                if (i == 0) {
                    explicitFunctionParameter[segmentIndex] = new Array(parameters.length);
                }
                explicitFunctionParameter[segmentIndex][i] = extremum.min + extremum.range / segments * segmentIndex;
            }
        }        

        this.xMin = null;
        this.xMax = null;
        this.yMin = null;
        this.yMax = null;
        this.zMin = null;
        this.zMax = null;

        let xValue;
        let yValue;
        let zValue;

        let variables = {}
        for (const variable of expression.getVariables()) {
            variables[variable] = 1;
            if (this.data[variable] != null) {
                variables[variable] = parseFloat(this.data[variable])
            }
        }
        let JSFunc = expression.getJSFunction(variables);
        const inputSize = expression.getInputSize();
        const outputSize = expression.getOutputSize();
        let func;
        if (inputSize == 2 && outputSize == 1) {
            func = (x,y) => [x,JSFunc(x,y),y]
        } else {
            func = JSFunc;
        }
        for (let i = 0; i < explicitFunctionParameter.length; i++) {
            xValue = func(...explicitFunctionParameter[i])[0];
            yValue = func(...explicitFunctionParameter[i])[1];
            zValue = func(...explicitFunctionParameter[i])[2];

            if (this.xMin == null || xValue < this.xMin) {
                this.xMin = xValue
            }
            if (this.xMax == null || xValue > this.xMax) {
                this.xMax = xValue
            }
            if (this.yMin == null || yValue < this.yMin) {
                this.yMin = yValue
            }
            if (this.yMax == null || yValue > this.yMax) {
                this.yMax = yValue
            }
            if (this.zMin == null || zValue < this.zMin) {
                this.zMin = zValue
            }
            if (this.zMax == null || zValue > this.zMax) {
                this.zMax = zValue
            }
        }
        const minVec = new THREE.Vector3(this.xMin, this.yMin, this.zMin);
        const maxVec = new THREE.Vector3(this.xMax, this.yMax, this.zMax);

        this.xRange = this.xMax - this.xMin;
        this.yRange = this.yMax - this.yMin;
        this.zRange = this.zMax - this.zMin;

        return new THREE.Box3(minVec, maxVec)
    },
    tick: function () {
        var boundingBox = this.createColliderBox(this.expression, 20);
        this.el.object3D.colliderBox.copy( boundingBox ).applyMatrix4( this.graph.matrixWorld );
    },
    createGraph: function (expression) {

        if (this.graphGeometry == null) {
            this.graphGeometry = new THREE.PlaneBufferGeometry(1, 1, 200, 200);
            this.graphGeometry.scale(1, 1, 1);
            this.graphMat = new MathGraphMaterial(expression);
            this.graph = new THREE.Mesh(this.graphGeometry, this.graphMat.material);
        }

        expression.getParameters().forEach(param => {
            let min = -6;
            let max = 6;
            if (this.data[param+"Min"] != null) {
                min = this.data[param+"Min"]
            }
            if (this.data[param+"Max"] != null) {
                max = this.data[param+"Max"]
            }
            this.graph.material.uniforms[param+"Min"].value = min;
            this.graph.material.uniforms[param+"Max"].value = max;
        });
        expression.getVariables().forEach(param => {
            if (this.data[param] != null) {
                 this.graph.material.uniforms[param].value = this.data[param]
            }
        });

        this.graph.material.uniforms.wireframeActive.value = this.data.showWireframe;

    },
    createCurve: function (expression) {

        const numSides = 8;
        const subdivisions = 100;

        if (this.graphGeometry == null) {
            this.graphGeometry = createTubeGeometry(numSides, subdivisions);
            this.graphGeometry.scale(1, 1, 1);
            this.graphMat = new MathCurveMaterial(expression, subdivisions)
            this.graph = new THREE.Mesh(this.graphGeometry, this.graphMat.material);
        }

        expression.getParameters().forEach(param => {
            let min = -6;
            let max = 6;
            if (this.data[param+"Min"] != null) {
                min = this.data[param+"Min"]
            }
            if (this.data[param+"Max"] != null) {
                max = this.data[param+"Max"]
            }
            this.graph.material.uniforms[param+"Min"].value = min;
            this.graph.material.uniforms[param+"Max"].value = max;
        });
        expression.getVariables().forEach(param => {
            if (this.data[param] != null) {
                 this.graph.material.uniforms[param].value = this.data[param]
            }
        });
        
    },
    createWireMaterial: function (segments = 40) {
        if (this.wireTexture == null) {
            var loader = new THREE.TextureLoader();
            const squareImageUrl = require('../../images/square.png').default;
            this.wireTexture = loader.load(squareImageUrl);
        }
        this.wireTexture.wrapS = this.wireTexture.wrapT = THREE.RepeatWrapping;
        this.wireTexture.repeat.set(segments, segments);
        return new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0.2, map: this.data.showWireframe ? this.wireTexture : null, vertexColors: THREE.VertexColors, side: THREE.DoubleSide });
    },
    createTransparentWireMaterial: function (width, height) {
        const transparentWireMaterial = new THREE.MeshBasicMaterial();
        if (this.alphaTexture == null) {
            const alphaMapURL = require('../../images/square_inv.png').default;
            var loader = new THREE.TextureLoader();
            this.alphaTexture = loader.load(alphaMapURL);
        }
        this.alphaTexture.wrapS = this.alphaTexture.wrapT = THREE.RepeatWrapping;
        this.alphaTexture.repeat.set(width, height);
        transparentWireMaterial.alphaMap = this.alphaTexture;
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
    createGrid: function () {        
        this.gridGeometry = new THREE.PlaneGeometry(this.xRange, this.zRange);
        this.gridGeometry.scale(1, 1, 1);
        this.gridGeometry.rotateX(-Math.PI / 2)
        this.gridGeometry.rotateY(Math.PI)

        const graphMesh = new THREE.Mesh(this.gridGeometry, this.createTransparentWireMaterial(this.xRange / 10, this.zRange / 10));
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
        graphMesh3.position.set(this.xMin + this.xRange / 2, this.yMin + this.yRange / 2, this.zMax);

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
        graphMesh5.position.set(this.xMax, this.yMin + this.yRange / 2, this.zMin + this.zRange / 2);

        grid.add(graphMesh);
        grid.add(graphMesh2);
        grid.add(graphMesh3);
        grid.add(graphMesh4);
        grid.add(graphMesh5);

        return grid;
    },
    createAxesLabels: function () {

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
        zMaxText.position.set(this.xMin, this.yMin, this.zMin + this.zRange)

        labels.add(zMinText);
        labels.add(zMaxText);

        return labels;
    }
})