@echo off
:: batĿ¼�µ�build.js
set builder=%~sdp0/build.js

:: ����ϵͳ��������
:: set builder=%jsbuilder%/build.js

:: ����Լ�Ŀ¼
:: node %builder%
echo ��Ҫ����ĸ�Ŀ¼�ϵ���bat�ļ� ���Ŀ¼����������ֱ���޸�build.js���ֶ�����
node %builder% %1 "manifest=true&jsloader=true&rebuildhtml=true&md5=true&nocopy=tools&nocompile=node_modules,test"
pause