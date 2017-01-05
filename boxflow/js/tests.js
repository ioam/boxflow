

function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}


function test_defs(defs) {
    defs.define('Widgets',
                [defs.param('text', value='some text'),
                 defs.param('float slider', value=2, lims=[-5,5], step=0.1),
                 defs.param('constrained', value=0.0, lims=[0], step=0.2),
                 defs.param('int slider', value=-4.0, lims=[-10,10], step=1),
                 defs.param('selector', value='round', lims=[['skew', 'round']]),
                 defs.param('value selector', value=0.1, lims=[{fast:1, slow:0.1}]),
                 defs.param('boolean', value=false)],
                [defs.param('output-1'),
                 defs.param('output-2')]);

    defs.define('Disk',
                [defs.param('size', value=1, lims=[-10,10]),
                 defs.param('scale', value=2, lims=[-3,3])],
                [defs.param('output')]);
    return defs

}

function graph_tests() {

    let n1 = new Node({inputs:['a'], outputs:['b']});
    let n2 = new Node({inputs:['c'], outputs:['d','e']});

    let graph1 = new Graph();
    graph1.add_node(n1);
    graph1.add_node(n2);

    graph1.add_edge(n1,'b', n2, 'c');
    
    assert(graph1.edges.length === 1, 'Incorrect number of edges.');
    assert(graph1.nodes.length === 2, 'Incorrect number of nodes.');

    // Test edge matching
    let edge_matches1 = graph1.node_edges(n1, 'output');
    assert(edge_matches1.length === 1, 'Incorrect number of output edges');
    assert(edge_matches1[0].src === n1, 'Incorrect edge source');

    let edge_matches2 = graph1.node_edges(n2, 'input');
    assert(edge_matches2.length === 1, 'Incorrect number of input edges');
    assert(edge_matches2[0].dest === n2, 'Incorrect edge source ');
    assert(edge_matches1[0].name === edge_matches2[0].name, 'Not the same edge');

    // Test row method
    assert(n1.row('a', 'input') == 1, 'Incorrect row number');
    assert(n2.row('e', 'output') == 1, 'Incorrect row number');

    let graph2 = new Graph();

    graph2.add_node(n1);
    graph2.add_node(n2);

    try {
        graph2.add_edge(n1,'z', n2, 'c');
    }
    catch(err) {
        assert(err === 'Specified output not in source node outputs.', 'Unexpected error');
    }
    console.log('All graph tests passed');
}

graph_tests();
