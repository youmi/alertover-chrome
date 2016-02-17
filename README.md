Alertover Chome Extension
======================

Alertover的chrome插件，用于接收推送。


![icon](/docs/images/alertover.jpg)

安装
------------

进入文件目录

// 安装前端依赖
npm install

// browserify编译js文件
node_modules/browserify/bin/cmd.js alertover_extension/src/js/background.js -o alertover_extension/dist/js/background.js
node_modules/browserify/bin/cmd.js alertover_extension/src/js/popup.js -o alertover_extension/dist/js/popup.js

添加到Chrome, 访问 chrome://extensions/ 

点击 'Load Unpacked Extension...' 然后选择alertover_extension文件夹

License
-------

Available under the MIT License

