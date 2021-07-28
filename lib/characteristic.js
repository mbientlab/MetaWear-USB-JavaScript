var debug = require('debug')('characteristic');
var events = require('events');
var util = require('util');

function Characteristic(noble, peripheralId, serviceUuid, uuid, properties) {
  console.log("CHAR CREATE");
  this._peripheralId = peripheralId;
  this._serviceUuid = serviceUuid;
  this.counter = 0;
  this.uuid = uuid;
  this.name = null;
  this.type = null;
  this.properties = properties;
  this.descriptors = null;
}

util.inherits(Characteristic, events.EventEmitter);

Characteristic.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid,
    name: this.name,
    type: this.type,
    properties: this.properties
  });
};

Characteristic.prototype.read = function(port, callback) {
  console.log("CHAR READ");

  if (callback) {
    console.log("CALLBACK ON READ");
    var onRead = function(data, isNotificaton) {
      // only call the callback if 'read' event and non-notification
      // 'read' for non-notifications is only present for backwards compatbility
      if (!isNotificaton) {
        // remove the listener
        this.removeListener('read', onRead);
        // call the callback
        callback(null, data);
      }
    }.bind(this);
    console.log("CREATE EMITTER");
    this.on('read', onRead);
  }

  var data = new Buffer.from("1.5.1");
  var isNotification = false;
  this.emit('read', data, isNotification);
};

Characteristic.prototype.write = function(port, data, withoutResponse, callback) {
  console.log("CHAR WRITE");

  if (process.title !== 'browser') {
    if (!(data instanceof Buffer)) {
      throw new Error('data must be a Buffer');
    }
  }

  port.flush(null);

  if (!this.withoutResponse) {
    var onWrite = function(data) {
      console.log("CHAR WRITE DONE");
      this.emit('data', data);

    }.bind(this);

    port.on('readable', function () {
      //console.log('Data:', port.read())
      var buf = port.read();
      if (buf != null) {
        let newBuffer = buf.subarray(0, -2).toString();
        console.log(newBuffer);
        a = [];
        for (var i = 0; i < newBuffer.length; i += 2) {
            a.push("0x" + newBuffer.substr(i, 2));
        }
        console.log(a);
        var data = new Buffer.from(a); //01 80 00 00 //02 80 00 01 03 00
        console.log(data);
        onWrite(data);
      }
    })
  }

  var onWriten = function() {
    this.emit('write');
  }.bind(this);

  console.log('writing to PORT: ' + data.toString('hex') + ' to port: ' + port);
  var input  = data.toString('hex') + '\r' + '\n';
  port.write(input, function(err) {
    if (err) {
      return console.log('Error on write: ', err.message)
    }
    console.log('message written')
    onWriten();
  })

};

// deprecated in favour of subscribe/unsubscribe
Characteristic.prototype.notify = function(notify, callback) {
  console.log("CHAR NOTIFY");
  if (callback) {
    this.once('notify', function() {
      callback(null);
    });
  }
  this.emit('notify', 'unknown');
};

Characteristic.prototype.subscribe = function(callback) {
  this.notify(true, callback);
};

Characteristic.prototype.unsubscribe = function(callback) {
  this.notify(false, callback);
};

module.exports = Characteristic;
