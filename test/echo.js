
void function () {
  var loop = woop.createLoop();

  loop
  .push(function (data, done) {
    done(true, data.arguments);
  }, 'echo')
  .on('done', function (e) {
    assert(e);
    assert('echo' == e.message[0]);
  })
  .dequeue(function () {
    assert(0 == this.active.length);
    assert(0 == this.queue.length);
  });

}();
