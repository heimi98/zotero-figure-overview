import { getString } from "../utils/locale";
import { getPref, setPref } from "../utils/prefs";
import {
  createCollapsedCollectionTreeState,
  expandAllCollectionNodes,
  getDescendantKeys,
  type CollectionTreeNode,
  type CollectionTreeSection,
  type CollectionTreeState,
} from "./collection-tree";
import {
  collectFigureAnnotations,
  type FigureAnnotationRecord,
} from "./figure-annotations";
import {
  COLLECTION_KEY_PREFIX,
  UNCATEGORIZED_COLLECTION_KEY,
  clampThumbnailSize,
  createDefaultOverviewFilters,
  getAvailableColors,
  recordMatchesOverviewFilters,
  setThumbnailSizeStyle,
  type OverviewFilters,
} from "./overview-filters";
import { openFigureInReader } from "./reader-navigation";

const XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const HOVER_PREVIEW_DELAY_MS = 1000;
const HOVER_PREVIEW_VIEWPORT_RATIO = 0.72;
const HOVER_PREVIEW_MARGIN = 12;

class OverviewController {
  private records: FigureAnnotationRecord[] = [];
  private filters: OverviewFilters = createDefaultOverviewFilters([]);
  private sections: CollectionTreeSection[] = [];
  private collectionTreeState: CollectionTreeState =
    createCollapsedCollectionTreeState();
  private hoverPreviewTimer: number | null = null;
  private hoverPreviewElement: HTMLElement | null = null;
  private hoverPreviewImage: HTMLImageElement | null = null;

  constructor(private readonly win: Window) {}

  async init() {
    this.getRefreshButton().addEventListener("click", () => {
      void this.reload({ forceRefresh: true });
    });
    this.getSizeInput().addEventListener("input", () => {
      this.filters.thumbnailSize = clampThumbnailSize(
        Number(this.getSizeInput().value),
      );
      setPref("thumbnailSize", this.filters.thumbnailSize);
      this.render();
    });
    this.getExpandAllButton().addEventListener("click", () => {
      this.collectionTreeState = expandAllCollectionNodes(this.sections);
      this.renderCollections();
    });
    this.getCollapseAllButton().addEventListener("click", () => {
      this.collectionTreeState = createCollapsedCollectionTreeState();
      this.renderCollections();
    });
    await this.reload();
  }

  teardown() {
    this.hideHoverPreview();
    this.getGrid().replaceChildren();
  }

  private async reload(options: { forceRefresh?: boolean } = {}) {
    this.hideHoverPreview();
    this.getStatus().textContent = getString("overview-loading");
    try {
      this.records = await collectFigureAnnotations(options);
      this.sections = getCollectionTreeSections(this.records);
      this.collectionTreeState = createCollapsedCollectionTreeState();
      this.filters = createDefaultOverviewFilters(this.records);
      this.filters.thumbnailSize = clampThumbnailSize(getPref("thumbnailSize"));
      for (const key of getAllCollectionKeys(this.sections)) {
        this.filters.selectedCollectionKeys.add(key);
      }
      this.getSizeInput().value = String(this.filters.thumbnailSize);
      this.render();
    } catch (error) {
      Zotero.logError(
        error instanceof Error ? error : new Error(String(error)),
      );
      this.records = [];
      this.sections = [];
      this.filters = createDefaultOverviewFilters([]);
      this.getCollections().replaceChildren();
      this.getColors().replaceChildren();
      this.getGrid().replaceChildren();
      this.getCount().textContent = "";
      this.getStatus().textContent = getString("overview-load-failed");
    }
  }

  private render() {
    this.hideHoverPreview();
    const visibleRecords = this.records.filter((record) =>
      recordMatchesOverviewFilters(record, this.filters),
    );

    setThumbnailSizeStyle(this.getGrid(), this.filters.thumbnailSize);
    this.renderColors();
    this.renderCollections();
    this.renderCards(visibleRecords);
    this.getStatus().textContent = visibleRecords.length
      ? ""
      : getString("overview-empty");
    this.getCount().textContent = getString("overview-count", {
      args: { shown: visibleRecords.length, total: this.records.length },
    });
  }

