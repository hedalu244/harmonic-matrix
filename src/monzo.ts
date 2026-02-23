export interface Monzo {
    m: number,
    n: number,
}

// S = P^(1/p) = Q^(1/q) としたい
export interface Val {
    P: number,
    Q: number,
    baseFreq: number,

    S: number | null,
    p: number | null,
    q: number | null,
}

export function getFrequency(monzo: Monzo, val: Val): number {
    return val.baseFreq * Math.pow(val.P, monzo.m) * Math.pow(val.Q, monzo.n);
}

export function getSteps(val: Val, monzo: Monzo): number | null {
    if (val.p === null || val.q === null) return null;

    return monzo.m * val.p + monzo.n * val.q;
}

export function makeVal_fromP(p: number, q: number, P: number, baseFreq: number): Val {
    const S = Math.pow(P, 1 / p);
    const Q = Math.pow(S, q);

    return { P, Q, S, p, q, baseFreq };
}

export function makeVal_fromQ(p: number, q: number, Q: number, baseFreq: number): Val {
    const S = Math.pow(Q, 1 / q);
    const P = Math.pow(S, p);

    return { P, Q, S, p, q, baseFreq };
}

export function makeVal_fromS(p: number, q: number, S: number, baseFreq: number): Val {
    const P = Math.pow(S, p);
    const Q = Math.pow(S, q);

    return { P, Q, S, p, q, baseFreq };
}

export function makeVal_asIrrational(P: number, Q: number, baseFreq: number): Val {
    return { P, Q, S: null, p: null, q: null, baseFreq };
}