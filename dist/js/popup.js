(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = require('./lib')

},{"./lib":6}],2:[function(require,module,exports){
'use strict';

var asap = require('asap/raw');

function noop() {}

// States:
//
// 0 - pending
// 1 - fulfilled with _value
// 2 - rejected with _value
// 3 - adopted the state of another promise, _value
//
// once the state is no longer pending (0) it is immutable

// All `_` prefixed properties will be reduced to `_{random number}`
// at build time to obfuscate them and discourage their use.
// We don't use symbols or Object.defineProperty to fully hide them
// because the performance isn't good enough.


// to avoid using try/catch inside critical functions, we
// extract them to here.
var LAST_ERROR = null;
var IS_ERROR = {};
function getThen(obj) {
  try {
    return obj.then;
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

function tryCallOne(fn, a) {
  try {
    return fn(a);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}
function tryCallTwo(fn, a, b) {
  try {
    fn(a, b);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

module.exports = Promise;

function Promise(fn) {
  if (typeof this !== 'object') {
    throw new TypeError('Promises must be constructed via new');
  }
  if (typeof fn !== 'function') {
    throw new TypeError('not a function');
  }
  this._45 = 0;
  this._81 = 0;
  this._65 = null;
  this._54 = null;
  if (fn === noop) return;
  doResolve(fn, this);
}
Promise._10 = null;
Promise._97 = null;
Promise._61 = noop;

Promise.prototype.then = function(onFulfilled, onRejected) {
  if (this.constructor !== Promise) {
    return safeThen(this, onFulfilled, onRejected);
  }
  var res = new Promise(noop);
  handle(this, new Handler(onFulfilled, onRejected, res));
  return res;
};

function safeThen(self, onFulfilled, onRejected) {
  return new self.constructor(function (resolve, reject) {
    var res = new Promise(noop);
    res.then(resolve, reject);
    handle(self, new Handler(onFulfilled, onRejected, res));
  });
};
function handle(self, deferred) {
  while (self._81 === 3) {
    self = self._65;
  }
  if (Promise._10) {
    Promise._10(self);
  }
  if (self._81 === 0) {
    if (self._45 === 0) {
      self._45 = 1;
      self._54 = deferred;
      return;
    }
    if (self._45 === 1) {
      self._45 = 2;
      self._54 = [self._54, deferred];
      return;
    }
    self._54.push(deferred);
    return;
  }
  handleResolved(self, deferred);
}

function handleResolved(self, deferred) {
  asap(function() {
    var cb = self._81 === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      if (self._81 === 1) {
        resolve(deferred.promise, self._65);
      } else {
        reject(deferred.promise, self._65);
      }
      return;
    }
    var ret = tryCallOne(cb, self._65);
    if (ret === IS_ERROR) {
      reject(deferred.promise, LAST_ERROR);
    } else {
      resolve(deferred.promise, ret);
    }
  });
}
function resolve(self, newValue) {
  // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
  if (newValue === self) {
    return reject(
      self,
      new TypeError('A promise cannot be resolved with itself.')
    );
  }
  if (
    newValue &&
    (typeof newValue === 'object' || typeof newValue === 'function')
  ) {
    var then = getThen(newValue);
    if (then === IS_ERROR) {
      return reject(self, LAST_ERROR);
    }
    if (
      then === self.then &&
      newValue instanceof Promise
    ) {
      self._81 = 3;
      self._65 = newValue;
      finale(self);
      return;
    } else if (typeof then === 'function') {
      doResolve(then.bind(newValue), self);
      return;
    }
  }
  self._81 = 1;
  self._65 = newValue;
  finale(self);
}

function reject(self, newValue) {
  self._81 = 2;
  self._65 = newValue;
  if (Promise._97) {
    Promise._97(self, newValue);
  }
  finale(self);
}
function finale(self) {
  if (self._45 === 1) {
    handle(self, self._54);
    self._54 = null;
  }
  if (self._45 === 2) {
    for (var i = 0; i < self._54.length; i++) {
      handle(self, self._54[i]);
    }
    self._54 = null;
  }
}

function Handler(onFulfilled, onRejected, promise){
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, promise) {
  var done = false;
  var res = tryCallTwo(fn, function (value) {
    if (done) return;
    done = true;
    resolve(promise, value);
  }, function (reason) {
    if (done) return;
    done = true;
    reject(promise, reason);
  })
  if (!done && res === IS_ERROR) {
    done = true;
    reject(promise, LAST_ERROR);
  }
}

},{"asap/raw":10}],3:[function(require,module,exports){
'use strict';

var Promise = require('./core.js');

module.exports = Promise;
Promise.prototype.done = function (onFulfilled, onRejected) {
  var self = arguments.length ? this.then.apply(this, arguments) : this;
  self.then(null, function (err) {
    setTimeout(function () {
      throw err;
    }, 0);
  });
};

},{"./core.js":2}],4:[function(require,module,exports){
'use strict';

//This file contains the ES6 extensions to the core Promises/A+ API

var Promise = require('./core.js');

module.exports = Promise;

/* Static Functions */

var TRUE = valuePromise(true);
var FALSE = valuePromise(false);
var NULL = valuePromise(null);
var UNDEFINED = valuePromise(undefined);
var ZERO = valuePromise(0);
var EMPTYSTRING = valuePromise('');

function valuePromise(value) {
  var p = new Promise(Promise._61);
  p._81 = 1;
  p._65 = value;
  return p;
}
Promise.resolve = function (value) {
  if (value instanceof Promise) return value;

  if (value === null) return NULL;
  if (value === undefined) return UNDEFINED;
  if (value === true) return TRUE;
  if (value === false) return FALSE;
  if (value === 0) return ZERO;
  if (value === '') return EMPTYSTRING;

  if (typeof value === 'object' || typeof value === 'function') {
    try {
      var then = value.then;
      if (typeof then === 'function') {
        return new Promise(then.bind(value));
      }
    } catch (ex) {
      return new Promise(function (resolve, reject) {
        reject(ex);
      });
    }
  }
  return valuePromise(value);
};

Promise.all = function (arr) {
  var args = Array.prototype.slice.call(arr);

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([]);
    var remaining = args.length;
    function res(i, val) {
      if (val && (typeof val === 'object' || typeof val === 'function')) {
        if (val instanceof Promise && val.then === Promise.prototype.then) {
          while (val._81 === 3) {
            val = val._65;
          }
          if (val._81 === 1) return res(i, val._65);
          if (val._81 === 2) reject(val._65);
          val.then(function (val) {
            res(i, val);
          }, reject);
          return;
        } else {
          var then = val.then;
          if (typeof then === 'function') {
            var p = new Promise(then.bind(val));
            p.then(function (val) {
              res(i, val);
            }, reject);
            return;
          }
        }
      }
      args[i] = val;
      if (--remaining === 0) {
        resolve(args);
      }
    }
    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.reject = function (value) {
  return new Promise(function (resolve, reject) {
    reject(value);
  });
};

Promise.race = function (values) {
  return new Promise(function (resolve, reject) {
    values.forEach(function(value){
      Promise.resolve(value).then(resolve, reject);
    });
  });
};

/* Prototype Methods */

Promise.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected);
};

},{"./core.js":2}],5:[function(require,module,exports){
'use strict';

var Promise = require('./core.js');

module.exports = Promise;
Promise.prototype['finally'] = function (f) {
  return this.then(function (value) {
    return Promise.resolve(f()).then(function () {
      return value;
    });
  }, function (err) {
    return Promise.resolve(f()).then(function () {
      throw err;
    });
  });
};

},{"./core.js":2}],6:[function(require,module,exports){
'use strict';

module.exports = require('./core.js');
require('./done.js');
require('./finally.js');
require('./es6-extensions.js');
require('./node-extensions.js');
require('./synchronous.js');

},{"./core.js":2,"./done.js":3,"./es6-extensions.js":4,"./finally.js":5,"./node-extensions.js":7,"./synchronous.js":8}],7:[function(require,module,exports){
'use strict';

// This file contains then/promise specific extensions that are only useful
// for node.js interop

var Promise = require('./core.js');
var asap = require('asap');

module.exports = Promise;

/* Static Functions */

Promise.denodeify = function (fn, argumentCount) {
  if (
    typeof argumentCount === 'number' && argumentCount !== Infinity
  ) {
    return denodeifyWithCount(fn, argumentCount);
  } else {
    return denodeifyWithoutCount(fn);
  }
}

var callbackFn = (
  'function (err, res) {' +
  'if (err) { rj(err); } else { rs(res); }' +
  '}'
);
function denodeifyWithCount(fn, argumentCount) {
  var args = [];
  for (var i = 0; i < argumentCount; i++) {
    args.push('a' + i);
  }
  var body = [
    'return function (' + args.join(',') + ') {',
    'var self = this;',
    'return new Promise(function (rs, rj) {',
    'var res = fn.call(',
    ['self'].concat(args).concat([callbackFn]).join(','),
    ');',
    'if (res &&',
    '(typeof res === "object" || typeof res === "function") &&',
    'typeof res.then === "function"',
    ') {rs(res);}',
    '});',
    '};'
  ].join('');
  return Function(['Promise', 'fn'], body)(Promise, fn);
}
function denodeifyWithoutCount(fn) {
  var fnLength = Math.max(fn.length - 1, 3);
  var args = [];
  for (var i = 0; i < fnLength; i++) {
    args.push('a' + i);
  }
  var body = [
    'return function (' + args.join(',') + ') {',
    'var self = this;',
    'var args;',
    'var argLength = arguments.length;',
    'if (arguments.length > ' + fnLength + ') {',
    'args = new Array(arguments.length + 1);',
    'for (var i = 0; i < arguments.length; i++) {',
    'args[i] = arguments[i];',
    '}',
    '}',
    'return new Promise(function (rs, rj) {',
    'var cb = ' + callbackFn + ';',
    'var res;',
    'switch (argLength) {',
    args.concat(['extra']).map(function (_, index) {
      return (
        'case ' + (index) + ':' +
        'res = fn.call(' + ['self'].concat(args.slice(0, index)).concat('cb').join(',') + ');' +
        'break;'
      );
    }).join(''),
    'default:',
    'args[argLength] = cb;',
    'res = fn.apply(self, args);',
    '}',
    
    'if (res &&',
    '(typeof res === "object" || typeof res === "function") &&',
    'typeof res.then === "function"',
    ') {rs(res);}',
    '});',
    '};'
  ].join('');

  return Function(
    ['Promise', 'fn'],
    body
  )(Promise, fn);
}

Promise.nodeify = function (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    var callback =
      typeof args[args.length - 1] === 'function' ? args.pop() : null;
    var ctx = this;
    try {
      return fn.apply(this, arguments).nodeify(callback, ctx);
    } catch (ex) {
      if (callback === null || typeof callback == 'undefined') {
        return new Promise(function (resolve, reject) {
          reject(ex);
        });
      } else {
        asap(function () {
          callback.call(ctx, ex);
        })
      }
    }
  }
}

Promise.prototype.nodeify = function (callback, ctx) {
  if (typeof callback != 'function') return this;

  this.then(function (value) {
    asap(function () {
      callback.call(ctx, null, value);
    });
  }, function (err) {
    asap(function () {
      callback.call(ctx, err);
    });
  });
}

},{"./core.js":2,"asap":9}],8:[function(require,module,exports){
'use strict';

var Promise = require('./core.js');

module.exports = Promise;
Promise.enableSynchronous = function () {
  Promise.prototype.isPending = function() {
    return this.getState() == 0;
  };

  Promise.prototype.isFulfilled = function() {
    return this.getState() == 1;
  };

  Promise.prototype.isRejected = function() {
    return this.getState() == 2;
  };

  Promise.prototype.getValue = function () {
    if (this._81 === 3) {
      return this._65.getValue();
    }

    if (!this.isFulfilled()) {
      throw new Error('Cannot get a value of an unfulfilled promise.');
    }

    return this._65;
  };

  Promise.prototype.getReason = function () {
    if (this._81 === 3) {
      return this._65.getReason();
    }

    if (!this.isRejected()) {
      throw new Error('Cannot get a rejection reason of a non-rejected promise.');
    }

    return this._65;
  };

  Promise.prototype.getState = function () {
    if (this._81 === 3) {
      return this._65.getState();
    }
    if (this._81 === -1 || this._81 === -2) {
      return 0;
    }

    return this._81;
  };
};

Promise.disableSynchronous = function() {
  Promise.prototype.isPending = undefined;
  Promise.prototype.isFulfilled = undefined;
  Promise.prototype.isRejected = undefined;
  Promise.prototype.getValue = undefined;
  Promise.prototype.getReason = undefined;
  Promise.prototype.getState = undefined;
};

},{"./core.js":2}],9:[function(require,module,exports){
"use strict";

// rawAsap provides everything we need except exception management.
var rawAsap = require("./raw");
// RawTasks are recycled to reduce GC churn.
var freeTasks = [];
// We queue errors to ensure they are thrown in right order (FIFO).
// Array-as-queue is good enough here, since we are just dealing with exceptions.
var pendingErrors = [];
var requestErrorThrow = rawAsap.makeRequestCallFromTimer(throwFirstError);

function throwFirstError() {
    if (pendingErrors.length) {
        throw pendingErrors.shift();
    }
}

/**
 * Calls a task as soon as possible after returning, in its own event, with priority
 * over other events like animation, reflow, and repaint. An error thrown from an
 * event will not interrupt, nor even substantially slow down the processing of
 * other events, but will be rather postponed to a lower priority event.
 * @param {{call}} task A callable object, typically a function that takes no
 * arguments.
 */
module.exports = asap;
function asap(task) {
    var rawTask;
    if (freeTasks.length) {
        rawTask = freeTasks.pop();
    } else {
        rawTask = new RawTask();
    }
    rawTask.task = task;
    rawAsap(rawTask);
}

// We wrap tasks with recyclable task objects.  A task object implements
// `call`, just like a function.
function RawTask() {
    this.task = null;
}

// The sole purpose of wrapping the task is to catch the exception and recycle
// the task object after its single use.
RawTask.prototype.call = function () {
    try {
        this.task.call();
    } catch (error) {
        if (asap.onerror) {
            // This hook exists purely for testing purposes.
            // Its name will be periodically randomized to break any code that
            // depends on its existence.
            asap.onerror(error);
        } else {
            // In a web browser, exceptions are not fatal. However, to avoid
            // slowing down the queue of pending tasks, we rethrow the error in a
            // lower priority turn.
            pendingErrors.push(error);
            requestErrorThrow();
        }
    } finally {
        this.task = null;
        freeTasks[freeTasks.length] = this;
    }
};

},{"./raw":10}],10:[function(require,module,exports){
(function (global){
"use strict";

// Use the fastest means possible to execute a task in its own turn, with
// priority over other events including IO, animation, reflow, and redraw
// events in browsers.
//
// An exception thrown by a task will permanently interrupt the processing of
// subsequent tasks. The higher level `asap` function ensures that if an
// exception is thrown by a task, that the task queue will continue flushing as
// soon as possible, but if you use `rawAsap` directly, you are responsible to
// either ensure that no exceptions are thrown from your task, or to manually
// call `rawAsap.requestFlush` if an exception is thrown.
module.exports = rawAsap;
function rawAsap(task) {
    if (!queue.length) {
        requestFlush();
        flushing = true;
    }
    // Equivalent to push, but avoids a function call.
    queue[queue.length] = task;
}

var queue = [];
// Once a flush has been requested, no further calls to `requestFlush` are
// necessary until the next `flush` completes.
var flushing = false;
// `requestFlush` is an implementation-specific method that attempts to kick
// off a `flush` event as quickly as possible. `flush` will attempt to exhaust
// the event queue before yielding to the browser's own event loop.
var requestFlush;
// The position of the next task to execute in the task queue. This is
// preserved between calls to `flush` so that it can be resumed if
// a task throws an exception.
var index = 0;
// If a task schedules additional tasks recursively, the task queue can grow
// unbounded. To prevent memory exhaustion, the task queue will periodically
// truncate already-completed tasks.
var capacity = 1024;

// The flush function processes all tasks that have been scheduled with
// `rawAsap` unless and until one of those tasks throws an exception.
// If a task throws an exception, `flush` ensures that its state will remain
// consistent and will resume where it left off when called again.
// However, `flush` does not make any arrangements to be called again if an
// exception is thrown.
function flush() {
    while (index < queue.length) {
        var currentIndex = index;
        // Advance the index before calling the task. This ensures that we will
        // begin flushing on the next task the task throws an error.
        index = index + 1;
        queue[currentIndex].call();
        // Prevent leaking memory for long chains of recursive calls to `asap`.
        // If we call `asap` within tasks scheduled by `asap`, the queue will
        // grow, but to avoid an O(n) walk for every task we execute, we don't
        // shift tasks off the queue after they have been executed.
        // Instead, we periodically shift 1024 tasks off the queue.
        if (index > capacity) {
            // Manually shift all values starting at the index back to the
            // beginning of the queue.
            for (var scan = 0, newLength = queue.length - index; scan < newLength; scan++) {
                queue[scan] = queue[scan + index];
            }
            queue.length -= index;
            index = 0;
        }
    }
    queue.length = 0;
    index = 0;
    flushing = false;
}

// `requestFlush` is implemented using a strategy based on data collected from
// every available SauceLabs Selenium web driver worker at time of writing.
// https://docs.google.com/spreadsheets/d/1mG-5UYGup5qxGdEMWkhP6BWCz053NUb2E1QoUTU16uA/edit#gid=783724593

// Safari 6 and 6.1 for desktop, iPad, and iPhone are the only browsers that
// have WebKitMutationObserver but not un-prefixed MutationObserver.
// Must use `global` instead of `window` to work in both frames and web
// workers. `global` is a provision of Browserify, Mr, Mrs, or Mop.
var BrowserMutationObserver = global.MutationObserver || global.WebKitMutationObserver;

// MutationObservers are desirable because they have high priority and work
// reliably everywhere they are implemented.
// They are implemented in all modern browsers.
//
// - Android 4-4.3
// - Chrome 26-34
// - Firefox 14-29
// - Internet Explorer 11
// - iPad Safari 6-7.1
// - iPhone Safari 7-7.1
// - Safari 6-7
if (typeof BrowserMutationObserver === "function") {
    requestFlush = makeRequestCallFromMutationObserver(flush);

// MessageChannels are desirable because they give direct access to the HTML
// task queue, are implemented in Internet Explorer 10, Safari 5.0-1, and Opera
// 11-12, and in web workers in many engines.
// Although message channels yield to any queued rendering and IO tasks, they
// would be better than imposing the 4ms delay of timers.
// However, they do not work reliably in Internet Explorer or Safari.

// Internet Explorer 10 is the only browser that has setImmediate but does
// not have MutationObservers.
// Although setImmediate yields to the browser's renderer, it would be
// preferrable to falling back to setTimeout since it does not have
// the minimum 4ms penalty.
// Unfortunately there appears to be a bug in Internet Explorer 10 Mobile (and
// Desktop to a lesser extent) that renders both setImmediate and
// MessageChannel useless for the purposes of ASAP.
// https://github.com/kriskowal/q/issues/396

// Timers are implemented universally.
// We fall back to timers in workers in most engines, and in foreground
// contexts in the following browsers.
// However, note that even this simple case requires nuances to operate in a
// broad spectrum of browsers.
//
// - Firefox 3-13
// - Internet Explorer 6-9
// - iPad Safari 4.3
// - Lynx 2.8.7
} else {
    requestFlush = makeRequestCallFromTimer(flush);
}

// `requestFlush` requests that the high priority event queue be flushed as
// soon as possible.
// This is useful to prevent an error thrown in a task from stalling the event
// queue if the exception handled by Node.js’s
// `process.on("uncaughtException")` or by a domain.
rawAsap.requestFlush = requestFlush;

// To request a high priority event, we induce a mutation observer by toggling
// the text of a text node between "1" and "-1".
function makeRequestCallFromMutationObserver(callback) {
    var toggle = 1;
    var observer = new BrowserMutationObserver(callback);
    var node = document.createTextNode("");
    observer.observe(node, {characterData: true});
    return function requestCall() {
        toggle = -toggle;
        node.data = toggle;
    };
}

// The message channel technique was discovered by Malte Ubl and was the
// original foundation for this library.
// http://www.nonblocking.io/2011/06/windownexttick.html

// Safari 6.0.5 (at least) intermittently fails to create message ports on a
// page's first load. Thankfully, this version of Safari supports
// MutationObservers, so we don't need to fall back in that case.

// function makeRequestCallFromMessageChannel(callback) {
//     var channel = new MessageChannel();
//     channel.port1.onmessage = callback;
//     return function requestCall() {
//         channel.port2.postMessage(0);
//     };
// }

// For reasons explained above, we are also unable to use `setImmediate`
// under any circumstances.
// Even if we were, there is another bug in Internet Explorer 10.
// It is not sufficient to assign `setImmediate` to `requestFlush` because
// `setImmediate` must be called *by name* and therefore must be wrapped in a
// closure.
// Never forget.

// function makeRequestCallFromSetImmediate(callback) {
//     return function requestCall() {
//         setImmediate(callback);
//     };
// }

// Safari 6.0 has a problem where timers will get lost while the user is
// scrolling. This problem does not impact ASAP because Safari 6.0 supports
// mutation observers, so that implementation is used instead.
// However, if we ever elect to use timers in Safari, the prevalent work-around
// is to add a scroll event listener that calls for a flush.

// `setTimeout` does not call the passed callback if the delay is less than
// approximately 7 in web workers in Firefox 8 through 18, and sometimes not
// even then.

function makeRequestCallFromTimer(callback) {
    return function requestCall() {
        // We dispatch a timeout with a specified delay of 0 for engines that
        // can reliably accommodate that request. This will usually be snapped
        // to a 4 milisecond delay, but once we're flushing, there's no delay
        // between events.
        var timeoutHandle = setTimeout(handleTimer, 0);
        // However, since this timer gets frequently dropped in Firefox
        // workers, we enlist an interval handle that will try to fire
        // an event 20 times per second until it succeeds.
        var intervalHandle = setInterval(handleTimer, 50);

        function handleTimer() {
            // Whichever timer succeeds will cancel both timers and
            // execute the callback.
            clearTimeout(timeoutHandle);
            clearInterval(intervalHandle);
            callback();
        }
    };
}

// This is for `asap.js` only.
// Its name will be periodically randomized to break any code that depends on
// its existence.
rawAsap.makeRequestCallFromTimer = makeRequestCallFromTimer;

// ASAP was originally a nextTick shim included in Q. This was factored out
// into this ASAP package. It was later adapted to RSVP which made further
// amendments. These decisions, particularly to marginalize MessageChannel and
// to capture the MutationObserver implementation in a closure, were integrated
// back into ASAP proper.
// https://github.com/tildeio/rsvp.js/blob/cddf7232546a9cf858524b75cde6f9edf72620a7/lib/rsvp/asap.js

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],11:[function(require,module,exports){
(function (global){
; var __browserify_shim_require__=require;(function browserifyShim(module, exports, require, define, browserify_shim__define__module__export__) {
/* ***** html5sql.js ******
 *
 * Description: A helper javascript module for creating and working with
 *     HTML5 Web Databases.
 *
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 *
 * Authors: Ken Corbett Jr
 *
 * Version 0.9.2
 * 
 */

var html5sql = (function () {
	
	var readTransactionAvailable = false,
		doNothing = function () {},
		emptyArray = [],
		trim = function (string) {
			return string.replace(/^\s+/, "").replace(/\s+$/, "");
		},
		isArray = function (obj) { // From Underscore.js
			return Object.prototype.toString.call(obj) === '[object Array]'; 
		},
		isUndefined = function(obj) { // From Underscore.js
		    return obj === void 0;
		},
		SelectStmtMatch = new RegExp('^select\\s', 'i'),
	    isSelectStmt = function (sqlstring) {
			return SelectStmtMatch.test(sqlstring);
		},
		doNothing = function(){},
		// transaction is an sql transaction, sqlObjects are properly formated
		// and cleaned SQL objects
		sqlProcessor = function (transaction, sqlObjects, finalSuccess, failure) {
			
			var sequenceNumber = 0,
				dataForNextTransaction = null,
				currentSqlObject = null,
				runTransaction = function () {
					transaction.executeSql(sqlObjects[sequenceNumber].sql,
										   sqlObjects[sequenceNumber].data,
										   successCallback,
										   failureCallback);
				},
				successCallback = function (transaction, results) {
					var i, max, rowsArray = [];

					if(html5sql.logInfo){
						console.log("Success processing: " + sqlObjects[sequenceNumber].sql);
					}
					
					//Process the results of a select puting them in a much more manageable array form.
					if(html5sql.putSelectResultsInArray && isSelectStmt(sqlObjects[sequenceNumber].sql)){
						for(i = 0, max = results.rows.length; i < max; i++){
							rowsArray[i] = results.rows.item(i);
						}
					} else {
						rowsArray = null;
					}

					//Call the success callback provided with sql object
					//If an array of data is returned use that data as the
					//data attribute of the next transaction
					dataForNextTransaction = sqlObjects[sequenceNumber].success(transaction, results, rowsArray);
					sequenceNumber++;
					if (dataForNextTransaction && (dataForNextTransaction instanceof Array)) {
						sqlObjects[sequenceNumber].data = dataForNextTransaction;
						dataForNextTransaction = null;
					} else {
						dataForNextTransaction = null;
					}
					
					if (sqlObjects.length > sequenceNumber) {
						runTransaction();
					} else {
						finalSuccess(transaction, results, rowsArray);
					}
				},
				failureCallback = function (transaction, error) {
					if(html5sql.logErrors){
						console.error("Error: " + error.message + " while processing statment "+(sequenceNumber + 1)+": " + sqlObjects[sequenceNumber].sql);
					}
					failure(error, sqlObjects[sequenceNumber].sql);
				};
			
			runTransaction();
		},
		sqlObjectCreator = function (sqlInput) {
			var i;
			if (typeof sqlInput === "string") {
				trim(sqlInput);
				
				//Separate sql statements by their ending semicolon
				sqlInput = sqlInput.split(';');
				
				for(i = 1; i < sqlInput.length; i++){
					//Ensure semicolons within quotes are replaced
					while(sqlInput[i].split(/["]/gm).length % 2 === 0 ||
						  sqlInput[i].split(/[']/gm).length % 2 === 0 ||
						  sqlInput[i].split(/[`]/gm).length % 2 === 0){
						 sqlInput.splice(i,2,sqlInput[i] + ";" + sqlInput[i+1]);
					}
					//Add back the semicolon at the end of the line
					sqlInput[i] = trim(sqlInput[i]) + ';';
					//Get rid of any empty statements
					if(sqlInput[i] === ';'){
						sqlInput.splice(i, 1);
					}
				}
			}
			for (i = 0; i < sqlInput.length; i++) {
				//If the array item is only a string format it into an sql object
				if (typeof sqlInput[i] === "string") {
					sqlInput[i] = {
						"sql": sqlInput[i],
						"data": [],
						"success": doNothing
					};
				} else {
					if(isUndefined(sqlInput[i].data)){
						sqlInput[i].data = [];
					}
					if(isUndefined(sqlInput[i].success)){
						sqlInput[i].success = doNothing;
					}
					// Check to see that the sql object is formated correctly.
					if (typeof sqlInput[i]         !== "object"   ||
					    typeof sqlInput[i].sql     !== "string"   ||
					    typeof sqlInput[i].success !== "function" ||
						!(sqlInput[i].data instanceof Array)) {
						throw new Error("Malformed sql object: "+sqlInput[i]);
					}
				}
			}
			return sqlInput;
		},
		statementsAreSelectOnly = function (SQLObjects) {
		// Returns true if all SQL statement objects are SELECT statements.
			var i = 0;
				
			//Loop over SQL objects ensuring they are select statments
			do {
				//If the sql string is not a select statement return false
				if (!isSelectStmt(SQLObjects[i].sql)) {
					return false;
				}
				i++;
			} while (i < SQLObjects.length);
		
			//If all the statments happen to be select statments return true
			return true;
		};
	return {
		database: null,
		logInfo: false,
		logErrors: false,
		defaultFailureCallback: doNothing,
		putSelectResultsInArray: true,
		openDatabase: function (name, displayname, size, whenOpen) {
			html5sql.database = openDatabase(name, "", displayname, size);
			readTransactionAvailable = typeof html5sql.database.readTransaction === 'function';
			if (whenOpen) {
				whenOpen();
			}
		},
		
		process: function (sqlInput, finalSuccessCallback, failureCallback) {
		/*
		 *
		 *	Arguments:
		 *	
		 *  sql = [array SQLObjects] ~ collection of SQL statement objects
		 *           or
		 *        [array SQLStrings] ~ collection of SQL statement strings
		 *           or
		 *        "SQLstring"        ~ SQL string to be split at the ';'
		 *                             character and processed sequentially
         *
		 *  finalSuccessCallback = (function) ~ called after all sql statments have
		 *                               		been processed.  Optional.
		 * 
		 *  failureCallback = (function) ~ called if any of the sql statements
		 *                                 fails.  A default one is used if none
		 *                                 is provided.
		 *                             
		 *                               
		 *	SQL statement object:
		 *	{
		 *	 sql: "string",      !Required! ~ Your sql as a string
		 *	 data: [array],       Optional  ~ The array of data to be sequentially
		 *	                                  inserted into your sql at the ?
		 *   success: (function), Optional  ~ A function to be called if this
		 *                                    individual sql statment succeeds.
		 *                                    If an array is returned it is used as
		 *                                    the data for the next sql statement
		 *                                    processed.
		 *  }
		 *
		 *	Usage:
		 *	html5sql.process(
		 *		[{
		 *		   sql: "SELECT * FROM table;",
		 *		   data: [],
		 *		   success: function(){}
		 *		 },
		 *		 {
		 *		   sql: "SELECT * FROM table;",
		 *		   data: [],
		 *		   success: function(){}
		 *		 }],
		 *		function(){},
		 *		function(){}
		 *	);
		 *	
		 */
			if (html5sql.database) {
				
				var sqlObjects = sqlObjectCreator(sqlInput);

				if(isUndefined(finalSuccessCallback)){
					finalSuccessCallback = doNothing;
				}

				if(isUndefined(failureCallback)){
					failureCallback = html5sql.defaultFailureCallback;
				}

				if (statementsAreSelectOnly(sqlObjects) && readTransactionAvailable) {
					html5sql.database.readTransaction(function (transaction) {
						sqlProcessor(transaction, sqlObjects, finalSuccessCallback, failureCallback);
					});
				} else {
					html5sql.database.transaction(function (transaction) {
						sqlProcessor(transaction, sqlObjects, finalSuccessCallback, failureCallback);
					});
				}
			} else {
				// Database hasn't been opened.
				if(html5sql.logErrors){
					console.error("Error: Database needs to be opened before sql can be processed.");
				}
				return false;
			}
		},
	
		changeVersion: function (oldVersion, newVersion, sqlInput, finalSuccessCallback, failureCallback) {
		/* This is the same as html5sql.process but used when you want to change the
		 * version of your database.  If the database version matches the oldVersion
		 * passed to the function the statements passed to the funciton are
		 * processed and the version of the database is changed to the new version.
		 *
		 *	Arguments:
		 *	oldVersion = "String"             ~ the old version to upgrade
		 *	newVersion = "String"             ~ the new version after the upgrade
		 *  sql = [array SQLObjects] ~ collection of SQL statement objects
		 *           or
		 *        [array SQLStrings] ~ collection of SQL statement strings
		 *           or
		 *        "SQLstring"        ~ SQL string to be split at the ';'
		 *                             character and processed sequentially
         *
		 *  finalSuccessCallback = (function) ~ called after all sql statments have
		 *                               		been processed.  Optional.
		 * 
		 *  failureCallback = (function) ~ called if any of the sql statements
		 *                                 fails.  A default one is used if none
		 *                                 is provided.
		 *
		 *	SQL statement object:
		 *	{
		 *	 sql: "string",      !Required! ~ Your sql as a string
		 *	 data: [array],       Optional  ~ The array of data to be sequentially
		 *	                                  inserted into your sql at the ?
		 *   success: (function), Optional  ~ A function to be called if this
		 *                                    individual sql statment succeeds
		 *   failure: (function), Optional  ~ A function to be called if this
		 *                                    individual sql statement fails
		 *  }
		 *
		 *	Usage:
		 *	html5sql.changeVersion(
		 *	    "1.0",
		 *	    "2.0",
		 *		[{
		 *		   sql: "SELECT * FROM table;",
		 *		   data: [],
		 *		   success: function(){},
		 *		   failure: function(){}
		 *		 },
		 *		 {
		 *		   sql: "SELECT * FROM table;",
		 *		   data: [],
		 *		   success: function(){},
		 *		   failure: function(){}
		 *		 }],
		 *		function(){},
		 *		function(){}
		 *	);
		 *	
		 */
			if (html5sql.database) {
				if(html5sql.database.version === oldVersion){
					var sqlObjects = sqlObjectCreator(sqlInput);
				
					if(isUndefined(finalSuccessCallback)){
					finalSuccessCallback = doNothing;
					}

					if(isUndefined(failureCallback)){
						failureCallback = html5sql.defaultFailureCallback;
					}

					html5sql.database.changeVersion(oldVersion, newVersion, function (transaction) {
						sqlProcessor(transaction, sqlObjects, finalSuccessCallback, failureCallback);
					});
				}
			} else {
				// Database hasn't been opened.
				if(html5sql.logErrors){
					console.log("Error: Database needs to be opened before sql can be processed.");	
				}
				return false;
			}
		
		}
	};
	
})();

; browserify_shim__define__module__export__(typeof html5sql != "undefined" ? html5sql : window.html5sql);

}).call(global, undefined, undefined, undefined, undefined, function defineExport(ex) { module.exports = ex; });

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],12:[function(require,module,exports){
var $ = window.$;
var html5sql = require('./html5sql.js');
var Promise = require('promise');

var config = {
    dbName : 'alertover.db',
    dbDisplay : 'alertover',
    dbSize : 5*1024*1024,
    getMessagesUrl : 'http://test.api.alertover.com/api/v1/get_msg',
    pageNum : 10
};

var db = (function(){
    html5sql.openDatabase(config['dbName'], config['dbDisplay'], config['dbSize']);
    return {
        query : function(sql){
            return new Promise(function(resolve, reject){
                html5sql.process(
                    sql,
                    function(tr, re){
                        resolve([tr, re]);
                    }, function(error, statement){
                        console.log(error.message);
                        console.log(statement);
                        reject([error, statement]);
                    }
                );
            });
        }
    };
})();

var base = (function(){
    var $content = $('#content'),
        $sourcesUl = $('#sourcesUl'),
        windowHeight = $(window).height(),
        flat = false;

    return {
        page    :   1,
        sid     :   'all',

        renderSourcesUl : function(results){
            $sourcesUl.append('<li class="active"><a class="sourcesItem" data-sid="all" href="#">所有信息</a></li>');
            for(var i=0; i<results.length; i++){
                template = '<li><a class="sourcesItem" data-sid="'+ results[i]['sid'] +'" href="#"><img src="'+ results[i]['source_icon'] +'"/>'+ results[i]['name'] +'</a></li>';
                $sourcesUl.append(template);
            }
        },

        renderContent : function(results){
            for(var i=0; i<results.length; i++){
                template = '<div class="media mk-media"><div class="media-left"><span class="media-object-wrapper"><img class="media-object" src="'+results[i]['source_icon']+'"></span></div>';
                template += '<div class="media-body"><h4 class="media-heading">'+(results[i]['title']?results[i]['title']:'Alertover')+'</h4><p class="media-datetime">2015-10-11 10:10</p>'+results[i]['content'];
                if(results[i]['url']){
                    template += '<p class="media-url"><a target="_black" href="'+ results[i]['url'] +'">详细信息</a></p></div></div>';
                } else {
                    template += '</div></div>';
                }
                $content.append(template);
            }
        },

        scrollHandler : function(e){
            if(!flat){
                flat = true;
                var scrollEvent = setTimeout(function(){
                    var documentHeight = $(document).height();
                    var scrollTop = $(document).scrollTop();
                    if(documentHeight-scrollTop-windowHeight < 200){
                        var offset = base.page*config['pageNum'];
                        var sid = base.sid;
                        if(base.sid == 'all'){
                            sql = "SELECT * FROM messages JOIN sources ON messages.sid=sources.sid ORDER BY rt DESC LIMIT "+config['pageNum']+" OFFSET "+offset;
                        }
                        else {
                            sql = "SELECT * FROM messages JOIN sources ON messages.sid=sources.sid WHERE sources.sid="+ base.sid  +" ORDER BY rt DESC LIMIT "+config['pageNum']+" OFFSET "+offset;
                        }
                        db.query().then(function(da){
                            if(da[1].rows.length){
                                base.renderContent(da[1].rows);
                                base.page += 1;
                            }
                            if(da[1].rows.length == config['pageNum']){
                                flat = false;
                            }
                        });
                    }
                    else {
                        flat = false;
                    }
                }, 500)
            }
        },

        changeSourceHandler : function(e){
            e.preventDefault();

            // @转换发送源 初始化相关参数
            base.sid = $(e.target).data('sid');
            base.page = 1;
            flat = false;

            if(base.sid == 'all'){
                sql = "SELECT * FROM messages JOIN sources ON messages.sid=sources.sid ORDER BY rt DESC LIMIT "+config['pageNum'];
            }
            else {
                sql = "SELECT * FROM messages JOIN sources ON messages.sid=sources.sid WHERE sources.sid="+ base.sid  +" ORDER BY rt DESC LIMIT "+config['pageNum'];
            }
            db.query(sql).then(function(da){
                $content.empty();
                if(da[1].rows.length){
                    base.renderContent(da[1].rows);
                }
                if(da[1].rows.length == config['pageNum']){
                    flat = false;
                }
                base.page += 1;
                $('#sourcesList').collapse('hide');
                $sourcesUl.find('li').removeClass('active');
                activeAttr = '[data-sid="'+ base.sid +'"]';
                $sourcesUl.find(activeAttr).parent('li').addClass('active');
            });
        },

        logoutHandler : function(e){
            e.preventDefault();
            if(confirm('确定要退出Alertover？')){
                //用户退出 清空数据库
                // 检查并初始化客户端数据库
                db.query([
                    "DROP TABLE messages;",
                    "DROP TABLE sources;"
                ]);
                localStorage.clear();
                var bg = chrome.extension.getBackgroundPage();
                bg.bgScript.disconnect();
                window.location = '/html/login.html'; 
            }
        }
    }
})();

$(document).ready(function(){
    chrome.browserAction.setBadgeText({text : ''}); 

    var session = localStorage.getItem('aosession');
    var lastUpdate = localStorage.getItem('lastUpdate');
    var now = Date.parse(new Date)/1000;
    if(!lastUpdate){
        lastUpdate = now - 2*24*60*60;
        localStorage.setItem('lastUpdate', lastUpdate);
    }

    if(!session){
        // 没有登录 请先登录
        // @todo 登录完清除数据库数据
        window.location = '/html/login.html'; 
        return;
    }

    // 事件绑定
    $(document).on('scroll', base.scrollHandler);
    $('#sourcesUl').on('click', '[data-sid]', base.changeSourceHandler);
    $('#logoutBtn').on('click', base.logoutHandler);

    // 检查并初始化客户端数据库
    var createTablesSql = [
        "CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, msgid INTEGER UNIQUE, sid INTEGER, title TEXT, content TEXT, url TEXT, rt INTEGER, priority INTEGER);",
        "INSERT OR IGNORE INTO messages VALUES (NULL,0,0,'欢迎使用Alertover','收到这条信息时，你可以通过该设备接收Alertover信息。\n点击下面链接来设置你的账户','https://www.alertover.com',"+ now +",0);",
        "CREATE TABLE IF NOT EXISTS sources (sid INTEGER UNIQUE, name TEXT, source_icon TEXT);",
        "INSERT OR IGNORE INTO sources VALUES (0, 'Alertover', 'http://172.16.5.61/static/imgs/alertover.png');",
    ];
    var pCreateTables = db.query(createTablesSql);

    //获取本地数据库里的信息 并且分页 
    pCreateTables.then(function(da){
        return db.query("SELECT * FROM messages JOIN sources ON messages.sid=sources.sid ORDER BY rt DESC LIMIT "+config['pageNum']);
    }).then(function(da){
        base.renderContent(da[1].rows);
    });
    //获取本地数据库里的信息 渲染sourcelist 
    pCreateTables.then(function(da){
        return db.query("SELECT * FROM sources");
    }).then(function(da){
        base.renderSourcesUl(da[1].rows);
    });

    // 获取最新信息 并写入数据库
    var pGetMessages = new Promise(function(resolve, reject){
        // 获取最新信息 并存到客户端数据库
        $.ajax({
            url : config.getMessagesUrl,
            method : 'get',
            dataType : 'json',
            data : {
                'session' : session,
                'devname' : 'chrome',
                'from' : lastUpdate 
            },
            success : function(da){
                if(da.code === 0 && (da['data'].length > 0)){
                    resolve(da);
                }
                else {
                    reject(da);
                }
            },
            error : function(err){
                reject(err);
            }
        });
    });
    var pSaveMessages = Promise.all([pGetMessages, pCreateTables]).then(function(da){
        var messages = da[0]['data'];
        var sqls = [];
        for(var i=0;i<messages.length;i++){
            sqls.push({
                "sql" : "REPLACE INTO messages VALUES (NULL,?,?,?,?,?,?,?)",
                "data" : [messages[i]['msgid'], messages[i]['sid'], messages[i]['title'], messages[i]['content'], messages[i]['url'], messages[i]['rt'], messages[i]['priority']]
            });
            sqls.push({
                "sql" : "REPLACE INTO sources VALUES (?,?,?)",
                "data" : [messages[i]['sid'], messages[i]['source'], messages[i]['source_icon']]
            });
        }
        return db.query(sqls);
    }, function(err){
        return Promise.reject('没有新增信息');
    });
    var pLoadMessages = pSaveMessages.then(function(){
        //获取本地数据库里的信息 并且分页 
        return db.query("SELECT * FROM messages JOIN sources ON messages.sid=sources.sid ORDER BY messages.rt DESC LIMIT "+config['pageNum']);
    }, function(err){
        console.log(err);
    });
    pLoadMessages.then(function(da){
        results = da[1]['rows'];
        $('#content').empty();
        base.renderContent(results);
        localStorage.setItem('lastUpdate', da[1]['rows'][0]['rt']);
    }, function(err){
        console.log(err);
    });
});

},{"./html5sql.js":11,"promise":1}]},{},[12]);