  private renderColors() {
    const container = this.getColors();
    container.replaceChildren();
    for (const color of getAvailableColors(this.records)) {
      const chip = createHTMLElement(this.win, "button");
      chip.className = "figure-color-chip";
      chip.type = "button";
      chip.style.setProperty("--chip-color", color);
      chip.setAttribute(
        "aria-pressed",
        String(this.filters.selectedColors.has(color)),
      );
      chip.setAttribute("title", color);
      chip.addEventListener("click", () => {
        toggleSetValue(this.filters.selectedColors, color);
        this.render();
      });
      container.append(chip);
    }
  }

  private renderCollections() {
    const container = this.getCollections();
    container.replaceChildren();
    for (const section of this.sections) {
      const sectionElement = createHTMLElement(this.win, "section");
      if (section.label.trim()) {
        const title = createHTMLElement(this.win, "div");
        title.className = "figure-library-title";
        title.textContent = section.label;
        sectionElement.append(title);
      }
      for (const node of section.children) {
        this.appendCollectionNode(sectionElement, node, 0);
      }
      container.append(sectionElement);
    }
  }

  private appendCollectionNode(
    container: Element,
    node: CollectionTreeNode,
    depth: number,
  ) {
    const row = createHTMLElement(this.win, "div");
    row.className = "figure-collection-node";
    row.style.setProperty("--depth", String(depth));

    const checkbox = createHTMLElement(this.win, "input");
    checkbox.type = "checkbox";
    checkbox.checked = this.filters.selectedCollectionKeys.has(node.key);
    checkbox.addEventListener("change", () => {
      const keys = [node.key, ...getDescendantKeys(node)];
      for (const key of keys) {
        if (checkbox.checked) {
          this.filters.selectedCollectionKeys.add(key);
        } else {
          this.filters.selectedCollectionKeys.delete(key);
        }
      }
      this.render();
    });

    const label = createHTMLElement(this.win, "label");
    label.textContent = node.label;
    const disclosure = this.createDisclosureButton(node);
    row.append(disclosure, checkbox, label);
    container.append(row);

    if (this.collectionTreeState.expandedCollectionKeys.has(node.key)) {
      for (const child of node.children) {
        this.appendCollectionNode(container, child, depth + 1);
      }
    }
  }

  private createDisclosureButton(node: CollectionTreeNode) {
    const button = createHTMLElement(this.win, "button");
    button.className = "figure-disclosure";
    button.type = "button";
    if (!node.children.length) {
      button.disabled = true;
      button.textContent = "";
      return button;
    }

    const expanded = this.collectionTreeState.expandedCollectionKeys.has(
      node.key,
    );
    button.textContent = expanded ? "▾" : "▸";
    button.setAttribute("aria-expanded", String(expanded));
    button.addEventListener("click", () => {
      if (expanded) {
        this.collectionTreeState.expandedCollectionKeys.delete(node.key);
      } else {
        this.collectionTreeState.expandedCollectionKeys.add(node.key);
      }
      this.renderCollections();
    });
    return button;
  }

