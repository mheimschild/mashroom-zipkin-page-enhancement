import type {MashroomPortalPageEnhancementPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalPageEnhancementPluginBootstrapFunction = (pluginName, pluginConfig) => {
  const { includeOnPages, tracingEnabled, tracerUrl, servicePatterns } = pluginConfig;
  return {
    dynamicResources: {
      init: () => tracingEnabled ? `window.__initZipkinWrapper__ && window.__initZipkinWrapper__("${tracerUrl}", ${JSON.stringify(servicePatterns)});` : '',
    },
    rules: {
      includeExtraScript: (sitePath, pageFriendlyUrl, lang, userAgent) => {
        return includeOnPages.indexOf(`${sitePath}${pageFriendlyUrl}`) > -1;
      },
    }
  }
};

export default bootstrap;
