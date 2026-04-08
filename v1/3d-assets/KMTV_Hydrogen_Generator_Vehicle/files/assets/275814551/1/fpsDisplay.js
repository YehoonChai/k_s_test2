/*var FpsDisplay = pc.createScript('fpsDisplay');

FpsDisplay.attributes.add('text', { type: 'entity'});

FpsDisplay.prototype.update = function (dt) {
    this.text.element.text = this.app.stats.frame.fps + "/60"
    if(this.app.stats.frame.fps < 57) {
        console.log("☠️프레임 드랍 5%: ", this.app.stats.frame.fps)
        this.text.element.outlineColor = new pc.Color(1, 0, 0); 
    } else {
        this.text.element.outlineColor = new pc.Color(0, 0, 0); 
    }
};
*/