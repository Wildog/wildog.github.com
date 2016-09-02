---
layout: post
title: "用 Pythonista 写 UI"
tags: ["pythonista", "ui", "python", "exif"]
menu: true
---

[Pythonista](http://omz-software.com/pythonista/) 从 1.5 版本起到现在的 3.0 版本， 陆续增加了 UI 编辑器 、 Share Extension 、断点调试等功能，原本就是 iOS 上日常脚本神器的它现在已经成了功能完善的 Python 开发环境，拿着手机打发时间的同时写个像样的 App 也不在话下。下面是这两天用 Pythonista 写的两个小玩具，顺便记录一下途中遇到的坑。

先附上 Repo 地址：[https://github.com/Wildog/pythonista-toys](https://github.com/Wildog/pythonista-toys)

## EXIF.py

![EXIF](http://7xqhhm.com1.z0.glb.clouddn.com/images/exif.jpg)

这是一个用于查看照片信息的 Extension，能显示 EXIF 信息、RGB 直方图和解析后的地理位置，可以触发 Share Sheet 地方都能使用。

Pythonista 自带了 PIL 模块，能很方便的获取 EXIF 信息和执行图片处理。但坑也是主要都在图片方面，获取图片 EXIF 信息只能从 PIL.Image 的实例中获取，而在 ImageView 上显示的图片又必须是 ui.Image 的实例，坑爹的是 ui 模块的文档里面一直把这两个类混淆，而且也没有自带两个类之间的转换方法，遂自己动手：

{% highlight python %}
def pil2ui(imgIn):
    b = io.BytesIO()
    imgIn.save(b, 'JPEG')
    imgOut = ui.Image.from_data(b.getvalue())
    b.close()
    return imgOut
{% endhighlight %}

解决了图片转换的问题又发现由于在 Share Extension 中运行脚本时内存上限较小，尺寸较大的图片得先压缩才能显示，然而 Image.resize() 依然不能摆脱内存问题，最终用 Image.thumbnail() 解决，注意这个方法的效果是 in-place 的。

现在图片能正常在 ImageView 中显示了，但又出现了新的问题：iOS 设备拍摄的照片无法正确显示方向，窥探了下这些照片的 EXIF 信息发现照片本身都是横向的，系统显示的时候才利用 EXIF 信息里的 'Orientation' 决定方向，所以现在得自己实现这个过程，直接用 Image.rotate() 解决：

{% highlight python %}
orientations = {
    1: 0,
    2: 0,
    3: 180,
    4: 0,
    5: 0,
    6: 270,
    7: 0,
    8: 90
}
if exif.get('Orientation'):
    img = img.rotate(orientations.get(exif['Orientation'], 0))
{% endhighlight %}

最后利用 [GeoPy](https://github.com/geopy/geopy) 实现坐标到地址的解码再显示出来就行了，安装包时还顺便发现了 [StaSh](https://github.com/ywangd/stash) 这个神器，运行在 Pythonista 上的模拟 shell，可以直接使用 pip 进行包管理。

## Garfield.py

![garfield](http://7xqhhm.com1.z0.glb.clouddn.com/images/garfield.jpg)

一个用来看每日加菲猫漫画的小脚本，除了显示和保存漫画以外还能查看从 GoComics 上抓取的评论。画 UI 的时候发现虽然有 Auto-Resizing / Flex 功能，但远不及 iOS 的 AutoLayout 来的完善，甚至都没法在同层级的 view 之间建立约束，不过整体代码只有百来行，远比写个真正的 App 轻松多了。

