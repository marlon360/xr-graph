import { DoubleSide, Color, ShaderMaterial } from 'three';

export class MathGraphMaterial {

    constructor(expression) {

        this.expression = expression;

        const squareImageUrl = require('../../images/square.png').default;
        var loader = new THREE.TextureLoader();
        var texture = loader.load(squareImageUrl);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

        this.uniforms = {
            colorB: {type: 'vec3', value: new Color(0xACB6E5)},
            colorA: {type: 'vec3', value: new Color(0x74ebd5)},
            zMin: {type: 'float', value: -2},
            zMax: {type: 'float', value: 1},
            texture1: { type: "t", value:texture },
            repeat: { type: "float", value: 10 },
            wireframeActive: { type: "bool", value: true}
        }

        this.expression.getParameters().forEach(param => {
            this.uniforms[`${param}Min`] = {type: 'float', value: -6.0}
            this.uniforms[`${param}Max`] = {type: 'float', value: 6.0}
        });

        this.expression.getVariables().forEach(param => {
            this.uniforms[param] = {type: 'float', value: 1.0}
        });

        this.vertexIdentifier = ["x", "y", "z"];

        this.material = new ShaderMaterial({
            uniforms: this.uniforms,
            side: DoubleSide,
            fragmentShader: this.fragmentShader(),
            vertexShader: this.vertexShader(),
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
        varying vec2 vUv;
        varying vec3 pos;
        
        ${this.expression.getParameters().map((param) => `uniform float ${param}Min;\nuniform float ${param}Max;\nfloat ${param}Range = ${param}Max - ${param}Min;\n`).join("\n")}

        ${this.expression.getVariables().map((param) => `uniform float ${param};`).join("\n")}

        vec3 userDefinedPosition() {
            ${this.expression.getParameters().map((param, index) => `float ${param} = ${param}Min + (position.${this.vertexIdentifier[index]} + 0.5) * ${param}Range;`).join("\n")}
            return ${this.getGLSLFunctionString()};
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
        uniform sampler2D texture1;
        uniform float repeat;
        uniform bool wireframeActive;

        uniform float zMin; 
        uniform float zMax; 

        float yRange = zMax - zMin;

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
            float h = 0.7 * (zMax - pos.y) / yRange;
            float s = 1.0;
            float l = 0.5;
            return vec4(HSLToRGB(vec3(h, s, l)), 1.0);
        }

        void main() {
            vec4 color = userDefinedColor();
            if (wireframeActive) {
                color = color * texture2D(texture1, vUv * repeat);
            }
            gl_FragColor = color;
        }
        `
    }

}