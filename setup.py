#!/usr/bin/env python

import os, sys
from distutils.core import setup

install_requires = ['tornado', 'param']
extras_require={'all': ['imagen', 'pillow', 'pyperclip']}

setup_args = dict(
    name='boxflow',
    version="0.0.3",
    install_requires = install_requires,
    extras_require = extras_require,
    description='Visual dataflow programming between parameterized objects.',
    long_description=open('README.md').read() if os.path.isfile('README.md') else 'Consult README.md',
    author= "Jean-Luc Stevens",
    author_email= "jlrstevens@gmail.com",
    maintainer= "IOAM",
    maintainer_email= "jlrstevens@gmail.com",
    platforms=['Windows', 'Mac OS X', 'Linux'],
    license='BSD',
    url='https://github.com/ioam/boxflow',
    packages = ["boxflow", "boxflow.assets", "boxflow.js", "boxflow.static"],
    package_data={'boxflow':['*.tpl'],
                  'boxflow.assets':['*.png'],
                  'boxflow.js':['*.js'],
                  'boxflow.static':['*.js']},
    classifiers = [
        "License :: OSI Approved :: BSD License",
        "Development Status :: 3 - Alpha",
        "Programming Language :: Python :: 2.7",
        "Programming Language :: Python :: 3.3",
        "Programming Language :: Python :: 3.4",
        "Programming Language :: Python :: 3.5",
        "Programming Language :: Python :: 3.6",
        "Operating System :: OS Independent",
        "Intended Audience :: Science/Research",
        "Intended Audience :: Developers",
        "Natural Language :: English",
        "Topic :: Scientific/Engineering",
        "Topic :: Software Development :: Libraries"]
)


if __name__=="__main__":
    setup(**setup_args)
