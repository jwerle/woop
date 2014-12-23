
;(function(){

/**
 * Require the module at `name`.
 *
 * @param {String} name
 * @return {Object} exports
 * @api public
 */

function require(name) {
  var module = require.modules[name];
  if (!module) throw new Error('failed to require "' + name + '"');

  if (!('exports' in module) && typeof module.definition === 'function') {
    module.client = module.component = true;
    module.definition.call(this, module.exports = {}, module);
    delete module.definition;
  }

  return module.exports;
}

/**
 * Meta info, accessible in the global scope unless you use AMD option.
 */

require.loader = 'component';

/**
 * Internal helper object, contains a sorting function for semantiv versioning
 */
require.helper = {};
require.helper.semVerSort = function(a, b) {
  var aArray = a.version.split('.');
  var bArray = b.version.split('.');
  for (var i=0; i<aArray.length; ++i) {
    var aInt = parseInt(aArray[i], 10);
    var bInt = parseInt(bArray[i], 10);
    if (aInt === bInt) {
      var aLex = aArray[i].substr((""+aInt).length);
      var bLex = bArray[i].substr((""+bInt).length);
      if (aLex === '' && bLex !== '') return 1;
      if (aLex !== '' && bLex === '') return -1;
      if (aLex !== '' && bLex !== '') return aLex > bLex ? 1 : -1;
      continue;
    } else if (aInt > bInt) {
      return 1;
    } else {
      return -1;
    }
  }
  return 0;
}

/**
 * Find and require a module which name starts with the provided name.
 * If multiple modules exists, the highest semver is used. 
 * This function can only be used for remote dependencies.

 * @param {String} name - module name: `user~repo`
 * @param {Boolean} returnPath - returns the canonical require path if true, 
 *                               otherwise it returns the epxorted module
 */
require.latest = function (name, returnPath) {
  function showError(name) {
    throw new Error('failed to find latest module of "' + name + '"');
  }
  // only remotes with semvers, ignore local files conataining a '/'
  var versionRegexp = /(.*)~(.*)@v?(\d+\.\d+\.\d+[^\/]*)$/;
  var remoteRegexp = /(.*)~(.*)/;
  if (!remoteRegexp.test(name)) showError(name);
  var moduleNames = Object.keys(require.modules);
  var semVerCandidates = [];
  var otherCandidates = []; // for instance: name of the git branch
  for (var i=0; i<moduleNames.length; i++) {
    var moduleName = moduleNames[i];
    if (new RegExp(name + '@').test(moduleName)) {
        var version = moduleName.substr(name.length+1);
        var semVerMatch = versionRegexp.exec(moduleName);
        if (semVerMatch != null) {
          semVerCandidates.push({version: version, name: moduleName});
        } else {
          otherCandidates.push({version: version, name: moduleName});
        } 
    }
  }
  if (semVerCandidates.concat(otherCandidates).length === 0) {
    showError(name);
  }
  if (semVerCandidates.length > 0) {
    var module = semVerCandidates.sort(require.helper.semVerSort).pop().name;
    if (returnPath === true) {
      return module;
    }
    return require(module);
  }
  // if the build contains more than one branch of the same module
  // you should not use this funciton
  var module = otherCandidates.pop().name;
  if (returnPath === true) {
    return module;
  }
  return require(module);
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Register module at `name` with callback `definition`.
 *
 * @param {String} name
 * @param {Function} definition
 * @api private
 */

require.register = function (name, definition) {
  require.modules[name] = {
    definition: definition
  };
};

/**
 * Define a module's exports immediately with `exports`.
 *
 * @param {String} name
 * @param {Generic} exports
 * @api private
 */

require.define = function (name, exports) {
  require.modules[name] = {
    exports: exports
  };
};
require.register("component~emitter@1.1.3", function (exports, module) {

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});

require.register("woop", function (exports, module) {

/**
 * Module dependencies
 */

var Emitter = require('component~emitter@1.1.3');

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

});

if (typeof exports == "object") {
  module.exports = require("woop");
} else if (typeof define == "function" && define.amd) {
  define("woop", [], function(){ return require("woop"); });
} else {
  (this || window)["woop"] = require("woop");
}
})()
