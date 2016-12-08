---
layout: post
title: "iOS 10 Extensions 开发实战"
tags: ["iOS", "Widget", "Extension", "iMessage", "开发", "HealthKit", "Chart"]
menu: true
---

首先声明这并不是一篇实战教程，只是记录下开发中遇到的零零碎碎的问题和自己的解决办法。

iOS 10 最不能让我接受的改版就是 Health.app，应用层级变多，现在要点好几下才能看到自己每周的步数和运动距离统计。与此同时 iOS 10 的 Widgets 面板给了 Widget 更多的空间，想着能有一款让人一目了然地查看一周运动步数的 Widget 就好了，然而找了下 App Store 上目前并没有很好的成品，于是自己动手开写，途中顺便也尝试了下 iMessage Extension。

先扔 Repo 地址和效果图：[https://github.com/Wildog/iOS-10-Steps-Widget](https://github.com/Wildog/iOS-10-Steps-Widget)

![Steps Widget](http://7xqhhm.com1.z0.glb.clouddn.com/images/steps-widget.gif)

## iOS 10 Widget 新特性：折叠/展开

如上面的效果图所示，iOS 10 通过展开的方式给了 Widget 更多空间，展开状态`NCWidgetDisplayModeExpanded`下的最大高度是系统决定的，折叠状态 `NCWidgetDisplayModeCompact`下的高度则是固定的（110 左右），在 `TodayViewController` 中可以通过 `NCWidgetProviding` 协议中的 `widgetActiveDisplayModeDidChange:` 获取状态变化并设置需要的高度：

{% highlight objc %}
- (void)widgetActiveDisplayModeDidChange:(NCWidgetDisplayMode)activeDisplayMode withMaximumSize:(CGSize)maxSize {
    if (activeDisplayMode == NCWidgetDisplayModeExpanded) {
        self.preferredContentSize = CGSizeMake(0.0, 280.0);
    } else if (activeDisplayMode == NCWidgetDisplayModeCompact) {
        self.preferredContentSize = maxSize;
    }
}
{% endhighlight %}

## 获取 HealthKit 信息

* ### 新的访问控制

iOS 10 中增加了新的隐私访问控制，需要在 info.plist 中设置 `NSHealthShareUsageDescription` 和 `NSHealthUpdateUsageDescription` 的值作为数据使用的描述，两个值都必须设置，否则会收到类似下面的通知：

    This app has crashed because it attempted to access privacy-sensitive data without a usage description. The app's Info.plist must contain an NSHealthShareUsageDescription key with a string value explaining to the user how the app uses this data.
    
如下图设置好这两个值过后就能正常地请求应用授权了：

![Steps Widget](http://7xqhhm.com1.z0.glb.clouddn.com/images/healthkit-usage-description.png)

* ### 异步请求带来的问题

获取 HealthKit 数据的方式是向 `HKHealthStore` 的实例发送 `executeQuery:` 信息，而这个方法是异步调用的。我一开始的做法是在 `viewDidLoad` 中直接调用一个 `queryHealthData` 方法，在这个方法里面执行一系列（一周的数据，按天请求）的 `executeQuery: `，返回后再交给图表绘制。然而数据交给图表时几乎不可能是完整的，因为 `executeQuery: ` 的异步请求此时并没有执行完，最终导致应用崩溃。所以需要一个办法在所有的异步请求全部处理完之后再进行其它处理，`dispatch_group` 可以很好的解决，同时 `dispatch_group` 内部的任务也是并发进行的：

{% highlight objc %}
// 创建 dispatch_group
dispatch_group_t hkGroup = dispatch_group_create();
// 依次执行请求
for (......) {
    // 创建 query
    HKStatisticsQuery *query = [[HKStatisticsQuery alloc]
                        initWithQuantityType:stepType
                        quantitySamplePredicate:predicate
                        options:HKStatisticsOptionCumulativeSum
                        completionHandler:^(HKStatisticsQuery *query, HKStatistics *result, NSError *error) {
        double data = [result.sumQuantity doubleValueForUnit:[HKUnit countUnit]];
        [arrayForData addObject:[NSNumber numberWithDouble:data]];
        // 数据存储完后离开 dispatch_group，可以理解为信号量 +1
        dispatch_group_leave(hkGroup);
    }];
    // 执行异步请求前进入 dispatch_group，可以理解为信号量 -1
    dispatch_group_enter(hkGroup);
    [self.healthStore executeQuery:query];
}
// 最后等待所有异步请求完成
dispatch_group_notify(hkGroup, dispatch_get_main_queue(),^{
    // 通知主线程绘制图表
}
{% endhighlight %}

* ### 锁屏状态下无法访问 HealthKit 数据

如果你尝试在锁屏状态下通过 Widget 访问 HealthKit 数据，你会在 Console 中收到类似下面的信息：

    Widget[3459:674785] Error Domain=com.apple.healthkit Code=6 "Protected health data is inaccessible" UserInfo={NSLocalizedDescription=Protected health data is inaccessible}
    
很遗憾在锁屏状态下由于隐私保护是没法访问 HealthKit 信息的，所以我们需要对此类错误进行处理并缓存之前的数据用于锁屏状态下显示。由于数据很简单而且数量不多，数据的缓存用 `NSUserDefaults` 实现相当简单：

{% highlight objc %}
NSUserDefaults userDefaults = [[NSUserDefaults alloc] init];
// 保存数据
[userDefaults setObject:arrayForData forKey:@"snapshot"];
// 恢复数据
NSArray *arrayForData = [userDefaults arrayForKey:@"snapshot"];
{% endhighlight %}

然后我们在之前 query 的 `completionHandler` 块中加入对错误的检测并在图表上显示对应提示，并设置一个全局的 flag 用于检测到错误时显示之前缓存的数据。

## 绘制线形图

![Steps Widget](http://7xqhhm.com1.z0.glb.clouddn.com/images/chart-view.png)

* ### 绘制渐变

通过得到的数据绘制好一条 `BezierPath` 路径后，再利用这个路径创建一个 `CAShapeLayer` 形状层，设置好属性和动画后，再创建一个和这个 View 一样大的 `CAGradientLayer` 渐变层，最后将渐变层作为 sublayer 添加到 `self.layer` 上，并把渐变层的 `mask` 属性设置为之前创建的 `CAShapeLayer` 形状层就实现了：

{% highlight objc %}
// 创建形状层
CAShapeLayer *chartLineShape = [CAShapeLayer layer];
chartLineShape.path          = chartLine.CGPath;
chartLineShape.lineWidth     = self.chartLineWidth;
chartLineShape.strokeColor   = [UIColor colorWithHue:0.52 saturation:1 brightness:0.83 alpha:1].CGColor;
chartLineShape.fillColor     = [UIColor clearColor].CGColor;
chartLineShape.lineCap       = kCALineCapRound;
chartLineShape.lineJoin      = kCALineJoinRound;

// 创建动画
CABasicAnimation *drawAnimation   = [CABasicAnimation animationWithKeyPath:@"strokeEnd"];
drawAnimation.duration            = self.animationDuration;
drawAnimation.repeatCount         = 1.0;
drawAnimation.removedOnCompletion = YES;
drawAnimation.fromValue           = [NSNumber numberWithFloat:0.0f];
drawAnimation.toValue             = [NSNumber numberWithFloat:1.0f];
drawAnimation.timingFunction      = [CAMediaTimingFunction functionWithControlPoints: 0.348 : 0.000 : 0.285 : 0.743];
[chartLineShape addAnimation:drawAnimation forKey:@"drawChartLineAnimation"];

// 创建渐变层
CAGradientLayer *gradientLayer = [CAGradientLayer layer];
gradientLayer.frame            = CGRectMake(0, 0, self.frame.size.width, self.frame.size.height);
gradientLayer.colors           = @[(__bridge id)[UIColor colorWithHue:0.57 saturation:0.74 brightness:0.86 alpha:1].CGColor,(__bridge id)[UIColor colorWithHue:0.52 saturation:1 brightness:0.76 alpha:1].CGColor, (__bridge id)[UIColor colorWithHue:0.52 saturation:1 brightness:0.83 alpha:1].CGColor];
gradientLayer.startPoint       = CGPointMake(0,0.5);
gradientLayer.endPoint         = CGPointMake(1,0.5);

// 设置遮罩
[self.layer addSublayer:gradientLayer];
gradientLayer.mask = chartLineShape;
{% endhighlight %}

* ### 检测触摸点击

我单独写了一个 `ChartNodeView` 来表示和绘制节点，并在 `ChartView` 的 `drawRect:` 中创建节点并将它们作为 subview 添加进来，触摸点击节点会触发动画效果和显示节点的相关信息，所以需要检测触摸事件并通过 `hitTest:` 识别触摸对象来判断节点序号：

{% highlight objc %}
- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event {
    [self touchPoint:touches withEvent:event];
    [super touchesBegan:touches withEvent:event];
}

- (void)touchPoint:(NSSet *)touches withEvent:(UIEvent *)event {
    UITouch *touch = [touches anyObject];
    CGPoint touchPoint = [touch locationInView:self];
    UIView *touchView = [self hitTest:touchPoint withEvent:nil];
    
    // 判断触摸对象是否为节点
    if ([touchView isKindOfClass:[ChartNodeView class]]) {
        // 重新高亮节点
        for (UIView *subview in self.subviews) {
            if ([subview isKindOfClass:[ChartNodeView class]]) {
                ChartNodeView *nodeView = (ChartNodeView*)subview;
                if (nodeView.isActive) [nodeView toggleState];
            }
        }
        ChartNodeView *touchNode = (ChartNodeView*)touchView;
        [touchNode toggleState];
        // 显示节点信息的逻辑交由 delegate 处理
        _lastSelected = touchNode.index;
        if ([self.delegate respondsToSelector:@selector(clickedNodeAtIndex:)]) {
            [self.delegate clickedNodeAtIndex:_lastSelected];
        }
    }
}
{% endhighlight %}

这个线型图的实现很简单，写的时候也注意了一定的可复用性，如果有需要的话可以直接拿走用。

## iOS 10 iMessage Extension

![Steps Widget](http://7xqhhm.com1.z0.glb.clouddn.com/images/steps-imsg-ext.png)

iOS 10 提供的 iMessage 扩展可以生成漂亮的 rich message。把之前 Widget 里写好的 ViewController 拿过来改改就可以直接用，这里记录下信息的生成，使用 `MSMessageTemplateLayout` 可以创建带[媒体文件、标题和说明](https://developer.apple.com/reference/messages/msmessagetemplatelayout)的布局，创建 `NSMessage` 后，设置其布局属性，然后通过 `MSMessagesAppViewController` 的 `activeConversation` 属性获取当前对话并执行 `insertMessage:` 来插入信息，整个过程完毕后交给用户添加评论或发送：

{% highlight objc %}
MSMessageTemplateLayout *layout = [[MSMessageTemplateLayout alloc] init];
layout.image = image;
layout.caption = @"This is a caption";

MSMessage *msg = [[MSMessage alloc] init];
msg.layout = layout;
msg.URL = [NSURL URLWithString:@"emptyURL"];

[self.activeConversation insertMessage:msg completionHandler:^(NSError *error){
    // error handling
}];
{% endhighlight %}

截取图表为图片时使用的方法是 `drawViewHierarchyInRect:afterScreenUpdates`，创建 image context 时注意使用的方法是 `UIGraphicsBeginImageContextWithOptions(CGSize size, BOOL opaque, CGFloat scale)` 且 `scale` 的值需要设为 0，表示 scale factor 由设备决定，如果使用 `UIGraphicsBeginImageContext(CGSize size)` 的话默认的 scale 值为 1，在 2x, 3x 设备上会显示模糊的图像：

{% highlight objc %}
UIGraphicsBeginImageContextWithOptions(self.lineChartView.bounds.size, NO, 0);
[self.lineChartView drawViewHierarchyInRect:self.lineChartView.bounds afterScreenUpdates:YES];
UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
UIGraphicsEndImageContext();
{% endhighlight %}

## 顺便吐槽 Xcode 8

升级之后整个人都懵逼了，所有的插件都没了，包括没法离开的 XVim，看了下 [Alcatraz Issues](https://github.com/alcatraz/Alcatraz/issues/475) 里面的讨论，官方采用了 runtime library validation 对 Xcode 插件进行验证，并提供了新的 Xcode 插件协议 Xcode Source Editor Extensions（然而目前只能提供基本的替换功能），主要是为了防止 XcodeGhost 这样的恶意插件。废话说得再多，我依然不能接受。翻遍 Github 找到了个很好用的工具 [inket/update_xcode_plugins](https://github.com/inket/update_xcode_plugins)，不光可以 unsign Xcode 使其重新支持插件，还可以给插件自动添加 UUID，经过十分钟的拷贝和 unsign，Xcode 8 总算是能正常使用了。

