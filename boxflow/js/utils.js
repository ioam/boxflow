'use strict';

// Utilities use underscore as a convenient namespace

_.mixin({

    UUID : function b(a) {
        return a ? (a ^ Math.random() * 16 >> a / 4)
            .toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11)
            .replace(/[018]/g, b).slice(0, 8)
    },

    Base64ImageSize : function(data) {
        let img = new Image(); // HTML5 image
        img.src = data;
        return [img.width, img.height]
    },


    blank_pixel : function() {
        return ("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAA"
                + "BCAIAAACQd1PeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH"
                + "4QECAQgQUglz5wAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEd"
                + "JTVBkLmUHAAAADElEQVQI12N49OgRAAVQAqe5fRrCAAAAAElFTkSuQmCC")
    },

    getURLParameter : function (name, url) {
        if (!url) {
            url = window.location.href;
        }
        if (!name) {
            return null
        }
        name = name.replace(/[\[\]]/g, "\\$&");
        let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
        let results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    },

    invert : function (obj) {
        var new_obj = {};

        for (var prop in obj) {
            if(obj.hasOwnProperty(prop)) {
                new_obj[obj[prop]] = prop;
            }
        }
        return new_obj
    },

    demo_graph : function(view, graph) {

        view.add_node(graph, 'Magnitude', 'magnitude:0', { pos: [0,100]});
        view.add_node(graph, 'BinaryOp', 'binaryop:0', { pos: [150,350]});

        view.add_node(graph, 'Disk', 'disk:0', { pos: [200,0]});
        view.add_node(graph, 'Gaussian', 'gaussian:0', { pos: [380,100]});
        view.add_node(graph,'Sub', 'sub:0', { pos: [600,0]});
        view.add_node(graph, 'Mul', 'mul:0', { pos: [900,100]});
        view.add_node(graph, 'Spiral', 'spiral:0', { pos: [600,300]});


        let mag = graph.find_node('magnitude:0');
        let binmul = graph.find_node('binaryop:0');

        let disk = graph.find_node('disk:0');
        let gaussian = graph.find_node('gaussian:0');
        let spiral = graph.find_node('spiral:0');
        let sub = graph.find_node('sub:0');
        let mul = graph.find_node('mul:0');

        graph.add_edge(mag, '', disk, 'x');
        graph.add_edge(mag, '', binmul, 'rhs');
        graph.add_edge(binmul, '', spiral, 'orientation');

        graph.add_edge(disk, '', sub, 'lhs');
        graph.add_edge(gaussian, '', sub, 'rhs');
        graph.add_edge(sub, '', mul, 'lhs');
        graph.add_edge(spiral, '', mul, 'rhs');


        binmul.params['operator'] = 'mul'
        binmul.params['lhs'] = 3.14;

        disk.params['aspect_ratio'] = 0.4;
        disk.params['orientation'] = 0.55;

        gaussian.params['aspect_ratio'] = 4;
        gaussian.params['orientation'] = 2.31;

        spiral.params['scale'] = 1.44;


        view.add_node(graph, 'Viewport', 'viewport:0', { pos: [1100,100]});
        let viewport = graph.find_node('viewport:0');
        graph.add_edge(mul, '', viewport, 'input');


        view.canvas.clear();
        view.render(graph);
    }
});
