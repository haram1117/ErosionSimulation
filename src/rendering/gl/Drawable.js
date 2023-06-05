"use strict";
exports.__esModule = true;
var globals_1 = require("../../globals");
var Drawable = /** @class */ (function () {
    function Drawable() {
        this.count = 0;
        this.idxBound = false;
        this.posBound = false;
        this.norBound = false;
        this.uvBound = false;
        this.mode = globals_1.gl.TRIANGLES;
    }
    Drawable.prototype.destory = function () {
        globals_1.gl.deleteBuffer(this.bufIdx);
        globals_1.gl.deleteBuffer(this.bufPos);
        globals_1.gl.deleteBuffer(this.bufNor);
        globals_1.gl.deleteBuffer(this.bufUv);
    };
    Drawable.prototype.generateIdx = function () {
        this.idxBound = true;
        this.bufIdx = globals_1.gl.createBuffer();
    };
    Drawable.prototype.generatePos = function () {
        this.posBound = true;
        this.bufPos = globals_1.gl.createBuffer();
    };
    Drawable.prototype.generateNor = function () {
        this.norBound = true;
        this.bufNor = globals_1.gl.createBuffer();
    };
    Drawable.prototype.generateUv = function () {
        this.uvBound = true;
        this.bufUv = globals_1.gl.createBuffer();
    };
    Drawable.prototype.bindIdx = function () {
        if (this.idxBound) {
            globals_1.gl.bindBuffer(globals_1.gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        }
        return this.idxBound;
    };
    Drawable.prototype.bindPos = function () {
        if (this.posBound) {
            globals_1.gl.bindBuffer(globals_1.gl.ARRAY_BUFFER, this.bufPos);
        }
        return this.posBound;
    };
    Drawable.prototype.bindNor = function () {
        if (this.norBound) {
            globals_1.gl.bindBuffer(globals_1.gl.ARRAY_BUFFER, this.bufNor);
        }
        return this.norBound;
    };
    Drawable.prototype.bindUv = function () {
        if (this.uvBound) {
            globals_1.gl.bindBuffer(globals_1.gl.ARRAY_BUFFER, this.bufUv);
        }
        return this.uvBound;
    };
    Drawable.prototype.elemCount = function () {
        return this.count;
    };
    Drawable.prototype.drawMode = function () {
        return this.mode;
    };
    Drawable.prototype.setDrawMode = function (m) {
        this.mode = m;
    };
    return Drawable;
}());
;
exports["default"] = Drawable;
