this.captureSpecialMove = function(padInfo) {
  // this creates an array which basically represets directions
  // the first index is the left, and the second index is the right
  // that means that if the player is facing right "dr" = `d${dir[1]}` = "df" (down-forward)
  // vice versa, if the player is facing left "dr" = `d${dir[0]}` = "db" (down-back)
  var dir = this.facing === "right" ? ["b", "f"] : ["f", "b"];

  var movesCaptured = {
    "SUPER": null,
    "EX": null,
    "NORM": null
  };

  var performing = false;

  var record = padInfo.recordedInputs;
  // var maxRead = padInfo.readCount > padInfo.maxReadCount ? padInfo.maxReadCount : padInfo.readCount;
  // var read = maxRead > whatIwant.length ? padInfo.readCount : whatIwant.length;

  var performMove = function(movesCaptured) {
    var keys = Object.keys(movesCaptured).filter(n => !!movesCaptured[n]);// ["SUPER", "EX", "NORM"]
    var whatImWorkingWith = record.slice(padInfo.maxReadCount * -1);
    // console.log(movesCaptured);
    var meterOptions = [0,100,200,300];// temporary
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
        // console.log("get a normal:", singleFrameInputs);
        var direction = normalizeDirection(singleFrameInputs[0], dir);
        // console.log("DIR", direction);
        if(direction && direction.match(/^[a-z]+$/)) {
          direction = direction.toUpperCase();
        } else {
          // singleFrameInputs.unshift(direction);
          direction = null;
        }

        var button = buttonNumToButtonTxt(singleFrameInputs[singleFrameInputs.length - 1]);
        // console.log(direction, button);
        if(!button) return;

        if(this.puppet) {
          // console.log(direction,button,this.puppet.normals[direction][button]);
          // if(!direction) console.log("no direction. very normal normal");
          var normals = direction ? this.puppet.commandNormals[direction] : this.puppet.normals;
          // console.log("normals", direction, normals, this.puppet);
          if(!normals) return;
          var action = normals[button];
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
      var text = (type || "") + " " + action.displayName;
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
      // console.log(padInfo.readCount, whatIwant.length, padInfo.readCount < whatIwant.length);
      var maxRead = padInfo.readCount > padInfo.maxReadCount ? padInfo.maxReadCount : padInfo.readCount;
      var read = maxRead > whatIwant.length ? padInfo.readCount : whatIwant.length;
      var whatImWorkingWith = record.slice( (read+5) * -1 ).filter(n => !!n);
      // console.log(whatImWorkingWith, record);

      var whatImatched = [];
      var discrepencies = 0, maxDiscrepencies = 2;

      for(ind = whatImWorkingWith.length-1; ind >= 0; ind--) {
        if(discrepencies >= maxDiscrepencies) break;
        var inputs = whatImWorkingWith[ind];
        if(inputs) {
          // console.log(whatIwant);
          var whatIwantPopped = whatIwant.pop();
          // console.log(whatIwantPopped);
          // this is where it makes use of the "dir" variable, changing the inputs to represent faces rather than
          // console.log(inputs);
          var alteredInputs = inputs.map(input => {
            var newInput = normalizeDirection(input, dir);
            // console.log("ALTER:", input, newInput, dir);
            return newInput;
          });
          // console.log(alteredInputs);
          var placeArr = [];

          var place = -1;
          // console.log(whatImWorkingWith,whatIwantPopped);
          if(!whatIwantPopped) {
            // console.log("skipping", whatIwantPopped);
            continue;
          }
          if(whatIwantPopped.match("\\+")) {
            var split = whatIwantPopped.split("+");
            // console.log(split, alteredInputs);
            split.map(input => {
              place = alteredInputs.indexOf(input);
              placeArr.push(place);
              // console.log(input, place, alteredInputs);
              if(place >= 0) whatImatched.push(input);
            });
            // console.log(place);
            // whatIwantPopped = split.shift();
            // whatIwant = whatIwant.concat(split);
          } else {
            place = alteredInputs.indexOf(whatIwantPopped);
            placeArr.push(place);
            // console.log(whatIwantPopped, alteredInputs, place);
            if(place >= 0) whatImatched.unshift(whatIwantPopped);
            // console.log(place);
          }
          if(place === -1) {
            whatIwant.push(whatIwantPopped);
            discrepencies++
          };
          // console.log(placeArr, whatIwantPopped);
        } else {
          discrepencies++;
        }
        // if(whatImatched.length > 0) console.log(whatImatched);
        // console.log(ind);
      };
      if(discrepencies >= maxDiscrepencies) {
        return;// console.warn("too many discrepencies:", discrepencies);
      }

      var whatImatchedJoined = whatImatched.join("");
      var whatImatchedIsWhatIwant = whatImatchedJoined === whatIwantJoined;
      // console.log("what i got", whatImWorkingWith);
      // console.log("what I matched", whatImatched);
      // console.log("what I want", whatIwant);
      // console.log("whatImWorkingWith", whatImWorkingWith.toString() || null, whatImatchedJoined || null, whatIwantJoined || null);
      // console.log(whatImatchedJoined, whatIwantJoined);
      // console.log("runs");
      if(whatImatchedIsWhatIwant) {
        switch (action.btn) {
          case "SUPER": movesCaptured.SUPER = action; break;
          case "EX": movesCaptured.EX = action; break;
          default: movesCaptured.NORM = action; break;
        }
        var text = action.displayName ? action.btn + " " + action.displayName : action.name;
        // speaker.setText(text);
        // console.log(discrepencies);
        // speaker.speak();
        // console.log("what I matched is what I want", whatImatchedIsWhatIwant, text, whatImatchedJoined, whatIwantJoined);
        // console.log(movesCaptured);
        if(!!movesCaptured.SUPER && !!movesCaptured.EX && !!movesCaptured.NORM) {
          performing = true;
          performMove(movesCaptured);
        }
      }
    }
  });

  if(!performing) performMove(movesCaptured);
}
