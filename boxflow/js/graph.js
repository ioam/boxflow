'use strict';
// ### Introduction
//

// In this file, the ``Graph``, ``Edge`` and ``Definitions`` classes are
// defined, designed to express the connectivity of the nodes and define
// what parameters are expressed by the nodes.
//
// * ``Graph``: A collection of nodes and edges between them.
// * ``Edge`` : A connection from a source node output to a dest node input.
// * ``Definitions``: The default parameter definitions associated with nodes.


class Graph {
    constructor({defs=undefined,  nodes=[], edges=[], commlink=undefined} = {} ) {
        this.defs = defs;
        this.nodes = nodes;
        this.edges = edges;
        this.commlink = commlink;
    }

    find_node(name) { // Find a node by name
        let matches = this.nodes.filter((n) => { return n.name === name});
        if (matches.length > 1) {
            console.log(`Multiple node matches found for '${name}'`);
        }
        else if (matches.length == 1) {
            return matches[0]
        }
    }

    find_edge(name) { // Find an edge by name
        let matches = this.edges.filter((e) => { return e.name === name});
        if (matches.length > 1) {
            console.log(`Multiple edge matches found for '${name}'`);
        }
        else if (matches.length == 1) {
            return matches[0]
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

    new_name(type) {   // Suggest a new name for an instance of the given type
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

    node_edges(node, type) { // Return either the 'input' or 'output' edges of a node
        let matches = [];
        for ( let edge of this.edges ) {
            if ( ( type === 'output') && ( edge.src === node ) ) {
                matches.push(edge); }
            if ( ( type === 'input') && ( edge.dest === node ) ) {
                matches.push(edge); }
        }
        return matches
    }

    remove(name, comm=true) {
        // Remove edge or node by name. If a node is removed, also remove edges
        // If comm is false, do not update Python over commlink (used for invalid edges).
        if ( name.startsWith('edge-') ) {
            let edge = this.find_edge(name);
            edge.dest.lock_param(edge.input, false);
            this.commlink && comm && this.commlink.remove_edge(edge);
            this.edges = _.difference(this.edges, [edge]);
        }
        else {
            let node = _.findWhere(this.nodes, {'name':name});
            this.commlink && comm && this.commlink.remove_node(node);
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


class Definitions { //  Associates nodes to the input/output param definitions

    constructor(definitions={},
                order=undefined,
                boxes = [LabelledBox, ImageBox, ViewportBox],
                nodes = [LabelledNode, ImageNode, Viewport]) {
        this.definitions = definitions;
        // <!-- TODO: Make use of this order in the GUI -->
        this.order = order;

        this._boxtypes = _.object(_.map(boxes, (bx) => [bx.nodetype(), bx]));
        this._node_names = _.object(_.map(nodes, (nd) => [nd.name, nd]));
    }

    param(name, value=true, lims=[], mode='normal', step=null) { // A parameter definition
        // name:   The name of the parameter.
        // value:  The default parameter values.
        // lims:   Limits based on datgui constraints:
        //   + []         -  Mo limits specified.
        //   + [min, max] -  Minimum/maximum limits.
        //   + [min]      -  Minimum only.
        //   + [['a','b']] - Options
        //
        // step:  The step size for numeric quantities
        // mode: The mode of the port, ie one of...
        //
        //   + 'normal'       - Port with visual port and GUI parameter.
        //   + 'untyped-port' - Port without GUI parameters
        //   + 'no-port'      - GUI parameter but no visual port.
        //
        //   TODO: Support [undefined, max] for maximum limit only.
        return {name: name, value : value, lims:lims, mode: mode, step: step}
    }

    default_params(type, field='value') { // Generate a default parameters object
        let params = {};
        for (let pdef of this.definitions[type].inputs) {
            if (pdef.mode !== 'untyped-port') { // Untyped ports omitted from params.
                params[pdef.name] = pdef[field];
            }
        }
        return params
    }

    define(type, inputs, outputs, nodetype='ImageNode', group='Default') {
        // Define the input and output params of a node type
        // as well as the associated nodetype
        this.definitions[type] = {inputs: inputs,
                                  outputs : outputs,
                                  nodetype:nodetype,
                                  group: group }
    }

    groups() { // Set of groups (currently alphabetically sorted)
        let unique = _.uniq(_.pluck(defs.definitions, 'group'))
        return unique.sort()
    }

    types(group) {  // Returns an array of node types in given group
        let types = [];
        let all_types = Object.keys(this.definitions);
        for (let type of all_types) {
            if (this.definitions[type].group === group) {
                types.push(type);
            }
        }
        return types.sort()
    }

    input_names(type) {  // Get the input param names for a node
        return _.pluck(this.definitions[type].inputs, 'name')
    }

    output_names(type) { // Get the output param names for a node
        return _.pluck(this.definitions[type].outputs, 'name')
    }

    group(type) { // Group name of a node
        return this.definitions[type].group
    }

    nodetype(type) { // Return the appropriate node class for a given type name
        // Note: All node types support: name, type, params, inputs, outputs
        return this._node_names[this.definitions[type].nodetype]
    }

    boxtype(type) {
        // Returns a box class (i.e a static class for rendering nodes)
        // Currently a 1-to-1 relation.
        // If you want a different boxtype for the same type of node,
        // a trivial subclass is easy enough to define.
        return this._boxtypes[this.nodetype(type).name]
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
