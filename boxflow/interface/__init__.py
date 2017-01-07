# Loads extension classes from supported libraries

from __future__ import absolute_import

def unsupported():
    return []

try:
    import param
    from .param import param_classes
except:
    param_classes = unsupported

try:
    import imagen
    from .imagen import imagen_classes
except:
    imagen_classes = unsupported


try:
    import holoviews
    from .holoviews import holoviews_classes
except:
    holoviews_classes = unsupported

__all__ = ['imagen_classes',
           'param_classes',
           'holoviews_classes']
