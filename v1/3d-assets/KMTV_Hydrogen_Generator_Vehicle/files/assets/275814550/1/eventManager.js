var EventManager = pc.createScript('eventManager');

// initialize code called once per entity
EventManager.prototype.initialize = function () {
    // CHANGE COLOR {color}
    this.app.on("CHANGE_COLOR", (color) => {
        this.app.colorIdx = this.app.colorKey.indexOf(color)
        this.app.buttonClicked = true
    });

    // LIGHT ON / OFF
    this.app.on("CHANGE_LIGHT", (color) => {
        this.app.colorIdx = this.app.colorKey.indexOf(color)
        this.app.buttonClicked = true
    });

    this.app.on("CHANGE_FSC", (fsc) => {
        this.app.modelIdx = this.app.modelList.indexOf(fsc)
        this.app.buttonClicked = true
        this.app.changeFSC = true
        this.app.fire('WEBGL_FSC_CHANGED');
    })

    this.app.dummyAsset.ready(function () {
        this.onSuccessAssetsDownload("INTERIOR")
    }, this)

    this.app.on("TOGGLE_SHADOW", (onOff) => {
        this.toggleShadow(onOff)
    })
};

EventManager.prototype.onSuccessAssetsDownload = function (loadStatus) {
    switch (loadStatus) {
        case 'WEBGL_READY':
            // 0. WEBGL 준비가 완료 시 호출
            this.app.fire('WEBGL_READY');
            break;
        case 'FULL':
            // 3. 그 외 데이터 (ex) 환경 등
            this.app.fire('WEBGL_ALLASSETS_LOAD');
            break;
        case 'FSC_CHANGED':
            // ETC. FSC 변경 완료 시점에 이벤트 추가 호출
            this.app.fire('WEBGL_FSC_CHANGED');
    }
}

EventManager.prototype.toggleShadow = function(onOff) {
    this.shadow.enabled = onOff
};