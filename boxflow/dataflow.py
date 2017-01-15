# Module handling the dataflow structure


class DataFlow(object):
    """
    The DataFlow object represents a dataflow graph consisting of links
    between boxes.
    """

    def __init__(self):
        self.boxes = []
        self.links = set()

    def add_box(self, box):
        self.boxes.append(box)

    def remove_box(self, name):
        self.boxes.remove(self.find_box(name))

    def add_link(self, src, output, dest, input):
        self.links.add((src, output, dest, input))
        # Set the dest parameter to the value of the source parameter
        src_box = self.find_box(src)
        dest_box = self.find_box(dest)
        dest_box.set_param(**{input: src_box.propagate()})


    def allowed_link(self, src, output, dest, input):
        """
        Predicate to see if the proposed connection is valid (i.e
        accepted by param).
        """
        src = self.find_box(src)
        dest = self.find_box(dest)
        try:
            dest.set_param(**{input: src.propagate()})
            dest.set_param(**{input: dest[input]})
            return True
        except:
            return False


    def remove_link(self, src, output, dest, input):
        self.links.remove((src, output, dest, input))
        box = self.find_box(dest)
        if box:
            # Set the dest parameter back to default
            parameter = box.params()[input]
            box.set_param(**{input : parameter.default})
        else:
            print('Warning (remove_link): Could not find box %r' % dest)


    def update_params(self, name, params):
        box = self.find_box(name)
        if box:
            box.set_param(**params)
            return [name] + self._update_downstream(box)
        else:
            print('Warning (update_params): Could not find box %r' % name)
            return [name]

    def _update_downstream(self, box):
        """
        Co-routine of update_params that takes a box and updates
        downstream boxes, returning a list of names for all the updated
        boxes.
        """
        updated_names = []
        outlinks = self.outlinks(box)
        for (s,o,d,i) in outlinks:
            # Not using output name properly...
            updated_names += self.update_params(d, {i:box.propagate()})
        return updated_names

    def find_box(self, name):
        for box in self.boxes:
            if box.name == name:
                return box

    def inlinks(self, box):
        return [ (s, o, d, i) for (s, o, d, i) in self.links
                 if d==box.name ]

    def outlinks(self, box):
        return [ (s, o, d, i) for (s, o, d, i) in self.links
                 if s==box.name ]
