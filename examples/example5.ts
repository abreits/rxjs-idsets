import { ContainerIdSet } from 'rxjs-idsets';

const value1 = { id: '1', value: 'value1'};
const value2 = { id: '2', value: 'value2'};
const value3 = { id: '3', value: 'value3'};

const container = new ContainerIdSet();

// add value1 to the set in category1
container.add(value1, 'set1');

// create a new empty set inside the container
const set2 = container.getSet('set2');
// if the set already contains values get the existing set
const set1 = container.getSet('set1');

// you can add multiple values to multiple sets at once if you want to
container.add([value2, value3], ['set1', 'set2', 'set3']);
// container now contains [value1, value2 value3]
// set1 now contains [value1, value2, value3]
// set2 now contains [value2, value3]
// there is also a 'set3' in the container containing [value2, value3]

// add or replace value1 omly in the specified sets
// remove from all other sets if it exists there
container.addExclusive(value3, ['set2', 'set3']);
// container still contains [value1, value2 value3]
// set1 now contains [value1, value2]
// set2 now contains [value2, value3]
// there is now also a 'set3' in the container with [value2, value3]

container.delete(value2.id, 'set2');
// set2 now contains [value3]

container.delete(value1.id);
// container now contains [value2 value3]
// set2 now contains []

container.setsBelongedTo(value3.id);
// should return a Set containing ['set1', 'set3']

// there are methods to create union, intersection and subtraction sets from sets
const unionIdSet = container.union(['set1', 'set2', 'set3']);
const intersectionIdSet = container.intersection(['set1', 'set2', 'set3']);
const differenceIdSet = container.difference('set1', ['set2', 'set3']);
const complementIdSet = container.complement(['set2', 'set3']);
// complement returns a differenceIdSet of the specified sets with the container