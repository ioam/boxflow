# Loads extension classes from supported libraries

from __future__ import absolute_import

def unsupported():
    return

from.interface import Interface

from .param import load_param, param_display               # Param is a core dependency
from .numbergen import  load_numbergen, numbergen_display  # Numbergen is included


try:
    import imagen
    from .imagen import load_imagen, imagen_display
except:
    load_imagen = unsupported


try:
    import holoviews
    from .holoviews import load_holoviews
except:
    load_holoviews = unsupported

load_param()
load_numbergen()
load_imagen()
load_holoviews()

__all__ = ['Interface',
           'param_display',
           'imagen_display',
           'numbergen_display']
