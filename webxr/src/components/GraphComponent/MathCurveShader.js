export class MathCurveMaterial {

    constructor(expression, subdivisions) {

        this.expression = expression;

        this.uniforms = {
            thickness: { type: 'float', value: 0.1 },
            time: { type: 'float', value: 0 },
            radialSegments: { type: 'float', value: 8 },
            subdivisions: { type: 'float', value: subdivisions },
            yBoundaryMin: {type: 'float', value: -3.2},
            yBoundaryMax: {type: 'float', value: 3.2},
          }

        this.expression.getParameters().forEach(param => {
            this.uniforms[`${param}Min`] = { type: 'float', value: -6.0 }
            this.uniforms[`${param}Max`] = { type: 'float', value: 6.0 }
        });

        this.expression.getVariables().forEach(param => {
            this.uniforms[param] = { type: 'float', value: 1.0 }
        });

        this.vertexIdentifier = ["x", "y", "z"];

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            side: THREE.DoubleSide,
            fragmentShader: this.fragmentShader(),
            vertexShader: this.vertexShader()
        })        
    }

    getGLSLFunctionString() {
        let glslString = this.expression.getGLSLFunctionString();
        const params = this.expression.getParameters()
        if (this.expression.getOutputSize() == 2) {
            return `vec3(${glslString}.x, 0, ${glslString}.y)`;
        } else if (this.expression.getOutputSize() == 1) {
            return `vec3(${params[0]}, 0,${glslString})`;
        } else {
            return glslString;
        }
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

        ${this.expression.getParameters().map((param) => `uniform float ${param}Min;\nuniform float ${param}Max;\n`).join("\n")}

        ${this.expression.getVariables().map((param) => `uniform float ${param};`).join("\n")}
        
        // pass a few things along to the vertex shader
        varying vec2 vUv;
        varying float parameter;
        varying float parameterRange;
        varying vec3 vViewPosition;
        varying vec3 vNormal;
        
        vec3 sample (${this.expression.getParameters().map((param) => `float ${param}`).join(",")}) {
          vec3 newpos = ${this.getGLSLFunctionString()};
          return newpos.xzy * vec3(1.0, 1.0, -1.0);;
        }

        vec3 getTangent (vec3 a, vec3 b) {
            return normalize(b - a);
        }

        void rotateByAxisAngle (inout vec3 normal, vec3 axis, float angle) {
            // http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm
            // assumes axis is normalized
            float halfAngle = angle / 2.0;
            float s = sin(halfAngle);
            vec4 quat = vec4(axis * s, cos(halfAngle));
            normal = normal + 2.0 * cross(quat.xyz, cross(quat.xyz, normal) + quat.w * normal);
        }

        
        void createTube (float t, vec2 volume, out vec3 outPosition, out vec3 outNormal) {
            // Reference:
            // https://github.com/mrdoob/three.js/blob/b07565918713771e77b8701105f2645b1e5009a7/src/extras/core/Curve.js#L268
            float nextT = t + (1.0 / subdivisions);

            // find first tangent
            vec3 point0 = sample(0.0);
            vec3 point1 = sample(1.0 / subdivisions);

            vec3 lastTangent = getTangent(point0, point1);
            vec3 absTangent = abs(lastTangent);

            float min = 99999999999999999999999.0;
            vec3 tmpNormal = vec3(0.0);
            if (absTangent.x <= min) {
              min = absTangent.x;
              tmpNormal.x = 1.0;
            }
            if (absTangent.y <= min) {
              min = absTangent.y;
              tmpNormal.y = 1.0;
            }
            if (absTangent.z <= min) {
              tmpNormal.z = 1.0;
            }

            vec3 tmpVec = normalize(cross(lastTangent, tmpNormal));
            vec3 lastNormal = cross(lastTangent, tmpVec);
            vec3 lastBinormal = cross(lastTangent, lastNormal);
            vec3 lastPoint = point0;

            vec3 normal;
            vec3 tangent;
            vec3 binormal;
            vec3 point;
            float maxLen = (subdivisions - 1.0);
            float epSq = 0.0000000001 * 0.0000000001;
            const float loopLength = 100.0;
            for (float i = 1.0; i < loopLength; i += 1.0) {
                float range = ${this.expression.getParameters()[0]}Max - ${this.expression.getParameters()[0]}Min;
                float u = ${this.expression.getParameters()[0]}Min + i / maxLen * range;
                // could avoid additional sample here at expense of ternary
                // point = i == 1.0 ? point1 : sample(u);
                point = sample(u);
                tangent = getTangent(lastPoint, point);
                normal = lastNormal;
                binormal = lastBinormal;

                tmpVec = cross(lastTangent, tangent);
                if ((tmpVec.x * tmpVec.x + tmpVec.y * tmpVec.y + tmpVec.z * tmpVec.z) > epSq) {
                    tmpVec = normalize(tmpVec);
                    float tangentDot = dot(lastTangent, tangent);
                    float theta = acos(clamp(tangentDot, -1.0, 1.0)); // clamp for floating pt errors
                    rotateByAxisAngle(normal, tmpVec, theta);
                }

                binormal = cross(tangent, normal);
                if (u >= t) break;

                lastPoint = point;
                lastTangent = tangent;
                lastNormal = normal;
                lastBinormal = binormal;
            }

            // extrude outward to create a tube
            float tubeAngle = angle;
            float circX = cos(tubeAngle);
            float circY = sin(tubeAngle);

            // compute the TBN matrix
            vec3 T = tangent;
            vec3 B = binormal;
            vec3 N = -normal;

            // extrude the path & create a new normal
            outNormal.xyz = normalize(B * circX + N * circY);
            outPosition.xyz = point + B * volume.x * circX + N * volume.y * circY;
        }
        
        void main() {
          float ${this.expression.getParameters()[0]}Range = ${this.expression.getParameters()[0]}Max - ${this.expression.getParameters()[0]}Min;
          // current position to sample at
          // [-0.5 .. 0.5] to [tMin .. tMax]
          float t = (pos * 2.0) * 0.5 + 0.5;
          t = ${this.expression.getParameters()[0]}Min + t * ${this.expression.getParameters()[0]}Range;
        
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