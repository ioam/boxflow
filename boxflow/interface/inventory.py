# Module offering inventory class for registering BoxTypes
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
                 untyped=[], hidden=[], relabel={}, buttons={}, display_fn = None):
        self.typeobj = typeobj
        self.nodetype = nodetype
        self.relabel = relabel
        self.buttons = buttons
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

    def label(self, name):
        """
        Return the label associated with a parameter
        """
        if name in self.relabel:
            return self.relabel[name]
        elif name in self.buttons:
            return self.buttons[name]
        else:
            return name.replace('_',' ')


    def __call__(self, inventory, *args, **kwargs):
        return Box(self, inventory, *args, **kwargs)


class Box(object):
    """
    A Box is an instance of a BoxType. A Box is to a BoxType what a
    parameterized instance is to a parameterized class.

    The purpose of a Box is to define the necessary portion of the param
    API needed from parameterized instance and to allow additional
    processing when setting parameters.
    """
    def __init__(self, boxtype, inventory, *args, **kwargs):
        self.boxtype = boxtype
        self.inventory = inventory

        self.instance = boxtype.typeobj(*args, **kwargs)
        self.name = self.instance.name


    def display(self):
        return self.boxtype.display_fn(self.instance)

    def propagate(self):
        return (self.instance.propagate()
                if hasattr(self.instance, 'propagate') else self.instance)

    def set_param(self, *args, **kwargs):
        # Can get button definition from boxtype.
        self.instance.set_param(*args, **kwargs)

    def script_repr(self,imports=[],prefix="    "):
        return self.instance.script_repr()

    def params(self):
        return self.instance.params()

    def trigger(self, button):
        """
        Triggering a button invokes the associated method and returns
        the parameters (which might have changed).
        """
        registered = button in self.boxtype.buttons
        if not registered:
            print('Warning: Could not find button %r' % button)
            return
        getattr(self.instance, button)() # Call button method without arguments
        return {k:v for k,v in self.instance.get_param_values() if k!='name'}

    def __getitem__(self, name):
        "Convenience method to access a parameter value from the instance"
        return getattr(self.instance, name)



class Inventory(object):
    """
    The Inventory holds all available BoxType definitions and offers the
    means to serialize these definitions to JSON.
    """

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
                    inputs = cls.guis[gui].json_inputs(boxtype, excluded)
                    outputs = cls.guis[gui].json_outputs(boxtype)
                    buttons = cls.guis[gui].json_buttons(boxtype)
                    json_obj[boxtype.name] = {'inputs'  : inputs,
                                              'outputs' : outputs,
                                              'buttons' : buttons,
                                              'nodetype': nodetype,
                                              'group'   : group }
        return json_obj

