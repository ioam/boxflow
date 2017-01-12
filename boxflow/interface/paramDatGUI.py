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
        return str(p.default) if isinstance(p, param.ClassSelector) else p.default


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
        return isinstance(p, cls.supported_types)
