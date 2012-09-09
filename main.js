exports.build = (function () {
    var fs = require('fs'),
        path = require('path'),
        uglify = require('uglify-js'),
        htmlParser = require('htmlparser'),
        md5 = require('md5').md5;

    /*
     * @description
     * */
    lib = {};
    lib.log = function () {
        console.log.apply(console, arguments);
    };
    lib.debug = console.debug = function () {
        //lib.log.apply(console, arguments);
    };
//////////////////////////////

    var workConfig = {};
    var util = (function (_conf) {
        var fn = {};
        /*
         * @description uglify js压缩库
         * */
        fn.uglify = function (orig_code, options) {
            options || (options = {});
            var jsp = uglify.parser;
            var pro = uglify.uglify;

            var ast = jsp.parse(orig_code, options.strict_semicolons); // parse code and get the initial AST
            ast = pro.ast_mangle(ast, options.mangle_options); // get a new AST with mangled names
            ast = pro.ast_squeeze(ast, options.squeeze_options); // get an AST with compression optimizations
            var final_code = pro.gen_code(ast, options.gen_options); // compressed code here
            return final_code;
        };

        /*
         * @description 用户项目根目录
         * @param {bool} 是否相对于当前脚本的相对目录
         * */
        fn.getRoot = function (absolute) {
            if (absolute)
                return _conf.root;
            else
                return _conf.root;
        };

        /*
         * @description 用户项目根目录
         * @param {bool} 是否相对于当前脚本的相对目录
         * @return {string} 返回路径结尾一定有/
         * */
        fn.getTargetRoot = function (absolute) {
            var _fix = '_build/';
            //path.basename 末尾与系统有关可能是/或者\ 用normalize格式化去掉
            var dir = path.join(fn.getRoot(), path.normalize('../'), path.basename(fn.getRoot(), path.normalize('/')) + _fix);
            if (absolute) {
                return path.resolve(dir);
            } else {
                return dir;
            }
        };

        /*
         * @description 获取 从 source 目录里取到的文件补全工作目录的路径
         * @param {string} 源文件的相对路径
         * @return {string} 已经补全的相对路径 可能输入E://
         * */
        fn.getTargetPath = function (file) {
            return path.join(fn.getTargetRoot(), file);
        };

        /*
         * @description 根据 root 获取html中引用文件的绝对路径
         * @param {string} 相对路径 如果是 http ftp https 直接返回
         * @return {string} 已经补全的相对路径 可能输入E://
         * */
        fn.getSourcePath = function (file) {
            return path.join(fn.getRoot(), file);
        };

        /*
         * @description 修复目录树结构
         * */
        fn.repairDir = (function () {
            function mkdir(dir, mode, success) {
                dir = path.normalize(dir);
                if (path.existsSync(dir)) {
                    success(dir, mode, success);
                } else {
                    lib.debug('-->' + path.dirname(dir));
                    mkdir(path.dirname(dir), mode, function () {
                        lib.debug('-->fs.mkdir-' + dir);
                        fs.mkdir(dir, mode, function (e) {
                            lib.debug('fs.mkdir->' + dir);
                            if (e) {
                                if (e.code == 'EEXIST') {

                                }
                            } else {
                                success();
                            }
                        });
                    });
                }
            }

            return function (dir, mode, callback) {
                //dir = path.resolve(dir);
                if (typeof callback != 'function')
                    callback = function () {
                    };

                if (path.existsSync(dir))
                    return callback();
                else
                    mkdir(dir, mode, callback);
            };
        })();

        /*
         * @description 处理文件扩展参数 返回真实文件路径  ./e/1.js?a=9v=5.6  -> ['./e/1.js', 'js']
         * @param {string} 文件路径字符串
         * @param {string} 辅助扩展名参数 一般可以自动识别
         * @return {string} ./e/1.js
         * */
        fn.getRealFile = function (filestr, ext) {
            if (!filestr)
                return filestr;
            var _m = filestr.match(/[^?]+/);// 'test\html\js\1.js?var=3.2&v=8'.match(/[^?]+/)
            var _m = _m ? _m[0] : '';
            return _m || '';
        };

        /*
         * @description 写数据到文件
         * */
        fn.writeFile = function (dir, content, callback) {
            //非异步会直接throw error
            //lib.debug('writeFile', dir);
            callback = callback || function () {
            };
            fn.repairDir(path.dirname(dir), null, function () {
                fs.writeFile(dir, content, 'utf8', function (e) {
                    if (e) {
                        lib.log('写文件错误_____', e, '------------');
                    } else {
                        callback();
                    }
                });
            });
            return false;
        };

        /*
         * @description 同步复制文件 相同编码
         * */
        fn.copyFileSync = function (targetTile, sourceFile, encoding) {
            encoding || (encoding = 'binary');
            return fs.writeFileSync(targetTile, fs.readFileSync(sourceFile, encoding), encoding);
        };
        /*
         * @description 初始化这次任务的参数
         * @param {object}
         *   root:{string}
         *   options:{string}
         * */
        fn.init = function (param) {
            param = param || {};
            if (param.root) {
                //使用绝对路径 防止打包当前目录
                _conf.root = path.resolve(path.normalize(param.root + path.normalize('/')));
            }
            _conf.options = {
                nocompile:[],
                nocopy:['.svn', '.cvs', '.idea', '.DS_Store', '.git', '.hg']
            };
            if (param.options) {
                // 'manifest=true&loader=true&rebuildhtml=true'
                param.options = path.normalize(param.options);
                var _opt = param.options.split('&');
                var _key = '';
                for (var i = _opt.length - 1; i >= 0; i--) {
                    _key = _opt[i].split('=');
                    if (_key.length == 2) {
                        if (_key[0] == 'nocopy' || _key[0] == 'nocompile') {
                            // nocopy=tools
                            // nocompile=node_modules,test
                            _conf.options[_key[0]].push.apply(_conf.options[_key[0]], _key[1].split(','));
                        } else {
                            _conf.options[_key[0]] = _key[1];
                        }
                    }
                }
            }

            lib.debug('----------config---------\n', _conf, '\n------------------');
            return;

        };
        fn.init({root:'./'});

        /*
        * @description 判断一个路径是否在配置中允许复制
        * */
        fn.ifCopy = function (name) {
            if (name && _conf.options['nocopy']) {
                for (var i = _conf.options['nocopy'].length; i >= 0; i--) {
                    if (name.indexOf(_conf.options['nocopy'][i]) >= 0)
                        return false;
                }
            }
            return true;
        };
        /*
         * @description 判断一个路径是否在配置中允许编译/重写 不能复制的一定不编译
         * */
        fn.ifCompile = function (name) {
            if (!fn.ifCopy(name))
                return false;
            if (name && _conf.options['nocompile']) {
                for (var i = _conf.options['nocompile'].length; i >= 0; i--) {
                    if (name.indexOf(_conf.options['nocompile'][i]) >= 0)
                        return false;
                }
            }
            return true;
        };

        /*
         * @description 返回一个设置的值
         * */
        fn.getConf = function (key) {
            return _conf.options[key];
        }

        /*
         * @description 遍历目录 并对目录或文件进行操作
         * @param {string} _dir 需要遍历的目录路径
         * @param {function} _directory 对目录的同步处理
         * @param {function} _file 对文件的同步
         * @param {bool} _useCapture useCapture==true 时先递归此目录再产生回调 file可以使此目录为空
         * */
        fn.dirSync = (function () {
            var directory, file, basedir = './', useCapture;

            function realpath(name) {
                //normalize 删除多余的 / 。
                return path.normalize(basedir + '/' + name);
            }

            /*
             * @param {string} 相对于 basedir的目录
             * */
            function next(name) {
                //lib.debug('next:', name);
                //防止递归过程中被删除
                if (!path.existsSync(realpath(name)))
                    return;
                var data = fs.statSync(realpath(name));
                if (data.isFile()) {
                    file(name);
                } else if (data.isDirectory()) {
                    //useCapture==true 时先递归此目录再产生回调 file可以使此目录为空
                    if (useCapture)
                        nextDir(name);

                    if (directory(name) !== false && !useCapture)//目录回调返回 false 则不递归此目录
                        nextDir(name);
                } else {
                    lib.debug('unknow type', data);
                }
            }

            /*
             * @param {string} 相对于 basedir的目录
             * */
            function nextDir(dir) {
                //防止递归过程中被删除
                if (!path.existsSync(realpath(dir)))
                    return;
                var data = fs.readdirSync(realpath(dir));
                for (var i = data.length - 1; i >= 0; i--) {
                    next(path.join(dir, data[i]));
                }
            }

            return function (_dir, _directory, _file, _useCapture) {
                //useCapture 捕获 true时 父目录先产生dir回调
                basedir = _dir || '';
                basedir += path.normalize('/');
                directory = _directory || function () {
                };
                file = _file || function () {
                };
                useCapture = !!_useCapture;
                lib.debug('列目录:', _dir);
                nextDir('');
            };
        })();


        Object.freeze(fn);
        return fn;
    })(workConfig);

    /*
     * @description 源 js 压缩复制到 新位置 一个异步队列
     * @param {string} jsPath
     * @return {string} targetPath
     * */
    var jsCompiler = (function (util) {
        var convert = {};
        var pend = [];
        var _process = 0;
        /*
         * @description 源 js 压缩复制到 新位置
         * @param {string} js 路径 相对于工作目录 而不是编译脚本目录 内部进行转换
         * @param {string} 输出js路径 相对于输出更目录
         * */
        function compile(jsPath, success, fail) {
            //lib.debug('file', util.getSourcePath(jsPath) );
            //lib.debug('real', util.getRealFile(util.getSourcePath(jsPath)) );

            fs.readFile(util.getRealFile(util.getSourcePath(jsPath)), 'utf8', function (err, data) {
                if (err) {
                    lib.log('read js file error:', err);
                    if (typeof fail == 'function')
                        fail(jsPath);

                } else {
                    //lib.log('compile  ' + jsPath);
                    var code = util.uglify(data);
                    //lib.log('w ', util.getTargetPath(jsPath));
                    util.writeFile(util.getRealFile(util.getTargetPath(jsPath)), code);

                    lib.log('compile success ' + jsPath);

                    if (typeof success == 'function')
                        success(jsPath);
                    return util.uglify(data);
                }
            });
        }

        function start() {
            var js = pend.shift();
            var realPath = util.getRealFile(js);
            if (js && convert[realPath] != 'success') {
                _process++;
                compile(js, function () {
                    convert[realPath] = 'success';
                    _process--;
                    start();
                }, function () {
                    convert[realPath] = 'fail';
                    _process--;
                    start();
                });
            }
        }

        return {
            add:function (jsPath) {
                lib.debug('add ', jsPath);
                pend.push(jsPath);
                if (!_process)
                    start();
            },
            status:function () {
                return _process;
            }
        };
    })(util);

    /*
     * @description 解析并处理一个 .html 文件
     * */
    var htmlCompilerSync = (function () {
        var handler = new htmlParser.DefaultHandler(function (error, dom) {
            if (error)
                lib.log(error);
        });

        var parser = new htmlParser.Parser(handler);

        /*
         * @description
         * @param {htmlParser object}
         * */
        function finder(dom) {
            switch (dom.name) {
                case 'script':
                    if (dom.attribs && dom.attribs.src) {
                        //jsCompiler.add(dom.attribs.src);
                    } else {
                        lib.debug('content script');
                    }
                    break;
                default:
                    for (var ch in dom.children) {
                        finder(dom.children[ch]);
                    }
                    break;
            }
        }
        return {
            getJs: function(filePath){
                var html, js = [];
                try {
                    html = fs.readFileSync(util.getSourcePath(filePath), 'utf8');
                } catch (e) {}
                if (html) {
                    parser.parseComplete(html);
                    for (var k in handler.dom){
                        if (handler.dom[k].name == 'script' && handler.dom[k].attribs && handler.dom[k].attribs.src) {
                            js.push(handler.dom[k].attribs.src);
                        }
                    }
                }
                return js;
            },
            compile: function (filePath) {
                var html;
                lib.log('copy', filePath);
                util.copyFileSync(util.getTargetPath(filePath), util.getSourcePath(filePath), 'binary');
                return true;
            }
        };
        return ;
    })();

    /*
     * @description
     * @param {string} node.js path
     * @param {string} build.js
     * @param {string} 打包目录
     * @param {string} options manifest=true&loader=true&rebuildhtml=true
     * */
     function main(){
         handleDir(util.getRoot(), util.getTargetRoot(), function (fileList) {
             //lib.debug(fileList);

             var htmlList = [], md5List, source = {};
             //处理文件列表 筛选需要编译的文件 合并处理项
             for (var i = 0; i < fileList.length; i++) {
                 //只复制不编译
                 if (util.ifCopy(fileList[i]) && !util.ifCompile(fileList[i])) {
                     util.copyFileSync(util.getTargetPath(fileList[i]), util.getSourcePath(fileList[i]), 'binary');
                     continue;
                 }

                 /* 可能需要特定格式处理 先不写了...
                 if (!source[path.extname(fileList[i])])
                     source[path.extname(fileList[i])] = [];
                 source[path.extname(fileList[i])].push(fileList[i]);
                 */

                 //文件编译分类 对 js 文件和 css 文件异步编译 ，html 文件添加为后续任务
                 switch (path.extname(fileList[i])) {
                     case '.html':
                     case '.htm':
                         //解析此 html 文件 里面是否有 http引用js 引用根目录外的目录会有问题 导致源文件被覆盖
                         //先跳过 要压缩js css  计算 md5 再重写 html 里的脚本引用 ?v=3s6d3
                         htmlList.push(fileList[i]);
                         break;
                     case '.js':
                         //压缩js并复制到新目录 异步
                         jsCompiler.add(fileList[i]);
                         break;
                     case '.css':
                     default:
                         lib.debug('no compile engine:', util.getSourcePath(fileList[i]), util.getTargetPath(fileList[i]));
                         util.copyFileSync(util.getTargetPath(fileList[i]), util.getSourcePath(fileList[i]), 'binary');
                         break;
                 }
             }

             //处理 创建/修改 配置文件 或 重写html文件
             var timer = setInterval(function () {
                 if (jsCompiler.status()) {
                     //js 还在编译
                     return;
                 }
                 clearInterval(timer);

                 if (util.getConf('rebuildhtml') == 'true') {
                     //处理html
                     for (var i = htmlList.length - 1; i >= 0; i--) {
                         htmlCompilerSync.compile(htmlList[i]); // 压缩内部js 重建 jsleader 修改 js md5 引用
                     }
                 }

                 if (util.getConf('manifest') == 'true') {
                     (function(files){
                         var manifest = [];
                         files.sort(function(a, b){
                             if (path.extname(a) == path.extname(b))
                                 return a < b?-1:1;
                             else
                                 return path.extname(a) < path.extname(b)?-1:1;
                         });

                         //创建 .manifest 文件
                         manifest.push('CACHE MANIFEST', '');
                         manifest.push('#Update: ' + [new Date().getFullYear(), '/', new Date().getMonth() + 1, '/', new Date().getDate(), ' ', new Date().getHours(), ':', new Date().getMinutes(), ':', new Date().getSeconds()].join(''));
                         manifest.push('#hash: ' + Math.floor(Math.random() * 100000), '');
                         manifest.push('CACHE:', '');
                         for (var i = files.length - 1; i >= 0; i--) {
                             switch (path.extname(files[i])) {
                                 case '.js':
                                 case '.png':
                                 case '.jpg':
                                 case '.gif':
                                     // 加入manifest数据
                                     manifest.push(files[i].replace(/\\/g, '/')); //  css\img\3.png -> css/img/3.png
                                     //加入换行
                                     if (i >= 1 && path.extname(files[i]) != path.extname(files[i-1]) ){
                                         manifest.push('');
                                     }
                                     //lib.debug(md5(fs.readFileSync(util.getTargetPath(files[i]), 'binary')));
                                     break;
                                 default:
                                     break;
                             }
                         }
                         manifest.push('');
                         manifest.push('NETWORK:', '*');
                         fs.writeFileSync(util.getTargetPath('index.manifest'), manifest.join('\n'), 'utf8');
                         lib.log('已创建 index.manifest');
                     })(fileList);
                 }
                 if (util.getConf('jsloader') == 'true') {
                     lib.log('jsloader 还不支持呢');
                 }
             }, 1000);
         });

         function handleDir(sourceDir, targetDir, success) {
             success || (success = function () {
             });
             var _sourceFile = [];
             //删除已有目录
             if (path.existsSync(targetDir)) {
                 util.dirSync(targetDir, function (name) {
                     //lib.debug('删除目录', name);
                     fs.rmdirSync(util.getTargetPath(name));
                 }, function (name) {
                     //lib.debug('删除文件', name);
                     fs.unlinkSync(util.getTargetPath(name));
                 }, true);
             }
             //创建新的目标根目录
             util.repairDir(targetDir, null, function () {
                 util.dirSync(sourceDir, function (name) {
                     if (!util.ifCopy(name)) {
                         lib.debug('忽略复制 ', name);
                         return false;
                     }
                     lib.debug('创建目录 ', name);
                     fs.mkdirSync(util.getTargetPath(name), null);
                 }, function (name) {
                     if (util.ifCopy(name)) {
                         _sourceFile.push(name);
                     } else {
                         lib.debug('忽略复制 ', name);
                     }
                 }, false/* false 模式目录优先 再目录内的文件*/);
                 success(_sourceFile);
             });
         }

     }

     function _init(args) {
         args || (args = {});
         if (!args.root || !path.existsSync(args.root)) {
             lib.log('目录错误');
             return;
         }
         util.init({
             root:args.root,
             options:args.options || ''
         });

         main();
         return;
     }


    return _init;
})();