# Module offering interface class for registering BoxTypes
#
#
from __future__ import absolute_import
from collections import defaultdict

class BoxType(object):

    def __init__(self, typeobj, nodetype='LabelledNode',
                 untyped=[], hidden=[], display_fn = None):
        self.typeobj = typeobj
        self.nodetype = nodetype
        self.display_fn = display_fn if display_fn else lambda x: {}

        self.name = typeobj.name

        self.untyped = set(getattr(typeobj, 'untyped', [])) | set(untyped)
        self.hidden = set(getattr(typeobj, 'hidden', [])) | set(hidden)


    def mode(self, name):
        """
        Return the port mode of the given parameter by name.
        """
        if name in self.untyped:
            return 'untyped'
        return 'hidden' if name in self.hidden else 'normal'

    def __call__(self, *args, **kwargs):
        # Return an instance
        return self.typeobj(*args, **kwargs)


class Interface(object):

    definitions = {}

    @classmethod
    def _boxlist(cls, blist):
        return [el if isinstance(el, BoxType) else BoxType(el) for el in blist]

    @classmethod
    def add(cls, group, definition):

        definition = definition if isinstance(definition, list) else [definition]
        boxtypes = cls._boxlist(definition)

        if group not in cls.definitions:
            cls.definitions[group] = defaultdict(list)

        for boxtype in boxtypes:
            cls.definitions[group][boxtype.nodetype].append(boxtype)
