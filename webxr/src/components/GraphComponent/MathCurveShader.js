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
        varying float parameter;
        varying float parameterRange;
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
          parameter = t;
        
          // pass the normal and UV along
          vec3 transformedNormal = normalMatrix * objectNormal;
          vNormal = normalize(transformedNormal);
          vUv = uv.yx; // swizzle this to match expectations
          parameterRange = ${this.expression.getParameters()[0]}Range;
        
          // project our vertex position
          vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
        `
    }

    fragmentShader() {
        return `
        varying float parameter;
        varying float parameterRange;

        float HueToRGB(float f1, float f2, float hue) {
            if (hue < 0.0)
                hue += 1.0;
            else if (hue > 1.0)
                hue -= 1.0;
            float res;
            if ((6.0 * hue) < 1.0)
                res = f1 + (f2 - f1) * 6.0 * hue;
            else if ((2.0 * hue) < 1.0)
                res = f2;
            else if ((3.0 * hue) < 2.0)
                res = f1 + (f2 - f1) * ((2.0 / 3.0) - hue) * 6.0;
            else
                res = f1;
            return res;
        }

        vec3 HSLToRGB(vec3 hsl) {
            vec3 rgb;

            if (hsl.y == 0.0) {
                rgb = vec3(hsl.z); // Luminance
            }
            else {
                float f2;
                
                if (hsl.z < 0.5)
                    f2 = hsl.z * (1.0 + hsl.y);
                else
                    f2 = (hsl.z + hsl.y) - (hsl.y * hsl.z);
                
                float f1 = 2.0 * hsl.z - f2;
                
                rgb.r = HueToRGB(f1, f2, hsl.x + (1.0/3.0));
                rgb.g = HueToRGB(f1, f2, hsl.x);
                rgb.b= HueToRGB(f1, f2, hsl.x - (1.0/3.0));
            }
            return rgb;
        }

        vec4 userDefinedColor() {
            float h = 0.7 * parameter / parameterRange;
            float s = 1.0;
            float l = 0.5;
            return vec4(HSLToRGB(vec3(h, s, l)), 1.0);
        }

        void main() {
            gl_FragColor = userDefinedColor();
        }
        `
    }

}