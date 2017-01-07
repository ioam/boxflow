'use strict';

dat.GUI.prototype.removeFolder = function(name) {
    // Augment dat GUI with ability to remove folders
    // https://stackoverflow.com/questions/18085540/remove-folder-in-dat-gui
    let folder = this.__folders[name];
    if (!folder) {
        return;
    }
    folder.close();
    this.__ul.removeChild(folder.domElement.parentNode);
    delete this.__folders[name];
    this.onResize();
}


class GUI {
    constructor(graph, view) {
        this.graph = graph;
        this.view = view;

        this.datgui = new dat.GUI();
        this.editor = undefined;

        // Parameters
        this.type = undefined; // Set on init()
        this.node_name = undefined;

        this.instantiate = () => { this.view.add_node(this.graph,
                                                      this.type,
                                                      this.node_name);
                                   // Suggest a new node name
                                   this.node_name=graph.new_name(this.type) }
    }


    init() {
        let types = this.graph.defs.types();
        this.type = types[0];
        this.proposed_name = this.graph.new_name(this.type);

        let nodegen = this.datgui.addFolder("Create Node");
        let type_controller = nodegen.add(this, 'type', types).name('Node type');

        type_controller.onChange( (value) => {
            this.proposed_name = this.graph.new_name(this.type);
        });

        let name_controller = nodegen.add(this, 'proposed_name').name("Node name:");
        name_controller.listen();
        nodegen.add(this, 'instantiate').name("Add Node");
        nodegen.open();
    }

    populate(node) {
        // Populate the GUI with the given parameters with optional limits and step
        let params = node.params;
        let plims = this.graph.defs.default_params(node.type, 'lims');
        let pstep = this.graph.defs.default_params(node.type, 'step');
        let pmode = this.graph.defs.default_params(node.type, 'mode');

        if (!this.editor) {
            let editor = this.datgui.addFolder("Parameters");
            this.editor = editor;
        }

        let unlocked = node.unlocked_params(pmode);
        if (unlocked.length==0) {this.clear_params(); return}

        this.editor.open();
        this.clear_params(false);
        for (let key of unlocked) {
            let control = this.editor.add(params, key, ...plims[key]);
            if (pstep[key]!==null) {
                control.step(pstep[key])
            }
        }
    }

    clear_params(clear_folder=true) {
        if (this.editor) {
            // Clone controllers as array changes in loop
            let clone = this.editor.__controllers.slice(0);
            // Clear existing controllers
            for (let el in clone) {
                this.editor.remove(clone[el]);
            }
            if (clear_folder) {
                this.datgui.removeFolder("Parameters");
                this.editor = undefined;
            }
        }
    }
}
