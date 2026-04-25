import {
  installMainWindowUI,
  uninstallMainWindowUI,
} from "./modules/main-window";
import {
  closeOverviewWindow,
  onOverviewWindowLoad,
  onOverviewWindowUnload,
} from "./modules/overview-window";
import { initLocale } from "./utils/locale";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  initLocale();
  await Promise.all(
    Zotero.getMainWindows().map((win) => onMainWindowLoad(win)),
  );
  addon.data.initialized = true;
}

async function onMainWindowLoad(win: _ZoteroTypes.MainWindow) {
  installMainWindowUI(win);
}

async function onMainWindowUnload(win: Window) {
  uninstallMainWindowUI(win);
}

async function onShutdown() {
  closeOverviewWindow();
  await Promise.all(
    Zotero.getMainWindows().map((win) => uninstallMainWindowUI(win)),
  );
  addon.data.alive = false;
  // @ts-expect-error - Plugin instance is not typed
  delete Zotero[addon.data.config.addonInstance];
}

async function onNotify(
  event: string,
  type: string,
  ids: Array<string | number>,
  extraData: { [key: string]: any },
) {
  void event;
  void type;
  void ids;
  void extraData;
}

async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  void type;
  void data;
}

function onShortcuts(type: string) {
  void type;
}

function onDialogEvents(type: string) {
  void type;
}

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onOverviewWindowLoad,
  onOverviewWindowUnload,
  onNotify,
  onPrefsEvent,
  onShortcuts,
  onDialogEvents,
};
