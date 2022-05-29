import { describe, it } from 'https://deno.land/std@0.141.0/testing/bdd.ts';
import { expect } from 'https://deno.land/x/expect@v0.2.9/mod.ts';

import { LinkedListItem } from './LinkedListItem.ts';
type GuranteedBehindLinkedListItem<T> = LinkedListItem<T> & {
  behind: GuranteedBehindLinkedListItem<number>;
};

describe('LinkedListItem#constructor', () => {
  it('holds given value', () => {
    const item = new LinkedListItem('value');
    expect(item.value).toBe('value');
  });

  it('calls given unlinkCleanup function if given', () => {
    let called = false;
    const item = new LinkedListItem(1, (): void => {
      called = true;
    });

    expect(called).toBe(false);
    item.unlink();
    expect(called).toBe(true);
  });
});

describe('LinkedListItem#insertBehind', () => {
  it('inserts given LinkedListItem behind this', () => {
    const itemBefore = new LinkedListItem(0);
    const baseItem = new LinkedListItem(1) as GuranteedBehindLinkedListItem<number>;
    itemBefore.insertBehind(baseItem);

    expect(itemBefore.behind).toBe(baseItem);
    expect(baseItem.before).toBe(itemBefore);

    const itemBehind = new LinkedListItem(2);
    baseItem.insertBehind(itemBehind);

    expect(baseItem.behind).toBe(itemBehind);

    const newItemBehind = new LinkedListItem(1.5);
    baseItem.insertBehind(newItemBehind);

    expect(baseItem.behind).toBe(newItemBehind);

    expect(baseItem.behind.behind).toBe(itemBehind);
  });

  it('Adds multiple in a row', () => {
    const item1 = new LinkedListItem(1) as GuranteedBehindLinkedListItem<number>;
    const item2 = new LinkedListItem(2);
    const item3 = new LinkedListItem(3);
    const item21 = new LinkedListItem(4);
    const item22 = new LinkedListItem(5);
    const item23 = new LinkedListItem(6);

    item1.insertBehind(item2);
    item2.insertBehind(item3);

    item21.insertBehind(item22);
    item22.insertBehind(item23);

    item2.insertBehind(item21);

    const expectedResult = [1, 2, 4, 5, 6, 3];
    const result = [];
    let current = item1;
    do {
      result.push(current.value);
      current = current.behind;
    } while (current);
    expect(result).toEqual(expectedResult);
  });
});

describe('LinkedListItem#unlink', () => {
  it("unlinks this item from chain, but doesn't remove the chain info from item", () => {
    const item1 = new LinkedListItem(1);
    const item2 = new LinkedListItem(2);
    const item3 = new LinkedListItem(3);

    item1.insertBehind(item2);
    item2.insertBehind(item3);

    item2.unlink();

    expect(item1.behind).toBe(item3);
    expect(item3.before).toBe(item1);

    expect(item2.before).toBe(item1);
    expect(item2.behind).toBe(item3);
  });

  it('removes the chain info from item if asked to do so', () => {
    const item1 = new LinkedListItem(1);
    const item2 = new LinkedListItem(2);
    const item3 = new LinkedListItem(3);

    item1.insertBehind(item2);
    item2.insertBehind(item3);

    item2.unlink(true);

    expect(item2.before).toBeUndefined();
    expect(item2.behind).toBeUndefined();
  });

  it('runs given unlinkCleanup function', () => {
    let called = false;
    const item1 = new LinkedListItem(1, (): void => {
      called = true;
    });

    expect(called).toBe(false);

    item1.unlink();

    expect(called).toBe(true);
  });
});
