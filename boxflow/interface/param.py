# Module adapting param classes for use with boxflow
#
#
from __future__ import absolute_import
import param

class ParamBox(param.Parameterized):
    no_ports=[]
    nodetype = 'LabelledNode'

    def propagate(self):
        return getattr(self, self.no_ports[0])

class Number(ParamBox):
    no_ports = ['number']
    number = param.Number(default=0)


class Integer(ParamBox):
    no_ports = ['integer']
    integer = param.Integer(default=0)


class String(ParamBox):
    no_ports = ['string']
    string = param.String(default='')



class Unit(ParamBox):
    no_ports = ['number']
    number = param.Number(default=0, bounds=(0,1))


class Multiply(param.Parameterized):
    nodetype = 'LabelledNode'

    input = param.Number(default=0)

    multiplier = param.Number(default=1)

    def propagate(self):
        return self.input * self.multiplier

def param_classes():
    return [Number, Integer, String, Unit, Multiply]

def param_display(instance):
    return {}
