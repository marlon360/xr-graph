# Documentation: The graph

The graph takes a function as a String and renders a 3D representation of this function.

## Parse the String

In order to know which vertices the graph has to render, we have to parse the String to a Javascript function and a GLSL function.
The package `expr-eval` is a convenient library to parse a String to a Javascript function.
With this Javascript function we can easily generate Geometries with Three.js' `ParametricGeometry` class on the CPU which results in mesh of the Graph.
But it is not very performant to generate the vertices on the CPU especially when the vertices change a lot. This app is made for interaction with the graph and its parameters so we need a better way to generate the vertices.
Rendering on the GPU is way more performant compared to the CPU. So we write a GLSL shader to display the vertices. The `expr-eval` package only supports conversions to Javascript functions, so we have to extend this package to support GLSL code.

## Shader

After we converted the function String to GLSL code, we have to write the shader.
In WebGL we have the ability to implement custom Vertex-Shader and Fragment-Shader.
What we need is the Vertex-Shader, which manipulates the vertices of a geometry.

We have to instantiate a `PlaneBufferGeometry` with 200 subdivision (higher subdivisions = smoother graph). This gives us coordinates from (0,0,0) to (200,200,0). This represents the UV-coordinatesystem.
The Vertex-Shader takes the the original coordinates and transforms them with the given function to the resulting vertex position.

## Manipulating the graph

A shader is able to open some properties to the CPU. These are called `uniforms`.
Our shader implementation automatically generates uniforms for all variables of the function.
Now it is possible to interact with the graph without any performance loss.

## Drawbacks

If you modify the geometry with the GPU, the CPU has no information about the new geometry.
This is problematic for the implementation of collider boxes, because collision detection is handled on the CPU.

Shading is also problematic. If you modify the geometry, the normals will change too. But you cannot calculate the new normals in the Vertex-Shader. But to achieve Lambert or Phong Shading you need the new normals. This would be possible with a Geometry-Shader, which is not available in WebGL at the moment.