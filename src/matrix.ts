export interface Matrix {
    a: number,
    b: number,
    c: number,
    d: number,
}

export interface Vector {
    x: number,
    y: number,
}

export function scaleMatrix(matrix: Matrix, scale: number): Matrix {
    return {
        a: matrix.a * scale,
        b: matrix.b * scale,
        c: matrix.c * scale,
        d: matrix.d * scale,
    }
}

export function applyMatrix(matrix: Matrix, vector: Vector): Vector {
    return {
        x: matrix.a * vector.x + matrix.c * vector.y,
        y: matrix.b * vector.x + matrix.d * vector.y,
    }
}

export function multiplyMatrix(left: Matrix, right: Matrix): Matrix {
    return {
        a: left.a * right.a + left.c * right.b,
        b: left.b * right.a + left.d * right.b,
        c: left.a * right.c + left.c * right.d,
        d: left.b * right.c + left.d * right.d,
    }
}

function determinant(matrix: Matrix): number {
    return matrix.a * matrix.d - matrix.b * matrix.c;
}

export function invertMatrix(matrix: Matrix): Matrix | null {
    const det = determinant(matrix);
    if (det === 0) {
        return null;
    }
    const invDet = 1 / det;
    return {
        a: matrix.d * invDet,
        b: -matrix.b * invDet,
        c: -matrix.c * invDet,
        d: matrix.a * invDet,
    }
}

export function normalizeMatrix(matrix: Matrix): Matrix {
    const det = determinant(matrix);
    if (det === 0) {
        return matrix; // 正則でない行列はそのまま返す
    }
    const scale = 1 / Math.sqrt(Math.abs(det));
    return scaleMatrix(matrix, scale);
}