(function($) {
  $.getJSON('../data/widget.json', function(json) {
    $('#count a').text(json.count);
    $('#description span').text(json.days);
  });
})(jQuery);
