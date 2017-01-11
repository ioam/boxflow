# Module adapting param classes for use with boxflow
#
#
from __future__ import absolute_import
import param

from .interface import Interface, BoxType

class ParamBox(param.Parameterized):

    def propagate(self):
        return getattr(self, self.__class__.__name__.lower())

class Number(ParamBox):
    number = param.Number(default=0)


class Integer(ParamBox):
    integer = param.Integer(default=0)


class String(ParamBox):
    string = param.String(default='')



def load_param():
    boxtypes = [BoxType(p, hidden=[p.name.lower()]) for p in [ Number, Integer, String]]
    Interface.add('param', boxtypes)
