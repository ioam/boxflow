# Module offering interface class for registering BoxTypes
#
#
from __future__ import absolute_import

class BoxType(object):

    def __init__(self, typeobj):
        self.typeobj = typeobj
        self.name = typeobj.name


    def mode(self, name):
        """
        Return the port mode of the given parameter by name.
        """
        untyped_ports = getattr(self.typeobj, 'untyped_ports', [])
        no_ports = getattr(self.typeobj, 'no_ports', [])
        if name in untyped_ports:
            return 'untyped-port'
        return 'no-port' if name in no_ports else 'normal'

    def __call__(self, *args, **kwargs):
        # Return an instance
        return self.typeobj(*args, **kwargs)


class Interface(object):

    default_nodetype = 'LabelledNode'
    definitions = {}

    @classmethod
    def _boxlist(cls, blist):
        return [el if isinstance(el, BoxType) else BoxType(el) for el in blist]

    @classmethod
    def add(cls, group, definition, nodetype=None):

        definition = definition if isinstance(definition, list) else [definition]
        nodetype = cls.default_nodetype if nodetype is None else nodetype
        boxes = cls._boxlist(definition)

        if group not in cls.definitions:
            cls.definitions[group] = {}

        if nodetype in cls.definitions[group]:
            cls.definitions[group][nodetype] += boxes
        else:
            cls.definitions[group][nodetype] = boxes
