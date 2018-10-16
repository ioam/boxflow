import json

from dataflow import DataFlow
try: # pip install pyperclip
    import pyperclip
except:
    pyperclip = None

class Command(object):
    """
    The Command class links the messages sent of the websocket to the
    associated operations on the dataflow graph.
    """

    def __init__(self, handler, inventory, excluded):
        self.inventory = inventory
        self.handler = handler
        self.excluded = excluded

        self.dataflow = DataFlow()

    def send(self, command, data):
        self.handler.write_message(
            json.dumps({'command':command, 'data':data}))

    def dispatch(self, json):
        if json['command'] == 'add_node':
            self.add_node(json['data'])
        if json['command'] == 'remove_node':
            self.remove_node(json['data'])

        if json['command'] == 'add_edge':
            self.add_edge(json['data'])
        if json['command'] == 'remove_edge':
            self.remove_edge(json['data'])
        if json['command'] == 'update_params':
            self.update_params(json['data'])
        if json['command'] == 'trigger_button':
            self.trigger_button(json['data'])
        if json['command'] == 'node_repr':
            self.node_repr(json['data'])

    # Receive commands

    def node_repr(self, data):
        box = self.dataflow.find_box(data['name'])
        box_repr = box.script_repr()
        if pyperclip is not None:
            # For imagen demo
            imports = '\n'.join(['from boxflow import interface',
                                 'import imagen',
                                 'import numbergen'])

            box_repr = box_repr.replace('interface.', '')
            box_repr = box_repr.replace('imagen.Mul', 'interface.imagen.Mul')
            box_repr = box_repr.replace('imagen.Sub', 'interface.imagen.Sub')
            box_repr = box_repr.replace('imagen.BinaryOp',
                                        'interface.imagen.BinaryOp')
            box_repr = box_repr.replace('numbergen.BinaryOp',
                                        'interface.numbergen.BinaryOp')
            pyperclip.copy(imports + '\n' + box_repr)
        else:
            print('Please pip install pyperclip')

    def add_node(self, data):
        # TODO: Assuming class names unique between groups
        boxtype = self.inventory.lookup_boxtype(data['type'])
        box = boxtype(self.inventory, name=data['name'], **data['params'])
        self.dataflow.add_box(box)
        self.send('image_update',
                  dict(box.display(), name=data['name']))

    def remove_node(self, data):
        self.dataflow.remove_box(data['name'])

    def add_edge(self, data):
        (s,o,d,i) =(data['src'], data['output'], data['dest'], data['input'])

        if self.dataflow.allowed_link(s,o,d,i):
            self.dataflow.add_link(s,o,d,i)
            self.update_params({'name':d, 'params':{}}) # Update destination
        else:
            # Remove link from client-side.
            print('Warning: Proposed link is invalid')
            self.send('invalid_edge', data['name'])

    def remove_edge(self, data):
        self.dataflow.remove_link(data['src'], data['output'],
                                  data['dest'], data['input'])
        self.update_params({'name':data['dest'], 'params':{}})


    def update_params(self, data):
        updated = self.dataflow.update_params(data['name'], data['params'])

        for name in updated:
            box = self.dataflow.find_box(name)
            if box:
                self.send('image_update',
                          dict(box.display(), name=name))

    def trigger_button(self, data):
        box = self.dataflow.find_box(data['name'])
        if box is None: return
        # Push updated values to the GUI
        params = box.trigger(data['button'])
        self.push_params(data['name'], params)
        self.update_params({'name':data['name'], 'params':params})

    # Push commands

    def push_definitions(self):
        definitions = self.inventory.json(self.excluded, 'datgui')
        self.send('definitions', definitions)

    def push_params(self, name, params):
        " Push updated parameter values to the frontend "
        self.send('param_update', {'name':name, 'params':params})
