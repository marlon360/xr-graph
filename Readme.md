# XR Graph

With XR Graph it is possible to view mathematical graphs in VR and AR.
With the provided browser extension you can view functions directly from [https://wolframalpha.com](https://wolframalpha.com), [http://weitz.de/plot](http://weitz.de/plot) or [https://www.google.com/](https://www.google.com/).

![WebVR](./media/webxr.gif)

![AR](./media/ar.gif)

## Browser Extensions

Firefox: [XR Graph - Browser Integration](https://addons.mozilla.org/en-US/firefox/addon/xr-graph-browser-integration/)

Chrome: [XR Graph - Browser Integration](https://chrome.google.com/webstore/detail/xr-graph-browser-integrat/mkapnmjibodohclhpalpcohdibinijfi?hl=en)

## How to run locally
0. Requirements
    - Node.js
    - NPM

1. Navigate to the `webxr` folder.

`cd webxr`

2. Install dependencies

`npm install`

3. Start Development Server

`npm start`

4. Navigate to [https://localhost:8080](https://localhost:8080) for VR experience

5. Navigate to [https://localhost:8080/ar.html](https://localhost:8080/ar.html) for AR experience

Marker for AR:

<img src="./webxr/src/images/marker.png" alt="ar marker" width="300"/>

## Documentation

[The Surface Graph](./docs/graph.md)

[Browser Extension](./docs/browser_extension.md)
