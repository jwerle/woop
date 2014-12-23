
/**
 * Module dependencies
 */

var Emitter = require('emitter');

var bind = Function.prototype.bind.bind(Function.prototype.call);
var slice = bind(Array.prototype.slice);

/**
 * Encode types
 */

var OBJECT_TYPE = 0x6f;
var NUMBER_TYPE = 0x6e;
var STRING_TYPE = 0x73;
var BOOLEAN_TYPE = 0x62;
var FUNCTION_TYPE = 0x66;

/**
 * Serializes input into an object
 * with a type and buffer
 *
 * @api public
 * @param {Mixed} src
 */

module.exports.serialize = serialize;
function serialize (src) {
  var res = {type: typeof src, buffer: null};
  switch (res.type) {
    case 'undefined':
      res.buffer = 'undefined';
      break;

    case 'function':
      res.buffer = src.toString();
      break;

    case 'boolean':
    case 'string':
    case 'object':
    case 'number':
      if (null === src) { res.buffer = 'null'; }
      else {
        res.buffer = JSON.stringify(src);
      }
      break;

    default:
      throw new TypeError("Unsupported inputtype.");
  }

  // stamp serialized
  Object.defineProperty(res, '__serialized__', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: true
  });

  return res;
}

/**
 * Serializes and encodes an input
 *
 * @api public
 * @param {Mixed} src
 */

module.exports.encode = encode;
function encode (src) {
  var res = serialize(src);
  var enc = [];
  enc[0];
  switch (res.type) {
    case 'function':
      enc[0] = FUNCTION_TYPE;
      break;

    case 'string':
      enc[0] = STRING_TYPE;
      break;

    case 'object':
      enc[0] = OBJECT_TYPE;
      break;

    case 'boolean':
      enc[0] = BOOLEAN_TYPE;
      break;
  }

  enc[1] = res.buffer;
  return '['+ enc.join(',') + ']';
}

/**
 * `Loop' constructor
 *
 * @api public
 */

module.exports.createLoop = Loop;
module.exports.Loop = Loop;
function Loop () {
  if (!(this instanceof Loop)) {
    return new Loop();
  }

  var active = [];
  var queue = [];
  var self = this;

  Object.defineProperty(this, 'queue', {
    get: function () {
      queue = queue.filter(Boolean);
      return queue;
    }
  });

  Object.defineProperty(this, 'active', {
    get: function () {
      active = active.filter(Boolean);
      return active;
    }
  });

  Object.defineProperty(this, 'length', {
    get: function () {
      return self.queue.length;
    }
  });
}

// inherit from `Emitter'
Emitter(Loop.prototype);

/**
 * Push work to loop queue
 *
 * @api pulic
 * @param {Function} work
 */

Loop.prototype.push = function (work) {
  this.queue.push([work].concat(slice(arguments, 1)));
  return this;
};

/**
 * Unshift work to loop queue
 *
 * @api pulic
 * @param {Function} work
 */

Loop.prototype.unshift = function (work) {
  this.queue.unshift([work].concat(slice(arguments, 1)));
  return this;
};

/**
 * Shift work from loop queue
 *
 * @api public
 */

Loop.prototype.shift = function () {
  return this.queue.shift();
};

/**
 * Return head of loop queue
 *
 * @api public
 */

Loop.prototype.head = function () {
  return this.queue[0];
};

/**
 * Returns work at index `i`
 *
 * @api public
 * @param {Number} i
 */

Loop.prototype.get = function (i) {
  return this.queue[i];
};

/**
 * Sets work at index `i`
 *
 * @api public
 * @param {Number} i
 * @param {Function} work
 */

Loop.prototype.set = function (i, work) {
  this.queue.splice(i, 0, work);
  return this;
};

/**
 * Removes work at index `i`
 *
 * @api public
 * @param {Number} i
 */

Loop.prototype.remove = function (i) {
  this.queue.splice(i, 1);
  return this;
};

/**
 * Wraps a function into a worker safe
 * callback
 *
 * @api public
 * @param {Function} fn
 */

Loop.prototype.wrap = function (work) {
  function done (complete, res) {
    self.postMessage({status: "message", response: res});
    if (complete) {
      self.postMessage({status: "done", response: res});
    }
  }

  function decode (input) {
    if ('string' == typeof input) {
      input = Function('return '+ input)();
    }

    return input.slice(1)[0];
  }
  return [
    done.toString(),
    decode.toString(),
    'self.onmessage = function (e) {',
      'var work = '+ encode(work) +';',
      'if ("undefined" != typeof work && '+ FUNCTION_TYPE +'== work[0]) {',
        'e.data.arguments = e.data.arguments.map(function (a) {',
          'return decode(a);',
        '});',
        'work[1](e.data, done);',
      '}',
    '}'
  ].join('');
};

/**
 * Dequeues loop queue
 *
 * @api public
 * @param {Function} done
 */

Loop.prototype.dequeue = function (done) {
  var self = this;
  var to = null;

  function dequeue () {
    var size = self.length;
    var index = 0;

    // dequeue current
    while (index < size) (function (index) {
      var worker = null;
      var work = null;
      var wrap = null;
      var blob = null;
      var enc = null;
      var args = null;

      // grab existing worker if still active
      if (null != self.active[index]) {
        worker = self.active[index];
      } else {
        // worker function
        work = self.get(index);

        // worker arguments
        args = work.slice(1).map(encode) || [];

        // wrap worker function
        wrap = self.wrap(work[0]);

        // encode
        blob = new Blob([wrap], {type: 'application/javascript'});

        // create entity
        enc = URL.createObjectURL(blob);

        // spawn
        worker = new Worker(enc);

        // mark active
        self.active[index] = worker;

        // listen for state
        worker.onmessage = function (e) {
          var event = {src: worker, message: e.data.response};
          switch (e.data.status) {
            case 'done':
              self.active[index] = null;
              self.queue[index] = null;
              (self.active); // reflow active list
              (self.queue); // reflow loop queue
              worker.terminate();
              break;
          }

          self.emit(e.data.status, event);
          if (0 == self.active.length && 'function' == typeof done) {
            done.call(self);
          }
        };
      }

      // @TODO - allow data binding/passing
      worker.postMessage({arguments: args || []});
    })(index++);

    return self.length;
  }

  function loop () {
    if (0 == dequeue()) {
      clearInterval(to);
    }
  }

  // dequeue all work async
  to = setInterval(loop);

  return this;
};
