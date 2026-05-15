import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

test("main window button is inserted next to the Zotero tab strip with fallback", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/modules/main-window.ts"),
    "utf8",
  );

  assert.ok(source.includes('"zotero-tabs-toolbar"'));
  assert.ok(source.includes('"zotero-tb-tabs-menu"'));
  assert.ok(source.includes('"zotero-items-toolbar"'));
});

test("toolbar command opens the overview through the public API", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/modules/main-window.ts"),
    "utf8",
  );

  assert.ok(source.includes("addon.api.openOverview"));
});

test("overview window is single-instance and exposes slider styling", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/modules/overview-window.ts"),
    "utf8",
  );
  const script = readFileSync(
    path.join(process.cwd(), "src/modules/overviewScript.ts"),
    "utf8",
  );

  assert.ok(source.includes("overviewWindow"));
  assert.ok(source.includes("openDialog"));
  assert.ok(script.includes("setThumbnailSizeStyle"));
});

test("overview window initialization is attached from the opener", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/modules/overview-window.ts"),
    "utf8",
  );
  const xhtml = readFileSync(
    path.join(process.cwd(), "addon/content/overview.xhtml"),
    "utf8",
  );

  assert.ok(source.includes('addEventListener("load"'));
  assert.ok(source.includes("initializedWindows"));
  assert.ok(!xhtml.includes("onload="));
});

test("overview collection tree has expand and collapse all controls", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/modules/overviewScript.ts"),
    "utf8",
  );
  const xhtml = readFileSync(
    path.join(process.cwd(), "addon/content/overview.xhtml"),
    "utf8",
  );

  assert.ok(source.includes("expandedCollectionKeys"));
  assert.ok(xhtml.includes("zotero-figure-overview-expand-all"));
  assert.ok(xhtml.includes("zotero-figure-overview-collapse-all"));
});

test("overview omits empty collection section titles", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/modules/overviewScript.ts"),
    "utf8",
  );

  assert.match(source, /if\s*\(\s*section\.label\.trim\(\)\s*\)/);
});

test("overview window scrolls inside the sidebar and grid scroll frame", () => {
  const css = readFileSync(
    path.join(process.cwd(), "addon/content/overview.css"),
    "utf8",
  );
  const xhtml = readFileSync(
    path.join(process.cwd(), "addon/content/overview.xhtml"),
    "utf8",
  );

  assert.match(css, /html,\s*body\s*{/);
  assert.match(css, /\.figure-overview\s*{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.figure-sidebar\s*{[^}]*overflow-y:\s*auto/s);
  assert.ok(xhtml.includes("figure-grid-scroll"));
  assert.match(css, /\.figure-grid-scroll\s*{[^}]*flex:\s*1 1 0/s);
  assert.match(css, /\.figure-grid-scroll\s*{[^}]*height:\s*0/s);
  assert.match(css, /\.figure-grid-scroll\s*{[^}]*min-height:\s*0/s);
  assert.match(css, /\.figure-grid-scroll\s*{[^}]*overflow-y:\s*auto/s);
  assert.doesNotMatch(css, /\.figure-grid\s*{[^}]*overflow-y:\s*auto/s);
  assert.doesNotMatch(css, /\.figure-grid\s*{[^}]*flex:\s*1/s);
});

test("image tiles keep a stable height and the size slider is compact", () => {
  const css = readFileSync(
    path.join(process.cwd(), "addon/content/overview.css"),
    "utf8",
  );

  assert.match(
    css,
    /\.figure-image-wrap\s*{[^}]*height:\s*var\(--figure-image-height\)/s,
  );
  assert.match(css, /minmax\(var\(--figure-card-width\),\s*1fr\)/s);
  assert.doesNotMatch(
    css,
    /minmax\(var\(--figure-card-width\),\s*var\(--figure-card-width\)\)/s,
  );
  assert.match(css, /\.figure-grid\s*{[^}]*justify-content:\s*stretch/s);
  assert.match(css, /\.figure-size-control input\s*{[^}]*width:\s*120px/s);
});

test("overview image grid uses compact outer and tile spacing", () => {
  const css = readFileSync(
    path.join(process.cwd(), "addon/content/overview.css"),
    "utf8",
  );

  assert.match(css, /\.figure-grid\s*{[^}]*gap:\s*10px/s);
  assert.match(css, /\.figure-grid\s*{[^}]*padding:\s*10px 12px 14px/s);
  assert.match(css, /\.figure-meta\s*{[^}]*gap:\s*6px/s);
  assert.match(css, /\.figure-meta\s*{[^}]*padding:\s*7px 8px 8px/s);
});

test("image tiles keep a fixed preview height instead of collapsing to lines", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/modules/overviewScript.ts"),
    "utf8",
  );

  assert.ok(source.includes("getImageWrapHeight"));
  assert.ok(source.includes("thumbnailSize * 0.72"));
  assert.ok(!source.includes("setImageWrapHeightFromNaturalSize"));
});

