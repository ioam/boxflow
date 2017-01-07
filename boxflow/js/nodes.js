'use strict';
// ### Introduction
//
// In this file, ``Node`` classes are defined, designed to hold state
// without any code directly related to rendering. For instance, methods
// might specify the height of a node without offering any way to
// concretely visualize that height.
//
// The ``Node`` types are as follows:
//
// * BaseNode: A rectangle with input/output ports.
// * LabelledNode : Extends BaseNode with a title and label state.
// * ImageNode: Extends  LabelledNode with an attached image.
// * Viewport: A special resizable image node without a title or labels.

class BaseNode {
    // A Node has parameters and declares a style and in/out port styles
    constructor({ name = 'default',
                  type = 'untyped',
                  inputs=[],
                  outputs=[],
                  params = {},
                  // Geometry
                  pos = [0,0],
                  width = 100,
                  smooth = 10,
                  // Node settings
                  port_gap_ratio = 0.25,

                  // Styles
                  style     = { fill: 'Silver',
                                stroke : 'black',
                                strokeWidth : 3 },
                  input_style  = { fill: 'white' },
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
        // 'Locked' parameters bound by connectors
        this.locked_params = _.mapObject(this.params, (k,v) => { return false});

        this.port_gap_ratio = port_gap_ratio;

        this.style = style ;
        this.input_style = input_style;
        this.output_style = output_style;

        this.geom = {
            left: pos[0], top: pos[1],
            width: width,
            port_radius : 7,
            rx: smooth, ry: smooth};

        // Unscaled height of header area
        // Subclasses can set this property
        this.header_height = 0;
    }

    lock_param(param, state=true) {
        this.locked_params[param]=state;
    }


    unlocked_params(plims=undefined) {
        if ((plims !== undefined) && (Object.keys(plims).length == 0)) {
            return []
        }
        let unlocked = [];
        for (let param of Object.keys(this.params)) {
            if (plims && plims[param]=='untyped-port') {
                continue }
            else if (!(this.locked_params[param])) {
                unlocked.push(param);
            }
        }
        return unlocked
    }

    ports_height() {
        // Unscaled height of the parameter block
        return this.maxrows() * this.port_spacing();
    }

    port_spacing() {
        return this.geom.width * this.port_gap_ratio;
    }

    port_position(port, port_type='input') {
        let width = this.geom.width;
        let ypos =   ( this.header_height + this.port_spacing()/2.0
                       + this.row(port, port_type) * this.port_spacing());
        return [port_type == 'input' ? 0  : width, ypos];
    }

    row(port, type) {
        // Given a port name, return the corresponding row
        // Note that dest nodes (inputs) are below the output rows
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
                                fontFamily : 'Monospace'},

                  label_opts = {size: 12,
                                fontFamily : 'Arial'}
                } = {}) {
        super(arguments[0]);

        this.title_opts = title_opts;
        this.label_opts = label_opts;

        // To be set by LabelledBox
        this.title_height = 0
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
        // Actual image state. I.e will be set to a fabric Image object.
        this.image = undefined;
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

// <!-- Remove once mapping system complete -->
class Node extends ImageNode {

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
