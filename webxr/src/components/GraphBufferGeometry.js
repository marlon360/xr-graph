function GraphBufferGeometry(order, bounds, values, uScale, vScale) {
    
    THREE.BufferGeometry.call(this);
    
    this.order = order;
    
    this.values = values;
    
    var numTriangles = (order - 1) * (order - 1) * 2;
    var numVertices = numTriangles * 3;
    var numFloats = numVertices * 3;
    
    var vertices = new Float32Array(numFloats);
    var normals = new Float32Array(numFloats);
    var uvs = new Float32Array(numVertices * 2);
    
    var faceIndex = 0;
    var normalIndex = 0;
    var uvIndex = 0;
    
    function addValues(vertex, normal, i, j) {
        addVertex(vertex);
        addNormal(normal);
        addUV(vertex.x, vertex.z);
    }
    
    function addVertex(V) {
        vertices[faceIndex++] = V.x;
        vertices[faceIndex++] = V.y;
        vertices[faceIndex++] = V.z;
    }
    
    function addNormal(N) {
        normals[normalIndex++] = N.x;
        normals[normalIndex++] = N.y;
        normals[normalIndex++] = N.z;
    }
    
    function addUV(x, z) {
        uvs[uvIndex++] = x / uScale;
        uvs[uvIndex++] = z / vScale;
    }
    
    function getNormalVector(A, B, C) {
        var diff1 = B.clone().sub(A);
        var diff2 = C.clone().sub(A);
        var cross = diff1.cross(diff2);
        cross.normalize();
        return cross;
    }
    
    const xRange = bounds.xMax - bounds.xMin;
    const zRange = bounds.zMax - bounds.zMin;
    const xStep = xRange / (order - 1);
    const zStep = zRange / (order - 1);
    
    for (var i = 0; i < order - 1; ++i) {
        var x = bounds.xMin + i * xStep;
        
        for (var j = 0; j < order - 1; ++j) {
            var z = bounds.zMin + j * zStep;
            
            var value = values[i][j];
            var valuePlusX = values[i + 1][j];
            var valuePlusZ = values[i][j + 1];
            var valuePlusXZ = values[i + 1][j + 1];
            
            var A = new THREE.Vector3(x, valuePlusZ, z + zStep);
            var B = new THREE.Vector3(x + xStep, valuePlusX, z);
            var C = new THREE.Vector3(x, value, z);
            
            var normal = getNormalVector(A, B, C);
            
            addValues(A, normal, i, j + 1);
            addValues(B, normal, i + 1, j);
            addValues(C, normal, i, j);
            
            A = new THREE.Vector3(x + xStep, valuePlusX, z);
            B = new THREE.Vector3(x, valuePlusZ, z + zStep);
            C = new THREE.Vector3(x + xStep, valuePlusXZ, z + zStep);

            normal = getNormalVector(A, B, C);
            
            addValues(A, normal, i + 1, j);
            addValues(B, normal, i, j + 1);
            addValues(C, normal, i + 1, j + 1);
            
        }
    }
    
    function freeAttributeArray() { this.array = null; }
    
    this.setAttribute('position', new THREE.BufferAttribute(vertices, 3).onUpload(freeAttributeArray));
    this.setAttribute('uv', new THREE.BufferAttribute(uvs, 2).onUpload(freeAttributeArray));
    this.computeVertexNormals();
}

GraphBufferGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
GraphBufferGeometry.prototype.constructor = GraphBufferGeometry;

module.exports = GraphBufferGeometry;