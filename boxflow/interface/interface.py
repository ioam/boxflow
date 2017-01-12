# Module offering interface class for registering BoxTypes
#
#
from __future__ import absolute_import
from collections import defaultdict

from .paramDatGUI import ParamDatGUI

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
