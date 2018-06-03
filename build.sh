#!/bin/sh

## Version 2.0.0
##
## Usage
## ./build.sh
##
## OS supported:
## win32 win64 linux32 linux64 linuxarm osx
##


ELECTRONVER=1.7.15
NODEJSVER=6

OS="${1}"

# Get Version
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')
echo "Phore Marketplace Version: $PACKAGE_VERSION"

# Create temp/build dirs
mkdir dist/
rm -rf dist/*
mkdir temp/
rm -rf temp/*

echo 'Preparing to build installers...'

echo 'Installing npm packages...'
npm i -g npm@5.2
npm install electron-packager -g --silent
npm install npm-run-all -g --silent
npm install grunt-cli -g --silent
npm install grunt --save-dev --silent
npm install grunt-electron-installer --save-dev --silent
npm install

echo 'Building PhoreMarketplace app...'
npm run build

echo 'Copying transpiled files into js folder...'
cp -rf prod/* js/


case "$TRAVIS_OS_NAME" in
  "linux")

    echo 'Linux builds'

    echo 'Building Linux 32-bit Installer....'

    echo 'Making dist directories'
    mkdir dist/linux32
    mkdir dist/linux64

    echo 'Install npm packages for Linux'
    npm install -g --save-dev electron-installer-debian --silent
    npm install -g --save-dev electron-installer-redhat --silent

    # Install rpmbuild
    sudo apt-get install rpm

    # Ensure fakeroot is installed
    sudo apt-get install fakeroot

    if [ -z "$CLIENT_VERSION" ]; then
      # Retrieve Latest Server Binaries
      sudo apt-get install jq
      cd temp/
      curl -u $GITHUB_USER:$GITHUB_TOKEN -s https://api.github.com/repos/phoreproject/openbazaar-go/releases | jq -r ".[0].assets[].browser_download_url" | xargs -n 1 curl -L -O
      cd ..
    fi

    if [ -z "$CLIENT_VERSION" ]; then
      APPNAME="phoremarketplace"

      echo "Packaging Electron application"
      electron-packager . ${APPNAME} --platform=linux --arch=ia32 --electron-version=${ELECTRONVER} --overwrite --prune --out=dist

      echo 'Move go server to electron app'
      mkdir dist/${APPNAME}-linux-ia32/resources/openbazaar-go/
      cp -rf temp/openbazaar-go-linux-386 dist/${APPNAME}-linux-ia32/resources/openbazaar-go
      mv dist/${APPNAME}-linux-ia32/resources/openbazaar-go/openbazaar-go-linux-386 dist/${APPNAME}-linux-ia32/resources/openbazaar-go/openbazaard
      rm -rf dist/${APPNAME}-linux-ia32/resources/app/.travis
      chmod +x dist/${APPNAME}-linux-ia32/resources/openbazaar-go/openbazaard

      echo 'Create debian archive'
      electron-installer-debian --config .travis/config_ia32.json

      echo 'Create RPM archive'
      electron-installer-redhat --config .travis/config_ia32.json

      echo 'Building Linux 64-bit Installer....'

      echo "Packaging Electron application"
      electron-packager . ${APPNAME} --platform=linux --arch=x64 --electron-version=${ELECTRONVER} --overwrite --prune --out=dist

      echo 'Move go server to electron app'
      mkdir dist/${APPNAME}-linux-x64/resources/openbazaar-go/
      cp -rf temp/openbazaar-go-linux-amd64 dist/${APPNAME}-linux-x64/resources/openbazaar-go
      mv dist/${APPNAME}-linux-x64/resources/openbazaar-go/openbazaar-go-linux-amd64 dist/${APPNAME}-linux-x64/resources/openbazaar-go/openbazaard
      rm -rf dist/${APPNAME}-linux-x64/resources/app/.travis
      chmod +x dist/${APPNAME}-linux-x64/resources/openbazaar-go/openbazaard

      echo 'Create debian archive'
      electron-installer-debian --config .travis/config_amd64.json

      echo 'Create RPM archive'
      electron-installer-redhat --config .travis/config_amd64.json
    else
      APPNAME="phoremarketplaceclient"

      echo "Packaging Electron application"
      electron-packager . ${APPNAME} --platform=linux --arch=ia32 --electron-version=${ELECTRONVER} --overwrite --prune --out=dist

      echo 'Create debian archive'
      electron-installer-debian --config .travis/config_ia32.client.json

      echo 'Create RPM archive'
      electron-installer-redhat --config .travis/config_ia32.client.json

      echo 'Building Linux 64-bit Installer....'

      echo "Packaging Electron application"
      electron-packager . ${APPNAME} --platform=linux --arch=x64 --electron-version=${ELECTRONVER} --overwrite --prune --out=dist

      echo 'Create debian archive'
      electron-installer-debian --config .travis/config_amd64.client.json

      echo 'Create RPM archive'
      electron-installer-redhat --config .travis/config_amd64.client.json
    fi

    ;;

  "osx")

    brew update > /dev/null
    brew install jq
    brew link jq
    curl -L https://dl.bintray.com/develar/bin/7za -o /tmp/7za
    chmod +x /tmp/7za
    curl -L https://dl.bintray.com/develar/bin/wine.7z -o /tmp/wine.7z
    /tmp/7za x -o/usr/local/Cellar -y /tmp/wine.7z

    brew link --overwrite fontconfig gd gnutls jasper libgphoto2 libicns libtasn1 libusb libusb-compat little-cms2 nettle openssl sane-backends webp wine git-lfs gnu-tar dpkg xz
    brew install freetype graphicsmagick
    brew link xz
    brew install mono
    brew link mono

    # Retrieve Latest Server Binaries
    cd temp/
    curl -u $GITHUB_USER:$GITHUB_TOKEN -s https://api.github.com/repos/phoreproject/openbazaar-go/releases | jq -r ".[0].assets[].browser_download_url" | xargs -n 1 curl -L -O
    cd ..

    # WINDOWS 32
    echo 'Building Windows 32-bit Installer...'
    mkdir dist/win32

    if [ -z "$CLIENT_VERSION" ]; then
      echo 'Running Electron Packager...'

      electron-packager . phoremarketplace --asar --out=dist --protocol-name=PhoreMarketplace --win32metadata.ProductName="Phore Marketplace" --win32metadata.CompanyName="Phore" --win32metadata.FileDescription='Decentralized p2p marketplace for Phore' --win32metadata.OriginalFilename=PhoreMarketplace.exe --protocol=pm --platform=win32 --arch=ia32 --icon=imgs/openbazaar2.ico --electron-version=${ELECTRONVER} --overwrite
      echo 'Copying server binary into application folder...'
      cp -rf temp/openbazaar-go-windows-4.0-386.exe dist/phoremarketplace-win32-ia32/resources/
      cp -rf temp/libwinpthread-1.win32.dll dist/phoremarketplace-win32-ia32/resources/libwinpthread-1.dll
      mkdir dist/phoremarketplace-win32-ia32/resources/openbazaar-go
      mv dist/phoremarketplace-win32-ia32/resources/openbazaar-go-windows-4.0-386.exe dist/phoremarketplace-win32-ia32/resources/openbazaar-go/openbazaard.exe
      mv dist/phoremarketplace-win32-ia32/resources/libwinpthread-1.dll dist/phoremarketplace-win32-ia32/resources/openbazaar-go/libwinpthread-1.dll

      echo 'Building Installer...'
      grunt create-windows-installer --appname=PhoreMarketplace --obversion=$PACKAGE_VERSION --appdir=dist/PhoreMarketplace-win32-ia32 --outdir=dist/win32
      mv dist/win32/PhoreMarketplaceSetup.exe dist/win32/PhoreMarketplace-$PACKAGE_VERSION-Setup-32.exe
    else
      #### CLIENT ONLY
      echo 'Running Electron Packager...'
      electron-packager . PhoreMarketplaceClient --asar --out=dist --protocol-name=PhoreMarketplace --win32metadata.ProductName="Phore Marketplace Client" --win32metadata.CompanyName="Phore" --win32metadata.FileDescription='Decentralized p2p marketplace for Phore' --win32metadata.OriginalFilename=PhoreMarketplaceClient.exe --protocol=pm --platform=win32 --arch=ia32 --icon=imgs/openbazaar2.ico --electron-version=${ELECTRONVER} --overwrite

      echo 'Building Installer...'
      grunt create-windows-installer --appname=PhoreMarketplaceClient --obversion=$PACKAGE_VERSION --appdir=dist/PhoreMarketplaceClient-win32-ia32 --outdir=dist/win32
      mv dist/win32/PhoreMarketplaceClientSetup.exe dist/win32/PhoreMarketplaceClient-$PACKAGE_VERSION-Setup-32.exe
    fi

    # WINDOWS 64
    echo 'Building Windows 64-bit Installer...'
    mkdir dist/win64

    if [ -z "$CLIENT_VERSION" ]; then
      echo 'Running Electron Packager...'
      electron-packager . phoremarketplace --asar --out=dist --protocol-name=PhoreMarketplace --win32metadata.ProductName="Phore Marketplace" --win32metadata.CompanyName="Phore" --win32metadata.FileDescription='Decentralized p2p marketplace for Phore' --win32metadata.OriginalFilename=OpenBazaar2.exe --protocol=pm --platform=win32 --arch=x64 --icon=imgs/openbazaar2.ico --electron-version=${ELECTRONVER} --overwrite

      echo 'Copying server binary into application folder...'
      cp -rf temp/openbazaar-go-windows-4.0-amd64.exe dist/PhoreMarketplace-win32-x64/resources/
      cp -rf temp/libwinpthread-1.win64.dll dist/PhoreMarketplace-win32-x64/resources/libwinpthread-1.dll
      mkdir dist/PhoreMarketplace-win32-x64/resources/openbazaar-go
      mv dist/PhoreMarketplace-win32-x64/resources/openbazaar-go-windows-4.0-amd64.exe dist/PhoreMarketplace-win32-x64/resources/openbazaar-go/openbazaard.exe
      mv dist/PhoreMarketplace-win32-x64/resources/libwinpthread-1.dll dist/PhoreMarketplace-win32-x64/resources/openbazaar-go/libwinpthread-1.dll

      echo 'Building Installer...'
      grunt create-windows-installer --appname=PhoreMarketplace --obversion=$PACKAGE_VERSION --appdir=dist/PhoreMarketplace-win32-x64 --outdir=dist/win64
      mv dist/win64/PhoreMarketplaceSetup.exe dist/win64/PhoreMarketplace-$PACKAGE_VERSION-Setup-64.exe
    else
      #### CLIENT ONLY
      echo 'Running Electron Packager...'
      electron-packager . PhoreMarketplaceClient --asar --out=dist --protocol-name=PhoreMarketplace --win32metadata.ProductName="Phore Marketplace Client" --win32metadata.CompanyName="Phore" --win32metadata.FileDescription='Decentralized p2p marketplace for Phore' --win32metadata.OriginalFilename=PhoreMarketplaceClient.exe --protocol=pm --platform=win32 --arch=x64 --icon=imgs/openbazaar2.ico --electron-version=${ELECTRONVER} --overwrite

      echo 'Building Installer...'
      grunt create-windows-installer --appname=PhoreMarketplaceClient --obversion=$PACKAGE_VERSION --appdir=dist/PhoreMarketplaceClient-win32-x64 --outdir=dist/win64
      mv dist/win64/OpenBazaar2ClientSetup.exe dist/win64/PhoreMarketplaceClient-$PACKAGE_VERSION-Setup-64.exe
    fi

    # OSX
    echo 'Building OSX Installer'
    mkdir dist/osx

    # Install the DMG packager
    echo 'Installing electron-installer-dmg'
    npm install -g electron-installer-dmg

    # Sign openbazaar-go binary
    echo 'Signing Go binary'
    mv temp/openbazaar-go-darwin-10.6-amd64 dist/osx/openbazaard
    codesign --force --sign "$SIGNING_IDENTITY" dist/osx/openbazaard

    echo 'Running Electron Packager...'
    if [ -z "$CLIENT_VERSION" ]; then
      electron-packager . PhoreMarketplace --out=dist -app-category-type=public.app-category.business --protocol-name=PhoreMarketplace --protocol=pm --platform=darwin --arch=x64 --icon=imgs/openbazaar2.icns --electron-version=${ELECTRONVER} --overwrite --app-version=$PACKAGE_VERSION

      echo 'Creating openbazaar-go folder in the OS X .app'
      mkdir dist/PhoreMarketplace-darwin-x64/PhoreMarketplace.app/Contents/Resources/openbazaar-go

      echo 'Moving binary to correct folder'
      mv dist/osx/openbazaard dist/PhoreMarketplace-darwin-x64/PhoreMarketplace.app/Contents/Resources/openbazaar-go/openbazaard
      chmod +x dist/PhoreMarketplace-darwin-x64/PhoreMarketplace.app/Contents/Resources/openbazaar-go/openbazaard
    else
      electron-packager . PhoreMarketplaceClient --out=dist -app-category-type=public.app-category.business --protocol-name=Phore --protocol=pm --platform=darwin --arch=x64 --icon=imgs/openbazaar2.icns --electron-version=${ELECTRONVER} --overwrite --app-version=$PACKAGE_VERSION
    fi

    echo 'Codesign the .app'
    if [ -z "$CLIENT_VERSION" ]; then
      codesign --force --deep --sign "$SIGNING_IDENTITY" dist/PhoreMarketplace-darwin-x64/PhoreMarketplace.app
      electron-installer-dmg dist/PhoreMarketplace-darwin-x64/PhoreMarketplace.app Marketplace-$PACKAGE_VERSION --icon ./imgs/openbazaar2.icns --out=dist/PhoreMarketplace-darwin-x64 --overwrite --background=./imgs/osx-finder_background.png --debug
    else
      codesign --force --deep --sign "$SIGNING_IDENTITY" dist/PhoreMarketplaceClient-darwin-x64/PhoreMarketplaceClient.app
      electron-installer-dmg dist/PhoreMarketplaceClient-darwin-x64/PhoreMarketplaceClient.app MarketplaceClient-$PACKAGE_VERSION --icon ./imgs/openbazaar2.icns --out=dist/PhoreMarketplaceClient-darwin-x64 --overwrite --background=./imgs/osx-finder_background.png --debug
    fi

    echo 'Codesign the DMG and zip'
    if [ -z "$CLIENT_VERSION" ]; then
      codesign --force --sign "$SIGNING_IDENTITY" dist/PhoreMarketplace-darwin-x64/Marketplace-$PACKAGE_VERSION.dmg
      cd dist/PhoreMarketplace-darwin-x64/
      zip -q -r Marketplace-mac-$PACKAGE_VERSION.zip PhoreMarketplace.app
      cp -r PhoreMarketplace.app ../osx/
      cp Marketplace-mac-$PACKAGE_VERSION.zip ../osx/
      cp Marketplace-$PACKAGE_VERSION.dmg ../osx/
    else
      codesign --force --sign "$SIGNING_IDENTITY" dist/PhoreMarketplaceClient-darwin-x64/MarketplaceClient-$PACKAGE_VERSION.dmg
      cd dist/PhoreMarketplaceClient-darwin-x64/
      zip -q -r MarketplaceClient-mac-$PACKAGE_VERSION.zip PhoreMarketplaceClient.app
      cp -r PhoreMarketplaceClient.app ../osx/
      cp MarketplaceClient-mac-$PACKAGE_VERSION.zip ../osx/
      cp MarketplaceClient-$PACKAGE_VERSION.dmg ../osx/
    fi

    ;;
esac
