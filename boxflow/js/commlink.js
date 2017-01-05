
class CommLink {

    constructor(view, gui, graph, server, port=8891) {
        this.socket = new WebSocket("ws://"+server+":"+port+"/ws");

        this.view = view;
        this.gui = gui;
        this.graph = graph;

        this.configure_callbacks(this.socket)
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

    socket_onmessage(e) {
        let json = JSON.parse(e.data);
        if (json.command == 'definitions') {
            this.graph.defs.definitions = json['data'];
            this.gui.init();
            _.demo_graph(this.view, this.graph);
        }
        if (json.command == 'image_update') {
            let node = this.graph.find_node(json['data']['name']);
            let boxtype = this.graph.defs.boxtype(node.type);
            if (node.image_opts) {
                node.image_opts.imdata = json['data']['b64'];
                boxtype.update_image(node, this.view, true);
            }
        }
    }

    configure_callbacks(socket) {
        socket.onopen =    (e) => this.socket_onopen;
        socket.onerror =   (e) => this.socket_onerror;
        socket.onmessage = (e) => this.socket_onmessage(e);
        socket.onclose =   (e) => this.socket_onclose;
    }

    send_message(command, data) {
        if (this.socket.readyState === this.socket.OPEN ) {
            this.socket.send(JSON.stringify({'command': command, 'data':data}));
        }
        else {
            console.log('Socket not ready');
        }
    }

    add_node(node) {
        this.send_message('add_node',
                          {'type':node.type, 'name':node.name, 'params':node.params});
        // Use watch.js to follow the new nodes parameters
        watch(node.params, () => {
            this.update_params(node);
        });
    }

    remove_node(node) {
        this.send_message('remove_node',
                          {'name':node.name})
    }

    add_edge(edge) {
        this.send_message('add_edge',
                          {'src':edge.src.name,
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


    update_params(node) {
        // Send updated param values to Python
        this.send_message('update_params',
                          {'name':node.name, 'params':node.params})
    }


    unwatch_params(node) {

    }
}
