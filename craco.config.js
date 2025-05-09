// craco.config.js
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
  webpack: {
    configure: (config) => {
      // --- add ModuleFederationPlugin ----------------------------
      config.plugins.push(
        new ModuleFederationPlugin({
          name: "imswitch_host",      // arbitrary
          filename: "remoteEntry.js", // host’s own (mostly empty) container
          remotes: {},                // we load remotes at runtime
          exposes: {},                // nothing to expose from the host yet
          shared: {
            react:        { singleton: true, eager: true },
            "react-dom":  { singleton: true, eager: true },
            // add MUI / emotion etc. if you use them in host & remotes
          },
        })
      );
      // ------------------------------------------------------------
      return config;
    },
  },
};

