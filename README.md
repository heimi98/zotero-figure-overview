# Zotero Figure Overview

[![Zotero](https://img.shields.io/badge/Zotero-9.x%20%7C%2010.0.x-blue)](https://www.zotero.org/)
[![Release](https://img.shields.io/github/v/release/heimi98/zotero-figure-overview?display_name=tag)](https://github.com/heimi98/zotero-figure-overview/releases)
[![License](https://img.shields.io/badge/license-AGPL--3.0--or--later-green)](https://www.gnu.org/licenses/agpl-3.0.en.html)

Zotero Figure Overview is a Zotero 9/10 plugin that adds a top tab-bar button for
opening an Eagle-style overview of Zotero Reader image annotations.

The overview scans Zotero image annotations at open time, supports annotation
color filtering, Zotero collection filtering, thumbnail size adjustment, and
opens the source annotation in Zotero Reader on double-click.

## Features

- Open an Eagle-style overview window from the Zotero top tab bar.
- Collect Zotero Reader image annotations from the selected library.
- Filter thumbnails by annotation color and Zotero collection.
- Expand or collapse the collection tree to narrow the overview quickly.
- Adjust thumbnail size with an adaptive grid that fills the available width.
- Keep the overview scrollable without collapsing thumbnails into thin lines.
- Double-click a thumbnail to jump back to the source annotation in Zotero
  Reader.
- Supports English and Simplified Chinese UI strings.

## Requirements

- Zotero 9.x or 10.0.x (including 10.0.7)
- Node.js 20 or newer for development builds

## Installation

Download the latest XPI from the
[GitHub Releases](https://github.com/heimi98/zotero-figure-overview/releases)
page and install it in Zotero through:

```text
Tools -> Plugins -> Install Plugin From File...
```

Each versioned release includes a `zotero-figure-overview.xpi` asset.

The plugin update manifest is published as `update.json` under the `release`
tag:

```text
https://github.com/heimi98/zotero-figure-overview/releases/download/release/update.json
```

## Usage

1. Create image annotations in Zotero Reader.
2. Click the image icon in Zotero's top tab bar.
3. Use the color chips and collection tree to filter visible figures.
4. Use the size slider to change the thumbnail target size. The grid adapts the
   actual card widths so each row fills the overview width.
5. Double-click a figure card to open the corresponding annotation in Zotero
   Reader.

## Development

```bash
npm install
npm run test:unit
npx tsc --noEmit
npm run build
```

The built XPI is written to `.scaffold/build/zotero-figure-overview.xpi`.

## Release Checklist

1. Confirm `package.json` and `package-lock.json` use the intended version.
2. Run `npm run build`.
3. Inspect the packaged manifest:

   ```bash
   unzip -p .scaffold/build/zotero-figure-overview.xpi manifest.json
   ```

4. Commit the changes and publish a GitHub release with the matching version
   tag, for example `v0.3.1`.
5. Wait for the `Publish release` workflow to pass. It builds and verifies the
   XPI, uploads `zotero-figure-overview.xpi` to the versioned release, and
   refreshes `update.json` under the long-lived `release` tag for stable versions.
   To retry a release, run the workflow manually with its existing version tag.

## Repository Metadata

- Add-on ID: `zotero-figure-overview@xuan.dev`
- Namespace: `zotero-figure-overview`
- Supported Zotero versions: `9.0` through `10.0.*`
- License: AGPL-3.0-or-later
