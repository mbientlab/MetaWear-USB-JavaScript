var events = require('events');
var util = require('util');
var Characteristic = require('./characteristic');
const SerialPort = require('serialport');

var GENERIC_ACCESS_UUID                     = '1800';
var DEVICE_NAME_UUID                        = '2a00';

var char_2a26 = new Characteristic(null,"1","2a26","2a26",[ 'read', 'writeWithoutResponse', 'write', 'notify' ]);
var char_2a25 = new Characteristic(null,"1","2a25","2a25",[ 'read', 'writeWithoutResponse', 'write', 'notify' ]);
var char_2a24 = new Characteristic(null,"1","2a24","2a24",[ 'read', 'writeWithoutResponse', 'write', 'notify' ]);
var char_2a27 = new Characteristic(null,"1","2a27","2a27",[ 'read', 'writeWithoutResponse', 'write', 'notify' ]);
var char_2a29 = new Characteristic(null,"1","2a29","2a29",[ 'read', 'writeWithoutResponse', 'write', 'notify' ]);
var char_326a = new Characteristic(null,"1","326a900085cb9195d9dd464cfbbae75a","326a900685cb9195d9dd464cfbbae75a",[ 'read', 'writeWithoutResponse', 'write', 'notify' ]);

function UsbDevice(peripheral) {
  console.log("USBDEVICE CREATE");
  this._peripheral = peripheral;
  this._characteristics = 
  {  
    '180a':
    { '2a26':
      char_2a26,
      '2a25':
      char_2a25,
      '2a24':
      char_2a24,
      '2a27':
      char_2a27,
      '2a29':
      char_2a29,
    },
    '326a900085cb9195d9dd464cfbbae75a' :
    { '326a900185cb9195d9dd464cfbbae75a':
      char_326a,
      '326a900685cb9195d9dd464cfbbae75a':
      char_326a,
    },
  }
  this.usb = peripheral.usb;
  this.id = peripheral.id;
  this.uuid = peripheral.uuid; 
  this.address = peripheral.address;
  this.addressType = peripheral.addressType;
  this.connectedAndSetUp = false;
  this.port = null;
}

util.inherits(UsbDevice, events.EventEmitter);

UsbDevice.prototype.onDisconnect = function(reason) {
  console.log("USBDEVICE ON DISC");
  this.connectedAndSetUp = false;
  this._characteristics = {};
  this.emit('disconnect', reason);
};

UsbDevice.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid
  });
};

UsbDevice.prototype.connect = function(callback, options) {
  console.log("USBDEVICE CONN");
  const port = new SerialPort(this.usb, function (error) {
    this.port = port;
    if (error) {
      return console.log('Error: ', err.message)
    } else {
      this._peripheral.once('disconnect', this.onDisconnect.bind(this));
      if (typeof(callback) === 'function') {
        callback(error);
      }
    }
  }.bind(this), options);
  this._peripheral.connect(function(error) {
    if (!error) {
      this._peripheral.once('disconnect', this.onDisconnect.bind(this));
    }
    if (typeof(callback) === 'function') {
      callback(error);
    }
  }.bind(this), options);
};

UsbDevice.prototype.disconnect = function(callback) {
  console.log("USBDEVICE DISCON");
  this._peripheral.disconnect(callback);
};

UsbDevice.prototype.connectAndSetUp = UsbDevice.prototype.connectAndSetup = function(callback, options) {
  console.log("USBDEVICE CONN AND SETUP");
  this.connect(function(error) {
    if (error) {
      return callback(error);
    }
    this.connectedAndSetUp = true;
    callback();
  }.bind(this), options);
};

UsbDevice.prototype.hasService = function(serviceUuid) {
  console.log("USBDEVICE HAS SERVICE");
  return (!!this._characteristics[serviceUuid]);
};

UsbDevice.prototype.hasCharacteristic = function(serviceUuid, characteristicUuid) {
  console.log("USBDEVICE HAS CHAR");
  return this.hasService(serviceUuid) && (!!this._characteristics[serviceUuid][characteristicUuid]);
};

module.exports = UsbDevice;
