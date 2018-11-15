# Module adapting imagen classes for use with boxflow
#
#
from __future__ import absolute_import

import os
import base64
from PIL import Image
from io import BytesIO

import imagen
from imagen import PatternGenerator, Gaussian
from imagen import image
from imagen import random
from imagen.random import RandomGenerator
from imagen.transferfn import TransferFn

import numpy as np
import copy

import param
import fractions

from numbergen import TimeAware

param.Dynamic.time_fn(val=0.0, time_type=fractions.Fraction)
param.Dynamic.time_dependent = True
TimeAware.time_dependent = True # Why can't I set it on RandomGenerator?

from .inventory import Inventory, BoxType

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
    buff = BytesIO()
    im.convert('RGBA').save(buff, format='png')
    buff.seek(0)
    b64 = base64.b64encode(buff.read())
    return 'data:image/png;base64,' + b64.decode('utf8')


def imagen_display(instance):
    """
    Similar to a display hook. Returns a dictionary of extra content if
    applicable.
    """
    return {'b64':image_to_base64(instance())}


fpath, _ = os.path.split(__file__)
manhattan_path = os.path.abspath(os.path.join(fpath, '..',
                                              'assets', 'manhattan.png'))

class FileImage(image.FileImage):

    def __init__(self, *args, **kwargs):
        super(FileImage, self).__init__(*args, **dict(kwargs,
                                                      filename=manhattan_path))



class Convolve(TransferFn):
    """
    Imagen transfer function adapted to work without need sheet coordinates.
    """

    kernel_pattern = param.ClassSelector(PatternGenerator,
                     default=Gaussian(size=0.05,aspect_ratio=1.0), doc="""
      The kernel pattern used in the convolution. The default kernel
      results in an isotropic Gaussian blur.""")

    init_keys = param.List(default=[], constant=True)

    def __init__(self, **params):
        super(Convolve,self).__init__(**params)


    def initialize(self,  kernel_xdensity, kernel_ydensity, **kwargs):
        super(Convolve, self).initialize(**kwargs)
        pattern_copy = copy.deepcopy(self.kernel_pattern)
        pattern_copy.set_matrix_dimensions(self.kernel_pattern.bounds,
                                           kernel_xdensity,
                                           kernel_ydensity)
        self.kernel = pattern_copy()

    def __call__(self, x):
        if not hasattr(self, 'kernel'):
            raise Exception("Convolve must be initialized before being called.")
        fft1 = np.fft.fft2(x)
        fft2 = np.fft.fft2(self.kernel, s=x.shape)
        convolved_raw = np.fft.ifft2( fft1 * fft2).real

        k_rows, k_cols = self.kernel.shape  # ORIGINAL
        rolled = np.roll(np.roll(convolved_raw, -(k_cols//2), axis=-1), -(k_rows//2), axis=-2)
        convolved = rolled / float(self.kernel.sum())
        x.fill(0.0)
        x+=convolved


class Blur(PatternGenerator):
    """
    Trivial wrapper around a pattern generator used to define a viewport
    node.
    """

    input = param.ClassSelector(class_=PatternGenerator,
                                default=imagen.Constant(), precedence=1)

    blur_amount = param.Integer(default=10,softbounds=(10, 1000),precedence=1)

    kernel = param.ClassSelector(PatternGenerator,
                                 default=Gaussian(size=0.05,aspect_ratio=1.0), precedence=-1,
                                 doc="""
      The kernel pattern used in the convolution. The default kernel
      results in an isotropic Gaussian blur.""")

    x = param.Number(default=0.0,softbounds=(-1.0,1.0),precedence=-1)
    y = param.Number(default=0.0,softbounds=(-1.0,1.0),precedence=-1)
    orientation = param.Number(default=0.0,precedence=-1)
    size = param.Number(default=1.0, precedence=-1)
    scale = param.Number(default=1.0, precedence=-1)
    offset = param.Number(default=0.0,precedence=-1)
    output_fns = param.HookList(default=[], precedence=-1)
    mask_shape = param.ClassSelector(param.Parameterized, default=None, precedence=-1)

    def function(self,p):
        arr = p.input()
        conv = Convolve(kernel_pattern=p.kernel)
        conv.initialize(p.blur_amount, p.blur_amount, kernel_pattern=p.kernel)
        conv(arr)
        return arr




class Invert(PatternGenerator):
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
        arr = p.input()
        mina, maxa = arr.min(), arr.max()
        zeros = np.zeros(arr.shape)
        return (zeros - arr) + maxa


binary_ops = [ BoxType(Sub, untyped=['lhs','rhs']),
               BoxType(Mul, untyped = ['lhs','rhs'])]

patterngenerators = [imagen.Disk, imagen.Gaussian, imagen.Line,
                     imagen.Spiral, imagen.Gabor, imagen.SineGrating,
                     imagen.ConcentricRings, imagen.Asterisk, FileImage,
                     imagen.random.GaussianRandom, imagen.random.GaussianCloud,
                     imagen.random.UniformRandom, imagen.random.UniformRandomInt]
vanilla_classes = [ BoxType(patgen,
                            nodetype='ImageNode',
                            display_fn=imagen_display)
                    for patgen in patterngenerators ]


imageops = [BoxType(Blur, nodetype='ImageNode',
                    untyped=['input'],
                    display_fn=imagen_display),
            BoxType(Invert,
                    untyped=['input'])]



def load_imagen():
    Inventory.add('imagen', vanilla_classes + binary_ops + imageops )
    Inventory.add('imagen',  BoxType(Viewport,
                                     nodetype='Viewport',
                                     untyped=['input'],
                                     display_fn=imagen_display))


