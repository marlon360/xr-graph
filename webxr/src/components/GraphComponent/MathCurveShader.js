import { DoubleSide, Color, ShaderMaterial } from 'three';

export class MathCurveMaterial {

    constructor(expression, subdivisions) {

        this.expression = expression;

        this.uniforms = {
            thickness: { type: 'float', value: 0.1 },
            time: { type: 'float', value: 0 },
            radialSegments: { type: 'float', value: 8 },
            subdivisions: { type: 'float', value: subdivisions },
          }

        this.expression.getParameters().forEach(param => {
            this.uniforms[`${param}Min`] = { type: 'float', value: -6.0 }
            this.uniforms[`${param}Max`] = { type: 'float', value: 6.0 }
        });

        this.expression.getVariables().forEach(param => {
            this.uniforms[param] = { type: 'float', value: 1.0 }
        });

        this.vertexIdentifier = ["x", "y", "z"];

        this.material = new ShaderMaterial({
            uniforms: this.uniforms,
            side: DoubleSide,
            fragmentShader: this.fragmentShader(),
            vertexShader: this.vertexShader()
        })
    }

    getGLSLFunctionString() {
        let glslString = this.expression.getGLSLFunctionString();
        if (this.expression.getOutputSize() == 2) {
            return `vec3(0,${glslString})`;
        } else if (this.expression.getOutputSize() == 3) {
            return glslString;
        } else {
            const params = this.expression.getParameters()
            if (this.expression.getInputSize() == 2) {
                return `vec3(${params[0]},${glslString}, ${params[1]})`;
            }
        }
        return glslString;
    }

    vertexShader() {
        return `
        // attributes of our mesh
        attribute float pos;
        attribute float angle;
        
        
        // custom uniforms to build up our tubes
        uniform float thickness;
        uniform float time;
        uniform float animateRadius;
        uniform float animateStrength;
        uniform float index;
        uniform float radialSegments;
        uniform float subdivisions;

        ${this.expression.getParameters().map((param) => `uniform float ${param}Min;\nuniform float ${param}Max;\nfloat ${param}Range = ${param}Max - ${param}Min;\n`).join("\n")}

        ${this.expression.getVariables().map((param) => `uniform float ${param};`).join("\n")}
        
        // pass a few things along to the vertex shader
        varying vec2 vUv;
        varying vec3 vViewPosition;
        varying vec3 vNormal;
        

        vec3 sample (float t) {
          return ${this.getGLSLFunctionString()};
        }
        
        // ------
        // Fast version; computes the local Frenet-Serret frame
        // ------
        void createTube (float t, vec2 volume, out vec3 offset, out vec3 normal) {
          // find next sample along curve

          float nextT = t + (1.0 / subdivisions);
        
          // sample the curve in two places
          vec3 current = sample(t);
          vec3 next = sample(nextT);
          
          // compute the TBN matrix
          vec3 T = normalize(next - current);
          vec3 B = normalize(cross(T, next + current));
          vec3 N = -normalize(cross(B, T));
        
          // extrude outward to create a tube
          float tubeAngle = angle;
          float circX = cos(tubeAngle);
          float circY = sin(tubeAngle);
        
          // compute position and normal
          normal.xyz = normalize(B * circX + N * circY);
          offset.xyz = current + B * volume.x * circX + N * volume.y * circY;
        }
        
        void main() {
          // current position to sample at
          // [-0.5 .. 0.5] to [tMin .. tMax]
          float t = tMin + (pos + 0.5) * tRange;
        
          // build our tube geometry
          vec2 volume = vec2(thickness);
                
          // build our geometry
          vec3 transformed;
          vec3 objectNormal;
          createTube(t, volume, transformed, objectNormal);
        
          // pass the normal and UV along
          vec3 transformedNormal = normalMatrix * objectNormal;
          vNormal = normalize(transformedNormal);
          vUv = uv.yx; // swizzle this to match expectations
        
          // project our vertex position
          vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
        `
    }

    fragmentShader() {
        return `
        void main() {
            gl_FragColor = vec4(0.1,0.8,0.1,1.0);
        }
        `
    }

}