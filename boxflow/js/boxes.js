'use strict';
// NodeBox is the top level box.

class BaseBox {
    // A nodebox is the visual representation of a node

    static nodetype() { return undefined }

    static make_nodebox(node) {
        // Make the nodebox by grouping everything together
        return new fabric.Group(this.grouped_objects(node),
                                { node : node,
                                  name : node.name,
                                  left : node.geom.left,
                                  top :  node.geom.top,
                                  hoverCursor: 'pointer',
                                  subTargetCheck: true,
                                  selectable: true,
                                  hasControls: false,
                                  hasBorders : false });
    }

    static grouped_objects(node) {
        // Returns an array of fabric objects to group
        return  [this.make_box(node)]
            .concat(this.make_ports(node, 'output'))
            .concat(this.make_ports(node, 'input'))
    }

    static port_filter(node, type) { // Filter by type and mode (ensure visible)
        let params = type == 'input' ? node.inputs : node.outputs;
        return _.filter(params, (p) => {return node.param_modes[p] != 'hidden' });
    }


    static make_ports(node, type) {
        // Make an array of either the 'input' or 'output' ports
        let params = this.port_filter(node, type);
        let offset = type == 'input' ? node.outputs.length : 0;
        return params.map( (param, i) => this.make_port(node, param, type, i+offset));
    }


    static make_port(node, param, type) {
        // Return a single port circle at the appropriate position
        let pos = node.port_position(param, type);
        let prefix = type === 'input' ? 'inport-' : 'outport-';

        return new fabric.Circle({
            name :        prefix + _.UUID(),
            param :       param,
            left :        pos[0],
            top :         pos[1],
            radius :      node.geom.port_radius,
            originX :     'center',
            originY :     'center',
            stroke :      'black',
            strokeWidth : 1,
            fill:         type == 'input'? node.input_style.fill : node.output_style.fill,
            scale:        0.5})
    }

    static make_box(node) {
        // Make the 'box' i.e the smoothed rectangle background
        let flags =  { selectable: true,
                       hasControls: false,
                       hasBorders : false }
        let height = node.ports_height() + node.header_height();
        return new fabric.Rect(_.extend({}, node.style, node.geom, flags,
                                        { height: height,
                                          left: 0, top: 0 }));
    }

    static port_position(port, node) {
        // Currently unused and returns unscaled positions
        // but could lookup the group and look for the
        // ports inside (getObjects) and get the positions there.
        return node.port_position(port, type);
    }

    static update_node(view, graph, node, left, top) {
        // Move a node and update the edges
        node.geom.left = left;
        node.geom.top = top;

        for ( let in_edge of graph.node_edges(node, 'input') ) {
            Connector.update_connector(view, in_edge) }

        for ( let out_edge of graph.node_edges(node, 'output') ) {
            Connector.update_connector(view, out_edge) }
    }
}


class LabelledBox extends BaseBox {
    // Extends Basebox with a title and labels

    static nodetype() { return 'LabelledNode' }

    static make_title(node) {
        // Returns an array of fabric objects to group
        let title = new fabric.Text(node.name, {
            fontFamily: node.title_opts.fontFamily,
            fontWeight: 'bold',
            strokeWidth : 0,
            originX :     'center',
            originY :     'top',
            fontSize:      node.title_opts.size,
            left: node.geom.width / 2.0,
            top: 0 });

        // Add padding to title.
        title.top = title.height * node.title_opts.top_padding_ratio;

        // Scale to fit if necessary
        let allowed_title_width = node.geom.width*node.width_ratio;
        if (title.width > allowed_title_width) {
            title.scaleX = allowed_title_width/title.width;
            title.scaleY = title.scaleX;
        }
        // Allocate space in the node neader for the title
        node.header_heights['title'] = title.top + (title.height * title.scaleY);
        return title
    }


