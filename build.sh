#!/bin/bash

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
echo "Building with PhoreMarketplace-go/$SERVERTAG"

APPLE_NOTARIAZATION=$(node -p 'require("./package").apple_notarization')
if [ ${APPLE_NOTARIAZATION} = true ]; then
  echo "Mac OS version will be notarized"
else
  echo "Skipping Mac OS notarization"
fi

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

rvm reinstall ruby

echo 'Building PhoreMarketplace app...'
npm run build

echo 'Copying transpiled files into js folder...'
cp -rf prod/* js/

echo "We are building: ${BINARY}"

case "$TRAVIS_OS_NAME" in
  "linux")

    echo 'Linux builds'
    echo 'Making dist directories'
    mkdir dist/linux64

    sudo apt-get install rpm

    echo 'Install npm packages for Linux'
    npm install -g --save-dev electron-installer-debian --silent
    npm install -g --save-dev electron-installer-redhat --silent

    # Install libgconf2-4
    sudo apt-get install libgconf2-4 libgconf-2-4

    # Install rpmbuild
    sudo apt-get --only-upgrade install rpm

    # Ensure fakeroot is installed
    sudo apt-get install fakeroot

    # Retrieve Latest Server Binaries
    sudo apt-get install jq
    cd PHORE_MARKETPLACE_TEMP/
    curl -u $GITHUB_USER:$GITHUB_TOKEN -s https://api.github.com/repos/phoreproject/pm-go/releases/$SERVERTAG > release.txt
    cat release.txt
    cat release.txt | jq -r ".assets[].browser_download_url" | xargs -n 1 curl -L -O
    cd ..

    APPNAME="phoremarketplace"

    echo 'Building Linux 64-bit Installer....'

    echo "Packaging Electron application"
    electron-packager . ${APPNAME} --platform=linux --arch=x64 --electronVersion=${ELECTRONVER} --overwrite --ignore="PHORE_MARKETPLACE_TEMP" --prune --out=dist

    echo 'Move go server to electron app'
    mkdir dist/${APPNAME}-linux-x64/resources/pm-go/
    cp -rf PHORE_MARKETPLACE_TEMP/pm-go-linux-amd64 dist/${APPNAME}-linux-x64/resources/pm-go
    rm -rf PHORE_MARKETPLACE_TEMP/*
    mv dist/${APPNAME}-linux-x64/resources/pm-go/pm-go-linux-amd64 dist/${APPNAME}-linux-x64/resources/pm-go/marketplaced
    rm -rf dist/${APPNAME}-linux-x64/resources/app/.travis
    chmod +x dist/${APPNAME}-linux-x64/resources/pm-go/marketplaced

    echo 'Create debian archive'
    electron-installer-debian --config .travis/config_amd64.json

    echo 'Create RPM archive'
    electron-installer-redhat --config .travis/config_x86_64.json

    APPNAME="phoremarketplaceclient"

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
    brew remove jq
    brew link oniguruma
    brew install jq
    brew link --overwrite fontconfig gd gnutls jasper libgphoto2 libicns libtasn1 libusb libusb-compat little-cms2 nettle openssl sane-backends webp wine git-lfs gnu-tar dpkg xz
    brew install freetype graphicsmagick
    brew link xz
    brew remove openssl
    brew install openssl
    brew link freetype graphicsmagick mono

#   Retrieve Latest Server Binaries
    cd PHORE_MARKETPLACE_TEMP/
    curl -u $GITHUB_USER:$GITHUB_TOKEN -s https://api.github.com/repos/phoreproject/pm-go/releases/$SERVERTAG > release.txt
    cat release.txt
    cat release.txt | jq -r ".assets[].browser_download_url" | xargs -n 1 curl -L -O
    cd ..

    if [[ $BINARY == 'win' ]]; then

        brew link --overwrite fontconfig gd gnutls jasper libgphoto2 libicns libtasn1 libusb libusb-compat little-cms2 nettle openssl sane-backends webp wine git-lfs gnu-tar dpkg xz
        brew link libgsf glib pcre

        brew remove osslsigncode
        brew install mono osslsigncode
        brew reinstall openssl@1.1

        brew cask install wine-stable

        # WINDOWS 64
        echo 'Building Windows 64-bit Installer...'
        mkdir dist/win64

        export WINEARCH=win64

        npm install electron-packager

        cd node_modules/electron-packager
        npm install rcedit
        cd ../..

        echo 'Running Electron Packager...'
        node_modules/electron-packager/bin/electron-packager.js . PhoreMarketplace --asar --out=dist --protocol-name=PhoreMarketplace --ignore="PHORE_MARKETPLACE_TEMP" --win32metadata.ProductName="PhoreMarketplace" --win32metadata.CompanyName="Phore" --win32metadata.FileDescription='Decentralized p2p marketplace' --win32metadata.OriginalFilename=PhoreMarketplace.exe --protocol=pm --platform=win32 --arch=x64 --icon=imgs/openbazaar2.ico --electron-version=${ELECTRONVER} --overwrite

        echo 'Copying server binary into application folder...'
        cp -rf PHORE_MARKETPLACE_TEMP/pm-go-windows-4.0-amd64.exe dist/PhoreMarketplace-win32-x64/resources/
        cp -rf PHORE_MARKETPLACE_TEMP/libwinpthread-1.win64.dll dist/PhoreMarketplace-win32-x64/resources/libwinpthread-1.dll
        mkdir dist/PhoreMarketplace-win32-x64/resources/pm-go
        mv dist/PhoreMarketplace-win32-x64/resources/pm-go-windows-4.0-amd64.exe dist/PhoreMarketplace-win32-x64/resources/pm-go/marketplaced.exe
        mv dist/PhoreMarketplace-win32-x64/resources/libwinpthread-1.dll dist/PhoreMarketplace-win32-x64/resources/pm-go/libwinpthread-1.dll

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

        mv dist/win64/RELEASES-x64 dist/win64/RELEASES

    else

        # OSX
        echo 'Building OSX Installer'
        mkdir dist/osx

        # Install the DMG packager
        echo 'Installing electron-installer-dmg'
        npm install -g electron-installer-dmg

        # Sign pm-go binary
        echo 'Signing Go binary'
        mv PHORE_MARKETPLACE_TEMP/pm-go-darwin-10.6-amd64 dist/osx/marketplaced
        rm -rf PHORE_MARKETPLACE_TEMP/*
        codesign --force --sign "$SIGNING_IDENTITY" --timestamp --options runtime dist/osx/marketplaced

        # Notarize the zip files
        UPLOAD_INFO_PLIST="uploadinfo.plist"
        REQUEST_INFO_PLIST="request.plist"
        touch ${UPLOAD_INFO_PLIST}

        wait_for_notarization() {
          while true; do \

            echo "Checking Apple for notarization status..."; \
            /usr/bin/xcrun altool --notarization-info `/usr/libexec/PlistBuddy -c "Print :notarization-upload:RequestUUID" $UPLOAD_INFO_PLIST` -u $APPLE_ID -p $APPLE_PASS --output-format xml > "$REQUEST_INFO_PLIST" ;\

            cat $REQUEST_INFO_PLIST

            if [[ `/usr/libexec/PlistBuddy -c "Print :notarization-info:Status" ${REQUEST_INFO_PLIST}` != "in progress" ]] || [[ "$requestUUID" == "" ]] ; then \

               # check if it has been uploaded already and get the RequestUUID from the error message
               echo "Checking if binary has already been uploaded..."; \
               message=`/usr/libexec/PlistBuddy -c "Print :product-errors:0:message" $UPLOAD_INFO_PLIST`;\
               if [[ ${message} =~ ^ERROR\ ITMS-90732* ]]; then \
                   prefix="ERROR ITMS-90732: \"The software asset has already been uploaded. The upload ID is "; \
                   suffix="\" at SoftwareAssets\/EnigmaSoftwareAsset"; \
                   requestUUID=`echo "${message}" | sed -e "s/^$prefix//" -e "s/$suffix$//"`; \

                   echo "Binary has already been uploaded. Checking Apple status for request ${requestUUID}..."; \
                   /usr/bin/xcrun altool --notarization-info ${requestUUID} -u $APPLE_ID -p $APPLE_PASS --output-format xml > "$REQUEST_INFO_PLIST" ;\
               fi ;\

               if [[ `/usr/libexec/PlistBuddy -c "Print :notarization-info:Status" ${REQUEST_INFO_PLIST}` == "success" ]]; then \
                echo "Binary has been notarized"; \
                break; \
               fi; \
            fi ;\
            echo "Waiting 30 seconds to check status again..."; \
            sleep 30 ;\
          done
        }

        extract_app() {

            # use process redirection to capture the mount point and dev entry
            IFS=$'\n' read -rd '\n' mount_point dev_entry < <(
                # mount the diskimage; leave out -readonly if making changes to the filesystem
                hdiutil attach -readonly -plist "$1" | \

                # convert output plist to json
                plutil -convert json - -o - | \

                # extract mount point and dev entry
                jq -r '
                    .[] | .[] |
                    select(."volume-kind" == "hfs") |
                    ."mount-point" + "\n" + ."dev-entry"
                '
            )

            # work with the zip file
            cp -rf "${mount_point}/${2}.app" dist/osx

            # unmount the disk image
            hdiutil detach "$dev_entry"

        }

        if [[ ${BINARY} == 'osx' ]]; then

            echo 'Running Electron Packager...'
            electron-packager . PhoreMarketplace --out=dist -app-category-type=public.app-category.business --protocol-name=PhoreMarketplace --ignore="PHORE_MARKETPLACE_TEMP" --protocol=pm --platform=darwin --arch=x64 --icon=imgs/openbazaar2.icns --electron-version=${ELECTRONVER} --overwrite --app-version=$PACKAGE_VERSION

            echo 'Creating pm-go folder in the OS X .app'
            mkdir dist/PhoreMarketplace-darwin-x64/PhoreMarketplace.app/Contents/Resources/pm-go

            echo 'Moving binary to correct folder'
            mv dist/osx/marketplaced dist/PhoreMarketplace-darwin-x64/PhoreMarketplace.app/Contents/Resources/pm-go/marketplaced
            chmod +x dist/PhoreMarketplace-darwin-x64/PhoreMarketplace.app/Contents/Resources/pm-go/marketplaced

            echo 'Codesign the .app'
            codesign --force --deep --sign "$SIGNING_IDENTITY" --options runtime --entitlements phore.entitlements dist/PhoreMarketplace-darwin-x64/PhoreMarketplace.app
            electron-installer-dmg dist/PhoreMarketplace-darwin-x64/PhoreMarketplace.app PhoreMarketplace-$PACKAGE_VERSION --icon ./imgs/openbazaar2.icns --out=dist/PhoreMarketplace-darwin-x64 --overwrite --background=./imgs/osx-finder_background.png --debug

            echo 'Codesign the DMG and zip'
            codesign --force --sign "$SIGNING_IDENTITY" --timestamp --options runtime --entitlements phore.entitlements dist/PhoreMarketplace-darwin-x64/PhoreMarketplace-$PACKAGE_VERSION.dmg
            cd dist/PhoreMarketplace-darwin-x64/
            zip -q -r PhoreMarketplace-mac-$PACKAGE_VERSION.zip PhoreMarketplace.app
            cp -r PhoreMarketplace.app ../osx/
            cp PhoreMarketplace-mac-$PACKAGE_VERSION.zip ../osx/
            cp PhoreMarketplace-$PACKAGE_VERSION.dmg ../osx/

            cd ../..

            zip -q -r dist/osx/PhoreMarketplace.zip dist/PhoreMarketplace-darwin-x64/PhoreMarketplace-$PACKAGE_VERSION.dmg

            if [ ${APPLE_NOTARIAZATION} = true ]; then
              # Upload to apple and notarize
              echo "Uploading binary to Apple Notarization server..."
              xcrun altool --notarize-app --primary-bundle-id "io.phore.desktop-${PACKAGE_VERSION}" --username "$APPLE_ID" --password "$APPLE_PASS" --file dist/osx/PhoreMarketplace.zip --output-format xml > ${UPLOAD_INFO_PLIST}
              wait_for_notarization

              echo "Stapling ticket to the DMG..."
              xcrun stapler staple dist/osx/PhoreMarketplace-$PACKAGE_VERSION.dmg

              extract_app "dist/osx/PhoreMarketplace-$PACKAGE_VERSION.dmg" "PhoreMarketplace"

              zip -q -r dist/osx/PhoreMarketplace-mac-$PACKAGE_VERSION.zip dist/osx/PhoreMarketplace.app
            fi

        else

            # Client Only
            electron-packager . PhoreMarketplaceClient --out=dist -app-category-type=public.app-category.business --protocol-name=PhoreMarketplace --ignore="PHORE_MARKETPLACE_TEMP" --protocol=pm --platform=darwin --arch=x64 --icon=imgs/openbazaar2.icns --electron-version=${ELECTRONVER} --overwrite --app-version=$PACKAGE_VERSION

            codesign --force --deep --sign "$SIGNING_IDENTITY" --timestamp --options runtime --entitlements phore.entitlements dist/PhoreMarketplaceClient-darwin-x64/PhoreMarketplaceClient.app
            # Use PhoreMarketplaceC on purpose to prevent to long .dmg executable name, maximum len is 27 chars.
            electron-installer-dmg dist/PhoreMarketplaceClient-darwin-x64/PhoreMarketplaceClient.app PhoreMarketplaceC-$PACKAGE_VERSION --icon ./imgs/openbazaar2.icns --out=dist/PhoreMarketplaceClient-darwin-x64 --overwrite --background=./imgs/osx-finder_background.png --debug

            # Client Only
            codesign --force --sign "$SIGNING_IDENTITY" --timestamp --options runtime --entitlements phore.entitlements dist/PhoreMarketplaceClient-darwin-x64/PhoreMarketplaceC-$PACKAGE_VERSION.dmg
            cd dist/PhoreMarketplaceClient-darwin-x64/
            zip -q -r PhoreMarketplaceClient-mac-$PACKAGE_VERSION.zip PhoreMarketplaceClient.app
            cp -r PhoreMarketplaceClient.app ../osx/
            cp PhoreMarketplaceClient-mac-$PACKAGE_VERSION.zip ../osx/
            cp PhoreMarketplaceC-$PACKAGE_VERSION.dmg ../osx/PhoreMarketplaceClient-$PACKAGE_VERSION.dmg

            cd ../..

            zip -q -r dist/osx/PhoreMarketplaceClient.zip dist/PhoreMarketplaceClient-darwin-x64/PhoreMarketplaceClient-$PACKAGE_VERSION.dmg

            if [ ${APPLE_NOTARIAZATION} = true ]; then
              echo "Uploading client only binary to Apple Notarization server..."
              xcrun altool --notarize-app --primary-bundle-id "io.phore.desktopclient-$PACKAGE_VERSION" --username "$APPLE_ID" --password "$APPLE_PASS" --file dist/osx/PhoreMarketplaceClient.zip --output-format xml > $UPLOAD_INFO_PLIST
              wait_for_notarization

              echo "Stapling ticket to the DMG..."
              xcrun stapler staple dist/osx/PhoreMarketplaceClient-$PACKAGE_VERSION.dmg

              extract_app "dist/osx/PhoreMarketplaceClient-$PACKAGE_VERSION.dmg" "PhoreMarketplaceClient"

              zip -q -r dist/osx/PhoreMarketplaceClient-mac-$PACKAGE_VERSION.zip dist/osx/PhoreMarketplaceClient.app
            fi
        fi

    fi

  ;;
esac
