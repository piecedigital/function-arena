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
var canvasScale = .7;
var canvasScaleMin = .6;
var canvasScaleMax = 1;
var canvasScaleValue = .5;
var canvasInfo = {
  width: 1920 * (canvasScale * canvasScaleValue),
  height: 1080 * (canvasScale * canvasScaleValue),
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
      if(speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
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

var gfxDisplay = new MakeCanvas(canvasInfo);

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
  populateCharacters();
  getPads();
  setInterval(getPads, 1000/60);
  gameLoop();
  setInterval(function () {
    // console.log("FPS:", framesCounted);
    fps.innerText = framesCounted;
    framesCounted = 0;
  }, 1000);
})()

function getCharacters() {
  var buttons = {
    punches: ["LP", "MP", "HP", "EX", "SUPER"],
    punchesNum: ["0", "3", "5", "0+3+5", "0+3", "3+5", "0+5"],
    kicks: ["LK", "MK", "HK", "EX", "SUPER"],
    kicksNum: ["1", "2", "7", "1+2+7", "1+2", "2+7", "1+7"]
  }
  return {
    ryu: {
      specials: {
        Z: {
          dir: {
            F: "F"
          },
          btnNum: {
            F: buttons.punchesNum
          },
          moveData: {
            F: {
              norm: {
                displayName: "Shoryuken",
                frameData: {
                  SU: 4,
                  A: 3,
                  R: 34
                },
                func: function() { console.log("performing move:", this.displayName); },
              },
              ex: {
                displayName: "Shoryuken",
                frameData: {
                  SU: 4,
                  A: 3,
                  R: 20
                },
                func: function() { console.log("performing move:", "EX", this.displayName); },
              },
              sup: {
                displayName: "Shin Shoryuken",
                frameData: {
                  SU: 3,
                  A: 3,
                  R: 50
                },
                func: function() { console.log("performing move:", this.displayName); },
              },
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
          moveData: {
            B: {
              norm: {
                displayName: "Tatsumaki Senpukyaku",
                frameData: {
                  SU: 5,
                  A: 5,
                  R: 30
                },
                func: function() { console.log("performing move:", this.displayName); },
              },
              ex: {
                displayName: "Tatsumaki Senpukyaku",
                frameData: {
                  SU: 5,
                  A: 5,
                  R: 30
                },
                func: function() { console.log("performing move:", "EX", this.displayName); },
              }
            },
            F: {
              punches: {
                norm: {
                  displayName: "Hadouken",
                  frameData: {
                    SU: 5,
                    A: 5,
                    R: 30
                  },
                  func: function() { console.log("performing move:", this.displayName); },
                },
                ex: {
                  displayName: "Hadouken",
                  frameData: {
                    SU: 5,
                    A: 5,
                    R: 30
                  },
                  func: function() { console.log("performing move:", "EX", this.displayName); },
                },
                sup: {
                  displayName: "Shinku Hadouken",
                  frameData: {
                    SU: 5,
                    A: 5,
                    R: 30
                  },
                  func: function() { console.log("performing move:", this.displayName); }
                }
              },
              kicks: {
                norm: {
                  displayName: "Joudan Sokutogeri",
                  frameData: {
                    SU: 5,
                    A: 5,
                    R: 30
                  },
                  func: function() { console.log("performing move:", this.displayName); },
                },
                ex: {
                  displayName: "Joudan Sokutogeri",
                  frameData: {
                    SU: 5,
                    A: 5,
                    R: 30
                  },
                  func: function() { console.log("performing move:", "EX", this.displayName); },
                }
              }
            }
          }
        }
      },
      commandNormals: {
        F: {
          // LP: {
          //   displayName: "forward LP",
          //   frameData: {
          //     SU: 3,
          //     A: 3,
          //     R: 11
          //   },
          //   func: function () {
          //     console.log("performing command normal:", this.displayName);
          //   }
          // },
          MP: {
            displayName: "Collarbone Breaker",
            frameData: {
              SU: 3,
              A: 3,
              R: 11
            },
            func: function () {
              console.log("performing command normal:", this.displayName);
            }
          },
          HP: {
            displayName: "Solar Plexus Strike",
            frameData: {
              SU: 3,
              A: 3,
              R: 11
            },
            func: function () {
              console.log("performing command normal:", this.displayName);
            }
          },
          // LK: {
          //   displayName: "forward LK",
          //   frameData: {
          //     SU: 3,
          //     A: 3,
          //     R: 11
          //   },
          //   func: function () {
          //     console.log("performing command normal:", this.displayName);
          //   }
          // },
          // MK: {
          //   displayName: "forward MK",
          //   frameData: {
          //     SU: 3,
          //     A: 3,
          //     R: 11
          //   },
          //   func: function () {
          //     console.log("performing command normal:", this.displayName);
          //   }
          // },
          // HK: {
          //   displayName: "forward HK",
          //   frameData: {
          //     SU: 3,
          //     A: 3,
          //     R: 11
          //   },
          //   func: function () {
          //     console.log("performing command normal:", this.displayName);
          //   }
          // },
        },
        B: {
          // LP: {
          //   displayName: "back LP",
          frameData: {
            SU: 3,
            A: 3,
            R: 11
          },
          //   func: function () {
          //     console.log("performing command normal:", this.displayName);
          //   }
          // },
          // MP: {
          //   displayName: "back MP",
          frameData: {
            SU: 3,
            A: 3,
            R: 11
          },
          //   func: function () {
          //     console.log("performing command normal:", this.displayName);
          //   }
          // },
          // HP: {
          //   displayName: "back HP",
          frameData: {
            SU: 3,
            A: 3,
            R: 11
          },
          //   func: function () {
          //     console.log("performing command normal:", this.displayName);
          //   }
          // },
          // LK: {
          //   displayName: "back MK",
          frameData: {
            SU: 3,
            A: 3,
            R: 11
          },
          //   func: function () {
          //     console.log("performing command normal:", this.displayName);
          //   }
          // },
          // MK: {
          //   displayName: "back MK",
          frameData: {
            SU: 3,
            A: 3,
            R: 11
          },
          //   func: function () {
          //     console.log("performing command normal:", this.displayName);
          //   }
          // },
          HK: {
            displayName: "Axe Kick",
            frameData: {
              SU: 3,
              A: 3,
              R: 11
            },
            func: function () {
              console.log("performing command normal:", this.displayName);
            }
          },
        }
      },
      normals: {
        LP: {
          displayName: "LP",
          frameData: {
            SU: 3,
            A: 3,
            R: 11
          },
          func: function () {
            console.log("performing normal:", this.displayName);
          }
        },
        MP: {
          displayName: "MP",
          frameData: {
            SU: 3,
            A: 3,
            R: 11
          },
          func: function () {
            console.log("performing normal:", this.displayName);
          }
        },
        HP: {
          displayName: "HP",
          frameData: {
            SU: 3,
            A: 3,
            R: 11
          },
          func: function () {
            console.log("performing normal:", this.displayName);
          }
        },
        LK: {
          displayName: "LK",
          frameData: {
            SU: 3,
            A: 3,
            R: 11
          },
          func: function () {
            console.log("performing normal:", this.displayName);
          }
        },
        MK: {
          displayName: "MK",
          frameData: {
            SU: 3,
            A: 3,
            R: 11
          },
          func: function () {
            console.log("performing normal:", this.displayName);
          }
        },
        HK: {
          displayName: "HK",
          frameData: {
            SU: 3,
            A: 3,
            R: 11
          },
          func: function () {
            console.log("performing normal:", this.displayName);
          }
        },
      }
    }
  }
}

function populateCharacters() {
  var p1SideElem = document.querySelector(".player-1-side");
  var p2SideElem = document.querySelector(".player-2-side");

  var characters = Object.keys(getCharacters());

  characters.map(charName => {
    var button = document.createElement("button");
    button.type = "button";
    button.name = "button";
    button.innerText = charName.split("_").map(str => {
      return str = str[0].toUpperCase() + str.slice(1,100);
    }).join(" ");

    [p1SideElem, p2SideElem].map((elem, side) => {
      var uniqueButton = button.cloneNode(true);
      uniqueButton.addEventListener( "click", setPuppet.bind(null, charName, "player" + (side+1)) );
      elem.appendChild(uniqueButton);
    });
    button = null;
  });
}

function getPads() {
  var pads = navigator.getGamepads();
  Object.keys(pads).map(function (num) {
    if(pads[num]) {
      var configuration = null;
      if(pads[num].mapping === "standard") {
        configuration = {
          "0": 1, // lp
          "1": 2, // lk
          "2": 0 // mk
        }
      }
      var name = "i" + pads[num].index + "-" + normalizeID(pads[num].id);

      // console.log("Gamepad Found!");
      if(!gamepads[name]) addPad({
        gamepad: pads[num],
        configuration
      });
    }
  });
}

function addPad(e) {
  // console.log(e.gamepad);
  var name = "i" + e.gamepad.index + "-" + normalizeID(e.gamepad.id);
  // console.log(name);
  gamepads[name] = {
    name: name,
    index: e.gamepad.index,
    configuration: e.configuration || {},
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
  if(sticks) sticks.appendChild(opt);
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

function startConfig(buttonName) {
  configuring = buttonName;
  var elem = document.querySelector(".btn-" + buttonName);
  elem.addClass("configuring");
}

function setConfig(name, btn) {
  var map = {
    lp: 0,
    mp: 3,
    hp: 5,
    "3p": 4,
    lk: 1,
    mk: 2,
    hk: 7,
    "3k": 6
  }
  console.log(configuring, btn);
  // console.log(humanizeButton(configuring), humanizeButton(btn));
  gamepads[name].configuration[btn] = map[configuring];
  // gamepads[name].configuration[configuring] = parseInt(index);
  var elem = document.querySelector(".btn-" + configuring);
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
  // console.log(gamepads);
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
      // console.log(buttons);
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
      // console.log(checked, usedButton);
      // console.log(btn, "(" + (parseInt(btn) + 1) + ")", "Config:", usedButton);
      cb(usedButton);
    });
  }

  function axisData(axes) {
    // console.log(axes);
    var axPlus = axes.reduce((m,n) => m + n);
    // console.log(axPlus);
    var value = axes.length === 4 ? axPlus.toFixed(2) : axes.pop().toFixed(2);
    var input = getStickInput(value) || "n";
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
    var newData = {
      axis: data.axis,
    };
    if(data.oneAxis) newData.oneAxis = data.oneAxis;
    // console.log(data);
    ["onePress", "depressed", "oneRelease"].map(state => {
      var stateData = data[state];
      if(!stateData) return;
      var newStateData = {};
      Object.keys(stateData).map(btn => {
        newStateData[getButton(padInfo, btn)] = true;
      });

      newData[state] = newStateData;
    });

    return newData
  }

  return convert(returnData);
}

function gameLoop() {
  var start = Date.now();
  Object.keys(gamepads).map(name => {
    var padInfo = gamepads[name];
    var returnedInputs = checkPad(padInfo);

    if(returnedInputs && Object.keys(returnedInputs).length > 0) {
      // console.log(returnedInputs);
      // makeInputDisplayElements(gamepads[name], returnedInputs);
      // console.log(padInfo);
      if(padInfo.player) {
        gfxDisplay.rotateCube(returnedInputs.axis);
        padInfo.player.receiveInputData(gamepads[name], returnedInputs);
      }
    }
  });
  if(gfxDisplay.webglIsAvailable) gfxDisplay.renderScene();
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
      var configBtn = parseInt(input);
      // console.log(input, configBtn);
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

      var configBtn = btn;

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
  //   var configBtn = btn;
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

function MakeCanvas(canvasInfo) {
  var cc = document.querySelector(".canvas-container");
  this.webglIsAvailable = ( function () {
		try {
			var canvas = document.createElement( 'canvas' ); return !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) );
		} catch ( e ) {
			return false;
		}
	} )();

  if(!this.webglIsAvailable) {
    var span = document.createElement("span");
    span.innerText = "WebGL is not support in your browser.";
    if(cc) {
      cc.appendChild(span);
    } else {
      console.error("cannot find canvas container");
    }
    return;
  }

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera((canvasInfo.width/64) / -2, (canvasInfo.width/64) / 2, (canvasInfo.height/64) / 2, (canvasInfo.height/64) / -2, .1, 1000);
  // var camera = new THREE.PerspectiveCamera(45, canvasInfo.width / canvasInfo.height, .1, 1000);
  camera.position.y = 15;
  camera.rotation.x = 4.75;

  // console.log(camera.rotation);

  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(canvasInfo.width, canvasInfo.height);
  var cc = document.querySelector(".canvas-container");
  if(cc) {
    cc.appendChild(renderer.domElement);
  } else {
    console.error("cannot find canvas container");
  }

  var geometry = new THREE.BoxGeometry(1,1,1);
  var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  var cube = new THREE.Mesh(geometry, material);
  cube.position.z = -.5;
  scene.add(cube);

  this.renderScene = function () {
    if(document.hasFocus()) {
      renderer.render(scene, camera);
    }
  }

  var axisDirs = {
    x: {
      "u": -0.1,
      "d": 0.1,
    },
    z: {
      "l": -0.1,
      "r": 0.1,
    },
  }

  this.rotateCube = function (axis) {
    var axisValuesArray = axis.split("");
    axisValuesArray.map(dir => {
      cube.rotation.x += axisDirs.x[dir] || 0;
      cube.rotation.z += axisDirs.z[dir] || 0;
    });
  }
  this.moveCube = function (dir) {
    // console.log(dir);
    switch (dir) {
      case "left": cube.position.x-=.1; break;
      case "right": cube.position.x+=.1; break;
      case "up": cube.position.z-=.1; break;
      case "down": cube.position.z+=.1; break;
    }
  }
  this.rotateCamera = function (key) {
    switch (key) {
      case "[":
        camera.rotation.x -= .1;
        break;
      case "]":
        camera.rotation.x += .1;
        break;
    }
    // console.log("Camera rotation X:", camera.rotation.x)
  }
  document.addEventListener("keydown", e => {
    // console.log(e);
    switch (e.key) {
      case "[": this.rotateCamera("["); break;
      case "]": this.rotateCamera("]"); break;
      case "ArrowLeft": e.preventDefault(); this.moveCube("left"); break;
      case "ArrowRight": e.preventDefault(); this.moveCube("right"); break;
      case "ArrowUp": e.preventDefault(); this.moveCube("up"); break;
      case "ArrowDown": e.preventDefault(); this.moveCube("down"); break;
    }
  });
}

