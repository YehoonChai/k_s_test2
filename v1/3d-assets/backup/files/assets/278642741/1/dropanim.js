var DropAnim = pc.createScript('dropAnim');

DropAnim.attributes.add('delay', { type: 'number', default: 2 });
DropAnim.attributes.add('height', { type: 'number', default: 3 });
DropAnim.attributes.add('duration', { type: 'number', default: 1.3 });
DropAnim.attributes.add('bounceHeight', { type: 'number', default: 0.3 });
DropAnim.attributes.add('bounceDuration', { type: 'number', default: 0.4 });

DropAnim.prototype.initialize = function () {

    this.targetPos = this.entity.getPosition().clone();

    this.startPos = this.targetPos.clone();
    this.startPos.y += this.height;

    this.entity.setPosition(this.startPos);

    this.wait = 0;
    this.t = 0;
    this.state = 0;
};

DropAnim.prototype.update = function (dt) {

    // 0 = delay 대기
    if (this.state === 0) {

        this.wait += dt;

        if (this.wait >= this.delay) {
            this.state = 1;
            this.t = 0;
        }

        return;
    }

    // 1 = 위에서 아래로 떨어짐
    if (this.state === 1) {

        this.t += dt;
        var a = this.t / this.duration;

        if (a >= 1) {
            a = 1;
            this.state = 2;
            this.t = 0;
        }

        var pos = new pc.Vec3();
        pos.lerp(this.startPos, this.targetPos, a);
        this.entity.setPosition(pos);

        return;
    }

    // 2 = 살짝 튕김
    if (this.state === 2) {

        this.t += dt;

        var a = this.t / this.bounceDuration;

        if (a >= 1) {
            this.entity.setPosition(this.targetPos);
            this.state = 3;
            return;
        }

        var bounce = Math.sin(a * Math.PI) * this.bounceHeight;

        var pos = this.targetPos.clone();
        pos.y += bounce;

        this.entity.setPosition(pos);
    }
};
// uncomment the swap method to enable hot-reloading for this script
// update the method body to copy state from the old instance
// DropAnim.prototype.swap = function(old) { };

// learn more about scripting here:
// https://developer.playcanvas.com/user-manual/scripting/