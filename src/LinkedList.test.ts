import { describe, it } from 'https://deno.land/std@0.141.0/testing/bdd.ts';
import { expect } from 'https://deno.land/x/expect@v0.2.9/mod.ts';

import { LinkedList } from './LinkedList.ts';
import { LinkedListItem } from './LinkedListItem.ts';

/**
 * Returns a LinkedList, the corresponding LinkedListItem's and an array of every value
 * @param count Amount of entries in returned list, items and values
 * @param offset Added as offset to the number being stringified and used as value
 */
function getListWithItems(
  count: number,
  offset = 0
): {
  list: LinkedList<string>;
  items: Array<LinkedListItem<string>>;
  values: string[];
} {
  const list = new LinkedList<string>();
  const items = [];
  const values = [];
  for (let i = 0; i < count; i++) {
    const value = (i + offset).toString();
    values.push(value);
    list.push(value);
  }

  items.push(...list.keys());

  return {
    items,
    list,
    values,
  };
}

type GuaranteedNonEmptyLinkedList<T> = LinkedList<T> & {
  first: LinkedListItem<T>;
  last: LinkedListItem<T>;
};

type NonEmptyGetList = ReturnType<typeof getListWithItems> & {
  list: GuaranteedNonEmptyLinkedList<string>;
};

/**
 * Returns a value at given index position in given LinkedList
 * @param list Linkedlist to be traversed
 * @param index Index of entry to be returned
 */
function getValueOnIndex<T>(list: LinkedList<T>, index: number): T {
  let current = list.first;
  while (current && index--) current = current.behind;

  if (!current) {
    throw new Error('Index number yields no entry!');
  }
  return current && current.value;
}

function getCallbackThisArgTest<
  K extends keyof Pick<
    LinkedList<string>,
    'every' | 'some' | 'filter' | 'find' | 'findItem' | 'forEach' | 'map'
  >
>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  targetedFunction: K
): () => void {
  return (): void => {
    const { list } = getListWithItems(1);

    const newThis1 = { testvalue: 1 };
    let callbackBeenCalled1 = false;
    // deno-lint-ignore no-explicit-any
    type Any = any;
    (list[targetedFunction] as (cb: (...arg: Any[]) => Any, thisArg: Any) => Any)(function (
      this: typeof newThis1
    ): void {
      callbackBeenCalled1 = true;
      expect(this).toBe(newThis1);
      return;
    },
    newThis1);

    expect(callbackBeenCalled1).toBe(true);

    const newThis2 = -1;
    let callbackBeenCalled2 = false;
    (list[targetedFunction] as (cb: (...arg: Any[]) => Any, thisArg: Any) => Any)(function (
      this: typeof newThis2
    ): void {
      callbackBeenCalled2 = true;
      expect(this).toBe(newThis2);
      return;
    },
    newThis2);

    expect(callbackBeenCalled2).toBe(true);
  };
}

describe('Helper functions are working', () => {
  it('getListWithItems returns valid pairs of list, items and values', () => {
    const consistentLength = 7;
    const { list, items, values: givenValues } = getListWithItems(consistentLength);
    const expectedValues = ['0', '1', '2', '3', '4', '5', '6'];

    expect(expectedValues.length).toBe(consistentLength);
    expect(items.length).toBe(consistentLength);
    expect(givenValues.length).toBe(consistentLength);
    expect(list.length).toBe(consistentLength);

    expect(expectedValues.every((value) => expectedValues.includes(value))).toBe(true);
    expect(items.every((item) => expectedValues.includes(item.value))).toBe(true);
    expect(list.every((value) => expectedValues.includes(value))).toBe(true);
  });

  it('getValueOnIndex returns the right value for given index', () => {
    const { list, values } = getListWithItems(5);

    for (let i = 0; i < values.length; i++) {
      expect(getValueOnIndex(list, i)).toBe(values[i]);
    }
  });
});

