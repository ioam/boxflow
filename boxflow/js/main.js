'use strict';
// ### Introduction
//
// In this file, instances of ``View``, ``Definitions``, ``Graph``,
// ``Commlink`` and ``GUI`` are created and linked up appropriately.
//
// Once these are created, the tools are also instantiated and hooked up
// to the appropriate events.

let canvas = new fabric.Canvas('c', {'selection' : false});
canvas.defaultCursor = 'crosshair';

let view = new View(canvas);
let defs = new Definitions(); // Start with empty definitions
let graph = new Graph({defs : defs});


let canvas_resize_tool = new CanvasResizeTool(canvas);
canvas_resize_tool.activate();
window.dispatchEvent(new Event('resize'));


let gui = new GUI(graph, view);
let server_ip = _.getURLParameter('server');
let commlink = new CommLink(view, gui, graph,
                            server_ip ? server_ip : 'localhost');
graph.commlink = commlink;

// ### Tools
//
// Some of these tools are linked: for instance KeyPressTool needs to
// know what is highlighted to delete the right thing on 'Backspace'/'d'

new RightClickDisableTool();

let gui_tool = new GUITool(gui);
let pan_tool = new PanningTool(canvas);
let highlight_tool = new HighlightTool(canvas);
let marker_tool = new MarkerTool(canvas, gui, highlight_tool);
let zoom_tool = new ZoomTool(canvas);
let motion_tool = new ConnectorMotionTool(graph, view);
let connection_tool = new ConnectionTool(canvas, graph, view, marker_tool);

let keypress_tool = new KeyPressTool(graph, view, canvas,
                                     highlight_tool, zoom_tool, marker_tool);

keypress_tool.listen(); // Start listening for keystrokes
zoom_tool.mousezoom();  // Start zooming behavior


canvas.on('object:selected', function(e) {
    gui_tool.object_selected(e);
    marker_tool.object_selected(e);
});

canvas.on('selection:cleared', function(e) {
    marker_tool.selection_cleared();
});


canvas.on('object:moving', function(e) {
    motion_tool.object_moving(e);
});


canvas.on('object:scaling', function(e) {
    motion_tool.object_scaling(e);
});


canvas.on('mouse:over', function(e) {
    highlight_tool.mouse_over(e);
});


canvas.on('mouse:out', function(e) {
    canvas.deactivateAll(); // subtargetting has issues if object kept active
    highlight_tool.mouse_out(e);
});


canvas.on('mouse:up', function (e) {
    pan_tool.mouse_up();
    connection_tool.mouse_up(e);
});


canvas.on('mouse:down', function (e) {
    pan_tool.mouse_down(e);
    connection_tool.mouse_down(e);
});


canvas.on('mouse:move', function (e) {
    pan_tool.mouse_move(e);
    connection_tool.mouse_move(e);
});

// download_file('test.svg', canvas.toSVG())
function download_file(filename, data) {
  let a = document.createElement('a');
  a.style = "display: none";
  let blob = new Blob([data], {type: "application/octet-stream"});
  let url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  // See https://stackoverflow.com/questions/30694453 for Firefox support
  setTimeout(function(){
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);

  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
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
