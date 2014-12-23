
void function () {
  var loop = woop.createLoop();

  loop
  .push(work,
        function () { /* not actually called */ },
        {foo: 'bar'},
        123,
        true)
  .on('done', function (e) {
    assert(e);
    assert(e.src);
    assert(e.message);
  })
  .dequeue(function () {
    assert(0 == this.length);
    assert(0 == this.queue.length);
    assert(0 == this.active.length);
  });

  function work (data, done) {
    var args = data.arguments;
    done(true,
         'function' == typeof args[0] &&
         'object' == typeof args[1] &&
         'number' == typeof args[2] &&
         'boolean' == typeof args[3]
        );
  }
}();