describe('LinkedList#constructor', () => {
  it('creates new LinkedList on call', () => {
    const list = new LinkedList<number>();
    expect(list).toBeInstanceOf(LinkedList);
    expect(list.length).toBe(0);
    expect(list.first).toBeUndefined();
    expect(list.last).toBeUndefined();
  });

  it('creates filled LinkedList if iteratable is given', () => {
    const list = new LinkedList([1, 2, false, true]);
    expect(list.length).toBe(4);
    expect([...list.values()]).toEqual([1, 2, false, true]);
  });
});

describe('LinkedList#clear', () => {
  it('removes first item', () => {
    const { list } = getListWithItems(3);
    list.clear();
    expect(list.first).toBeUndefined();
  });

  it('removes last item', () => {
    const { list } = getListWithItems(3);
    list.clear();
    expect(list.last).toBeUndefined();
  });

  it('resets length', () => {
    const { list } = getListWithItems(3);
    list.clear();
    expect(list.length).toBe(0);
  });

  it('properly unchains if unchain = true', () => {
    const { list } = getListWithItems(3);
    const item = list.first?.behind as LinkedListItem<unknown>;
    expect(item).toBeDefined();
    expect(item.before).toBeDefined();
    expect(item.behind).toBeDefined();
    list.clear(true);
    expect(item.before).toBeUndefined();
    expect(item.behind).toBeUndefined();
  });
});

describe('LinkedList#every', () => {
  it('iterates for every element as long as a truthy value is returned', () => {
    const { list } = getListWithItems(3);
    let count = 0;
    const fncReturn = list.every(() => !!++count);
    expect(count).toBe(3);
    expect(fncReturn).toBe(true);
  });

  it('breaks on any falsy return', () => {
    const { list } = getListWithItems(3);
    let countdown = 2;
    let count = 0;

    const fncReturn = list.every(() => !!++count && !!--countdown);
    expect(count).toBe(2);
    expect(fncReturn).toBe(false);
  });

  it('set callback-this correctly', getCallbackThisArgTest('every'));
});

describe('LinkedList#filter', () => {
  it('returns only values for which callback returns truthy', () => {
    const { list, items } = getListWithItems(10);
    const allowedItems = new Set(['1', '2', '5', '7']);

    const filteredList = list.filter((value, item, innerList) => {
      expect(items.includes(item)).toBe(true);
      expect(innerList).toBe(list);
      return allowedItems.has(value);
    });

    const filteredValues = [...filteredList.values()];
    expect(filteredValues.length).toBe(allowedItems.size);
    expect(filteredValues.every((value) => allowedItems.has(value))).toBe(true);
  });

  it('returns empty LinkedList if callback never was truthy', () => {
    const { list } = getListWithItems(3);
    const filteredList = list.filter(() => false);
    expect(filteredList.length).toBe(0);
  });

  it('returns empty LinkedList for empty LinkedList', () => {
    const { list } = getListWithItems(0);
    const filteredList = list.filter(() => true);
    expect(filteredList.length).toBe(0);
  });

  it('set callback-this correctly', getCallbackThisArgTest('filter'));
});

describe('LinkedList#find', () => {
  it('finds in LinkedList', () => {
    const { list } = getListWithItems(5);
    const found = list.find((value) => value === '3');

    expect(found).toBe('3');
  });

  it('set callback-this correctly', getCallbackThisArgTest('find'));
});

describe('LinkedList#findItem', () => {
  it('finds in LinkedList', () => {
    const { list, items } = getListWithItems(7);
    const foundItem = list.findItem((value) => value === '6');

    expect(foundItem).toBe(items[6]);
  });

  it('set callback-this correctly', getCallbackThisArgTest('findItem'));
});

describe('LinkedList#forEach', () => {
  it('runs function for each element', () => {
    const { list, values } = getListWithItems(4);

    const forEachResponses = [true, false, {}, 5];
    let forEachRun = 0;
    list.forEach((value) => {
      forEachRun++;
      expect(values.includes(value)).toBe(true);
      return forEachResponses[forEachRun];
    });

    expect(forEachRun).toBe(4);
  });

  it('set callback-this correctly', getCallbackThisArgTest('forEach'));
});

