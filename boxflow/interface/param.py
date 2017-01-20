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


class Prompt(ParamBox):
    # ObjectSelectors become drop down menus.
    prompt = param.ObjectSelector(default='yes', objects=['yes','no'])


class Time(param.Parameterized):

    time = param.Number(default=0)

    step = param.Number(default=1)

    def propagate(self):
        return float(param.Dynamic.time_fn(fractions.Fraction(self.time)))

    def increment(self):
        self.time += self.step

    def decrement(self):
        self.time -= self.step


class ToolBox(param.Parameterized):
    """
    Demo of how various parameters render in BoxFlow and how you can
    sort them by precedence.
    """
    number = param.Number(default=0, precedence=0.1,
                          doc="Example number parameter")
    integer = param.Integer(default=0, precedence=0.2,
                            doc="Example integer parameter")
    string = param.String(default='', precedence=0.3,
                          doc="Example string parameter")
    boolean = param.Boolean(default=True, precedence=0.4,
                            doc="Example boolean parameter")
    magnitude = param.Magnitude(default=0.5, precedence=0.5,
                                doc="Example magnitude parameter")
    prompt = param.ObjectSelector(default='yes', objects=['yes','no'], precedence=0.6,
                                  doc="Example prompt")

    def randomize(self):
        import random
        self.number = random.random() * 10
        self.integer = int(random.random() * 10)
        ords = [random.randint(65, 122) for i in range(7)]
        self.string = ''.join(chr(o) for o in ords)
        self.boolean = random.random() > 0.5
        self.magnitude = random.random()
        self.prompt = 'yes' if random.random() > 0.5 else 'no'



def load_param():
    boxtypes = [BoxType(p, hidden=[p.name.lower()]) for p in [ Number, Integer, Prompt,
                                                               String, Boolean, Magnitude]]
    Inventory.add('param', boxtypes +
                  [BoxType(Time, buttons=OrderedDict([('increment','+'),
                                                      ('decrement','-')])),
                   BoxType(ToolBox, buttons = dict(randomize='Randomize'))])