test("overview lazy-loads figure image files instead of starting every image at once", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/modules/overviewScript.ts"),
    "utf8",
  );

  assert.ok(source.includes("INITIAL_EAGER_IMAGE_COUNT"));
  assert.ok(source.includes("IntersectionObserver"));
  assert.ok(source.includes("loadLazyImage"));
  assert.ok(source.includes('setAttribute("data-figure-src"'));
  assert.ok(source.includes('setAttribute("loading", "lazy")'));
  assert.ok(source.includes('setAttribute("decoding", "async")'));
  assert.doesNotMatch(source, /image\.src\s*=\s*record\.imageURI/);
});

test("overview dynamic nodes are created in the XHTML namespace", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/modules/overviewScript.ts"),
    "utf8",
  );

  assert.ok(
    source.includes("http://www.w3.org/1999/xhtml"),
    "overview.xhtml is a XUL document, so dynamic HTML nodes need XHTML namespace",
  );
  assert.ok(source.includes("createElementNS"));
  assert.doesNotMatch(source, /win\.document\.createElement\(/);
});

test("thumbnail preview height is independent from the scroll container", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/modules/overviewScript.ts"),
    "utf8",
  );
  const css = readFileSync(
    path.join(process.cwd(), "addon/content/overview.css"),
    "utf8",
  );

  assert.ok(source.includes("imageWrap.style.height = previewHeight"));
  assert.match(css, /\.figure-card\s*{[^}]*height:\s*max-content/s);
  assert.match(
    css,
    /\.figure-image-wrap\s*{[^}]*flex:\s*0 0 var\(--figure-image-height\)/s,
  );
  assert.match(css, /\.figure-image-wrap img\s*{[^}]*object-fit:\s*contain/s);
});

test("overview supports delayed viewport-adaptive hover image previews", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/modules/overviewScript.ts"),
    "utf8",
  );
  const css = readFileSync(
    path.join(process.cwd(), "addon/content/overview.css"),
    "utf8",
  );

  assert.ok(source.includes("HOVER_PREVIEW_DELAY_MS = 1000"));
  assert.ok(source.includes("HOVER_PREVIEW_VIEWPORT_RATIO = 0.72"));
  assert.ok(!source.includes("HOVER_PREVIEW_SCALE"));
  assert.ok(source.includes("hoverPreviewTimer"));
  assert.ok(source.includes("showHoverPreview"));
  assert.ok(source.includes("hideHoverPreview"));
  assert.ok(source.includes("sourceImage.naturalWidth"));
  assert.ok(source.includes("sourceImage.naturalHeight"));
  assert.ok(source.includes("getHoverPreviewAspectRatio"));
  assert.ok(source.includes("getHoverPreviewPosition"));
  assert.ok(source.includes("getHoverPreviewCandidates"));
  assert.ok(source.includes('addEventListener("mouseenter"'));
  assert.ok(source.includes('addEventListener("mouseleave"'));
  assert.ok(source.includes('addEventListener("dblclick"'));
  assert.ok(source.includes("void this.openRecord(record)"));
  assert.ok(source.includes("getBoundingClientRect"));
  assert.ok(source.includes("getHoverPreviewHost"));
  assert.ok(source.includes("document.body"));
  assert.ok(source.includes("zotero-figure-overview-root"));
  assert.ok(source.includes("append(preview)"));
  assert.ok(source.includes('createHTMLElement(this.win, "div")'));
  assert.match(source, /teardown\(\)\s*{[^}]*this\.hideHoverPreview\(\)/s);
  assert.match(css, /\.figure-hover-preview\s*{[^}]*position:\s*fixed/s);
  assert.match(css, /\.figure-hover-preview\s*{[^}]*z-index:\s*1000/s);
  assert.match(
    css,
    /\.figure-hover-preview img\s*{[^}]*object-fit:\s*contain/s,
  );
});

