#!/usr/bin/env bash

rm -rf public
mkdir public
mkdir public/js

cp index.html public/index.html
cp -R styles public/
cp -R svg public/
cp -R images public/
cp js/bundle.js public/js/bundle.js
