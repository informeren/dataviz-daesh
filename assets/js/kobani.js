/* global d3:false */
(function($) {
  "use strict";

  var viewportWidth = $('body').width();

  var margin = {top: 20, right: 10, bottom: 30, left: 40},
    width = viewportWidth - 40 - 10,  // margin-left, margin-right
    height = 360 - 20 - 30; // margin-top, margin-bottom

  var locale = d3.locale({
    'decimal': '.',
    'thousands': ',',
    'grouping': [3],
    'currency': ['$', ''],
    'dateTime': '%a %b %e %X %Y',
    'date': '%d/%m/%Y',
    'time': '%H:%M:%S',
    'periods': ['AM', 'PM'],
    'days': ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'],
    'shortDays': ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'],
    'months': ['Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'December'],
    'shortMonths': ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
  });

  var labelDateFormat = locale.timeFormat('%e. %B');

  var parseDate = d3.time.format('%Y-%m-%d').parse;
  var bisectDate = d3.bisector(function(d) { return d.date; }).left;

  var x = d3.time.scale().range([0, width]);
  var y = d3.scale.linear().range([height, 0]);

  var color = d3.scale.ordinal().range(['#666', '#999']);

  var xAxis = d3.svg.axis()
    .scale(x)
    .innerTickSize(0)
    .outerTickSize(0)
    .orient('bottom')
    .tickFormat(locale.timeFormat('%B'));

  var yAxis = d3.svg.axis()
    .scale(y)
    .innerTickSize(0)
    .outerTickSize(0)
    .orient('left')
    .tickFormat(d3.format('.4d'));

  var area = d3.svg.area()
    .x(function(d) { return x(d.date); })
    .y0(function(d) { return y(d.y0); })
    .y1(function(d) { return y(d.y0 + d.y); });

  var stack = d3.layout.stack()
    .offset('zero')
    .values(function(d) { return d.values; });

  function init_chart() {
    d3.select('#graph')
      .insert('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .attr('id', 'wrapper');
  }

  function chart() {
    d3.tsv('../data/kobani.tsv', function(error, data) {
      color.domain(d3.keys(data[0]).filter(function(key) { return key !== 'date' && key !== 'note'; }));

      var notes = data.filter(function(d) { return d.note; });

      data.forEach(function(d) {
        d.date = parseDate(d.date);
        d.kobane = parseInt(d.kobane, 10);
        d.other = parseInt(d.other, 10);
        d.total = d.kobane + d.other;
      });

      var attacks = stack(color.domain().map(function(name) {
        return {
          name: name,
          values: data.map(function(d) {
            return {date: d.date, y: d[name]};
          })
        };
      }));

      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain([0, d3.max(data, function(d) { return d.total; })]);

      // TODO: move axis defs to init?
      var wrapper = d3.select('#wrapper');
      wrapper.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + (height + 10) + ')')
        .call(xAxis);
      wrapper.append('g')
        .attr('class', 'y axis')
        .call(yAxis);

      var graph = wrapper.selectAll('.attack')
        .data(attacks)
        .enter().append('g')
        .attr('class', 'attack');

      graph.append('path')
          .attr('class', 'area')
          .attr('d', function(d) { return area(d.values); })
          .style('fill', function(d) { return color(d.name); });

      wrapper.append('rect')
        .attr({
          w: 0,
          h: 0,
          width: width,
          height: height,
          fill: 'transparent'
        })
        .on('mousemove', function () {
          var xPos = d3.mouse(this)[0];
          d3.select('.wrapper-line').attr('visibility', 'visible').attr('transform', function () {
            return 'translate(' + xPos + ',0)';
          });

          var x0 = x.invert(xPos),
              i = bisectDate(data, x0, 1),
              d0 = data[i - 1],
              d1 = data[i],
              d = x0 - d0.date > d1.date - x0 ? d1 : d0;

          d3.select('.label-date').text(labelDateFormat(d.date));
          d3.select('.label-other').text('Andre byer: ' + d.other + ' angreb til dato');
          d3.select('.label-kobane').text('Kobane: ' + d.kobane + ' angreb til dato');

          if (xPos > (viewportWidth - 225)) {
            d3.selectAll('.label').attr('text-anchor', 'end').attr('dx', '-.5em');
          }
          else {
            d3.selectAll('.label').attr('text-anchor', 'start').attr('dx', '.5em');
          }
        });

      var playHead = wrapper
        .append('g')
        .attr('class', 'wrapper-line')
        .attr('transform', 'translate(0,0)');
      playHead.append('line')
        .attr({
          'x1': 0.5,
          'y1': 0,
          'x2': 0.5,
          'y2': height
        })
        .attr('stroke', '#f00')
        .attr('stroke-width', '1px')
        .attr('shape-rendering', 'crispEdges')
        .attr('class', 'verticalLine');
      var textgroup = playHead
        .append('g')
        .attr('class', 'labels')
        .attr('transform', 'translate(0,12)');
      textgroup.append('text')
        .text('8. August')
        .attr('text-anchor', 'start')
        .attr('font-size', '12px')
        .attr('font-weight', '700')
        .attr('class', 'label label-date')
        .attr('dx', '.5em');
      textgroup.append('text')
        .text('Kobane: 0 angreb til dato')
        .attr('text-anchor', 'start')
        .attr('font-size', '12px')
        .attr('class', 'label label-kobane')
        .attr('transform', 'translate(0,28)')
        .attr('dx', '.5em');
      textgroup.append('text')
        .text('Andre byer: 3 angreb til dato')
        .attr('text-anchor', 'start')
        .attr('font-size', '12px')
        .attr('transform', 'translate(0,14)')
        .attr('class', 'label label-other')
        .attr('dx', '.5em');

      var notepoints = wrapper.selectAll('.highlight')
        .data(notes)
        .enter().append('g')
        .attr('class', '.highlight');

      notepoints.append('circle')
        .attr('cx', function(d) { return x(d.date); })
        .attr('cy', function(d) { return y(d.kobane); })
        .attr('r', 5)
        .attr('stroke', '#0f0')
        .attr('stroke-opacity', '0')
        .attr('stroke-width', '9px')
        .attr('fill', '#f00')
        .on('mouseover', function(){
          var xPos = d3.mouse(this)[0];
          d3.select('.wrapper-line')
            .attr('transform', function () {
              return 'translate(' + xPos + ',0)';
            })
            .transition()
            .attr('opacity', 0)
            .duration(250);
          d3.select(this.parentNode).select('.single-note')
            .attr('visibility', 'visible')
            .transition()
            .attr('opacity', 1)
            .duration(500);
        })
        .on('mouseout', function(){
          var xPos = d3.mouse(this)[0];
          d3.select('.wrapper-line')
            .attr('transform', function () {
              return 'translate(' + xPos + ',0)';
            })
            .transition()
            .attr('opacity', 1)
            .duration(500);
          d3.select(this.parentNode).select('.single-note')
            .transition()
            .attr('opacity', 0)
            .duration(250)
            .attr('visibility', 'hidden');
        });

      var heights = [150, 180, 230, 260, 210, 220];

      var note = notepoints.append('g')
        .attr('transform', function(d, i) { return 'translate(' + x(d.date) + ',' + (y(d.kobane) - heights[i]) + ')';})
        .attr('class', 'single-note')
        .attr('opacity', 0)
        .attr('visibility', 'hidden');
      note
        .append('line')
        .attr({
          'x1': 0.5,
          'y1': 0,
          'x2': 0.5,
          'y2': 0
        })
        .attr('y2' , function(d, i) {
          return heights[i];
        })
        .attr('stroke', '#f00')
        .attr('stroke-width', '1px')
        .attr('shape-rendering', 'crispEdges')
        .attr('class', 'markerline');

      var notegroup = note.append('g')
        .attr('class', 'labels')
        .attr('transform', 'translate(0,12)');

      notegroup.append('text').
        text(function(d) { return labelDateFormat(d.date); })
        .attr('font-size', '12px')
        .attr('font-weight', '700')
        .attr('transform', function(d) {return x(d.date) < (viewportWidth - 225) ? 'translate(6,0)' : 'translate(-184,0)'; });
      notegroup.append('text').
        text(function(d) { return d.note; })
        .attr('font-size', '12px')
        .attr('class', 'note note-main')
        .attr('transform', function(d) {return x(d.date) < (viewportWidth - 225) ? 'translate(6,14)' : 'translate(-184,14)'; })
        .call(wrap, 180);
    });
  }

  function wrap(text, width) {
    text.each(function() {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 14,
          tspan = text.text(null).append('tspan').attr('x', 0).attr('y', 0);
      while (!!(word = words.pop())) {
        line.push(word);
        tspan.text(line.join(' '));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = text.append('tspan').attr('x', 0).attr('y', ++lineNumber * lineHeight).text(word);
        }
      }
    });
  }

  $(function() {
    init_chart();
    chart();
  });

})(jQuery);
