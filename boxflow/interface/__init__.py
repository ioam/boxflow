# Loads extension classes from supported libraries

from __future__ import absolute_import
from .inventory import Inventory

from .param import load_param            # Param is a core dependency
from .numbergen import  load_numbergen   # Numbergen is included


try:
    import imagen
    from .imagen import load_imagen
except:
    load_imagen = None


try:
    import holoviews
    from .holoviews import load_holoviews
except:
    load_holoviews = None

load_param()
load_numbergen()

if load_imagen:
    load_imagen()

if load_holoviews:
    load_holoviews()

__all__ = ['Inventory']
