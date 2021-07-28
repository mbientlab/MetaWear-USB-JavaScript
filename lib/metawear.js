var debug = require('debug')('metawear');
var debugRaw = require('debug')('metaboot');
var UsbDevice = require('../lib/usb-device');
UsbDevice.Util = require('../lib/util');
var ref = require('ref');
var events = require('events');
var util = require('util');
var os = require('os');
var https = require('https');
var fs = require('fs');
var path = require('path');
var urlExists = require('url-exists');
var cbindings = require('../MetaWear-SDK-Cpp/bindings/javascript/cbindings');

var METAWEAR_BASE_URI = '326a#id#85cb9195d9dd464cfbbae75a';
var METAWEAR_SERVICE_UUID = METAWEAR_BASE_URI.replace('#id#', '9000');
var METAWEAR_COMMAND_UUID = METAWEAR_BASE_URI.replace('#id#', '9001');
var METAWEAR_NOTIFY_UUID = METAWEAR_BASE_URI.replace('#id#', '9006');

// then create your thing with the object pattern
var MetaWear = function (peripheral) {
  this.percentage = 0;
  this.errorMessage = null;
  this.manufacturerName = null;
  this.serialNumber = null;
  this.hardwareRevision = null;
  this.firmwareRevision = null;
  this.modelNumber = null;
  this.modelDescription = null;

  // Now create the metawear board object (this is used for accessing the SDK)
  var connection = new MetaWear.BtleConnection();
  connection.context = ref.NULL;
  connection.write_gatt_char = MetaWear.FnVoid_VoidP_VoidP_GattCharWriteType_GattCharP_UByteP_UByte.toPointer(writeGattChar.bind(this));
  connection.read_gatt_char = MetaWear.FnVoid_VoidP_VoidP_GattCharP_FnIntVoidPtrArray.toPointer(readGattChar.bind(this));
  connection.enable_notifications = MetaWear.FnVoid_VoidP_VoidP_GattCharP_FnIntVoidPtrArray_FnVoidVoidPtrInt.toPointer(enableNotifications.bind(this));
  connection.on_disconnect = MetaWear.FnVoid_VoidP_VoidP_FnVoidVoidPtrInt.toPointer(onDisconnect.bind(this));
  this.board = MetaWear.mbl_mw_metawearboard_create(connection.ref());

  // Create a USB Device
  UsbDevice.call(this, peripheral);
};

// Inherit USB device
UsbDevice.Util.inherits(MetaWear, UsbDevice);
// Flatten out and expose all the bindings
Object.assign(MetaWear, cbindings);
Object.assign(MetaWear, MetaWear.Lib);

MetaWear.spoof = function (address) {
  var addressType = 'random'
  var connectable = true
  var advertisement = {
    localName: 'MetaWear',
    txPowerLevel: undefined,
    manufacturerData: undefined,
    serviceData: [],
    serviceUuids: ['326a900085cb9195d9dd464cfbbae75a'],
    solicitationServiceUuids: [],
    serviceSolicitationUuids: []
  };
  var rssi = -27;
  return new MetaWear(peripheral);
};

MetaWear.prototype.writeCommandCharacteristic = function (data, callback) {
  var sanitaizedCallback = (typeof callback === 'function') ? callback : function () { };
  sanitaizedCallback(error);
};

MetaWear.prototype.connectAndSetUp = function (callback, initBuf) {
  var initializeCallback = (typeof callback === 'function') ? callback : function () { };
  UsbDevice.prototype.connectAndSetUp.call(this, function (error) {
    MetaWear.mbl_mw_metawearboard_initialize(this.board, ref.NULL, MetaWear.FnVoid_VoidP_MetaWearBoardP_Int.toPointer(function onInitialize(context, board, code) {
      initializeCallback(code == 0 ? null : code);
    }.bind(this)));
  }.bind(this));
};

// Quick and dirty UUID conversion
function bytesToString(array, start, stop) {
  var result = "";
  var z;
  for (var i = start; i >= stop; i--) {
    var str = array[i].toString(16);
    z = 2 - str.length + 1;
    str = Array(z).join("0") + str;
    result += str;
  }
  return result;
}

function NativeGattChar(array) {
  // always initialize all instance properties
  this.serviceUUID = bytesToString(array, 7, 0) + bytesToString(array, 15, 8);
  this.shortServiceUUID = bytesToString(array, 5, 4);
  this.characteristicUUID = bytesToString(array, 23, 16) + bytesToString(array, 31, 24);
  this.shortCharacteristicUUID = bytesToString(array, 21, 20);
}

function writeGattChar(context, caller, writeType, characteristicPtr, valuePtr, length) {
  var data = ref.reinterpret(valuePtr, length, 0);
  var characteristic = new NativeGattChar(characteristicPtr);
  if (!this.hasCharacteristic(characteristic.serviceUUID, characteristic.characteristicUUID)) {
    console.error('cant find ' + characteristic.characteristicUUID);
    return;
  }
  withoutResponse = false;
  this._characteristics[characteristic.serviceUUID][characteristic.characteristicUUID].write(this.port, data, withoutResponse, function (error) {
    if (error) {
      console.log(error);
    }
  });
}

function readGattChar(context, caller, characteristicPtr, callback) {
  var characteristic = new NativeGattChar(characteristicPtr);
  var charToRead = this._characteristics[characteristic.shortServiceUUID][characteristic.shortCharacteristicUUID];
  if (!charToRead) {
    charToRead = this._characteristics[characteristic.serviceUUID][characteristic.characteristicUUID];
  }
  charToRead.read(this.port, function (error, data) {
    if (error) {
      console.error(error);
   } else {
      console.log("DidRead: " + data);
      callback(caller, data, data.length);
    }
  });
}

function enableNotifications(context, caller, characteristicPtr, onData, subscribeComplete) {
  var characteristic = new NativeGattChar(characteristicPtr);
  var charToNotify = this._characteristics[characteristic.serviceUUID][characteristic.characteristicUUID];
  if (!charToNotify) {
    charToNotify = this._characteristics[characteristic.shortServiceUUID][characteristic.shortCharacteristicUUID];
  }
  charToNotify.on('data', function (buffer) {
    if (!buffer) {
      console.error('bad buffer');
    } else {
      onData(caller, buffer, buffer.length);
    }
  });
  // Turn on the notification stream
  charToNotify.subscribe(function (error) {
    console.log('Did Subscribe: ');
    if (error) {
      console.error(error);
    }
    error = null;
    subscribeComplete(caller, 0);
  });
}

function onDisconnect(context, caller, handler) {
  this.once('disconnect', function () {
    handler(caller, 0);
  });
}

// export your device
module.exports = MetaWear;
