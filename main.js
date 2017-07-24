HTMLElement.prototype.hasClass = function(stringOrArray) {
  if(!this) return console.error("No element found");
  if(!this.className) return false;

  var proceed = function(type) {
    var yes = false;

    switch (type) {
      case "Array": yes = stringOrArray.map(check) || yes; break;
      case "String": yes = check(stringOrArray); break;
    }
    return yes;
  }

  var check = function(text) {
    return this.className.split(" ").indexOf(text) >= 0;
  }.bind(this);

  var type = Object.prototype.toString.call(stringOrArray).match(/([a-z]+)]/i)[1];
  switch (type) {
    case "String":
    case "Array":
      return proceed(type);
    break;
  }
}

HTMLElement.prototype.addClass = function(stringOrArray) {
  if(!this) return console.error("No element found");
  var proceed = function(type) {
    switch (type) {
      case "Array": stringOrArray.map(add).join(" "); break;
      case "String": add(stringOrArray); break;
    }
  }

  var add = function(text) {
    var arr = this.className ? this.className.split(" ") : [];
    if(arr.indexOf(text) !== -1) return;
    arr.push(text);
    var joined = arr.join(" ");
    this.className = joined;
  }.bind(this);

  var type = Object.prototype.toString.call(stringOrArray).match(/([a-z]+)]/i)[1];
  proceed(type);
}

HTMLElement.prototype.removeClass = function(stringOrArray) {
  if(!this) return console.error("No element found");
  var proceed = function(type) {
    switch (type) {
      case "Array": stringOrArray.map(remove).join(" "); break;
      case "String": remove(stringOrArray); break;
    }
  }

  var remove = function(text) {
    var arr = this.className ? this.className.split(" ") : [];
    var place = arr.indexOf(text);
    if(place < 0) return this.className;
    arr.splice(place, 1);
    this.className = arr.join(" ");
  }.bind(this);

  var type = Object.prototype.toString.call(stringOrArray).match(/([a-z]+)]/i)[1];
  proceed(type);
}

var realType = function (data) {
  return Object.prototype.toString.call(data).split(" ").pop().replace(/.$/, "").toLowerCase();
}

var gamepads = {};
var configuring = false;
var knownAxis;
var canvasInfo = {
  width: 600,
  height: 600 * (9/16),
  stageWidth: 1200
}
var inputImages = {};
var players = {
  player1: null,
  player2: null
};

var speaker = (function () {
  var voices, voice;
  speechSynthesis.onvoiceschanged = function () {
    voices = speechSynthesis.getVoices();
    voice = voices[12];
    // console.log("got my voice:", voice);
    msg.voice = voice;
    msg.pitch = 0;
  };
  var msg = new SpeechSynthesisUtterance();
  msg.text = "Okay. This is a test";
  if(voice) msg.voice = voice;
  if(voice) console.log(voice.name, voice.lang);
  return {
    speak: function () {
      // msg.pitch = Math.random() * 2;
      speechSynthesis.speak(msg)
    },
    setText: function (text) {
      msg.text = text || msg;
    },
    setPitch: function (num) {
      if(typeof num === "number") {
        msg.pitch = num;
      }
    },
    setVoice: function (num) {
      if(voices && typeof num === "number") {
        // console.log(voices[num]);
        voice = voices[num] || voice;
        if(voice !== msg.voice) msg.voice = voice;
        // console.log(voice);
      }
    }
  }
})();