  private renderCards(records: FigureAnnotationRecord[]) {
    const grid = this.getGrid();
    grid.replaceChildren();

    for (const record of records) {
      const card = createHTMLElement(this.win, "article");
      card.className = "figure-card";
      card.tabIndex = 0;
      card.addEventListener("dblclick", () => {
        void this.openRecord(record);
      });
      card.addEventListener("keydown", (event) => {
        if ((event as KeyboardEvent).key === "Enter") {
          void this.openRecord(record);
        }
      });

      const imageWrap = createHTMLElement(this.win, "div");
      const previewHeight = `${getImageWrapHeight(
        this.filters.thumbnailSize,
      )}px`;
      imageWrap.className = "figure-image-wrap";
      imageWrap.style.setProperty("--figure-image-height", previewHeight);
      imageWrap.style.height = previewHeight;
      if (record.imageURI) {
        const image = createHTMLElement(this.win, "img");
        image.src = record.imageURI;
        image.draggable = false;
        image.alt = record.topLevelTitle;
        image.addEventListener("error", () => {
          this.hideHoverPreview();
          imageWrap.replaceChildren(this.createMissingImageMessage());
        });
        imageWrap.addEventListener("mouseenter", () => {
          this.scheduleHoverPreview(image, record);
        });
        imageWrap.addEventListener("mouseleave", () => {
          if (!this.hoverPreviewElement) {
            this.clearHoverPreviewTimer();
          }
        });
        imageWrap.append(image);
      } else {
        imageWrap.append(this.createMissingImageMessage());
      }

      const meta = createHTMLElement(this.win, "div");
      meta.className = "figure-meta";
      const swatch = createHTMLElement(this.win, "div");
      swatch.className = "figure-swatch";
      swatch.style.setProperty("--annotation-color", record.color);
      const title = createHTMLElement(this.win, "div");
      title.className = "figure-title";
      title.textContent = record.topLevelTitle;
      const page = createHTMLElement(this.win, "div");
      page.className = "figure-page";
      page.textContent = record.pageLabel ? `p. ${record.pageLabel}` : "";
      meta.append(swatch, title, page);
      if (record.comment) {
        const comment = createHTMLElement(this.win, "div");
        comment.className = "figure-comment";
        comment.textContent = record.comment;
        meta.append(comment);
      }

      card.append(imageWrap, meta);
      grid.append(card);
    }
  }

  private createMissingImageMessage() {
    const message = createHTMLElement(this.win, "div");
    message.className = "figure-missing";
    message.textContent = getString("overview-image-missing");
    return message;
  }

  private scheduleHoverPreview(
    image: HTMLImageElement,
    record: FigureAnnotationRecord,
  ) {
    this.hideHoverPreview();
    this.hoverPreviewTimer = this.win.setTimeout(() => {
      this.hoverPreviewTimer = null;
      this.showHoverPreview(image, record);
    }, HOVER_PREVIEW_DELAY_MS);
  }

  private showHoverPreview(
    sourceImage: HTMLImageElement,
    record: FigureAnnotationRecord,
  ) {
    const sourceRect = sourceImage.getBoundingClientRect();
    const previewSize = getHoverPreviewSize(this.win, sourceImage, sourceRect);
    const previewHost = this.getHoverPreviewHost();
    if (!previewSize || !previewHost) {
      return;
    }

    const preview = createHTMLElement(this.win, "div");
    preview.className = "figure-hover-preview";

    const previewImage = createHTMLElement(this.win, "img");
    previewImage.src = sourceImage.currentSrc || sourceImage.src;
    previewImage.alt = record.topLevelTitle;
    previewImage.draggable = false;
    previewImage.style.width = `${previewSize.width}px`;
    previewImage.style.height = `${previewSize.height}px`;

    preview.addEventListener("mouseleave", () => {
      this.hideHoverPreview();
    });
    preview.addEventListener("dblclick", () => {
      void this.openRecord(record);
    });
    preview.append(previewImage);
    previewHost.append(preview);

    this.hoverPreviewElement = preview;
    this.hoverPreviewImage = previewImage;
    this.positionHoverPreview(preview, sourceRect, previewSize);
  }

  private getHoverPreviewHost() {
    return (
      this.win.document.body ??
      this.win.document.getElementById("zotero-figure-overview-root")
    );
  }

  private positionHoverPreview(
    preview: HTMLElement,
    sourceRect: DOMRect,
    previewSize: HoverPreviewSize,
  ) {
    const position = getHoverPreviewPosition(this.win, sourceRect, previewSize);
    preview.style.left = `${position.left}px`;
    preview.style.top = `${position.top}px`;
  }

  private hideHoverPreview() {
    this.clearHoverPreviewTimer();
    this.hoverPreviewElement?.remove();
    this.hoverPreviewElement = null;
    this.hoverPreviewImage = null;
  }

