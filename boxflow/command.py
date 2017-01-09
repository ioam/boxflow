import json

from graph import Graph
from definitions import ParamDefinitions



class Command(object):

    def __init__(self, handler, groups, excluded, display_handlers):
        self.groups = groups
        self.handler = handler
        self.excluded = excluded
        self.display_handlers = display_handlers

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

    def display_data(self, instance): # Grab base64 data if applicable.
        for handler in self.display_handlers:
            data = handler(instance)
            if 'b64' in data:
                return data
        return {}

    # Receive commands

    def add_node(self, data):
        # TODO: Assuming class names unique between groups
        cls_map = {cls.name:cls for group in self.groups.values() for cls in group}
        cls = cls_map.get(data['type'], None)
        if cls is None: return

        instance = cls(name=data['name'], **data['params'])
        self.graph.add_instance(instance)
        self.send('image_update',
                  dict(self.display_data(instance), name=data['name']))

    def remove_node(self, data):
        self.graph.remove_instance(data['name'])

    def add_edge(self, data):
        (s,o,d,i) =(data['src'], data['output'], data['dest'], data['input'])

        if self.graph.allowed_link(s,o,d,i):
            self.graph.add_link(s,o,d,i)
            self.update_params({'name':d, 'params':{}}) # Update destination
        else:
            pass # Remove link from client-side.

    def remove_edge(self, data):
        self.graph.remove_link(data['src'], data['output'],
                               data['dest'], data['input'])
        self.update_params({'name':data['dest'], 'params':{}})


    def update_params(self, data):
        updated = self.graph.update_params(data['name'], data['params'])

        for name in updated:
            instance = self.graph.find_instance(name)
            if instance:
                self.send('image_update',
                          dict(self.display_data(instance), name=name))
    # Push commands

    def push_definitions(self):
        definitions = ParamDefinitions.generate(self.groups, self.excluded)
        self.send('definitions', definitions)
