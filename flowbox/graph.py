# Module handling the graph structure


class Graph(object):

    def __init__(self):
        self.instances = []
        self.links = []

    def add_instance(self, instance):
        self.instances.append(instance)

    def remove_instance(self, name):
        self.instances.remove(self.find_instance(name))

    def add_link(self, src, output, dest, input):
        self.links.append((src, output, dest, input))
        # Set the dest parameter to the value of the source parameter
        src_instance = self.find_instance(src)
        dest_instance = self.find_instance(dest)
        dest_instance.set_param(**{input: src_instance})


    def remove_link(self, src, output, dest, input):
        self.links.remove((src, output, dest, input))
        # Set the dest parameter back to default
        instance = self.find_instance(dest)
        parameter = instance.params()[input]
        instance.set_param(**{input : parameter.default})


    def update_params(self, name, params):
        instance = self.find_instance(name)
        instance.set_param(**params)
        return [name] + self.update_downstream(instance)

    def find_instance(self, name):
        for instance in self.instances:
            if instance.name == name:
                return instance

    def inlinks(self, instance):
        return [ (s, o, d, i) for (s, o, d, i) in self.links
                 if d==instance.name ]

    def outlinks(self, instance):
        return [ (s, o, d, i) for (s, o, d, i) in self.links
                 if s==instance.name ]


    def update_downstream(self, instance):
        """
        Takes an instance and updates downstream instances, returning a
        list of names for all the updates instances.
        """
        updated_names = []
        outlinks = self.outlinks(instance)
        for (s,o,d,i) in outlinks:
            # Currently assuming single output 'self'
            updated_names += self.update_params(d, {i:instance})
        return updated_names
