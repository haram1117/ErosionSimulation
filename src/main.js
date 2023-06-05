"use strict";
exports.__esModule = true;
var gl_matrix_1 = require("gl-matrix");
// @ts-ignore
var Stats = require("stats-js");
var DAT = require("dat-gui");
var Square_1 = require("./geometry/Square");
var Plane_1 = require("./geometry/Plane");
var OpenGLRenderer_1 = require("./rendering/gl/OpenGLRenderer");
var Camera_1 = require("./Camera");
var globals_1 = require("./globals");
var ShaderProgram_1 = require("./rendering/gl/ShaderProgram");
var mouseChange = require('mouse-change');
// static variables
var clientWidth;
var clientHeight;
var lastX = 0;
var lastY = 0;
var simresolution = 1024;
var shadowMapResolution = 4096;
var enableBilateralBlur = false;
var gl_context;
var speed = 3;
var SimFramecnt = 0;
var TerrainGeometryDirty = true;
var PauseGeneration = false;
var HightMapCpuBuf = new Float32Array(simresolution * simresolution * 4); // height map CPU read back buffer, for CPU raycast & collision physics
var HightMapBufCounter = 0;
var MaxHightMapBufCounter = 200; // determine how many frame to update CPU buffer of terrain hight map for ray casting on CPU
var simres = simresolution;
//  (for backup)
var controlscomp = {
    tesselations: 5,
    pipelen: 0.8,
    Kc: 0.10,
    Ks: 0.020,
    Kd: 0.013,
    timestep: 0.05,
    pipeAra: 0.6,
    RainErosion: false,
    RainErosionStrength: 1.0,
    RainErosionDropSize: 1.0,
    EvaporationConstant: 0.005,
    VelocityMultiplier: 1,
    RainDegree: 4.5,
    AdvectionSpeedScaling: 1.0,
    spawnposx: 0.5,
    spawnposy: 0.5,
    posTemp: gl_matrix_1.vec2.fromValues(0.0, 0.0),
    posPerm: gl_matrix_1.vec2.fromValues(0.0, 0.0),
    'Load Scene': loadScene,
    'Start/Resume': StartGeneration,
    'ResetTerrain': Reset,
    'setTerrainRandom': setTerrainRandom,
    SimulationSpeed: 3,
    TerrainBaseMap: 0,
    TerrainBaseType: 0,
    TerrainBiomeType: 1,
    TerrainScale: 3.2,
    TerrainHeight: 2.0,
    TerrainMask: 0,
    TerrainDebug: 0,
    WaterTransparency: 0.50,
    SedimentTrace: 0,
    TerrainPlatte: 1,
    SnowRange: 0,
    ForestRange: 0,
    brushType: 2,
    brushSize: 4,
    brushStrenth: 0.40,
    brushOperation: 0,
    brushPressed: 0,
    pbrushOn: 0,
    pbrushData: gl_matrix_1.vec2.fromValues(5.0, 0.4),
    thermalRate: 0.5,
    thermalErosionScale: 1.0,
    lightPosX: 0.4,
    lightPosY: 0.2,
    lightPosZ: -1.0,
    showScattering: true,
    enableBilateralBlur: true,
    AdvectionMethod: 1,
    SimulationResolution: simres
};
var controls = {
    tesselations: 5,
    pipelen: 0.8,
    Kc: 0.06,
    Ks: 0.036,
    Kd: 0.006,
    timestep: 0.05,
    pipeAra: 0.6,
    ErosionMode: 0,
    RainErosion: false,
    RainErosionStrength: 0.2,
    RainErosionDropSize: 2.0,
    EvaporationConstant: 0.003,
    VelocityMultiplier: 1,
    RainDegree: 4.5,
    AdvectionSpeedScaling: 1.0,
    spawnposx: 0.5,
    spawnposy: 0.5,
    posTemp: gl_matrix_1.vec2.fromValues(0.0, 0.0),
    posPerm: gl_matrix_1.vec2.fromValues(0.0, 0.0),
    'Load Scene': loadScene,
    'Pause/Resume': StartGeneration,
    'ResetTerrain': Reset,
    'setTerrainRandom': setTerrainRandom,
    SimulationSpeed: 3,
    TerrainBaseMap: 0,
    TerrainBaseType: 0,
    TerrainBiomeType: 1,
    TerrainScale: 3.2,
    TerrainHeight: 2.0,
    TerrainMask: 0,
    TerrainDebug: 0,
    WaterTransparency: 0.50,
    SedimentTrace: true,
    ShowFlowTrace: false,
    TerrainPlatte: 1,
    SnowRange: 0,
    ForestRange: 0,
    brushType: 2,
    brushSize: 4,
    brushStrenth: 0.25,
    brushOperation: 0,
    brushPressed: 0,
    pbrushOn: 0,
    pbrushData: gl_matrix_1.vec2.fromValues(5.0, 0.4),
    thermalTalusAngleScale: 8.0,
    thermalRate: 0.5,
    thermalErosionScale: 1.0,
    lightPosX: 0.4,
    lightPosY: 0.8,
    lightPosZ: -0.0,
    showScattering: true,
    enableBilateralBlur: true,
    AdvectionMethod: 1,
    VelocityAdvectionMag: 0.2,
    SimulationResolution: simres
};
// ================ geometries ============
// =============================================================
var square;
var plane;
var waterPlane;
// ================ frame buffers ============
// =============================================================
var frame_buffer;
var shadowMap_frame_buffer;
var deferred_frame_buffer;
// ================  render buffers ============
// =============================================================
var render_buffer;
var shadowMap_render_buffer;
var deferred_render_buffer;
// ================ muti-renderpasses used textures ============
// =============================================================
var shadowMap_tex;
var scene_depth_tex;
var bilateral_filter_horizontal_tex;
var bilateral_filter_vertical_tex;
var color_pass_tex;
var color_pass_reflection_tex;
var scatter_pass_tex;
// ================ simulation textures ===================
// ========================================================
var read_terrain_tex;
var write_terrain_tex;
var read_flux_tex;
var write_flux_tex;
var read_terrain_flux_tex; // thermal
var write_terrain_flux_tex;
var read_maxslippage_tex;
var write_maxslippage_tex;
var read_vel_tex;
var write_vel_tex;
var read_sediment_tex;
var write_sediment_tex;
var terrain_nor;
var read_sediment_blend;
var write_sediment_blend;
var sediment_advect_a;
var sediment_advect_b;
// ================ dat gui button call backs ============
// =============================================================
function loadScene() {
    square = new Square_1["default"](gl_matrix_1.vec3.fromValues(0, 0, 0));
    square.create();
    plane = new Plane_1["default"](gl_matrix_1.vec3.fromValues(0, 0, 0), gl_matrix_1.vec2.fromValues(1, 1), 18);
    plane.create();
    waterPlane = new Plane_1["default"](gl_matrix_1.vec3.fromValues(0, 0, 0), gl_matrix_1.vec2.fromValues(1, 1), 18);
    waterPlane.create();
}
function StartGeneration() {
    PauseGeneration = !PauseGeneration;
}
function Reset() {
    SimFramecnt = 0;
    TerrainGeometryDirty = true;
    if (controls.SimulationResolution != simres) {
        simres = controls.SimulationResolution;
        resizeTextures4Simulation(gl_context);
    }
    //PauseGeneration = true;
}
function setTerrainRandom() {
}
function Render2Texture(renderer, gl_context, camera, shader, cur_texture) {
    gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, render_buffer);
    gl_context.renderbufferStorage(gl_context.RENDERBUFFER, gl_context.DEPTH_COMPONENT16, simres, simres);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT0, gl_context.TEXTURE_2D, cur_texture, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT1, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT2, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT3, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER, gl_context.DEPTH_ATTACHMENT, gl_context.RENDERBUFFER, render_buffer);
    gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0]);
    var status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
    if (status !== gl_context.FRAMEBUFFER_COMPLETE) {
        console.log("frame buffer status:" + status.toString());
    }
    gl_context.bindTexture(gl_context.TEXTURE_2D, null);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, null);
    gl_context.viewport(0, 0, simres, simres);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    renderer.clear();
    shader.use();
    renderer.render(camera, shader, [square]);
    // if(cur_texture == read_terrain_tex){
    //     HightMapCpuBuf = new Float32Array(simres * simres * 4);
    //     gl_context.readPixels(0,0,simres,simres, gl_context.RGBA, gl_context.FLOAT, HightMapCpuBuf);
    //     //console.log(HightMapCpuBuf);
    // }
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
}
function SimulatePerStep(renderer, gl_context, camera, shader, waterhight, veladvect, sedi, advect, macCormack, rains, eva, ave, thermalterrainflux, thermalapply, maxslippageheight) {
    //////////////////////////////////////////////////////////////////
    //rain precipitation
    //0---use hight map to derive hight map : hight map -----> hight map
    //////////////////////////////////////////////////////////////////
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT0, gl_context.TEXTURE_2D, write_terrain_tex, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT1, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT2, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT3, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER, gl_context.DEPTH_ATTACHMENT, gl_context.RENDERBUFFER, render_buffer);
    gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0]);
    var status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
    if (status !== gl_context.FRAMEBUFFER_COMPLETE) {
        console.log("frame buffer status:" + status.toString());
    }
    gl_context.bindTexture(gl_context.TEXTURE_2D, null);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, null);
    gl_context.viewport(0, 0, simres, simres);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    renderer.clear();
    rains.use();
    gl_context.activeTexture(gl_context.TEXTURE0);
    gl_context.bindTexture(gl_context.TEXTURE_2D, read_terrain_tex);
    gl_context.uniform1i(gl_context.getUniformLocation(rains.prog, "readTerrain"), 0);
    gl_context.uniform1f(gl_context.getUniformLocation(rains.prog, 'raindeg'), controls.RainDegree);
    renderer.render(camera, rains, [square]);
    if (HightMapBufCounter % MaxHightMapBufCounter == 0) {
        gl_context.readPixels(0, 0, simres, simres, gl_context.RGBA, gl_context.FLOAT, HightMapCpuBuf);
    }
    HightMapBufCounter++;
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    //swap terrain tex-----------------------------------------------
    var tmp = read_terrain_tex;
    read_terrain_tex = write_terrain_tex;
    write_terrain_tex = tmp;
    //swap terrain tex-----------------------------------------------
    //////////////////////////////////////////////////////////////////
    //1---use hight map to derive flux map : hight map -----> flux map
    //////////////////////////////////////////////////////////////////
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT0, gl_context.TEXTURE_2D, write_flux_tex, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT1, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT2, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT3, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER, gl_context.DEPTH_ATTACHMENT, gl_context.RENDERBUFFER, render_buffer);
    gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0]);
    status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
    if (status !== gl_context.FRAMEBUFFER_COMPLETE) {
        console.log("frame buffer status:" + status.toString());
    }
    gl_context.bindTexture(gl_context.TEXTURE_2D, null);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, null);
    gl_context.viewport(0, 0, simres, simres);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    renderer.clear();
    shader.use();
    gl_context.activeTexture(gl_context.TEXTURE0);
    gl_context.bindTexture(gl_context.TEXTURE_2D, read_terrain_tex);
    gl_context.uniform1i(gl_context.getUniformLocation(shader.prog, "readTerrain"), 0);
    gl_context.activeTexture(gl_context.TEXTURE1);
    gl_context.bindTexture(gl_context.TEXTURE_2D, read_flux_tex);
    gl_context.uniform1i(gl_context.getUniformLocation(shader.prog, "readFlux"), 1);
    gl_context.activeTexture(gl_context.TEXTURE2);
    gl_context.bindTexture(gl_context.TEXTURE_2D, read_sediment_tex);
    gl_context.uniform1i(gl_context.getUniformLocation(shader.prog, "readSedi"), 2);
    renderer.render(camera, shader, [square]);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    //-----swap flux ping and pong
    tmp = read_flux_tex;
    read_flux_tex = write_flux_tex;
    write_flux_tex = tmp;
    //-----swap flux ping and pong
    //////////////////////////////////////////////////////////////////
    //2---use flux map and hight map to derive velocity map and new hight map :
    // hight map + flux map -----> velocity map + hight map
    //////////////////////////////////////////////////////////////////
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT0, gl_context.TEXTURE_2D, write_terrain_tex, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT1, gl_context.TEXTURE_2D, write_vel_tex, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT2, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT3, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER, gl_context.DEPTH_ATTACHMENT, gl_context.RENDERBUFFER, render_buffer);
    gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0, gl_context.COLOR_ATTACHMENT1]);
    status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
    if (status !== gl_context.FRAMEBUFFER_COMPLETE) {
        console.log("frame buffer status:" + status.toString());
    }
    gl_context.bindTexture(gl_context.TEXTURE_2D, null);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, null);
    gl_context.viewport(0, 0, simres, simres);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    renderer.clear();
    waterhight.use();
    gl_context.activeTexture(gl_context.TEXTURE0);
    gl_context.bindTexture(gl_context.TEXTURE_2D, read_terrain_tex);
    gl_context.uniform1i(gl_context.getUniformLocation(waterhight.prog, "readTerrain"), 0);
    gl_context.activeTexture(gl_context.TEXTURE1);
    gl_context.bindTexture(gl_context.TEXTURE_2D, read_flux_tex);
    gl_context.uniform1i(gl_context.getUniformLocation(waterhight.prog, "readFlux"), 1);
    gl_context.activeTexture(gl_context.TEXTURE2);
    gl_context.bindTexture(gl_context.TEXTURE_2D, read_sediment_tex);
    gl_context.uniform1i(gl_context.getUniformLocation(waterhight.prog, "readSedi"), 2);
    gl_context.activeTexture(gl_context.TEXTURE3);
    gl_context.bindTexture(gl_context.TEXTURE_2D, read_vel_tex);
    gl_context.uniform1i(gl_context.getUniformLocation(waterhight.prog, "readVel"), 3);
    renderer.render(camera, waterhight, [square]);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    //-----swap terrain ping and pong and velocity ping pong
    tmp = read_terrain_tex;
    read_terrain_tex = write_terrain_tex;
    write_terrain_tex = tmp;
    tmp = read_vel_tex;
    read_vel_tex = write_vel_tex;
    write_vel_tex = tmp;
    //-----swap terrain ping and pong and velocity ping pong
    // //////////////////////////////////////////////////////////////////
    // // experimental pass : self advection of velocity (potentially flux) to bring about momentum
    // // ideally :
    // // velocity map + (flux optional) ----> velocity map + (flux optional)
    // //////////////////////////////////////////////////////////////////
    //
    //
    // gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    // gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER,gl_context.COLOR_ATTACHMENT0,gl_context.TEXTURE_2D,write_vel_tex,0);
    // gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER,gl_context.COLOR_ATTACHMENT1,gl_context.TEXTURE_2D,null,0);
    // gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER,gl_context.COLOR_ATTACHMENT2,gl_context.TEXTURE_2D,null,0);
    // gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER,gl_context.COLOR_ATTACHMENT3,gl_context.TEXTURE_2D,null,0);
    // gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER,gl_context.DEPTH_ATTACHMENT,gl_context.RENDERBUFFER,render_buffer);
    //
    // gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0]);
    //
    // status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
    // if(status !== gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER)){
    //     console.log("frame buffer status" + status.toString());
    // }
    //
    // gl_context.bindTexture(gl_context.TEXTURE_2D, null);
    // gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    // gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, null);
    //
    // gl_context.viewport(0, 0, simres, simres);
    // gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    //
    // renderer.clear();
    // veladvect.use();
    //
    // gl_context.activeTexture(gl_context.TEXTURE0);
    // gl_context.bindTexture(gl_context.TEXTURE_2D,read_vel_tex);
    // gl_context.uniform1i(gl_context.getUniformLocation(veladvect.prog,"readVel"),0);
    //
    // renderer.render(camera,veladvect,[square]);
    // gl_context.bindFramebuffer(gl_context.FRAMEBUFFER,null);
    //
    // //-----swap velocity ping pong
    //
    // tmp = read_vel_tex;
    // read_vel_tex = write_vel_tex;
    // write_vel_tex = tmp;
    //
    // //-----swap velocity ping pong
    //////////////////////////////////////////////////////////////////
    //3---use velocity map, sediment map and hight map to derive sediment map and new hight map and velocity map :
    // hight map + velocity map + sediment map -----> sediment map + hight map + terrain normal map + velocity map
    //////////////////////////////////////////////////////////////////
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT0, gl_context.TEXTURE_2D, write_terrain_tex, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT1, gl_context.TEXTURE_2D, write_sediment_tex, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT2, gl_context.TEXTURE_2D, terrain_nor, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT3, gl_context.TEXTURE_2D, write_vel_tex, 0);
    gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER, gl_context.DEPTH_ATTACHMENT, gl_context.RENDERBUFFER, render_buffer);
    gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0, gl_context.COLOR_ATTACHMENT1, gl_context.COLOR_ATTACHMENT2, gl_context.COLOR_ATTACHMENT3]);
    status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
    if (status !== gl_context.FRAMEBUFFER_COMPLETE) {
        console.log("frame buffer status:" + status.toString());
    }
    gl_context.bindTexture(gl_context.TEXTURE_2D, null);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, null);
    gl_context.viewport(0, 0, simres, simres);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    renderer.clear();
    sedi.use();
    gl_context.activeTexture(gl_context.TEXTURE0);
    gl_context.bindTexture(gl_context.TEXTURE_2D, read_terrain_tex);
    gl_context.uniform1i(gl_context.getUniformLocation(sedi.prog, "readTerrain"), 0);
    gl_context.activeTexture(gl_context.TEXTURE1);
    gl_context.bindTexture(gl_context.TEXTURE_2D, read_vel_tex);
    gl_context.uniform1i(gl_context.getUniformLocation(sedi.prog, "readVelocity"), 1);
    gl_context.activeTexture(gl_context.TEXTURE2);
    gl_context.bindTexture(gl_context.TEXTURE_2D, read_sediment_tex);
    gl_context.uniform1i(gl_context.getUniformLocation(sedi.prog, "readSediment"), 2);
    renderer.render(camera, sedi, [square]);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    //----------swap terrain and sediment map---------
    tmp = read_sediment_tex;
    read_sediment_tex = write_sediment_tex;
    write_sediment_tex = tmp;
    tmp = read_terrain_tex;
    read_terrain_tex = write_terrain_tex;
    write_terrain_tex = tmp;
    tmp = read_vel_tex;
    read_vel_tex = write_vel_tex;
    write_vel_tex = tmp;
    //----------swap terrain and sediment map---------
    //////////////////////////////////////////////////////////////////
    // semi-lagrangian advection for sediment transportation
    // 4---use velocity map, sediment map to derive new sediment map :
    // velocity map + sediment map -----> sediment map
    //////////////////////////////////////////////////////////////////
    if (controls.AdvectionMethod == 1) {
        //4.1  first subpass writing to the intermidiate sediment advection texture a
        {
            gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
            gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT0, gl_context.TEXTURE_2D, sediment_advect_a, 0);
            gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT1, gl_context.TEXTURE_2D, write_vel_tex, 0);
            gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT2, gl_context.TEXTURE_2D, write_sediment_blend, 0);
            gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT3, gl_context.TEXTURE_2D, null, 0);
            gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER, gl_context.DEPTH_ATTACHMENT, gl_context.RENDERBUFFER, render_buffer);
            gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0, gl_context.COLOR_ATTACHMENT1, gl_context.COLOR_ATTACHMENT2]);
            status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
            if (status !== gl_context.FRAMEBUFFER_COMPLETE) {
                console.log("frame buffer status:" + status.toString());
            }
            gl_context.bindTexture(gl_context.TEXTURE_2D, null);
            gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
            gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, null);
            gl_context.viewport(0, 0, simres, simres);
            gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
            renderer.clear();
            advect.use();
            gl_context.activeTexture(gl_context.TEXTURE0);
            gl_context.bindTexture(gl_context.TEXTURE_2D, read_vel_tex);
            gl_context.uniform1i(gl_context.getUniformLocation(advect.prog, "vel"), 0);
            gl_context.activeTexture(gl_context.TEXTURE1);
            gl_context.bindTexture(gl_context.TEXTURE_2D, read_sediment_tex);
            gl_context.uniform1i(gl_context.getUniformLocation(advect.prog, "sedi"), 1);
            gl_context.activeTexture(gl_context.TEXTURE2);
            gl_context.bindTexture(gl_context.TEXTURE_2D, read_sediment_blend);
            gl_context.uniform1i(gl_context.getUniformLocation(advect.prog, "sediBlend"), 2);
            gl_context.activeTexture(gl_context.TEXTURE3);
            gl_context.bindTexture(gl_context.TEXTURE_2D, read_terrain_tex);
            gl_context.uniform1i(gl_context.getUniformLocation(advect.prog, "terrain"), 3);
            advect.setFloat(1, "unif_advectMultiplier");
            renderer.render(camera, advect, [square]);
            gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
        }
        //4.2  second subpass writing to the intermidiate sediment advection texture b using a
        {
            gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
            gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT0, gl_context.TEXTURE_2D, sediment_advect_b, 0);
            gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT1, gl_context.TEXTURE_2D, write_vel_tex, 0);
            gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT2, gl_context.TEXTURE_2D, write_sediment_blend, 0);
            gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT3, gl_context.TEXTURE_2D, null, 0);
            gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER, gl_context.DEPTH_ATTACHMENT, gl_context.RENDERBUFFER, render_buffer);
            gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0, gl_context.COLOR_ATTACHMENT1, gl_context.COLOR_ATTACHMENT2]);
            status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
            if (status !== gl_context.FRAMEBUFFER_COMPLETE) {
                console.log("frame buffer status:" + status.toString());
            }
            gl_context.bindTexture(gl_context.TEXTURE_2D, null);
            gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
            gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, null);
            gl_context.viewport(0, 0, simres, simres);
            gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
            renderer.clear();
            advect.use();
            gl_context.activeTexture(gl_context.TEXTURE0);
            gl_context.bindTexture(gl_context.TEXTURE_2D, read_vel_tex);
            gl_context.uniform1i(gl_context.getUniformLocation(advect.prog, "vel"), 0);
            gl_context.activeTexture(gl_context.TEXTURE1);
            gl_context.bindTexture(gl_context.TEXTURE_2D, sediment_advect_a);
            gl_context.uniform1i(gl_context.getUniformLocation(advect.prog, "sedi"), 1);
            gl_context.activeTexture(gl_context.TEXTURE2);
            gl_context.bindTexture(gl_context.TEXTURE_2D, read_sediment_blend);
            gl_context.uniform1i(gl_context.getUniformLocation(advect.prog, "sediBlend"), 2);
            gl_context.activeTexture(gl_context.TEXTURE3);
            gl_context.bindTexture(gl_context.TEXTURE_2D, read_terrain_tex);
            gl_context.uniform1i(gl_context.getUniformLocation(advect.prog, "terrain"), 3);
            advect.setFloat(-1, "unif_advectMultiplier");
            renderer.render(camera, advect, [square]);
            gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
        }
        //4.3 thrid subpass : mac cormack advection writing to actual sediment using intermidiate advection textures
        {
            gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
            gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT0, gl_context.TEXTURE_2D, write_sediment_tex, 0);
            gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT1, gl_context.TEXTURE_2D, null, 0);
            gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT2, gl_context.TEXTURE_2D, null, 0);
            gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT3, gl_context.TEXTURE_2D, null, 0);
            gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER, gl_context.DEPTH_ATTACHMENT, gl_context.RENDERBUFFER, render_buffer);
            gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0, gl_context.COLOR_ATTACHMENT1, gl_context.COLOR_ATTACHMENT2]);
            status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
            if (status !== gl_context.FRAMEBUFFER_COMPLETE) {
                console.log("frame buffer status:" + status.toString());
            }
            gl_context.bindTexture(gl_context.TEXTURE_2D, null);
            gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
            gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, null);
            gl_context.viewport(0, 0, simres, simres);
            gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
            renderer.clear();
            macCormack.use();
            gl_context.activeTexture(gl_context.TEXTURE0);
            gl_context.bindTexture(gl_context.TEXTURE_2D, read_vel_tex);
            gl_context.uniform1i(gl_context.getUniformLocation(macCormack.prog, "vel"), 0);
            gl_context.activeTexture(gl_context.TEXTURE1);
            gl_context.bindTexture(gl_context.TEXTURE_2D, read_sediment_tex);
            gl_context.uniform1i(gl_context.getUniformLocation(macCormack.prog, "sedi"), 1);
            gl_context.activeTexture(gl_context.TEXTURE2);
            gl_context.bindTexture(gl_context.TEXTURE_2D, sediment_advect_a);
            gl_context.uniform1i(gl_context.getUniformLocation(macCormack.prog, "sediadvecta"), 2);
            gl_context.activeTexture(gl_context.TEXTURE3);
            gl_context.bindTexture(gl_context.TEXTURE_2D, sediment_advect_b);
            gl_context.uniform1i(gl_context.getUniformLocation(macCormack.prog, "sediadvectb"), 3);
            renderer.render(camera, macCormack, [square]);
            gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
        }
    }
    else {
        gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
        gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT0, gl_context.TEXTURE_2D, write_sediment_tex, 0);
        gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT1, gl_context.TEXTURE_2D, write_vel_tex, 0);
        gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT2, gl_context.TEXTURE_2D, write_sediment_blend, 0);
        gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT3, gl_context.TEXTURE_2D, null, 0);
        gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER, gl_context.DEPTH_ATTACHMENT, gl_context.RENDERBUFFER, render_buffer);
        gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0, gl_context.COLOR_ATTACHMENT1, gl_context.COLOR_ATTACHMENT2]);
        status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
        if (status !== gl_context.FRAMEBUFFER_COMPLETE) {
            console.log("frame buffer status:" + status.toString());
        }
        gl_context.bindTexture(gl_context.TEXTURE_2D, null);
        gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
        gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, null);
        gl_context.viewport(0, 0, simres, simres);
        gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
        renderer.clear();
        advect.use();
        gl_context.activeTexture(gl_context.TEXTURE0);
        gl_context.bindTexture(gl_context.TEXTURE_2D, read_vel_tex);
        gl_context.uniform1i(gl_context.getUniformLocation(advect.prog, "vel"), 0);
        gl_context.activeTexture(gl_context.TEXTURE1);
        gl_context.bindTexture(gl_context.TEXTURE_2D, read_sediment_tex);
        gl_context.uniform1i(gl_context.getUniformLocation(advect.prog, "sedi"), 1);
        gl_context.activeTexture(gl_context.TEXTURE2);
        gl_context.bindTexture(gl_context.TEXTURE_2D, read_sediment_blend);
        gl_context.uniform1i(gl_context.getUniformLocation(advect.prog, "sediBlend"), 2);
        gl_context.activeTexture(gl_context.TEXTURE3);
        gl_context.bindTexture(gl_context.TEXTURE_2D, read_terrain_tex);
        gl_context.uniform1i(gl_context.getUniformLocation(advect.prog, "terrain"), 3);
        advect.setFloat(1, "unif_advectMultiplier");
        renderer.render(camera, advect, [square]);
        gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    }
    //----------swap sediment map---------
    tmp = read_sediment_blend;
    read_sediment_blend = write_sediment_blend;
    write_sediment_blend = tmp;
    tmp = read_sediment_tex;
    read_sediment_tex = write_sediment_tex;
    write_sediment_tex = tmp;
    tmp = read_vel_tex;
    read_vel_tex = write_vel_tex;
    write_vel_tex = tmp;
    //----------swap sediment map---------
    //////////////////////////////////////////////////////////////////
    // maxslippage map generation
    // 4.5---use terrain map to derive new maxslippage map :
    // hight map -----> max slippage  map
    //////////////////////////////////////////////////////////////////
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT0, gl_context.TEXTURE_2D, write_maxslippage_tex, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT1, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT2, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT3, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER, gl_context.DEPTH_ATTACHMENT, gl_context.RENDERBUFFER, render_buffer);
    gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0]);
    status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
    if (status !== gl_context.FRAMEBUFFER_COMPLETE) {
        console.log("frame buffer status:" + status.toString());
    }
    gl_context.bindTexture(gl_context.TEXTURE_2D, null);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, null);
    gl_context.viewport(0, 0, simres, simres);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    renderer.clear();
    maxslippageheight.use();
    gl_context.activeTexture(gl_context.TEXTURE0);
    gl_context.bindTexture(gl_context.TEXTURE_2D, read_terrain_tex);
    gl_context.uniform1i(gl_context.getUniformLocation(maxslippageheight.prog, "readTerrain"), 0);
    renderer.render(camera, maxslippageheight, [square]);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    //---------------------------------
    //swap maxslippage maps
    tmp = read_maxslippage_tex;
    read_maxslippage_tex = write_maxslippage_tex;
    write_maxslippage_tex = tmp;
    //--------------------------------
    //////////////////////////////////////////////////////////////////
    // thermal terrain flux map generation
    // 5---use velocity map, sediment map to derive new sediment map :
    // hight map -----> terrain flux map
    //////////////////////////////////////////////////////////////////
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT0, gl_context.TEXTURE_2D, write_terrain_flux_tex, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT1, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT2, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT3, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER, gl_context.DEPTH_ATTACHMENT, gl_context.RENDERBUFFER, render_buffer);
    gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0]);
    status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
    if (status !== gl_context.FRAMEBUFFER_COMPLETE) {
        console.log("frame buffer status:" + status.toString());
    }
    gl_context.bindTexture(gl_context.TEXTURE_2D, null);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, null);
    gl_context.viewport(0, 0, simres, simres);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    renderer.clear();
    thermalterrainflux.use();
    gl_context.activeTexture(gl_context.TEXTURE0);
    gl_context.bindTexture(gl_context.TEXTURE_2D, read_terrain_tex);
    gl_context.uniform1i(gl_context.getUniformLocation(thermalterrainflux.prog, "readTerrain"), 0);
    gl_context.activeTexture(gl_context.TEXTURE1);
    gl_context.bindTexture(gl_context.TEXTURE_2D, read_maxslippage_tex);
    gl_context.uniform1i(gl_context.getUniformLocation(thermalterrainflux.prog, "readMaxSlippage"), 1);
    renderer.render(camera, thermalterrainflux, [square]);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    //---------------------------------
    //swap terrain flux maps
    tmp = read_terrain_flux_tex;
    read_terrain_flux_tex = write_terrain_flux_tex;
    write_terrain_flux_tex = tmp;
    //////////////////////////////////////////////////////////////////
    // thermal erosion apply
    // 6---use terrain flux map to derive new terrain map :
    // terrain flux map -----> terrain map
    //////////////////////////////////////////////////////////////////
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT0, gl_context.TEXTURE_2D, write_terrain_tex, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT1, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT2, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT3, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER, gl_context.DEPTH_ATTACHMENT, gl_context.RENDERBUFFER, render_buffer);
    gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0]);
    status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
    if (status !== gl_context.FRAMEBUFFER_COMPLETE) {
        console.log("frame buffer status:" + status.toString());
    }
    gl_context.bindTexture(gl_context.TEXTURE_2D, null);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, null);
    gl_context.viewport(0, 0, simres, simres);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    renderer.clear();
    thermalapply.use();
    gl_context.activeTexture(gl_context.TEXTURE0);
    gl_context.bindTexture(gl_context.TEXTURE_2D, read_terrain_flux_tex);
    gl_context.uniform1i(gl_context.getUniformLocation(thermalapply.prog, "readTerrainFlux"), 0);
    gl_context.activeTexture(gl_context.TEXTURE1);
    gl_context.bindTexture(gl_context.TEXTURE_2D, read_terrain_tex);
    gl_context.uniform1i(gl_context.getUniformLocation(thermalapply.prog, "readTerrain"), 1);
    renderer.render(camera, thermalapply, [square]);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    //---------------swap terrain mao----------------------------
    tmp = read_terrain_tex;
    read_terrain_tex = write_terrain_tex;
    write_terrain_tex = tmp;
    //////////////////////////////////////////////////////////////////
    // water level evaporation at end of each iteration
    // 7---use terrain map to derive new terrain map :
    // terrain map -----> terrain map
    //////////////////////////////////////////////////////////////////
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT0, gl_context.TEXTURE_2D, write_terrain_tex, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT1, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT2, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT3, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER, gl_context.DEPTH_ATTACHMENT, gl_context.RENDERBUFFER, render_buffer);
    gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0]);
    status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
    if (status !== gl_context.FRAMEBUFFER_COMPLETE) {
        console.log("frame buffer status:" + status.toString());
    }
    gl_context.bindTexture(gl_context.TEXTURE_2D, null);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, null);
    gl_context.viewport(0, 0, simres, simres);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    renderer.clear();
    eva.use();
    gl_context.activeTexture(gl_context.TEXTURE0);
    gl_context.bindTexture(gl_context.TEXTURE_2D, read_terrain_tex);
    gl_context.uniform1i(gl_context.getUniformLocation(eva.prog, "terrain"), 0);
    gl_context.uniform1f(gl_context.getUniformLocation(eva.prog, 'evapod'), controls.EvaporationConstant);
    renderer.render(camera, eva, [square]);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    //---------------swap terrain mao----------------------------
    tmp = read_terrain_tex;
    read_terrain_tex = write_terrain_tex;
    write_terrain_tex = tmp;
    //---------------swap terrain mao----------------------------
    //////////////////////////////////////////////////////////////////
    // final average step : average terrain to avoid extremly sharp ridges or ravines
    // 6---use terrain map to derive new terrain map :
    //  terrain map -----> terrain map
    //////////////////////////////////////////////////////////////////
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT0, gl_context.TEXTURE_2D, write_terrain_tex, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT1, gl_context.TEXTURE_2D, terrain_nor, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT2, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT3, gl_context.TEXTURE_2D, null, 0);
    gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER, gl_context.DEPTH_ATTACHMENT, gl_context.RENDERBUFFER, render_buffer);
    gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0, gl_context.COLOR_ATTACHMENT1]);
    status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
    if (status !== gl_context.FRAMEBUFFER_COMPLETE) {
        console.log("frame buffer status:" + status.toString());
    }
    gl_context.bindTexture(gl_context.TEXTURE_2D, null);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, null);
    gl_context.viewport(0, 0, simres, simres);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, frame_buffer);
    renderer.clear();
    ave.use();
    gl_context.activeTexture(gl_context.TEXTURE0);
    gl_context.bindTexture(gl_context.TEXTURE_2D, read_terrain_tex);
    gl_context.uniform1i(gl_context.getUniformLocation(ave.prog, "readTerrain"), 0);
    gl_context.activeTexture(gl_context.TEXTURE1);
    gl_context.bindTexture(gl_context.TEXTURE_2D, read_sediment_tex);
    gl_context.uniform1i(gl_context.getUniformLocation(ave.prog, "readSedi"), 1);
    renderer.render(camera, ave, [square]);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    //---------------swap terrain mao----------------------------
    tmp = read_terrain_tex;
    read_terrain_tex = write_terrain_tex;
    write_terrain_tex = tmp;
    //---------------swap terrain mao----------------------------
}
function LE_create_texture(w, h, samplingType) {
    var new_tex = gl_context.createTexture();
    gl_context.bindTexture(gl_context.TEXTURE_2D, new_tex);
    gl_context.texImage2D(gl_context.TEXTURE_2D, 0, gl_context.RGBA32F, w, h, 0, gl_context.RGBA, gl_context.FLOAT, null);
    gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MIN_FILTER, samplingType);
    gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MAG_FILTER, samplingType);
    gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_S, gl_context.CLAMP_TO_EDGE);
    gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_T, gl_context.CLAMP_TO_EDGE);
    return new_tex;
}
function LE_recreate_texture(w, h, samplingType, texHandle) {
    gl_context.bindTexture(gl_context.TEXTURE_2D, texHandle);
    gl_context.texImage2D(gl_context.TEXTURE_2D, 0, gl_context.RGBA32F, w, h, 0, gl_context.RGBA, gl_context.FLOAT, null);
    gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MIN_FILTER, samplingType);
    gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MAG_FILTER, samplingType);
    gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_S, gl_context.CLAMP_TO_EDGE);
    gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_T, gl_context.CLAMP_TO_EDGE);
}
function LE_create_screen_texture(w, h, samplingType) {
    var new_tex = gl_context.createTexture();
    gl_context.bindTexture(gl_context.TEXTURE_2D, new_tex);
    gl_context.texImage2D(gl_context.TEXTURE_2D, 0, gl_context.RGBA32F, w, h, 0, gl_context.RGBA, gl_context.FLOAT, null);
    gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MIN_FILTER, samplingType);
    gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MAG_FILTER, samplingType);
    gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_S, gl_context.CLAMP_TO_EDGE);
    gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_T, gl_context.CLAMP_TO_EDGE);
    return new_tex;
}
function resizeTextures4Simulation(gl_context) {
    var simulationTextureSampler = gl_context.LINEAR;
    // reacreate all textures related to simulation
    LE_recreate_texture(simres, simres, simulationTextureSampler, read_terrain_tex);
    LE_recreate_texture(simres, simres, simulationTextureSampler, write_terrain_tex);
    LE_recreate_texture(simres, simres, simulationTextureSampler, read_flux_tex);
    LE_recreate_texture(simres, simres, simulationTextureSampler, write_flux_tex);
    LE_recreate_texture(simres, simres, simulationTextureSampler, read_terrain_flux_tex);
    LE_recreate_texture(simres, simres, simulationTextureSampler, write_terrain_flux_tex);
    LE_recreate_texture(simres, simres, simulationTextureSampler, read_maxslippage_tex);
    LE_recreate_texture(simres, simres, simulationTextureSampler, write_maxslippage_tex);
    LE_recreate_texture(simres, simres, simulationTextureSampler, read_vel_tex);
    LE_recreate_texture(simres, simres, simulationTextureSampler, write_vel_tex);
    LE_recreate_texture(simres, simres, simulationTextureSampler, read_sediment_tex);
    LE_recreate_texture(simres, simres, simulationTextureSampler, write_sediment_tex);
    LE_recreate_texture(simres, simres, simulationTextureSampler, terrain_nor);
    LE_recreate_texture(simres, simres, simulationTextureSampler, read_sediment_blend);
    LE_recreate_texture(simres, simres, simulationTextureSampler, write_sediment_blend);
    LE_recreate_texture(simres, simres, simulationTextureSampler, sediment_advect_a);
    LE_recreate_texture(simres, simres, simulationTextureSampler, sediment_advect_b);
    // recreate all framebuffer/renderbuffer related to simulation
    gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, render_buffer);
    gl_context.renderbufferStorage(gl_context.RENDERBUFFER, gl_context.DEPTH_COMPONENT16, simres, simres);
    gl_context.bindTexture(gl_context.TEXTURE_2D, null);
    gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, null);
    // recreate CPU read texture buffer for simulation & User interaction
    HightMapCpuBuf = new Float32Array(simres * simres * 4);
}
function setupFramebufferandtextures(gl_context) {
    var simulationTextureSampler = gl_context.LINEAR;
    //Noise generated data from GPU texture, include population density, water distribution, terrain elevation...
    read_terrain_tex = LE_create_texture(simres, simres, simulationTextureSampler);
    write_terrain_tex = LE_create_texture(simres, simres, simulationTextureSampler);
    read_flux_tex = LE_create_texture(simres, simres, simulationTextureSampler);
    write_flux_tex = LE_create_texture(simres, simres, simulationTextureSampler);
    read_terrain_flux_tex = LE_create_texture(simres, simres, simulationTextureSampler);
    write_terrain_flux_tex = LE_create_texture(simres, simres, simulationTextureSampler);
    read_maxslippage_tex = LE_create_texture(simres, simres, simulationTextureSampler);
    write_maxslippage_tex = LE_create_texture(simres, simres, simulationTextureSampler);
    read_vel_tex = LE_create_texture(simres, simres, simulationTextureSampler);
    write_vel_tex = LE_create_texture(simres, simres, simulationTextureSampler);
    read_sediment_tex = LE_create_texture(simres, simres, simulationTextureSampler);
    write_sediment_tex = LE_create_texture(simres, simres, simulationTextureSampler);
    terrain_nor = LE_create_texture(simres, simres, simulationTextureSampler);
    read_sediment_blend = LE_create_texture(simres, simres, simulationTextureSampler);
    write_sediment_blend = LE_create_texture(simres, simres, simulationTextureSampler);
    sediment_advect_a = LE_create_texture(simres, simres, simulationTextureSampler);
    sediment_advect_b = LE_create_texture(simres, simres, simulationTextureSampler);
    shadowMap_tex = LE_create_screen_texture(shadowMapResolution, shadowMapResolution, gl_context.LINEAR);
    scene_depth_tex = LE_create_screen_texture(window.innerWidth, window.innerHeight, gl_context.LINEAR);
    bilateral_filter_horizontal_tex = LE_create_screen_texture(window.innerWidth, window.innerHeight, gl_context.LINEAR);
    bilateral_filter_vertical_tex = LE_create_screen_texture(window.innerWidth, window.innerHeight, gl_context.LINEAR);
    color_pass_tex = LE_create_screen_texture(window.innerWidth, window.innerHeight, gl_context.LINEAR);
    color_pass_reflection_tex = LE_create_screen_texture(window.innerWidth, window.innerHeight, gl_context.LINEAR);
    scatter_pass_tex = LE_create_screen_texture(window.innerWidth, window.innerHeight, gl_context.LINEAR);
    shadowMap_frame_buffer = gl_context.createFramebuffer();
    shadowMap_render_buffer = gl_context.createRenderbuffer();
    gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, shadowMap_render_buffer);
    gl_context.renderbufferStorage(gl_context.RENDERBUFFER, gl_context.DEPTH_COMPONENT16, shadowMapResolution, shadowMapResolution);
    deferred_frame_buffer = gl_context.createFramebuffer();
    deferred_render_buffer = gl_context.createRenderbuffer();
    gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, deferred_render_buffer);
    gl_context.renderbufferStorage(gl_context.RENDERBUFFER, gl_context.DEPTH_COMPONENT16, window.innerWidth, window.innerHeight);
    frame_buffer = gl_context.createFramebuffer();
    render_buffer = gl_context.createRenderbuffer();
    gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, render_buffer);
    gl_context.renderbufferStorage(gl_context.RENDERBUFFER, gl_context.DEPTH_COMPONENT16, simres, simres);
    gl_context.bindTexture(gl_context.TEXTURE_2D, null);
    gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
    gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, null);
}
function SimulationStep(curstep, flow, waterhight, veladvect, sediment, advect, macCormack, rains, evapo, average, thermalterrainflux, thermalapply, maxslippageheight, renderer, gl_context, camera) {
    if (PauseGeneration)
        return true;
    else {
        SimulatePerStep(renderer, gl_context, camera, flow, waterhight, veladvect, sediment, advect, macCormack, rains, evapo, average, thermalterrainflux, thermalapply, maxslippageheight);
    }
    return false;
}
function handleInteraction(buttons, x, y) {
    lastX = x;
    lastY = y;
    //console.log(x + ' ' + y);
}
function onKeyDown(event) {
    if (event.key == 'c') {
        controls.brushPressed = 1;
    }
    else {
        controls.brushPressed = 0;
    }
    if (event.key == 'r') {
        controls.pbrushOn = controls.pbrushOn == 0 ? 1 : 0;
        controls.posPerm = controls.posTemp;
        controls.pbrushData = gl_matrix_1.vec2.fromValues(controls.brushSize, controls.brushStrenth);
    }
    if (event.key == 'p') {
        controls.pbrushOn = 0;
    }
}
function onKeyUp(event) {
    if (event.key == 'c') {
        controls.brushPressed = 0;
    }
}
function main() {
    // Initial display for framerate
    var stats = Stats();
    stats.setMode(0);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.domElement);
    //HightMapCpuBuf = new Float32Array(simresolution * simresolution * 4);
    // Add controls to the gui
    var gui = new DAT.GUI();
    var simcontrols = gui.addFolder('Simulation Controls');
    simcontrols.add(controls, 'Pause/Resume');
    simcontrols.add(controls, 'SimulationSpeed', { fast: 3, medium: 2, slow: 1 });
    simcontrols.open();
    var terrainParameters = gui.addFolder('Terrain Parameters');
    terrainParameters.add(controls, 'SimulationResolution', { 256: 256, 512: 512, 1024: 1024, 2048: 2048 });
    terrainParameters.add(controls, 'TerrainScale', 0.1, 4.0);
    terrainParameters.add(controls, 'TerrainHeight', 1.0, 5.0);
    terrainParameters.add(controls, 'TerrainMask', { OFF: 0, Sphere: 1, slope: 2 });
    terrainParameters.add(controls, 'TerrainBaseType', { ordinaryFBM: 0, domainWarp: 1, terrace: 2, voroni: 3, ridgeNoise: 4 });
    terrainParameters.add(controls, 'ResetTerrain');
    terrainParameters.open();
    var erosionpara = gui.addFolder('Erosion Parameters');
    var RainErosionPara = erosionpara.addFolder('Rain Erosion Parameters');
    RainErosionPara.add(controls, 'RainErosion');
    RainErosionPara.add(controls, 'RainErosionStrength', 0.1, 3.0);
    RainErosionPara.add(controls, 'RainErosionDropSize', 0.1, 3.0);
    RainErosionPara.close();
    erosionpara.add(controls, 'ErosionMode', { RiverMode: 0, MountainMode: 1, PolygonalMode: 2 });
    erosionpara.add(controls, 'VelocityAdvectionMag', 0.0, 0.5);
    erosionpara.add(controls, 'EvaporationConstant', 0.0001, 0.08);
    erosionpara.add(controls, 'Kc', 0.01, 0.5);
    erosionpara.add(controls, 'Ks', 0.001, 0.2);
    erosionpara.add(controls, 'Kd', 0.0001, 0.1);
    //erosionpara.add(controls,'AdvectionSpeedScaling', 0.1, 1.0);
    erosionpara.add(controls, 'TerrainDebug', { noDebugView: 0, sediment: 1, velocity: 2, velocityHeatmap: 9, terrain: 3, flux: 4, terrainflux: 5, maxslippage: 6, flowMap: 7, spikeDiffusion: 8 });
    erosionpara.add(controls, 'AdvectionMethod', { Semilagrangian: 0, MacCormack: 1 });
    erosionpara.add(controls, 'VelocityMultiplier', 1.0, 5.0);
    erosionpara.open();
    var thermalerosionpara = gui.addFolder("Thermal Erosion Parameters");
    thermalerosionpara.add(controls, 'thermalTalusAngleScale', 1.0, 10.0);
    thermalerosionpara.add(controls, 'thermalErosionScale', 0.0, 5.0);
    //thermalerosionpara.open();
    var terraineditor = gui.addFolder('Terrain Editor');
    terraineditor.add(controls, 'brushType', { NoBrush: 0, TerrainBrush: 1, WaterBrush: 2 });
    terraineditor.add(controls, 'brushSize', 0.1, 20.0);
    terraineditor.add(controls, 'brushStrenth', 0.1, 2.0);
    terraineditor.add(controls, 'brushOperation', { Add: 0, Subtract: 1 });
    terraineditor.open();
    var renderingpara = gui.addFolder('Rendering Parameters');
    renderingpara.add(controls, 'WaterTransparency', 0.0, 1.0);
    renderingpara.add(controls, 'TerrainPlatte', { AlpineMtn: 0, Desert: 1, Jungle: 2 });
    renderingpara.add(controls, 'SnowRange', 0.0, 100.0);
    renderingpara.add(controls, 'ForestRange', 0.0, 50.0);
    renderingpara.add(controls, 'ShowFlowTrace');
    renderingpara.add(controls, 'SedimentTrace');
    renderingpara.add(controls, 'showScattering');
    renderingpara.add(controls, 'enableBilateralBlur');
    var renderingparalightpos = renderingpara.addFolder('sunPos/Dir');
    renderingparalightpos.add(controls, 'lightPosX', -1.0, 1.0);
    renderingparalightpos.add(controls, 'lightPosY', 0.0, 1.0);
    renderingparalightpos.add(controls, 'lightPosZ', -1.0, 1.0);
    renderingparalightpos.open();
    renderingpara.open();
    // get canvas and webgl context
    var canvas = document.getElementById('canvas');
    gl_context = canvas.getContext('webgl2');
    clientWidth = canvas.clientWidth;
    clientHeight = canvas.clientHeight;
    mouseChange(canvas, handleInteraction);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    if (!gl_context) {
        alert('WebGL 2 not supported!');
    }
    var extensions = gl_context.getSupportedExtensions();
    for (var e in extensions) {
        console.log(e);
    }
    if (!gl_context.getExtension('OES_texture_float_linear')) {
        console.log("float texture not supported");
    }
    if (!gl_context.getExtension('OES_texture_float')) {
        console.log("no float texutre!!!?? y am i here?");
    }
    if (!gl_context.getExtension('EXT_color_buffer_float')) {
        console.log("cant render to float texture ");
    }
    // `setGL` is a function imported above which sets the value of `gl_context` in the `globals.ts` module.
    // Later, we can import `gl_context` from `globals.ts` to access it
    (0, globals_1.setGL)(gl_context);
    // Initial call to load scene
    loadScene();
    var camera = new Camera_1["default"](gl_matrix_1.vec3.fromValues(-0.18, 0.3, 0.6), gl_matrix_1.vec3.fromValues(0, 0, 0));
    var renderer = new OpenGLRenderer_1["default"](canvas);
    renderer.setClearColor(0.0, 0.0, 0.0, 0);
    gl_context.enable(gl_context.DEPTH_TEST);
    setupFramebufferandtextures(gl_context);
    //=================================================================
    //load in the shaders
    var lambert = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/terrain-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/terrain-frag.glsl')),
    ]);
    var flat = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
    ]);
    var noiseterrain = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/quad-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/initial-frag.glsl')),
    ]);
    var flow = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/quad-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/flow-frag.glsl')),
    ]);
    var waterhight = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/quad-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/alterwaterhight-frag.glsl')),
    ]);
    var sediment = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/quad-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/sediment-frag.glsl')),
    ]);
    var sediadvect = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/quad-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/sediadvect-frag.glsl')),
    ]);
    var macCormack = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/quad-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/maccormack-frag.glsl')),
    ]);
    var rains = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/quad-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/rain-frag.glsl')),
    ]);
    var evaporation = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/quad-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/eva-frag.glsl')),
    ]);
    var average = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/quad-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/average-frag.glsl')),
    ]);
    var clean = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/quad-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/clean-frag.glsl')),
    ]);
    var water = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/water-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/water-frag.glsl')),
    ]);
    var thermalterrainflux = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/quad-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/thermalterrainflux-frag.glsl')),
    ]);
    var thermalapply = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/quad-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/thermalapply-frag.glsl')),
    ]);
    var maxslippageheight = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/quad-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/maxslippageheight-frag.glsl')),
    ]);
    var shadowMapShader = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/shadowmap-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/shadowmap-frag.glsl')),
    ]);
    var sceneDepthShader = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/terrain-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/sceneDepth-frag.glsl')),
    ]);
    var combinedShader = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/quad-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/combine-frag.glsl')),
    ]);
    var bilateralBlur = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/quad-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/bilateralBlur-frag.glsl')),
    ]);
    var veladvect = new ShaderProgram_1["default"]([
        new ShaderProgram_1.Shader(gl_context.VERTEX_SHADER, require('./shaders/quad-vert.glsl')),
        new ShaderProgram_1.Shader(gl_context.FRAGMENT_SHADER, require('./shaders/veladvect-frag.glsl')),
    ]);
    var timer = 0;
    function cleanUpTextures() {
        Render2Texture(renderer, gl_context, camera, clean, read_terrain_tex);
        Render2Texture(renderer, gl_context, camera, clean, read_vel_tex);
        Render2Texture(renderer, gl_context, camera, clean, read_flux_tex);
        Render2Texture(renderer, gl_context, camera, clean, read_terrain_flux_tex);
        Render2Texture(renderer, gl_context, camera, clean, write_terrain_flux_tex);
        Render2Texture(renderer, gl_context, camera, clean, read_maxslippage_tex);
        Render2Texture(renderer, gl_context, camera, clean, write_maxslippage_tex);
        Render2Texture(renderer, gl_context, camera, clean, read_sediment_tex);
        Render2Texture(renderer, gl_context, camera, clean, write_terrain_tex);
        Render2Texture(renderer, gl_context, camera, clean, write_vel_tex);
        Render2Texture(renderer, gl_context, camera, clean, write_flux_tex);
        Render2Texture(renderer, gl_context, camera, clean, write_sediment_tex);
        Render2Texture(renderer, gl_context, camera, clean, terrain_nor);
        Render2Texture(renderer, gl_context, camera, clean, read_sediment_blend);
        Render2Texture(renderer, gl_context, camera, clean, write_sediment_blend);
        Render2Texture(renderer, gl_context, camera, clean, sediment_advect_a);
        Render2Texture(renderer, gl_context, camera, clean, sediment_advect_b);
    }
    function rayCast(ro, rd) {
        var res = gl_matrix_1.vec2.fromValues(-10.0, -10.0);
        var cur = ro;
        var step = 0.01;
        for (var i = 0; i < 100; ++i) {
            var curTexSpace = gl_matrix_1.vec2.fromValues((cur[0] + .50) / 1.0, (cur[2] + .50) / 1.0);
            var scaledTexSpace = gl_matrix_1.vec2.fromValues(curTexSpace[0] * simres, curTexSpace[1] * simres);
            gl_matrix_1.vec2.floor(scaledTexSpace, scaledTexSpace);
            var hvalcoordinate = scaledTexSpace[1] * simres * 4 + scaledTexSpace[0] * 4 + 0;
            var hval = HightMapCpuBuf[hvalcoordinate];
            if (cur[1] < hval / simres) {
                res = curTexSpace;
                //console.log(curTexSpace);
                break;
            }
            var rdscaled = gl_matrix_1.vec3.fromValues(rd[0] * step, rd[1] * step, rd[2] * step);
            gl_matrix_1.vec3.add(cur, cur, rdscaled);
        }
        return res;
    }
    function tick() {
        // ================ ray casting ===================
        //===================================================
        var iclientWidth = window.innerWidth;
        var iclientHeight = window.innerHeight;
        var screenMouseX = lastX / iclientWidth;
        var screenMouseY = lastY / iclientHeight;
        //console.log(screenMouseX + ' ' + screenMouseY);
        //console.log(clientHeight + ' ' + clientWidth);
        var viewProj = gl_matrix_1.mat4.create();
        var invViewProj = gl_matrix_1.mat4.create();
        gl_matrix_1.mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
        gl_matrix_1.mat4.invert(invViewProj, viewProj);
        var mousePoint = gl_matrix_1.vec4.fromValues(2.0 * screenMouseX - 1.0, 1.0 - 2.0 * screenMouseY, -1.0, 1.0);
        var mousePointEnd = gl_matrix_1.vec4.fromValues(2.0 * screenMouseX - 1.0, 1.0 - 2.0 * screenMouseY, -0.0, 1.0);
        gl_matrix_1.vec4.transformMat4(mousePoint, mousePoint, invViewProj);
        gl_matrix_1.vec4.transformMat4(mousePointEnd, mousePointEnd, invViewProj);
        mousePoint[0] /= mousePoint[3];
        mousePoint[1] /= mousePoint[3];
        mousePoint[2] /= mousePoint[3];
        mousePoint[3] /= mousePoint[3];
        mousePointEnd[0] /= mousePointEnd[3];
        mousePointEnd[1] /= mousePointEnd[3];
        mousePointEnd[2] /= mousePointEnd[3];
        mousePointEnd[3] /= mousePointEnd[3];
        var dir = gl_matrix_1.vec3.fromValues(mousePointEnd[0] - mousePoint[0], mousePointEnd[1] - mousePoint[1], mousePointEnd[2] - mousePoint[2]);
        gl_matrix_1.vec3.normalize(dir, dir);
        var ro = gl_matrix_1.vec3.fromValues(mousePoint[0], mousePoint[1], mousePoint[2]);
        //==========set initial terrain uniforms=================
        timer++;
        noiseterrain.setTime(timer);
        noiseterrain.setTerrainHeight(controls.TerrainHeight);
        noiseterrain.setTerrainScale(controls.TerrainScale);
        noiseterrain.setInt(controls.TerrainMask, "u_TerrainMask");
        gl_context.uniform1i(gl_context.getUniformLocation(noiseterrain.prog, "u_terrainBaseType"), controls.TerrainBaseType);
        if (TerrainGeometryDirty) {
            //=============clean up all simulation textures===================
            cleanUpTextures();
            //=============recreate base terrain textures=====================
            Render2Texture(renderer, gl_context, camera, noiseterrain, read_terrain_tex);
            Render2Texture(renderer, gl_context, camera, noiseterrain, write_terrain_tex);
            TerrainGeometryDirty = false;
        }
        //ray cast happens here
        var pos = gl_matrix_1.vec2.fromValues(0.0, 0.0);
        pos = rayCast(ro, dir);
        controls.posTemp = pos;
        //===================per tick uniforms==================
        flat.setTime(timer);
        gl_context.uniform1f(gl_context.getUniformLocation(flat.prog, "u_far"), camera.far);
        gl_context.uniform1f(gl_context.getUniformLocation(flat.prog, "u_near"), camera.near);
        gl_context.uniform3fv(gl_context.getUniformLocation(flat.prog, "unif_LightPos"), gl_matrix_1.vec3.fromValues(controls.lightPosX, controls.lightPosY, controls.lightPosZ));
        water.setWaterTransparency(controls.WaterTransparency);
        water.setSimres(simres);
        gl_context.uniform1f(gl_context.getUniformLocation(water.prog, "u_far"), camera.far);
        gl_context.uniform1f(gl_context.getUniformLocation(water.prog, "u_near"), camera.near);
        gl_context.uniform3fv(gl_context.getUniformLocation(water.prog, "unif_LightPos"), gl_matrix_1.vec3.fromValues(controls.lightPosX, controls.lightPosY, controls.lightPosZ));
        lambert.setTerrainDebug(controls.TerrainDebug);
        lambert.setMouseWorldPos(mousePoint);
        lambert.setMouseWorldDir(dir);
        lambert.setBrushSize(controls.brushSize);
        lambert.setBrushType(controls.brushType);
        lambert.setBrushPos(pos);
        lambert.setSimres(simres);
        lambert.setFloat(controls.SnowRange, "u_SnowRange");
        lambert.setFloat(controls.ForestRange, "u_ForestRange");
        lambert.setInt(controls.TerrainPlatte, "u_TerrainPlatte");
        lambert.setInt(controls.ShowFlowTrace ? 0 : 1, "u_FlowTrace");
        lambert.setInt(controls.SedimentTrace ? 0 : 1, "u_SedimentTrace");
        lambert.setVec2(controls.posPerm, 'u_permanentPos');
        lambert.setInt(controls.pbrushOn, "u_pBrushOn");
        lambert.setVec2(controls.pbrushData, "u_PBrushData");
        gl_context.uniform3fv(gl_context.getUniformLocation(lambert.prog, "unif_LightPos"), gl_matrix_1.vec3.fromValues(controls.lightPosX, controls.lightPosY, controls.lightPosZ));
        sceneDepthShader.setSimres(simres);
        rains.setMouseWorldPos(mousePoint);
        rains.setMouseWorldDir(dir);
        rains.setBrushSize(controls.brushSize);
        rains.setBrushStrength(controls.brushStrenth);
        rains.setBrushType(controls.brushType);
        rains.setBrushPressed(controls.brushPressed);
        rains.setInt(controls.pbrushOn, "u_pBrushOn");
        rains.setVec2(controls.pbrushData, "u_PBrushData");
        rains.setBrushPos(pos);
        rains.setBrushOperation(controls.brushOperation);
        rains.setSpawnPos(gl_matrix_1.vec2.fromValues(controls.spawnposx, controls.spawnposy));
        rains.setVec2(controls.posPerm, 'u_permanentPos');
        rains.setTime(timer);
        gl_context.uniform1i(gl_context.getUniformLocation(rains.prog, "u_RainErosion"), controls.RainErosion ? 1 : 0);
        rains.setFloat(controls.RainErosionStrength, 'u_RainErosionStrength');
        rains.setFloat(controls.RainErosionDropSize, 'u_RainErosionDropSize');
        flow.setPipeLen(controls.pipelen);
        flow.setSimres(simres);
        flow.setTimestep(controls.timestep);
        flow.setPipeArea(controls.pipeAra);
        waterhight.setPipeLen(controls.pipelen);
        waterhight.setSimres(simres);
        waterhight.setTimestep(controls.timestep);
        waterhight.setPipeArea(controls.pipeAra);
        waterhight.setFloat(controls.VelocityMultiplier, 'u_VelMult');
        waterhight.setFloat(controls.VelocityAdvectionMag, 'u_VelAdvMag');
        waterhight.setTime(timer);
        sediment.setSimres(simres);
        sediment.setPipeLen(controls.pipelen);
        sediment.setKc(controls.Kc);
        sediment.setKs(controls.Ks);
        sediment.setKd(controls.Kd);
        sediment.setTimestep(controls.timestep);
        sediment.setTime(timer);
        sediadvect.setSimres(simres);
        sediadvect.setPipeLen(controls.pipelen);
        sediadvect.setKc(controls.Kc);
        sediadvect.setKs(controls.Ks);
        sediadvect.setKd(controls.Kd);
        sediadvect.setTimestep(controls.timestep);
        sediadvect.setFloat(controls.AdvectionSpeedScaling, "unif_advectionSpeedScale");
        veladvect.setSimres(simres);
        veladvect.setPipeLen(controls.pipelen);
        veladvect.setKc(controls.Kc);
        veladvect.setKs(controls.Ks);
        veladvect.setKd(controls.Kd);
        veladvect.setTimestep(controls.timestep);
        macCormack.setSimres(simres);
        macCormack.setPipeLen(controls.pipelen);
        macCormack.setKc(controls.Kc);
        macCormack.setKs(controls.Ks);
        macCormack.setKd(controls.Kd);
        macCormack.setTimestep(controls.timestep);
        macCormack.setFloat(controls.AdvectionSpeedScaling, "unif_advectionSpeedScale");
        thermalterrainflux.setSimres(simres);
        thermalterrainflux.setPipeLen(controls.pipelen);
        thermalterrainflux.setTimestep(controls.timestep);
        thermalterrainflux.setPipeArea(controls.pipeAra);
        gl_context.uniform1f(gl_context.getUniformLocation(thermalterrainflux.prog, "unif_thermalRate"), controls.thermalRate);
        thermalapply.setSimres(simres);
        thermalapply.setPipeLen(controls.pipelen);
        thermalapply.setTimestep(controls.timestep);
        thermalapply.setPipeArea(controls.pipeAra);
        gl_context.uniform1f(gl_context.getUniformLocation(thermalapply.prog, "unif_thermalErosionScale"), controls.thermalErosionScale);
        maxslippageheight.setSimres(simres);
        maxslippageheight.setPipeLen(controls.pipelen);
        maxslippageheight.setTimestep(controls.timestep);
        maxslippageheight.setPipeArea(controls.pipeAra);
        maxslippageheight.setFloat(controls.thermalTalusAngleScale, "unif_TalusScale");
        if (controls.RainErosion) {
            maxslippageheight.setInt(1, 'unif_rainMode');
        }
        else {
            maxslippageheight.setInt(0, 'unif_rainMode');
        }
        average.setSimres(simres);
        average.setInt(controls.ErosionMode, 'unif_ErosionMode');
        if (controls.RainErosion) {
            average.setInt(1, 'unif_rainMode');
        }
        else {
            average.setInt(0, 'unif_rainMode');
        }
        camera.update();
        stats.begin();
        //==========================  we begin simulation from now ===========================================
        for (var i = 0; i < controls.SimulationSpeed; i++) {
            SimulationStep(SimFramecnt, flow, waterhight, veladvect, sediment, sediadvect, macCormack, rains, evaporation, average, thermalterrainflux, thermalapply, maxslippageheight, renderer, gl_context, camera);
            SimFramecnt++;
        }
        gl_context.viewport(0, 0, window.innerWidth, window.innerHeight);
        renderer.clear();
        //========================== we enter a series of render pass from now ================================
        //========================== pass 1 : render shadow map pass=====================================
        gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, shadowMap_frame_buffer);
        gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT0, gl_context.TEXTURE_2D, shadowMap_tex, 0);
        gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER, gl_context.DEPTH_ATTACHMENT, gl_context.RENDERBUFFER, shadowMap_render_buffer);
        gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0]);
        var status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
        if (status !== gl_context.FRAMEBUFFER_COMPLETE) {
            console.log("frame buffer status:" + status.toString());
        }
        gl_context.bindTexture(gl_context.TEXTURE_2D, null);
        gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
        gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, null);
        gl_context.viewport(0, 0, shadowMapResolution, shadowMapResolution);
        gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, shadowMap_frame_buffer);
        renderer.clear(); // clear when attached to shadow map
        shadowMapShader.use();
        gl_context.activeTexture(gl_context.TEXTURE0);
        gl_context.bindTexture(gl_context.TEXTURE_2D, read_terrain_tex);
        gl_context.uniform1i(gl_context.getUniformLocation(shadowMapShader.prog, "hightmap"), 0);
        gl_context.activeTexture(gl_context.TEXTURE1);
        gl_context.bindTexture(gl_context.TEXTURE_2D, read_sediment_tex);
        gl_context.uniform1i(gl_context.getUniformLocation(shadowMapShader.prog, "sedimap"), 1);
        var lightViewMat = gl_matrix_1.mat4.create();
        var lightProjMat = gl_matrix_1.mat4.create();
        lightProjMat = gl_matrix_1.mat4.ortho(lightProjMat, -1.6, 1.6, -1.6, 1.6, 0, 100);
        lightViewMat = gl_matrix_1.mat4.lookAt(lightViewMat, [controls.lightPosX, controls.lightPosY, controls.lightPosZ], [0, 0, 0], [0, 1, 0]);
        gl_context.uniformMatrix4fv(gl_context.getUniformLocation(shadowMapShader.prog, 'u_proj'), false, lightProjMat);
        gl_context.uniformMatrix4fv(gl_context.getUniformLocation(shadowMapShader.prog, 'u_view'), false, lightViewMat);
        shadowMapShader.setSimres(simres);
        renderer.render(camera, shadowMapShader, [plane]);
        gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
        //=========================== pass 2 :  render scene depth tex ================================
        sceneDepthShader.use();
        gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, deferred_frame_buffer);
        gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT0, gl_context.TEXTURE_2D, scene_depth_tex, 0);
        gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER, gl_context.DEPTH_ATTACHMENT, gl_context.RENDERBUFFER, deferred_render_buffer);
        gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0]);
        status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
        if (status !== gl_context.FRAMEBUFFER_COMPLETE) {
            console.log("frame buffer status:" + status.toString());
        }
        renderer.clear(); // clear when attached to scene depth map
        gl_context.viewport(0, 0, window.innerWidth, window.innerHeight);
        renderer.render(camera, sceneDepthShader, [
            plane,
        ]);
        gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
        //============================= pass 3 : render terrain and water geometry ================================================
        //============ terrain geometry =========
        gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, deferred_frame_buffer);
        gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT0, gl_context.TEXTURE_2D, color_pass_tex, 0);
        gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT1, gl_context.TEXTURE_2D, color_pass_reflection_tex, 0);
        gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER, gl_context.DEPTH_ATTACHMENT, gl_context.RENDERBUFFER, deferred_render_buffer);
        gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0, gl_context.COLOR_ATTACHMENT1]);
        status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
        if (status !== gl_context.FRAMEBUFFER_COMPLETE) {
            console.log("frame buffer status:" + status.toString());
        }
        renderer.clear();
        lambert.use();
        gl_context.viewport(0, 0, window.innerWidth, window.innerHeight);
        //plane.setDrawMode(gl_context.LINE_STRIP);
        gl_context.activeTexture(gl_context.TEXTURE0);
        gl_context.bindTexture(gl_context.TEXTURE_2D, read_terrain_tex);
        var PingUniform = gl_context.getUniformLocation(lambert.prog, "hightmap");
        gl_context.uniform1i(PingUniform, 0);
        gl_context.activeTexture(gl_context.TEXTURE1);
        gl_context.bindTexture(gl_context.TEXTURE_2D, terrain_nor);
        var norUniform = gl_context.getUniformLocation(lambert.prog, "normap");
        gl_context.uniform1i(norUniform, 1);
        gl_context.activeTexture(gl_context.TEXTURE2);
        gl_context.bindTexture(gl_context.TEXTURE_2D, read_sediment_tex);
        var sediUniform = gl_context.getUniformLocation(lambert.prog, "sedimap");
        gl_context.uniform1i(sediUniform, 2);
        gl_context.activeTexture(gl_context.TEXTURE3);
        gl_context.bindTexture(gl_context.TEXTURE_2D, read_vel_tex);
        var velUniform = gl_context.getUniformLocation(lambert.prog, "velmap");
        gl_context.uniform1i(velUniform, 3);
        gl_context.activeTexture(gl_context.TEXTURE4);
        gl_context.bindTexture(gl_context.TEXTURE_2D, read_flux_tex);
        var fluxUniform = gl_context.getUniformLocation(lambert.prog, "fluxmap");
        gl_context.uniform1i(fluxUniform, 4);
        gl_context.activeTexture(gl_context.TEXTURE5);
        gl_context.bindTexture(gl_context.TEXTURE_2D, read_terrain_flux_tex);
        var terrainfluxUniform = gl_context.getUniformLocation(lambert.prog, "terrainfluxmap");
        gl_context.uniform1i(terrainfluxUniform, 5);
        gl_context.activeTexture(gl_context.TEXTURE6);
        gl_context.bindTexture(gl_context.TEXTURE_2D, read_maxslippage_tex);
        var terrainslippageUniform = gl_context.getUniformLocation(lambert.prog, "maxslippagemap");
        gl_context.uniform1i(terrainslippageUniform, 6);
        gl_context.activeTexture(gl_context.TEXTURE7);
        gl_context.bindTexture(gl_context.TEXTURE_2D, read_sediment_blend);
        gl_context.uniform1i(gl_context.getUniformLocation(lambert.prog, "sediBlend"), 7);
        gl_context.activeTexture(gl_context.TEXTURE8);
        gl_context.bindTexture(gl_context.TEXTURE_2D, shadowMap_tex);
        gl_context.uniform1i(gl_context.getUniformLocation(lambert.prog, "shadowMap"), 8);
        gl_context.activeTexture(gl_context.TEXTURE9);
        gl_context.bindTexture(gl_context.TEXTURE_2D, scene_depth_tex);
        gl_context.uniform1i(gl_context.getUniformLocation(lambert.prog, "sceneDepth"), 9);
        gl_context.uniformMatrix4fv(gl_context.getUniformLocation(lambert.prog, 'u_sproj'), false, lightProjMat);
        gl_context.uniformMatrix4fv(gl_context.getUniformLocation(lambert.prog, 'u_sview'), false, lightViewMat);
        renderer.render(camera, lambert, [
            plane,
        ]);
        // =============== water =====================
        gl_context.enable(gl_context.BLEND);
        gl_context.blendFunc(gl_context.SRC_ALPHA, gl_context.ONE_MINUS_SRC_ALPHA);
        water.use();
        gl_context.activeTexture(gl_context.TEXTURE0);
        gl_context.bindTexture(gl_context.TEXTURE_2D, read_terrain_tex);
        PingUniform = gl_context.getUniformLocation(water.prog, "hightmap");
        gl_context.uniform1i(PingUniform, 0);
        gl_context.activeTexture(gl_context.TEXTURE1);
        gl_context.bindTexture(gl_context.TEXTURE_2D, terrain_nor);
        norUniform = gl_context.getUniformLocation(water.prog, "normap");
        gl_context.uniform1i(norUniform, 1);
        gl_context.activeTexture(gl_context.TEXTURE2);
        gl_context.bindTexture(gl_context.TEXTURE_2D, read_sediment_tex);
        sediUniform = gl_context.getUniformLocation(water.prog, "sedimap");
        gl_context.uniform1i(sediUniform, 2);
        gl_context.activeTexture(gl_context.TEXTURE3);
        gl_context.bindTexture(gl_context.TEXTURE_2D, scene_depth_tex);
        gl_context.uniform1i(gl_context.getUniformLocation(water.prog, "sceneDepth"), 3);
        gl_context.activeTexture(gl_context.TEXTURE4);
        gl_context.bindTexture(gl_context.TEXTURE_2D, color_pass_reflection_tex);
        gl_context.uniform1i(gl_context.getUniformLocation(water.prog, "colorReflection"), 4);
        renderer.render(camera, water, [
            plane,
        ]);
        gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
        gl_context.blendFunc(gl_context.SRC_ALPHA, gl_context.ONE_MINUS_SRC_ALPHA);
        // ======================== pass 4 : back ground & post processing & rayleigh mie scattering ==================================
        gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, deferred_frame_buffer);
        gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT0, gl_context.TEXTURE_2D, scatter_pass_tex, 0);
        gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER, gl_context.DEPTH_ATTACHMENT, gl_context.RENDERBUFFER, deferred_render_buffer);
        gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0]);
        status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
        if (status !== gl_context.FRAMEBUFFER_COMPLETE) {
            console.log("frame buffer status:" + status.toString());
        }
        renderer.clear(); // clear when attached to scene depth map
        gl_context.viewport(0, 0, window.innerWidth, window.innerHeight);
        flat.use();
        gl_context.enable(gl_context.DEPTH_TEST);
        gl_context.depthFunc(gl_context.LESS);
        gl_context.enable(gl_context.BLEND);
        gl_context.blendFunc(gl_context.SRC_ALPHA, gl_context.ONE_MINUS_SRC_ALPHA);
        gl_context.activeTexture(gl_context.TEXTURE0);
        gl_context.bindTexture(gl_context.TEXTURE_2D, read_sediment_tex);
        gl_context.uniform1i(gl_context.getUniformLocation(flat.prog, "hightmap"), 0);
        gl_context.activeTexture(gl_context.TEXTURE1);
        gl_context.bindTexture(gl_context.TEXTURE_2D, scene_depth_tex);
        gl_context.uniform1i(gl_context.getUniformLocation(flat.prog, "sceneDepth"), 1);
        gl_context.activeTexture(gl_context.TEXTURE2);
        gl_context.bindTexture(gl_context.TEXTURE_2D, shadowMap_tex);
        gl_context.uniform1i(gl_context.getUniformLocation(flat.prog, "shadowMap"), 2);
        gl_context.uniformMatrix4fv(gl_context.getUniformLocation(flat.prog, 'u_sproj'), false, lightProjMat);
        gl_context.uniformMatrix4fv(gl_context.getUniformLocation(flat.prog, 'u_sview'), false, lightViewMat);
        gl_context.uniform1i(gl_context.getUniformLocation(flat.prog, "u_showScattering"), controls.showScattering ? 1 : 0);
        renderer.render(camera, flat, [
            square,
        ]);
        gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
        // ======================== pass 5 : bilateral blurring pass ==================================
        if (controls.enableBilateralBlur) {
            var NumBlurPass = 4;
            for (var i = 0; i < NumBlurPass; ++i) {
                gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, deferred_frame_buffer);
                gl_context.framebufferTexture2D(gl_context.FRAMEBUFFER, gl_context.COLOR_ATTACHMENT0, gl_context.TEXTURE_2D, bilateral_filter_horizontal_tex, 0);
                gl_context.framebufferRenderbuffer(gl_context.FRAMEBUFFER, gl_context.DEPTH_ATTACHMENT, gl_context.RENDERBUFFER, deferred_render_buffer);
                gl_context.drawBuffers([gl_context.COLOR_ATTACHMENT0]);
                status = gl_context.checkFramebufferStatus(gl_context.FRAMEBUFFER);
                if (status !== gl_context.FRAMEBUFFER_COMPLETE) {
                    console.log("frame buffer status:" + status.toString());
                }
                renderer.clear(); // clear when attached to scene depth map
                bilateralBlur.use();
                gl_context.activeTexture(gl_context.TEXTURE0);
                if (i == 0) {
                    gl_context.bindTexture(gl_context.TEXTURE_2D, scatter_pass_tex);
                }
                else {
                    gl_context.bindTexture(gl_context.TEXTURE_2D, bilateral_filter_vertical_tex);
                }
                gl_context.uniform1i(gl_context.getUniformLocation(bilateralBlur.prog, "scatter_tex"), 0);
                gl_context.activeTexture(gl_context.TEXTURE1);
                gl_context.bindTexture(gl_context.TEXTURE_2D, scene_depth_tex);
                gl_context.uniform1i(gl_context.getUniformLocation(bilateralBlur.prog, "scene_depth"), 1);
                gl_context.uniform1f(gl_context.getUniformLocation(bilateralBlur.prog, "u_far"), camera.far);
                gl_context.uniform1f(gl_context.getUniformLocation(bilateralBlur.prog, "u_near"), camera.near);
                gl_context.uniform1i(gl_context.getUniformLocation(bilateralBlur.prog, "u_isHorizontal"), i % 2);
                renderer.render(camera, bilateralBlur, [
                    square,
                ]);
                var tmp = bilateral_filter_horizontal_tex;
                bilateral_filter_horizontal_tex = bilateral_filter_vertical_tex;
                bilateral_filter_vertical_tex = tmp;
                gl_context.bindFramebuffer(gl_context.FRAMEBUFFER, null);
            }
        }
        // ===================================== pass 6 : combination pass =====================================================================
        combinedShader.use();
        gl_context.activeTexture(gl_context.TEXTURE0);
        gl_context.bindTexture(gl_context.TEXTURE_2D, color_pass_tex);
        gl_context.uniform1i(gl_context.getUniformLocation(combinedShader.prog, "color_tex"), 0);
        gl_context.activeTexture(gl_context.TEXTURE1);
        if (controls.enableBilateralBlur)
            gl_context.bindTexture(gl_context.TEXTURE_2D, bilateral_filter_horizontal_tex);
        else
            gl_context.bindTexture(gl_context.TEXTURE_2D, scatter_pass_tex);
        gl_context.uniform1i(gl_context.getUniformLocation(combinedShader.prog, "bi_tex"), 1);
        gl_context.activeTexture(gl_context.TEXTURE2);
        gl_context.bindTexture(gl_context.TEXTURE_2D, scene_depth_tex);
        gl_context.uniform1i(gl_context.getUniformLocation(combinedShader.prog, "sceneDepth_tex"), 2);
        renderer.clear();
        renderer.render(camera, combinedShader, [
            square,
        ]);
        gl_context.disable(gl_context.BLEND);
        //gl_context.disable(gl_context.DEPTH_TEST);
        stats.end();
        // Tell the browser to call `tick` again whenever it renders a new frame
        requestAnimationFrame(tick);
    }
    window.addEventListener('resize', function () {
        gl_context.bindRenderbuffer(gl_context.RENDERBUFFER, deferred_render_buffer);
        gl_context.renderbufferStorage(gl_context.RENDERBUFFER, gl_context.DEPTH_COMPONENT16, window.innerWidth, window.innerHeight);
        gl_context.bindTexture(gl_context.TEXTURE_2D, color_pass_reflection_tex);
        gl_context.texImage2D(gl_context.TEXTURE_2D, 0, gl_context.RGBA32F, window.innerWidth, window.innerHeight, 0, gl_context.RGBA, gl_context.FLOAT, null);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MIN_FILTER, gl_context.LINEAR);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MAG_FILTER, gl_context.LINEAR);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_S, gl_context.CLAMP_TO_EDGE);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_T, gl_context.CLAMP_TO_EDGE);
        gl_context.bindTexture(gl_context.TEXTURE_2D, scatter_pass_tex);
        gl_context.texImage2D(gl_context.TEXTURE_2D, 0, gl_context.RGBA32F, window.innerWidth, window.innerHeight, 0, gl_context.RGBA, gl_context.FLOAT, null);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MIN_FILTER, gl_context.LINEAR);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MAG_FILTER, gl_context.LINEAR);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_S, gl_context.CLAMP_TO_EDGE);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_T, gl_context.CLAMP_TO_EDGE);
        gl_context.bindTexture(gl_context.TEXTURE_2D, color_pass_tex);
        gl_context.texImage2D(gl_context.TEXTURE_2D, 0, gl_context.RGBA32F, window.innerWidth, window.innerHeight, 0, gl_context.RGBA, gl_context.FLOAT, null);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MIN_FILTER, gl_context.LINEAR);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MAG_FILTER, gl_context.LINEAR);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_S, gl_context.CLAMP_TO_EDGE);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_T, gl_context.CLAMP_TO_EDGE);
        gl_context.bindTexture(gl_context.TEXTURE_2D, bilateral_filter_vertical_tex);
        gl_context.texImage2D(gl_context.TEXTURE_2D, 0, gl_context.RGBA32F, window.innerWidth, window.innerHeight, 0, gl_context.RGBA, gl_context.FLOAT, null);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MIN_FILTER, gl_context.LINEAR);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MAG_FILTER, gl_context.LINEAR);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_S, gl_context.CLAMP_TO_EDGE);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_T, gl_context.CLAMP_TO_EDGE);
        gl_context.bindTexture(gl_context.TEXTURE_2D, bilateral_filter_horizontal_tex);
        gl_context.texImage2D(gl_context.TEXTURE_2D, 0, gl_context.RGBA32F, window.innerWidth, window.innerHeight, 0, gl_context.RGBA, gl_context.FLOAT, null);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MIN_FILTER, gl_context.LINEAR);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MAG_FILTER, gl_context.LINEAR);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_S, gl_context.CLAMP_TO_EDGE);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_T, gl_context.CLAMP_TO_EDGE);
        gl_context.bindTexture(gl_context.TEXTURE_2D, scene_depth_tex);
        gl_context.texImage2D(gl_context.TEXTURE_2D, 0, gl_context.RGBA32F, window.innerWidth, window.innerHeight, 0, gl_context.RGBA, gl_context.FLOAT, null);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MIN_FILTER, gl_context.LINEAR);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MAG_FILTER, gl_context.LINEAR);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_S, gl_context.CLAMP_TO_EDGE);
        gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_T, gl_context.CLAMP_TO_EDGE);
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.setAspectRatio(window.innerWidth / window.innerHeight);
        camera.updateProjectionMatrix();
    }, false);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    // Start the render loop
    tick();
}
main();
