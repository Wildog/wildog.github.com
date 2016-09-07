---
layout: post
title: "记一则流媒体传输上的坑"
tags: ["streaming", "流媒体", "flask", "python"]
menu: true
---

最近用 Flask 写了个文件系统服务器，想在前端 streaming 服务器上的媒体文件，先是直接写了个生成器方法，传递给 stream_with_context 后生成 Response 返回，在本地测试时发现了两个怪异现象。

一个是部分 mp4 文件能正常播放而其他 mp4 文件在播放时显示出错，另一个是 mp3 文件在不同浏览器下播放行为不统一，在 Chrome 下能正常显示总时长，而在 Safari 下不显示总时长而只显示 Live Broadcasting。

## 分析

针对第一个问题，分析文件后发现能正常播放的 mp4 文件都是我之前通过 HandBrake 转码过后的 web optimized mp4 文件，如下图所见，此类文件的 metadata(moov) 位于媒体数据(mdat)之前，浏览器请求视频文件后从文件开头开始接收，如果 metadata 在文件开头，浏览器就能正常读取信息并完整地播放视频。而大多数视频的 metadata 都在媒体数据之后，导致浏览器不能正常 streaming。

![moov before mdat](http://7xqhhm.com1.z0.glb.clouddn.com/images/moov.jpg)

第二个问题通过对两个浏览器的请求进行抓包比较得到问题所在：

![chrome](http://7xqhhm.com1.z0.glb.clouddn.com/images/chrome-header.png)

![safari](http://7xqhhm.com1.z0.glb.clouddn.com/images/safari-header.png)

从图上可以看出 Safari 在请求 mp3 文件之前先发送了一个头部带有 `Range: bytes=0-1` 的请求给服务器，如果服务器的响应头部没有对应的 Content-Range 或者响应码不是 206 Partial Content，而是直接回应整个文件，Safari 就会认为这是一个 Live Broadcasting 流，并把 audio.duration 这个 tag 的值设为无限大。

## 总结

总结一下这两个问题的解决办法可以得出流媒体传输的必要条件：

1. 视频文件需要是 fast-start 或者 web optimized 的，可以通过 `ffmpeg -i input.mp4 -movflags faststart -acodec copy -vcodec copy output.mp4` 处理得到
2. 服务器端需要正确地响应带有 Range 头部的请求，以及返回正确的 Content-Type 头部
3. 服务器端不压缩地直接返回媒体文件，Content-Encoding 头部的值为 identity

## 最终代码

{% highlight python %}
def partial_response(path, start, end=None):
    file_size = os.path.getsize(path)

    if end is None:
        end = file_size - start - 1
    end = min(end, file_size - 1)
    length = end - start + 1

    with open(path, 'rb') as fd:
        fd.seek(start)
        bytes = fd.read(length)

    response = Response(
        bytes,
        206,                                    # Partial Content
        mimetype=mimetypes.guess_type(path)[0], # Content-Type must be correct
        direct_passthrough=True,                # Identity encoding
    )
    response.headers.add(
        'Content-Range', 'bytes {0}-{1}/{2}'.format(
            start, end, file_size,
        ),
    )
    response.headers.add(
        'Accept-Ranges', 'bytes'                # Accept request with Range header
    )
    return response

def get_range(request):
    range = request.headers.get('Range')
    m = re.match('bytes=(?P<start>\d+)-(?P<end>\d+)?', range)
    if m:
        start = m.group('start')
        end = m.group('end')
        start = int(start)
        if end is not None:
            end = int(end)
        return start, end
    else:
        return 0, None
        
@app.route('/<path:p>')
def v_get_video_file(p=''):
    path = os.path.join(root, p)
    if os.path.isfile(path):
        if 'Range' in request.headers:
            start, end = get_range(request)
            res = partial_response(path, start, end)
        else:
            res = send_file(path)
            res.headers.add('Content-Disposition', 'attachment')
    else:
        res = make_response('Not found', 404)
    return res
{% endhighlight %}

最后的 `res.headers.add('Content-Disposition', 'attachment')` 是为了让 Safari 以下载而不是新窗口播放的方式来打开媒体文件的超链接。

如此一来就能正常的传输流媒体了：

![streaming](http://7xqhhm.com1.z0.glb.clouddn.com/images/streaming.png)

完整项目见此：[https://github.com/Wildog/flask-file-server](https://github.com/Wildog/flask-file-server)

