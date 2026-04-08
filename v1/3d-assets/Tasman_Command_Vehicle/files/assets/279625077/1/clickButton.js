var ClickButton = pc.createScript('clickButton');

ClickButton.prototype.initialize = function() {
    this.app.list = ['A', 'B', 'C', 'D']
    this.app.idx = 0

    if (this.entity.button) {
        this.entity.button.on('click', this.onClick, this);
    }
};

ClickButton.prototype.onClick = function () {
    this.app.idx++
    if (this.app.idx >= this.app.list.length) {
        this.app.idx = 0
    }
    const color = this.app.list[this.app.idx]
    const newMatAsset = this.app.matMap[color];
    if (!newMatAsset) {
        return;
    }

    if (this.app.targetMeshInstances && this.app.targetMeshInstances.length > 0) {
        this.app.targetMeshInstances.forEach(meshInstance => {
            meshInstance.material = newMatAsset.resource;
            meshInstance.material.update();
        });
        
    } else {
        console.warn("No target mesh instances found.");
    }
};