# Loads extension classes from supported libraries

from __future__ import absolute_import

def unsupported():
    return {}


from .param import param_nodes, param_display               # Param is a core dependency
from .numbergen import  numbergen_nodes, numbergen_display  # Numbergen is included


try:
    import imagen
    from .imagen import imagen_nodes, imagen_display
except:
    imagen_nodes = unsupported


try:
    import holoviews
    from .holoviews import holoviews_nodes
except:
    holoviews_nodes = unsupported

__all__ = ['imagen_nodes',
           'param_nodes',
           'numbergen_nodes',
           'holoviews_nodes',

           'param_display',
           'imagen_display']
