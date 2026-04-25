import { config } from "../package.json";
import hooks from "./hooks";
import { openOverviewWindow } from "./modules/overview-window";
import { createZToolkit } from "./utils/ztoolkit";

export interface AddonAPI {
  openOverview: () => void;
}

class Addon {
  public data: {
    alive: boolean;
    config: typeof config;
    env: "development" | "production";
    initialized?: boolean;
    ztoolkit: ZToolkit;
    locale?: {
      current: any;
    };
  };

  public hooks: typeof hooks;
  public api: AddonAPI;

  constructor() {
    this.data = {
      alive: true,
      config,
      env: __env__,
      initialized: false,
      ztoolkit: createZToolkit(),
    };
    this.hooks = hooks;
    this.api = {
      openOverview: () => {
        openOverviewWindow();
      },
    };
  }
}

export default Addon;
