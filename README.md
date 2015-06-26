Daesh visualizations
====================

This repository contains the code used to build the datavisualizations on the following pages:

* [Luftkrigen mod Islamisk Stat](http://www.information.dk/databloggen/512819)
* [Airwars](http://airwars.org/)
* [Læren fra Kobane](http://www.information.dk/databloggen/524725)

![Screenshot of the map visualization](/informeren/dataviz-daesh/master/assets/images/screenshot.png?raw=true)


Getting started
---------------

Run the following commands to make sure all libraries and build tools are installed:

    $ bower install
    $ npm install

Bower takes care of installing the required libraries, while npm handles installation of the build tools. Now you should be able to build the project using Gulp:

    $ gulp build

Available tasks:

* build: compile and prepare the data vizualisations for distribution
* serve: compile and serve a local copy of the data vizualisations
* clean: remove all build artefacts from the output directory


Preparing source data
---------------------

All the visualizations in this package rely on data managed in a few Google spreadsheets. You can use the `map.sh` script in the `tools` folder to grab the latest version of the data and convert it into formats for use with the visualizations.



Natural Earth
-------------

The map is based on data from the [Natural Earth](http://www.naturalearthdata.com/) project.

Since we're pre-rendering the map, we'll download the highest resolution map data available. For this visualization we'll download the [gray earth raster data](http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/raster/GRAY_HR_SR_OB.zip) (shaded relief, hypsography, and ocean bottom) and the full collection of [cultural vectors](http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/10m_cultural.zip).


Creating tiles
--------------

The tiles for the base layer are rendered using [TileMill](https://www.mapbox.com/tilemill/) with the following layers (from top to bottom):

* **#cities** is based on the *ne_10m_populated_places_simple.shp* shapefile
* **#countrynames** is based on the *ne_10m_admin_0_countries.shp* shapefile
* **#roads** is based on the *ne_10m_roads.shp* shapefile
* **#urban** is based on the *ne_10m_urban_areas.shp* shapefile [filtered](http://gis.stackexchange.com/questions/61753/how-to-select-points-within-a-polygon-from-another-layer) to only contain urban areas in Syria and Iraq
* **#countries** is based on the *ne_10m_admin_0_countries.shp* shapefile
* **#borders** is based on the *ne_10m_admin_0_boundary_lines_land.shp* shapefile
* **#hypsography** is based on the *GRAY_HR_SR_OB.tif* raster file

Before we can use the raster layer, we have to reproject the raster file to the default projection used by TileMill (more information is available in [this blogpost](https://www.mapbox.com/tilemill/docs/guides/reprojecting-geotiff/)):

    gdalwarp -s_srs EPSG:4326 -t_srs EPSG:3857 -r bilinear \
    -te -20037508.34 -20037508.34 20037508.34 20037508.34 \
    GRAY_HR_SR_OB.tif GRAY_HR_SR_OB_MERCATOR.tif

After styling the map, we export the necessary tiles in the MBtiles format.

Since we'll be hosting the tiles ourselves, we use [mb-util](https://github.com/mapbox/mbutil) to generate directories of PNG files:

    mb-util isil.mbtiles tiles


Credits
-------

Made with Natural Earth. Free vector and raster map data @ naturalearthdata.com.

The counter widget uses the bomb icon from [Megaicons](http://megaicons.net/iconspack-178/5769/).
