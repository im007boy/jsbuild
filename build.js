var builder = require('./main').build;
var _webroot = './';//可以绝对路径 支持中文 E:\\前端\\工程\\touch
var _option = 'manifest=true&jsloader=true&rebuildhtml=true&md5=true&nocopy=tools/&nocompile=node_modules/,test/,build.js';

/*
* bat node build.js ./test/html manifest=true&jsloader=true&rebuildhtml=true&md5=true&nocopy=tools/&nocompile=node_modules/,test/
* */
/*builder({
    root: process.argv[2],
    options: process.argv[3]
});*/

builder({
    root: process.argv[2] || _webroot,
    options: process.argv[3] || _option
});