var ViewManager = pc.createScript('viewManager');



ViewManager.prototype.initialize = function () {
    this.colorScrollViewContent = this.app.colorScrollView.children[0].children[0]
    for (let dt of this.app.dummyEntity.children) {
        if (dt.name.endsWith("LHD")) {
            this.app.dtl = dt
        } else if (dt.name.endsWith("RHD")) {
            this.app.dtr = dt
        }
    }
    this.partsDisplay(this.app.modelList[this.app.modelIdx]);
    this.colorDisplay(this.app.modelList[this.app.modelIdx], "DRL");
    this.colorDisplay(this.app.modelList[this.app.modelIdx], this.app.initColor);
    this.app.fire("WEBGL_EXTERIOR_LOAD");
    this.modelScroll()
}

// 모델 인덱스가 변경되면 모델 파츠 변경하는 함수
ViewManager.prototype.update = function() {
    if (this.app.buttonClicked) {
        this.partsDisplay(this.app.modelList[this.app.modelIdx]);
        this.colorDisplay(this.app.modelList[this.app.modelIdx], this.app.colorKey[this.app.colorIdx]);
        this.app.buttonClicked = false
        if (this.app.changeFSC) {
            this.app.fire("WEBGL_CHANGED_FSC");
            this.app.changeFSC = false
        }
    }
}

// loadParts 받아온 정보로 에디터 엔티티의 뷰 상태를 변경하는 함수
ViewManager.prototype.partsDisplay = function(modelName) {
    const isDTL = this.app.partsMap[modelName]["dt"] === "DTL";
    this.app.dtl.enabled = isDTL;
    this.app.dtr.enabled = !isDTL;
    const nowParts = this.app.partsMap[modelName]["parts"];
    
    for (let entity of this.app.entityList) {
        entity.enabled = nowParts.includes(entity.name);
    }
    if (this.app.fscButton) {
        this.app.fscButton.children[0].element.text = modelName;
    }
    
    this.changeContent();
};

ViewManager.prototype.colorDisplay = function(modelName, colorKey) {
    const colorMap = this.app.colorMap[modelName][colorKey];

    /** DATE : 250908 */ 
    /** WRITER : TW */
    /** DESC : 허용하지 않는 색상코드 입력 시 변경하지 않도록 수정 */ 
    if(!colorMap) return;

    for (const [key, value] of Object.entries(colorMap)) {
        if (this.app.entMatMap[key]) {
            for (const entParts of this.app.entMatMap[key]) {
                if (this.app.assetMatMap[value]) {
                    entParts.render.material.copy(this.app.assetMatMap[value].resource);
                    entParts.render.material.update();
                }
            }
        }
    }
    if (this.app.colorText) {
        this.app.colorText.element.text = colorKey
    }
};


ViewManager.prototype.colorScroll = function() {
    for (const color of this.app.colorKey) {
    const item = this.app.inputText.clone();
    item.name = color;
    item.element.text = color;
    item.button.on('click', function () {
        this.app.colorIdx = this.app.colorKey.indexOf(color);
        this.app.buttonClicked = true;
    }, this);

    item.enabled = true;
    this.colorScrollViewContent.addChild(item);
    }
}

ViewManager.prototype.changeContent = function() {
    
    this.colorScrollViewContent.children.slice().forEach(child => { child.destroy(); });

    const keys = Object.keys(this.app.colorMap[this.app.modelList[this.app.modelIdx]]);
    const sorted = keys
        .filter(k => k === 'ON' || k === 'OFF')
        .sort((a, b) => (a === 'ON' ? -1 : a === 'OFF' ? 0 : 1))
        .concat(
            keys
                .filter(k => k !== 'ON' && k !== 'OFF')
                .sort((a, b) => a.length - b.length || a.localeCompare(b))
        );

    // colorKey 갱신 전 인덱스 안전성 확인
    if (this.app.colorIdx >= sorted.length) {
        this.app.colorIdx = 0;
    }

    this.app.colorKey = sorted;
    this.colorScroll();
}

ViewManager.prototype.modelScroll = function() {
    for (const model of this.app.modelList) {
        const item = this.app.inputText.clone();
        item.name = model;
        item.element.text = model;
        item.button.on('click', function () {
            this.app.modelIdx = this.app.modelList.indexOf(model);
            this.app.buttonClicked = true;
    }, this);

    item.enabled = true;
    this.app.modelScrollView.children[0].children[0].addChild(item);
    }
}