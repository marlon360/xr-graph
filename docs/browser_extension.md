# Documentation: Browser Extension

This webapp has intentionally no input for functions.
It is hard to type with VR controllers and there are many other apps that handle function input.
We built a browser extension, which automatically detects math-websites and transfers the functions to this app.

## Open API

The xr-graph app takes function inputs through GET-Parameters. To display a custom function the requested URL has to be changed.

## weitz.de

At [http://weitz.de/plot](http://weitz.de/plot) you can scroll through a collection of interesting functions. This website exposes the parameters like the function-text, parameter extrema and variables as GET-Parameters.

The browser extension detects the url of the current website. If the url contains `weitz.de/plot` it searches the GET parameters for functions. If all required parameters are found it adds a button to the website, which refers to the xr-graph website.