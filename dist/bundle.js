(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

HTMLElement.prototype.hasClass = function (stringOrArray) {
  if (!this) return console.error("No element found");
  if (!this.className) return false;

  var proceed = function proceed(type) {
    var yes = false;

    switch (type) {
      case "Array":
        yes = stringOrArray.map(check) || yes;break;
      case "String":
        yes = check(stringOrArray);break;
    }
    return yes;
  };

  var check = (function (text) {
    return this.className.split(" ").indexOf(text) >= 0;
  }).bind(this);

  var type = Object.prototype.toString.call(stringOrArray).match(/([a-z]+)]/i)[1];
  switch (type) {
    case "String":
    case "Array":
      return proceed(type);
  }
};

HTMLElement.prototype.addClass = function (stringOrArray) {
  if (!this) return console.error("No element found");
  var proceed = function proceed(type) {
    switch (type) {
      case "Array":
        stringOrArray.map(add).join(" ");break;
      case "String":
        add(stringOrArray);break;
    }
  };

  var add = (function (text) {
    var arr = this.className ? this.className.split(" ") : [];
    if (arr.indexOf(text) !== -1) return;
    arr.push(text);
    var joined = arr.join(" ");
    this.className = joined;
  }).bind(this);

  var type = Object.prototype.toString.call(stringOrArray).match(/([a-z]+)]/i)[1];
  proceed(type);
};

HTMLElement.prototype.removeClass = function (stringOrArray) {
  if (!this) return console.error("No element found");
  var proceed = function proceed(type) {
    switch (type) {
      case "Array":
        stringOrArray.map(remove).join(" ");break;
      case "String":
        remove(stringOrArray);break;
    }
  };

  var remove = (function (text) {
    var arr = this.className ? this.className.split(" ") : [];
    var place = arr.indexOf(text);
    if (place < 0) return this.className;
    arr.splice(place, 1);
    this.className = arr.join(" ");
  }).bind(this);

  var type = Object.prototype.toString.call(stringOrArray).match(/([a-z]+)]/i)[1];
  proceed(type);
};

var copyObject = function copyObject(obj) {
  return JSON.parse(JSON.stringify(obj));
};

var realType = function realType(data) {
  return Object.prototype.toString.call(data).split(" ").pop().replace(/.$/, "").toLowerCase();
};

var typeError = function typeError(variable, expectedType, data) {
  console.error(TypeError("Expected '" + variable + "' to be of type '" + expectedType + "'; got type '" + realType(data) + "'"));
};

var classError = function classError(variable, expectedClass, data) {
  console.error(TypeError("Expected '" + variable + "' to be of class '" + expectedClass + "'; got type '" + data.constructor.name + "'"));
};

var foo = "string";
var gamepads = {};
var configuring = false;
var knownAxis = undefined;
var canvasScale = .7;
var canvasScaleMin = .6;
var canvasScaleMax = 1;
var canvasScaleValue = .5;
var canvasInfo = {
  width: 1920 * (canvasScale * canvasScaleValue),
  height: 1080 * (canvasScale * canvasScaleValue),
  stageWidth: 1200
};
var inputImages = {};
var players = {
  player1: null,
  player2: null
};

var speaker = (function () {
  var voices = undefined,
      voice = undefined;
  speechSynthesis.onvoiceschanged = function () {
    voices = speechSynthesis.getVoices();
    voice = voices[12];
    // console.log("got my voice:", voice);
    msg.voice = voice;
    msg.pitch = 0;
  };
  var msg = new SpeechSynthesisUtterance();
  msg.volume = .5;
  msg.text = "Okay. This is a test";
  if (voice) msg.voice = voice;
  if (voice) console.log(voice.name, voice.lang);
  return {
    speak: function speak() {
      // msg.pitch = Math.random() * 2;
      // if(speechSynthesis.speaking) {
      // }
      speechSynthesis.cancel();
      speechSynthesis.speak(msg);
    },
    setText: function setText(text) {
      msg.text = text || msg;
    },
    setPitch: function setPitch(num) {
      if (typeof num === "number") {
        msg.pitch = num;
      }
    },
    setVoice: function setVoice(num) {
      if (voices && typeof num === "number") {
        // console.log(voices[num]);
        voice = voices[num] || voice;
        if (voice !== msg.voice) msg.voice = voice;
        // console.log(voice);
      }
    }
  };
})();

var gfxDisplay = new MakeCanvas(canvasInfo);

// create input images
["lp", "mp", "hp", "lmhp", "lk", "mk", "hk", "lmhk",
// "n",
"u", "ur", "r", "dr", "d", "dl", "l", "ul"].map(function (input, ind) {
  var name = undefined;
  if (ind >= 8) name = "u";
  var img = document.createElement("img");
  var imgObj = {};
  img.className = "input-img " + input;
  img.src = "images/" + (name || input) + ".png";
  imgObj.className = "input-img " + input;
  imgObj.src = "images/" + (name || input) + ".png";
  inputImages[input] = imgObj;
  // console.log(input, name);
});

var framesCounted = 0;
var ballTop = document.querySelector(".stick .ball");
var inputDisplay = document.querySelector(".inputs");

// class Pad
var Pad = function Pad(_ref) {
  var id = _ref.id;
  var name = _ref.name;
  var index = _ref.index;
  var configuration = _ref.configuration;

  this.name = name;
  this.index = index;
  this.configuration = configuration;
  this.recordedInputs = [];
  this.maxRecordedInputs = 50;
  this.readCount = 0;
  this.maxReadCount = 10;
  this.retireRecordedFrameTime = 1000 / 60 * 50;
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
};

// class Controllers
var Controllers = function Controllers() {
  (function constructor() {
    this.gamepads = {};
    this.configuring = {};
  })();

  var normalizeID = function normalizeID(id) {
    if (realType(data) !== "string") {
      typeError("id", "string", id);
      return null;
    }
    return id.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s/g, "-");
  };

  var addPad = function addPad(e) {
    // console.log(e.gamepad);
    var name = "i" + e.gamepad.index + "-" + normalizeID(e.gamepad.id);
    // console.log(name);
    this.gamepads[name] = new Pad({
      name: name,
      index: e.gamepad.index,
      id: e.gamepad.id,
      configuration: e.configuration
    });
  };

  var removePad = function removePad(e) {
    if (realType(e) !== "object") return typeError("e", "object", e);
    // console.log(e.gamepad);
    var name = "i" + e.gamepad.index + "-" + normalizeID(e.gamepad.id);
    delete gamepads[name];
  };

  var getPads = function getPads() {
    var pads = navigator.getGamepads();
    Object.keys(pads).map(function (num) {
      if (pads[num]) {
        var configuration = null;
        if (pads[num].mapping === "standard") {
          configuration = {
            "0": 1, // lp
            "1": 2, // lk
            "2": 0 // mk
          };
        }
        var _name = "i" + pads[num].index + "-" + normalizeID(pads[num].id);

        // console.log("Gamepad Found!");
        if (!gamepads[_name]) addPad({
          gamepad: pads[num],
          configuration: configuration
        });
      }
    });
  };
};

Controllers.prototype.startConfigButton = function (controllerName, btn) {
  this.configuring[controllerName] = btn;
};

Controllers.prototype.setConfigButton = function (controllerName, btn) {
  var map = {
    lp: 0,
    mp: 3,
    hp: 5,
    "3p": 4,
    lk: 1,
    mk: 2,
    hk: 7,
    "3k": 6
  };

  gamepads[name].configuration[btn] = map[this.configuring[controllerName]];
  this.configuring[controllerName] = null;
};

