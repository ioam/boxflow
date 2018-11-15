'use strict';
// ### Introduction
//
// In this file, the ``Node`` classes are defined, designed to hold
// state without any code directly related to rendering. For instance,
// methods might specify the height of a node without offering any way
// to concretely visualize that height.
//
// The ``Node`` types are as follows:
//
// * ``BaseNode``: A rectangle with input/output ports.
// * ``LabelledNode`` : Extends BaseNode with a title and label state.
// * ``ImageNode``: Extends  LabelledNode with an attached image.
// * ``Viewport``: A special resizable image node without a title or labels.




class BaseNode {
    // A Node has parameters and declares a style and in/out port styles
    constructor({ name = 'default',
                  type = 'untyped',
                  inputs=[],                     // Input/output parameter names
                  outputs=[],
                  params = {},                    // Parameter state
                  labels = {},
                  buttons = {},                   // Button state
                  param_modes = {},
                  pos = [0,0],                    // Geometry
                  width = 100,
                  smooth = 10,
                  port_gap_ratio = 0.25,          // Port settings
                  style     = { fill: '#5a9bd3',   // Styles
                                stroke : '#4e58bf',
                                strokeWidth : 4 },
                  input_style  = { fill: '#96b38b' },
                  output_style = { fill: 'DarkGoldenRod' }
                } = {} ) {

        if ( (inputs.length + outputs.length) == 0 ) {
            throw 'The number of inputs and output must not be zero.';
        }

        this.name = name;
        this.type = type,
        this.inputs = inputs;
        this.outputs = outputs;
        this.params = params;
        this.labels = labels;
        this.buttons = buttons;
        this.param_modes = param_modes;
        this._locked_params = _.mapObject(this.params, // Parameters 'locked' by connections
                                          (k,v) => { return false});

        this.port_gap_ratio = port_gap_ratio;

        this.style = style ;
        this.input_style = input_style;
        this.output_style = output_style;

        this.geom = {
            left: pos[0], top: pos[1],
            width: width,
            port_radius : 7,
            rx: smooth, ry: smooth};

        this.header_heights = {};
    }

    header_height() { // Sums the entries in header_heights
        return _.reduce(Object.values(this.header_heights),
                        (a, b) => { return a+b }, 0);
    }

    lock_param(param, state=true) {
        this._locked_params[param]=state;
    }


    unlocked_params(pmode=undefined) {
        if (!(pmode)) {return [] }
        else if (Object.keys(pmode).length == 0) {
            return []
        }
        let unlocked = [];
        for (let param of Object.keys(this.params)) {
            if (pmode[param]=='untyped') {
                continue }
            else if (!(this._locked_params[param])) {
                unlocked.push(param);
            }
        }
        return unlocked
    }

    ports_height() {
        return this.maxrows() * this.port_spacing(); // Unscaled height of the ports
    }

    port_spacing() {
        return this.geom.width * this.port_gap_ratio;
    }

    port_position(port, port_type='input') {
        let width = this.geom.width;
        let ypos =   ( this.header_height() + this.port_spacing()/2.0
                       + this.row(port, port_type) * this.port_spacing());
        return [port_type == 'input' ? 0  : width, ypos];
    }

    row(port, type) {         // Given a port name, return the corresponding row
        // <!-- Note that dest nodes (inputs) are below the output rows -->
        if (type == 'input') {
            return this.inputs.indexOf(port) + this.outputs.length
        }
        else {
            return this.outputs.indexOf(port)
        }
    }

    maxrows() {
        return this.inputs.length + this.outputs.length
    }
}


class LabelledNode extends BaseNode {

    constructor({ title_opts = {size : 12,
                                width_ratio : 0.8,
                                top_padding_ratio : 0.6,
                                fontFamily : 'Arial'},

                  label_opts = {size: 12,
                                fontFamily : 'Arial'}
                } = {}) {
        super(arguments[0]);

        this.title_opts = title_opts;
        this.label_opts = label_opts;

        this.title_height = 0  // To be set by LabelledBox
    }
}



class ImageNode extends LabelledNode {

    constructor( {image_opts = { imdata: undefined,
                                 top:  0,
                                 left: 0,
                                 width : 80,
                                 height : 80,
                                 xres : 256,
                                 yres : 256,
                                 strokeWidth : 5,
                                 stroke : 'black'
                               }
                 }= {}) {
        super(arguments[0]);
        this.image_opts = image_opts;
        this.image = undefined;  // Actual image state ( will be fabric.Image )
    }

    image_scaleX() {
        return this.image_opts.width / this.image_opts.xres;
    }

    image_scaleY() {
        return this.image_opts.height / this.image_opts.yres;
    }

    image_left() {
        // Position depends on whether left/right ports are present
        if (this.inputs.length>0 && this.outputs.length==0) {
            return this.geom.port_radius/2.0
        }
        else if (this.inputs.length>0 && this.outputs.length>0) {
            return this.geom.port_radius/4.0
        }
    }
}


class Viewport extends ImageNode {
// <!-- FIXME should not be hardcoded, but odd results using geom.width/height -->
    constructor() {
        super(arguments[0]);
        this.image_opts.width =  100;
        this.image_opts.height = 100;
    }
}

// Docs Index
//
// [main.js](main.html) :  Toplevel entry point. <br>
// [nodes.js](nodes.html) : Nodes hold semantic and visual state.<br>
// [graph.js](graph.html) : A Graph holds nodes and edges.<br>
// [commlink.js](commlink.html) : Commlink links the graph to the server.<br>
// [utils.js](utils.html) : Simple set of utilities injected into underscore. <br>
// [view.js](view.html) : The View manages graphical state.. <br>
// [boxes.js](boxes.html) : Boxes are the visual representation of nodes. <br>
// [tools.js](tools.html) : Tools respond to interactive events. <br>
// [connector.js](connector.html) : The connection tool has its own file. <br>
