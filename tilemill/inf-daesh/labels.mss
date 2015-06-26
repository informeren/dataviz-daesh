#countrynames,#countrynames-da {
  text-face-name: @font;
  text-size: 11;
  text-fill: @label;
  text-transform: uppercase;
  text-line-spacing: 1;
  text-wrap-width: 20;
  text-name: "''";

  [type="Sovereign country"] {
    [scalerank<4][zoom=4] {
      text-name: "[name]";
    }
    [scalerank<5][zoom=5] {
      text-name: "[name]";
      text-size: 12;
      text-character-spacing: 1;
      text-line-spacing: 1;
    }
    [scalerank<9][zoom>5] {
      text-name: "[name]";
      text-size: 16;
      text-character-spacing: 2;
      text-line-spacing: 2;
    }

	[name="N. Cyprus"],[name="Vatikanstaten"],[name="Vatican"] {
      text-opacity: 0;
    }
  }
}

#cities[zoom>5],#cities-da[zoom>5] {
  [sov_a3="IRQ"],[sov_a3="SYR"] {
    [adm0cap=1] {
      text-face-name: @fontem;
      text-name: "[name]";
      text-size: 14;
      text-fill: @label;
    }

    [scalerank<7][adm0cap!=1],
    [name="Dayr az Zawr"],[name="Al Hasakah"],[name="Ar Raqqah"],
    [name="Deir Ezzor"],[name="Hasaka"],[name="Raqqa"], {
      text-face-name: @font;
      text-name: "[name]";
      text-size: 12;
      text-fill: #fff;
      text-dy: -5;
    }
  }
}
