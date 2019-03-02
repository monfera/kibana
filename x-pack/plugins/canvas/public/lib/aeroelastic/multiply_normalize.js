/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

export const mvMultiplyAndNormalize = (
  [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p],
  [A, B, C, D]
) => {
  const divisor = d * A + h * B + l * C + p * D;
  return [
    (a * A + e * B + i * C + m * D) / divisor,
    (b * A + f * B + j * C + n * D) / divisor,
    (c * A + g * B + k * C + o * D) / divisor,
    1,
  ];
};