// create input images
[
  "lp",
  "mp",
  "hp",
  "lmhp",
  "lk",
  "mk",
  "hk",
  "lmhk",
  // "n",
  "u",
  "ur",
  "r",
  "dr",
  "d",
  "dl",
  "l",
  "ul"
].map((input, ind) => {
  var name;
  if(ind >= 8) name = "u";
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

window.addEventListener("gamepadconnected", function(e) {
  console.log("Gamepad Connected!");
  addPad(e);
});

window.addEventListener("gamepaddisconnected", function(e) {
  console.log("Gamepad Disconnected!");
  removePad(e);
});

(function () {
  function getPads() {
    var pads = navigator.getGamepads();
    Object.keys(pads).map(function (num) {
      if(pads[num]) {
        var name = "i" + pads[num].index + "-" + normalizeID(pads[num].id);

        // console.log("Gamepad Found!");
        if(!gamepads[name]) addPad({
          gamepad: pads[num]
        });
      }
    });
  }
  getPads();
  setInterval(getPads, 1000/60);
  makeCanvas();
  gameLoop();
  setInterval(function () {
    // console.log("FPS:", framesCounted);
    fps.innerText = framesCounted;
    framesCounted = 0;
  }, 1000);
})()

function addPad(e) {
  // console.log(e.gamepad);
  var name = "i" + e.gamepad.index + "-" + normalizeID(e.gamepad.id);
  // console.log(name);
  gamepads[name] = {
    name: name,
    index: e.gamepad.index,
    configuration: {},
    recordedInputs: [],
    maxRecordedInputs: 50,
    readCount: 0,
    maxReadCount: 10,
    retireRecordedFrameTime: (1000 / 60) * 50,
    player: null,
    axes: {
      // ind: 9,
      // u: -1,
      // ur: -.71,
      // r: -.43,
      // dr: -.14,
      // d: .14,
      // dl: .43,
      // l: .71,
      // ul: 1,
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
    }
  };
  // checkPad(gamepads[name]);
  var opt = document.createElement("option");
  opt.dataset.name = name;
  opt.value = name;
  opt.innerText = e.gamepad.id;
  sticks.appendChild(opt);
}

function removePad(e) {
  // console.log(e.gamepad);
  var name = "i" + e.gamepad.index + "-" + normalizeID(e.gamepad.id);
  delete gamepads[name];
  sticks.removeChild(document.querySelector("[data-name=" + name + "]"))
}

function normalizeID(id) {
  return id.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s/g, "-");
}

function startConfig(index) {
  configuring = parseInt(index) - 1;
  var elem = document.querySelector(".btn-" + index);
  elem.addClass("configuring");
}

function setConfig(name, index) {
  console.log(configuring, index);
  // console.log(humanizeButton(configuring), humanizeButton(index));
  gamepads[name].configuration[index] = parseInt(configuring);
  // gamepads[name].configuration[configuring] = parseInt(index);
  var elem = document.querySelector(".btn-" + humanizeButton(configuring));
  elem.removeClass("configuring");
  configuring = false;
}

function primaryController(gamepad) {
  var name;
  if(gamepad) name = "i" + gamepad.index + "-" + normalizeID(gamepad.id);
  // console.log(sticks.value, name, sticks.value === name);
  return sticks.value === name;
}

function getButton(padInfo, btn) {
  // console.log(gamepads[padInfo.name].configuration, btn);
  var value = gamepads[padInfo.name].configuration[btn];
  // console.log(value);
  var returnValue = typeof value === "number" ? parseInt(value) : parseInt(btn);
  // console.log(returnValue);
  return returnValue;
}

function highlightButton(usedButton, released) {
  var elem = document.querySelector(".btn-" + humanizeButton(usedButton));
  // if(!elem) return console.error("no elem");
  if(!elem) return;
  // console.log(elem, humanizeButton(usedButton));
  if(released) {
    elem.removeClass("pressed");
  } else {
    elem.addClass("pressed");
  }
}

function humanizeButton(btn) {
  return parseInt(btn) + 1;
}

function checkPad(padInfo) {
  // var gamepad = navigator.getGamepads()[gamepadIndex]
  var gamepadIndex = padInfo.index;
  var gamepadName = padInfo.name;
  // console.log(navigator.getGamepads()[gamepadIndex], gamepadName);
  padInfo.depressed = padInfo.depressed || {};
  var depressed = padInfo.depressed;
  padInfo.test = padInfo.test || [];

  var returnData = {};

  // main loop
  var gamepad = navigator.getGamepads()[gamepadIndex]
  // if(primaryController(gamepad)) console.log(gamepadName); else return;
  if(!primaryController(gamepad)) return;
  var onePress = {}, oneRelease = {};
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
      if(!padInfo.player) {
        if(!players.player1) {
          players.player1 = new Player({
            padInfo
          });
          padInfo.player = players.player1;
        } else if(!players.player2) {
          players.player2 = new Player({
            padInfo
          });
          padInfo.player = players.player2;
        }
      }
      if(configuring !== false) {
        setConfig(gamepadName, Object.keys(buttons).slice(0, 1)[0]);
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
      var usedButton = getButton(padInfo, btn);
      // console.log(btn, "(" + (parseInt(btn) + 1) + ")", "Config:", usedButton);
      cb(usedButton);
    });
  }

  function axisData(axes) {
    // console.log(axes);
    var axPlus = axes.reduce((m,n) => m + n);
    // console.log(axPlus);
    var value = axes.length === 4 ? axPlus.toFixed(2) : axes.pop().toFixed(2);
    var input = getStickInput(value);
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

  return returnData;
}

