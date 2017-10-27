PieceDigital: Aww, I wanted to see the secret to capturing user inputs  FeelsBadMan
PP_Willpower: the secret?
PieceDigital: It's not a secret?  PogChamp
PP_Willpower: what do you mean? like reading input in game?
PieceDigital: I've been mulling over the idea of making a fighting game. I just get stuck at the idea of turning user input into combos, etc
PieceDigital: I suppose I could just start with some pseudo code. Something.
PP_Willpower: hmmm
PP_Willpower: I'm actually working on my input system right now
PP_Willpower: but in general you need to keep a cache of the last X frames of input
PP_Willpower: and then when you check for a "Sequence" you start on currentFrame - bufferFrames
PP_Willpower: so if you have 100 frames of cached input and 100 = the current frame always
PP_Willpower: and a move has say 10f of buffer, you start on frame 90 in the list
PP_Willpower: basically you loop from 90 -> 100 and also loop through each element of your sequence.
PieceDigital: That makes sense.
PP_Willpower: qcf sequence is down -> downforward -> forward, so you'd loop through 90->100 looking for down (first), once down is found you keep your position and start looking for downForward (second)
PP_Willpower: if you get to the end of the 90->100 without getting to the end of your sequence list, you didn't find the input
PieceDigital: Alright. I was thinking something like that.
PieceDigital: I just wasn't sure what was "proper," ya know?
PP_Willpower: sure
PP_Willpower: one important thing is to store you inputs as bit flags
PieceDigital: And I suppose I could compensate for minor input errors later on.
PP_Willpower: so every frame is just a single int with bits set for each value
PP_Willpower: then you can do bit wise operations on it to see if an input exists on that frame
PieceDigital: I see.
PieceDigital: I plan on making something in the web browser, actually, since that's my current skill set.
PP_Willpower: good luck!
PieceDigital: I'll have to look up "bit flags" and such to see if it's relevant.
PieceDigital: Thanks, you too!
Nightbot: Check out @PP_IAMLEE's Professional work and pipeline tools www.assetfactoryinc.com
