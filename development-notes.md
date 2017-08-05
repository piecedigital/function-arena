# Fighting Game

So I'm going to attempt to make a fighting game engine. It's gonna be weird and difficult but possible.
I should work on the mechanics in pieces. Here I'll make a list of what to prototype, and perhaps in what order.

## Things To Prototype

- Characters
  - moves
    - Figure out a universal solution for creating moves. Something that makes it easy to plug in new characters at a basic level
      - Read input **ok**
      - Makes action based on property **ok**
      - Most specials and normals will be cancellable
  - Movement
    - walking - need a state variable for this
    - Dashing - need a state variable for this
    - Make sure there's collision with Platform and walls
    - Jumping
  - Hit box and hurt box collisions
    - General collision detection
    - Directional collision detection
    - Methods to handle collisions

- Stage
  - Make a floor
  - Make a camera
    - Draw a limited area of the stage
    - Make sure the drawn data is not all viewable at once

## Graphics Specifications

### Layers

- Assets will be drawn on different layers
  - Layers
    - Canvas (3D, WebGL)
      - Background
      - Platform
      - Rear effects
      - Characters
      - Front effects (and box data)
    - HTML
      - UI

### Aesthetic

I will be attempting hand draw animation. Skullgirls will be my inspiration.
