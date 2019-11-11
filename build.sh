#!/bin/sh

## Version 2.0.0
##
## Usage
## ./build.sh
##
## OS supported:
## win32 win64 linux32 linux64 linuxarm osx
##


ELECTRONVER=1.8.7
NODEJSVER=5.1.1

OS="${1}"
if [ -z "${2}" ]; then
  SERVERTAG='latest'

  FORCE_SERVER=$(node -p 'require("./package").forceServerVersion')
  if [ ${FORCE_SERVER} = true ]; then
    SERVERTAG=tags/v$(node -p 'require("./package").serverVersionRequired')
  fi
else
  SERVERTAG=tags/${2}
fi
echo "Building with openbazaar-go/$SERVERTAG"

# Get Version
PACKAGE_VERSION=$(node -p 'require("./package").version')
echo "Phore Marketplace Version: $PACKAGE_VERSION"

# Create temp build dirs
mkdir dist/
rm -rf dist/*
mkdir PHORE_MARKETPLACE_TEMP/
rm -rf PHORE_MARKETPLACE_TEMP/*

echo 'Preparing to build installers...'

echo 'Installing npm packages...'
npm i -g npm@5.2
npm install electron-packager -g --silent
npm install npm-run-all -g --silent
npm install grunt-cli -g --silent
npm install grunt --save-dev --silent
npm install grunt-electron-installer --save-dev --silent
npm install --silent

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

    # Install libgconf2-4
    sudo apt-get install libgconf2-4 libgconf-2-4

    # Install rpmbuild
    sudo apt-get install rpm

    # Ensure fakeroot is installed
    sudo apt-get install fakeroot

    # Retrieve Latest Server Binaries
    sudo apt-get install jq
    cd PHORE_MARKETPLACE_TEMP/
    curl -u $GITHUB_USER:$GITHUB_TOKEN -s https://api.github.com/repos/phoreproject/openbazaar-go/releases/$SERVERTAG > release.txt
    cat release.txt | jq -r ".assets[].browser_download_url" | xargs -n 1 curl -L -O
    cd ..

    APPNAME="phoremarketplace"

    echo "Packaging Electron application"
    electron-packager . ${APPNAME} --platform=linux --arch=ia32 --electronVersion=${ELECTRONVER} --ignore="PHORE_MARKETPLACE_TEMP" --overwrite --prune --out=dist

    echo 'Move go server to electron app'
    mkdir dist/${APPNAME}-linux-ia32/resources/openbazaar-go/
    cp -rf PHORE_MARKETPLACE_TEMP/openbazaar-go-linux-386 dist/${APPNAME}-linux-ia32/resources/openbazaar-go
    mv dist/${APPNAME}-linux-ia32/resources/openbazaar-go/openbazaar-go-linux-386 dist/${APPNAME}-linux-ia32/resources/openbazaar-go/openbazaard
    rm -rf dist/${APPNAME}-linux-ia32/resources/app/.travis
    chmod +x dist/${APPNAME}-linux-ia32/resources/openbazaar-go/openbazaard

    echo 'Create debian archive'
    electron-installer-debian --config .travis/config_ia32.json

    echo 'Create RPM archive'
    electron-installer-redhat --config .travis/config_ia32.json

    echo 'Building Linux 64-bit Installer....'

    echo "Packaging Electron application"
    electron-packager . ${APPNAME} --platform=linux --arch=x64 --electronVersion=${ELECTRONVER} --overwrite --ignore="PHORE_MARKETPLACE_TEMP" --prune --out=dist

    echo 'Move go server to electron app'
    mkdir dist/${APPNAME}-linux-x64/resources/openbazaar-go/
    cp -rf PHORE_MARKETPLACE_TEMP/openbazaar-go-linux-amd64 dist/${APPNAME}-linux-x64/resources/openbazaar-go
    rm -rf PHORE_MARKETPLACE_TEMP/*
    mv dist/${APPNAME}-linux-x64/resources/openbazaar-go/openbazaar-go-linux-amd64 dist/${APPNAME}-linux-x64/resources/openbazaar-go/openbazaard
    rm -rf dist/${APPNAME}-linux-x64/resources/app/.travis
    chmod +x dist/${APPNAME}-linux-x64/resources/openbazaar-go/openbazaard

    echo 'Create debian archive'
    electron-installer-debian --config .travis/config_amd64.json

    echo 'Create RPM archive'
    electron-installer-redhat --config .travis/config_x86_64.json

    APPNAME="phoremarketplaceclient"

    echo "Packaging Electron application"
    electron-packager . ${APPNAME} --platform=linux --arch=ia32 --ignore="PHORE_MARKETPLACE_TEMP" --electronVersion=${ELECTRONVER} --overwrite --prune --out=dist

    echo 'Create debian archive'
    electron-installer-debian --config .travis/config_ia32.client.json

    echo 'Create RPM archive'
    electron-installer-redhat --config .travis/config_ia32.client.json

    echo 'Building Linux 64-bit Installer....'

    echo "Packaging Electron application"
    electron-packager . ${APPNAME} --platform=linux --arch=x64 --ignore="PHORE_MARKETPLACE_TEMP" --electronVersion=${ELECTRONVER} --overwrite --prune --out=dist

    echo 'Create debian archive'
    electron-installer-debian --config .travis/config_amd64.client.json

    echo 'Create RPM archive'
    electron-installer-redhat --config .travis/config_x86_64.client.json

    ;;

  "osx")

    brew update

    brew uninstall --force wine

    brew remove jq
    brew link oniguruma
    brew install jq
    curl -L https://dl.bintray.com/develar/bin/7za -o /tmp/7za
    chmod +x /tmp/7za
    rm /tmp/wine.7z
    curl -L https://dl.bintray.com/develar/bin/wine.7z -o /tmp/wine.7z
    /tmp/7za x -o/usr/local/Cellar -y /tmp/wine.7z

    brew link --overwrite fontconfig gd gnutls jasper libgphoto2 libicns libtasn1 libusb libusb-compat little-cms2 nettle sane-backends webp wine git-lfs gnu-tar dpkg xz
    brew install freetype graphicsmagick
    brew link xz
    brew uninstall --ignore-dependencies openssl
    brew install openssl
    brew link openssl
    brew remove osslsigncode
    brew install mono osslsigncode
    brew link freetype graphicsmagick mono 

    # Retrieve Latest Server Binaries
    cd PHORE_MARKETPLACE_TEMP/
    curl -u $GITHUB_USER:$GITHUB_TOKEN -s https://api.github.com/repos/phoreproject/openbazaar-go/releases/$SERVERTAG > release.txt
    cat release.txt | jq -r ".assets[].browser_download_url" | xargs -n 1 curl -L -O
    cd ..

    # WINDOWS 32
    echo 'Building Windows 32-bit Installer...'
    mkdir dist/win32

    echo 'Running Electron Packager...'
    electron-packager . PhoreMarketplace --asar --out=dist --ignore="PHORE_MARKETPLACE_TEMP" --protocol-name=PhoreMarketplace --win32metadata.ProductName="PhoreMarketplace" --win32metadata.CompanyName="Phore" --win32metadata.FileDescription='Decentralized p2p marketplace' --win32metadata.OriginalFilename=PhoreMarketplace.exe --protocol=pm --platform=win32 --arch=ia32 --icon=imgs/openbazaar2.ico --electron-version=${ELECTRONVER} --overwrite

    echo 'Copying server binary into application folder...'
    cp -rf PHORE_MARKETPLACE_TEMP/openbazaar-go-windows-4.0-386.exe dist/phoremarketplace-win32-ia32/resources/
    cp -rf PHORE_MARKETPLACE_TEMP/libwinpthread-1.win32.dll dist/phoremarketplace-win32-ia32/resources/libwinpthread-1.dll
    mkdir dist/phoremarketplace-win32-ia32/resources/openbazaar-go
    mv dist/phoremarketplace-win32-ia32/resources/openbazaar-go-windows-4.0-386.exe dist/phoremarketplace-win32-ia32/resources/openbazaar-go/openbazaard.exe
    mv dist/phoremarketplace-win32-ia32/resources/libwinpthread-1.dll dist/phoremarketplace-win32-ia32/resources/openbazaar-go/libwinpthread-1.dll

    echo 'Building Installer...'
    grunt create-windows-installer --appname=PhoreMarketplace --obversion=$PACKAGE_VERSION --appdir=dist/PhoreMarketplace-win32-ia32 --outdir=dist/win32
    mv dist/win32/PhoreMarketplaceSetup.exe dist/win32/PhoreMarketplace-$PACKAGE_VERSION-Setup-32.exe
    mv dist/win32/RELEASES dist/RELEASES

    #### CLIENT ONLY
    echo 'Running Electron Packager...'
    electron-packager . PhoreMarketplaceClient --asar --out=dist --protocol-name=PhoreMarketplace --ignore="PHORE_MARKETPLACE_TEMP" --win32metadata.ProductName="PhoreMarketplaceClient" --win32metadata.CompanyName="Phore" --win32metadata.FileDescription='Decentralized p2p marketplace' --win32metadata.OriginalFilename=PhoreMarketplaceClient.exe --protocol=pm --platform=win32 --arch=ia32 --icon=imgs/openbazaar2.ico --electron-version=${ELECTRONVER} --overwrite

    echo 'Building Installer...'
    grunt create-windows-installer --appname=PhoreMarketplaceClient --obversion=$PACKAGE_VERSION --appdir=dist/PhoreMarketplaceClient-win32-ia32 --outdir=dist/win32
    mv dist/win32/PhoreMarketplaceClientSetup.exe dist/win32/PhoreMarketplaceClient-$PACKAGE_VERSION-Setup-32.exe

    echo 'Do not sign the installer'
#    osslsigncode sign -t http://timestamp.digicert.com -h sha1 -key .travis/phore.keyfile -pass "$PHORE_SECRET" -certs .travis/phore.cert.spc -in dist/win32/PhoreMarketplace-$PACKAGE_VERSION-Setup-32.exe -out dist/win32/PhoreMarketplace-$PACKAGE_VERSION-Setup-32.exe
#    osslsigncode sign -t http://timestamp.digicert.com -h sha1 -key .travis/phore.keyfile -pass "$PHORE_SECRET" -certs .travis/phore.cert.spc -in dist/win32/PhoreMarketplaceClient-$PACKAGE_VERSION-Setup-32.exe -out dist/win32/PhoreMarketplaceClient-$PACKAGE_VERSION-Setup-32.exe

    rm dist/win32/RELEASES

    # WINDOWS 64
    echo 'Building Windows 64-bit Installer...'
    mkdir dist/win64

    echo 'Running Electron Packager...'
    electron-packager . PhoreMarketplace --asar --out=dist --protocol-name=PhoreMarketplace --ignore="PHORE_MARKETPLACE_TEMP" --win32metadata.ProductName="PhoreMarketplace" --win32metadata.CompanyName="Phore" --win32metadata.FileDescription='Decentralized p2p marketplace' --win32metadata.OriginalFilename=PhoreMarketplace.exe --protocol=pm --platform=win32 --arch=x64 --icon=imgs/openbazaar2.ico --electron-version=${ELECTRONVER} --overwrite

    echo 'Copying server binary into application folder...'
    cp -rf PHORE_MARKETPLACE_TEMP/openbazaar-go-windows-4.0-amd64.exe dist/PhoreMarketplace-win32-x64/resources/
    cp -rf PHORE_MARKETPLACE_TEMP/libwinpthread-1.win64.dll dist/PhoreMarketplace-win32-x64/resources/libwinpthread-1.dll
    mkdir dist/PhoreMarketplace-win32-x64/resources/openbazaar-go
    mv dist/PhoreMarketplace-win32-x64/resources/openbazaar-go-windows-4.0-amd64.exe dist/PhoreMarketplace-win32-x64/resources/openbazaar-go/openbazaard.exe
    mv dist/PhoreMarketplace-win32-x64/resources/libwinpthread-1.dll dist/PhoreMarketplace-win32-x64/resources/openbazaar-go/libwinpthread-1.dll

    echo 'Building Installer...'
    grunt create-windows-installer --appname=PhoreMarketplace --obversion=$PACKAGE_VERSION --appdir=dist/PhoreMarketplace-win32-x64 --outdir=dist/win64
    mv dist/win64/PhoreMarketplaceSetup.exe dist/win64/PhoreMarketplace-$PACKAGE_VERSION-Setup-64.exe
    mv dist/win64/RELEASES dist/win64/RELEASES-x64

    #### CLIENT ONLY
    echo 'Running Electron Packager...'
    electron-packager . PhoreMarketplaceClient --asar --out=dist --protocol-name=PhoreMarketplace --ignore="PHORE_MARKETPLACE_TEMP" --win32metadata.ProductName="PhoreMarketplaceClient" --win32metadata.CompanyName="Phore" --win32metadata.FileDescription='Decentralized p2p marketplace' --win32metadata.OriginalFilename=PhoreMarketplaceClient.exe --protocol=pm --platform=win32 --arch=x64 --icon=imgs/openbazaar2.ico --electron-version=${ELECTRONVER} --overwrite

    echo 'Building Installer...'
    grunt create-windows-installer --appname=PhoreMarketplaceClient --obversion=$PACKAGE_VERSION --appdir=dist/PhoreMarketplaceClient-win32-x64 --outdir=dist/win64
    mv dist/win64/PhoreMarketplaceClientSetup.exe dist/win64/PhoreMarketplaceClient-$PACKAGE_VERSION-Setup-64.exe

    echo 'Do not sign the installer'
#    osslsigncode sign -t http://timestamp.digicert.com -h sha1 -key .travis/phore.keyfile -pass "$PHORE_SECRET" -certs .travis/phore.cert.spc -in dist/win64/PhoreMarketplace-$PACKAGE_VERSION-Setup-64.exe -out dist/win64/PhoreMarketplace-$PACKAGE_VERSION-Setup-64.exe
#    osslsigncode sign -t http://timestamp.digicert.com -h sha1 -key .travis/phore.keyfile -pass "$PHORE_SECRET" -certs .travis/phore.cert.spc -in dist/win64/PhoreMarketplaceClient-$PACKAGE_VERSION-Setup-64.exe -out dist/win64/PhoreMarketplaceClient-$PACKAGE_VERSION-Setup-64.exe

    mv dist/RELEASES dist/win32/RELEASES

    # OSX
    echo 'Building OSX Installer'
    mkdir dist/osx

    # Install the DMG packager
    echo 'Installing electron-installer-dmg'
    npm install -g electron-installer-dmg

    # Sign openbazaar-go binary
    echo 'Signing Go binary'
    mv PHORE_MARKETPLACE_TEMP/openbazaar-go-darwin-10.6-amd64 dist/osx/openbazaard
    rm -rf PHORE_MARKETPLACE_TEMP/*
    codesign --force --sign "$SIGNING_IDENTITY" dist/osx/openbazaard

    echo 'Running Electron Packager...'
    electron-packager . PhoreMarketplace --out=dist -app-category-type=public.app-category.business --protocol-name=PhoreMarketplace --ignore="PHORE_MARKETPLACE_TEMP" --protocol=pm --platform=darwin --arch=x64 --icon=imgs/openbazaar2.icns --electron-version=${ELECTRONVER} --overwrite --app-version=$PACKAGE_VERSION
    # Client Only
    electron-packager . PhoreMarketplaceClient --out=dist -app-category-type=public.app-category.business --protocol-name=PhoreMarketplace --ignore="PHORE_MARKETPLACE_TEMP" --protocol=pm --platform=darwin --arch=x64 --icon=imgs/openbazaar2.icns --electron-version=${ELECTRONVER} --overwrite --app-version=$PACKAGE_VERSION

    echo 'Creating openbazaar-go folder in the OS X .app'
    mkdir dist/PhoreMarketplace-darwin-x64/PhoreMarketplace.app/Contents/Resources/openbazaar-go

    echo 'Moving binary to correct folder'
    mv dist/osx/openbazaard dist/PhoreMarketplace-darwin-x64/PhoreMarketplace.app/Contents/Resources/openbazaar-go/openbazaard
    chmod +x dist/PhoreMarketplace-darwin-x64/PhoreMarketplace.app/Contents/Resources/openbazaar-go/openbazaard

    echo 'Codesign the .app'
    codesign --force --deep --sign "$SIGNING_IDENTITY" dist/PhoreMarketplace-darwin-x64/PhoreMarketplace.app
    electron-installer-dmg dist/PhoreMarketplace-darwin-x64/PhoreMarketplace.app PhoreMarketplace-$PACKAGE_VERSION --icon ./imgs/openbazaar2.icns --out=dist/PhoreMarketplace-darwin-x64 --overwrite --background=./imgs/osx-finder_background.png --debug
    # Client Only
    codesign --force --deep --sign "$SIGNING_IDENTITY" dist/PhoreMarketplaceClient-darwin-x64/PhoreMarketplaceClient.app
    electron-installer-dmg dist/PhoreMarketplaceClient-darwin-x64/PhoreMarketplaceClient.app PhoreMarketplaceC-$PACKAGE_VERSION --icon ./imgs/openbazaar2.icns --out=dist/PhoreMarketplaceClient-darwin-x64 --overwrite --background=./imgs/osx-finder_background.png --debug

    echo 'Codesign the DMG and zip'
    codesign --force --sign "$SIGNING_IDENTITY" dist/PhoreMarketplace-darwin-x64/PhoreMarketplace-$PACKAGE_VERSION.dmg
    cd dist/PhoreMarketplace-darwin-x64/
    zip -q -r PhoreMarketplace-mac-$PACKAGE_VERSION.zip PhoreMarketplace.app
    cp -r PhoreMarketplace.app ../osx/
    cp PhoreMarketplace-mac-$PACKAGE_VERSION.zip ../osx/
    cp PhoreMarketplace-$PACKAGE_VERSION.dmg ../osx/

    # Client Only
    cd ../../
    codesign --force --sign "$SIGNING_IDENTITY" dist/PhoreMarketplaceClient-darwin-x64/PhoreMarketplaceClient-$PACKAGE_VERSION.dmg
    cd dist/PhoreMarketplaceClient-darwin-x64/
    zip -q -r PhoreMarketplaceClient-mac-$PACKAGE_VERSION.zip PhoreMarketplaceClient.app
    cp -r PhoreMarketplaceClient.app ../osx/
    cp PhoreMarketplaceClient-mac-$PACKAGE_VERSION.zip ../osx/
    cp PhoreMarketplaceC-$PACKAGE_VERSION.dmg ../osx/PhoreMarketplaceClient-$PACKAGE_VERSION.dmg

    ;;
esac
