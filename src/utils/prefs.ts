import { config } from "../../package.json";

type PluginPrefsMap = _ZoteroTypes.Prefs["PluginPrefsMap"];

export function getPref<K extends keyof PluginPrefsMap>(key: K) {
  return Zotero.Prefs.get(
    `${config.prefsPrefix}.${String(key)}`,
    true,
  ) as PluginPrefsMap[K];
}

export function setPref<K extends keyof PluginPrefsMap>(
  key: K,
  value: PluginPrefsMap[K],
) {
  return Zotero.Prefs.set(`${config.prefsPrefix}.${String(key)}`, value, true);
}