  private clearHoverPreviewTimer() {
    if (this.hoverPreviewTimer === null) {
      return;
    }
    this.win.clearTimeout(this.hoverPreviewTimer);
    this.hoverPreviewTimer = null;
  }

  private async openRecord(record: FigureAnnotationRecord) {
    try {
      await openFigureInReader(record);
    } catch (error) {
      Zotero.logError(
        error instanceof Error ? error : new Error(String(error)),
      );
      this.getStatus().textContent = getString("overview-open-failed");
    }
  }

  private getRefreshButton() {
    return this.getElement<HTMLButtonElement>("zotero-figure-overview-refresh");
  }

  private getExpandAllButton() {
    return this.getElement<HTMLButtonElement>(
      "zotero-figure-overview-expand-all",
    );
  }

  private getCollapseAllButton() {
    return this.getElement<HTMLButtonElement>(
      "zotero-figure-overview-collapse-all",
    );
  }

  private getCollections() {
    return this.getElement<HTMLElement>("zotero-figure-overview-collections");
  }

  private getColors() {
    return this.getElement<HTMLElement>("zotero-figure-overview-colors");
  }

  private getSizeInput() {
    return this.getElement<HTMLInputElement>("zotero-figure-overview-size");
  }

  private getCount() {
    return this.getElement<HTMLElement>("zotero-figure-overview-count");
  }

  private getStatus() {
    return this.getElement<HTMLElement>("zotero-figure-overview-status");
  }

  private getGrid() {
    return this.getElement<HTMLElement>("zotero-figure-overview-grid");
  }

  private getElement<T extends HTMLElement>(id: string) {
    const element = this.win.document.getElementById(id);
    if (!element) {
      throw new Error(`Missing overview element: ${id}`);
    }
    return element as T;
  }
}

export async function initializeOverviewWindow(win: Window) {
  const controller = new OverviewController(win);
  (
    win as Window & { __figureOverviewController?: OverviewController }
  ).__figureOverviewController = controller;
  await controller.init();
}

export function teardownOverviewWindow(win: Window) {
  const state = win as Window & {
    __figureOverviewController?: OverviewController;
  };
  state.__figureOverviewController?.teardown();
  delete state.__figureOverviewController;
}

function getCollectionTreeSections(records: FigureAnnotationRecord[]) {
  const sections: CollectionTreeSection[] = [];
  for (const library of Zotero.Libraries.getAll()) {
    if (library.libraryType === "feed") {
      continue;
    }
    const roots = Zotero.Collections.getByLibrary(library.id, false).map(
      (collection) => buildCollectionNode(collection),
    );
    sections.push({
      key: `library:${library.id}`,
      label: library.name,
      children: roots,
    });
  }

  if (records.some((record) => !record.collectionIDs.length)) {
    sections.push({
      key: "special",
      label: "",
      children: [
        {
          key: UNCATEGORIZED_COLLECTION_KEY,
          label: getString("overview-uncategorized"),
          children: [],
        },
      ],
    });
  }

  return sections;
}

function buildCollectionNode(
  collection: Zotero.Collection,
): CollectionTreeNode {
  return {
    key: `${COLLECTION_KEY_PREFIX}${collection.id}`,
    label: collection.name,
    children: collection
      .getChildCollections(false, false)
      .map((child) => buildCollectionNode(child)),
  };
}

function getAllCollectionKeys(sections: CollectionTreeSection[]) {
  return sections.flatMap((section) =>
    section.children.flatMap((node) => [node.key, ...getDescendantKeys(node)]),
  );
}

function toggleSetValue(set: Set<string>, value: string) {
  if (set.has(value)) {
    set.delete(value);
  } else {
    set.add(value);
  }
}

function createHTMLElement<K extends keyof HTMLElementTagNameMap>(
  win: Window,
  tagName: K,
) {
  return win.document.createElementNS(
    XHTML_NAMESPACE,
    tagName,
  ) as HTMLElementTagNameMap[K];
}

