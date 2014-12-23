woop
====

WebWorker event loop. Queue functions to be executed in web workers in
an event loop context. Work can last forever or be completed later.
Functions can have bound arguments when pushed to the loop queue which
will be exposed to the function executed in a webworker.

## install

With [component](https://github.com/componentjs/component):

```sh
$ component install jwerle/woop
```

From source:

```sh
$ wget https://raw.githubusercontent.com/qute/qute/master/woop.js
```

## usage

With [component](https://github.com/componentjs/component):

```js
var loop = require('woop').createLoop();
```

Global scope:

```js
var loop = woop.createLoop();
```

## example

This example demonstrates a simple echo worker. It accepts a single
argument and replies with that same argument.

```js
var loop = woop.createLoop();

loop
.push(function (data, done) {
    done(true, data.arguments[0]);
}, 'echo')
.on('done', function (e) {
    console.log(e.message); // 'echo'
})
.dequeue();
```

## api

### createLoop

This returns an instance of `Loop` where "work" can be pushed and then
dequeued.

```js
var loop = woop.createLoop();
```

### Loop()

The `Loop` constructor.

```js
var loop = new woop.Loop();
```

#### Loop#push(work, [...arguments])

Push work onto the loop queue to be dequeued later with optional bound
arguments.

```js
loop.push(work, "beep", "boop");
function work (data, done) {
  console.log(data.arguments); // ["beep", "boop"]
  done(true, 'beeboop');
});
```

A worker function accepts two arguments. The `data` argument which is an
object that contains an `arguments` property. The `arguments` property
is an array of optional arguments passed with the function when queued.
The second argument `done` is a callback function. When you call this
function it emits a response to the main thread with optional data. The
`done` function accepts two arguments. The first argument is a `boolean`
signaling whether work in the wokrer is complete. If `done(true)` is
passed the worker will terminate. Any javascript after the call to `done(true)`
will cause undefined behavior. If you want your worker to stay alive
then call `done(false)`. Calling `done(true)` will cause a 'done'
event to be emitted on the main thread. All calls to `done(false)` will
emit a 'message' event.

#### Loop#dequeue([done])

This will cause the event queue to dequeue itself. This will occur
asynchronously. When the loop has successfully dequeued it will call an
optional `done` callback if provided.

```js
loop.dequeue(function () {
  console.log("loop dequeued");
});
```

### events

During a dequeue process some events are emitted to give insight into
what is going on with the workers.

#### 'done'

This event is emitted when a worker has completed. The underlying
`WebWorker` will be terminated (`worker.terminate()`) by the time this
event is emitted.


```js
loop.on('done', function (e) {
  console.log(e.message);
});
```

#### message

This event is emitted when a worker emits a response. This event is
emitted in conjunction with the 'done' event if a webworker has
completed.

```js
loop.on('message', function (e) {
  console.log(e.message);
});
```

## license

MIT
