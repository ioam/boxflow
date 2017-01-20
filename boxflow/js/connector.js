'use strict';
// Supplies ConnectionTool that allows drag creation of connections/edges

class ConnectionTool {

    constructor(canvas, graph, view, marker_tool) {
        this.canvas = canvas;
        this.graph = graph;
        this.view = view;
        this.marker_tool = marker_tool;

        this.reset();
        this.style = { strokeWidth : 3,
                       fill : '#fff',
                       originX : 'center',
                       originY : 'center',
                       stroke : '#666'};
    }

    reset() {
        // Reset the tool state
        if (this.connector) {
            this.canvas.remove(this.connector);
        }
        if (this.src) {
            this.src.lockMovementX = false;
            this.src.lockMovementY = false;
        }
        this.x1 = this.y1 = undefined;
        this.src = this.connector = this.output = undefined;
    }

    node_event(e) {
        // Predicate: whether mouse event occurs on a node
        return (e.target && 'node' in e.target);
    }

    isport(subtarget, type) {
        // Predicate: whether subtarget is of the specified port type
        let name = !subtarget || (subtarget.name === undefined) ? '' : subtarget.name;
        return name.startsWith( type === 'input' ? 'inport-' : 'outport-' )
    }

    mouse_up(e) {
        if ( this.node_event(e) ) {
            let dest = e.target;
            let subtarget = e.subTargets[0];
            // Hovering over input port - connect
            if (this.src && this.isport(subtarget, 'input')) {
                let edge = this.graph.add_edge(this.src.node,
                                               this.output,
                                               dest.node,
                                               subtarget.param);

                // Update GUI for newly hidden parameters
                dest.node.lock_param(subtarget.param);
                this.marker_tool.update_marked_gui();
                Connector.make_connector(this.view, edge);
                Connector.update_connector(this.view, edge)
            }
        }
        this.reset(); // Reset tool whether connection made or not
    }

    mouse_down(e) {
        if ( this.node_event(e) ) {
            this.src = e.target;
            let subtarget = e.subTargets[0];
            if (this.isport(subtarget, 'output')) {
                this.src.lockMovementX = true;
                this.src.lockMovementY = true;
                this.output = subtarget.param;
                this.x1 = this.src.left + this.src.width;
                this.y1 = this.src.top + (this.src.height/2.0) + subtarget.get('top');
            }
            this.src.dirty = true;        // Force refresh of fabric.Group
        }
    }

    mouse_move(e) {
        let pointer = this.canvas.getPointer(e.e);
        if (this.x1 && this.y1) {

            if (!this.connector) {
                let coords = [this.x1, this.y1, pointer.x, pointer.y];
                this.connector = new fabric.Line(coords, this.style);
                canvas.add(this.connector);
            }
            else {
                this.connector.set({ 'x2': pointer.x, 'y2':pointer.y});
            }
            this.canvas.renderAll();
        }
    }
}
