// LOCAL
var MetaWear = require('../index')
// METAWEAR
//require('metawear');

var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings.js');
var ref = require('ref')

// Main function
async function mainAsync(mac) {
  // Discover
  var device = await new Promise((resolve, reject) => MetaWear.discoverByAddress('c8:4b:aa:97:50:05', d => resolve(d)))
  await new Promise((resolve, reject) => {
    console.log('Connecting...')
    // Connect and setup
    device.connectAndSetUp(error => {
    console.log('Connected.')
      if(error == null) resolve(null)
      else reject(error)
    })
  })

  // Get acc and gyro signal
  console.log('Get acc config');
  MetaWear.mbl_mw_acc_read_config(device.board, ref.NULL, MetaWear.FnVoid_VoidP_DataP.toPointer((ctx, pointer) => {
    var data = pointer.deref();
    var value = data.parseValue();
    console.log(value)
  }))
  
  // End of terminal input
  process.openStdin().addListener("data", data => {
    console.log('Reset.')
    MetaWear.mbl_mw_debug_reset(device.board)
    setTimeout(function () {
      // Exit terminal
      process.exit(1);
    }, 2000);
  })
}

// Run this example by putting the MAC address on the command line
// sudo node stream_acc_gyro.js ea:78:c3:d3:f0:8a
mainAsync(process.argv[2])
