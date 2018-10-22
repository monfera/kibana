/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

/**
 * flatten
 *
 * Flattens an array of arrays into an array
 *
 * @param {*[][]} arrays
 * @returns *[]
 */
const flatten = arrays => [].concat(...arrays);

const flatMap = (array, fun) => array.reduce((prev, next) => [...fun(next), ...prev], []);

/**
 * identity
 *
 * @param d
 * @returns d
 */
const identity = d => d;

/**
 * map
 *
 * Maps a function over an array
 *
 * Passing the index and the array are avoided
 *
 * @param {Function} fun
 * @returns {function(*): *}
 */
const map = fun => array => array.map(value => fun(value));

/**
 * log
 *
 * @param d
 * @param {Function} printerFun
 * @returns d
 */
const log = (d, printerFun = identity) => {
  console.log(printerFun(d));
  return d;
};

/**
 * disjunctiveUnion
 *
 * @param {Function} keyFun
 * @param {*[]} set1
 * @param {*[]} set2
 * @returns *[]
 */
const disjunctiveUnion = (keyFun, set1, set2) =>
  set1
    .filter(s1 => !set2.find(s2 => keyFun(s2) === keyFun(s1)))
    .concat(set2.filter(s2 => !set1.find(s1 => keyFun(s1) === keyFun(s2))));

/**
 *
 * @param {number} a
 * @param {number} b
 * @returns {number} the mean of the two parameters
 */
const mean = (a, b) => (a + b) / 2;

const shallowEqual = (a, b) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

const not = fun => (...args) => !fun(...args);

const distinct = (idFun, a) => a.filter((d, i) => a.findIndex(s => idFun(s) === idFun(d)) === i);

const arrayToMap = (a, makeValueFun = () => true) =>
  Object.assign({}, ...a.map(d => ({ [d]: makeValueFun(d) })));

const subMultitree = (pk, fk, elements, roots) => {
  const getSubgraphs = roots => {
    const children = flatten(roots.map(r => elements.filter(e => fk(e) === pk(r))));
    return [...roots, ...(children.length && getSubgraphs(children, elements))];
  };
  return getSubgraphs(roots);
};

const adjacentPairs = (a, fun = (l, r) => [l, r]) =>
  // by default, just form pairs in arrays; otherwise, use the supplied function (l, r, index, array) => ...
  a.map((d, i, a, next = a[i + 1]) => next && fun(d, next, i, a)).filter(identity);

module.exports = {
  adjacentPairs,
  arrayToMap,
  disjunctiveUnion,
  distinct,
  flatMap,
  flatten,
  subMultitree,
  identity,
  log,
  map,
  mean,
  not,
  shallowEqual,
};
