



// For reference:
//
//https://stackoverflow.com/questions/29829475/
//  how-to-get-the-canvas-relative-position-of-an-object-that-is-in-a-group
//
// https://stackoverflow.com/questions/14935556/bounding-box-offset-of-fabricjs-path#17140056
class Connector {
    // A connector is the visual representation of an edge

    static connector_coords(edge) {
        let srcbox = view.lookup(edge.src);
        let destbox = view.lookup(edge.dest);
        let srcport = view.lookup_port(srcbox, 'output', edge.output);
        let destport = view.lookup_port(destbox, 'input', edge.input);
        return {'x1':srcbox.left + (srcbox.width/2.0)*srcbox.scaleX + srcport.left,
                'y1':srcbox.top + (srcbox.height/2.0)*srcbox.scaleY + srcport.top,
                'x2':destbox.left + (destbox.width/2.0)*destbox.scaleX + destport.left,
                'y2':destbox.top + (destbox.height/2.0)*destbox.scaleY + destport.top
               };
    }

    static update_connector(view, edge) {
        // Sync geometry of connector with corresponding edge
        if (edge == undefined)  {console.log('Cannot find connector'); return}
        let connector = view.lookup(edge);
        connector.set(this.connector_coords(edge));
        connector.setCoords(); // Update selection bbox region
        view.canvas.sendToBack(connector); // z-order control
    }

    static connector_glyph(edge) {
        // Given an edge, create a new fabric object as a connector
      let coords = this.connector_coords(edge);
        return new fabric.Line([coords['x1'], coords['y1'], coords['x2'],coords['y2']],
                               { name : edge.name,
                                 strokeWidth : 3,
                                 fill : '#fff',
                                 stroke : '#666',
                                 originX : 'center',
                                 originY : 'center',
                                 lockMovementX : true,
                                 lockMovementY : true,
                                 selectable : true,
                                 hasControls: false,
                                 hasBorders : false,
                                 perPixelTargetFind : true,
                                 targetFindTolerance : 20
                               });
    }

    static make_connector(view, edge) {
        // Make the glyph, add it to the canvas and send to back
        let glyph = this.connector_glyph(edge);
        view.canvas.add(glyph);
        view.canvas.sendToBack(glyph); // z-order control
    }

}

class View {
    // A View is the visual representation of the entire graph
    constructor(canvas) {
        this.canvas = canvas;

    }

    lookup(obj) {
        // Return the fabric object corresponding to the Node/Edge (optionally by name )
        let name = (typeof obj) == 'string' ? obj : obj.name;
        for (let object of this.canvas.getObjects() ) {
            if ( object.name === name ) { return object }
        }
    }

    lookup_port(spec, port_type, name) {
        // Lookup port of given type and name on given node (by name) or group
        let group = (typeof spec) == 'string' ? this.lookup(obj) : spec;
        let prefix = (port_type === 'input') ? 'inport-' : 'outport-';
        for (let obj of group.getObjects()) {
            if (obj.name) {
                if (obj.name.startsWith(prefix) && (obj.param == name)) {
                    return obj
                }
            }
        }
    }

    add_node(graph, type, name, options={}) { // TODO: Work by group
        let opts = {
            name: name,
            type : type,
            params : graph.defs.default_params(type),
            labels : graph.defs.default_params(type, 'label'),
            buttons : graph.defs.default_buttons(type),
            inputs : graph.defs.input_names(type),
            outputs: graph.defs.output_names(type),
            param_modes: graph.defs.default_params(type, 'mode')
        }

        let nodetype = graph.defs.nodetype(type);
        graph.add_node( new nodetype(_.extend(opts, options)));
        this.canvas.clear();
        this.render(graph);
    }

    render(graph) {
        for ( let node of graph.nodes ) {
            // Need a mapping from node type to box type
            let boxtype = graph.defs.boxtype(node.type);
            this.canvas.add(
                boxtype.make_nodebox(node)
            )
        }
        for ( let edge of graph.edges ) {
            Connector.make_connector(this, edge);
        }
    }

    remove(graph, name, comm=true) {
        let object = this.lookup(name);
        if (object === undefined) { return}
        if ('node' in object ) {
            let edges = graph.node_edges(object.node, 'input')
                .concat(graph.node_edges(object.node, 'output'));
            for ( let edge of edges ) {
                canvas.remove(this.lookup(edge));
            }
        }
        this.canvas.remove(object);
        graph.remove(name, comm)
    }
}
