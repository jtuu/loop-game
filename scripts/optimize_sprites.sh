#!/bin/sh

find dist/sprites -type f -name '*.png' -exec optipng -clobber {} \;
