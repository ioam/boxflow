'use strict';


_.patch_remove_folder(dat);
_.patch_docstring_support(dat);

class GUI {
    constructor(graph, view) {
        this.graph = graph;
        this.view = view;

        this.datgui = new dat.GUI();
        this.editor = undefined;

        this.group = 'uninitialized';       // Group - can't be undefined for datgui
        this.node_type = 'uninitialized';   // Can't be undefined for datgui

        // TODO: Pass group through to add_node.
        this.instantiate = () => {
            this.view.add_node(this.graph,
                               this.node_type,
                               graph.new_name(this.node_type))
        }
    }

    init() {
        let groups = this.graph.defs.groups();
        this.group = groups[0]; // Pick the first group

        let nodegen = this.datgui.addFolder("Create Node");
        let group_controller = nodegen.add(this, 'group', groups).name('Group');
        group_controller.onChange(set_types);

        let type_controller =  nodegen.add(this, 'node_type').name('Node Type');
        type_controller.listen(); // Update when group changed

        let self = this; // Needed to have access inside following callback
        function set_types(group) {
            let node_types = self.graph.defs.types(group);
            self.node_type = node_types[0];
            type_controller = type_controller.options(node_types).name('Node Type');
        }
        set_types(groups[0]);  // Initialize dropdown

        nodegen.add(this, 'instantiate').name("Add Node");
        nodegen.open();

    }

    populate(node) {
        this.graph.node_repr(node);
        // Populate the GUI with the given parameters with optional limits and step
        let params = node.params;
        let plims = this.graph.defs.default_params(node.type, 'lims');
        let pstep = this.graph.defs.default_params(node.type, 'step');
        let pmode = this.graph.defs.default_params(node.type, 'mode');
        let plabel = this.graph.defs.default_params(node.type, 'label');
        let pdoc = this.graph.defs.default_params(node.type, 'doc');

        if (!this.editor) {
            let editor = this.datgui.addFolder("Parameters");
            this.editor = editor;
        }

        let unlocked = node.unlocked_params(pmode);
        if (unlocked.length==0) {this.clear_params(); return}

        this.editor.open();
        this.clear_params(false);

        for (let key of unlocked) {
            // There seems to be a bug in datGUI with numbers becoming strings for
            // named value selections as well as multi-selections (lists).
            let control = this.editor.add(params, key, ...plims[key]).name(plabel[key]);
            if (pstep[key]!==null) {
                control.step(pstep[key])
            }
            control.doc(pdoc[key]);
        }

        for (let button of this.graph.defs.buttons(node.type)) {
            this.editor.add(node.buttons, button.callback+'_trigger').name(button.label);
        }

    }

    refresh_params() {
        // Refresh the value of the parameters shown in the GUI
        for (let controller of this.editor.__controllers) {
            controller.updateDisplay() }
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
