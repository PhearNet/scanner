#!/bin/bash

cd $OPENSHIFT_DATA_DIR
wget https://nmap.org/dist/nmap-7.00.tar.bz2
bzip2 -cd nmap-7.00.tar.bz2 | tar xvf -
cd nmap-7.00
./configure
make