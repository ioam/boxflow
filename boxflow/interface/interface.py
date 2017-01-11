# Module offering interface class for registering BoxTypes
#
#
from __future__ import absolute_import

class Interface(object):

    default_nodetype = 'LabelledNode'
    registry = {}

    @classmethod
    def add(cls, group, definition, nodetype=None):
        if nodetype is None:
            nodetype = cls.default_nodetype

        if group not in cls.registry:
            cls.registry[group] = {}

        if nodetype in cls.registry[group]:
            cls.registry[group][nodetype] += definition
        else:
            cls.registry[group][nodetype] =definition
