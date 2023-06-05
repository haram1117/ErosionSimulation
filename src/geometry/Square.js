"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var gl_matrix_1 = require("gl-matrix");
var Drawable_1 = require("../rendering/gl/Drawable");
var globals_1 = require("../globals");
var Square = /** @class */ (function (_super) {
    __extends(Square, _super);
    function Square(center) {
        var _this = _super.call(this) || this;
        _this.center = gl_matrix_1.vec4.fromValues(center[0], center[1], center[2], 1);
        return _this;
    }
    Square.prototype.create = function () {
        this.indices = new Uint32Array([0, 1, 2,
            0, 2, 3]);
        this.normals = new Float32Array([0, 0, 1, 0,
            0, 0, 1, 0,
            0, 0, 1, 0,
            0, 0, 1, 0]);
        this.positions = new Float32Array([-1, -1, 0.99999, 1,
            1, -1, 0.99999, 1,
            1, 1, 0.99999, 1,
            -1, 1, 0.99999, 1]);
        this.generateIdx();
        this.generatePos();
        this.generateNor();
        this.count = this.indices.length;
        globals_1.gl.bindBuffer(globals_1.gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        globals_1.gl.bufferData(globals_1.gl.ELEMENT_ARRAY_BUFFER, this.indices, globals_1.gl.STATIC_DRAW);
        globals_1.gl.bindBuffer(globals_1.gl.ARRAY_BUFFER, this.bufNor);
        globals_1.gl.bufferData(globals_1.gl.ARRAY_BUFFER, this.normals, globals_1.gl.STATIC_DRAW);
        globals_1.gl.bindBuffer(globals_1.gl.ARRAY_BUFFER, this.bufPos);
        globals_1.gl.bufferData(globals_1.gl.ARRAY_BUFFER, this.positions, globals_1.gl.STATIC_DRAW);
        console.log("Created square");
    };
    return Square;
}(Drawable_1["default"]));
;
exports["default"] = Square;
