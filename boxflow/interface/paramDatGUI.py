# Module to convert parameters into specs usable by datGUI

from __future__ import absolute_import
import param
import imagen

class ParamDatGUI(object):

    @classmethod
    def param_lims(cls, p):
        # Could support object selectors?
        supported = (param.Number, param.Integer)
        if isinstance(p, supported):
            bounds = p.get_soft_bounds()
            if (bounds[0] is None) and (bounds[1] is not None):
                print("FIXME: Bounded max not supported yet")
            return [el for el in bounds if el is not None]
        return []

    @classmethod
    def param_step(cls, p):
        if isinstance(p, param.Integer):
            return 1
        elif isinstance(p, param.Number):
            return 0.01
        else:
            return None

    @classmethod
    def param_definition(cls, name, p, mode):
        """
        Return the parameter mode string and None if parameter unsupported.
        """
        supported_types = (param.Number, param.Integer, param.String, param.Boolean)

        if mode != 'untyped' and not isinstance(p, supported_types):
            return None
        value = str(p.default) if isinstance(p, param.ClassSelector) else p.default
        return {'name': name,
                'value': value,
                'mode': mode,
                'lims':cls.param_lims(p),
                'step': cls.param_step(p)}

    @classmethod
    def excluded(cls, k,v, excluded, min_precedence):
        if (k == 'name') or (k in excluded):
            return True
        if v.precedence is None:
            return False
        return (v.precedence<=min_precedence)

    @classmethod
    def json(cls, groups, excluded, min_precedence=0):
        """
        Generate JSON parameter definitions for the given parameterized
        objects.
        """
        specs = {}
        for group, spec in groups.items():
            for nodetype, boxlist in spec.items():
                for boxtype in boxlist:
                    pairs = [(k,v) for k,v in boxtype.typeobj.params().items()
                             if not cls.excluded(k,v, excluded, min_precedence) ]
                    inputs = [cls.param_definition(name, p, boxtype.mode(name))
                              for name,p in sorted(pairs)]
                    specs[boxtype.name] = {'inputs': [el for el in inputs if el],
                                           'outputs':[{'name':'', 'lims':[],
                                                       'mode':'untyped-port'}],
                                           'nodetype': nodetype,
                                           'group': group }
        return specs
