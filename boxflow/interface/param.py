# Module adapting param classes for use with boxflow
#
#
from __future__ import absolute_import
import param


class Number(param.Parameterized):

    nodetype = 'LabelledNode'

    number = param.Number(default=0)

def param_classes():
    return [Number]

def param_display(instance):
    return {}