describe('LinkedList#includes', () => {
  it('returns true on found element', () => {
    const { list } = getListWithItems(5);
    expect(list.includes('3')).toBe(true);
  });
  it('returns false if element is not found', () => {
    const { list } = getListWithItems(5);
    expect(list.includes('5')).toBe(false);
  });

  it('returns false on empty list', () => {
    const { list } = getListWithItems(0);
    expect(list.includes('0')).toBe(false);
  });
});

describe('LinkedLIst#itemOf', () => {
  it('returns item for found value', () => {
    const { list, items } = getListWithItems(5);
    const item = list.itemOf('4');
    expect(item).toBe(items[4]);
  });

  it('returns first item found', () => {
    const { list } = getListWithItems(5);
    list.push('0');
    const item = list.itemOf('0');
    expect(item).toBe(list.first);
    expect(item).not.toBe(list.last);
    expect(list.first).not.toBe(list.last);
  });

  it('returns undefined for not found item or empty list', () => {
    const { list: emptyList } = getListWithItems(0);
    const { list } = getListWithItems(2);
    expect(emptyList.itemOf('0')).toBeUndefined();
    expect(list.itemOf('2')).toBeUndefined();
  });
});

describe('LinkedList#lastItemOf', () => {
  it('returns item for found value', () => {
    const { list, items } = getListWithItems(5);
    const item = list.lastItemOf('4');
    expect(item).toBe(items[4]);
  });

  it('returns first item found', () => {
    const { list } = getListWithItems(5);
    list.push('0');
    const item = list.lastItemOf('0');
    expect(item).toBe(list.last);
    expect(item).not.toBe(list.first);
    expect(list.first).not.toBe(list.last);
  });

  it('returns undefined for not found item or empty list', () => {
    const { list: emptyList } = getListWithItems(0);
    const { list } = getListWithItems(2);
    expect(emptyList.lastItemOf('0')).toBeUndefined();
    expect(list.lastItemOf('2')).toBeUndefined();
  });
});

describe('LinkedList#map', () => {
  it('maps for every item in list', () => {
    const { list } = getListWithItems(4);
    const expectedOutput = [1, 2, 3, 4];
    const output = list.map((value) => parseInt(value, 10) + 1);
    expect(output.length).toBe(4);
    expect(output.every((value) => expectedOutput.includes(value))).toBe(true);
  });

  it('passes items and list as second and third argument', () => {
    const { list, items } = getListWithItems(5);
    let iterationCount = 0;
    list.map((_, item, listParameter) => {
      iterationCount++;
      expect(items.includes(item)).toBe(true);
      expect(listParameter).toBe(list);
    });

    expect(iterationCount).toBe(5);
  });

  it("returns empty list for lists and doesn't run callback", () => {
    const { list } = getListWithItems(0);
    let callbackRun = false;
    const newList = list.map(() => {
      callbackRun = true;
    });

    expect(newList.length).toBe(0);
    expect(callbackRun).toBe(false);
  });

  it('set callback-this correctly', getCallbackThisArgTest('map'));
});

describe('LinkedList#reduce', () => {
  it('without given initialValue, uses first value', () => {
    const { list } = getListWithItems(3, 5);
    const expectedOutput = '5,6,7';
    const output = list.reduce((acc, value) => {
      return (acc += `,${value}`);
    });
    expect(output).toBe(expectedOutput);
  });

  it('works with given initialValue', () => {
    const { list } = getListWithItems(3, 1);
    const finalValue = list.reduce((acc, value) => acc + parseInt(value, 10), -100);
    expect(finalValue).toBe(-94);
  });

  it('throws on empty list with empty accumulator', () => {
    const list = new LinkedList();
    expect(() =>
      list.reduce(() => {
        return;
      })
    ).toThrow('Empty accumulator on empty LinkedList is not allowed.');
  });

  it('with empty LinkedList and initialValue, return initialValue', () => {
    const list = new LinkedList<string>();
    let callbackCalled = false;
    const output = list.reduce<string>(() => {
      callbackCalled = true;
      return 'newValue';
    }, 'initialValue');

    expect(callbackCalled).toBe(false);
    expect(output).toBe('initialValue');
  });

  it('LinkedList with only one entry and no initialValue returns its entry', () => {
    const list = new LinkedList([5]);
    let callbackCalled = false;
    const output = list.reduce(() => {
      callbackCalled = true;
    });

    expect(callbackCalled).toBe(false);
    expect(output).toBe(5);
  });
});

