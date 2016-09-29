#!/bin/bash

# 2019-09-29 <k127@gmx.de>
# src: https://grasswiki.osgeo.org/wiki/HOWTO_import_SRTM_elevation_data

echo "################################################################"
echo "##                                                            ##"
echo "##  THIS FILE IS WORK IN PROGRESS. EXITING.                   ##"
echo "##                                                            ##"
echo "################################################################"
exit 1;

cd geodata

# unzip all
for i in *.hgt.zip ; do unzip  $i ; done
# create mosaik (optionally reproject on the fly with -t_srs)
gdalwarp *.hgt srtm_mosaik.tif
# import
r.in.gdal input=srtm_mosaik output=srtm_mosaik

#r.in.gdal input=/home/user/SRTM/N47E010.hgt output=N47E010
#r.in.gdal input=/home/user/SRTM/N46E010.hgt output=N46E010
#r.in.gdal input=/home/user/SRTM/N47E011.hgt output=N47E011
#r.in.gdal input=/home/user/SRTM/N46E011.hgt output=N46E011
