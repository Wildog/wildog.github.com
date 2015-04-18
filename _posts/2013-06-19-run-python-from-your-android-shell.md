---
layout: post
title: 在 Android 终端上运行 Python
---

doubanclaim2389defec8f9328e
尝试了 [SL4A](https://code.google.com/p/android-scripting/) + [PythonForAndroid](https://code.google.com/p/python-for-android/) 和 [QPython](http://qpython.com/) 后发现 Python 并不能从 [Android Terminal Emulator](https://play.google.com/store/apps/details?id=jackpal.androidterm) 上直接运行，于是参考了下[官方的方法](https://code.google.com/p/python-for-android/wiki/RunPythonFromShell)，觉得这样调用有点麻烦，经我改进后在 Android 终端上运行 Python 的办法如下：

1. 下载安装 [PythonForAndroid_r4.apk](https://code.google.com/p/python-for-android/downloads/detail?name=PythonForAndroid_r4.apk)  
   \# 这个版本是 Python 2.6, 你也可以选择 [Python 3](https://code.google.com/p/python-for-android/downloads/detail?name=Python3ForAndroid_r6.apk), 后面的环境变量自行更改
2. 运行 Python for Android → Install (需要网络，最好在wifi环境下)
3. Google Play 商店里安装 [Android Terminal Emulator](https://play.google.com/store/apps/details?id=jackpal.androidterm)
4. 下载 Bash, 见 [XDA 帖子附件](http://forum.xda-developers.com/showthread.php?t=977051)  
   \# 帖子里的 BusyBox 有需要也可以装上替换 Android 阉割版
5. 解压, 把包里的 [bash 文件](http://pan.baidu.com/share/link?shareid=2088068197&uk=3103986771)复制到 `/system/bin/` 下
6. 下载这里的 [python 文件](http://pan.baidu.com/share/link?shareid=2088068197&uk=3103986771) 文件复制到 `/system/bin/` 下
7. 运行终端 → 首选项 → 命令行, 更改 `/system/bin/sh` 为 `/system/bin/bash`

    ![setting shell](/resources/130619-setting-shell.jpg)   
8. 初始命令, 加入:
        
{% highlight bash %}
export EXTERNAL_STORAGE=/mnt/sdcard
PYTHONPATH=/mnt/sdcard/com.googlecode.pythonforandroid/extras/python
PYTHONPATH=${PYTHONPATH}:/data/data/com.googlecode.pythonforandroid/files/python/lib/python2.6/lib-dynload
export PYTHONPATH
export TEMP=/mnt/sdcard/com.googlecode.pythonforandroid/extras/python/tmpexport PYTHON_EGG_CACHE=$TEMP
export PYTHONHOME=/data/data/com.googlecode.pythonforandroid/files/python
export LD_LIBRARY_PATH=/data/data/com.googlecode.pythonforandroid/files/python/lib
#路径根据实际情况有可能需要更改
{% endhighlight %}

![](/resources/130619-export-env.jpg)   
    
9.启终端即可运行<br>
    
![](/resources/130619-run.jpg)
