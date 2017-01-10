# Module adapting param classes for use with boxflow
#
#
from __future__ import absolute_import
import param

class ParamBox(param.Parameterized):
    no_ports=[]

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


def param_nodes():
    return {'LabelledNode': [Number, Integer, String]}

def param_display(instance):
    return {}