function gameLoop() {
  var start = Date.now();
  Object.keys(gamepads).map(name => {
    var padInfo = gamepads[name];
    var returned = checkPad(padInfo);

    if(returned && Object.keys(returned).length > 0) {
      // console.log(returned);
      // makeInputDisplayElements(gamepads[name], returned);
      if(padInfo.player) padInfo.player.receiveInputData(gamepads[name], returned);
    }
  });
  var end = Date.now();
  var timeDiff = end-start;
  proctime.innerText = timeDiff;
  framesCounted++;
  setTimeout(gameLoop, (1000 / 60) - timeDiff);
}

function showReadCount(readCount, maxReadCount) {
  window["in-view-inputs"].style.height = (38 * (readCount > maxReadCount ? maxReadCount : readCount)) + "px";
}

function displayInputs(inputsArray, padInfo) {
  var parentElem = document.createElement("div");

  // if(inputsArray.length > 0) console.log(inputsArray);
  inputsArray.map(input => {
    if( isNaN(parseInt(input)) ) {
      // letter. axis input
      var elem = document.createElement("span");
      elem.className = "axis-input";
      elem.dataset.axis = input;
      var img = getInputImage(input);
      if(!img) return;
      elem.appendChild(img);
      parentElem.appendChild(elem);
    } else
    if(typeof parseInt(input) === "number") {
      // number. button input
      var elem = document.createElement("span");
      elem.className = "btn-input";
      elem.dataset.btn = input;
      var configBtn = getButton(padInfo, input);
      var img, cssBtn = document.createElement("span");
      cssBtn.className = "css-button";
      switch (parseInt(configBtn)) {
        case 8: cssBtn.innerText = "SELECT"; break; // select/back
        case 9: cssBtn.innerText = "START"; break; // start
        case 10: cssBtn.innerText = "HOME"; break; // home
        default: img = getInputImage(configBtn);
      }

      // console.log(img);
      elem.appendChild(img || cssBtn);
      parentElem.appendChild(elem);
    }
  });

  if(parentElem.innerHTML) {
    inputDisplay.appendChild(parentElem);
    // setTimeout(function () {
    //   inputDisplay.removeChild(parentElem);
    //   parentElem = null;
    // }, padInfo.retireRecordedFrameTime)
  }
}