Controllers.prototype.checkPad = function (pad) {
  if (!(pad instanceof Pad)) {
    return classError("pad", "Pad", pad);
  }
  // const gamepad = navigator.getGamepads()[gamepadIndex]
  var gamepadIndex = pad.index;
  var gamepadName = pad.name;
  // console.log(navigator.getGamepads()[gamepadIndex], gamepadName);
  pad.depressed = pad.depressed || {};
  var depressed = pad.depressed;
  pad.test = pad.test || [];

  var returnData = {};

  // main loop
  var gamepad = navigator.getGamepads()[gamepadIndex];
  // if(primaryController(gamepad)) console.log(gamepadName); else return;
  if (!primaryController(gamepad)) return;
  var onePress = {},
      oneRelease = {};
  if (gamepad) gamepad.buttons.map(function (btn, ind) {
    // console.log(btn);
    if (btn.pressed) {
      if (!depressed[ind]) {
        onePress[ind] = true;
      }
      depressed[ind] = true;
    } else {
      if (depressed[ind]) oneRelease[ind] = true;
      delete depressed[ind];
    }
  });

  if (Object.keys(onePress).length > 0) returnData.onePress = onePress;
  if (Object.keys(depressed).length > 0) returnData.depressed = depressed;
  // if(Object.keys(oneRelease).length > 0) returnData.oneRelease = oneRelease;

  buttonsPressedOnce(onePress);
  buttonsAreDepressedAndAxes(depressed, gamepad.axes);
  buttonsReleasedOnce(oneRelease);
  // end loop

  function buttonsPressedOnce(buttons) {
    breakdownButton(buttons, function (usedButton) {
      // console.log("pressed", usedButton);
      // console.log(buttons);
      if (!pad.player) {
        if (!players.player1) {
          players.player1 = new Player({
            pad: pad
          });
          pad.player = players.player1;
        } else if (!players.player2) {
          players.player2 = new Player({
            pad: pad
          });
          pad.player = players.player2;
        }
      }
      if (configuring !== false) {
        setConfig(gamepadName, usedButton);
      } else {
        highlightButton(usedButton);
      }
    });
  }
  function buttonsAreDepressedAndAxes(buttons, axes) {
    // console.log("start");
    var padButtonsObj = {};
    breakdownButton(buttons, function (usedButton) {
      // console.log("depressed", usedButton, buttons);
      if (buttons["12"]) padButtonsObj[12] = 12;
      if (buttons["14"]) padButtonsObj[14] = 14;
      if (buttons["13"]) padButtonsObj[13] = 13;
      if (buttons["15"]) padButtonsObj[15] = 15;
    });
    padButtonsArr = Object.keys(padButtonsObj);
    // console.log(parseInt(padButtonsArr.join("")));
    if (padButtonsArr.length > 0) axisData([parseInt(padButtonsArr.join(""))]);else axisData(axes);
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
      var usedButton = getButton(pad, btn);
      // console.log(checked, usedButton);
      // console.log(btn, "(" + (parseInt(btn) + 1) + ")", "Config:", usedButton);
      cb(usedButton);
    });
  }

  function axisData(axes) {
    // console.log(axes);
    var axPlus = axes.reduce(function (m, n) {
      return m + n;
    });
    // console.log(axPlus);
    var value = axes.length === 4 ? axPlus.toFixed(2) : axes.pop().toFixed(2);
    var input = getStickInput(value) || "n";
    // console.log(value);
    if (input) returnData.axis = input;
    if (input && ballTop && !ballTop.hasClass(input)) {
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
    var newData = {
      axis: data.axis
    };
    if (data.oneAxis) newData.oneAxis = data.oneAxis;
    // console.log(data);
    ["onePress", "depressed", "oneRelease"].map(function (state) {
      var stateData = data[state];
      if (!stateData) return;
      var newStateData = {};
      Object.keys(stateData).map(function (btn) {
        newStateData[getButton(pad, btn)] = true;
      });

      newData[state] = newStateData;
    });

    return newData;
  }

  return convert(returnData);
};

Controllers.prototype.humanizeButton = function (btn) {
  return parseInt(btn) + 1;
};

Controllers.prototype.getButton = function (pad, btn) {
  if (!(pad instanceof Pad)) return classError("pad", "Pad", pad);
  if (realType(btn) !== "number") return typeError("btn", "number", btn);

  // var value = this.gamepads[pad.name].configuration[btn];
  var value = this.gamepads[pad.name].configuration[btn];
  var returnValue = typeof value === "number" ? parseInt(value) : parseInt(btn);
  return returnValue;
};

Controllers.prototype.addListeners = function () {
  window.addEventListener("gamepadconnected", function (e) {
    console.log("Gamepad Connected!");
  });
  this.addPad(e);

  window.addEventListener("gamepaddisconnected", function (e) {
    console.log("Gamepad Disconnected!");
    this.removePad(e);
  });
};

Controllers.prototype.highlightButton = function (usedButton, released) {
  if (realType(usedButton) !== "number") return typeError("usedButton", "number", usedButton);
  if (realType(released) !== "boolean") return typeError("released", "number", released);

  var elem = document.querySelector(".btn-" + this.humanizeButton(usedButton));
  if (!elem) return;
  if (released) {
    elem.removeClass("pressed");
  } else {
    elem.addClass("pressed");
  }
};

Controllers.prototype.checkPad = function (padInfo) {
  // var gamepad = navigator.getGamepads()[gamepadIndex]
  var gamepadIndex = padInfo.index;
  var gamepadName = padInfo.name;
  // console.log(navigator.getGamepads()[gamepadIndex], gamepadName);
  padInfo.depressed = padInfo.depressed || {};
  var depressed = padInfo.depressed;
  padInfo.test = padInfo.test || [];

  var returnData = {};

  // main loop
  var gamepad = navigator.getGamepads()[gamepadIndex];
  // if(primaryController(gamepad)) console.log(gamepadName); else return;
  if (!primaryController(gamepad)) return;
  var onePress = {},
      oneRelease = {};
  if (gamepad) gamepad.buttons.map(function (btn, ind) {
    // console.log(btn);
    if (btn.pressed) {
      if (!depressed[ind]) {
        onePress[ind] = true;
      }
      depressed[ind] = true;
    } else {
      if (depressed[ind]) oneRelease[ind] = true;
      delete depressed[ind];
    }
  });

  if (Object.keys(onePress).length > 0) returnData.onePress = onePress;
  if (Object.keys(depressed).length > 0) returnData.depressed = depressed;
  // if(Object.keys(oneRelease).length > 0) returnData.oneRelease = oneRelease;

  buttonsPressedOnce(onePress);
  buttonsAreDepressedAndAxes(depressed, gamepad.axes);
  buttonsReleasedOnce(oneRelease);
  // end loop

  function buttonsPressedOnce(buttons) {
    breakdownButton(buttons, function (usedButton) {
      // console.log("pressed", usedButton);
      // console.log(buttons);
      if (!padInfo.player) {
        if (!players.player1) {
          players.player1 = new Player({
            padInfo: padInfo
          });
          padInfo.player = players.player1;
        } else if (!players.player2) {
          players.player2 = new Player({
            padInfo: padInfo
          });
          padInfo.player = players.player2;
        }
      }
      if (configuring !== false) {
        setConfig(gamepadName, usedButton);
      } else {
        highlightButton(usedButton);
      }
    });
  }
  function buttonsAreDepressedAndAxes(buttons, axes) {
    // console.log("start");
    var padButtonsObj = {};
    breakdownButton(buttons, function (usedButton) {
      // console.log("depressed", usedButton, buttons);
      if (buttons["12"]) padButtonsObj[12] = 12;
      if (buttons["14"]) padButtonsObj[14] = 14;
      if (buttons["13"]) padButtonsObj[13] = 13;
      if (buttons["15"]) padButtonsObj[15] = 15;
    });
    padButtonsArr = Object.keys(padButtonsObj);
    // console.log(parseInt(padButtonsArr.join("")));
    if (padButtonsArr.length > 0) axisData([parseInt(padButtonsArr.join(""))]);else axisData(axes);
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
      var usedButton = getButton(padInfo, btn);
      // console.log(checked, usedButton);
      // console.log(btn, "(" + (parseInt(btn) + 1) + ")", "Config:", usedButton);
      cb(usedButton);
    });
  }

  function axisData(axes) {
    // console.log(axes);
    var axPlus = axes.reduce(function (m, n) {
      return m + n;
    });
    // console.log(axPlus);
    var value = axes.length === 4 ? axPlus.toFixed(2) : axes.pop().toFixed(2);
    var input = getStickInput(value) || "n";
    // console.log(value);
    if (input) returnData.axis = input;
    if (input && ballTop && !ballTop.hasClass(input)) {
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
    var newData = {
      axis: data.axis
    };
    if (data.oneAxis) newData.oneAxis = data.oneAxis;
    // console.log(data);
    ["onePress", "depressed", "oneRelease"].map(function (state) {
      var stateData = data[state];
      if (!stateData) return;
      var newStateData = {};
      Object.keys(stateData).map(function (btn) {
        newStateData[getButton(padInfo, btn)] = true;
      });

      newData[state] = newStateData;
    });

    return newData;
  }

  return convert(returnData);
};

function getInputImage(configBtn) {
  // console.log(configBtn);
  var img = document.createElement("img");
  var data = getData(configBtn);
  if (data) {
    img.className = data.className;
    img.src = data.src;
    return img;
  }

  function getData(configBtn) {
    if (typeof configBtn === "string") {
      // console.log("axis");
      // console.log(inputImages[configBtn]);
      return inputImages[configBtn];
    } else {
      // console.log("button");
      switch (configBtn) {
        case 0:
          return inputImages["lp"];
        case 3:
          return inputImages["mp"];
        case 5:
          return inputImages["hp"];
        case 4:
          return inputImages["lmhp"];

        case 1:
          return inputImages["lk"];
        case 2:
          return inputImages["mk"];
        case 7:
          return inputImages["hk"];
        case 6:
          return inputImages["lmhk"];
      }
    }
  }
}

// class GFX
// class GameLoop

