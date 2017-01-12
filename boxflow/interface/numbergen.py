# Module offering basic numbergen classes
#
#
from __future__ import absolute_import
import param
import numbergen
import operator

from .interface import Interface, BoxType

class Percentage(param.Parameterized):

    percent = param.Number(default=50, bounds=(0,100))

    def propagate(self):
        return self.percent


class Magnitude(param.Parameterized):

    magnitude = param.Number(default=0.5, bounds=(0,1))

    def propagate(self):
        return self.magnitude


class BinaryOp(numbergen.NumberGenerator):

    lhs = param.Number(default=0)

    rhs = param.Number(default=1)

    operator = param.ObjectSelector(objects=['add','sub','mul','mod','pow',
                                             'div','truediv','floordiv'])

    def __call__(self):
        op = getattr(operator, self.operator)
        return op(self.lhs() if callable(self.lhs) else self.lhs,
                  self.rhs() if callable(self.rhs) else self.rhs)

def load_numbergen():
    Interface.add('numbergen', [BoxType(Percentage, hidden=['percent']),
                                BoxType(Magnitude,  hidden=['magnitude']),
                                BinaryOp])
