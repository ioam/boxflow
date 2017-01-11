# Module to inspect parameterized object and generate JSON param specs
import param
import imagen

class ParamDefinitions(object):

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
    def parameter_mode(cls, name, p, obj):
        """
        Return the parameter mode string and None if parameter unsupported.
        """
        supported_types = (param.Number, param.Integer, param.String, param.Boolean)

        untyped_ports = getattr(obj, 'untyped_ports', [])
        no_ports = getattr(obj, 'no_ports', [])
        if name in untyped_ports:
            return 'untyped-port'
        elif isinstance(p, supported_types):
            return 'no-port' if name in no_ports else 'normal'
        return None


    @classmethod
    def param_definition(cls, name, p, obj):
        """
        Returns the appropriate JSON for a parameter
        """
        mode = cls.parameter_mode(name, p, obj)
        if mode is None : return None
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
    def generate(cls, groups, excluded, min_precedence=0):
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
                    inputs = [cls.param_definition(name,p, boxtype.typeobj)
                              for name,p in sorted(pairs)]
                    specs[boxtype.name] = {'inputs': [el for el in inputs if el],
                                           'outputs':[{'name':'', 'lims':[],
                                                       'mode':'untyped-port'}],
                                           'nodetype': nodetype,
                                           'group': group }
        return specs
