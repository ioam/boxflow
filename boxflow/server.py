from __future__ import absolute_import

import os
import param
import time
import json
import sys

import tornado.httpserver
import tornado.websocket
import tornado.ioloop
import tornado.web

from interface import Inventory
from command import Command



class WSHandler(tornado.websocket.WebSocketHandler):

    def open(self):
        print('New websocket connection')

        # seed/time_dependent probably have an issue with None...
        excluded = ['enforce_minimal_thickness', 'size', 'time_dependent', 'seed']
        self.command = Command(self, Inventory, excluded=excluded)
        self.command.push_definitions()

    def on_message(self, message):
         self.command.dispatch(json.loads(message))

    def on_close(self):
        print('connection closed')

    def check_origin(self, origin):
        return True

html = """
<head>
  <title>Boxflow</title>
    <script>
      // For debugging purposes
      console.log(new Array(24 + 1).join('\\n'));
    </script>
    <script src="./static/underscore-min.js"></script>
    <script src="./static/jquery.min.js"></script>
    <script src="./static/fabric.js"></script>
    <script src="./static/dat.gui.js"></script>
    <script src="./static/watch.js"></script>

{scripts}

<style>
body {{  /* Disable text selection on GUI*/
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}}
</style>

</head><body>
  <div id="container">
    <canvas id="c" height="800" width="800"></canvas>
  </div>
  <script src="./js/main.js"></script>
</body></html>
"""

def index_html(js_dir):
    stag = "    <script src='{path}'></script>"
    files = ["utils.js", "commlink.js","nodes.js","boxes.js", "graph.js",
             "view.js","tools.js", "connector.js", "gui.js"]
    stags = [stag.format(path='./{js_dir}/{f}'.format(js_dir=js_dir, f=f)) for f in files]
    return html.format(scripts='\n'.join(stags))


def main(js_dir):
    curdir = os.path.split(__file__)[0]
    with open(os.path.join(curdir,'index.html'),'w') as f:
        f.write(index_html(js_dir))

    host = os.environ['NODE_IP'] if 'NODE_IP' in os.environ else 'localhost'

    application = tornado.web.Application([
        (r'/ws', WSHandler)])

    tornado.httpserver.HTTPServer(application).listen(8891)
    main_loop = tornado.ioloop.IOLoop.instance()

    # Serve HTML and JS
    js_path = os.path.join(curdir, js_dir)
    static_path = os.path.join(curdir, 'static')
    assets_path = os.path.join(curdir, 'assets')
    html_handler = (r'/(.*)', tornado.web.StaticFileHandler,
                    {'path': curdir})

    js_handler=(r'/'+js_dir+'/(.*)', tornado.web.StaticFileHandler, {'path': js_path})
    static_handler=(r'/static/(.*)', tornado.web.StaticFileHandler, {'path': static_path})
    assets_handler=(r'/assets/(.*)', tornado.web.StaticFileHandler, {'path': assets_path})

    tornado.web.Application([html_handler,
                             js_handler,
                             static_handler,
                             assets_handler]).listen(8000)
    print("Serving at:\n\n{host}:8000/index.html?server={host}\n".format(host=host))
    main_loop.start()


if __name__ == "__main__":

    if len(sys.argv) == 1:
        js_dir = 'js'
    elif sys.argv[1] == '-es5':
        js_dir = 'es5'
    else:
        print("Only allowed argument is '-es5'")
        sys.exit()

    main(js_dir)
