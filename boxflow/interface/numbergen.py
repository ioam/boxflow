# Module offering basic numbergen classes
#
#
from __future__ import absolute_import
import param
import numbergen
import operator

from .inventory import Inventory, BoxType

param.Dynamic.time_dependent = True
numbergen.UniformRandom.time_dependent = True

class Percentage(param.Parameterized):

    percent = param.Number(default=50, bounds=(0,100))

    def propagate(self):
        return self.percent


class BinaryOp(numbergen.NumberGenerator):

    lhs = param.Number(default=0)

    rhs = param.Number(default=1)

    operator = param.ObjectSelector(objects=['add','sub','mul','mod','pow',
                                             'div','truediv','floordiv'])

    def __call__(self):
        op = getattr(operator, self.operator)
        return op(self.lhs() if callable(self.lhs) else self.lhs,
                  self.rhs() if callable(self.rhs) else self.rhs)

class URandom(numbergen.UniformRandom): # TODO: Namespace properly
    pass

def load_numbergen():
    Inventory.add('numbergen', [BoxType(Percentage, hidden=['percent']),
                                BoxType(URandom,
                                        hidden=['lbound','ubound','seed']),
                                BinaryOp])
