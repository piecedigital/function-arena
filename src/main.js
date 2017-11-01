HTMLElement.prototype.hasClass = function(stringOrArray) {
  if(!this) return console.error("No element found");
  if(!this.className) return false;

  const proceed = function(type) {
    let yes = false;

    switch (type) {
      case "Array": yes = stringOrArray.map(check) || yes; break;
      case "String": yes = check(stringOrArray); break;
    }
    return yes;
  }

  const check = function(text) {
    return this.className.split(" ").indexOf(text) >= 0;
  }.bind(this);

  const type = Object.prototype.toString.call(stringOrArray).match(/([a-z]+)]/i)[1];
  switch (type) {
    case "String":
    case "Array":
      return proceed(type);
  }
}

HTMLElement.prototype.addClass = function(stringOrArray) {
  if(!this) return console.error("No element found");
  const proceed = function(type) {
    switch (type) {
      case "Array": stringOrArray.map(add).join(" "); break;
      case "String": add(stringOrArray); break;
    }
  }

  const add = function(text) {
    const arr = this.className ? this.className.split(" ") : [];
    if(arr.indexOf(text) !== -1) return;
    arr.push(text);
    const joined = arr.join(" ");
    this.className = joined;
  }.bind(this);

  const type = Object.prototype.toString.call(stringOrArray).match(/([a-z]+)]/i)[1];
  proceed(type);
}

HTMLElement.prototype.removeClass = function(stringOrArray) {
  if(!this) return console.error("No element found");
  const proceed = function(type) {
    switch (type) {
      case "Array": stringOrArray.map(remove).join(" "); break;
      case "String": remove(stringOrArray); break;
    }
  }

  const remove = function(text) {
    const arr = this.className ? this.className.split(" ") : [];
    const place = arr.indexOf(text);
    if(place < 0) return this.className;
    arr.splice(place, 1);
    this.className = arr.join(" ");
  }.bind(this);

  const type = Object.prototype.toString.call(stringOrArray).match(/([a-z]+)]/i)[1];
  proceed(type);
}

const copyObject = function (obj) {
  return JSON.parse(JSON.stringify(obj));
}

const realType = function (data) {
  return Object.prototype.toString.call(data).split(" ").pop().replace(/.$/, "").toLowerCase();
}

const typeError = function (variable, expectedType, data) {
  console.error(TypeError(`Expected '${variable}' to be of type '${expectedType}'; got type '${realType(data)}'`));
}

const classError = function (variable, expectedClass, data) {
  console.error(TypeError(`Expected '${variable}' to be of class '${expectedClass}'; got type '${data.constructor.name}'`));
}


const foo: number = "string";
const gamepads = {};
const configuring = false;
let knownAxis;
const canvasScale = .7;
const canvasScaleMin = .6;
const canvasScaleMax = 1;
const canvasScaleValue = .5;
const canvasInfo = {
  width: 1920 * (canvasScale * canvasScaleValue),
  height: 1080 * (canvasScale * canvasScaleValue),
  stageWidth: 1200
}
const inputImages = {};
const players = {
  player1: null,
  player2: null
};

// class Pad
const Pad = function({id, name, index, configuration}) {
  this.name = name;
  this.index = index;
  this.configuration = configuration;
  this.recordedInputs = [];
  this.maxRecordedInputs = 50;
  this.readCount = 0;
  this.maxReadCount = 10;
  this.retireRecordedFrameTime = (1000 / 60) * 50;
  this.noInputFrames = 0;
  this.maxNoInputFrames = 25;
  this.player = null;
  this.axes = {
    ind: 9,
    "3.29": "n",
    "-1.00": "u",
    "-0.71": "ur",
    "-0.43": "r",
    "-0.14": "dr",
    "0.14": "d",
    "0.43": "dl",
    "0.71": "l",
    "1.00": "ul",
    "-0.03": "n",
    "12.00": "u",
    "1215.00": "ur",
    "15.00": "r",
    "1315.00": "dr",
    "13.00": "d",
    "1314.00": "dl",
    "14.00": "l",
    "1214.00": "ul"
  };
}

// class Controllers
const Controllers = function () {
  (function constructor() {
    this.gamepads = {};
    this.configuring = {};
  })();

  const normalizeID = function(id) {
    if(realType(data) !== "string") {
      typeError("id", "string", id);
      return null;
    }
    return id.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s/g, "-");
  }

  const addPad = function(e) {
    // console.log(e.gamepad);
    const name = "i" + e.gamepad.index + "-" + normalizeID(e.gamepad.id);
    // console.log(name);
    this.gamepads[name] = new Pad({
      name,
      index: e.gamepad.index,
      id: e.gamepad.id,
      configuration: e.configuration
    });
  }

  const removePad = function(e) {
    if(realType(e) !== "object") return typeError("e", "object", e);
    // console.log(e.gamepad);
    const name = "i" + e.gamepad.index + "-" + normalizeID(e.gamepad.id);
    delete gamepads[name];
  }

  const getPads = function() {
    const pads = navigator.getGamepads();
    Object.keys(pads).map(function (num) {
      if(pads[num]) {
        let configuration = null;
        if(pads[num].mapping === "standard") {
          configuration = {
            "0": 1, // lp
            "1": 2, // lk
            "2": 0 // mk
          }
        }
        const name = "i" + pads[num].index + "-" + normalizeID(pads[num].id);

        // console.log("Gamepad Found!");
        if(!gamepads[name]) addPad({
          gamepad: pads[num],
          configuration
        });
      }
    });
  }
}

