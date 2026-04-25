import { config } from "../../package.json";
import type { FluentMessageId } from "../../typings/i10n";

interface FluentPattern {
  value: string | null;
  attributes: Array<{
    name: string;
    value: string;
  }> | null;
}

export function initLocale() {
  const LocalizationCtor =
    typeof Localization === "undefined"
      ? ztoolkit.getGlobal("Localization")
      : Localization;
  addon.data.locale = {
    current: new LocalizationCtor([`${config.addonRef}-addon.ftl`], true),
  };
}

export function getString(localString: FluentMessageId): string;
export function getString(
  localString: FluentMessageId,
  options: { args?: Record<string, unknown> },
): string;
export function getString(
  localString: FluentMessageId,
  options: { args?: Record<string, unknown> } = {},
) {
  const id = `${config.addonRef}-${localString}`;
  const pattern = addon.data.locale?.current.formatMessagesSync([
    { id, args: options.args },
  ])[0] as FluentPattern | undefined;
  return pattern?.value || id;
}
