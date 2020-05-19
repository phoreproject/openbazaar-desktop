const path = require('path');

module.exports = function setup(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    'electron-installer-debian': {
      options: {
        productName: 'PhoreMarketplace',
        name: 'marketplace',
        arch: 'amd64',
        version: '1.3.4',
        bin: 'marketplace',
        maintainer: 'Phore <admin@phore.io>',
        rename(dest) {
          return `${dest}<%= name %>_<%= version %>_<%= arch %>.deb`;
        },
        productDescription: 'Decentralized Peer to Peer Marketplace for Phore',
        lintianOverrides: [
          'changelog-file-missing-in-native-package',
          'executable-not-elf-or-script',
          'extra-license-file',
        ],
        icon: 'imgs/icon.png',
        categories: ['Utility'],
        priority: 'optional',
      },
      'app-with-asar': {
        src: 'temp-linux64/PhoreMarketplace-linux-x64/',
        dest: 'build-linux64/',
        rename(dest) {
          return path.join(dest, '<%= name %>_<%= arch %>.deb');
        },
      },
    },
    'create-windows-installer': {
      x32: {
        appDirectory: grunt.option('appdir'),
        outputDirectory: grunt.option('outdir'),
        name: grunt.option('appname'),
        productName: grunt.option('appname'),
        authors: 'PhoreBlockchain',
        owners: 'PhoreBlockchain',
        exe: `${grunt.option('appname')}.exe`,
        description: `${grunt.option('appname')}`,
        version: grunt.option('obversion') || '',
        title: 'PhoreMarketplace',
        setupIcon: 'imgs/windows-icon.ico',
        skipUpdateIcon: true,
        loadingGif: 'imgs/windows-loading.gif',
        noMsi: true,
      },
    },
  });
  grunt.loadNpmTasks('grunt-electron-installer-debian');
  grunt.loadNpmTasks('grunt-electron-installer');
  // Default task(s).
  grunt.registerTask('default', ['electron-installer-debian']);
};
