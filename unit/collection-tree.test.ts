import assert from "node:assert/strict";
import test from "node:test";
import {
  createCollapsedCollectionTreeState,
  expandAllCollectionNodes,
  getExpandableCollectionKeys,
  type CollectionTreeSection,
} from "../src/modules/collection-tree";

const sections: CollectionTreeSection[] = [
  {
    key: "library:1",
    label: "My Library",
    children: [
      {
        key: "collection:1",
        label: "A",
        children: [
          { key: "collection:2", label: "A.1", children: [] },
          {
            key: "collection:3",
            label: "A.2",
            children: [{ key: "collection:4", label: "A.2.a", children: [] }],
          },
        ],
      },
      { key: "collection:5", label: "B", children: [] },
    ],
  },
];

test("collection tree starts collapsed", () => {
  const state = createCollapsedCollectionTreeState();

  assert.deepEqual([...state.expandedCollectionKeys], []);
});

test("expand all only expands nodes with children", () => {
  assert.deepEqual(getExpandableCollectionKeys(sections), [
    "collection:1",
    "collection:3",
  ]);

  const state = expandAllCollectionNodes(sections);
  assert.deepEqual(
    [...state.expandedCollectionKeys],
    ["collection:1", "collection:3"],
  );
});
