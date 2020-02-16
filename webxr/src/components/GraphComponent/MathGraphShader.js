export class MathGraphMaterial {

    constructor(expression) {

        this.expression = expression;

        this.uniforms = {
            colorB: {type: 'vec3', value: new THREE.Color(0xACB6E5)},
            colorA: {type: 'vec3', value: new THREE.Color(0x74ebd5)},
            yBoundaryMin: {type: 'float', value: -3.2},
            yBoundaryMax: {type: 'float', value: 3.2},
            wireframeActive: { type: "bool", value: false}
        }

        this.expression.getParameters().forEach(param => {
            this.uniforms[`${param}Min`] = {type: 'float', value: -6.0}
            this.uniforms[`${param}Max`] = {type: 'float', value: 6.0}
        });

        this.expression.getVariables().forEach(param => {
            this.uniforms[param] = {type: 'float', value: 1.0}
        });

        this.vertexIdentifier = ["x", "y", "z"];

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            side: THREE.DoubleSide,
            fragmentShader: this.fragmentShader(),
            vertexShader: this.vertexShader(),
            transparent: true
        })
    }

    getGLSLFunctionString() {
        const params = this.expression.getParameters()
        let glslString = this.expression.getGLSLFunctionString();
        if (this.expression.getOutputSize() == 1 && this.expression.getInputSize() == 2) {
            return `vec3(${params[0]},${params[1]}, ${glslString})`;
        } else if (this.expression.getOutputSize() == 2) {
            return `vec3(0,${glslString})`;
        } else {
            return glslString;
        }
    }

    vertexShader() {
        return `
        varying vec2 vUv;
        varying vec3 pos;
        
        ${this.expression.getParameters().map((param) => `uniform float ${param}Min;\nuniform float ${param}Max;\nfloat ${param}Range = ${param}Max - ${param}Min;\n`).join("\n")}

        ${this.expression.getVariables().map((param) => `uniform float ${param};`).join("\n")}

        vec3 userDefinedPosition() {
            ${this.expression.getParameters().map((param, index) => `float ${param} = ${param}Min + (position.${this.vertexIdentifier[index]} + 0.5) * ${param}Range;`).join("\n")}
            vec3 newpos = ${this.getGLSLFunctionString()};
            return newpos.xzy * vec3(1.0, 1.0, -1.0);
        }
    
        void main() {
            vUv = uv; 

            vec3 new_position = userDefinedPosition();
            pos = new_position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(new_position, 1.0);
        }
        `
    }

    fragmentShader() {
    return `
        uniform bool wireframeActive;

        uniform float yBoundaryMin; 
        uniform float yBoundaryMax; 

        float range = yBoundaryMax - yBoundaryMin;

        varying vec2 vUv;
        varying vec3 pos;

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
            float h = 0.7 * (yBoundaryMax - pos.y) / range;
            float s = 1.0;
            float l = 0.5;
            return vec4(HSLToRGB(vec3(h, s, l)), 1.0);
        }

        void main() {
            vec4 color = userDefinedColor();
            if (wireframeActive) {
                if (mod(vUv.x, 0.02) < 0.003 || mod(vUv.y, 0.02) < 0.003) {
                    color = vec4(0.1, 0.1, 0.1, 1);
                } else {
                    color = vec4(color.xyz, 0.7);
                }
            }
            gl_FragColor = color;
        }
        `
    }

}