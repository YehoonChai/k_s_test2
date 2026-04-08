var ColorTracker = pc.createScript('colorTracker');

ColorTracker.attributes.add('lineX', { type: 'entity', title: 'Line X' });
ColorTracker.attributes.add('lineY', { type: 'entity', title: 'Line Y' });

ColorTracker.prototype.initialize = function () {
    const gd = this.app.graphicsDevice;
    const canvas = gd.canvas;
    this.trackMode = -1;
    this.posX = null
    this.posY = null

    this.targetColor = null
    this.startFSC = null
    this.currentFSC = null


    this.screen = (ent => { for (let p=ent; p; p=p.parent) if (p.screen) return p.screen; })(this.lineX)
               || (ent => { for (let p=ent; p; p=p.parent) if (p.screen) return p.screen; })(this.lineY)
               || null;


    this.mx = 0; this.my = 0;
    this.app.mouse.on(pc.EVENT_MOUSEMOVE, e => {
        const r  = canvas.getBoundingClientRect();
        const nx = (e.event.clientX - r.left) / r.width;
        const ny = (e.event.clientY - r.top)  / r.height;

        const res = this.screen ? this.screen.resolution : new pc.Vec2(gd.width, gd.height);
        this.mx = nx * res.x;
        this.my = (1 - ny) * res.y; 
    });

    this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.setPosition, this)

    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.spaceDown, this);

    this._pix = new Uint8Array(4);
    this.color = { r:0, g:0, b:0, a:0 }; 
};

ColorTracker.prototype.update = function () {
    const gd = this.app.graphicsDevice;
    const res = this.screen ? this.screen.resolution : { x: gd.width, y: gd.height };

    if (this.trackMode === 0) {
        this.lineY.setLocalPosition(Math.round(this.mx), Math.round(res.y * 0.5), 0);
        this.lineX.setLocalPosition(Math.round(res.x * 0.5), Math.round(this.my), 0);
    } else if (this.trackMode === 1) {
        this.colorTracker()
    }
};

ColorTracker.prototype.spaceDown = function (e) {
    if (e.key === pc.KEY_SPACE) {
        this.lineX.enabled = true; this.lineY.enabled = true;
        this.trackMode = 0;
    } else if (this.trackMode !== -1 && e.key === pc.KEY_ESCAPE) {
        this.trackMode = -1
        this.lineX.enabled = false; this.lineY.enabled = false;
    }
};

ColorTracker.prototype.setPosition = function (e) {
    if (this.trackMode === 0 && e.button === pc.MOUSEBUTTON_LEFT) {
        const prevX = this.lineX.enabled, prevY = this.lineY.enabled;
        this.lineX.enabled = false; 
        this.lineY.enabled = false;

        this.app.once('postrender', () => {
            const p = this.posAtCursor();
            this.posX = p.xDev;
            this.posY = p.yTop;

            this.targetColor = this.samplePixelAtCursor(this.posX, this.posY);
            this.startFSC   = this.app.modelIdx;
            this.currentFSC = this.app.modelIdx;

            this.lineX.enabled = prevX; 
            this.lineY.enabled = prevY;

            // 여기에서 모드 전환 (null 아님이 보장된 뒤)
            this.trackMode = 1;
        });
    }
};

ColorTracker.prototype.colorTracker = function () {
    if (this.currentFSC !== this.app.modelIdx) {
        const prevX = this.lineX.enabled, prevY = this.lineY.enabled;
        this.lineX.enabled = false; 
        this.lineY.enabled = false;

        this.app.once('postrender', () => {
            nowColor = this.samplePixelAtCursor(this.posX, this.posY);

            this.lineX.enabled = prevX; 
            this.lineY.enabled = prevY;

            if (this._colorDistRatio(this.targetColor, nowColor, false) > 0.1) {
                console.log("Diffrent: ",this.app.modelList[this.app.modelIdx])
            }
            if (this.app.modelIdx === this.startFSC) {
                console.log("check All FSC")
            }
            this.currentFSC = this.app.modelIdx;
        });
    }
};

// ===== 핵심: 선 제외하고 픽셀 읽기 =====
ColorTracker.prototype.sampleAtCursor = function () {
    const gd  = this.app.graphicsDevice;
    const res = this.screen ? this.screen.resolution : { x: gd.width, y: gd.height };

    // UI(Screen) → 디바이스 픽셀 변환
    let x = Math.round((this.mx / res.x) * gd.width);
    let y = Math.round((this.my / res.y) * gd.height); // 좌하단 원점

    x = pc.math.clamp(x, 0, gd.width  - 1);
    y = pc.math.clamp(y, 0, gd.height - 1);

    this.lineX.enabled = false;
    this.lineY.enabled = false;

    // 2) 이 프레임 렌더가 끝난 직후 읽기 (선이 안 그려진 화면)
    this.app.once('postrender', () => {
        // GL은 하단 원점이므로 그대로 y 사용
        gd.readPixels(x, y, 1, 1, this._pix);

        this.color.r = this._pix[0];
        this.color.g = this._pix[1];
        this.color.b = this._pix[2];
        this.color.a = this._pix[3];

        // 3) 다음 프레임부터 다시 선 표시
        this.lineX.enabled = true;
        this.lineY.enabled = true;
    });
};

ColorTracker.prototype.samplePixelAtCursor = function (xDev, yTop) {
    this._ensureSampler();
    const canvas = this.app.graphicsDevice.canvas;
    const ctx = this._sampler.ctx;
    ctx.clearRect(0, 0, 1, 1);
    ctx.drawImage(canvas, xDev, yTop, 1, 1, 0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] };
};


ColorTracker.prototype.posAtCursor = function () {
    const gd  = this.app.graphicsDevice;
    const res = this.screen ? this.screen.resolution : { x: gd.width, y: gd.height };
    let xDev = Math.round((this.mx / res.x) * gd.width);
    let yDev = Math.round((this.my / res.y) * gd.height);
    xDev = pc.math.clamp(xDev, 0, gd.width  - 1);
    yDev = pc.math.clamp(yDev, 0, gd.height - 1);
    const yTop = gd.height - 1 - yDev; // drawImage는 상단 원점
    return { xDev, yTop };
};

ColorTracker.prototype._colorDistRatio = function (c1, c2, includeAlpha = false) {
    const dr = c1.r - c2.r, dg = c1.g - c2.g, db = c1.b - c2.b;
    let sum = dr*dr + dg*dg + db*db;
    let norm = 255 * Math.sqrt(3);
    if (includeAlpha) {
        const da = c1.a - c2.a;
        sum += da*da;
        norm = 255 * Math.sqrt(4);
    }
    return Math.sqrt(sum) / norm; // 0(같음) ~ 1(최대)
};

ColorTracker.prototype._ensureSampler = function () {
    if (!this._sampler) {
        const c = document.createElement('canvas');
        c.width = c.height = 1;
        this._sampler = { c, ctx: c.getContext('2d', { willReadFrequently: true }) };
    }
};