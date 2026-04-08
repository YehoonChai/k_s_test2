var MouseInput = pc.createScript('mouseInput');

MouseInput.attributes.add('orbitSensitivity', {
    type: 'number', 
    default: 0.3, 
    title: 'Orbit Sensitivity', 
    description: 'How fast the camera moves around the orbit. Higher is faster'
});

MouseInput.attributes.add('distanceSensitivity', {
    type: 'number', 
    default: 0.15, 
    title: 'Distance Sensitivity', 
    description: 'How fast the camera moves in and out. Higher is faster'
});

// initialize code called once per entity
MouseInput.prototype.initialize = function() {
    this.orbitCamera = this.entity.script.orbitCamera;
        
    if (this.orbitCamera) {
        var self = this;
        
        var onMouseOut = function (e) {
            self.onMouseOut(e);
        };
        
        this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
        this.app.mouse.on(pc.EVENT_MOUSEUP, this.onMouseUp, this);
        this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
        this.app.mouse.on(pc.EVENT_MOUSEWHEEL, this.onMouseWheel, this);

        // Listen to when the mouse travels out of the window
        window.addEventListener('mouseout', onMouseOut, false);
        
        // Remove the listeners so if this entity is destroyed
        this.on('destroy', function() {
            this.app.mouse.off(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
            this.app.mouse.off(pc.EVENT_MOUSEUP, this.onMouseUp, this);
            this.app.mouse.off(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
            this.app.mouse.off(pc.EVENT_MOUSEWHEEL, this.onMouseWheel, this);

            window.removeEventListener('mouseout', onMouseOut, false);
        });

    }
    
    // Disabling the context menu
    this.app.mouse.disableContextMenu();
  
    this.lookButtonDown = false;
    this.lastPoint = new pc.Vec2();
};

MouseInput.fromWorldPoint = new pc.Vec3();
MouseInput.toWorldPoint = new pc.Vec3();
MouseInput.worldDiff = new pc.Vec3();

MouseInput.prototype.pan = function(screenPoint) {
    if (!this.orbitCamera || !this.orbitCamera.enabled) return;

    var fromWorldPoint = MouseInput.fromWorldPoint;
    var toWorldPoint = MouseInput.toWorldPoint;
    var worldDiff = MouseInput.worldDiff;
    
    var camera = this.entity.camera;
    var distance = this.orbitCamera.distance;
    
    camera.screenToWorld(screenPoint.x, screenPoint.y, distance, fromWorldPoint);
    camera.screenToWorld(this.lastPoint.x, this.lastPoint.y, distance, toWorldPoint);

    worldDiff.sub2(toWorldPoint, fromWorldPoint);
    this.orbitCamera.pivotPoint.add(worldDiff);    
};

MouseInput.prototype.onMouseDown = function (event) {
    if (!this.orbitCamera || !this.orbitCamera.enabled) return;

    switch (event.button) {
        case pc.MOUSEBUTTON_LEFT:
            this.lookButtonDown = true;
            break;
        case pc.MOUSEBUTTON_MIDDLE:
    }
};

MouseInput.prototype.onMouseUp = function (event) {
    if (!this.orbitCamera || !this.orbitCamera.enabled) return;

    switch (event.button) {
        case pc.MOUSEBUTTON_LEFT:
            this.lookButtonDown = false;
            break;
        case pc.MOUSEBUTTON_MIDDLE:
    }
};

MouseInput.prototype.onMouseMove = function (event) {
    if (!this.orbitCamera || !this.orbitCamera.enabled) return;

    var mouse = pc.app.mouse;
    if (this.lookButtonDown) {
        this.orbitCamera.pitch -= event.dy * this.orbitSensitivity;
        this.orbitCamera.yaw -= event.dx * this.orbitSensitivity;
    }
    
    this.lastPoint.set(event.x, event.y);
};

MouseInput.prototype.onMouseWheel = function (event) {
    if (!this.orbitCamera || !this.orbitCamera.enabled) return;

    this.orbitCamera.distance -= event.wheel * this.distanceSensitivity;
    event.event.preventDefault();
};

MouseInput.prototype.onMouseOut = function (event) {
    this.lookButtonDown = false;
};