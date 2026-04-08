var InitData = pc.createScript('initData');

InitData.attributes.add("fscJSON", { type: "asset", title: "fscJSON" });
InitData.attributes.add("fscMap", { type: "asset", title: "fscMap" });
InitData.attributes.add("colorJSON", { type: "asset", title: "colorJSON" });
InitData.attributes.add("colorMap", { type: "asset", title: "colorMap" });

InitData.prototype.initialize = function () {
    this.app.on("INIT_FSC", function (fsccd, extColor) {
        this.app.initFSC = fsccd;
        this.app.initColor = extColor;
    }, this);
    this.app.modelIdx = 0;
    this.app.colorIdx = 0;
    this.app.initFSC = null;
    this.app.initColor = null;
    this.app.fire("WEBGL_READY");
    this.fscInit();
    this.colorInit();
};

InitData.prototype.fscInit = function () {
    let fscJSON = this.fscJSON.resource
    let fscMap = this.fscMap.resource
    this.app.partsMap = {};

    Object.entries(fscJSON).forEach(([fsccd, data]) => {
        this.app.partsMap[fsccd] = {};
        this.app.partsMap[fsccd]["dt"] = data.dt;
        this.app.partsMap[fsccd]["parts"] = [];
        for (const p of data.parts) {
            const partsNum = fscMap[p];
            this.app.partsMap[fsccd]["parts"].push(partsNum);
        }
    })


    this.app.modelList = Object.keys(this.app.partsMap);
    if (this.app.initFSC) {
        this.app.modelIdx = this.app.modelList.indexOf(this.app.initFSC)
    }
    this.app.modelLen = this.app.modelList.length;
};

InitData.prototype.colorInit = function () {
    let colorJSON = this.colorJSON.resource
    let colorMap = this.colorMap.resource
    
    this.app.colorMap = new Map();
    Object.entries(colorJSON).forEach(([fscKey, keyColors]) => {
        mappingFscKey = colorMap[fscKey]
        this.app.colorMap[mappingFscKey] = {}

        Object.entries(keyColors).forEach(([keyColor, maters]) => {
            mappingkeyColor = colorMap[keyColor]
            if (mappingkeyColor && mappingkeyColor.includes('_')) {
                mappingkeyColor = mappingkeyColor.split('_')[0];
            }
            this.app.colorMap[mappingFscKey][mappingkeyColor] = {}

            Object.entries(maters).forEach(([keyMaters, valMaters]) => {
                mappingKeyMaters = colorMap[keyMaters];
                mappingValMaters = colorMap[valMaters];
                this.app.colorMap[mappingFscKey][mappingkeyColor][mappingKeyMaters] = mappingValMaters;
            });

        });

    });
    firstValue = this.app.colorMap[this.app.modelList[this.app.modelIdx]]

    this.app.colorKey = Object.keys(firstValue);
    if (this.app.initColor) {
        this.app.colorIdx = this.app.colorKey.indexOf(this.app.initColor)
    }
    this.app.colorLen = this.app.colorKey.length;    
};