import { MeshText2D, textAlign } from 'three-text2d'

AFRAME.registerComponent('graph-variable-ui', {
    schema: {
        graph: {
            type: "selector"
        }
    },
    init: function() {
        if (this.data.graph == null) {
            throw new Error("Graph Object not found!")
        }
        this.graph = this.data.graph.components["graph"];
        if (this.graph == null) {
            throw new Error("Graph Component not found!")
        }

        this.data.graph.addEventListener("function-changed", () => {
            this.setup();
        })
                
        this.setup()
    },
    setup: function() {
        this.el.innerHTML = "";
                        
        this.variables = this.graph.getVariables();

        const height = 0.30;
        const offset = Object.keys(this.variables).length * height / 2;

        let index = 0;
        for (let [variable, value] of Object.entries(this.variables)) {
            let slider = this.createSlider(variable, parseFloat(value), parseFloat(this.graph.data[variable+"Min"]), parseFloat(this.graph.data[variable+"Max"]));
            slider.setAttribute('position', `0 ${index * -height + offset} 0`)
            slider.addEventListener('change', (evt) => {
                var newvalue = evt.detail.value;
                let graphAtributes = {}
                graphAtributes[variable] = newvalue;
                this.data.graph.setAttribute('graph', graphAtributes)
            })
            this.el.appendChild(slider)
            index++;
        }
    },
    createSlider: function(variable, value, min, max) {
        if ((min == null || isNaN(min)) && (max == null || isNaN(max))) {
            min = value - 1
            max = value + 1
        } else if ((min == null || isNaN(min)) && (max != null && !isNaN(max))) {
            min = value - 1;
        } else if ((min != null && !isNaN(min)) && (max == null || isNaN(max))) {
            max = value + 1;
        }        
        const slider = document.createElement("a-entity");
        slider.setAttribute('my-slider', {
            title: `${variable}Value`,
            value,
            min,
            max
        })
        return slider;
    }
})