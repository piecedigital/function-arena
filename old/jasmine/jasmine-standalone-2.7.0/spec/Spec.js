describe("Testing 'normalizeID' function", function () {
  it("Names are transformed", function () {
    expect(normalizeID("Foo Bar Baz")).toBe("foo-bar-baz");
    expect(normalizeID("NOCAPS")).toBe("nocaps");
  });
});

describe("Testing 'getButton' function", function () {
  gamepads = Object.assign(
    JSON.parse('{"fake-game-pad":{"name":"fake-game-pad","index":0,"configuration":{},"recordedInputs":[],"maxRecordedInputs":50,"readCount":0,"maxReadCount":10,"retireRecordedFrameTime":833.3333333333334,"player":null,"axes":{"ind":9,"3.29":"n","-1.00":"u","-0.71":"ur","-0.43":"r","-0.14":"dr","0.14":"d","0.43":"dl","0.71":"l","1.00":"ul","-0.03":"n","12.00":"u","1215.00":"ur","15.00":"r","1315.00":"dr","13.00":"d","1314.00":"dl","14.00":"l","1214.00":"ul"}}}')
  );


  it("Getting configuration", function () {
    var b = getButton(gamepads["fake-game-pad"], 0);
    // console.log(b);
    expect(b).toBe(0);
    gamepads["fake-game-pad"].configuration = {
      0: 1
    };
    b = getButton(gamepads["fake-game-pad"], 0);
    // console.log(b);
    expect(b).toBe(1);
  });
});