function makeInputDisplayElements(padInfo, inputs) {
  var parentElem = document.createElement("div");


  if(inputs.depressed) {
    // if 3 punch macro is
    if(inputs.depressed[4]) {
      // check if individual punches are pressed
      if(
        inputs.depressed[0] &&
        inputs.depressed[3] &&
        inputs.depressed[5]
      ) {
        // delete the macro input
        if(inputs.onePress) delete inputs.onePress[4];
      } else {
        // add the individual inputs
        inputs.depressed[0] = true;
        inputs.depressed[3] = true;
        inputs.depressed[5] = true;
      }
    }

    // 3 kick macro
    if(inputs.depressed[6]) {
      if(
        inputs.depressed[1] &&
        inputs.depressed[2] &&
        inputs.depressed[7]
      ) {
        if(inputs.onePress) delete inputs.onePress[6];
      } else {
        inputs.depressed[1] = true;
        inputs.depressed[2] = true;
        inputs.depressed[7] = true;
      }
    }
  }
  // console.log(inputs);

  if(inputs.onePress) {
    if(inputs.onePress[4]) {
      inputs.onePress[0] = true;
      inputs.onePress[3] = true;
      inputs.onePress[5] = true;
      delete inputs.onePress[4];
    }
    if(inputs.onePress[6]) {
      inputs.onePress[1] = true;
      inputs.onePress[2] = true;
      inputs.onePress[7] = true;
      delete inputs.onePress[6];
    }
    // console.log(inputs.onePress);
    Object.keys(inputs.onePress).map(btn => {
      // if(inputs.onePress && inputs.onePress[btn]) return;

      var configBtn = getButton(padInfo, btn);

      // if(inputs.depressed[getButton(padInfo, 4)]) {
      //   switch (configBtn) {
      //     case 0:
      //     case 3:
      //     case 5:
      //       delete inputs.onePress[configBtn];
      //       return;
      //   }
      // }
      // if(inputs.depressed[getButton(padInfo, 6)]) {
      //   switch (configBtn) {
      //     case 1:
      //     case 2:
      //     case 7:
      //       delete inputs.onePress[configBtn];
      //       return;
      //   }
      // }
      var elem = document.createElement("span");
      elem.className = "btn-input";
      elem.dataset.btn = btn;
      var img = getInputImage(configBtn);

      // console.log(img);
      elem.appendChild(img);
      parentElem.appendChild(elem);
    });
  }
  // if(inputs.depressed) Object.keys(inputs.depressed).map(btn => {
  //   if(inputs.onePress && inputs.onePress[btn]) return;
  //
  //   var configBtn = getButton(padInfo, btn);
  //
  //   if(inputs.depressed[4]) {
  //     switch (configBtn) {
  //       case 0:
  //       case 3:
  //       case 5:
  //         return;
  //     }
  //   }
  //   if(inputs.depressed[6]) {
  //     switch (configBtn) {
  //       case 1:
  //       case 2:
  //       case 7:
  //         return;
  //     }
  //   }
  //   var elem = document.createElement("span");
  //   elem.className = "btn-input";
  //   elem.dataset.btn = btn;
  //   var img = getInputImage(configBtn);
  //
  //   // console.log(img);
  //   elem.appendChild(img);
  //   parentElem.appendChild(elem);
  // });

  if(inputs.onePress && Object.keys(inputs.onePress).length === 0) inputs.onePress = null;

  if(
    inputs.oneAxis === inputs.axis ||
    inputs.onePress
  ) {
    if(inputs.axis !== "n") {
      var elem = document.createElement("span");
      elem.className = "axis-input";
      elem.dataset.axis = inputs.axis;
      var img = getInputImage(inputs.axis);

      elem.appendChild(img);
      parentElem.appendChild(elem);
    }
  }

  if(parentElem.innerHTML) inputDisplay.appendChild(parentElem);
}

function getInputImage(configBtn) {
  // console.log(configBtn);
  var img = document.createElement("img");
  var data = getData(configBtn);
  if(data) {
    img.className = data.className;
    img.src = data.src;
    return img;
  }

  function getData(configBtn) {
    if(typeof configBtn === "string") {
      // console.log("axis");
      // console.log(inputImages[configBtn]);
      return inputImages[configBtn];
    } else {
      // console.log("button");
      switch (configBtn) {
        case 0: return inputImages["lp"];
        case 3: return inputImages["mp"];
        case 5: return inputImages["hp"];
        case 4: return inputImages["lmhp"];

        case 1: return inputImages["lk"];
        case 2: return inputImages["mk"];
        case 7: return inputImages["hk"];
        case 6: return inputImages["lmhk"];
      }
    }
  }
}

function makeCanvas() {
  var canvas = document.createElement("canvas");
  canvas.width = canvasInfo.width;
  canvas.height = canvasInfo.height;
  canvasInfo.ctx = canvas.getContext("2d");

  var cc = document.querySelector(".canvas-container");
  if(cc) {
    cc.appendChild(canvas);
  } else {
    console.error("cannot find canvas container");
  }
}

function setPuppet(charName) {
  var buttons = {
    punches: ["LP", "MP", "HP", "EX", "SUPER"],
    punchesNum: ["0", "3", "5", "0+3+5", "0+3", "3+5", "0+5"],
    kicks: ["LK", "MK", "HK", "EX", "SUPER"],
    kicksNum: ["1", "2", "7", "1+2+7", "1+2", "2+7", "1+7"]
  }
  var characters = {
    ryu: {
      inputs: {
        Z: {
          // pattern: "Z",
          dir: {
            F: "F"
          },
          btnNum: {
            F: buttons.punchesNum
          },
          displayName: {
            F: {
              norm: "Shoryuken",
              sup: "Shin Shoryuken",
            }
          }
        },
        QC: {
          dir: {
            B: "B",
            F: "F"
          },
          btnNum: {
            B: buttons.kicksNum,
            F: {
              both: true,
              punches: buttons.punchesNum,
              kicks: buttons.kicksNum
            }
          },
          displayName: {
            B: {
              norm: "Tatsumaki Senpukyaku",
            },
            F: {
              punches: {
                norm: "Hadouken",
                sup: "Shinku Hadouken"
              },
              kicks: {
                norm: "Joudan Sokutogeri",
              }
            }
          }
        }
      }
    }
  };
  switch (charName) {
    case "ryu":
      players.player1.setPlayerPuppet( /*new Character*/(characters[charName]) );
  }
}