// starter
(function () {
  // populateCharacters();
  // getPads();
  // setInterval(getPads, 1000/60);
  // gameLoop();
  // setInterval(function () {
  //   // console.log("FPS:", framesCounted);
  //   fps.innerText = framesCounted;
  //   framesCounted = 0;
  // }, 1000);
})();
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9udm0vdjYuMTEuMy9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiZGlzdC9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbkhUTUxFbGVtZW50LnByb3RvdHlwZS5oYXNDbGFzcyA9IGZ1bmN0aW9uIChzdHJpbmdPckFycmF5KSB7XG4gIGlmICghdGhpcykgcmV0dXJuIGNvbnNvbGUuZXJyb3IoXCJObyBlbGVtZW50IGZvdW5kXCIpO1xuICBpZiAoIXRoaXMuY2xhc3NOYW1lKSByZXR1cm4gZmFsc2U7XG5cbiAgdmFyIHByb2NlZWQgPSBmdW5jdGlvbiBwcm9jZWVkKHR5cGUpIHtcbiAgICB2YXIgeWVzID0gZmFsc2U7XG5cbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgXCJBcnJheVwiOlxuICAgICAgICB5ZXMgPSBzdHJpbmdPckFycmF5Lm1hcChjaGVjaykgfHwgeWVzO2JyZWFrO1xuICAgICAgY2FzZSBcIlN0cmluZ1wiOlxuICAgICAgICB5ZXMgPSBjaGVjayhzdHJpbmdPckFycmF5KTticmVhaztcbiAgICB9XG4gICAgcmV0dXJuIHllcztcbiAgfTtcblxuICB2YXIgY2hlY2sgPSAoZnVuY3Rpb24gKHRleHQpIHtcbiAgICByZXR1cm4gdGhpcy5jbGFzc05hbWUuc3BsaXQoXCIgXCIpLmluZGV4T2YodGV4dCkgPj0gMDtcbiAgfSkuYmluZCh0aGlzKTtcblxuICB2YXIgdHlwZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChzdHJpbmdPckFycmF5KS5tYXRjaCgvKFthLXpdKyldL2kpWzFdO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlIFwiU3RyaW5nXCI6XG4gICAgY2FzZSBcIkFycmF5XCI6XG4gICAgICByZXR1cm4gcHJvY2VlZCh0eXBlKTtcbiAgfVxufTtcblxuSFRNTEVsZW1lbnQucHJvdG90eXBlLmFkZENsYXNzID0gZnVuY3Rpb24gKHN0cmluZ09yQXJyYXkpIHtcbiAgaWYgKCF0aGlzKSByZXR1cm4gY29uc29sZS5lcnJvcihcIk5vIGVsZW1lbnQgZm91bmRcIik7XG4gIHZhciBwcm9jZWVkID0gZnVuY3Rpb24gcHJvY2VlZCh0eXBlKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlIFwiQXJyYXlcIjpcbiAgICAgICAgc3RyaW5nT3JBcnJheS5tYXAoYWRkKS5qb2luKFwiIFwiKTticmVhaztcbiAgICAgIGNhc2UgXCJTdHJpbmdcIjpcbiAgICAgICAgYWRkKHN0cmluZ09yQXJyYXkpO2JyZWFrO1xuICAgIH1cbiAgfTtcblxuICB2YXIgYWRkID0gKGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgdmFyIGFyciA9IHRoaXMuY2xhc3NOYW1lID8gdGhpcy5jbGFzc05hbWUuc3BsaXQoXCIgXCIpIDogW107XG4gICAgaWYgKGFyci5pbmRleE9mKHRleHQpICE9PSAtMSkgcmV0dXJuO1xuICAgIGFyci5wdXNoKHRleHQpO1xuICAgIHZhciBqb2luZWQgPSBhcnIuam9pbihcIiBcIik7XG4gICAgdGhpcy5jbGFzc05hbWUgPSBqb2luZWQ7XG4gIH0pLmJpbmQodGhpcyk7XG5cbiAgdmFyIHR5cGUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoc3RyaW5nT3JBcnJheSkubWF0Y2goLyhbYS16XSspXS9pKVsxXTtcbiAgcHJvY2VlZCh0eXBlKTtcbn07XG5cbkhUTUxFbGVtZW50LnByb3RvdHlwZS5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uIChzdHJpbmdPckFycmF5KSB7XG4gIGlmICghdGhpcykgcmV0dXJuIGNvbnNvbGUuZXJyb3IoXCJObyBlbGVtZW50IGZvdW5kXCIpO1xuICB2YXIgcHJvY2VlZCA9IGZ1bmN0aW9uIHByb2NlZWQodHlwZSkge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBcIkFycmF5XCI6XG4gICAgICAgIHN0cmluZ09yQXJyYXkubWFwKHJlbW92ZSkuam9pbihcIiBcIik7YnJlYWs7XG4gICAgICBjYXNlIFwiU3RyaW5nXCI6XG4gICAgICAgIHJlbW92ZShzdHJpbmdPckFycmF5KTticmVhaztcbiAgICB9XG4gIH07XG5cbiAgdmFyIHJlbW92ZSA9IChmdW5jdGlvbiAodGV4dCkge1xuICAgIHZhciBhcnIgPSB0aGlzLmNsYXNzTmFtZSA/IHRoaXMuY2xhc3NOYW1lLnNwbGl0KFwiIFwiKSA6IFtdO1xuICAgIHZhciBwbGFjZSA9IGFyci5pbmRleE9mKHRleHQpO1xuICAgIGlmIChwbGFjZSA8IDApIHJldHVybiB0aGlzLmNsYXNzTmFtZTtcbiAgICBhcnIuc3BsaWNlKHBsYWNlLCAxKTtcbiAgICB0aGlzLmNsYXNzTmFtZSA9IGFyci5qb2luKFwiIFwiKTtcbiAgfSkuYmluZCh0aGlzKTtcblxuICB2YXIgdHlwZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChzdHJpbmdPckFycmF5KS5tYXRjaCgvKFthLXpdKyldL2kpWzFdO1xuICBwcm9jZWVkKHR5cGUpO1xufTtcblxudmFyIGNvcHlPYmplY3QgPSBmdW5jdGlvbiBjb3B5T2JqZWN0KG9iaikge1xuICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShvYmopKTtcbn07XG5cbnZhciByZWFsVHlwZSA9IGZ1bmN0aW9uIHJlYWxUeXBlKGRhdGEpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChkYXRhKS5zcGxpdChcIiBcIikucG9wKCkucmVwbGFjZSgvLiQvLCBcIlwiKS50b0xvd2VyQ2FzZSgpO1xufTtcblxudmFyIHR5cGVFcnJvciA9IGZ1bmN0aW9uIHR5cGVFcnJvcih2YXJpYWJsZSwgZXhwZWN0ZWRUeXBlLCBkYXRhKSB7XG4gIGNvbnNvbGUuZXJyb3IoVHlwZUVycm9yKFwiRXhwZWN0ZWQgJ1wiICsgdmFyaWFibGUgKyBcIicgdG8gYmUgb2YgdHlwZSAnXCIgKyBleHBlY3RlZFR5cGUgKyBcIic7IGdvdCB0eXBlICdcIiArIHJlYWxUeXBlKGRhdGEpICsgXCInXCIpKTtcbn07XG5cbnZhciBjbGFzc0Vycm9yID0gZnVuY3Rpb24gY2xhc3NFcnJvcih2YXJpYWJsZSwgZXhwZWN0ZWRDbGFzcywgZGF0YSkge1xuICBjb25zb2xlLmVycm9yKFR5cGVFcnJvcihcIkV4cGVjdGVkICdcIiArIHZhcmlhYmxlICsgXCInIHRvIGJlIG9mIGNsYXNzICdcIiArIGV4cGVjdGVkQ2xhc3MgKyBcIic7IGdvdCB0eXBlICdcIiArIGRhdGEuY29uc3RydWN0b3IubmFtZSArIFwiJ1wiKSk7XG59O1xuXG52YXIgZm9vID0gXCJzdHJpbmdcIjtcbnZhciBnYW1lcGFkcyA9IHt9O1xudmFyIGNvbmZpZ3VyaW5nID0gZmFsc2U7XG52YXIga25vd25BeGlzID0gdW5kZWZpbmVkO1xudmFyIGNhbnZhc1NjYWxlID0gLjc7XG52YXIgY2FudmFzU2NhbGVNaW4gPSAuNjtcbnZhciBjYW52YXNTY2FsZU1heCA9IDE7XG52YXIgY2FudmFzU2NhbGVWYWx1ZSA9IC41O1xudmFyIGNhbnZhc0luZm8gPSB7XG4gIHdpZHRoOiAxOTIwICogKGNhbnZhc1NjYWxlICogY2FudmFzU2NhbGVWYWx1ZSksXG4gIGhlaWdodDogMTA4MCAqIChjYW52YXNTY2FsZSAqIGNhbnZhc1NjYWxlVmFsdWUpLFxuICBzdGFnZVdpZHRoOiAxMjAwXG59O1xudmFyIGlucHV0SW1hZ2VzID0ge307XG52YXIgcGxheWVycyA9IHtcbiAgcGxheWVyMTogbnVsbCxcbiAgcGxheWVyMjogbnVsbFxufTtcblxudmFyIHNwZWFrZXIgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgdm9pY2VzID0gdW5kZWZpbmVkLFxuICAgICAgdm9pY2UgPSB1bmRlZmluZWQ7XG4gIHNwZWVjaFN5bnRoZXNpcy5vbnZvaWNlc2NoYW5nZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdm9pY2VzID0gc3BlZWNoU3ludGhlc2lzLmdldFZvaWNlcygpO1xuICAgIHZvaWNlID0gdm9pY2VzWzEyXTtcbiAgICAvLyBjb25zb2xlLmxvZyhcImdvdCBteSB2b2ljZTpcIiwgdm9pY2UpO1xuICAgIG1zZy52b2ljZSA9IHZvaWNlO1xuICAgIG1zZy5waXRjaCA9IDA7XG4gIH07XG4gIHZhciBtc2cgPSBuZXcgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlKCk7XG4gIG1zZy52b2x1bWUgPSAuNTtcbiAgbXNnLnRleHQgPSBcIk9rYXkuIFRoaXMgaXMgYSB0ZXN0XCI7XG4gIGlmICh2b2ljZSkgbXNnLnZvaWNlID0gdm9pY2U7XG4gIGlmICh2b2ljZSkgY29uc29sZS5sb2codm9pY2UubmFtZSwgdm9pY2UubGFuZyk7XG4gIHJldHVybiB7XG4gICAgc3BlYWs6IGZ1bmN0aW9uIHNwZWFrKCkge1xuICAgICAgLy8gbXNnLnBpdGNoID0gTWF0aC5yYW5kb20oKSAqIDI7XG4gICAgICAvLyBpZihzcGVlY2hTeW50aGVzaXMuc3BlYWtpbmcpIHtcbiAgICAgIC8vIH1cbiAgICAgIHNwZWVjaFN5bnRoZXNpcy5jYW5jZWwoKTtcbiAgICAgIHNwZWVjaFN5bnRoZXNpcy5zcGVhayhtc2cpO1xuICAgIH0sXG4gICAgc2V0VGV4dDogZnVuY3Rpb24gc2V0VGV4dCh0ZXh0KSB7XG4gICAgICBtc2cudGV4dCA9IHRleHQgfHwgbXNnO1xuICAgIH0sXG4gICAgc2V0UGl0Y2g6IGZ1bmN0aW9uIHNldFBpdGNoKG51bSkge1xuICAgICAgaWYgKHR5cGVvZiBudW0gPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgbXNnLnBpdGNoID0gbnVtO1xuICAgICAgfVxuICAgIH0sXG4gICAgc2V0Vm9pY2U6IGZ1bmN0aW9uIHNldFZvaWNlKG51bSkge1xuICAgICAgaWYgKHZvaWNlcyAmJiB0eXBlb2YgbnVtID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHZvaWNlc1tudW1dKTtcbiAgICAgICAgdm9pY2UgPSB2b2ljZXNbbnVtXSB8fCB2b2ljZTtcbiAgICAgICAgaWYgKHZvaWNlICE9PSBtc2cudm9pY2UpIG1zZy52b2ljZSA9IHZvaWNlO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyh2b2ljZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xufSkoKTtcblxudmFyIGdmeERpc3BsYXkgPSBuZXcgTWFrZUNhbnZhcyhjYW52YXNJbmZvKTtcblxuLy8gY3JlYXRlIGlucHV0IGltYWdlc1xuW1wibHBcIiwgXCJtcFwiLCBcImhwXCIsIFwibG1ocFwiLCBcImxrXCIsIFwibWtcIiwgXCJoa1wiLCBcImxtaGtcIixcbi8vIFwiblwiLFxuXCJ1XCIsIFwidXJcIiwgXCJyXCIsIFwiZHJcIiwgXCJkXCIsIFwiZGxcIiwgXCJsXCIsIFwidWxcIl0ubWFwKGZ1bmN0aW9uIChpbnB1dCwgaW5kKSB7XG4gIHZhciBuYW1lID0gdW5kZWZpbmVkO1xuICBpZiAoaW5kID49IDgpIG5hbWUgPSBcInVcIjtcbiAgdmFyIGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7XG4gIHZhciBpbWdPYmogPSB7fTtcbiAgaW1nLmNsYXNzTmFtZSA9IFwiaW5wdXQtaW1nIFwiICsgaW5wdXQ7XG4gIGltZy5zcmMgPSBcImltYWdlcy9cIiArIChuYW1lIHx8IGlucHV0KSArIFwiLnBuZ1wiO1xuICBpbWdPYmouY2xhc3NOYW1lID0gXCJpbnB1dC1pbWcgXCIgKyBpbnB1dDtcbiAgaW1nT2JqLnNyYyA9IFwiaW1hZ2VzL1wiICsgKG5hbWUgfHwgaW5wdXQpICsgXCIucG5nXCI7XG4gIGlucHV0SW1hZ2VzW2lucHV0XSA9IGltZ09iajtcbiAgLy8gY29uc29sZS5sb2coaW5wdXQsIG5hbWUpO1xufSk7XG5cbnZhciBmcmFtZXNDb3VudGVkID0gMDtcbnZhciBiYWxsVG9wID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5zdGljayAuYmFsbFwiKTtcbnZhciBpbnB1dERpc3BsYXkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmlucHV0c1wiKTtcblxuLy8gY2xhc3MgUGFkXG52YXIgUGFkID0gZnVuY3Rpb24gUGFkKF9yZWYpIHtcbiAgdmFyIGlkID0gX3JlZi5pZDtcbiAgdmFyIG5hbWUgPSBfcmVmLm5hbWU7XG4gIHZhciBpbmRleCA9IF9yZWYuaW5kZXg7XG4gIHZhciBjb25maWd1cmF0aW9uID0gX3JlZi5jb25maWd1cmF0aW9uO1xuXG4gIHRoaXMubmFtZSA9IG5hbWU7XG4gIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgdGhpcy5jb25maWd1cmF0aW9uID0gY29uZmlndXJhdGlvbjtcbiAgdGhpcy5yZWNvcmRlZElucHV0cyA9IFtdO1xuICB0aGlzLm1heFJlY29yZGVkSW5wdXRzID0gNTA7XG4gIHRoaXMucmVhZENvdW50ID0gMDtcbiAgdGhpcy5tYXhSZWFkQ291bnQgPSAxMDtcbiAgdGhpcy5yZXRpcmVSZWNvcmRlZEZyYW1lVGltZSA9IDEwMDAgLyA2MCAqIDUwO1xuICB0aGlzLm5vSW5wdXRGcmFtZXMgPSAwO1xuICB0aGlzLm1heE5vSW5wdXRGcmFtZXMgPSAyNTtcbiAgdGhpcy5wbGF5ZXIgPSBudWxsO1xuICB0aGlzLmF4ZXMgPSB7XG4gICAgaW5kOiA5LFxuICAgIFwiMy4yOVwiOiBcIm5cIixcbiAgICBcIi0xLjAwXCI6IFwidVwiLFxuICAgIFwiLTAuNzFcIjogXCJ1clwiLFxuICAgIFwiLTAuNDNcIjogXCJyXCIsXG4gICAgXCItMC4xNFwiOiBcImRyXCIsXG4gICAgXCIwLjE0XCI6IFwiZFwiLFxuICAgIFwiMC40M1wiOiBcImRsXCIsXG4gICAgXCIwLjcxXCI6IFwibFwiLFxuICAgIFwiMS4wMFwiOiBcInVsXCIsXG4gICAgXCItMC4wM1wiOiBcIm5cIixcbiAgICBcIjEyLjAwXCI6IFwidVwiLFxuICAgIFwiMTIxNS4wMFwiOiBcInVyXCIsXG4gICAgXCIxNS4wMFwiOiBcInJcIixcbiAgICBcIjEzMTUuMDBcIjogXCJkclwiLFxuICAgIFwiMTMuMDBcIjogXCJkXCIsXG4gICAgXCIxMzE0LjAwXCI6IFwiZGxcIixcbiAgICBcIjE0LjAwXCI6IFwibFwiLFxuICAgIFwiMTIxNC4wMFwiOiBcInVsXCJcbiAgfTtcbn07XG5cbi8vIGNsYXNzIENvbnRyb2xsZXJzXG52YXIgQ29udHJvbGxlcnMgPSBmdW5jdGlvbiBDb250cm9sbGVycygpIHtcbiAgKGZ1bmN0aW9uIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuZ2FtZXBhZHMgPSB7fTtcbiAgICB0aGlzLmNvbmZpZ3VyaW5nID0ge307XG4gIH0pKCk7XG5cbiAgdmFyIG5vcm1hbGl6ZUlEID0gZnVuY3Rpb24gbm9ybWFsaXplSUQoaWQpIHtcbiAgICBpZiAocmVhbFR5cGUoZGF0YSkgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHR5cGVFcnJvcihcImlkXCIsIFwic3RyaW5nXCIsIGlkKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gaWQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9bXmEtejAtOVxcc10vZywgXCJcIikucmVwbGFjZSgvXFxzL2csIFwiLVwiKTtcbiAgfTtcblxuICB2YXIgYWRkUGFkID0gZnVuY3Rpb24gYWRkUGFkKGUpIHtcbiAgICAvLyBjb25zb2xlLmxvZyhlLmdhbWVwYWQpO1xuICAgIHZhciBuYW1lID0gXCJpXCIgKyBlLmdhbWVwYWQuaW5kZXggKyBcIi1cIiArIG5vcm1hbGl6ZUlEKGUuZ2FtZXBhZC5pZCk7XG4gICAgLy8gY29uc29sZS5sb2cobmFtZSk7XG4gICAgdGhpcy5nYW1lcGFkc1tuYW1lXSA9IG5ldyBQYWQoe1xuICAgICAgbmFtZTogbmFtZSxcbiAgICAgIGluZGV4OiBlLmdhbWVwYWQuaW5kZXgsXG4gICAgICBpZDogZS5nYW1lcGFkLmlkLFxuICAgICAgY29uZmlndXJhdGlvbjogZS5jb25maWd1cmF0aW9uXG4gICAgfSk7XG4gIH07XG5cbiAgdmFyIHJlbW92ZVBhZCA9IGZ1bmN0aW9uIHJlbW92ZVBhZChlKSB7XG4gICAgaWYgKHJlYWxUeXBlKGUpICE9PSBcIm9iamVjdFwiKSByZXR1cm4gdHlwZUVycm9yKFwiZVwiLCBcIm9iamVjdFwiLCBlKTtcbiAgICAvLyBjb25zb2xlLmxvZyhlLmdhbWVwYWQpO1xuICAgIHZhciBuYW1lID0gXCJpXCIgKyBlLmdhbWVwYWQuaW5kZXggKyBcIi1cIiArIG5vcm1hbGl6ZUlEKGUuZ2FtZXBhZC5pZCk7XG4gICAgZGVsZXRlIGdhbWVwYWRzW25hbWVdO1xuICB9O1xuXG4gIHZhciBnZXRQYWRzID0gZnVuY3Rpb24gZ2V0UGFkcygpIHtcbiAgICB2YXIgcGFkcyA9IG5hdmlnYXRvci5nZXRHYW1lcGFkcygpO1xuICAgIE9iamVjdC5rZXlzKHBhZHMpLm1hcChmdW5jdGlvbiAobnVtKSB7XG4gICAgICBpZiAocGFkc1tudW1dKSB7XG4gICAgICAgIHZhciBjb25maWd1cmF0aW9uID0gbnVsbDtcbiAgICAgICAgaWYgKHBhZHNbbnVtXS5tYXBwaW5nID09PSBcInN0YW5kYXJkXCIpIHtcbiAgICAgICAgICBjb25maWd1cmF0aW9uID0ge1xuICAgICAgICAgICAgXCIwXCI6IDEsIC8vIGxwXG4gICAgICAgICAgICBcIjFcIjogMiwgLy8gbGtcbiAgICAgICAgICAgIFwiMlwiOiAwIC8vIG1rXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgX25hbWUgPSBcImlcIiArIHBhZHNbbnVtXS5pbmRleCArIFwiLVwiICsgbm9ybWFsaXplSUQocGFkc1tudW1dLmlkKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkdhbWVwYWQgRm91bmQhXCIpO1xuICAgICAgICBpZiAoIWdhbWVwYWRzW19uYW1lXSkgYWRkUGFkKHtcbiAgICAgICAgICBnYW1lcGFkOiBwYWRzW251bV0sXG4gICAgICAgICAgY29uZmlndXJhdGlvbjogY29uZmlndXJhdGlvblxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn07XG5cbkNvbnRyb2xsZXJzLnByb3RvdHlwZS5zdGFydENvbmZpZ0J1dHRvbiA9IGZ1bmN0aW9uIChjb250cm9sbGVyTmFtZSwgYnRuKSB7XG4gIHRoaXMuY29uZmlndXJpbmdbY29udHJvbGxlck5hbWVdID0gYnRuO1xufTtcblxuQ29udHJvbGxlcnMucHJvdG90eXBlLnNldENvbmZpZ0J1dHRvbiA9IGZ1bmN0aW9uIChjb250cm9sbGVyTmFtZSwgYnRuKSB7XG4gIHZhciBtYXAgPSB7XG4gICAgbHA6IDAsXG4gICAgbXA6IDMsXG4gICAgaHA6IDUsXG4gICAgXCIzcFwiOiA0LFxuICAgIGxrOiAxLFxuICAgIG1rOiAyLFxuICAgIGhrOiA3LFxuICAgIFwiM2tcIjogNlxuICB9O1xuXG4gIGdhbWVwYWRzW25hbWVdLmNvbmZpZ3VyYXRpb25bYnRuXSA9IG1hcFt0aGlzLmNvbmZpZ3VyaW5nW2NvbnRyb2xsZXJOYW1lXV07XG4gIHRoaXMuY29uZmlndXJpbmdbY29udHJvbGxlck5hbWVdID0gbnVsbDtcbn07XG5cbkNvbnRyb2xsZXJzLnByb3RvdHlwZS5jaGVja1BhZCA9IGZ1bmN0aW9uIChwYWQpIHtcbiAgaWYgKCEocGFkIGluc3RhbmNlb2YgUGFkKSkge1xuICAgIHJldHVybiBjbGFzc0Vycm9yKFwicGFkXCIsIFwiUGFkXCIsIHBhZCk7XG4gIH1cbiAgLy8gY29uc3QgZ2FtZXBhZCA9IG5hdmlnYXRvci5nZXRHYW1lcGFkcygpW2dhbWVwYWRJbmRleF1cbiAgdmFyIGdhbWVwYWRJbmRleCA9IHBhZC5pbmRleDtcbiAgdmFyIGdhbWVwYWROYW1lID0gcGFkLm5hbWU7XG4gIC8vIGNvbnNvbGUubG9nKG5hdmlnYXRvci5nZXRHYW1lcGFkcygpW2dhbWVwYWRJbmRleF0sIGdhbWVwYWROYW1lKTtcbiAgcGFkLmRlcHJlc3NlZCA9IHBhZC5kZXByZXNzZWQgfHwge307XG4gIHZhciBkZXByZXNzZWQgPSBwYWQuZGVwcmVzc2VkO1xuICBwYWQudGVzdCA9IHBhZC50ZXN0IHx8IFtdO1xuXG4gIHZhciByZXR1cm5EYXRhID0ge307XG5cbiAgLy8gbWFpbiBsb29wXG4gIHZhciBnYW1lcGFkID0gbmF2aWdhdG9yLmdldEdhbWVwYWRzKClbZ2FtZXBhZEluZGV4XTtcbiAgLy8gaWYocHJpbWFyeUNvbnRyb2xsZXIoZ2FtZXBhZCkpIGNvbnNvbGUubG9nKGdhbWVwYWROYW1lKTsgZWxzZSByZXR1cm47XG4gIGlmICghcHJpbWFyeUNvbnRyb2xsZXIoZ2FtZXBhZCkpIHJldHVybjtcbiAgdmFyIG9uZVByZXNzID0ge30sXG4gICAgICBvbmVSZWxlYXNlID0ge307XG4gIGlmIChnYW1lcGFkKSBnYW1lcGFkLmJ1dHRvbnMubWFwKGZ1bmN0aW9uIChidG4sIGluZCkge1xuICAgIC8vIGNvbnNvbGUubG9nKGJ0bik7XG4gICAgaWYgKGJ0bi5wcmVzc2VkKSB7XG4gICAgICBpZiAoIWRlcHJlc3NlZFtpbmRdKSB7XG4gICAgICAgIG9uZVByZXNzW2luZF0gPSB0cnVlO1xuICAgICAgfVxuICAgICAgZGVwcmVzc2VkW2luZF0gPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZGVwcmVzc2VkW2luZF0pIG9uZVJlbGVhc2VbaW5kXSA9IHRydWU7XG4gICAgICBkZWxldGUgZGVwcmVzc2VkW2luZF07XG4gICAgfVxuICB9KTtcblxuICBpZiAoT2JqZWN0LmtleXMob25lUHJlc3MpLmxlbmd0aCA+IDApIHJldHVybkRhdGEub25lUHJlc3MgPSBvbmVQcmVzcztcbiAgaWYgKE9iamVjdC5rZXlzKGRlcHJlc3NlZCkubGVuZ3RoID4gMCkgcmV0dXJuRGF0YS5kZXByZXNzZWQgPSBkZXByZXNzZWQ7XG4gIC8vIGlmKE9iamVjdC5rZXlzKG9uZVJlbGVhc2UpLmxlbmd0aCA+IDApIHJldHVybkRhdGEub25lUmVsZWFzZSA9IG9uZVJlbGVhc2U7XG5cbiAgYnV0dG9uc1ByZXNzZWRPbmNlKG9uZVByZXNzKTtcbiAgYnV0dG9uc0FyZURlcHJlc3NlZEFuZEF4ZXMoZGVwcmVzc2VkLCBnYW1lcGFkLmF4ZXMpO1xuICBidXR0b25zUmVsZWFzZWRPbmNlKG9uZVJlbGVhc2UpO1xuICAvLyBlbmQgbG9vcFxuXG4gIGZ1bmN0aW9uIGJ1dHRvbnNQcmVzc2VkT25jZShidXR0b25zKSB7XG4gICAgYnJlYWtkb3duQnV0dG9uKGJ1dHRvbnMsIGZ1bmN0aW9uICh1c2VkQnV0dG9uKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZyhcInByZXNzZWRcIiwgdXNlZEJ1dHRvbik7XG4gICAgICAvLyBjb25zb2xlLmxvZyhidXR0b25zKTtcbiAgICAgIGlmICghcGFkLnBsYXllcikge1xuICAgICAgICBpZiAoIXBsYXllcnMucGxheWVyMSkge1xuICAgICAgICAgIHBsYXllcnMucGxheWVyMSA9IG5ldyBQbGF5ZXIoe1xuICAgICAgICAgICAgcGFkOiBwYWRcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBwYWQucGxheWVyID0gcGxheWVycy5wbGF5ZXIxO1xuICAgICAgICB9IGVsc2UgaWYgKCFwbGF5ZXJzLnBsYXllcjIpIHtcbiAgICAgICAgICBwbGF5ZXJzLnBsYXllcjIgPSBuZXcgUGxheWVyKHtcbiAgICAgICAgICAgIHBhZDogcGFkXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcGFkLnBsYXllciA9IHBsYXllcnMucGxheWVyMjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGNvbmZpZ3VyaW5nICE9PSBmYWxzZSkge1xuICAgICAgICBzZXRDb25maWcoZ2FtZXBhZE5hbWUsIHVzZWRCdXR0b24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaGlnaGxpZ2h0QnV0dG9uKHVzZWRCdXR0b24pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGJ1dHRvbnNBcmVEZXByZXNzZWRBbmRBeGVzKGJ1dHRvbnMsIGF4ZXMpIHtcbiAgICAvLyBjb25zb2xlLmxvZyhcInN0YXJ0XCIpO1xuICAgIHZhciBwYWRCdXR0b25zT2JqID0ge307XG4gICAgYnJlYWtkb3duQnV0dG9uKGJ1dHRvbnMsIGZ1bmN0aW9uICh1c2VkQnV0dG9uKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZyhcImRlcHJlc3NlZFwiLCB1c2VkQnV0dG9uLCBidXR0b25zKTtcbiAgICAgIGlmIChidXR0b25zW1wiMTJcIl0pIHBhZEJ1dHRvbnNPYmpbMTJdID0gMTI7XG4gICAgICBpZiAoYnV0dG9uc1tcIjE0XCJdKSBwYWRCdXR0b25zT2JqWzE0XSA9IDE0O1xuICAgICAgaWYgKGJ1dHRvbnNbXCIxM1wiXSkgcGFkQnV0dG9uc09ialsxM10gPSAxMztcbiAgICAgIGlmIChidXR0b25zW1wiMTVcIl0pIHBhZEJ1dHRvbnNPYmpbMTVdID0gMTU7XG4gICAgfSk7XG4gICAgcGFkQnV0dG9uc0FyciA9IE9iamVjdC5rZXlzKHBhZEJ1dHRvbnNPYmopO1xuICAgIC8vIGNvbnNvbGUubG9nKHBhcnNlSW50KHBhZEJ1dHRvbnNBcnIuam9pbihcIlwiKSkpO1xuICAgIGlmIChwYWRCdXR0b25zQXJyLmxlbmd0aCA+IDApIGF4aXNEYXRhKFtwYXJzZUludChwYWRCdXR0b25zQXJyLmpvaW4oXCJcIikpXSk7ZWxzZSBheGlzRGF0YShheGVzKTtcbiAgICAvLyBjb25zb2xlLmxvZyhcImVuZFwiKTtcbiAgfVxuICBmdW5jdGlvbiBidXR0b25zUmVsZWFzZWRPbmNlKGJ1dHRvbnMpIHtcbiAgICBicmVha2Rvd25CdXR0b24oYnV0dG9ucywgZnVuY3Rpb24gKHVzZWRCdXR0b24pIHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKFwicmVsZWFzZWRcIik7XG4gICAgICBoaWdobGlnaHRCdXR0b24odXNlZEJ1dHRvbiwgdHJ1ZSk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBicmVha2Rvd25CdXR0b24oYnV0dG9ucywgY2IpIHtcbiAgICBPYmplY3Qua2V5cyhidXR0b25zKS5tYXAoZnVuY3Rpb24gKGJ0bikge1xuICAgICAgdmFyIHVzZWRCdXR0b24gPSBnZXRCdXR0b24ocGFkLCBidG4pO1xuICAgICAgLy8gY29uc29sZS5sb2coY2hlY2tlZCwgdXNlZEJ1dHRvbik7XG4gICAgICAvLyBjb25zb2xlLmxvZyhidG4sIFwiKFwiICsgKHBhcnNlSW50KGJ0bikgKyAxKSArIFwiKVwiLCBcIkNvbmZpZzpcIiwgdXNlZEJ1dHRvbik7XG4gICAgICBjYih1c2VkQnV0dG9uKTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGF4aXNEYXRhKGF4ZXMpIHtcbiAgICAvLyBjb25zb2xlLmxvZyhheGVzKTtcbiAgICB2YXIgYXhQbHVzID0gYXhlcy5yZWR1Y2UoZnVuY3Rpb24gKG0sIG4pIHtcbiAgICAgIHJldHVybiBtICsgbjtcbiAgICB9KTtcbiAgICAvLyBjb25zb2xlLmxvZyhheFBsdXMpO1xuICAgIHZhciB2YWx1ZSA9IGF4ZXMubGVuZ3RoID09PSA0ID8gYXhQbHVzLnRvRml4ZWQoMikgOiBheGVzLnBvcCgpLnRvRml4ZWQoMik7XG4gICAgdmFyIGlucHV0ID0gZ2V0U3RpY2tJbnB1dCh2YWx1ZSkgfHwgXCJuXCI7XG4gICAgLy8gY29uc29sZS5sb2codmFsdWUpO1xuICAgIGlmIChpbnB1dCkgcmV0dXJuRGF0YS5heGlzID0gaW5wdXQ7XG4gICAgaWYgKGlucHV0ICYmIGJhbGxUb3AgJiYgIWJhbGxUb3AuaGFzQ2xhc3MoaW5wdXQpKSB7XG4gICAgICByZXR1cm5EYXRhLm9uZUF4aXMgPSBpbnB1dDtcbiAgICAgIC8vIGNvbnNvbGUubG9nKGlucHV0KTtcbiAgICAgIGJhbGxUb3AucmVtb3ZlQ2xhc3MoW1wiblwiLCBcInVcIiwgXCJ1clwiLCBcInJcIiwgXCJkclwiLCBcImRcIiwgXCJkbFwiLCBcImxcIiwgXCJ1bFwiXSk7XG4gICAgICAvLyBjb25zb2xlLmxvZyh2YWx1ZSwgaW5wdXQpO1xuICAgICAgYmFsbFRvcC5hZGRDbGFzcyhpbnB1dCk7XG4gICAgICAvLyBjb25zb2xlLmxvZyh2YWx1ZSwgZ2FtZXBhZHNbZ2FtZXBhZE5hbWVdLmF4ZXNbdmFsdWVdKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRTdGlja0lucHV0KHZhbHVlKSB7XG4gICAgcmV0dXJuIGdhbWVwYWRzW2dhbWVwYWROYW1lXS5heGVzW3ZhbHVlXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbnZlcnQoZGF0YSkge1xuICAgIHZhciBuZXdEYXRhID0ge1xuICAgICAgYXhpczogZGF0YS5heGlzXG4gICAgfTtcbiAgICBpZiAoZGF0YS5vbmVBeGlzKSBuZXdEYXRhLm9uZUF4aXMgPSBkYXRhLm9uZUF4aXM7XG4gICAgLy8gY29uc29sZS5sb2coZGF0YSk7XG4gICAgW1wib25lUHJlc3NcIiwgXCJkZXByZXNzZWRcIiwgXCJvbmVSZWxlYXNlXCJdLm1hcChmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgIHZhciBzdGF0ZURhdGEgPSBkYXRhW3N0YXRlXTtcbiAgICAgIGlmICghc3RhdGVEYXRhKSByZXR1cm47XG4gICAgICB2YXIgbmV3U3RhdGVEYXRhID0ge307XG4gICAgICBPYmplY3Qua2V5cyhzdGF0ZURhdGEpLm1hcChmdW5jdGlvbiAoYnRuKSB7XG4gICAgICAgIG5ld1N0YXRlRGF0YVtnZXRCdXR0b24ocGFkLCBidG4pXSA9IHRydWU7XG4gICAgICB9KTtcblxuICAgICAgbmV3RGF0YVtzdGF0ZV0gPSBuZXdTdGF0ZURhdGE7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbmV3RGF0YTtcbiAgfVxuXG4gIHJldHVybiBjb252ZXJ0KHJldHVybkRhdGEpO1xufTtcblxuQ29udHJvbGxlcnMucHJvdG90eXBlLmh1bWFuaXplQnV0dG9uID0gZnVuY3Rpb24gKGJ0bikge1xuICByZXR1cm4gcGFyc2VJbnQoYnRuKSArIDE7XG59O1xuXG5Db250cm9sbGVycy5wcm90b3R5cGUuZ2V0QnV0dG9uID0gZnVuY3Rpb24gKHBhZCwgYnRuKSB7XG4gIGlmICghKHBhZCBpbnN0YW5jZW9mIFBhZCkpIHJldHVybiBjbGFzc0Vycm9yKFwicGFkXCIsIFwiUGFkXCIsIHBhZCk7XG4gIGlmIChyZWFsVHlwZShidG4pICE9PSBcIm51bWJlclwiKSByZXR1cm4gdHlwZUVycm9yKFwiYnRuXCIsIFwibnVtYmVyXCIsIGJ0bik7XG5cbiAgLy8gdmFyIHZhbHVlID0gdGhpcy5nYW1lcGFkc1twYWQubmFtZV0uY29uZmlndXJhdGlvbltidG5dO1xuICB2YXIgdmFsdWUgPSB0aGlzLmdhbWVwYWRzW3BhZC5uYW1lXS5jb25maWd1cmF0aW9uW2J0bl07XG4gIHZhciByZXR1cm5WYWx1ZSA9IHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiA/IHBhcnNlSW50KHZhbHVlKSA6IHBhcnNlSW50KGJ0bik7XG4gIHJldHVybiByZXR1cm5WYWx1ZTtcbn07XG5cbkNvbnRyb2xsZXJzLnByb3RvdHlwZS5hZGRMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoKSB7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiZ2FtZXBhZGNvbm5lY3RlZFwiLCBmdW5jdGlvbiAoZSkge1xuICAgIGNvbnNvbGUubG9nKFwiR2FtZXBhZCBDb25uZWN0ZWQhXCIpO1xuICB9KTtcbiAgdGhpcy5hZGRQYWQoZSk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJnYW1lcGFkZGlzY29ubmVjdGVkXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgY29uc29sZS5sb2coXCJHYW1lcGFkIERpc2Nvbm5lY3RlZCFcIik7XG4gICAgdGhpcy5yZW1vdmVQYWQoZSk7XG4gIH0pO1xufTtcblxuQ29udHJvbGxlcnMucHJvdG90eXBlLmhpZ2hsaWdodEJ1dHRvbiA9IGZ1bmN0aW9uICh1c2VkQnV0dG9uLCByZWxlYXNlZCkge1xuICBpZiAocmVhbFR5cGUodXNlZEJ1dHRvbikgIT09IFwibnVtYmVyXCIpIHJldHVybiB0eXBlRXJyb3IoXCJ1c2VkQnV0dG9uXCIsIFwibnVtYmVyXCIsIHVzZWRCdXR0b24pO1xuICBpZiAocmVhbFR5cGUocmVsZWFzZWQpICE9PSBcImJvb2xlYW5cIikgcmV0dXJuIHR5cGVFcnJvcihcInJlbGVhc2VkXCIsIFwibnVtYmVyXCIsIHJlbGVhc2VkKTtcblxuICB2YXIgZWxlbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuYnRuLVwiICsgdGhpcy5odW1hbml6ZUJ1dHRvbih1c2VkQnV0dG9uKSk7XG4gIGlmICghZWxlbSkgcmV0dXJuO1xuICBpZiAocmVsZWFzZWQpIHtcbiAgICBlbGVtLnJlbW92ZUNsYXNzKFwicHJlc3NlZFwiKTtcbiAgfSBlbHNlIHtcbiAgICBlbGVtLmFkZENsYXNzKFwicHJlc3NlZFwiKTtcbiAgfVxufTtcblxuQ29udHJvbGxlcnMucHJvdG90eXBlLmNoZWNrUGFkID0gZnVuY3Rpb24gKHBhZEluZm8pIHtcbiAgLy8gdmFyIGdhbWVwYWQgPSBuYXZpZ2F0b3IuZ2V0R2FtZXBhZHMoKVtnYW1lcGFkSW5kZXhdXG4gIHZhciBnYW1lcGFkSW5kZXggPSBwYWRJbmZvLmluZGV4O1xuICB2YXIgZ2FtZXBhZE5hbWUgPSBwYWRJbmZvLm5hbWU7XG4gIC8vIGNvbnNvbGUubG9nKG5hdmlnYXRvci5nZXRHYW1lcGFkcygpW2dhbWVwYWRJbmRleF0sIGdhbWVwYWROYW1lKTtcbiAgcGFkSW5mby5kZXByZXNzZWQgPSBwYWRJbmZvLmRlcHJlc3NlZCB8fCB7fTtcbiAgdmFyIGRlcHJlc3NlZCA9IHBhZEluZm8uZGVwcmVzc2VkO1xuICBwYWRJbmZvLnRlc3QgPSBwYWRJbmZvLnRlc3QgfHwgW107XG5cbiAgdmFyIHJldHVybkRhdGEgPSB7fTtcblxuICAvLyBtYWluIGxvb3BcbiAgdmFyIGdhbWVwYWQgPSBuYXZpZ2F0b3IuZ2V0R2FtZXBhZHMoKVtnYW1lcGFkSW5kZXhdO1xuICAvLyBpZihwcmltYXJ5Q29udHJvbGxlcihnYW1lcGFkKSkgY29uc29sZS5sb2coZ2FtZXBhZE5hbWUpOyBlbHNlIHJldHVybjtcbiAgaWYgKCFwcmltYXJ5Q29udHJvbGxlcihnYW1lcGFkKSkgcmV0dXJuO1xuICB2YXIgb25lUHJlc3MgPSB7fSxcbiAgICAgIG9uZVJlbGVhc2UgPSB7fTtcbiAgaWYgKGdhbWVwYWQpIGdhbWVwYWQuYnV0dG9ucy5tYXAoZnVuY3Rpb24gKGJ0biwgaW5kKSB7XG4gICAgLy8gY29uc29sZS5sb2coYnRuKTtcbiAgICBpZiAoYnRuLnByZXNzZWQpIHtcbiAgICAgIGlmICghZGVwcmVzc2VkW2luZF0pIHtcbiAgICAgICAgb25lUHJlc3NbaW5kXSA9IHRydWU7XG4gICAgICB9XG4gICAgICBkZXByZXNzZWRbaW5kXSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChkZXByZXNzZWRbaW5kXSkgb25lUmVsZWFzZVtpbmRdID0gdHJ1ZTtcbiAgICAgIGRlbGV0ZSBkZXByZXNzZWRbaW5kXTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmIChPYmplY3Qua2V5cyhvbmVQcmVzcykubGVuZ3RoID4gMCkgcmV0dXJuRGF0YS5vbmVQcmVzcyA9IG9uZVByZXNzO1xuICBpZiAoT2JqZWN0LmtleXMoZGVwcmVzc2VkKS5sZW5ndGggPiAwKSByZXR1cm5EYXRhLmRlcHJlc3NlZCA9IGRlcHJlc3NlZDtcbiAgLy8gaWYoT2JqZWN0LmtleXMob25lUmVsZWFzZSkubGVuZ3RoID4gMCkgcmV0dXJuRGF0YS5vbmVSZWxlYXNlID0gb25lUmVsZWFzZTtcblxuICBidXR0b25zUHJlc3NlZE9uY2Uob25lUHJlc3MpO1xuICBidXR0b25zQXJlRGVwcmVzc2VkQW5kQXhlcyhkZXByZXNzZWQsIGdhbWVwYWQuYXhlcyk7XG4gIGJ1dHRvbnNSZWxlYXNlZE9uY2Uob25lUmVsZWFzZSk7XG4gIC8vIGVuZCBsb29wXG5cbiAgZnVuY3Rpb24gYnV0dG9uc1ByZXNzZWRPbmNlKGJ1dHRvbnMpIHtcbiAgICBicmVha2Rvd25CdXR0b24oYnV0dG9ucywgZnVuY3Rpb24gKHVzZWRCdXR0b24pIHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKFwicHJlc3NlZFwiLCB1c2VkQnV0dG9uKTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKGJ1dHRvbnMpO1xuICAgICAgaWYgKCFwYWRJbmZvLnBsYXllcikge1xuICAgICAgICBpZiAoIXBsYXllcnMucGxheWVyMSkge1xuICAgICAgICAgIHBsYXllcnMucGxheWVyMSA9IG5ldyBQbGF5ZXIoe1xuICAgICAgICAgICAgcGFkSW5mbzogcGFkSW5mb1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHBhZEluZm8ucGxheWVyID0gcGxheWVycy5wbGF5ZXIxO1xuICAgICAgICB9IGVsc2UgaWYgKCFwbGF5ZXJzLnBsYXllcjIpIHtcbiAgICAgICAgICBwbGF5ZXJzLnBsYXllcjIgPSBuZXcgUGxheWVyKHtcbiAgICAgICAgICAgIHBhZEluZm86IHBhZEluZm9cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBwYWRJbmZvLnBsYXllciA9IHBsYXllcnMucGxheWVyMjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGNvbmZpZ3VyaW5nICE9PSBmYWxzZSkge1xuICAgICAgICBzZXRDb25maWcoZ2FtZXBhZE5hbWUsIHVzZWRCdXR0b24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaGlnaGxpZ2h0QnV0dG9uKHVzZWRCdXR0b24pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGJ1dHRvbnNBcmVEZXByZXNzZWRBbmRBeGVzKGJ1dHRvbnMsIGF4ZXMpIHtcbiAgICAvLyBjb25zb2xlLmxvZyhcInN0YXJ0XCIpO1xuICAgIHZhciBwYWRCdXR0b25zT2JqID0ge307XG4gICAgYnJlYWtkb3duQnV0dG9uKGJ1dHRvbnMsIGZ1bmN0aW9uICh1c2VkQnV0dG9uKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZyhcImRlcHJlc3NlZFwiLCB1c2VkQnV0dG9uLCBidXR0b25zKTtcbiAgICAgIGlmIChidXR0b25zW1wiMTJcIl0pIHBhZEJ1dHRvbnNPYmpbMTJdID0gMTI7XG4gICAgICBpZiAoYnV0dG9uc1tcIjE0XCJdKSBwYWRCdXR0b25zT2JqWzE0XSA9IDE0O1xuICAgICAgaWYgKGJ1dHRvbnNbXCIxM1wiXSkgcGFkQnV0dG9uc09ialsxM10gPSAxMztcbiAgICAgIGlmIChidXR0b25zW1wiMTVcIl0pIHBhZEJ1dHRvbnNPYmpbMTVdID0gMTU7XG4gICAgfSk7XG4gICAgcGFkQnV0dG9uc0FyciA9IE9iamVjdC5rZXlzKHBhZEJ1dHRvbnNPYmopO1xuICAgIC8vIGNvbnNvbGUubG9nKHBhcnNlSW50KHBhZEJ1dHRvbnNBcnIuam9pbihcIlwiKSkpO1xuICAgIGlmIChwYWRCdXR0b25zQXJyLmxlbmd0aCA+IDApIGF4aXNEYXRhKFtwYXJzZUludChwYWRCdXR0b25zQXJyLmpvaW4oXCJcIikpXSk7ZWxzZSBheGlzRGF0YShheGVzKTtcbiAgICAvLyBjb25zb2xlLmxvZyhcImVuZFwiKTtcbiAgfVxuICBmdW5jdGlvbiBidXR0b25zUmVsZWFzZWRPbmNlKGJ1dHRvbnMpIHtcbiAgICBicmVha2Rvd25CdXR0b24oYnV0dG9ucywgZnVuY3Rpb24gKHVzZWRCdXR0b24pIHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKFwicmVsZWFzZWRcIik7XG4gICAgICBoaWdobGlnaHRCdXR0b24odXNlZEJ1dHRvbiwgdHJ1ZSk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBicmVha2Rvd25CdXR0b24oYnV0dG9ucywgY2IpIHtcbiAgICBPYmplY3Qua2V5cyhidXR0b25zKS5tYXAoZnVuY3Rpb24gKGJ0bikge1xuICAgICAgdmFyIHVzZWRCdXR0b24gPSBnZXRCdXR0b24ocGFkSW5mbywgYnRuKTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKGNoZWNrZWQsIHVzZWRCdXR0b24pO1xuICAgICAgLy8gY29uc29sZS5sb2coYnRuLCBcIihcIiArIChwYXJzZUludChidG4pICsgMSkgKyBcIilcIiwgXCJDb25maWc6XCIsIHVzZWRCdXR0b24pO1xuICAgICAgY2IodXNlZEJ1dHRvbik7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBheGlzRGF0YShheGVzKSB7XG4gICAgLy8gY29uc29sZS5sb2coYXhlcyk7XG4gICAgdmFyIGF4UGx1cyA9IGF4ZXMucmVkdWNlKGZ1bmN0aW9uIChtLCBuKSB7XG4gICAgICByZXR1cm4gbSArIG47XG4gICAgfSk7XG4gICAgLy8gY29uc29sZS5sb2coYXhQbHVzKTtcbiAgICB2YXIgdmFsdWUgPSBheGVzLmxlbmd0aCA9PT0gNCA/IGF4UGx1cy50b0ZpeGVkKDIpIDogYXhlcy5wb3AoKS50b0ZpeGVkKDIpO1xuICAgIHZhciBpbnB1dCA9IGdldFN0aWNrSW5wdXQodmFsdWUpIHx8IFwiblwiO1xuICAgIC8vIGNvbnNvbGUubG9nKHZhbHVlKTtcbiAgICBpZiAoaW5wdXQpIHJldHVybkRhdGEuYXhpcyA9IGlucHV0O1xuICAgIGlmIChpbnB1dCAmJiBiYWxsVG9wICYmICFiYWxsVG9wLmhhc0NsYXNzKGlucHV0KSkge1xuICAgICAgcmV0dXJuRGF0YS5vbmVBeGlzID0gaW5wdXQ7XG4gICAgICAvLyBjb25zb2xlLmxvZyhpbnB1dCk7XG4gICAgICBiYWxsVG9wLnJlbW92ZUNsYXNzKFtcIm5cIiwgXCJ1XCIsIFwidXJcIiwgXCJyXCIsIFwiZHJcIiwgXCJkXCIsIFwiZGxcIiwgXCJsXCIsIFwidWxcIl0pO1xuICAgICAgLy8gY29uc29sZS5sb2codmFsdWUsIGlucHV0KTtcbiAgICAgIGJhbGxUb3AuYWRkQ2xhc3MoaW5wdXQpO1xuICAgICAgLy8gY29uc29sZS5sb2codmFsdWUsIGdhbWVwYWRzW2dhbWVwYWROYW1lXS5heGVzW3ZhbHVlXSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0U3RpY2tJbnB1dCh2YWx1ZSkge1xuICAgIHJldHVybiBnYW1lcGFkc1tnYW1lcGFkTmFtZV0uYXhlc1t2YWx1ZV07XG4gIH1cblxuICBmdW5jdGlvbiBjb252ZXJ0KGRhdGEpIHtcbiAgICB2YXIgbmV3RGF0YSA9IHtcbiAgICAgIGF4aXM6IGRhdGEuYXhpc1xuICAgIH07XG4gICAgaWYgKGRhdGEub25lQXhpcykgbmV3RGF0YS5vbmVBeGlzID0gZGF0YS5vbmVBeGlzO1xuICAgIC8vIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgIFtcIm9uZVByZXNzXCIsIFwiZGVwcmVzc2VkXCIsIFwib25lUmVsZWFzZVwiXS5tYXAoZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICB2YXIgc3RhdGVEYXRhID0gZGF0YVtzdGF0ZV07XG4gICAgICBpZiAoIXN0YXRlRGF0YSkgcmV0dXJuO1xuICAgICAgdmFyIG5ld1N0YXRlRGF0YSA9IHt9O1xuICAgICAgT2JqZWN0LmtleXMoc3RhdGVEYXRhKS5tYXAoZnVuY3Rpb24gKGJ0bikge1xuICAgICAgICBuZXdTdGF0ZURhdGFbZ2V0QnV0dG9uKHBhZEluZm8sIGJ0bildID0gdHJ1ZTtcbiAgICAgIH0pO1xuXG4gICAgICBuZXdEYXRhW3N0YXRlXSA9IG5ld1N0YXRlRGF0YTtcbiAgICB9KTtcblxuICAgIHJldHVybiBuZXdEYXRhO1xuICB9XG5cbiAgcmV0dXJuIGNvbnZlcnQocmV0dXJuRGF0YSk7XG59O1xuXG5mdW5jdGlvbiBnZXRJbnB1dEltYWdlKGNvbmZpZ0J0bikge1xuICAvLyBjb25zb2xlLmxvZyhjb25maWdCdG4pO1xuICB2YXIgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcbiAgdmFyIGRhdGEgPSBnZXREYXRhKGNvbmZpZ0J0bik7XG4gIGlmIChkYXRhKSB7XG4gICAgaW1nLmNsYXNzTmFtZSA9IGRhdGEuY2xhc3NOYW1lO1xuICAgIGltZy5zcmMgPSBkYXRhLnNyYztcbiAgICByZXR1cm4gaW1nO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0RGF0YShjb25maWdCdG4pIHtcbiAgICBpZiAodHlwZW9mIGNvbmZpZ0J0biA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgLy8gY29uc29sZS5sb2coXCJheGlzXCIpO1xuICAgICAgLy8gY29uc29sZS5sb2coaW5wdXRJbWFnZXNbY29uZmlnQnRuXSk7XG4gICAgICByZXR1cm4gaW5wdXRJbWFnZXNbY29uZmlnQnRuXTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gY29uc29sZS5sb2coXCJidXR0b25cIik7XG4gICAgICBzd2l0Y2ggKGNvbmZpZ0J0bikge1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgcmV0dXJuIGlucHV0SW1hZ2VzW1wibHBcIl07XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICByZXR1cm4gaW5wdXRJbWFnZXNbXCJtcFwiXTtcbiAgICAgICAgY2FzZSA1OlxuICAgICAgICAgIHJldHVybiBpbnB1dEltYWdlc1tcImhwXCJdO1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgcmV0dXJuIGlucHV0SW1hZ2VzW1wibG1ocFwiXTtcblxuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgcmV0dXJuIGlucHV0SW1hZ2VzW1wibGtcIl07XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICByZXR1cm4gaW5wdXRJbWFnZXNbXCJta1wiXTtcbiAgICAgICAgY2FzZSA3OlxuICAgICAgICAgIHJldHVybiBpbnB1dEltYWdlc1tcImhrXCJdO1xuICAgICAgICBjYXNlIDY6XG4gICAgICAgICAgcmV0dXJuIGlucHV0SW1hZ2VzW1wibG1oa1wiXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLy8gY2xhc3MgR0ZYXG4vLyBjbGFzcyBHYW1lTG9vcFxuXG4vLyBzdGFydGVyXG4oZnVuY3Rpb24gKCkge1xuICAvLyBwb3B1bGF0ZUNoYXJhY3RlcnMoKTtcbiAgLy8gZ2V0UGFkcygpO1xuICAvLyBzZXRJbnRlcnZhbChnZXRQYWRzLCAxMDAwLzYwKTtcbiAgLy8gZ2FtZUxvb3AoKTtcbiAgLy8gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAvLyAgIC8vIGNvbnNvbGUubG9nKFwiRlBTOlwiLCBmcmFtZXNDb3VudGVkKTtcbiAgLy8gICBmcHMuaW5uZXJUZXh0ID0gZnJhbWVzQ291bnRlZDtcbiAgLy8gICBmcmFtZXNDb3VudGVkID0gMDtcbiAgLy8gfSwgMTAwMCk7XG59KSgpOyJdfQ==