    static make_label(name, node, type) {
        let [x,y] = node.port_position(name, type);
        let padding = node.geom.width * 0.2;
        let label = new fabric.Text(
            node.labels[name]? node.labels[name] : name, {
            fontFamily: node.label_opts.fontFamily,
            strokeWidth : 0,
            originX :     (type === 'input') ? 'left' : 'right',
            originY :     'center',
            fontSize:      node.label_opts.size,
            left: (type == 'input') ? x + padding : x - padding ,
            top: y });
        return label
    }

    static make_labels(node) {
        let output_labels = _.map(node.outputs, (v) => this.make_label(v, node, 'output'));
        let input_labels = _.map(node.inputs, (v) => this.make_label(v, node, 'input'));
        return output_labels.concat(input_labels)
    }

    static grouped_objects(node) {
        // Note, compute elements before concat to allow base node modifications
        let title_text = this.make_title(node);
        let labels = this.make_labels(node);
        return super.grouped_objects(node).concat([title_text]).concat(labels)
    }
}




class ImageBox extends LabelledBox {

    static nodetype() { return 'ImageNode' }

    static make_image(node, group, imopts={}) {
        // Makes a fabric Image and adds it to the supplied group when ready
        let half_height = (node.ports_height() + node.header_height())/2.0;
        let opts = _.extend( {
            top: node.header_heights['title'] - half_height,
            // Depends on whether left/right ports are present
            left : node.image_left(),
            strokeWidth : node.image_opts.strokeWidth,
            stroke : node.image_opts.stroke,
            originX : 'center',
            selectable : false,
            hasBorders : false,
            hasControls: false,
        }, imopts)

        fabric.Image.fromURL(node.image_opts.imdata, (image) =>  {
            node.image = image;
            image.scaleX = node.image_scaleX();
            image.scaleY = node.image_scaleY();

            image.width = node.image_opts.xres;
            image.height = node.image_opts.yres;

            group.add(image);
            canvas.renderAll();
        }, opts);
    }

    static update_image(node, view) {
        if (node.image) {
            node.image.setSrc(node.image_opts.imdata,
                              (img) => {
                                  view.lookup(node).dirty = true;
                                  canvas.renderAll() });
        }
    }

    static make_nodebox(node) {
        // title_height added when title created
        node.header_heights['image'] = node.image_opts.height;
        let group = super.make_nodebox(node);
        // The fabric.Image will add itself to the group when ready
        this.make_image(node, group);
        return group
    }
}


class ViewportBox extends ImageBox {

    static nodetype() { return 'Viewport' }

    static make_rect_port(node, param) {
        // Return a single centered rectangle port
        return new fabric.Rect({
            name :        'inport-' + _.UUID(),
            param :       param,
            left :        - node.geom.width/2,
            top :         0,
            height :      node.geom.width,
            width :       node.geom.port_radius+10,
            originX :     'center',
            originY :     'center',
            stroke :      'black',
            strokeWidth : 1,
            fill:         node.input_style.fill,
            scale:        0.5})
    }

    static make_frame(node) {
        return new fabric.Rect({
            name :        'frame-' + _.UUID(),
            left :        0,
            top :         0,
            height :      node.geom.width,
            width :       node.geom.width,
            originX :     'center',
            originY :     'center',
            stroke :      'red',
            strokeWidth : 1,
            fill : undefined
        })
    }


    static make_nodebox(node) {

        let center_port = this.make_rect_port(node, 'input');
        let group = new fabric.Group([this.make_frame(node), center_port],
                                    { node : node,
                                      name : node.name,
                                      left : node.geom.left,
                                      top :  node.geom.top,
                                      // Forcing square aspect ratio
                                      width :  node.geom.width+node.geom.port_radius+10,
                                      height : node.geom.width+ node.geom.port_radius+10,
                                      padding : 0,
                                      subTargetCheck: true,
                                    })

        this.make_image(node, group, { top : 0,
                                       originY : 'center' });
        group.hasControls = true;
        group.hasRotatingPoint = false;
        let disabled_controls = ['ml','mr', 'mt','mb']
        for (let cntl of disabled_controls) {
            group.setControlVisible(cntl, false);
        }
        return group;
    }
}