function Player(data) {
  var constructor = function(data) {
    this.actionsArray = [
      // {
      //   name: "spinningPileDriver",
      //   input: [""]
      // },
      // {
      //   name: "dragonPunch",
      //   input: []
      // },
      // {
      //   name: "reverseDragonPunch",
      //   input: []
      // },
      // {
      //   name: "tatsu",
      //   input: []
      // }
    ];

    var actionVariants = [
      ["F", "SUPER", "0+3+5", 50],
      ["F", "EX", "0+3", 20],
      ["F", "EX", "3+5", 20],
      ["F", "EX", "0+5", 20],
      ["B", "SUPER", "0+3+5", 50],
      ["B", "EX", "0+3", 20],
      ["B", "EX", "3+5", 20],
      ["B", "EX", "0+5", 20],

      ["B", "LP", "0", 15],
      ["B", "MP", "3", 18],
      ["B", "HP", "5", 20],
      ["F", "LP", "0", 15],
      ["F", "MP", "3", 18],
      ["F", "HP", "5", 20],

      ["F", "SUPER", "1+2+7", 50],
      ["F", "EX", "1+2", 20],
      ["F", "EX", "2+7", 20],
      ["F", "EX", "1+7", 20],
      ["B", "SUPER", "1+2+7", 50],
      ["B", "EX", "1+2", 20],
      ["B", "EX", "2+7", 20],
      ["B", "EX", "1+7", 20],

      ["B", "LK", "1", 15],
      ["B", "MK", "2", 18],
      ["B", "HK", "7", 20],
      ["F", "LK", "1", 15],
      ["F", "MK", "2", 18],
      ["F", "HK", "7", 20],
    ];

    // add inputs
    // HCB & HCF
    // !!! null !!!
    // HCB & HCF
    actionVariants.map(([d, btn, btnNum, recovery]) => {
      var pattern = "HC";
      var input = ["f", "df", "d", "db", "b"];
      if(d === "F") input.reverse();
      this.actionsArray.push(
        {
          pattern,
          dir: d,
          btn,
          btnNum,
          name: pattern + d + btn,
          recovery,
          input: input.concat([btnNum])
        }
      );
      this.actionsArray.push(
        {
          pattern,
          dir: d,
          btn,
          btnNum,
          name: pattern + d + btn,
          recovery,
          input: input.concat([input.pop() + "+" + btnNum])
        }
      );
    });
    // ZB & ZF
    actionVariants.map(([d, btn, btnNum, recovery]) => {
      var pattern = "Z";
      var input = d === "F" ? ["f", "d", "df", "f"] : ["b", "d", "db", "b"];
      // with forward input
      this.actionsArray.push(
        {
          pattern,
          dir: d,
          btn,
          btnNum,
          name: pattern + d + btn,
          recovery,
          input: input.concat([btnNum])
        }
      );
      this.actionsArray.push(
        {
          pattern,
          dir: d,
          btn,
          btnNum,
          name: pattern + d + btn,
          recovery,
          input: input.concat([input.pop() + "+" + btnNum])
        }
      );
      // just down-forward input
      this.actionsArray.push(
        {
          pattern,
          dir: d,
          btn,
          btnNum,
          name: pattern + d + btn,
          recovery,
          input: input.concat([btnNum])
        }
      );
      this.actionsArray.push(
        {
          pattern,
          dir: d,
          btn,
          btnNum,
          name: pattern + d + btn,
          recovery,
          input: input.concat([input.pop() + "+" + btnNum])
        }
      );
    });
    // QCB & QCF
    actionVariants.map(([d, btn, btnNum, recovery]) => {
      var pattern = "QC";
      var input = d === "F" ? ["d", "df", "f"] : ["d", "db", "b"];
      this.actionsArray.push(
        {
          pattern,
          dir: d,
          btn,
          btnNum,
          name: pattern + d + btn,
          recovery,
          input: input.concat([btnNum])
        }
      );
      this.actionsArray.push(
        {
          pattern,
          dir: d,
          btn,
          btnNum,
          name: pattern + d + btn,
          recovery,
          input: input.concat([input.pop() + "+" + btnNum])
        }
      );
    });

    // console.log(this.actionsArray);

    // console.log("constructing");
    this.facing = "right";
    this.canTakeInput = true;
    this.padInfo = data.padInfo || null;
    // console.log(this);
    this.activeActionsArray = this.actionsArray;
  }.bind(this, data)();

  this.setActionableState = function(action, state) {
    switch (action) {
      case "input":
        [
          "canTakeInput",
          "recovery",
          "inputsToPurge",
        ].map(name => {
          // console.log(name, state[name], state[name] !== undefined);
          state[name] !== undefined ? this[name] = state[name] : null
        });
        break;
    }
  };

  this.changeFace = function() {
    // console.log("changing face", this.facing);
    this.facing = this.facing === "right" ? "left" : "right";
    facing.innerText = this.facing;
  }

  this.receiveInputData = function (padInfo, inputs) {
    if(!this.puppet) return console.warn("No puppet");
    if(this.recovery > 0) this.recovery--;
    // console.log(this.inputsToPurge);
    if(this.recovery === 1) {
      this.inputsToPurge.map((_, ind) => {
        var place = padInfo.recordedInputs.indexOf(this.inputsToPurge[ind]);
        // console.log(padInfo.recordedInputs.indexOf(this.inputsToPurge[ind]));
        if(place >= 0) padInfo.recordedInputs[place] = null;
      });
      this.inputsToPurge = null;
      // console.log(padInfo.recordedInputs);
    }
    // if(this.recovery) console.log(this.recovery);
    this.setActionableState("input", {
      canTakeInput: this.canTakeInput || this.recovery === 0,
      recovery: this.recovery
    });
    if(this.recovery === 0 || this.canTakeInput) this.polishInputData(padInfo, inputs);
  }

  this.polishInputData = function(padInfo, inputs) {
    // var parentElem = document.createElement("div");
    var parentArray = [];

    // console.log(inputs);
    if(inputs.depressed) {
      // if 3 punch macro is
      if(inputs.depressed[4]) {
        // check if individual punches are pressed
        if(
          inputs.depressed[0] &&
          inputs.depressed[3] &&
          inputs.depressed[5]
        ) {
          // delete the macro input
          if(inputs.onePress) delete inputs.onePress[4];
        } else {
          // add the individual inputs
          inputs.depressed[0] = true;
          inputs.depressed[3] = true;
          inputs.depressed[5] = true;
        }
      }

      // 3 kick macro
      if(inputs.depressed[6]) {
        if(
          inputs.depressed[1] &&
          inputs.depressed[2] &&
          inputs.depressed[7]
          ) {
          if(inputs.onePress) delete inputs.onePress[6];
        } else {
          inputs.depressed[1] = true;
          inputs.depressed[2] = true;
          inputs.depressed[7] = true;
        }
      }
    }

    if(inputs.onePress) {
      if(inputs.onePress[4]) {
        inputs.onePress[0] = true;
        inputs.onePress[3] = true;
        inputs.onePress[5] = true;
        delete inputs.onePress[4];
      }
      if(inputs.onePress[6]) {
        inputs.onePress[1] = true;
        inputs.onePress[2] = true;
        inputs.onePress[7] = true;
        delete inputs.onePress[6];
      }
      // console.log(inputs.onePress);
      Object.keys(inputs.onePress).map(btn => {
        // if(inputs.onePress && inputs.onePress[btn]) return;

        // var configBtn = getButton(padInfo, btn);

        // if(inputs.depressed[getButton(padInfo, 4)]) {
        //   switch (configBtn) {
        //     case 0:
        //     case 3:
        //     case 5:
        //       delete inputs.onePress[configBtn];
        //       return;
        //   }
        // }
        // if(inputs.depressed[getButton(padInfo, 6)]) {
        //   switch (configBtn) {
        //     case 1:
        //     case 2:
        //     case 7:
        //       delete inputs.onePress[configBtn];
        //       return;
        //   }
        // }
        // var elem = document.createElement("span");
        // elem.className = "btn-input";
        // elem.dataset.btn = btn;
        // var img = getInputImage(configBtn);
        //
        // // console.log(img);
        // elem.appendChild(img);
        // parentElem.appendChild(elem);

        // parentArray.push(btn);
        parentArray.push(getButton(padInfo, btn).toString());
      });
    }
    // if(inputs.depressed) Object.keys(inputs.depressed).map(btn => {
      //   if(inputs.onePress && inputs.onePress[btn]) return;
      //
      //   var configBtn = getButton(padInfo, btn);
      //
      //   if(inputs.depressed[4]) {
      //     switch (configBtn) {
      //       case 0:
      //       case 3:
      //       case 5:
      //         return;
      //     }
      //   }
      //   if(inputs.depressed[6]) {
      //     switch (configBtn) {
      //       case 1:
      //       case 2:
      //       case 7:
      //         return;
      //     }
      //   }
      //   var elem = document.createElement("span");
      //   elem.className = "btn-input";
      //   elem.dataset.btn = btn;
      //   var img = getInputImage(configBtn);
      //
      //   // console.log(img);
      //   elem.appendChild(img);
      //   parentElem.appendChild(elem);
      // });

    if(inputs.onePress && Object.keys(inputs.onePress).length === 0) inputs.onePress = null;

    if(
      inputs.oneAxis === inputs.axis ||
      inputs.onePress
    ) {
      if(inputs.axis !== "n") {
        // var elem = document.createElement("span");
        // elem.className = "axis-input";
        // elem.dataset.axis = inputs.axis;
        // var img = getInputImage(inputs.axis);
        //
        // elem.appendChild(img);
        // parentElem.appendChild(elem);
        parentArray.unshift(inputs.axis);
      }
    }

    // if(parentElem.innerHTML) inputDisplay.appendChild(parentElem);
    if(parentArray.length > 0) {
      padInfo.recordedInputs.push(parentArray);
      if(padInfo.recordedInputs.length > padInfo.maxRecordedInputs) padInfo.recordedInputs.shift();
      padInfo.readCount++;
      showReadCount(padInfo.readCount, padInfo.maxReadCount);
      setTimeout(function () {
        var index = padInfo.recordedInputs.indexOf(parentArray);
        if(index >= 0) padInfo.recordedInputs[index] = null;
        padInfo.readCount--;
        if(padInfo.readCount < 0) padInfo.readCount = 0;
        showReadCount(padInfo.readCount, padInfo.maxReadCount);
      }, padInfo.retireRecordedFrameTime);
    }
    displayInputs(parentArray, padInfo);
    this.captureSpecialMove(padInfo);
  }

  this.captureSpecialMove = function(padInfo) {
    // this creates an array which basically represets directions
    // the first index is the left, and the second index is the right
    // that means that if the player is facing right "dr" = `d${dir[1]}` = "df" (down-forward)
    // vice versa, if the player is facing left "dr" = `d${dir[0]}` = "db" (down-back)
    var dir = this.facing === "right" ? ["b", "f"] : ["f", "b"];

    this.activeActionsArray.map(action => {
      if(!this.canTakeInput) return;
      if(padInfo.recordedInputs.length >= action.input.length) {
        var record = padInfo.recordedInputs;

        var whatIwant = JSON.parse(JSON.stringify(action.input));

        // pick the higest number to read the inputs
        // console.log(padInfo.readCount, whatIwant.length, padInfo.readCount < whatIwant.length);
        var read = padInfo.readCount < whatIwant.length ? padInfo.readCount : whatIwant.length;
        // var read = whatIwant.length;
        var whatImWorkingWith = record.slice((record.length-1) - (read-1))
        // console.log(whatImWorkingWith);

        var whatImatched = [];

        for(ind = 0; ind < whatImWorkingWith.length; ind++) {
          var inputs = whatImWorkingWith[ind];
          if(inputs) {
            // this is where it makes use of the "dir" variable, changing the inputs to represent faces rather than
            // console.log(inputs);
            var alteredInputs = inputs.map(input => {
              if(input.match("r")) {
                input = input.replace("r", dir[1])
              } else if(input.match("l")){
                input = input.replace("l", dir[0])
              }
              return input;
            });

            var place = -1;
            // console.log(whatImWorkingWith,whatIwant[ind]);
            if(!whatIwant[ind]) continue;
            if(whatIwant[ind].match("\\+")) {
              var split = whatIwant[ind].split("+");
              // console.log(alteredInputs, split);
              split.map(input => {
                place = alteredInputs.indexOf(input);
                // console.log(input, place, alteredInputs);
                if(place >= 0) whatImatched.push(input);
              });
              whatIwant[ind] = split.shift();
              whatIwant = whatIwant.concat(split);
            } else {
              place = alteredInputs.indexOf(whatIwant[ind]);
              if(place >= 0) whatImatched.push(whatIwant[ind]);
            }
          }
        };

        // console.log("what i got", whatImWorkingWith);
        // console.log("what I matched", whatImatched);
        // console.log("what I want", whatIwant);
        // console.log(whatImatched.join(""), whatIwant.join("").replace("+", ""));
        var whatImatchedJoined = whatImatched.join("");
        var whatIwantJoined = whatIwant.join("").replace("+", "");
        var whatImatchedIsWhatIwant = whatImatchedJoined === whatIwantJoined;
        if(whatImatchedIsWhatIwant) {
          var text = action.displayName ? action.btn + " " + action.displayName : action.name;
          speaker.setText(text);
          console.log("what I matched is what I want", whatImatchedIsWhatIwant, text, whatImatchedJoined, whatIwantJoined);
          speaker.speak();
          this.setActionableState("input", {
            canTakeInput: false,
            recovery: action.recovery,
            inputsToPurge: whatImWorkingWith.map((_, ind) => record[record.length-(whatImWorkingWith.length-ind)])
          });
        }
      }
    });
  }

  this.setPlayerPuppet = function(puppet) {
    this.puppet = puppet;
    // console.log(this.puppet);
    // console.log("length of current actions array:", this.activeActionsArray.length);
    var newActionsArray = [];
    this.actionsArray.map(input => {
      var willAdd = true;

      var puppetInputs = this.puppet.inputs;
      // a puppet(character) specific patter will be the key on the character data
      // this patter is used to capture the puppet's moves
      var move = puppetInputs[input.pattern];
      var keysToCheck = [
        // "pattern",
        "dir",
        "btnNum"
      ];

      // if the move(matched by patter) exist
      var both = false, buttonActions;
      if(move) {
        keysToCheck.map(key => {
          if(!willAdd) return;
          var place;
          // console.log("---");
          // console.log(key);
          // console.log(input.dir);
          // console.log(move);
          // console.log(move[key]);
          // console.log(move[key][input.dir]);
          if(move[key]) {
            // we'll check the puppet's inputs for these keys
            // console.log(key, move[key]);
            if(realType(move[key]) === "object") {
              if(realType(move[key][input.dir]) === "object") {
                if(move[key][input.dir].both) {
                  both = true;
                  if(input.btnNum.match(/[035]/)) {
                    buttonActions = "punches";
                  } else {
                    buttonActions = "kicks";
                  }
                  checkFault(move[key][input.dir][buttonActions]);
                }
              } else {
                checkFault(move[key][input.dir]);
              }
              function checkFault(data) {
                if(realType(data) === "array") {
                  place = data.indexOf(input[key]);

                  if( place < 0 ) {
                    // console.log(input);
                    // console.log("wont add", data, input[key], place);
                    willAdd = false;
                    place = null;
                  }
                } else {
                  if( data !== input[key] ) {
                    // console.log("wont add", data, input[key]);
                    willAdd = false;
                  }
                }
              }
            } else {
              console.error("format error: not type object. found type", realType(move[key]));
            }
          } else {
            console.log("No key:", key, move, move[key]);
          }
        });
      } else {
        // if the move(matched by patter) doesn't exist
        return;
      }

      var moveType = input.btn === "SUPER" ? "sup" : "norm";

      if(willAdd) {
        var displayName = both ? move.displayName[input.dir][buttonActions][moveType] : move.displayName[input.dir][moveType];
        if(!displayName) return; // no add
        // console.log(input);
        newActionsArray.push(Object.assign(input, {
          displayName,
          recover: move.recovery || input.recovery
        }));
      }

    });
    console.log("length of new actions array:", newActionsArray.length);
    this.activeActionsArray = newActionsArray;
  }

  facechange.addEventListener("click", this.changeFace.bind(this));
}
