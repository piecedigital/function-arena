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
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9udm0vdjYuMTEuMy9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiZGlzdC9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcblxuSFRNTEVsZW1lbnQucHJvdG90eXBlLmhhc0NsYXNzID0gZnVuY3Rpb24gKHN0cmluZ09yQXJyYXkpIHtcbiAgaWYgKCF0aGlzKSByZXR1cm4gY29uc29sZS5lcnJvcihcIk5vIGVsZW1lbnQgZm91bmRcIik7XG4gIGlmICghdGhpcy5jbGFzc05hbWUpIHJldHVybiBmYWxzZTtcblxuICB2YXIgcHJvY2VlZCA9IGZ1bmN0aW9uIHByb2NlZWQodHlwZSkge1xuICAgIHZhciB5ZXMgPSBmYWxzZTtcblxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBcIkFycmF5XCI6XG4gICAgICAgIHllcyA9IHN0cmluZ09yQXJyYXkubWFwKGNoZWNrKSB8fCB5ZXM7YnJlYWs7XG4gICAgICBjYXNlIFwiU3RyaW5nXCI6XG4gICAgICAgIHllcyA9IGNoZWNrKHN0cmluZ09yQXJyYXkpO2JyZWFrO1xuICAgIH1cbiAgICByZXR1cm4geWVzO1xuICB9O1xuXG4gIHZhciBjaGVjayA9IChmdW5jdGlvbiAodGV4dCkge1xuICAgIHJldHVybiB0aGlzLmNsYXNzTmFtZS5zcGxpdChcIiBcIikuaW5kZXhPZih0ZXh0KSA+PSAwO1xuICB9KS5iaW5kKHRoaXMpO1xuXG4gIHZhciB0eXBlID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHN0cmluZ09yQXJyYXkpLm1hdGNoKC8oW2Etel0rKV0vaSlbMV07XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgXCJTdHJpbmdcIjpcbiAgICBjYXNlIFwiQXJyYXlcIjpcbiAgICAgIHJldHVybiBwcm9jZWVkKHR5cGUpO1xuICB9XG59O1xuXG5IVE1MRWxlbWVudC5wcm90b3R5cGUuYWRkQ2xhc3MgPSBmdW5jdGlvbiAoc3RyaW5nT3JBcnJheSkge1xuICBpZiAoIXRoaXMpIHJldHVybiBjb25zb2xlLmVycm9yKFwiTm8gZWxlbWVudCBmb3VuZFwiKTtcbiAgdmFyIHByb2NlZWQgPSBmdW5jdGlvbiBwcm9jZWVkKHR5cGUpIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgXCJBcnJheVwiOlxuICAgICAgICBzdHJpbmdPckFycmF5Lm1hcChhZGQpLmpvaW4oXCIgXCIpO2JyZWFrO1xuICAgICAgY2FzZSBcIlN0cmluZ1wiOlxuICAgICAgICBhZGQoc3RyaW5nT3JBcnJheSk7YnJlYWs7XG4gICAgfVxuICB9O1xuXG4gIHZhciBhZGQgPSAoZnVuY3Rpb24gKHRleHQpIHtcbiAgICB2YXIgYXJyID0gdGhpcy5jbGFzc05hbWUgPyB0aGlzLmNsYXNzTmFtZS5zcGxpdChcIiBcIikgOiBbXTtcbiAgICBpZiAoYXJyLmluZGV4T2YodGV4dCkgIT09IC0xKSByZXR1cm47XG4gICAgYXJyLnB1c2godGV4dCk7XG4gICAgdmFyIGpvaW5lZCA9IGFyci5qb2luKFwiIFwiKTtcbiAgICB0aGlzLmNsYXNzTmFtZSA9IGpvaW5lZDtcbiAgfSkuYmluZCh0aGlzKTtcblxuICB2YXIgdHlwZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChzdHJpbmdPckFycmF5KS5tYXRjaCgvKFthLXpdKyldL2kpWzFdO1xuICBwcm9jZWVkKHR5cGUpO1xufTtcblxuSFRNTEVsZW1lbnQucHJvdG90eXBlLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24gKHN0cmluZ09yQXJyYXkpIHtcbiAgaWYgKCF0aGlzKSByZXR1cm4gY29uc29sZS5lcnJvcihcIk5vIGVsZW1lbnQgZm91bmRcIik7XG4gIHZhciBwcm9jZWVkID0gZnVuY3Rpb24gcHJvY2VlZCh0eXBlKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlIFwiQXJyYXlcIjpcbiAgICAgICAgc3RyaW5nT3JBcnJheS5tYXAocmVtb3ZlKS5qb2luKFwiIFwiKTticmVhaztcbiAgICAgIGNhc2UgXCJTdHJpbmdcIjpcbiAgICAgICAgcmVtb3ZlKHN0cmluZ09yQXJyYXkpO2JyZWFrO1xuICAgIH1cbiAgfTtcblxuICB2YXIgcmVtb3ZlID0gKGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgdmFyIGFyciA9IHRoaXMuY2xhc3NOYW1lID8gdGhpcy5jbGFzc05hbWUuc3BsaXQoXCIgXCIpIDogW107XG4gICAgdmFyIHBsYWNlID0gYXJyLmluZGV4T2YodGV4dCk7XG4gICAgaWYgKHBsYWNlIDwgMCkgcmV0dXJuIHRoaXMuY2xhc3NOYW1lO1xuICAgIGFyci5zcGxpY2UocGxhY2UsIDEpO1xuICAgIHRoaXMuY2xhc3NOYW1lID0gYXJyLmpvaW4oXCIgXCIpO1xuICB9KS5iaW5kKHRoaXMpO1xuXG4gIHZhciB0eXBlID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHN0cmluZ09yQXJyYXkpLm1hdGNoKC8oW2Etel0rKV0vaSlbMV07XG4gIHByb2NlZWQodHlwZSk7XG59O1xuXG52YXIgY29weU9iamVjdCA9IGZ1bmN0aW9uIGNvcHlPYmplY3Qob2JqKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9iaikpO1xufTtcblxudmFyIHJlYWxUeXBlID0gZnVuY3Rpb24gcmVhbFR5cGUoZGF0YSkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGRhdGEpLnNwbGl0KFwiIFwiKS5wb3AoKS5yZXBsYWNlKC8uJC8sIFwiXCIpLnRvTG93ZXJDYXNlKCk7XG59O1xuXG52YXIgdHlwZUVycm9yID0gZnVuY3Rpb24gdHlwZUVycm9yKHZhcmlhYmxlLCBleHBlY3RlZFR5cGUsIGRhdGEpIHtcbiAgY29uc29sZS5lcnJvcihUeXBlRXJyb3IoXCJFeHBlY3RlZCAnXCIgKyB2YXJpYWJsZSArIFwiJyB0byBiZSBvZiB0eXBlICdcIiArIGV4cGVjdGVkVHlwZSArIFwiJzsgZ290IHR5cGUgJ1wiICsgcmVhbFR5cGUoZGF0YSkgKyBcIidcIikpO1xufTtcblxudmFyIGNsYXNzRXJyb3IgPSBmdW5jdGlvbiBjbGFzc0Vycm9yKHZhcmlhYmxlLCBleHBlY3RlZENsYXNzLCBkYXRhKSB7XG4gIGNvbnNvbGUuZXJyb3IoVHlwZUVycm9yKFwiRXhwZWN0ZWQgJ1wiICsgdmFyaWFibGUgKyBcIicgdG8gYmUgb2YgY2xhc3MgJ1wiICsgZXhwZWN0ZWRDbGFzcyArIFwiJzsgZ290IHR5cGUgJ1wiICsgZGF0YS5jb25zdHJ1Y3Rvci5uYW1lICsgXCInXCIpKTtcbn07XG5cbnZhciBmb28gPSBcInN0cmluZ1wiO1xudmFyIGdhbWVwYWRzID0ge307XG52YXIgY29uZmlndXJpbmcgPSBmYWxzZTtcbnZhciBrbm93bkF4aXMgPSB1bmRlZmluZWQ7XG52YXIgY2FudmFzU2NhbGUgPSAuNztcbnZhciBjYW52YXNTY2FsZU1pbiA9IC42O1xudmFyIGNhbnZhc1NjYWxlTWF4ID0gMTtcbnZhciBjYW52YXNTY2FsZVZhbHVlID0gLjU7XG52YXIgY2FudmFzSW5mbyA9IHtcbiAgd2lkdGg6IDE5MjAgKiAoY2FudmFzU2NhbGUgKiBjYW52YXNTY2FsZVZhbHVlKSxcbiAgaGVpZ2h0OiAxMDgwICogKGNhbnZhc1NjYWxlICogY2FudmFzU2NhbGVWYWx1ZSksXG4gIHN0YWdlV2lkdGg6IDEyMDBcbn07XG52YXIgaW5wdXRJbWFnZXMgPSB7fTtcbnZhciBwbGF5ZXJzID0ge1xuICBwbGF5ZXIxOiBudWxsLFxuICBwbGF5ZXIyOiBudWxsXG59O1xuXG4vLyBjbGFzcyBQYWRcbnZhciBQYWQgPSBmdW5jdGlvbiBQYWQoX3JlZikge1xuICB2YXIgaWQgPSBfcmVmLmlkO1xuICB2YXIgbmFtZSA9IF9yZWYubmFtZTtcbiAgdmFyIGluZGV4ID0gX3JlZi5pbmRleDtcbiAgdmFyIGNvbmZpZ3VyYXRpb24gPSBfcmVmLmNvbmZpZ3VyYXRpb247XG5cbiAgdGhpcy5uYW1lID0gbmFtZTtcbiAgdGhpcy5pbmRleCA9IGluZGV4O1xuICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBjb25maWd1cmF0aW9uO1xuICB0aGlzLnJlY29yZGVkSW5wdXRzID0gW107XG4gIHRoaXMubWF4UmVjb3JkZWRJbnB1dHMgPSA1MDtcbiAgdGhpcy5yZWFkQ291bnQgPSAwO1xuICB0aGlzLm1heFJlYWRDb3VudCA9IDEwO1xuICB0aGlzLnJldGlyZVJlY29yZGVkRnJhbWVUaW1lID0gMTAwMCAvIDYwICogNTA7XG4gIHRoaXMubm9JbnB1dEZyYW1lcyA9IDA7XG4gIHRoaXMubWF4Tm9JbnB1dEZyYW1lcyA9IDI1O1xuICB0aGlzLnBsYXllciA9IG51bGw7XG4gIHRoaXMuYXhlcyA9IHtcbiAgICBpbmQ6IDksXG4gICAgXCIzLjI5XCI6IFwiblwiLFxuICAgIFwiLTEuMDBcIjogXCJ1XCIsXG4gICAgXCItMC43MVwiOiBcInVyXCIsXG4gICAgXCItMC40M1wiOiBcInJcIixcbiAgICBcIi0wLjE0XCI6IFwiZHJcIixcbiAgICBcIjAuMTRcIjogXCJkXCIsXG4gICAgXCIwLjQzXCI6IFwiZGxcIixcbiAgICBcIjAuNzFcIjogXCJsXCIsXG4gICAgXCIxLjAwXCI6IFwidWxcIixcbiAgICBcIi0wLjAzXCI6IFwiblwiLFxuICAgIFwiMTIuMDBcIjogXCJ1XCIsXG4gICAgXCIxMjE1LjAwXCI6IFwidXJcIixcbiAgICBcIjE1LjAwXCI6IFwiclwiLFxuICAgIFwiMTMxNS4wMFwiOiBcImRyXCIsXG4gICAgXCIxMy4wMFwiOiBcImRcIixcbiAgICBcIjEzMTQuMDBcIjogXCJkbFwiLFxuICAgIFwiMTQuMDBcIjogXCJsXCIsXG4gICAgXCIxMjE0LjAwXCI6IFwidWxcIlxuICB9O1xufTtcblxuLy8gY2xhc3MgQ29udHJvbGxlcnNcbnZhciBDb250cm9sbGVycyA9IGZ1bmN0aW9uIENvbnRyb2xsZXJzKCkge1xuICAoZnVuY3Rpb24gY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5nYW1lcGFkcyA9IHt9O1xuICAgIHRoaXMuY29uZmlndXJpbmcgPSB7fTtcbiAgfSkoKTtcblxuICB2YXIgbm9ybWFsaXplSUQgPSBmdW5jdGlvbiBub3JtYWxpemVJRChpZCkge1xuICAgIGlmIChyZWFsVHlwZShkYXRhKSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgdHlwZUVycm9yKFwiaWRcIiwgXCJzdHJpbmdcIiwgaWQpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBpZC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1teYS16MC05XFxzXS9nLCBcIlwiKS5yZXBsYWNlKC9cXHMvZywgXCItXCIpO1xuICB9O1xuXG4gIHZhciBhZGRQYWQgPSBmdW5jdGlvbiBhZGRQYWQoZSkge1xuICAgIC8vIGNvbnNvbGUubG9nKGUuZ2FtZXBhZCk7XG4gICAgdmFyIG5hbWUgPSBcImlcIiArIGUuZ2FtZXBhZC5pbmRleCArIFwiLVwiICsgbm9ybWFsaXplSUQoZS5nYW1lcGFkLmlkKTtcbiAgICAvLyBjb25zb2xlLmxvZyhuYW1lKTtcbiAgICB0aGlzLmdhbWVwYWRzW25hbWVdID0gbmV3IFBhZCh7XG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgaW5kZXg6IGUuZ2FtZXBhZC5pbmRleCxcbiAgICAgIGlkOiBlLmdhbWVwYWQuaWQsXG4gICAgICBjb25maWd1cmF0aW9uOiBlLmNvbmZpZ3VyYXRpb25cbiAgICB9KTtcbiAgfTtcblxuICB2YXIgcmVtb3ZlUGFkID0gZnVuY3Rpb24gcmVtb3ZlUGFkKGUpIHtcbiAgICBpZiAocmVhbFR5cGUoZSkgIT09IFwib2JqZWN0XCIpIHJldHVybiB0eXBlRXJyb3IoXCJlXCIsIFwib2JqZWN0XCIsIGUpO1xuICAgIC8vIGNvbnNvbGUubG9nKGUuZ2FtZXBhZCk7XG4gICAgdmFyIG5hbWUgPSBcImlcIiArIGUuZ2FtZXBhZC5pbmRleCArIFwiLVwiICsgbm9ybWFsaXplSUQoZS5nYW1lcGFkLmlkKTtcbiAgICBkZWxldGUgZ2FtZXBhZHNbbmFtZV07XG4gIH07XG5cbiAgdmFyIGdldFBhZHMgPSBmdW5jdGlvbiBnZXRQYWRzKCkge1xuICAgIHZhciBwYWRzID0gbmF2aWdhdG9yLmdldEdhbWVwYWRzKCk7XG4gICAgT2JqZWN0LmtleXMocGFkcykubWFwKGZ1bmN0aW9uIChudW0pIHtcbiAgICAgIGlmIChwYWRzW251bV0pIHtcbiAgICAgICAgdmFyIGNvbmZpZ3VyYXRpb24gPSBudWxsO1xuICAgICAgICBpZiAocGFkc1tudW1dLm1hcHBpbmcgPT09IFwic3RhbmRhcmRcIikge1xuICAgICAgICAgIGNvbmZpZ3VyYXRpb24gPSB7XG4gICAgICAgICAgICBcIjBcIjogMSwgLy8gbHBcbiAgICAgICAgICAgIFwiMVwiOiAyLCAvLyBsa1xuICAgICAgICAgICAgXCIyXCI6IDAgLy8gbWtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBfbmFtZSA9IFwiaVwiICsgcGFkc1tudW1dLmluZGV4ICsgXCItXCIgKyBub3JtYWxpemVJRChwYWRzW251bV0uaWQpO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiR2FtZXBhZCBGb3VuZCFcIik7XG4gICAgICAgIGlmICghZ2FtZXBhZHNbX25hbWVdKSBhZGRQYWQoe1xuICAgICAgICAgIGdhbWVwYWQ6IHBhZHNbbnVtXSxcbiAgICAgICAgICBjb25maWd1cmF0aW9uOiBjb25maWd1cmF0aW9uXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xufTtcblxuQ29udHJvbGxlcnMucHJvdG90eXBlLnN0YXJ0Q29uZmlnQnV0dG9uID0gZnVuY3Rpb24gKGNvbnRyb2xsZXJOYW1lLCBidG4pIHtcbiAgdGhpcy5jb25maWd1cmluZ1tjb250cm9sbGVyTmFtZV0gPSBidG47XG59O1xuXG5Db250cm9sbGVycy5wcm90b3R5cGUuc2V0Q29uZmlnQnV0dG9uID0gZnVuY3Rpb24gKGNvbnRyb2xsZXJOYW1lLCBidG4pIHtcbiAgdmFyIG1hcCA9IHtcbiAgICBscDogMCxcbiAgICBtcDogMyxcbiAgICBocDogNSxcbiAgICBcIjNwXCI6IDQsXG4gICAgbGs6IDEsXG4gICAgbWs6IDIsXG4gICAgaGs6IDcsXG4gICAgXCIza1wiOiA2XG4gIH07XG5cbiAgZ2FtZXBhZHNbbmFtZV0uY29uZmlndXJhdGlvbltidG5dID0gbWFwW3RoaXMuY29uZmlndXJpbmdbY29udHJvbGxlck5hbWVdXTtcbiAgdGhpcy5jb25maWd1cmluZ1tjb250cm9sbGVyTmFtZV0gPSBudWxsO1xufTtcblxuQ29udHJvbGxlcnMucHJvdG90eXBlLmNoZWNrUGFkID0gZnVuY3Rpb24gKHBhZCkge1xuICBpZiAoIShwYWQgaW5zdGFuY2VvZiBQYWQpKSB7XG4gICAgcmV0dXJuIGNsYXNzRXJyb3IoXCJwYWRcIiwgXCJQYWRcIiwgcGFkKTtcbiAgfVxuICAvLyBjb25zdCBnYW1lcGFkID0gbmF2aWdhdG9yLmdldEdhbWVwYWRzKClbZ2FtZXBhZEluZGV4XVxuICB2YXIgZ2FtZXBhZEluZGV4ID0gcGFkLmluZGV4O1xuICB2YXIgZ2FtZXBhZE5hbWUgPSBwYWQubmFtZTtcbiAgLy8gY29uc29sZS5sb2cobmF2aWdhdG9yLmdldEdhbWVwYWRzKClbZ2FtZXBhZEluZGV4XSwgZ2FtZXBhZE5hbWUpO1xuICBwYWQuZGVwcmVzc2VkID0gcGFkLmRlcHJlc3NlZCB8fCB7fTtcbiAgdmFyIGRlcHJlc3NlZCA9IHBhZC5kZXByZXNzZWQ7XG4gIHBhZC50ZXN0ID0gcGFkLnRlc3QgfHwgW107XG5cbiAgdmFyIHJldHVybkRhdGEgPSB7fTtcblxuICAvLyBtYWluIGxvb3BcbiAgdmFyIGdhbWVwYWQgPSBuYXZpZ2F0b3IuZ2V0R2FtZXBhZHMoKVtnYW1lcGFkSW5kZXhdO1xuICAvLyBpZihwcmltYXJ5Q29udHJvbGxlcihnYW1lcGFkKSkgY29uc29sZS5sb2coZ2FtZXBhZE5hbWUpOyBlbHNlIHJldHVybjtcbiAgaWYgKCFwcmltYXJ5Q29udHJvbGxlcihnYW1lcGFkKSkgcmV0dXJuO1xuICB2YXIgb25lUHJlc3MgPSB7fSxcbiAgICAgIG9uZVJlbGVhc2UgPSB7fTtcbiAgaWYgKGdhbWVwYWQpIGdhbWVwYWQuYnV0dG9ucy5tYXAoZnVuY3Rpb24gKGJ0biwgaW5kKSB7XG4gICAgLy8gY29uc29sZS5sb2coYnRuKTtcbiAgICBpZiAoYnRuLnByZXNzZWQpIHtcbiAgICAgIGlmICghZGVwcmVzc2VkW2luZF0pIHtcbiAgICAgICAgb25lUHJlc3NbaW5kXSA9IHRydWU7XG4gICAgICB9XG4gICAgICBkZXByZXNzZWRbaW5kXSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChkZXByZXNzZWRbaW5kXSkgb25lUmVsZWFzZVtpbmRdID0gdHJ1ZTtcbiAgICAgIGRlbGV0ZSBkZXByZXNzZWRbaW5kXTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmIChPYmplY3Qua2V5cyhvbmVQcmVzcykubGVuZ3RoID4gMCkgcmV0dXJuRGF0YS5vbmVQcmVzcyA9IG9uZVByZXNzO1xuICBpZiAoT2JqZWN0LmtleXMoZGVwcmVzc2VkKS5sZW5ndGggPiAwKSByZXR1cm5EYXRhLmRlcHJlc3NlZCA9IGRlcHJlc3NlZDtcbiAgLy8gaWYoT2JqZWN0LmtleXMob25lUmVsZWFzZSkubGVuZ3RoID4gMCkgcmV0dXJuRGF0YS5vbmVSZWxlYXNlID0gb25lUmVsZWFzZTtcblxuICBidXR0b25zUHJlc3NlZE9uY2Uob25lUHJlc3MpO1xuICBidXR0b25zQXJlRGVwcmVzc2VkQW5kQXhlcyhkZXByZXNzZWQsIGdhbWVwYWQuYXhlcyk7XG4gIGJ1dHRvbnNSZWxlYXNlZE9uY2Uob25lUmVsZWFzZSk7XG4gIC8vIGVuZCBsb29wXG5cbiAgZnVuY3Rpb24gYnV0dG9uc1ByZXNzZWRPbmNlKGJ1dHRvbnMpIHtcbiAgICBicmVha2Rvd25CdXR0b24oYnV0dG9ucywgZnVuY3Rpb24gKHVzZWRCdXR0b24pIHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKFwicHJlc3NlZFwiLCB1c2VkQnV0dG9uKTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKGJ1dHRvbnMpO1xuICAgICAgaWYgKCFwYWQucGxheWVyKSB7XG4gICAgICAgIGlmICghcGxheWVycy5wbGF5ZXIxKSB7XG4gICAgICAgICAgcGxheWVycy5wbGF5ZXIxID0gbmV3IFBsYXllcih7XG4gICAgICAgICAgICBwYWQ6IHBhZFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHBhZC5wbGF5ZXIgPSBwbGF5ZXJzLnBsYXllcjE7XG4gICAgICAgIH0gZWxzZSBpZiAoIXBsYXllcnMucGxheWVyMikge1xuICAgICAgICAgIHBsYXllcnMucGxheWVyMiA9IG5ldyBQbGF5ZXIoe1xuICAgICAgICAgICAgcGFkOiBwYWRcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBwYWQucGxheWVyID0gcGxheWVycy5wbGF5ZXIyO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoY29uZmlndXJpbmcgIT09IGZhbHNlKSB7XG4gICAgICAgIHNldENvbmZpZyhnYW1lcGFkTmFtZSwgdXNlZEJ1dHRvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBoaWdobGlnaHRCdXR0b24odXNlZEJ1dHRvbik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gYnV0dG9uc0FyZURlcHJlc3NlZEFuZEF4ZXMoYnV0dG9ucywgYXhlcykge1xuICAgIC8vIGNvbnNvbGUubG9nKFwic3RhcnRcIik7XG4gICAgdmFyIHBhZEJ1dHRvbnNPYmogPSB7fTtcbiAgICBicmVha2Rvd25CdXR0b24oYnV0dG9ucywgZnVuY3Rpb24gKHVzZWRCdXR0b24pIHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKFwiZGVwcmVzc2VkXCIsIHVzZWRCdXR0b24sIGJ1dHRvbnMpO1xuICAgICAgaWYgKGJ1dHRvbnNbXCIxMlwiXSkgcGFkQnV0dG9uc09ialsxMl0gPSAxMjtcbiAgICAgIGlmIChidXR0b25zW1wiMTRcIl0pIHBhZEJ1dHRvbnNPYmpbMTRdID0gMTQ7XG4gICAgICBpZiAoYnV0dG9uc1tcIjEzXCJdKSBwYWRCdXR0b25zT2JqWzEzXSA9IDEzO1xuICAgICAgaWYgKGJ1dHRvbnNbXCIxNVwiXSkgcGFkQnV0dG9uc09ialsxNV0gPSAxNTtcbiAgICB9KTtcbiAgICBwYWRCdXR0b25zQXJyID0gT2JqZWN0LmtleXMocGFkQnV0dG9uc09iaik7XG4gICAgLy8gY29uc29sZS5sb2cocGFyc2VJbnQocGFkQnV0dG9uc0Fyci5qb2luKFwiXCIpKSk7XG4gICAgaWYgKHBhZEJ1dHRvbnNBcnIubGVuZ3RoID4gMCkgYXhpc0RhdGEoW3BhcnNlSW50KHBhZEJ1dHRvbnNBcnIuam9pbihcIlwiKSldKTtlbHNlIGF4aXNEYXRhKGF4ZXMpO1xuICAgIC8vIGNvbnNvbGUubG9nKFwiZW5kXCIpO1xuICB9XG4gIGZ1bmN0aW9uIGJ1dHRvbnNSZWxlYXNlZE9uY2UoYnV0dG9ucykge1xuICAgIGJyZWFrZG93bkJ1dHRvbihidXR0b25zLCBmdW5jdGlvbiAodXNlZEJ1dHRvbikge1xuICAgICAgLy8gY29uc29sZS5sb2coXCJyZWxlYXNlZFwiKTtcbiAgICAgIGhpZ2hsaWdodEJ1dHRvbih1c2VkQnV0dG9uLCB0cnVlKTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJyZWFrZG93bkJ1dHRvbihidXR0b25zLCBjYikge1xuICAgIE9iamVjdC5rZXlzKGJ1dHRvbnMpLm1hcChmdW5jdGlvbiAoYnRuKSB7XG4gICAgICB2YXIgdXNlZEJ1dHRvbiA9IGdldEJ1dHRvbihwYWQsIGJ0bik7XG4gICAgICAvLyBjb25zb2xlLmxvZyhjaGVja2VkLCB1c2VkQnV0dG9uKTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKGJ0biwgXCIoXCIgKyAocGFyc2VJbnQoYnRuKSArIDEpICsgXCIpXCIsIFwiQ29uZmlnOlwiLCB1c2VkQnV0dG9uKTtcbiAgICAgIGNiKHVzZWRCdXR0b24pO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gYXhpc0RhdGEoYXhlcykge1xuICAgIC8vIGNvbnNvbGUubG9nKGF4ZXMpO1xuICAgIHZhciBheFBsdXMgPSBheGVzLnJlZHVjZShmdW5jdGlvbiAobSwgbikge1xuICAgICAgcmV0dXJuIG0gKyBuO1xuICAgIH0pO1xuICAgIC8vIGNvbnNvbGUubG9nKGF4UGx1cyk7XG4gICAgdmFyIHZhbHVlID0gYXhlcy5sZW5ndGggPT09IDQgPyBheFBsdXMudG9GaXhlZCgyKSA6IGF4ZXMucG9wKCkudG9GaXhlZCgyKTtcbiAgICB2YXIgaW5wdXQgPSBnZXRTdGlja0lucHV0KHZhbHVlKSB8fCBcIm5cIjtcbiAgICAvLyBjb25zb2xlLmxvZyh2YWx1ZSk7XG4gICAgaWYgKGlucHV0KSByZXR1cm5EYXRhLmF4aXMgPSBpbnB1dDtcbiAgICBpZiAoaW5wdXQgJiYgYmFsbFRvcCAmJiAhYmFsbFRvcC5oYXNDbGFzcyhpbnB1dCkpIHtcbiAgICAgIHJldHVybkRhdGEub25lQXhpcyA9IGlucHV0O1xuICAgICAgLy8gY29uc29sZS5sb2coaW5wdXQpO1xuICAgICAgYmFsbFRvcC5yZW1vdmVDbGFzcyhbXCJuXCIsIFwidVwiLCBcInVyXCIsIFwiclwiLCBcImRyXCIsIFwiZFwiLCBcImRsXCIsIFwibFwiLCBcInVsXCJdKTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKHZhbHVlLCBpbnB1dCk7XG4gICAgICBiYWxsVG9wLmFkZENsYXNzKGlucHV0KTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKHZhbHVlLCBnYW1lcGFkc1tnYW1lcGFkTmFtZV0uYXhlc1t2YWx1ZV0pO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFN0aWNrSW5wdXQodmFsdWUpIHtcbiAgICByZXR1cm4gZ2FtZXBhZHNbZ2FtZXBhZE5hbWVdLmF4ZXNbdmFsdWVdO1xuICB9XG5cbiAgZnVuY3Rpb24gY29udmVydChkYXRhKSB7XG4gICAgdmFyIG5ld0RhdGEgPSB7XG4gICAgICBheGlzOiBkYXRhLmF4aXNcbiAgICB9O1xuICAgIGlmIChkYXRhLm9uZUF4aXMpIG5ld0RhdGEub25lQXhpcyA9IGRhdGEub25lQXhpcztcbiAgICAvLyBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICBbXCJvbmVQcmVzc1wiLCBcImRlcHJlc3NlZFwiLCBcIm9uZVJlbGVhc2VcIl0ubWFwKGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgdmFyIHN0YXRlRGF0YSA9IGRhdGFbc3RhdGVdO1xuICAgICAgaWYgKCFzdGF0ZURhdGEpIHJldHVybjtcbiAgICAgIHZhciBuZXdTdGF0ZURhdGEgPSB7fTtcbiAgICAgIE9iamVjdC5rZXlzKHN0YXRlRGF0YSkubWFwKGZ1bmN0aW9uIChidG4pIHtcbiAgICAgICAgbmV3U3RhdGVEYXRhW2dldEJ1dHRvbihwYWQsIGJ0bildID0gdHJ1ZTtcbiAgICAgIH0pO1xuXG4gICAgICBuZXdEYXRhW3N0YXRlXSA9IG5ld1N0YXRlRGF0YTtcbiAgICB9KTtcblxuICAgIHJldHVybiBuZXdEYXRhO1xuICB9XG5cbiAgcmV0dXJuIGNvbnZlcnQocmV0dXJuRGF0YSk7XG59O1xuXG5Db250cm9sbGVycy5wcm90b3R5cGUuaHVtYW5pemVCdXR0b24gPSBmdW5jdGlvbiAoYnRuKSB7XG4gIHJldHVybiBwYXJzZUludChidG4pICsgMTtcbn07Il19