function getImageWrapHeight(thumbnailSize: number) {
  return Math.round(thumbnailSize * 0.72);
}

interface HoverPreviewSize {
  width: number;
  height: number;
}

interface HoverPreviewPosition {
  left: number;
  top: number;
}

function getHoverPreviewSize(
  win: Window,
  sourceImage: HTMLImageElement,
  sourceRect: DOMRect,
) {
  const aspectRatio = getHoverPreviewAspectRatio(sourceImage, sourceRect);
  if (!aspectRatio) {
    return null;
  }

  const availableWidth = Math.max(1, win.innerWidth - HOVER_PREVIEW_MARGIN * 2);
  const availableHeight = Math.max(
    1,
    win.innerHeight - HOVER_PREVIEW_MARGIN * 2,
  );
  const targetWidth = Math.min(
    availableWidth,
    Math.max(1, win.innerWidth * HOVER_PREVIEW_VIEWPORT_RATIO),
  );
  const targetHeight = Math.min(
    availableHeight,
    Math.max(1, win.innerHeight * HOVER_PREVIEW_VIEWPORT_RATIO),
  );
  const targetAspectRatio = targetWidth / targetHeight;

  if (aspectRatio > targetAspectRatio) {
    return {
      width: Math.round(targetWidth),
      height: Math.max(1, Math.round(targetWidth / aspectRatio)),
    };
  }

  return {
    width: Math.max(1, Math.round(targetHeight * aspectRatio)),
    height: Math.round(targetHeight),
  };
}

function getHoverPreviewAspectRatio(
  sourceImage: HTMLImageElement,
  sourceRect: DOMRect,
) {
  if (sourceImage.naturalWidth > 0 && sourceImage.naturalHeight > 0) {
    return sourceImage.naturalWidth / sourceImage.naturalHeight;
  }
  if (sourceRect.width > 0 && sourceRect.height > 0) {
    return sourceRect.width / sourceRect.height;
  }
  return null;
}

function getHoverPreviewPosition(
  win: Window,
  sourceRect: DOMRect,
  previewSize: HoverPreviewSize,
): HoverPreviewPosition {
  const candidates = getHoverPreviewCandidates(sourceRect, previewSize);
  const maxLeft = win.innerWidth - previewSize.width - HOVER_PREVIEW_MARGIN;
  const maxTop = win.innerHeight - previewSize.height - HOVER_PREVIEW_MARGIN;

  for (const candidate of candidates) {
    if (
      candidate.left >= HOVER_PREVIEW_MARGIN &&
      candidate.top >= HOVER_PREVIEW_MARGIN &&
      candidate.left <= maxLeft &&
      candidate.top <= maxTop
    ) {
      return candidate;
    }
  }

  return {
    left: clamp(
      sourceRect.left + sourceRect.width / 2 - previewSize.width / 2,
      HOVER_PREVIEW_MARGIN,
      maxLeft,
    ),
    top: clamp(
      sourceRect.top + sourceRect.height / 2 - previewSize.height / 2,
      HOVER_PREVIEW_MARGIN,
      maxTop,
    ),
  };
}

function getHoverPreviewCandidates(
  sourceRect: DOMRect,
  previewSize: HoverPreviewSize,
): HoverPreviewPosition[] {
  const centeredTop =
    sourceRect.top + sourceRect.height / 2 - previewSize.height / 2;
  const centeredLeft =
    sourceRect.left + sourceRect.width / 2 - previewSize.width / 2;

  return [
    {
      left: sourceRect.right + HOVER_PREVIEW_MARGIN,
      top: centeredTop,
    },
    {
      left: sourceRect.left - previewSize.width - HOVER_PREVIEW_MARGIN,
      top: centeredTop,
    },
    {
      left: centeredLeft,
      top: sourceRect.bottom + HOVER_PREVIEW_MARGIN,
    },
    {
      left: centeredLeft,
      top: sourceRect.top - previewSize.height - HOVER_PREVIEW_MARGIN,
    },
  ];
}

function clamp(value: number, min: number, max: number) {
  if (max < min) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}
