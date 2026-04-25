export interface CollectionTreeNode {
  key: string;
  label: string;
  children: CollectionTreeNode[];
}

export interface CollectionTreeSection {
  key: string;
  label: string;
  children: CollectionTreeNode[];
}

export interface CollectionTreeState {
  expandedCollectionKeys: Set<string>;
}

export function createCollapsedCollectionTreeState(): CollectionTreeState {
  return {
    expandedCollectionKeys: new Set(),
  };
}

export function expandAllCollectionNodes(
  sections: CollectionTreeSection[],
): CollectionTreeState {
  return {
    expandedCollectionKeys: new Set(getExpandableCollectionKeys(sections)),
  };
}

export function getExpandableCollectionKeys(sections: CollectionTreeSection[]) {
  return sections.flatMap((section) =>
    section.children.flatMap((node) => getExpandableNodeKeys(node)),
  );
}

export function getDescendantKeys(node: CollectionTreeNode): string[] {
  return node.children.flatMap((child) => [
    child.key,
    ...getDescendantKeys(child),
  ]);
}

function getExpandableNodeKeys(node: CollectionTreeNode): string[] {
  if (!node.children.length) {
    return [];
  }

  return [
    node.key,
    ...node.children.flatMap((child) => getExpandableNodeKeys(child)),
  ];
}
