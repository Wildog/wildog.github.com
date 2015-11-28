---
layout: post
title: 把你的旧 Kindle 变成桌面气象站
tags: ["kindle", "天气", "diy"]
---

![](/resources/kindle.jpg)  

源地址: [https://github.com/cathay4t/kindle-weather](https://github.com/cathay4t/kindle-weather)

看到有人在 K3 上做了个锁屏天气, 自己也心痒痒跟着 DIY 了一下, 效果还不错, 也算是把长期闲置的 K4 派上了用场.

分享下自己的流程:

* 首先, 你需要一台长期联网的 Kindle (K3, K4 测试通过)
* 其次, 你需要一台长期联网的主机或者 VPS

__然后先配置主机__:

* 安装好 httpd, pngcrush, librsvg2
* 启动 httpd 服务
* 建立文件夹 `/var/www/html/weather` 并设置权限
* 下载上面这个 [Repo](https://github.com/cathay4t/kindle-weather) 里的源码
* [申请 Weather Underground 的 API](http://www.wunderground.com/weather/api/d/login.html) 并记录 KEY
* `crontab -e` 添加定时任务, 在每天 6 点到 22 点期间每 29 分钟更新产生一次天气图片, `<PATH>` 改成源码所在路径, `<API_KEY>` 改成得到的 KEY, `<LAT> <LON>` 改成所在城市的经纬度, [Weather Underground](http://wunderground.com) 上搜索城市可以得到经纬度
{% highlight bash %}
*/29 6-22 * * * <PATH>/weather_script.py <API_KEY> <LAT> <LON>
{% endhighlight %}
* 运行 `weather_script.py <API_KEY> <LAT> <LON>`, 测试 `http://<主机域名>/weather/weather.png` 能否得到正确显示的图片.

__接下来配置 Kindle__:

* 首先给 Kindle 越狱
1. K4 下载此[压缩包](http://www.mobileread.com/forums/attachment.php?attachmentid=141180&d=1439936080), 
解压后把 `data.tar.gz`, `ENABLE_DIAGS` 两个文件和 `diagnostic_logs` 文件夹复制到 Kindle 根目录,
2. 重启后自动进入诊断模式, 选择`D) Exit, Reboot or Disable Diags` 后选择 `R) Reboot System`, 再选择 `Q) To continue`, 等待 20s 后会显示 Jailbreak 的画面, 越狱完会自动重启. (其他 Kindle 版本参考[此页](http://www.mobileread.com/forums/showthread.php?t=88004))
* 越狱后安装 USB networking, 从[此贴](http://www.mobileread.com/forums/showthread.php?t=88004)下载对应 Kindle 的版本, 解压后把 `update_usbnetwork_0.45.N_k4_install.bin` 文件复制到 Kindle 根目录, 然后在 Kindle 设置界面的菜单里选择更新 Kindle.
* __断开 Kindle 和电脑的连接__, 在主界面按键盘键, 输入 `;debugOn` 后回车, 接着输入 `~usbNetwork` 并回车, 然后把 Kindle 连接到电脑上, 这时候电脑会检测到名为 RNDIS/Ethernet Gadget 的网络接口, K4 用户把这个接口的 IP 地址设为 `192.168.15.201`, 其他版本的 Kindle 把这个 IP 设为 `192.168.2.1`,  如图:
![](/resources/interface.png)
* 通过 `ssh root@192.168.15.244` 连接到 K4, 其他版本 Kindle 通过 `ssh root@192.168.2.2` 连接, 密码通常为 mario
* 执行 `mntroot rw` 挂载 rootfs 为可写
* 进入 powerd 文件夹 `cd /etc/kdb.src/yoshi/system/daemon/powerd/`, 路径中的 yoshi 不是固定的, 不同版本的 Kindle 这个路径不同
* 执行 `less suspend_levels` 查看 suspend_levels, 把最后一行的数字改为 1152, 比如我的是 1218, 执行 `sed -i -e 's/1218/1152/' suspend_levels`, 完毕即可在睡眠模式下执行 crontab.
* 执行 `/mnt/base-us/weather` 创建文件夹
![](/resources/ssh.png)
* 在主机上把 `display-weather.sh` 里面的 `URL` 改为你自己主机上 weather.png 的 URL
* 通过 `scp display-weather.sh root@192.168.15.244:/usr/bin/` 把 `display-weather.sh` 传到 Kindle 上的 /usr/bin 目录下
* 回到 Kindle 的 shell, 添加 crontab 任务, 在每天6点到22点期间每小时获取一次天气图片:
{% highlight bash %}
echo "*/60 6-22 * * * /usr/bin/display-weather.sh" >> /etc/crontab/root
{% endhighlight %}
* 执行 `/usr/bin/display-weather.sh`, 在 Kindle 上测试效果

至此 Kindle 桌面气象站就设置好了, 每小时会自动更新天气, 如果中途解锁了再锁定, 锁屏界面会变成普通锁屏画面, 一小时内等到下次执行 crontab 任务的时候会重新显示天气界面.
