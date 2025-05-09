const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  webpack: {
    configure: (config) => {
      config.output.publicPath = '/imswitch';

      config.plugins.push(
        new ModuleFederationPlugin({
          name: 'host_app',
          shared: {
            react:            { singleton: true, eager: true, requiredVersion: false },
            'react-dom':      { singleton: true, eager: true, requiredVersion: false },
            'react/jsx-runtime': { singleton: true, eager: true, requiredVersion: false },
          },
        })
      );

      return config;
    },
  },
};