test("collection disclosure buttons opt out of native button chrome", () => {
  const css = readFileSync(
    path.join(process.cwd(), "addon/content/overview.css"),
    "utf8",
  );

  assert.match(css, /\.figure-disclosure\s*{[^}]*appearance:\s*none/s);
  assert.match(css, /\.figure-disclosure\s*{[^}]*border-radius:\s*5px/s);
  assert.match(css, /\.figure-disclosure:hover/s);
});

test("toolbar icon uses the orange image-logo artwork", () => {
  const icon = readFileSync(
    path.join(process.cwd(), "addon/content/icons/figure-overview.svg"),
    "utf8",
  );

  assert.ok(icon.includes('viewBox="0 0 1024 1024"'));
  assert.ok(icon.includes('width="48" height="48"'));
  assert.ok(icon.includes('fill="#fc6101"'));
  assert.ok(icon.includes("M853.333333 96c40.533333"));
});

test("toolbar icon display size stays unchanged", () => {
  const css = readFileSync(
    path.join(process.cwd(), "addon/content/zoteroPane.css"),
    "utf8",
  );

  assert.match(css, /\.toolbarbutton-icon\s*{[^}]*width:\s*22px/s);
  assert.match(css, /\.toolbarbutton-icon\s*{[^}]*height:\s*22px/s);
});

test("toolbar button uses native Zotero top bar spacing", () => {
  const css = readFileSync(
    path.join(process.cwd(), "addon/content/zoteroPane.css"),
    "utf8",
  );

  assert.match(
    css,
    /#zotero-figure-overview-toolbar-button\s*{[^}]*box-sizing:\s*border-box/s,
  );
  assert.match(
    css,
    /#zotero-figure-overview-toolbar-button\s*{[^}]*width:\s*28px/s,
  );
  assert.match(
    css,
    /#zotero-figure-overview-toolbar-button\s*{[^}]*min-width:\s*28px/s,
  );
  assert.match(
    css,
    /#zotero-figure-overview-toolbar-button\s*{[^}]*height:\s*28px/s,
  );
  assert.match(
    css,
    /#zotero-figure-overview-toolbar-button\s*{[^}]*margin:\s*0px 4px 0px 4px/s,
  );
  assert.match(
    css,
    /#zotero-figure-overview-toolbar-button\s*{[^}]*padding:\s*0/s,
  );
  assert.match(
    css,
    /#zotero-figure-overview-toolbar-button\s*{[^}]*justify-content:\s*center/s,
  );
  assert.doesNotMatch(
    css,
    /#zotero-figure-overview-toolbar-button\s*{[^}]*width:\s*34px/s,
  );
  assert.doesNotMatch(
    css,
    /#zotero-figure-overview-toolbar-button\s*{[^}]*height:\s*32px/s,
  );
  assert.doesNotMatch(
    css,
    /#zotero-figure-overview-toolbar-button\s*{[^}]*margin-inline:\s*2px/s,
  );
});
