# GearTrain 
WebGL 3D gear train simulation using [three.js](http://threejs.org/). It supports spur, straight miter bevel and helical skew gears.

## Controls
To move camera use mouse and mouse wheel.

There are two modes to work with simulation:
  1. Add/remove mode. In this mode you can 
     * Add selected gear to shaft by double clicking on shaft. 
     * Add gear to another gear by by double clicking on gear.
     * Remove gear or shaft by right clicking on it. The driver (initially created) shaft cannot be removed.
  2. Info mode. In this mode you can double click on shaft or gear to get info about it.
      

There are also some shortcuts for controls:

| Key    |  Action                       |
| :----: | ----------------------------- |
| a      | Add/remove mode               |
| i      | Info mode                     |
| s      | Add spur gear in add mode     |
| b      | Add bevel gear in add mode    |
| h      | Add helical gear in add mode  |
| Space  | Play/pause                    |

## Settings
All controls' states are saved into cookies and have session lifetime.