# Fighting Game

So I'm going to attempt to make a fighting game engine. It's gonna be weird and difficult but possible.
I should work on the mechanics in pieces. Here I'll make a list of what to prototype, and perhaps in what order.

## Things To Prototype

- Characters
  - combos
    - Figure out a universal solution for creating combos. Something that makes it easy to plug in new characters at a basic level
      - Read input
      - Makes action based on property
      - Next move in a combo based on some variable state?
  - Movement
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
    - Canvas
      - Background
      - Platform
      - Rear effects
      - Characters
      - Front effects (and box data)
    - HTML
      - UI
