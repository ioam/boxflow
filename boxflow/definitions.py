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
            step = 1
        elif isinstance(p, param.Number):
            return 0.01
        else:
            return None

    @classmethod
    def supported(cls, p):
        supported_types = (param.ClassSelector, param.Number,
                           param.Integer, param.String, param.Boolean)
        if not isinstance(p, supported_types):
            return False
        elif isinstance(p, param.ClassSelector):
            return issubclass(p.class_, imagen.PatternGenerator)

        return True


    @classmethod
    def param_definition(cls, name, p):
        """
        Returns the appropriate JSON for a parameter
        """
        if not cls.supported(p): return None
        value = str(p.default) if isinstance(p, param.ClassSelector) else p.default
        lims = 'untyped-port' if isinstance(p, param.ClassSelector) else cls.param_lims(p)
        return {'name': name, 'value': value, 'lims':lims, 'step': cls.param_step(p)}

    @classmethod
    def excluded(cls, k,v, excluded, min_precedence):
        if (k == 'name') or (k in excluded):
            return True
        if v.precedence is None:
            return False
        return (v.precedence<=min_precedence)

    @classmethod
    def generate(cls, objs, excluded, min_precedence=0):
        """
        Generate JSON parameter definitions for the given parameterized
        objects.
        """
        # TODO: lims: 'no-port' for param but no port.
        specs = {}
        for obj in objs:
            cls_name = obj.__name__
            nodetype = getattr(obj, 'nodetype', 'ImageNode')
            pairs = [(k,v) for k,v in obj.params().items()
                     if not cls.excluded(k,v, excluded, min_precedence) ]
            inputs = [cls.param_definition(name,p) for name,p in sorted(pairs)]
            specs[cls_name] = {'inputs': [el for el in inputs if el],
                               'outputs':[{'name':'', 'lims':'untyped-port'}],
                               'nodetype': nodetype }
        return specs
