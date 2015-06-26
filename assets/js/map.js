(function($) {

var data;

var language;

var map;
var layers = [];
var casualtiesLayers = [];
var group = L.layerGroup();
var casualtiesGroup = L.layerGroup();

var interval;
var playing = false;

/* --- CHARTS ---------------------------------------------------------------- */

var w = $('#inf-sorties').width();

var dimensions = {};
dimensions = {
  margin: {top: 0, right: 0, bottom: 30, left: 32},
  width: $('#inf-sorties').width() - 32 - 0, // margin-left, margin-right
  height: 240 - 0 - 30,                      // margin-top, margin-bottom
};

var dimensionstgt = {};
dimensionstgt = {
  margin: {top: 0, right: 20, bottom: 30, left: 130},
  width: $('#inf-targets').width() - 130 - 20, // margin-left, margin-right
  height: 240 - 0 - 30,                        // margin-top, margin-bottom
};

function init_sortie_chart(dim) {
  var containerid = '#inf-sorties';
  var wrapperid = 'inf-chart-sorties';

  var svg = d3.select(containerid)
    .insert('svg')
    .attr('width', dim.width + dim.margin.left + dim.margin.right)
    .attr('height', dim.height + dim.margin.top + dim.margin.bottom);

  svg.append('g')
    .attr('transform', 'translate(' + dim.margin.left + ',' + dim.margin.top + ')')
    .attr('id', wrapperid);

  d3.select('#' + wrapperid)
    .append('g')
    .attr('class', 'x axis');

  d3.select('#' + wrapperid)
    .append('g')
    .attr('class', 'y axis');
}

function sortie_chart(date) {
  var wrapperid = '#inf-chart-sorties';

  var x = d3.scale.ordinal()
    .rangeRoundBands([0, dimensions.width], .3);

  var y = d3.scale.linear()
    .range([dimensions.height, 0]);

  var xAxis = d3.svg.axis()
    .scale(x)
    .innerTickSize(0)
    .outerTickSize(0)
    .orient('bottom');

  var yAxis = d3.svg.axis()
      .scale(y)
      .innerTickSize(0)
      .outerTickSize(0)
      .tickPadding(0)
      .orient('left')
      .ticks(5, 'd');

  var sorties = $.map(data.sorties, function(v){
    return v;
  });

  x.domain(data.sorties[date].map(function(d) { return d.key; }));
  y.domain([0, d3.max(sorties, function(d) { return d.value; }) + 50]);

  var graph = d3.select(wrapperid)
  var bars = graph.selectAll('rect.bar').data(data.sorties[date]);

  bars.enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', function(d) { return x(d.key); })
      .attr('width', x.rangeBand());
  bars.transition()
      .duration(300)
      .ease('quad')
      .attr('height', function(d) { return dimensions.height - y(d.value); })
      .attr('y', function(d) { return y(d.value); });

  graph.select('.x.axis')
       .attr('transform', 'translate(0,' + dimensions.height + ')')
       .call(xAxis);

  graph.select('.y.axis')
       .call(yAxis);
}

function init_target_chart(dim) {
  var containerid = '#inf-targets';
  var wrapperid = 'inf-chart-targets';

  var svg = d3.select(containerid)
    .insert('svg')
    .attr('width', dim.width + dim.margin.left + dim.margin.right)
    .attr('height', dim.height + dim.margin.top + dim.margin.bottom);

  svg.append('g')
    .attr('transform', 'translate(' + dim.margin.left + ',' + dim.margin.top + ')')
    .attr('id', wrapperid);

  d3.select('#' + wrapperid)
    .append('g')
    .attr('class', 'x axis');

  d3.select('#' + wrapperid)
    .append('g')
    .attr('class', 'y axis');
}

function target_chart(date) {
  var wrapperid = '#inf-chart-targets';

  var x = d3.scale.linear()
    .range([0, dimensionstgt.width]);

  var y = d3.scale.ordinal()
    .rangeRoundBands([0, dimensionstgt.height], .3);

  var xAxis = d3.svg.axis()
      .scale(x)
      .innerTickSize(0)
      .outerTickSize(0)
      .tickPadding(0)
      .orient('bottom')
      .ticks(5, 'd');

  var yAxis = d3.svg.axis()
    .scale(y)
    .innerTickSize(0)
    .outerTickSize(0)
    .orient('left');

  var targets = $.map(data.targets, function(v){
    return v;
  });

  x.domain([0, d3.max(targets, function(d) { return d.value; })]);
  y.domain(data.targets[date].map(function(d) { return d.key; }));

  var graph = d3.select(wrapperid)
  var bars = graph.selectAll('rect.bar').data(data.targets[date]);

  bars.enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('y', function(d) { return y(d.key); })
      .attr('height', y.rangeBand());
  bars.transition()
      .duration(300)
      .ease('quad')
      .attr('width', function(d) { return x(d.value); })
      .attr('x', 0);

  graph.select('.x.axis')
       .attr('transform', 'translate(0,' + dimensionstgt.height + ')')
       .call(xAxis);

  graph.select('.y.axis')
       .attr('transform', 'translate(0,0)')
       .call(yAxis);
}

/* --- MAP ------------------------------------------------------------------- */

function init_map() {
  var southWest = L.latLng(25.690587654250685, 25.80615234375),
      northEast = L.latLng(40.50972584293751, 58.48095703125),
      bounds = L.latLngBounds(southWest, northEast);

  // Create the map
  var zoom = !L.Browser.mobile;
  map = L.map('inf-map', {
    attributionControl: false,
    zoomControl: zoom,
    minZoom: 5,
    maxZoom: 7,
    maxBounds: bounds,
    scrollWheelZoom: false
  });

  // Add tile layer
  var tileURL = '../tiles/' + language + '/{z}/{x}/{y}.png';
  var tiles = L.tileLayer(tileURL, {
    attribution: 'Made with Natural Earth',
    maxZoom: 7
  });
  tiles.addTo(map);

  if (L.Browser.mobile) {
    map.setView([33.21931712, 42.14132735], 5);
  }
  else {
    map.setView([33.21931712, 42.14132735], 6);

    // Add a minimap
    var miniTiles = L.tileLayer('../tiles/en/{z}/{x}/{y}.png');
    var miniMap = new L.Control.MiniMap(miniTiles, {
      position: 'topright',
      width: 180,
      height: 120,
      zoomLevelFixed: 0
    }).addTo(map);
  }

  // Add a control for showing the current date
  var date = L.control({position: 'bottomleft'});
  date.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info date');
    div.innerHTML = '<span class="inf-date"></span>';
    return div;
  };
  date.addTo(map);

  // Add the countries to the map
  geojsonCountryLayer = L.geoJson(null, {
    style: function (feature) {
      if (feature.properties.adm0_a3 == 'IRQ' || feature.properties.adm0_a3 == 'SYR') {
        return {
          color: '#600',
          opacity: 1,
          weight: 1,
          fillColor: '#600',
          fillOpacity: .2,
        };
      }
      else {
        return {
          color: '#888',
          opacity: 1,
          weight: 1,
          fillColor: '#999',
          fillOpacity: 1,
        };
      }
    },
  });
}

/* --- SLIDER ---------------------------------------------------------------- */

function init_slider(dates) {
  var slider = $('#inf-slider').slider({
    min: 0,
    max: dates.length - 1,
    range: "min",
    value: 0,
    slide: function(event, ui) {
      $('span.inf-date').html(render_date(dates[ui.value]));
    },
    change: function(event, ui) {
      update_graphs(dates[ui.value]);

      $('span.inf-date').html(render_date(dates[ui.value]));

      for (var i = 0; i < layers.length; i++) {
        if (i == ui.value && !group.hasLayer(layers[i]) && layers[i] !== undefined) {
          group.addLayer(layers[i]);
        }
        if (i != ui.value && group.hasLayer(layers[i]) && layers[i] !== undefined) {
          group.removeLayer(layers[i]);
        }
      }

      for (var i = 0; i < casualtiesLayers.length; i++) {
        if (i == ui.value && !group.hasLayer(casualtiesLayers[i]) && casualtiesLayers[i] !== undefined) {
          group.addLayer(casualtiesLayers[i]);
        }
        if (i != ui.value && group.hasLayer(casualtiesLayers[i]) && casualtiesLayers[i] !== undefined) {
          group.removeLayer(casualtiesLayers[i]);
        }
      }
    }
  });
}

/* --- MAIN ------------------------------------------------------------------ */

$(function() {
  language = 'en';
  if (window.location.href.indexOf('index.da.html') > -1) {
    language = 'da';
  }

  // Initialize counters in header
  $.getJSON('../data/widget.json', function(json) {
    $('#count-sorties').text(json.count);
    $('#count-days').text(json.days);
  });

  // Initialize charts
  init_sortie_chart(dimensions);
  init_target_chart(dimensionstgt);

  $.getJSON('../data/map.' + language + '.json', function(json) {
    data = json;
    init_slider(data.dates);
    init_map();
    $('span.inf-date').html(data.dates[0]);
    update_graphs(data.dates[0]);

    // Populate airstrike target layer

    // Build a hash of all dates in the data set
    var seen = [];
    for (var i = 0; i < data.points.length; i++) {
      var date = data.points[i].features[0].properties.date;
      seen[date] = i;
    }

    // Add a map layer for each date in the data set
    for (var i = 0; i < data.dates.length; i++) {
      if (seen[data.dates[i]] !== undefined) {
        layers[i] = L.geoJson(data.points[seen[data.dates[i]]], {
          onEachFeature: function (feature, layer) {
            var html;
            if (language === 'da') {
              html = 'Lokation: ' + feature.properties.location + '<br />Angreb: ' + feature.properties.attacks;
            }
            else {
              html = 'Location: ' + feature.properties.location + '<br />Attacks: ' + feature.properties.attacks;
            }
            layer.bindPopup(html);
          },
          pointToLayer: function (feature, latlng) {
            var radius = 7;
            if (feature.properties.attacks >= 20) {
              radius = 10;
            }
            if (feature.properties.attacks >= 100) {
              radius = 16;
            }
            if (feature.properties.attacks >= 500) {
              radius = 22;
            }
            if (feature.properties.attacks > 1000) {
              radius = 31;
            }

            if (i === data.points.length - 1) {
              return L.circleMarker(latlng, {
                radius: radius,
                fillColor: "#f00",
                color: "#300",
                weight: 1,
                opacity: 0.25,
                fillOpacity: 0.25
              });
            }
            else {
              return L.circleMarker(latlng, {
                radius: radius,
                fillColor: "#f00",
                color: "#300",
                weight: 1,
                opacity: 0.25,
                fillOpacity: 0.75
              });
            }
          }
        });
        // Add the first layer to the group by default (this should always(!)
        // be present)
        if (!i) {
          group.addLayer(layers[i]);
        }
      }
    }
    group.addTo(map);

    // // Populate civilian casualties layer
    //
    // // Build a hash of all dates in the data set
    // seen = [];
    // for (var i = 0; i < data.casualties.length; i++) {
    //   var date = data.casualties[i].features[0].properties.date;
    //   seen[date] = i;
    // }
    //
    // // Add a map layer for each date in the data set
    // for (var i = 0; i < data.dates.length; i++) {
    //   if (seen[data.dates[i]] !== undefined) {
    //     casualtiesLayers[i] = L.geoJson(data.casualties[seen[data.dates[i]]], {
    //       onEachFeature: function (feature, layer) {
    //         var html;
    //         if (language === 'da') {
    //           html = 'Lokation: ' + feature.properties.location + '<br />Civile tab: ' + feature.properties.casualties;
    //         }
    //         else {
    //           html = 'Location: ' + feature.properties.location + '<br />Civilian casualties: ' + feature.properties.casualties;
    //         }
    //         layer.bindPopup(html);
    //       },
    //       pointToLayer: function (feature, latlng) {
    //         var radius = 7;
    //         if (feature.properties.casualties >= 10) {
    //           radius = 10;
    //         }
    //
    //         if (i === data.dates.length - 1) {
    //           return L.circleMarker(latlng, {
    //             radius: radius,
    //             fillColor: "#fff",
    //             color: "#333",
    //             weight: 1,
    //             opacity: 0.5,
    //             fillOpacity: 0.5
    //           });
    //         }
    //         else {
    //           return L.circleMarker(latlng, {
    //             radius: radius,
    //             fillColor: "#fff",
    //             color: "#333",
    //             weight: 1,
    //             opacity: 0.25,
    //             fillOpacity: 0.75
    //           });
    //         }
    //       }
    //     });
    //   }
    // }
    // casualtiesGroup.addTo(map);
  });

  $('#inf-play-pause').click(function() {
    if (!playing) {
      $('#inf-play-pause span').removeClass('glyphicon-play').addClass('glyphicon-pause');
      playing = true;
      interval = setInterval(function() {
        var nextValue = $('#inf-slider').slider('value') + 1;
        if (nextValue > $('#inf-slider').slider('option', 'max')) {
          clearInterval(interval);
        }
        else {
          $('#inf-slider').slider('value', nextValue);
        }
      }, 250);
    }
    else {
      clearInterval(interval);
      playing = false;
      $('#inf-play-pause span').removeClass('glyphicon-pause').addClass('glyphicon-play');
    }
  });
});

/* --- UTILITY --------------------------------------------------------------- */

function update_graphs(date) {
  if (data.sorties[date] !== undefined) {
    sortie_chart(date);
  }
  if (data.targets[date] !== undefined) {
    target_chart(date);
  }
}

function render_date(date) {
  var output;

  if (date === 'total') {
    if (language === 'da') {
      output = 'Angreb til dato';
    }
    else {
      output = 'Attacks to date';
    }
  }
  else {
    output = date;
  }

  return output;
}

})(jQuery);
