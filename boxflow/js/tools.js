// Collection of tools to hook into fabric/DOM events


class MarkerTool {
    // Tool to mark a node and display it with a given stroke color
    constructor(canvas, gui, highlight_tool, select_stroke='blue', deselect_stroke='black') {
        this.canvas = canvas;
        this.gui = gui;
        this.highlight_tool = highlight_tool;
        this.select_stroke = select_stroke;
        this.deselect_stroke = deselect_stroke;
        this.last_selected = undefined;
    }

    selection_cleared() {
        if (this.last_selected) {
            this.last_selected.setStroke(this.deselect_stroke)
            this.highlight_tool.inactive_stroke = this.deselect_stroke;
        }
        this.last_selected = undefined;
    }

    object_selected(e) {
        if (e.target.node && !(e.target === this.last_selected)) {
            if (this.last_selected) {
                this.last_selected.setStroke(this.deselect_stroke)
                this.highlight_tool.inactive_stroke = this.deselect_stroke;
            }
            this.highlight_tool.inactive_stroke = this.select_stroke;
            this.last_selected = e.target;
        }
        else {
            // Keep connectors behind
            this.canvas.deactivateAll()
            e.target.sendToBack();
        }
    }

    update_marked_gui(removal=false) {
        // Update the gui panel of the marked node. Clear if removing.
        if (this.last_selected === undefined) {return}
        else if (this.last_selected.node == undefined) {return}
        else if (removal) {
            this.gui.clear_params();
        }
        else {
            this.gui.populate(this.last_selected.node);
        }
    }
}


class ConnectorMotionTool {
    // Tool to update the connectors when in motion
    constructor(graph, view) {
        this.view = view;
        this.graph = graph;
    }

    object_moving(e) {
        if (e.target.node) {
            let boxtype = this.graph.defs.boxtype(e.target.node.type);
            boxtype.update_node(this.view,
                               this.graph, e.target.node,
                               e.target.left, e.target.top)
        }
    }

    object_scaling(e) {
        if (e.target.node) {
            let boxtype = this.graph.defs.boxtype(e.target.node.type);
            boxtype.update_node(this.view,
                                this.graph, e.target.node,
                                e.target.left, e.target.top)
        }
    }
}


class RightClickDisableTool {
    //Tool to disable right-click context menu
    constructor() {
        fabric.util.addListener(
            document.getElementsByClassName('upper-canvas')[0],
            'contextmenu', function(e) { e.preventDefault(); })
    }
}


class GUITool {
    // Tool that updates the datGUI parameters when an object is selected.
    constructor(gui) {
        this.gui = gui;
    }

    object_selected(e) {
        if (e.target.node) {
            this.gui.populate(e.target.node); //, plims, pstep);
        }
    }

    clear() {
        this.gui.clear_params(true);
    }

}

class CanvasResizeTool {
    // Tool to resize the canvas when the window is resized
    // Can trigger manually:  window.dispatchEvent(new Event('resize'));
    constructor(canvas, canvas_id="c") {
        this.c = document.getElementById(canvas_id);
        this.canvas = canvas;
    }

    activate () {
        window.addEventListener('resize', () => {
            this.c.width = window.innerWidth;
            this.c.height = window.innerHeight;
            this.canvas.setWidth(window.innerWidth);
            this.canvas.setHeight(window.innerHeight);
            this.canvas.calcOffset();
        }, false)
    }
}


class PanningTool {
    // Tool using mouse up/down/move events to implement panning.
    constructor(canvas) {
        this.canvas = canvas;
        this.panning = false;
    }

    mouse_up() {
        this.panning = false;
    }

    mouse_down(e) {
        if ( e.target ) { this.panning = false }
        else {this.panning = true; }
    }

    mouse_move(e) {
        if (this.panning && e && e.e) {
            let delta = new fabric.Point(e.e.movementX, e.e.movementY);
            this.canvas.relativePan(delta);
        }
    }
}


class HighlightTool {
    // Tool to highlight hovered item
    constructor(canvas, active_stroke='red') {
        this.canvas = canvas;
        this.active_stroke   = active_stroke;

        this.inactive_stroke = undefined;
        this.highlighted = undefined;
    }

    mouse_over(e) {
        if ( e.target ) {
            this.inactive_stroke = e.target.getStroke();
            e.target.setStroke(this.active_stroke);
            this.canvas.renderAll();
            this.highlighted = e.target;
        }
    }
    mouse_out(e) {
        if ( e.target ) {
            if (this.inactive_stroke) {
                e.target.setStroke(this.inactive_stroke);
            }
            this.canvas.renderAll();
            this.highlighted = undefined;
        }
    }
}


class ZoomTool {
    // Tool to enable both mousewheel zoom and zoomIn and zoomOut steps
    constructor(canvas, speed=(1.0 / 1200), step=1.1) {
        this.canvas = canvas;
        this.speed = speed;
        this.step = step;
        // Try to remove need for JQuery
        this.wrapperEl = $(canvas.wrapperEl);
    }

    zoom(amount) {
        // TODO: Set zoom point to mouse position
        let point = new fabric.Point(this.canvas.width/2, this.canvas.height/2);
        this.canvas.zoomToPoint(point, this.canvas.getZoom() * amount);
    }

    zoom_handler(e) {
        var delta = e.originalEvent.wheelDelta ? e.originalEvent.wheelDelta : -e.detail*10;
        this.zoom(1+(delta * this.speed));
        // Disable normal scrolling
        e.preventDefault();
    }

    mousezoom() {
        this.wrapperEl.on('DOMMouseScroll', (e) => this.zoom_handler(e));
        this.wrapperEl.on('mousewheel', (e) => this.zoom_handler(e));
    }

    zoomIn() { this.zoom(this.step) }

    zoomOut() { this.zoom(1 / this.step) }

}


class KeyPressTool {
    // Tool to capture keypresses:
    //   Backspace: Delete highlighted object
    //   +        : Zoom in using zoom tool
    //   -        : Zoom out using zoom tool
    constructor(graph, view, canvas, highlight_tool, zoom_tool, marker_tool) {
        // Handle key presses
        this.graph = graph;
        this.view = view;
        this.highlight_tool = highlight_tool;
        this.zoom_tool = zoom_tool;
        this.marker_tool = marker_tool;
        this.canvas = canvas;

        this.container = document.getElementById('container');
        this.container.tabIndex = 1000;
    }

    listen() {
        this.container.addEventListener("keydown", (e) => {
            if ( e.key == 'd' || e.key == 'Backspace' ) {
                let highlighted = this.highlight_tool.highlighted;
                if (highlighted) {
                    this.view.remove(this.graph, highlighted.name);
                    this.marker_tool.update_marked_gui(true);
                }
            }
            else if ( e.key == '+') {
                this.zoom_tool.zoomIn();
            }
            else if ( e.key == '-') {
                this.zoom_tool.zoomOut();
            }
        } , false);
    }

}
