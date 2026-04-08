var ButtonManager = pc.createScript('buttonManager');

ButtonManager.attributes.add("turbo", { type: "number", default: 0.05, title: "turbo" });

ButtonManager.prototype.initialize = function () {
    this.app.buttonClicked = false;
    this.app.modelScrollViewMode = false;
    this.app.colorScrollViewMode = false;
    this.app.fscTurbo = 0
    this.app.colorTurbo = 0
    this.bglist = ["DAY", "NIGHT"];
    this.bgidx = 0;


    if (this.app.prevModelButton && this.app.prevModelButton.button) {
        this.app.prevModelButton.button.on('click', () => {
            this.clickButton("fsc","prev");
        }, this);
    }
    if (this.app.prevColorButton && this.app.prevColorButton.button) {
        this.app.prevColorButton.button.on('click', () => {
            this.clickButton("color","prev");
        }, this);
    }
    if (this.app.nextModelButton && this.app.nextModelButton.button) {
        this.app.nextModelButton.button.on('click', () => {
            this.clickButton("fsc","next");
        }, this);
    }
    if (this.app.nextColorButton && this.app.nextColorButton.button) {
        this.app.nextColorButton.button.on('click', () => {
            this.clickButton("color","next");
        }, this);
    }

    if (this.app.fscButton && this.app.fscButton.button) {
        this.app.fscButton.button.on('click', () => {
            this.fscCopy()
        }, this);
    }

    if (this.app.bg) {
        this.app.bg.button.on('click', () => {
            this.changeBG()
        }, this);
    }

    this.app.modelNameButton.button.on("click", () => {
        this.toggleScrollView("fsc");
        }, this)
    this.app.colorNameButton.button.on("click", () => {
        this.toggleScrollView("color");
    }, this)

    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    this.app.keyboard.on(pc.EVENT_KEYUP, this.onKeyUp, this);
};

ButtonManager.prototype.update = function (dt) {
    if (this.app.fscTurbo !== 0 || this.app.colorTurbo !== 0) {
        this.timeSinceLastClick += dt;

        if (this.timeSinceLastClick >= this.turbo) {
            if (this.app.fscTurbo === 1) {
                this.clickButton("fsc", "next");
            } else if (this.app.fscTurbo === -1) {
                this.clickButton("fsc", "prev");
            } else if (this.app.colorTurbo === 1) {
                this.clickButton("color", "next");
            } else if (this.app.colorTurbo === -1) {
                this.clickButton("color", "prev");
            }
            this.timeSinceLastClick = 0;
        }
    } else {
        this.timeSinceLastClick = 0;
    }
};

ButtonManager.prototype.clickButton = function (type, direction) {
    if (type === "fsc") {
        if (direction === "next") {
            this.app.modelIdx = (this.app.modelIdx + 1) % this.app.modelLen;
        } else if (direction === "prev") {
            this.app.modelIdx = (this.app.modelIdx - 1 + this.app.modelLen) % this.app.modelLen;
        }
        this.app.buttonClicked = true;
    } else if (type === "color") {
        if (direction === "next") {
            this.app.colorIdx = (this.app.colorIdx + 1) % this.app.colorLen;
        } else if (direction === "prev") {
            this.app.colorIdx = (this.app.colorIdx - 1 + this.app.colorLen) % this.app.colorLen;
        }
        this.app.buttonClicked = true;
    }
};

ButtonManager.prototype.toggleScrollView = function (type) {
    const isModel = type === "fsc";

    this.app.modelScrollView.enabled = isModel;
    this.app.colorScrollView.enabled = !isModel;

    this.app.modelScrollViewMode = isModel;
    this.app.colorScrollViewMode = !isModel;
};

// esc 누르면 스크롤뷰를 안보이게 하는 함수
ButtonManager.prototype.onKeyDown = function (event) {
    if (event.key === pc.KEY_ESCAPE) {
        if (this.app.modelScrollViewMode) {
            this.app.modelScrollView.enabled = false;
            this.app.modelScrollViewMode = false;
        }

        if (this.app.colorScrollViewMode) {
            this.app.colorScrollView.enabled = false;
            this.app.colorScrollViewMode = false;
        }
    } else if (event.key === pc.KEY_RIGHT) {
        this.app.fscTurbo = 1
        this.clickButton("fsc", "next")
    } else if (event.key === pc.KEY_LEFT) {
        this.app.fscTurbo = -1
        this.clickButton("fsc", "prev");
    } else if (event.key === pc.KEY_UP) {
        this.app.colorTurbo = 1
        this.clickButton("color", "next");
    } else if (event.key === pc.KEY_DOWN) {
        this.app.colorTurbo = -1
        this.clickButton("color", "prev");
    }
};

ButtonManager.prototype.onKeyUp = function (event) {
    if (event.key === pc.KEY_RIGHT || event.key === pc.KEY_LEFT || event.key === pc.KEY_UP || event.key === pc.KEY_DOWN) {
        this.app.fscTurbo = 0
        this.app.colorTurbo = 0
        this.timeSinceLastClick = 0; 
    }
}

ButtonManager.prototype.fscCopy = function () {
    const text = this.app.modelList[this.app.modelIdx];
    navigator.clipboard.writeText(text)
};

ButtonManager.prototype.changeBG = function() {
    this.app.fire('CHANGE_ENVIRONMENT', this.bglist[this.bgidx]);
    this.bgidx = 1 - this.bgidx;
}