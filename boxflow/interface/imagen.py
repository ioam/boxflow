# Module adapting imagen classes for use with boxflow
#
#
from __future__ import absolute_import
import imagen
from imagen import PatternGenerator
import param


supressed = ['bounds','xdensity','ydensity','x','y','z','group',
             'position','orientation','size','scale',
             'offset','mask','mask_shape','output_fns', 'name']


class Viewport(PatternGenerator):
    """
    Trivial wrapper around a pattern generator used to define a viewport
    node.
    """

    input = param.ClassSelector(class_=PatternGenerator,
                                default=imagen.Constant(), precedence=1)

    x = param.Number(default=0.0,softbounds=(-1.0,1.0),precedence=-1)
    y = param.Number(default=0.0,softbounds=(-1.0,1.0),precedence=-1)
    orientation = param.Number(default=0.0,precedence=-1)
    size = param.Number(default=1.0, precedence=-1)
    scale = param.Number(default=1.0, precedence=-1)
    offset = param.Number(default=0.0,precedence=-1)
    output_fns = param.HookList(default=[], precedence=-1)
    mask_shape = param.ClassSelector(param.Parameterized, default=None, precedence=-1)

    def function(self,p):
        return p.input()




class BinaryOp(PatternGenerator):

    lhs = param.ClassSelector(class_=PatternGenerator,
                              default=imagen.Constant(), precedence=1)

    rhs = param.ClassSelector(class_=PatternGenerator,
                              default=imagen.Constant(), precedence=1)

    x = param.Number(default=0.0,softbounds=(-1.0,1.0),precedence=-1)
    y = param.Number(default=0.0,softbounds=(-1.0,1.0),precedence=-1)
    orientation = param.Number(default=0.0,precedence=-1)
    size = param.Number(default=1.0, precedence=-1)
    scale = param.Number(default=1.0, precedence=-1)
    offset = param.Number(default=0.0,precedence=-1)
    output_fns = param.HookList(default=[], precedence=-1)
    mask_shape = param.ClassSelector(param.Parameterized, default=None, precedence=-1)


class Add(BinaryOp):

    def function(self,p):
        return (p.lhs + p.rhs)()


class Sub(BinaryOp):

    def function(self,p):
        return (p.lhs - p.rhs)()


class Mul(BinaryOp):

    def function(self,p):
        return (p.lhs * p.rhs)()




binary_ops = [Sub, Mul]
support_classes = [Viewport]
vanilla_classes = [ imagen.Disk,
                    imagen.Gaussian,
                    imagen.Line,
                    imagen.Spiral ]

def imagen_classes():
    return vanilla_classes + binary_ops + support_classes
