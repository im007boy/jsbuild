@echo off
:: bat目录下的build.js
set builder=%~sdp0/build.js

:: 设置系统环境变量
:: set builder=%jsbuilder%/build.js

:: 打包自己目录
:: node %builder%
echo 将要打包的根目录拖到此bat文件 如果目录包含中文请直接修改build.js并手动调用
node %builder% %1 "manifest=true&jsloader=true&rebuildhtml=true&md5=true&nocopy=tools&nocompile=node_modules,test"
pause