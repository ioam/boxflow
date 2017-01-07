# Boxflow documentation

Javascript documentation is generated with [docco](https://jashkenas.github.io/docco/) viewable online [here](https://ioam.github.io/boxflow/). 

The boxflow GitHub repository can be found [here](https://github.com/ioam/boxflow).

[main.js](https://ioam.github.io/boxflow/js-docs/main.html) : Toplevel entry point <br>

***JS classes independent of fabric.js***

[*nodes.js*](https://ioam.github.io/boxflow/js-docs/nodes.html) : Nodes hold semantic and visual state. <br>
[*graph.js*](https://ioam.github.io/boxflow/js-docs/graph.html) :  A Graph holds nodes and edges.<br>
[*commlink.js*](https://ioam.github.io/boxflow/js-docs/commlink.html) : Commlink links the graph to the server.<br>
[*utils.js*](https://ioam.github.io/boxflow/js-docs/utils.html) :  Simple set of utilities injected into underscore. <br>

***JS classes coupled with fabric.js***

*Drawing:* <br>
[*view.js*](https://ioam.github.io/boxflow/js-docs/view.html) : The View manages graphical state.  <br>
[*boxes.js*](https://ioam.github.io/boxflow/js-docs/boxes.html) : Boxes are the visual representation of nodes. <br>

*Interactive tools:*<br>
[*tools.js*](https://ioam.github.io/boxflow/js-docs/tools.html) : Tools respond to interactive events. <br>
[*connector.js*](https://ioam.github.io/boxflow/js-docs/connector.html) : The connection tool has its own file. <br>


### Developer Instructions

1. Clone the repository into the top-level docs directory.

  ```bash
  $ git clone https://github.com/ioam/boxflow.git docs
  ```
  
2. Move into the new ``docs`` directory and checkout gh-pages.

  ```bash
  $ cd docs
  $ git checkout gh-pages
  ```
  
3. Generate/update the contents of the js-docs directory using:

  ```bash
  $ docco -o js-docs ../boxflow/js/*
  ```
