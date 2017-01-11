# Module offering interface class for registering BoxTypes
#
#
from __future__ import absolute_import

class BoxType(object):

    def __init__(self, typeobj):
        self.typeobj = typeobj
        self.name = typeobj.name

    def __call__(self, *args, **kwargs):
        # Return an instance
        return self.typeobj(*args, **kwargs)


class Interface(object):

    default_nodetype = 'LabelledNode'
    registry = {}

    @classmethod
    def _boxlist(cls, blist):
        return [el if isinstance(el, BoxType) else BoxType(el) for el in blist]

    @classmethod
    def add(cls, group, definition, nodetype=None):

        definition = definition if isinstance(definition, list) else [definition]
        nodetype = cls.default_nodetype if nodetype is None else nodetype
        boxes = cls._boxlist(definition)

        if group not in cls.registry:
            cls.registry[group] = {}

        if nodetype in cls.registry[group]:
            cls.registry[group][nodetype] += boxes
        else:
            cls.registry[group][nodetype] = boxes
