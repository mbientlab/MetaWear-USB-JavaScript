var events = require('events');
var util   = require('util');
var Peripheral = require('./peripheral');
const SerialPort = require('serialport');
var EventEmitter = events.EventEmitter;
var UsbDevice = require('./usb-device');

function Util() {
}

Util.inherits = function(constructor, superConstructor) {
  util.inherits(constructor, superConstructor);

  if (superConstructor === UsbDevice) {
    constructor.SCAN_UUIDS = constructor.SCAN_UUIDS || [];
    constructor.SCAN_DUPLICATES = constructor.SCAN_DUPLICATES || false;

    constructor.is = constructor.is || function(peripheral) {
      return true;
    };

    constructor.emitter = new EventEmitter();

    constructor.onDiscover = function(peripheral) {
      console.log("UTIL - DISCOVERED");
      console.log(peripheral);
      if (constructor.is(peripheral)) {
        var device = new constructor(peripheral);
        constructor.emitter.emit('discover', device);
      }
    };

    constructor.startScanning = function() {
      console.log("UTIL - START SCAN");
      SerialPort.list().then(ports => {
        ports.forEach(function(port) {
          console.log(port.path);
          console.log(port.serialNumber);
          console.log(port.pnpId);
          console.log(port.manufacturer);
          if (port.manufacturer == "MbientLab") {
            var peripheral = new Peripheral(null, "1", "1", 'random', true, null, 0, port.path)
            constructor.onDiscover(peripheral);
          }
        });
      });
    };

    constructor.stopScanning = function(callback) {
      console.log("UTIL - STOP SCANNING");
    };

    constructor.discoverAll = function(callback) {
      console.log("UTIL - DISCOVER ALL");
      constructor.emitter.addListener('discover', callback);
      if (constructor.emitter.listeners('discover').length === 1) {
          constructor.startScanning();
      }
    };

    constructor.stopDiscoverAll = function(discoverCallback) {
      console.log("UTIL - STOP DISCOVER ALL");
      constructor.emitter.removeListener('discover', discoverCallback);
      if (constructor.emitter.listeners('discover').length === 0) {
        constructor.stopScanning();
      }
    };

    constructor.discover = function(callback) {
      console.log("UTIL - DISCOVER");
      var onDiscover = function(device) {
        constructor.stopDiscoverAll(onDiscover);
        callback(device);
      };

      callback._subDeviceOnDiscover = onDiscover;
      constructor.discoverAll(onDiscover);
    };

    constructor.stopDiscover = function(callback) {
      console.log("UTIL - STOP DISCOVER");
      var onDiscover = callback._usbDeviceOnDiscover;
      if (onDiscover) {
        constructor.stopDiscoverAll(onDiscover);
      }
    };

    constructor.discoverWithFilter = function(filter, callback) {
      console.log("UTIL - DISCOVER FILTER");
      var onDiscoverWithFilter = function(device) {
        constructor.stopDiscoverAll(onDiscoverWithFilter);
        callback(device);
      };
      constructor.discoverAll(onDiscoverWithFilter);
    };

    constructor.discoverByAddress = function(address, callback) {
      console.log("UTIL - DISCOVER BY ADDRESS");
      constructor.discoverWithFilter(function(device) {
        return (device.address === address.toLowerCase());
      }, callback);
    };
  }
};

Util.mixin = function(constructor, mixin, includedMethods, excludedMethods) {
  excludedMethods = excludedMethods || [];
  for (var i in mixin.prototype) {
    var include = (!includedMethods) || (includedMethods.indexOf(i) !== -1);
    var exclude = (excludedMethods.indexOf(i) !== -1);
    if (include && !exclude) {
      constructor.prototype[i] = mixin.prototype[i];
    }
  }
};

module.exports = Util;
