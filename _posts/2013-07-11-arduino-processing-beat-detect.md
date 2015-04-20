---
layout: post
title: 用 Arduino + Processing 识别节拍
---

doubanclaim506adbabc3469312
一个简单的 Arduino + Processing 工程，用 Minim 库中的 BeatDetect 实时读取 Buffer 中的数据并采集音频频率识别 Kick、Snare 和 Hi-Hat 三种鼓点，通过 Arduino 的 Firmata 库驱动 LED 发光。

**源码**:  
[点我下载](http://wildog.net/download/BeatWrite.zip)  
# 把 `BeatWrite.pde` 中的针脚配置改为你自己连接的针脚, 连接图示[点我查看](/resources/circuit.jpg)  
# 把 mp3 文件放入 `data` 文件夹中, 将 `BeatWrite.pde` 中 `"minim.loadFile("aaa.mp3", 2048)"` 一行的 `"aaa.mp3"` 改为你自己的 mp3 文件名

**软件**:  
1. Arduino  
2. Processing  
   \# 务必下载 1.5.1 版本的 Processing, 个人测试 2.0 的版本会出错  
3. Arduino 库  
   \# 解压至 `Processing目录/modes/java/libraries/`  
4. Minim 库  
   \# 官方 Processing 已自带, 如果你的没有, 下载后解压至相同目录  

**步骤**:  
1. 将 Examples 中 Firmata 库里的 StandardFirmata 上传到 Arduino 中  
2. 上传完毕等到 Arduino 上的 RX/TX LED 停止闪烁后再运行 Processing 源码  

实测 Linkin Park 的 New Divide, 这首鼓点比较清晰：[视频戳我](http://v.youku.com/v_show/id_XNTcyNDA5NjAw.html)  
右边的是 Kick, 中间的是 Snare, 左边的是 Hi-Hat, 不同鼓的频率不同, 但各种鼓的 Kick 大部分都在<150Hz 频段, 可见 Kick 是最准的, 而 Snare 处于半残废状态, Hi-Hat 也一直把差不多的高频误判为 Hi-Hat

![](/resources/arduino.jpg)