describe('LinkedList#reduceRight', () => {
  it('without given initialValue, uses first value', () => {
    const { list } = getListWithItems(3, 5);
    const expectedOutput = '7,6,5';
    const output = list.reduceRight((acc, value) => {
      return (acc += `,${value}`);
    });
    expect(output).toBe(expectedOutput);
  });

  it('works with given initialValue', () => {
    const { list } = getListWithItems(3, 1);
    const finalValue = list.reduceRight<string[]>((acc, value) => {
      acc.push(value);
      return acc;
    }, []);
    expect(finalValue).toEqual(['3', '2', '1']);
  });

  it('throws on empty list with empty accumulator', () => {
    const list = new LinkedList();
    expect(() =>
      list.reduceRight(() => {
        return;
      })
    ).toThrow('Empty accumulator on empty LinkedList is not allowed.');
  });

  it('with empty LinkedList and initialValue, return initialValue', () => {
    const list = new LinkedList<string>();
    let callbackCalled = false;
    const output = list.reduceRight<string>(() => {
      callbackCalled = true;
      return 'newValue';
    }, 'initialValue');

    expect(callbackCalled).toBe(false);
    expect(output).toBe('initialValue');
  });

  it('LinkedList with only one entry and no initialValue returns its entry', () => {
    const list = new LinkedList([5]);
    let callbackCalled = false;
    const output = list.reduceRight(() => {
      callbackCalled = true;
    });

    expect(callbackCalled).toBe(false);
    expect(output).toBe(5);
  });
});

describe('LinkedList#some', () => {
  it('breaks as soon as a value has been found', () => {
    const { list } = getListWithItems(4);
    let iterationCount = 0;
    const returnedValue = list.some((value) => {
      iterationCount++;
      return value === '2';
    });

    expect(iterationCount).toBe(3);
    expect(returnedValue).toBe(true);
  });

  it("doesn't break if no value could be found", () => {
    const { list } = getListWithItems(5);
    let iterationCount = 0;

    const returnedValue = list.some((value) => {
      iterationCount++;
      return value === '5';
    });

    expect(iterationCount).toBe(5);
    expect(returnedValue).toBe(false);
  });

  it('always false for empty LinkedList', () => {
    const list = new LinkedList<string>();
    let iterationCount = 0;

    const returnedValue = list.some(() => {
      iterationCount++;
      return true;
    });

    expect(iterationCount).toBe(0);
    expect(returnedValue).toBe(false);
  });

  it('set callback-this correctly', getCallbackThisArgTest('some'));
});

describe('LinkedList#join', () => {
  it('joins like array', () => {
    const list = new LinkedList([-1, 'abc', true]);
    const returnValue1 = list.join();
    expect(returnValue1).toBe('-1,abc,true');
    const returnValue2 = list.join('-');
    expect(returnValue2).toBe('-1-abc-true');
  });

  it('joins nothing if LinkedList is empty', () => {
    const list = new LinkedList();
    const returnValue = list.join('/');
    expect(returnValue).toBe('');
  });
});

