# Loads extension classes from supported libraries

from __future__ import absolute_import

def unsupported():
    return []


from .param import param_classes, param_display # Param is a core dependency
from .arithmetic import  arithmetic_classes, arithmetic_display

try:
    import imagen
    from .imagen import imagen_classes, imagen_display
except:
    imagen_classes = unsupported


try:
    import holoviews
    from .holoviews import holoviews_classes
except:
    holoviews_classes = unsupported

__all__ = ['imagen_classes',
           'param_classes',
           'holoviews_classes',

           'param_display',
           'imagen_display']
