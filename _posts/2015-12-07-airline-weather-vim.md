---
layout: post
title: 在 Vim-airline 上显示天气
tags: ["vim", "天气", "airline", "vim-airline", "weather"]
menu: true
---

![screenshot](//wil.dog/static/images/airline-weather-vim-screenshot.png)

这两天把 Vim 的 Powerline 插件换成了 [vim-airline](https://github.com/bling/vim-airline), 相比 Powerline, vim-airline 更轻量, 完全用 Vimscript 实现, 让我摆脱了 Vim 中的 Powerline 插件在我的 tmux 环境下经常闪烁的问题.

但是 vim-airline 缺了 Powerline 插件的天气扩展, 于是自己写了一个 vim-airline 的天气扩展, 效果图如上, 在右下角显示天气图标和当前温度, 借助了 webapi-vim 插件和 OpenWeatherMap 的 API.

Github Repo 地址: [https://github.com/Wildog/airline-weather.vim](https://github.com/Wildog/airline-weather.vim)

## 安装

* ### 使用 Vundle 安装

扩展依赖 vim-airline 和 webapi-vim, 确保你的 .vimrc 中有以下几行:

{% highlight vim %}
Plugin 'bling/vim-airline'
Plugin 'mattn/webapi-vim'
Plugin 'Wildog/airline-weather.vim'
{% endhighlight %}

然后执行 `:PluginInstall`

## 自定义

* ### 设置位置

{% highlight vim %}
let g:weather#area = 'beijing,china'
{% endhighlight %}

* ### 设置单位

metric 为摄氏度, imperial 为华氏度

{% highlight vim %}
let g:weather#unit = 'metric'
{% endhighlight %}

* ### 设置 API Key

默认为我的 API Key, 你最好申请并设置一个自己的 API Key: [http://openweathermap.org/appid](http://openweathermap.org/appid)

{% highlight vim %}
let g:weather#appid = '2de143494c0b295cca9337e1e96b00e0'
{% endhighlight %}

* ### 设置缓存

缓存文件路径默认为`~/.cache/.weather`, 更新周期默认为 1 小时. 如果要修改更新周期, 注意更新太过频繁会使 Vim 卡顿.

{% highlight vim %}
let g:weather#cache_file = '~/.cache/.weather'
let g:weather#cache_ttl = '3600'
{% endhighlight %}

* ### 设置格式

`%s`为天气图标, `%f`为温度数字

{% highlight vim %}
let g:weather#format = '%s %.0f'
{% endhighlight %}

* ### 设置图标

各图标数字代码含义可参考 OpenWeatherMap 的 API: [http://openweathermap.org/weather-conditions](http://openweathermap.org/weather-conditions)

{% highlight vim %}
let g:weather#status_map = {
\ "01d": "☀",
\ "02d": "☁",
\ "03d": "☁",
\ "04d": "☁",
\ "09d": "☂",
\ "10d": "☂",
\ "11d": "☈",
\ "13d": "❅",
\ "50d": "≡",
\ "01n": "☽",
\ "02n": "☁",
\ "03n": "☁",
\ "04n": "☁",
\ "09n": "☂",
\ "10n": "☂",
\ "11n": "☈",
\ "13n": "❅",
\ "50n": "≡",
\}
{% endhighlight %}

* ### 强制刷新天气

{% highlight vim %}
:call RefreshWeather()
{% endhighlight %}
