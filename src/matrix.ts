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