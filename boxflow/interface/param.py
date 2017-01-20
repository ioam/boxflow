# Module adapting param classes for use with boxflow
#
#
from __future__ import absolute_import
import param
import fractions

from .inventory import Inventory, BoxType
from collections import OrderedDict

param.Dynamic.time_fn(val=0.0, time_type=fractions.Fraction)
param.Dynamic.time_dependent = True

class ParamBox(param.Parameterized):

    def propagate(self):
        return getattr(self, self.__class__.__name__.lower())

class Number(ParamBox):
    number = param.Number(default=0)


class Integer(ParamBox):
    integer = param.Integer(default=0)


class String(ParamBox):
    string = param.String(default='')


class Boolean(ParamBox):
    boolean = param.Boolean(default=True)


class Magnitude(ParamBox):
    magnitude = param.Magnitude(default=0.5)


class Time(param.Parameterized):

    time = param.Number(default=0)

    step = param.Number(default=1)

    def propagate(self):
        return float(param.Dynamic.time_fn(fractions.Fraction(self.time)))

    def increment(self):
        self.time += self.step

    def decrement(self):
        self.time -= self.step


def load_param():
    boxtypes = [BoxType(p, hidden=[p.name.lower()]) for p in [ Number, Integer,
                                                               String, Boolean, Magnitude]]
    Inventory.add('param', boxtypes +
                  [BoxType(Time, buttons=OrderedDict([('increment','+'),
                                                      ('decrement','-')]))])
