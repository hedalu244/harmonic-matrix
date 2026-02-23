type Vec3 = [number, number, number];
type Mat3 = [Vec3, Vec3, Vec3];

function dot(a: Vec3, b: Vec3): number {
  return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
}

function linearConversion(mat: Mat3, vec: Vec3): Vec3 {
  return mat.map(row => dot(row, vec)) as Vec3;
}

function LCHtoLAB(lch: Vec3): Vec3 {
  let [l, c, h] = lch;
  const a = c * Math.cos(h / 180 * Math.PI);
  const b = c * Math.sin(h / 180 * Math.PI);
  return [l, a, b];
}

function LABtoLMS_(lab: Vec3): Vec3 {
  const M2_INV = [
    [ 1.0000000000,  0.3963377774,  0.2158037573],
    [ 1.0000000000, -0.1055613458, -0.0638541728],
    [ 1.0000000000, -0.0894841775, -1.2914855480]
  ] as Mat3;
  return linearConversion(M2_INV, lab); 
}

function LMStoLRGB(lms: Vec3): Vec3 {
  const M1_INV = [
    [ 4.0767416621, -3.3077115913,  0.2309699292],
    [-1.2684380046,  2.6097574011, -0.3413193965],
    [-0.0041960863, -0.7034186147,  1.7076147010]
  ] as Mat3;
  return linearConversion(M1_INV, lms);
}

function LRGBtoSRGB(lrgb: Vec3): Vec3 {
  return lrgb.map(c => {
	const abs = Math.abs(c);
	return (abs > 0.0031308) ? (Math.sign(c) || 1) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055) : c * 12.92;
  }) as Vec3;
};


function oklchToSrgb(lch: Vec3): Vec3 {
  // 1. OKLCH → OKLab
  const lab = LCHtoLAB(lch);
  
  // 2. OKLab → LMS'
  const lms_ = LABtoLMS_(lab);

  // 3. LMS' → LMS (立方)
  const lms = lms_.map(c => c*c*c) as Vec3;

  // 4. LMS → linear sRGB
  const lrgb = LMStoLRGB(lms);
  
  // 5. linear → sRGB
  const srgb =  LRGBtoSRGB(lrgb);
  
  //if(srgb.some(x=>x < 0 || 1 < x)) return [0.5, 0.5, 0.5];

  return srgb;
}

import type p5_ from "p5";
export function oklch(p5: p5_, l: number, c: number, h: number): p5_.Color {
  const [r, g, b] = oklchToSrgb([l, c, h]);
  p5.colorMode(p5.RGB, 255);
  return p5.color(r * 255, g * 255, b * 255);
}