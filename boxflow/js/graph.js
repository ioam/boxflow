'use strict';

class Graph {
    // A graph is a collection of nodes and edges
    constructor({defs=undefined,  nodes=[], edges=[], commlink=undefined} = {} ) {
        this.defs = defs;
        this.nodes = nodes;
        this.edges = edges;
        this.commlink = commlink;
    }

    // Must be a shorter way...
    find_node(name) {
        // Find a node by name
        for (let node of this.nodes) {
            if (node.name === name) {
                return node
            }
        }
    }

    find_edge(name) {
        // Find an edge by name
        for (let edge of this.edges) {
            if (edge.name === name) {
                return edge
            }
        }
    }

    add_node(node) {
        this.nodes.push(node);
        this.commlink && this.commlink.add_node(node);
    }

    add_edge(src, output, dest, input) {
        if ( !_.contains(this.nodes, src) ) {
            throw 'Source node not in graph.';
        }
        if ( !_.contains(this.nodes, dest) ) {
            throw 'Destination node not in graph.';
        }
        let edge = new Edge(src,output,dest, input);
        this.edges.push(edge);
        this.commlink && this.commlink.add_edge(edge);
        return edge
    }

    new_name(type) {
        // Suggest a new name for an instance of the given type
        let existing = [];
        let num = 0;
        for (let node of this.nodes) {
            if (node.type === type) {
                existing.push(node.name);
            }
        }
        while ( _.contains(existing, type.toLowerCase() + ':' + num) ) {
            num += 1;
        }
        return type.toLowerCase() + ':' +num
    }

    node_edges(node, type) {
        // Return either the 'input' or 'output' edges of a node
        let matches = [];
        for ( let edge of this.edges ) {
            if ( ( type === 'output') && ( edge.src === node ) ) {
                matches.push(edge); }
            if ( ( type === 'input') && ( edge.dest === node ) ) {
                matches.push(edge); }
        }
        return matches
    }

    remove(name) {
        // Remove edge or node by name. If a node is removed, also remove edges
        if ( name.startsWith('edge-') ) {
            let edge = this.find_edge(name);
            // Update GUI for newly unlocked parameters
            edge.dest.lock_param(edge.input, false);
            // this.gui.populate(dest.node);

            this.commlink && this.commlink.remove_edge(edge);
            this.edges = _.difference(this.edges, [edge]);
        }
        else {
            let node = _.findWhere(this.nodes, {'name':name});
            this.commlink && this.commlink.remove_node(node);
            this.nodes = _.difference(this.nodes, [node]);

            let removed_edges = this.node_edges(node, 'input')
                .concat(this.node_edges(node, 'output'));

            for (let edge of removed_edges) {
                this.remove(edge.name);
            }
        }

    }
}


class Edge {
    // An Edge connects a source node output to a dest node input
    constructor(src, output, dest, input) {

        this.validate(src, output, dest, input);
        this.src = src;
        this.dest = dest;
        this.input = input;
        this.output = output;
        this.name = 'edge-' + _.UUID();

    }

    validate(src, output, dest, input) {
        if ( !_.contains(src.outputs, output) ) {
            throw 'Specified output not in source node outputs.';
        }
        if ( !_.contains(dest.inputs, input) )  {
            throw 'Specified input not in source node inputs.';
        }
    }
}


class Definitions {
    // Manages the graph node definitions:
    //  * Associates node types to the input/output params and their properties

    constructor(definitions={}, order=undefined) {
        this.definitions = definitions;
        this.order = order; // TODO: Make use of order

        this.boxtypes={'Node': NodeBox,
                       'Viewport': ViewportBox,
                       'LabelledNode': LabelledBox}
    }

    param(name, value=true, lims=[], step=null) {
        // Using defaults, a boolean parameter (checkbox) is defined
        return {name: name, value : value, lims:lims, step: step}
    }

    default_params(type, field='value') {
        // Generate a default parameters object for the given type
        // A value of 'untyped-port' for lims results in it being skipped
        let params = {};
        for (let pdef of this.definitions[type].inputs) {
            if (pdef.lims !== 'untyped-port') {
                params[pdef.name] = pdef[field];
            }
        }
        return params
    }

    define(type, inputs, outputs) {
        // Define the input and output params of a node type
        this.definitions[type] = {inputs: inputs, outputs : outputs}

    }

    input_names(type) {
        // Get the input param names for a node
        return _.pluck(this.definitions[type].inputs, 'name')
    }

    output_names(type) {
        // Get the output param names for a node
        return _.pluck(this.definitions[type].outputs, 'name')
    }

    types() {
        // Returns an array of node types
        let keys = Object.keys(this.definitions);
        return keys.sort()
    }

    nodetype(type) {
        // Return the node class
        // (must support name, type, params, inputs, outputs)
        // Currently returning the top-level Node unless the type is 'Viewer'
        // TODO: Generalize!
        if (type==='Viewport') {
            return Viewport
        }
        // FIXME! Height seems to include image height somehow in demo graph
        // if (type == 'Mul') {
        //     return LabelledNode }
        return Node
    }

    boxtype(type) {
        // Returns a box class (i.e a static class for rendering nodes)
        // Currently a 1-to-1 relation.
        // If you want a different boxtype for the same type of node,
        // a trivial subclass is easy enough to make.
        return this.boxtypes[this.nodetype(type).name]
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
