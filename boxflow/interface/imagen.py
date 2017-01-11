# Module adapting imagen classes for use with boxflow
#
#
from __future__ import absolute_import

import base64
from PIL import Image
from StringIO import StringIO

import imagen
from imagen import PatternGenerator
import param


from .interface import Interface, BoxType

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



def image_to_base64(arr):
    im = Image.fromarray((arr * 255))
    buff = StringIO()
    im.convert('RGBA').save(buff, format='png')
    buff.seek(0)
    return 'data:image/png;base64,' + base64.b64encode(buff.read())


def imagen_display(instance):
    """
    Similar to a display hook. Returns a dictionary of extra content if
    applicable.
    """
    return {'b64':image_to_base64(instance())}


binary_ops = [ BoxType(Sub, untyped=['lhs','rhs']),
               BoxType(Mul, untyped = ['lhs','rhs'])]

patterngenerators = [imagen.Disk, imagen.Gaussian, imagen.Line, imagen.Spiral ]
vanilla_classes = [ BoxType(patgen,
                            nodetype='ImageNode',
                            display_fn=imagen_display)
                    for patgen in patterngenerators ]

def load_imagen():
    Interface.add('imagen', vanilla_classes + binary_ops)
    Interface.add('imagen',  BoxType(Viewport,
                                     nodetype='Viewport',
                                     untyped=['input'],
                                     display_fn=imagen_display))