describe('LinkedList#concat', () => {
  it("joins pure LinkedList's together", () => {
    const { list: list1 }: NonEmptyGetList = getListWithItems(2) as NonEmptyGetList;
    const { list: list2 } = getListWithItems(2, 10) as NonEmptyGetList;
    const { list: list3, items: items3 } = getListWithItems(2, 20) as NonEmptyGetList;

    const joinedList1: GuaranteedNonEmptyLinkedList<string> = list1.concat(
      list2,
      list3
    ) as GuaranteedNonEmptyLinkedList<string>;
    // if(!joinedList1.first || !joinedList1.last) {
    // 	return expect(true).toBe(false);
    // }

    for (const list of [list1, list2, list3]) {
      for (const value of list.values()) {
        expect(joinedList1.includes(value)).toBe(true);
      }
    }

    for (const value of joinedList1.values()) {
      expect(list1.includes(value) || list2.includes(value) || list3.includes(value)).toBe(
        true
      );
    }

    // The first element of the joined list holds the value of the first element of the first list
    expect(joinedList1.first.value).toBe(list1.first.value);

    // the last element of the joined list holds the value of the last element of the third list
    expect((joinedList1.last as LinkedListItem<string>).value).toBe(
      (list3.last as LinkedListItem<string>).value
    );

    // Includes 11, which is the second element from the second list
    expect(joinedList1.includes('11')).toBe(true);

    // Includes value of the first item of the third list
    expect(getValueOnIndex(joinedList1, 4)).toBe(items3[0].value);

    const joinedList2: GuaranteedNonEmptyLinkedList<string> = list1
      .concat(list2)
      .concat(list3) as GuaranteedNonEmptyLinkedList<string>;

    let current1: LinkedListItem<string> | undefined = joinedList1.first;
    let current2: LinkedListItem<string> | undefined = joinedList2.first;
    do {
      expect(current1.value).toBe(current2.value);
      current1 = current1.behind;
      current2 = current2.behind;
    } while (current1 && current2);

    // Expect both to be undefined
    expect(current1).toBeUndefined();
    expect(current2).toBeUndefined();
  });

  it("does not use LinkedListItem's of concat'ed LinkedList's", () => {
    const { list: list1, items: items1 } = getListWithItems(2);
    const { list: list2, items: items2 } = getListWithItems(2, 10);

    const joinedList = list1.concat(list2);

    let current = joinedList.first;

    while (current) {
      expect(items1.includes(current)).toBe(false);
      expect(items2.includes(current)).toBe(false);
      current = current.behind;
    }
  });

  it('joins abitrary items together', () => {
    const { list: list1, items: items1 } = getListWithItems(2);
    const { list: list2, items: items2 } = getListWithItems(2, 10);
    const stringValue = 'abc';
    const objectValue = { a: 1 };
    const arrayValue: null[] = [null];

    // deno-lint-ignore ban-types
    const joinedList = list1.concat<string | object | null>(
      stringValue,
      list2,
      objectValue,
      arrayValue,
      list1
    );
    expect(getValueOnIndex(joinedList, 4)).toBe(items2[1].value);
    expect(getValueOnIndex(joinedList, 5)).toBe(objectValue);
    expect(getValueOnIndex(joinedList, 8)).toBe(items1[1].value);
  });
});

describe('LinkedList#pop', () => {
  it('returns and removes last element from LinkedList', () => {
    const { list, values } = getListWithItems(4);
    const returnedValue = list.pop();
    expect(returnedValue).toBe(values[values.length - 1]);
    expect(list.length).toBe(3);
  });

  it('returns undefined on empty list', () => {
    const { list } = getListWithItems(0);
    const returnedValue = list.pop();
    expect(returnedValue).toBe(undefined);
    expect(list.length).toBe(0);
  });
});

describe('LinkedList#shift', () => {
  it('returns and removes first element from LinkedList', () => {
    const { list, values } = getListWithItems(4);
    const returnedValue = list.shift();
    expect(returnedValue).toBe(values[0]);
    expect(list.length).toBe(3);
  });

  it('returns undefined on empty list', () => {
    const { list } = getListWithItems(0);
    const returnedValue = list.shift();
    expect(returnedValue).toBe(undefined);
    expect(list.length).toBe(0);
  });
});

describe('LinkedList#push', () => {
  it('adds element to the end of the LinkedList', () => {
    const emptyList = new LinkedList();
    expect(emptyList.first).toBeUndefined();
    expect(emptyList.last).toBeUndefined();

    emptyList.push('anything');
    expect(emptyList.first).toBe(emptyList.last);
    expect(emptyList.length).toBe(1);
    expect((emptyList as GuaranteedNonEmptyLinkedList<string>).first.value).toBe('anything');

    const list = new LinkedList([1, 2, 3]) as GuaranteedNonEmptyLinkedList<number>;
    list.push(-1);
    expect(list.last.value).toBe(-1);
    expect(list.length).toBe(4);
  });
});

