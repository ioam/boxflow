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

    patch_remove_folder : function(dat) { // Adds folder removal to dataGUI
        // Augment dat GUI with ability to remove folders
        // https://stackoverflow.com/questions/18085540/remove-folder-in-dat-gui
        dat.GUI.prototype.removeFolder = function(name) {
            let folder = this.__folders[name];
            if (!folder) {
                return;
            }
            folder.close();
            this.__ul.removeChild(folder.domElement.parentNode);
            delete this.__folders[name];
            this.onResize();
        }
    },

    patch_docstring_support : function(dat) { // Adds title method to datGUI
        _.eachController(dat, function(controller) {
            if (!controller.prototype.hasOwnProperty('doc')) {
                controller.prototype.doc = _._set_docstring;
            }
        });
    },

    eachController : function(dat, fnc) { // https://stackoverflow.com/questions/27362914
        for (let controllerName in dat.controllers) {
            if (dat.controllers.hasOwnProperty(controllerName)) {
                fnc(dat.controllers[controllerName]);
            }
        }
    },

    _set_docstring : function(v) { // __li is the root dom element of each controller
        if (v) {
            this.__li.setAttribute('title', v);
        } else {
            this.__li.removeAttribute('title')
        }
        return this;
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

    basic_demo : function(view, graph) { // Show param types and toolbox

        let param_types = ['Number', 'Integer', 'String', 'Boolean',
                           'Magnitude', 'Prompt'];
        for (let i in param_types) {
            let type = param_types[i];
            let name = type.toLowerCase() + ':0';
            view.add_node(graph, type, name, { pos: [40,20+(i*80)]});
        }
        view.add_node(graph, 'ToolBox', 'toolbox:0', { pos: [250,100]});
    },


    demo : function(view, graph) {

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
    },

    screenshot : function(view, graph) {
      view.add_node(graph, 'FileImage', 'Manhattan', { pos: [200,100]});

      view.add_node(graph, 'Blur', 'High Blur', { pos: [400,0]});
      view.add_node(graph, 'Blur', 'Low Blur', { pos: [400,200]});
      view.add_node(graph, 'Sub', 'Subtract', { pos: [600,100]});
      view.add_node(graph, 'Invert', 'Invert', { pos: [750,100]});

      let image = graph.find_node('Manhattan');
      let lowblur = graph.find_node('Low Blur');
      let highblur = graph.find_node('High Blur');
      let sub = graph.find_node('Subtract');
      let invert = graph.find_node('Invert');

      graph.add_edge(image, '', lowblur, 'input');
      graph.add_edge(image, '', highblur, 'input');

      graph.add_edge(highblur, '', sub, 'lhs');
      graph.add_edge(lowblur, '', sub, 'rhs');

      lowblur.params['blur_amount'] = 60;
      highblur.params['blur_amount'] = 200;

      graph.add_edge(sub, '', invert, 'input');
      view.add_node(graph, 'Viewport', 'Viewport', { pos: [900,100]});
      let viewport = graph.find_node('Viewport');
      graph.add_edge(invert, '', viewport, 'input');
      view.canvas.clear();
      view.render(graph);
    },

  bezier_path : function(x1,x2,y1,y2, delta) {
    let deltax = x2 - x1
    let deltay = y2 - y1
    let node1x = deltax * delta // 10%
    let node2x = x2 - (2 * deltax * delta)
    return `M ${x1} ${y1} ${x1+node1x} ${y1} C ${x1+node1x*2} ${y1} ${x2- (3 * deltax * delta)} ${y2} ${x2-node1x} ${y2} L ${x2} ${y2}`
  }

});
