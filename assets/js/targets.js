/* global d3:false */
(function($) {
  "use strict";

  var margin = {top: 10, right: 40, bottom: 10, left: 130},
    width = 300 - 70 - 40,  // margin-left, margin-right
    height = 240 - 10 - 10; // margin-top, margin-bottom

  var x = d3.scale.linear().range([0, width]);
  var y = d3.scale.ordinal().rangeRoundBands([0, height], 0.3);

  var yAxis = d3.svg.axis()
    .scale(y)
    .innerTickSize(0)
    .outerTickSize(0)
    .orient('left');

  function init_chart() {
    var containerid = '#graph';
    var wrapperid = 'chart-targets';

    d3.select(containerid)
      .insert('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .attr('id', wrapperid)
      .append('g')
      .attr('class', 'y axis');
  }

  function chart() {
    var wrapperid = '#chart-targets';

    d3.tsv('../data/targets.tsv', function(error, data) {
      data.forEach(function(d) {
        d.count = parseInt(d.count, 10);
      });

      x.domain([0, d3.max(data, function(d) { return d.count; })]);
      y.domain(data.map(function(d) { return d.type; }));

      var graph = d3.select(wrapperid);
      var barwrappers = graph.selectAll('g.barwrapper').data(data).enter().append('g').attr('class', 'barwrapper');

      barwrappers.append('rect')
        .attr('class', 'bar')
        .attr('y', function(d) { return y(d.type); })
        .attr('height', y.rangeBand())
        .attr('width', function(d) { return x(d.count); })
        .attr('x', 0);

      barwrappers.append('text')
        .text(function(d) {return d.count;})
        .attr('fill', '#f00')
        .attr('font-size', '12px')
        .attr('font-weight', '500')
        .attr('transform', function(d) { return 'translate(' + (x(d.count) + 5) + ', ' + (y(d.type) + y.rangeBand() - 6) + ')';});

      graph.select('.y.axis')
           .call(yAxis);
    });
  }

  $(function() {
    init_chart();
    chart();
  });

})(jQuery);
