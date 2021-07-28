var MetaWear = require('../index');

MetaWear.discoverByAddress('c8:4b:aa:97:50:05', function(device) {
  console.log("DISCOVER BY ADDRESS DONE");
  device.connectAndSetUp(function (error) {
      console.log("CONNECT AND SETUP DONE");
      var pattern = new MetaWear.LedPattern();
      console.log("LOAD");
      MetaWear.mbl_mw_led_load_preset_pattern(pattern.ref(), MetaWear.LedPreset.BLINK);
      console.log("WRITE");
      MetaWear.mbl_mw_led_write_pattern(device.board, pattern.ref(), MetaWear.LedColor.GREEN);
      console.log("PLAY");
      MetaWear.mbl_mw_led_play(device.board);
      setTimeout(function () {
        device.on('disconnect', function () {
          console.log("DISCONNECT");
          process.exit(0);
        });
        console.log("STOP");
        MetaWear.mbl_mw_led_stop_and_clear(device.board);
        MetaWear.mbl_mw_debug_reset(device.board);
      }, 4000);
  });
});