Controllers.prototype.startConfigButton = function(controllerName, btn) {
  this.configuring[controllerName] = btn;
}

Controllers.prototype.setConfigButton = function(controllerName, btn) {
  const map = {
    lp: 0,
    mp: 3,
    hp: 5,
    "3p": 4,
    lk: 1,
    mk: 2,
    hk: 7,
    "3k": 6
  }

  gamepads[name].configuration[btn] = map[this.configuring[controllerName]];
  this.configuring[controllerName] = null;
}

Controllers.prototype.checkPad = function(pad) {
  if(!(pad instanceof Pad)) {
    return classError("pad", "Pad", pad);
  }
  // const gamepad = navigator.getGamepads()[gamepadIndex]
  const gamepadIndex = pad.index;
  const gamepadName = pad.name;
  // console.log(navigator.getGamepads()[gamepadIndex], gamepadName);
  pad.depressed = pad.depressed || {};
  const depressed = pad.depressed;
  pad.test = pad.test || [];

  const returnData = {};

  // main loop
  const gamepad = navigator.getGamepads()[gamepadIndex]
  // if(primaryController(gamepad)) console.log(gamepadName); else return;
  if(!primaryController(gamepad)) return;
  const onePress = {}, oneRelease = {};
  if(gamepad) gamepad.buttons.map(function (btn, ind) {
    // console.log(btn);
    if(btn.pressed) {
      if(!depressed[ind]) {
        onePress[ind] = true;
      }
      depressed[ind] = true;
    } else {
      if(depressed[ind]) oneRelease[ind] = true;
      delete depressed[ind];
    }
  });

  if(Object.keys(onePress).length > 0) returnData.onePress = onePress;
  if(Object.keys(depressed).length > 0) returnData.depressed = depressed;
  // if(Object.keys(oneRelease).length > 0) returnData.oneRelease = oneRelease;

  buttonsPressedOnce(onePress);
  buttonsAreDepressedAndAxes(depressed, gamepad.axes);
  buttonsReleasedOnce(oneRelease);
  // end loop

  function buttonsPressedOnce(buttons) {
    breakdownButton(buttons, function (usedButton) {
      // console.log("pressed", usedButton);
      // console.log(buttons);
      if(!pad.player) {
        if(!players.player1) {
          players.player1 = new Player({
            pad
          });
          pad.player = players.player1;
        } else if(!players.player2) {
          players.player2 = new Player({
            pad
          });
          pad.player = players.player2;
        }
      }
      if(configuring !== false) {
        setConfig(gamepadName, usedButton);
      } else {
        highlightButton(usedButton);
      }
    });
  }
  function buttonsAreDepressedAndAxes(buttons, axes) {
    // console.log("start");
    const padButtonsObj = {};
    breakdownButton(buttons, function (usedButton) {
      // console.log("depressed", usedButton, buttons);
      if(buttons["12"]) padButtonsObj[12] = 12;
      if(buttons["14"]) padButtonsObj[14] = 14;
      if(buttons["13"]) padButtonsObj[13] = 13;
      if(buttons["15"]) padButtonsObj[15] = 15;
    });
    padButtonsArr = Object.keys(padButtonsObj);
    // console.log(parseInt(padButtonsArr.join("")));
    if(padButtonsArr.length > 0) axisData([parseInt(padButtonsArr.join(""))]); else axisData(axes);
    // console.log("end");
  }
  function buttonsReleasedOnce(buttons) {
    breakdownButton(buttons, function (usedButton) {
      // console.log("released");
      highlightButton(usedButton, true);
    });
  }

  function breakdownButton(buttons, cb) {
    Object.keys(buttons).map(function (btn) {
      const usedButton = getButton(pad, btn);
      // console.log(checked, usedButton);
      // console.log(btn, "(" + (parseInt(btn) + 1) + ")", "Config:", usedButton);
      cb(usedButton);
    });
  }

  function axisData(axes) {
    // console.log(axes);
    const axPlus = axes.reduce((m,n) => m + n);
    // console.log(axPlus);
    const value = axes.length === 4 ? axPlus.toFixed(2) : axes.pop().toFixed(2);
    const input = getStickInput(value) || "n";
    // console.log(value);
    if(input) returnData.axis = input;
    if(input && ballTop && !ballTop.hasClass(input)) {
      returnData.oneAxis = input;
      // console.log(input);
      ballTop.removeClass(["n", "u", "ur", "r", "dr", "d", "dl", "l", "ul"]);
      // console.log(value, input);
      ballTop.addClass(input);
      // console.log(value, gamepads[gamepadName].axes[value]);
    }
  }

  function getStickInput(value) {
    return gamepads[gamepadName].axes[value];
  }

  function convert(data) {
    const newData = {
      axis: data.axis,
    };
    if(data.oneAxis) newData.oneAxis = data.oneAxis;
    // console.log(data);
    ["onePress", "depressed", "oneRelease"].map(state => {
      const stateData = data[state];
      if(!stateData) return;
      const newStateData = {};
      Object.keys(stateData).map(btn => {
        newStateData[getButton(pad, btn)] = true;
      });

      newData[state] = newStateData;
    });

    return newData
  }

  return convert(returnData);
}

Controllers.prototype.humanizeButton = function(btn) {
  return parseInt(btn) + 1;
}
