all:
	./node_modules/browserify/bin/cmd.js alertover_extension/src/js/background.js -o alertover_extension/dist/js/background.js
	./node_modules/browserify/bin/cmd.js alertover_extension/src/js/popup.js -o alertover_extension/dist/js/popup.js
