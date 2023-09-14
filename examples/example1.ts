import { IdObject, IdSet } from 'rxjs-idsets';

const value1 = { id: '1', value: 'value1'};
const value2 = { id: '2', value: 'value2'};
const value3 = { id: '3', value: 'value3'};
const value4 = { id: '4', value: 'value4'};
// ... etc, you get the idea

const value1update = { id: '1', value: 'value1update'};
const value2update = { id: '2', value: 'value2update'};

// create a new set containing 3 values
const exampleSet = new IdSet([value1, value2, value3]);

// we need to define something to collect the results of the subscriptions
let allValues: IdObject[] = [];
let addValues: IdObject[] = [];
let allAddValues: IdObject[] = [];
let createValues: IdObject[] = [];
let updateValues: IdObject[] = [];
let deleteValues: IdObject[] = [];

function clearResults() {
  allValues = [];
  addValues = [];
  allAddValues = [];
  createValues = [];
  updateValues = [];
  deleteValues = [];
}

//---------------------------------------------------------------------------
//  Subscribing to Observables
//---------------------------------------------------------------------------

// subscribe to all$
const allSubscription = exampleSet.all$.subscribe(value => allValues.push(value));

expect(allValues).toEqual([value1, value2, value3]); // exisisting values are passed immediately
expect(allSubscription.closed).toBeTrue(); // closes after all current values are passed

// subscribe to add$
const addSubscription = exampleSet.add$.subscribe(value => addValues.push(value));

expect(addValues).toEqual([]); // nothing new created or updated yet
expect(addSubscription.closed).toBeFalse(); // still active, awaiting values created or updated

// subscribe to allAdd$
const allAddSubscription = exampleSet.allAdd$.subscribe(value => allAddValues.push(value));

expect(allAddValues).toEqual([value1, value2, value3]); // existing values are passed immediately
expect(allAddSubscription.closed).toBeFalse(); // still active, awaiting values created or updated

// subscribe to create$
const createSubscription = exampleSet.create$.subscribe(value => createValues.push(value));

expect(createValues).toEqual([]); // nothing new created yet
expect(createSubscription.closed).toBeFalse(); // still active, awaiting values created

// subscribe to update$
const updateSubscription = exampleSet.update$.subscribe(value => updateValues.push(value));

expect(updateValues).toEqual([]); // nothing existing updated yet
expect(updateSubscription.closed).toBeFalse(); // still active, awaiting values updated

// subscribe to delete$
const deleteSubscription = exampleSet.update$.subscribe(value => deleteValues.push(value));

expect(deleteValues).toEqual([]); // nothingdeleted yet
expect(deleteSubscription.closed).toBeFalse(); // still active, awaiting values deleted

//---------------------------------------------------------------------------
//  add a new value
//---------------------------------------------------------------------------
clearResults();
// start: [value1, value2, value3]
exampleSet.add(value4);
// result: [value1, value2, value3, value4]
expect(addValues).toEqual([value4]);
expect(allAddValues).toEqual([value4]);
expect(createValues).toEqual([value4]);
expect(updateValues).toEqual([]);
expect(deleteValues).toEqual([]);

//---------------------------------------------------------------------------
//  add an existing value 
//    (value4 is a link to an object already existing in the set)
//---------------------------------------------------------------------------
clearResults();
// start: [value1, value2, value3, value4]
exampleSet.add(value4); 
// result: [value1, value2, value3, value4]
expect(addValues).toEqual([]);
expect(allAddValues).toEqual([]); // same value (reference) added, no update published
expect(createValues).toEqual([]);
expect(updateValues).toEqual([]); // same value (reference) added, no update published
expect(deleteValues).toEqual([]);

//---------------------------------------------------------------------------
//  add an updated value
//---------------------------------------------------------------------------
clearResults();
// start: [value1, value2, value3, value4]
exampleSet.add(value1update); 
// result: [value1update, value2, value3, value4]
expect(addValues).toEqual([]);
expect(allAddValues).toEqual([value1update]);
expect(createValues).toEqual([]);
expect(updateValues).toEqual([value1update]);
expect(deleteValues).toEqual([]);

//---------------------------------------------------------------------------
//  delete an existing value
//---------------------------------------------------------------------------
clearResults();
// start: [value1update, value2, value3, value4]
exampleSet.delete(value1.id); 
// result: [value2, value3, value4]
expect(addValues).toEqual([]);
expect(allAddValues).toEqual([]);
expect(createValues).toEqual([]);
expect(updateValues).toEqual([]);
expect(deleteValues).toEqual([value1update]); // this is the value in the set, it has the same id

//---------------------------------------------------------------------------
//  delete a non existing value
//---------------------------------------------------------------------------
clearResults();
// start: [value2, value3, value4]
exampleSet.delete('nonExistingId'); 
// result: [value2, value3, value4]
expect(addValues).toEqual([]);
expect(allAddValues).toEqual([]);
expect(createValues).toEqual([]);
expect(updateValues).toEqual([]);
expect(deleteValues).toEqual([]);

//---------------------------------------------------------------------------
//  replace the contents of the set
//---------------------------------------------------------------------------
clearResults();
// start: [value2, value3, value4]
exampleSet.replace([value1, value2update, value3]); 
// result: [value1, value2update, value3]
// this one does a lot:
// value1 added again
// value2 replaced with value2update
// value3 stays the same
// value4 deleted
expect(addValues).toEqual([value1, value2update]);
expect(allAddValues).toEqual([value1, value2update]);
expect(createValues).toEqual([value1]);
expect(updateValues).toEqual([value2update]);
expect(deleteValues).toEqual([value4]);

//---------------------------------------------------------------------------
//  clear the set
//---------------------------------------------------------------------------
clearResults();
// start: [value1, value2update, value3]
exampleSet.clear(); 
// result: []
expect(addValues).toEqual([]);
expect(allAddValues).toEqual([]);
expect(createValues).toEqual([]);
expect(updateValues).toEqual([]);
expect(deleteValues).toEqual([value1, value2update, value3]);

//---------------------------------------------------------------------------
//  complete all subscriptions
//---------------------------------------------------------------------------
// completes all 
clearResults();
exampleSet.complete();
// all subscriptions are closed, no updates will be published any more