function setPuppet(charName, playerID) {
  var characters = getCharacters();
  var player = players[playerID];
  switch (charName) {
    case "ryu":
      if(player) player.setPlayerPuppet( /*new Character*/(characters[charName]) ); else console.warn("no player to set");
  }
}

function Player(data) {
  var constructor = function(data) {
    this.actionsArray = [];

    var actionVariants = [
      ["F", "SUPER", "1+2+7", 50],
      // ["F", "SUPER", "1", 50],
      // ["F", "SUPER", "2", 50],
      // ["F", "SUPER", "7", 50],
      ["F", "EX", "1+2", 20],
      ["F", "EX", "2+7", 20],
      ["F", "EX", "1+7", 20],
      ["B", "SUPER", "1+2+7", 50],
      // ["B", "SUPER", "1", 50],
      // ["B", "SUPER", "2", 50],
      // ["B", "SUPER", "7", 50],
      ["B", "EX", "1+2", 20],
      ["B", "EX", "2+7", 20],
      ["B", "EX", "1+7", 20],

      ["B", "HK", "7", 20],
      ["B", "MK", "2", 18],
      ["B", "LK", "1", 15],
      ["F", "HK", "7", 20],
      ["F", "MK", "2", 18],
      ["F", "LK", "2", 15],

      ["F", "SUPER", "0+3+5", 50],
      // ["F", "SUPER", miniMap.lp + "", 50],
      // ["F", "SUPER", "3", 50],
      // ["F", "SUPER", "5", 50],
      ["F", "EX", "0+3", 20],
      ["F", "EX", "3+5", 20],
      ["F", "EX", "0+5", 20],
      ["B", "SUPER", "0+3+5", 50],
      // ["B", "SUPER", miniMap.lp + "", 50],
      // ["B", "SUPER", "3", 50],
      // ["B", "SUPER", "5", 50],
      ["B", "EX", "0+3", 20],
      ["B", "EX", "3+5", 20],
      ["B", "EX", "0+5", 20],

      ["B", "HP", "5", 20],
      ["B", "MP", "3", 18],
      ["B", "LP", "0", 15],
      ["F", "HP", "5", 20],
      ["F", "MP", "3", 18],
      ["F", "LP", "0", 15],
    ];

    // add inputs
    // HCB & HCF
    // !!! null !!!
    // DQCB & DQCF
    actionVariants.map(([d, btn, btnNum, recovery]) => {
      var pattern = "DQC";
      var input = d === "F" ? ["d", "df", "f", "d", "df", "f"] : ["d", "db", "b", "d", "db", "b"];
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

    this.facing = "right";
    this.canTakeInput = true;
    this.padInfo = data.padInfo || null;
    // console.log(this);
    this.activeActionsArray = this.actionsArray;
    this.puppet = null;
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
      // 3 kick macro is pressed
      if(inputs.depressed[6]) {
        // check if individual kicks are pressed
        if(
          inputs.depressed[1] &&
          inputs.depressed[2] &&
          inputs.depressed[7]
        ) {
          // delete the macro input
          if(inputs.onePress) delete inputs.onePress[6];
        } else {
          // add the individual inputs
          inputs.depressed[7] = true;
          inputs.depressed[2] = true;
          inputs.depressed[1] = true;
        }
      }

      // if 3 punch macro is pressed
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
          inputs.depressed[5] = true;
          inputs.depressed[3] = true;
          inputs.depressed[0] = true;
        }
      }
    }

    if(inputs.onePress) {
      if(inputs.onePress[6]) {
        inputs.onePress[7] = true;
        inputs.onePress[2] = true;
        inputs.onePress[1] = true;
        delete inputs.onePress[6];
      }
      if(inputs.onePress[4]) {
        inputs.onePress[5] = true;
        inputs.onePress[3] = true;
        inputs.onePress[0] = true;
        delete inputs.onePress[4];
      }
      // console.log(inputs.onePress);

      // maintains the other of the keys
      // kicks > punches
      // hard > light
      var keyOrder = [0,3,5,1,2,7];
      // alternative: maintains the other of the keys
      // hard > light
      // kicks > punches
      // var keyOrder = [0,1,3,2,5,7];
      keyOrder.map(key => {
        var btn = inputs.onePress[key] ? key : null;
        // console.log(key, typeof btn, btn, inputs.onePress[key]);

        if(typeof btn !== "number") return;
        console.log(btn);

        parentArray.push(btn.toString());
      });
    }
    // if(inputs.depressed) Object.keys(inputs.depressed).map(btn => {
      //   if(inputs.onePress && inputs.onePress[btn]) return;
      //
      //   var configBtn = btn;
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
      // console.log(parentArray);
      padInfo.recordedInputs.push(parentArray);
      if(padInfo.recordedInputs.length > padInfo.maxRecordedInputs) padInfo.recordedInputs.shift();
      padInfo.readCount++;
      padInfo.retireRecordedTick = padInfo.retireRecordedFrameTime;
      showReadCount(padInfo.readCount, padInfo.maxReadCount);

      // remove the current input after time
      setTimeout(function () {
        var index = padInfo.recordedInputs.indexOf(parentArray);
        if(index >= 0) padInfo.recordedInputs[index] = null;
        padInfo.readCount--;
        if(padInfo.readCount < 0) padInfo.readCount = 0;
        showReadCount(padInfo.readCount, padInfo.maxReadCount);
      },  padInfo.retireRecordedFrameTime);
    }
    displayInputs(parentArray, padInfo);
    this.captureMove(padInfo);
  }

  this.captureMove = function(padInfo) {
    // this creates an array which basically represets directions
    // the first index is the left, and the second index is the right
    // that means that if the player is facing right "dr" = `d${faceDirectionTransformGuide[1]}` = "df" (down-forward)
    // vice versa, if the player is facing left "dr" = `d${faceDirectionTransformGuide[0]}` = "db" (down-back)
    var faceDirectionTransformGuide = this.facing === "right" ? ["b", "f"] : ["f", "b"];

    var movesCaptured = {
      "SUPER": null,
      "EX": null,
      "NORM": null
    };

    var performing = false;

    // pick the higest number to read the inputs
    var record = padInfo.recordedInputs;
    // console.log(record.slice(-1));
    var maxRead = padInfo.readCount > padInfo.maxReadCount ? padInfo.maxReadCount : padInfo.readCount;
    var read = maxRead;
    var whatImWorkingWith = record.slice( (read) * -1 ).filter(n => !!n);

    var performMove = function(movesCaptured) {
      var keys = Object.keys(movesCaptured).filter(n => !!movesCaptured[n]);// ["SUPER", "EX", "NORM"]
      var whatImWorkingWith = record.slice(padInfo.maxReadCount * -1);
      var meterOptions = [300];// temporary
      // var meterOptions = [0,100,200,300];// temporary
      var meterInd = Math.floor(Math.random() * meterOptions.length);
      var meter = meterOptions[meterInd];

      if(keys.length > 0) {
        // do special
        console.log("do special");
        keys.map(key => {
          var action = movesCaptured[key];
          if(!action) return;

          if(this.canTakeInput) proceed.bind(this, action, meter, key)();
        });
      } else {
        // do normal
        var singleFrameInputs = record.slice(-1)[0];

        if(singleFrameInputs && singleFrameInputs.length >= 1) {
          var direction = normalizeDirection(singleFrameInputs[0], faceDirectionTransformGuide);
          if(direction && direction.match(/^[a-z]+$/)) {
            direction = direction.toUpperCase();
          } else {
            // singleFrameInputs.unshift(direction);
            direction = null;
          }

          var button = buttonNumToButtonTxt(singleFrameInputs[singleFrameInputs.length - 1]);
          if(!button) return;

          if(this.puppet) {
            var commandNormals = this.puppet.commandNormals[direction] || {};
            var normals = this.puppet.normals;
            if(!normals) return;
            var action = commandNormals[button] || normals[button];
            if(action) {
              console.log("do normal");
              // console.log(action);
              proceed.bind(this, action, meter)();
            }
          }
        }
      }

      function proceed(action, meter, type) {
        // console.log(meter);
        // type === [SUPER, EX, NORM]
        switch (type) {
          case "SUPER": if(meter !== 300) return;
          case "EX": if(!(meter >= 100)) return;
          // case "NORM":
          default:
        }
        var text = (action.btn ? action.btn + " " : "") + action.displayName;
        console.log(meter, text);
        speaker.setText(text);
        speaker.speak();

        this.setActionableState("input", {
          canTakeInput: false,
          recovery: action.recovery || 20,
          inputsToPurge: whatImWorkingWith.map((_, ind) => record[record.length-(whatImWorkingWith.length-ind)])
        });
      }
      // console.log("what I matched is what I want", whatImatchedIsWhatIwant, text, whatImatchedJoined, whatIwantJoined);
    }.bind(this);

    // this.activeActionsArray.slice(0,1).map(action => {
    this.activeActionsArray.map((action, actionInd) => {
      if(!this.canTakeInput) return;
      // var action = this.activeActionsArray[actionInd];
      var occupied = false, alreadyUsed = false;
      // if we already have moves to work with then no other moves need checking
      switch (action.btn) {
        case "SUPER": occupied = !!movesCaptured.SUPER; alreadyUsed = movesCaptured.SUPER === action.SUPER; break;
        case "EX": occupied = !!movesCaptured.EX; alreadyUsed = movesCaptured.EX === action.EX; break;
        default: occupied = !!movesCaptured.NORM; alreadyUsed = movesCaptured.NORM === action.NORM; break;
      }
      if(occupied || alreadyUsed) return;

      if(padInfo.recordedInputs.length >= action.input.length) {
        // var record = padInfo.recordedInputs;

        var whatIwant = JSON.parse(JSON.stringify(action.input));
        var whatIwantJoined = whatIwant.join("").replace(/\+/g, "");

        // pick the higest number to read the inputs
        // var maxRead = padInfo.readCount > padInfo.maxReadCount ? padInfo.maxReadCount : padInfo.readCount;
        // var read = maxRead;
        // var read = maxRead > whatIwant.length ? padInfo.readCount : whatIwant.length;
        // var whatImWorkingWith = record.slice( (read) * -1 ).filter(n => !!n);

        var whatImatched = [];
        var discrepencies = 0, maxDiscrepencies = 2;

        // now that it has the recorded inputs it needs
        for(ind = whatImWorkingWith.length-1; ind >= 0; ind--) {
          if(discrepencies >= maxDiscrepencies) break;
          var inputs = whatImWorkingWith[ind];
          if(inputs) {
            // this is the input that we will be comparing against the current selection of inputs
            var whatIwantPopped = whatIwant.pop();

            // this is where it makes use of the "faceDirectionTransformGuide" variable, changing the inputs to represent the direction the character is facing rather than a static direction
            // e.g., dr (down-right) > df (down-forward), if the user is facing to the right of the screen
            var alteredInputs = inputs.map(input => {
              var newInput = normalizeDirection(input, faceDirectionTransformGuide);
              return newInput;
            });

            var placeArr = [];

            var place = -1;
            // if this variable is falsey then it wont work what it's been given to work with, and the loop is dropped
            if(!whatIwantPopped) {
              // continue;
              break;
            }
            if(whatIwantPopped.match("\\+")) {
              // sometimes a single input will have multiple button inputs
              // this is there so that they are all checked for existance at once
              // it's comparing this array ["0", "3", "5"] to what I want here in this single index array ["0+3+5"]
              var split = whatIwantPopped.split("+");
              split.map(input => {
                place = alteredInputs.indexOf(input);
                placeArr.push(place);
                // console.log(input, place, alteredInputs);
                if(place >= 0) whatImatched.push(input);
              });
            } else {
              // no pluys signs? then this is a very normal array requiring very normal checks
              place = alteredInputs.indexOf(whatIwantPopped);
              placeArr.push(place);
              // console.log(whatIwantPopped, alteredInputs, place);
              if(place >= 0) whatImatched.unshift(whatIwantPopped);
            }
            if(place === -1) {
              // when there is no match for the desired input then give it a "strike".
              discrepencies++;
              // in this instance it'll try to work with 'whatIwant' again
              whatIwant.push(whatIwantPopped);
            };
            // console.log(placeArr, whatIwantPopped);
            } else {
            // when there is no match for the desired input then give it a "strike".
            discrepencies++;
          }
          // if(whatImatched.length > 0) console.log(whatImatched);
        };
        // at x strikes (maxDiscrepencies) the whole checking process is dropped
        if(discrepencies >= maxDiscrepencies) {
          return;
        }

        var whatImatchedJoined = whatImatched.join("");
        var whatImatchedIsWhatIwant = whatImatchedJoined === whatIwantJoined;

        if(whatImatchedIsWhatIwant) {
          // the movesCaptured object will hold up to 3 types of specials: normal, EX, and SUPER
          // this is determined by the 'btn' key on the 'action'
          switch (action.btn) {
            case "SUPER": movesCaptured.SUPER = action; break;
            case "EX": movesCaptured.EX = action; break;
            default: movesCaptured.NORM = action; break;
          }
          var text = action.displayName ? action.btn + " " + action.displayName : action.name;

          // if all available slots in the 'movesCaptured' object are full, stop everything and just perform a move
          if(!!movesCaptured.SUPER && !!movesCaptured.EX && !!movesCaptured.NORM) {
            performing = true;
            performMove(movesCaptured);
          }
        }
      }
    });

    if(!performing) performMove(movesCaptured);
  }

  this.setPlayerPuppet = function(puppet) {
    this.puppet = puppet;
    // console.log(this.puppet);
    // console.log("length of current actions array:", this.activeActionsArray.length);
    var newActionsArray = [];
    this.actionsArray.map(input => {
      var willAdd = true;

      var puppetSpecials = this.puppet.specials;
      // a puppet(character) specific patter will be the key on the character data
      // this patter is used to capture the puppet's moves
      var move = puppetSpecials[input.pattern];
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

      var moveType = input.btn === "SUPER" ? "sup" : input.btn === "EX" ? "ex" : "norm";

      if(willAdd) {
        var moveData = both ? move.moveData[input.dir][buttonActions][moveType] : move.moveData[input.dir][moveType];
        // this works in determining if a move has super and/or normal
        // console.log("Move Data:", moveData);
        if(!moveData) return; // no add

        var displayName = moveData.displayName;
        var moveFunc = moveData.func;
        var frameData = moveData.frameData;
        var moveRecovery;
        if(frameData) {
          moveRecovery = frameData.SU + frameData.A + frameData.R;
        }

        newActionsArray.push(Object.assign(input, {
          displayName,
          moveFunc,
          recovery: moveRecovery || input.recovery
        }));
      }

    });
    console.log("length of new actions array:", newActionsArray.length);
    this.activeActionsArray = newActionsArray;
  }

  function buttonNumToButtonTxt(btn) {
    var buttons = {
      "0": "LP",
      "3": "MP",
      "5": "HP",
      "1": "LK",
      "2": "MK",
      "7": "HK",
    };
    return btn ? buttons[btn.toString()] : null;
  }

  function normalizeDirection(input, faceDirectionTransformGuide) {
    if(!input) return input;
    if(input.match("r")) {
      return input.replace("r", faceDirectionTransformGuide[1]) || input;
    } else if(input.match("l")){
      return input.replace("l", faceDirectionTransformGuide[0]) || input;
    }
    return input;
  }

  facechange.addEventListener("click", this.changeFace.bind(this));
}
