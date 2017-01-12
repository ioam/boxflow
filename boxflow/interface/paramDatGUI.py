# Module to convert parameters into specs usable by datGUI

from __future__ import absolute_import
import param
import imagen

class ParamDatGUI(object):

    supported_types = (param.Number, param.Integer, param.String, param.Boolean)

    @classmethod
    def param_lims(cls, p):
        """
        Given a parameter, return a datGUI lims constraint.
        """
        numeric = (param.Number, param.Integer)
        if isinstance(p, numeric):
            bounds = p.get_soft_bounds()
            if (bounds[0] is None) and (bounds[1] is not None):
                print("FIXME: Bounded max not supported yet")
            return [el for el in bounds if el is not None]
        elif isinstance(p, param.ObjectSelector):
            return [p.objects]
        return []

    @classmethod
    def param_step(cls, p):
        """
        Given a parameter, return a datGUI step constraint.
        """
        if isinstance(p, param.Integer):
            return 1
        elif isinstance(p, param.Number):
            return 0.01
        else:
            return None

    @classmethod
    def param_default(cls, p):
        """
        Given a parameter, return a suitable default value usable by datGUI
        """
        if isinstance(p, param.ObjectSelector):
            return p.default if p.default else p.objects[0]
        elif isinstance(p, param.ClassSelector):
            return str(p.default)
        else:
            return p.default


    @classmethod
    def paramlist(cls, typeobj, min_precedence):
        """
        Given a parameterized object, return a (name, parameter) pairs list.
        """
        return [(n,p) for n,p in typeobj.params().items()
                if not (cls.excluded(p, min_precedence) or n=='name')]

    @classmethod
    def excluded(cls, p, min_precedence):
        """
        Predicate specifying if a parameter should be excluded from the GUI or not.
        """
        if p.precedence is None:
            return False
        return (p.precedence<=min_precedence)

    @classmethod
    def supported(cls, p):
        if isinstance(p, cls.supported_types):
            return True
        if isinstance(p, param.ObjectSelector):
            # Currently supporting ObjectSelector if all objects are strings
            return all(isinstance(el, str) for el in p.objects)
        return False