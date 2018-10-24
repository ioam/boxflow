
class CommLink {

    constructor(view, gui, graph, server, port=8891) {
        this.socket = new WebSocket("ws://"+server+":"+port+"/ws");

        this.view = view;
        this.gui = gui;
        this.graph = graph;

        this.setup(this.socket)
    }

    setup(socket) {
        socket.onopen =    (e) => this.socket_onopen;
        socket.onerror =   (e) => this.socket_onerror;
        socket.onmessage = (e) => this.socket_onmessage(e);
        socket.onclose =   (e) => this.socket_onclose;
    }

    socket_onopen(e) {
        console.log('Socket opened');
    }

    socket_onclose(e) {
        console.log('Socket closed');
    }

    socket_onerror(e) {
        console.log('Socket error');
    }

    socket_onmessage(e) { // Dispatch according to value of 'command'
        let json = JSON.parse(e.data);
        if (json.command == 'definitions') {
            this.graph.defs.definitions = json['data'];
            this.gui.init();
            _.screenshot(this.view, this.graph);
        }
        else if (json.command == 'image_update') {
            let node = this.graph.find_node(json['data']['name']);
            if (!node) {console.log('Warning: node not found'); return }
            let boxtype = this.graph.defs.boxtype(node.type);
            if (node.image_opts) {
                node.image_opts.imdata = json['data']['b64'];
                boxtype.update_image(node, this.view, true);
            }
        }
        else if (json.command == 'param_update') {
            let params = json['data']['params'];
            let node = this.graph.find_node(json['data']['name']);
            if (node) {
                WatchJS.noMore = true; // Set params without triggering watch.js
                for (let key of Object.keys(params)) {
                    node.params[key] = params[key];
                }
                WatchJS.noMore = false;
                this.gui.refresh_params();
            }
            else {
                console.log('Could not find node to update params')
            }
        }
        else if (json.command == 'invalid_edge') {
            console.log('Invalid edge: ' + json['data']);
            this.view.remove(this.graph, json['data'], false); // Avoid looping back
        }
    }

    send_message(command, data) {
        if (this.socket.readyState === this.socket.OPEN ) {
            this.socket.send(JSON.stringify({'command': command,
                                             'data':data}));
        }
        else {
            console.log('Socket not ready');
        }
    }

    add_node(node) {
        this.send_message('add_node',
                          {'type':node.type, 'name':node.name, 'params':node.params});
        // Using watch.js to trigger update_params when the params change
        watch(node.params, () => {
            this.update_params(node);
        });

        watch(node.buttons, () => {
            this.trigger_button(node);
        });

    }

    node_repr(node) {
      this.send_message('node_repr',
                          {'type':node.type, 'name':node.name, 'params':node.params});
    }

    remove_node(node) {
        this.send_message('remove_node',
                          {'name':node.name})
    }

    add_edge(edge) {
        this.send_message('add_edge',
                          {'name': edge.name,
                           'src':edge.src.name,
                           'output': edge.output,
                           'dest' : edge.dest.name,
                           'input': edge.input});
        this.update_params(edge.dest);
    }

    remove_edge(edge) {
        this.send_message('remove_edge',
                          {'src':edge.src.name,
                           'output': edge.output,
                           'dest' : edge.dest.name,
                           'input': edge.input});
        this.update_params(edge.dest);
    }

    trigger_button(node) { // Communicate which buttons have been triggered
        let triggered = [];
        for (let button of this.graph.defs.buttons(node.type)) {
            if (node.buttons[button.callback]) {
                triggered.push(button.callback);
                WatchJS.noMore = true; // Reset state back to untriggered (false)
                node.buttons[button.callback] = false;
                WatchJS.noMore = false;
            }
        }
        if (triggered.length == 0) { return }
        else if (triggered.length > 1) {
            console.log('Warning: Multiple buttons triggered simultaneously.')
        }
        else {
            this.send_message('trigger_button',
                              {'name':   node.name,
                               'button': triggered[0] })
        }
    }

    update_params(node) {  // Send updated param values to Python
        this.send_message('update_params',
                          {'name'   : node.name,
                           'params' : node.params })
    }

    unwatch_params(node) {

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
