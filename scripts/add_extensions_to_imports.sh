#!/bin/sh

find dist/js -type f -name '*.js' -exec sed -r -i -e '/\.js";/b; s/from "(.+?)";/from "\1.js";/' {} \;
