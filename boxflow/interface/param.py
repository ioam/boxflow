# Module adapting param classes for use with boxflow
#
#
from __future__ import absolute_import
import param


class Number(param.Parameterized):

    no_ports = ['number']
    nodetype = 'LabelledNode'

    number = param.Number(default=0)

class Integer(param.Parameterized):

    no_ports = ['integer']
    nodetype = 'LabelledNode'
    integer = param.Integer(default=0)

class String(param.Parameterized):

    no_ports = ['string']
    nodetype = 'LabelledNode'
    string = param.String(default='')

def param_classes():
    return [Number, Integer, String]

def param_display(instance):
    return {}
