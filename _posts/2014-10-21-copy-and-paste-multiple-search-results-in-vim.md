---
layout: post
title: 在 Vim 里复制所有匹配结果
tags: ["vim", "vimscript", "复制"]
---

##Test

######Test

Test
==========

今天突发奇想地想在 Vim 中一次性复制所有的正则匹配结果, 先是直接想到用 MultipleCursors 这个插件带的 MultipleCursorsFind, 复制后提示 yank 操作不能在多光标情况下使用, 这种奇技淫巧果然行不通...
遂用 Vimscript 解决, 在 `.vimrc` 中加入下列函数:

{% highlight vim %}
function! CopyMatches (m) 
    let @+ .= a:m . "\n" 
    return a:m
endfunction
{% endhighlight %}

复制方法:  
{% highlight vim %}
:let @+ = ''
:%s/regex/\=CopyMatches(submatch(0))/g
{% endhighlight %}

粘贴方法:  
{% highlight vim %}
"+p
{% endhighlight %}

嫌麻烦可以设个快捷键, 如:  
{% highlight vim %}
:map <F4> :let @+ = ''<cr>:%s/regex/\=CopyMatches(submatch(0))/g
{% endhighlight %}
按 F4 后自己改掉 regex 就可以了.

示例:  
![](http://7xqhhm.com1.z0.glb.clouddn.com/images/vim-1.png)  
![](http://7xqhhm.com1.z0.glb.clouddn.com/images/vim-2.png)
