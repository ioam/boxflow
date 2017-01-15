# Module offering interface class for registering BoxTypes
#
#
from __future__ import absolute_import
from collections import defaultdict

from .paramDatGUI import ParamDatGUI

class BoxType(object):
    """
    A BoxType is a type of Box. A BoxType is to a Box what a
    parameterized class is to a parameterized instance.
    """

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

    def __call__(self, interface, *args, **kwargs):
        return Box(self, interface, *args, **kwargs)


class Box(object):
    """
    A Box is an instance of a BoxType. A Box is to a BoxType what a
    parameterized instance is to a parameterized class.
    """
    def __init__(self, boxtype, interface, *args, **kwargs):
        self.boxtype = boxtype
        self.interface = interface

        self.instance = boxtype.typeobj(*args, **kwargs)
        self.name = self.instance.name


    def display(self):
        return self.boxtype.display_fn(self.instance)

    def propagate(self):
        return (self.instance.propagate()
                if hasattr(self.instance, 'propagate') else self.instance)

    def set_param(self, *args, **kwargs):
        self.instance.set_param(*args, **kwargs)

    def params(self):
        return self.instance.params()

    def __getitem__(self, name):
        return getattr(self.instance, name)

class Interface(object):

    definitions = {}

    guis = {'datgui': ParamDatGUI }

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


    @classmethod
    def lookup_boxtype(cls, name):
        """
        Find the appropriate BoxType associated with the given name.
        """
        for spec in cls.definitions.values():
            for boxlist in spec.values():
                for boxtype in boxlist:
                    if boxtype.name == name:
                        return boxtype

    @classmethod
    def json(cls, excluded, gui):
        """
        Generate a JSON-serializable parameter definitions for the given
        parameterized objects.
        """
        json_obj = {}
        for group, defs in cls.definitions.items():
            for nodetype, boxlist in defs.items():
                for boxtype in boxlist:
                    inputs = cls._json_params(boxtype, excluded, gui)
                    json_obj[boxtype.name] = {'inputs'  : inputs,
                                              'outputs' : [ {'name':'', 'lims':[],
                                                             'mode':'untyped-port'}],
                                              'nodetype': nodetype,
                                              'group'   : group }
        return json_obj

    @classmethod
    def _json_params(cls, boxtype, excluded, gui, min_precedence=0):
        """
        Return JSON-serializable list of parameter definitions using the
        chosen gui interface.
        """
        paramlist = cls.guis[gui].paramlist(boxtype.typeobj, min_precedence)
        json_params= [cls._json_param(name, p, boxtype.mode(name), gui=gui)
                      for (name, p) in paramlist if name not in excluded ]
        return [el for el in json_params if el]


    @classmethod
    def _json_param(cls, name, p, mode, gui):
        """
        Return the parameter mode string and None if parameter unsupported.
        """
        if mode != 'untyped' and not cls.guis[gui].supported(p):
            return None

        return {'name': name,
                'mode':  mode,
                'value': cls.guis[gui].param_default(p),
                'lims':  cls.guis[gui].param_lims(p),
                'step':  cls.guis[gui].param_step(p)}