describe('LinkedList#unshift', () => {
  it('adds element to the beginning of the LinkedList', () => {
    const emptyList = new LinkedList<string>();

    emptyList.unshift('anything');
    expect(emptyList.first).toBe(emptyList.last);
    expect(emptyList.length).toBe(1);
    expect((emptyList as GuaranteedNonEmptyLinkedList<string>).last.value).toBe('anything');

    const list = new LinkedList([1, 2, 3]) as GuaranteedNonEmptyLinkedList<number>;
    list.unshift(-1);
    expect(list.first.value).toBe(-1);
    expect(list.length).toBe(4);
  });
});

describe('LikedList#remove', () => {
  it('removes a value from LinkedList', () => {
    const list = new LinkedList([3, 4, 5, 3]);
    const returnedValue = list.remove(3);
    expect(returnedValue).toBe(true);
    expect(list.length).toBe(3);
    expect([...list.values()]).toEqual([4, 5, 3]);
  });

  it('removes nothing if value could not be found', () => {
    const list = new LinkedList([4, 5, 6]);
    const returnedValue = list.remove(7);
    expect(returnedValue).toBe(false);
    expect(list.length).toBe(3);
    expect([...list.values()]).toEqual([4, 5, 6]);
  });
});

describe('LinkedList#removeAllOccurrences', () => {
  it('removes a value from LinkedList', () => {
    const list = new LinkedList([3, 4, 5, 3]);
    const returnedValue = list.removeAllOccurrences(3);
    expect(returnedValue).toBe(true);
    expect(list.length).toBe(2);
    expect([...list.values()]).toEqual([4, 5]);
  });

  it('removes nothing if value could not be found', () => {
    const list = new LinkedList([4, 5, 6]);
    const returnedValue = list.removeAllOccurrences(7);
    expect(returnedValue).toBe(false);
    expect(list.length).toBe(3);
    expect([...list.values()]).toEqual([4, 5, 6]);
  });
});

describe('LinkedList#entries,[Symbol.iterator]', () => {
  it('returns exactly the content of the list', () => {
    const { list, items, values } = getListWithItems(4);
    const iteratorResponse = [...list[Symbol.iterator]()];
    const entriesResponse = [...list.entries()];

    expect(iteratorResponse.length).toBe(4);
    expect(
      iteratorResponse.every(([item, value]) => items.includes(item) && values.includes(value))
    ).toBe(true);

    expect(entriesResponse.length).toBe(4);
    expect(
      entriesResponse.every(([item, value]) => items.includes(item) && values.includes(value))
    ).toBe(true);
  });

  it('returns nothing if list is empty', () => {
    const { list } = getListWithItems(0);
    const iteratorResponse = [...list[Symbol.iterator]()];
    const entriesResponse = [...list.entries()];

    expect(iteratorResponse.length).toBe(0);
    expect(entriesResponse.length).toBe(0);
  });
});

describe('LinkedList#keys', () => {
  it('returns exactly the content of the list', () => {
    const { list, items } = getListWithItems(4);
    const keyResponse = [...list.keys()];

    expect(keyResponse.length).toBe(4);
    expect(keyResponse.every((item) => items.includes(item))).toBe(true);
  });

  it('returns nothing if list is empty', () => {
    const { list } = getListWithItems(0);
    const keyResponse = [...list.keys()];

    expect(keyResponse.length).toBe(0);
  });
});

describe('LinkedList#values', () => {
  it('returns exactly the content of the list', () => {
    const { list, values } = getListWithItems(4);

    const valuesResponse = [...list.values()];
    expect(valuesResponse.length).toBe(4);
    expect(valuesResponse.every((value) => values.includes(value))).toBe(true);
  });

  it('returns nothing if list is empty', () => {
    const { list } = getListWithItems(0);
    const valuesResponse = [...list.values()];

    expect(valuesResponse.length).toBe(0);
  });
});
