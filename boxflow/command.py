import json

from graph import Graph
from definitions import ParamDefinitions



class Command(object):

    def __init__(self, handler, interface, excluded):
        self.interface = interface
        self.definitions = interface.definitions
        self.handler = handler
        self.excluded = excluded

        self.graph = Graph()

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

    # Utility methods
    def lookup_boxtype(self, name):
        for spec in self.definitions.values():
            for boxlist in spec.values():
                for boxtype in boxlist:
                    if boxtype.name == name:
                        return boxtype

    # Receive commands

    def add_node(self, data):
        # TODO: Assuming class names unique between groups
        boxtype = self.lookup_boxtype(data['type'])
        instance = boxtype(name=data['name'], **data['params'])
        self.graph.add_instance(instance)
        self.send('image_update',
                  dict(boxtype.display_fn(instance), name=data['name']))

    def remove_node(self, data):
        self.graph.remove_instance(data['name'])

    def add_edge(self, data):
        (s,o,d,i) =(data['src'], data['output'], data['dest'], data['input'])

        if self.graph.allowed_link(s,o,d,i):
            self.graph.add_link(s,o,d,i)
            self.update_params({'name':d, 'params':{}}) # Update destination
        else:
            # Remove link from client-side.
            print('Warning: Proposed link is invalid')
            self.send('invalid_edge', data['name'])

    def remove_edge(self, data):
        self.graph.remove_link(data['src'], data['output'],
                               data['dest'], data['input'])
        self.update_params({'name':data['dest'], 'params':{}})


    def update_params(self, data):
        updated = self.graph.update_params(data['name'], data['params'])

        for name in updated:
            instance = self.graph.find_instance(name)
            if instance:
                boxtype = self.lookup_boxtype(instance.__class__.__name__)
                self.send('image_update',
                          dict(boxtype.display_fn(instance), name=name))
    # Push commands

    def push_definitions(self):
        definitions = self.interface.json('datgui', self.excluded)
        self.send('definitions', definitions)
