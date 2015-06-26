#!/bin/bash

# the urls of the google documents containing the raw data. these can be defined
# here or in a separate configuration file (config.sh) in this directory.
sorties_url=""
targets_url=""
civcas_url=""

set -e

# get the path to the directory where this script is located.
dir=$(cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd)

# read settings from the configuration file if it exists.
if [ -e "$dir/config.sh" ]; then
  . "$dir/config.sh"
fi

echo -n "Downloading sortie data... "
curl -s "$sorties_url" > /tmp/daesh-sorties
echo "Done!"

echo -n "Downloading target data... "
curl -s "$targets_url" > /tmp/daesh-targets
echo "Done!"

echo -n "Downloading civcas data... "
curl -s "$civcas_url" > /tmp/daesh-civcas
echo "Done!"

echo -n "Building data files for visualizations... "
{
  ./map.pl ../assets/data;
  ./kobani.pl ../assets/data;
  ./targets.pl ../assets/data;
  ./top.pl ../assets/data;
} 2>> map.log
echo "Done!"

echo -n "Removing temporary files... "
if [ -e /tmp/daesh-sorties ]; then
  rm /tmp/daesh-sorties
fi
if [ -e /tmp/daesh-targets ]; then
  rm /tmp/daesh-targets
fi
if [ -e /tmp/daesh-civcas ]; then
  rm /tmp/daesh-civcas
fi
echo "Done!"
