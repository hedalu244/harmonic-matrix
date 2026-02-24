import { Matrix } from "./matrix";

export class EasingNumber {
    start: number;
    timestamp: number;
    target: number;
    duration = 500; // ms

    constructor(x: number) {
        this.start = x;
        this.target = x;
        this.timestamp = EasingNumber.now;
    }

    static now: number = performance.now();
    static updateTime() {
        EasingNumber.now = performance.now();
    }

    static easingFunction(t: number): number {
        // easeInOutQuad
        if (t < 0) return 0;
        if (t > 1) return 1;
        return t * t * (3 - 2 * t);
    }
    setTarget(target: number) {
        this.start = this.getCurrent();
        this.target = target;
        this.timestamp = EasingNumber.now;
    }
    getCurrent() {
        const elapsed = EasingNumber.now - this.timestamp;
        const t = Math.min(elapsed / this.duration, 1);
        return this.start + (this.target - this.start) * EasingNumber.easingFunction(t);
    }
    hardSetTarget(target: number) {
        this.target = target;
        this.timestamp = EasingNumber.now - this.duration;
    }
}

export class EasingMatrix {
    a: EasingNumber;
    b: EasingNumber;
    c: EasingNumber;
    d: EasingNumber;
    // メモ化キャッシュ
    current: Matrix;
    lastUpdate;
    constructor(matrix: Matrix) {
        this.a = new EasingNumber(matrix.a);
        this.b = new EasingNumber(matrix.b);
        this.c = new EasingNumber(matrix.c);
        this.d = new EasingNumber(matrix.d);
        this.current = matrix;
        this.lastUpdate = EasingNumber.now;
    }
    setTarget(matrix: Matrix) {
        this.a.setTarget(matrix.a);
        this.b.setTarget(matrix.b);
        this.c.setTarget(matrix.c);
        this.d.setTarget(matrix.d);
    }
    getCurrent(): Matrix {
        if (EasingNumber.now != this.lastUpdate) {
            this.current = {
                a: this.a.getCurrent(),
                b: this.b.getCurrent(),
                c: this.c.getCurrent(),
                d: this.d.getCurrent(),
            };
            this.lastUpdate = EasingNumber.now;
        }
        return this.current;
    }
    hardSetTarget(matrix: Matrix) {
        this.a.hardSetTarget(matrix.a);
        this.b.hardSetTarget(matrix.b);
        this.c.hardSetTarget(matrix.c);
        this.d.hardSetTarget(matrix.d);
    }
}