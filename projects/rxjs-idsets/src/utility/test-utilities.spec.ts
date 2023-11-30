import { DeltaProperty } from '../types';

/**
 * unittest utility function to gather all Deltavalue property combination permutations
 */
export function getDeltaPropertyPermutations() {
  const propertyPermutations: DeltaProperty[][] = [];
  const deltaProperties: DeltaProperty[] = ['create', 'update', 'delete'];

  // create all permutations
  for (let i = 0; i < Math.pow(2, deltaProperties.length); i++) {
    const entry: DeltaProperty[] = [];
    for (let j = 0; j < deltaProperties.length; j++) {
      if ((i >>> j) % 2 === 1) {
        entry.push(deltaProperties[j]);
      }
    }
    propertyPermutations.push(entry);
  }

  return propertyPermutations;
}