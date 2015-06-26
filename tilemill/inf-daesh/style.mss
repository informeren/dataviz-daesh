Map {
  background-color: #dbd6c0;
}

@font: 'Franklin Gothic FS Demi';
@fontem: 'Franklin Gothic FS Demi Italic';

@focus: #600;
@light: #ccc;
@dark: #333;
@label: #fff;

#hypsography {
  raster-opacity: 0.7;
  raster-scaling: bilinear;
  raster-comp-op: multiply;
}

#borders[zoom>4] {
  line-width: 1;
  line-color: @light;
  polygon-opacity: 0;
}

#countries {
  polygon-opacity: 0.1;
  polygon-fill: @light;

  [sov_a3="IRQ"],[sov_a3="SYR"] {
    line-width: 0.25;
	[zoom>2] {
	  line-width: 0.5;
	}
    [zoom>4] {
	  line-width: 1;
    }
    line-color: @focus;
    polygon-fill: @focus;
	polygon-opacity: 0.3;
  }
}

#urban {
  polygon-fill: @focus;
  polygon-opacity: 0.5;
}

#roads[zoom>5] {
  line-width: 1;
  line-color: #333;
  line-opacity: 0.2;
}
