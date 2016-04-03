// https://github.com/ghiculescu/jekyll-table-of-contents
(function($){
  $.fn.toc = function(options) {
    var defaults = {
      noBackToTopLinks: true,
      title: '长文导航',
      minimumHeaders: 2,
      headers: 'h1, h2, h3, h4, h5, h6',
      listType: 'ol', // values: [ol|ul]
      showEffect: 'show', // values: [show|slideDown|fadeIn|none]
      hideEffect: 'hide', // values: [hide|slideUp|fadeOut|none]
      showSpeed: 'normal' // set to 0 to deactivate effect
    },
    settings = $.extend(defaults, options);

    var displayed = false;

    function fixedEncodeURIComponent (str) {
      return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
        return '%' + c.charCodeAt(0).toString(16);
      });
    }

    var headers = $(settings.headers).filter(function() {
      // get all headers with an ID
      var previousSiblingName = $(this).prev().attr( "name" );
      if (!this.id && previousSiblingName) {
        this.id = $(this).attr( "id", previousSiblingName.replace(/\./g, "-") );
      }
      return this.id;
    }), output = $(this);
    if (!headers.length || headers.length < settings.minimumHeaders || !output.length) {
      $(this).hide();
      return;
    }

    if (0 === settings.showSpeed) {
      settings.showEffect = 'none';
    }

    var render = {
      show: function() { output.hide().html(html).show(settings.showSpeed); },
      slideDown: function() { output.hide().html(html).slideDown(settings.showSpeed); },
      fadeIn: function() { output.hide().html(html).fadeIn(settings.showSpeed); },
      none: function() { output.html(html); }
    };

    var renderOut = {
      hide: function() { output.html(html).hide(settings.showSpeed); },
      slideUp: function() { output.html(html).slideUp(settings.showSpeed); },
      fadeOut: function() { output.html(html).fadeOut(settings.showSpeed); },
      none: function() { output.hide(); }
    };

    var get_level = function(ele) { return parseInt(ele.nodeName.replace("H", ""), 10); }
    var highest_level = headers.map(function(_, ele) { return get_level(ele); }).get().sort()[0];
    var return_to_top = '<i class="icon-arrow-up back-to-top"> </i>';

    var level = get_level(headers[0]),
      this_level,
      html = " <"+settings.listType+">";
    headers.on('click', function() {
      if (!settings.noBackToTopLinks) {
        window.location.hash = this.id;
      }
    })
    .addClass('clickable-header')
    .each(function(_, header) {
      this_level = get_level(header);
      if (!settings.noBackToTopLinks && this_level === highest_level) {
        $(header).addClass('top-level-header').after(return_to_top);
      }
      if (this_level === level) // same level as before; same indenting
        html += "<li><a class='anchor-link' href='javascript:void(0)' anchor='" + fixedEncodeURIComponent(header.id) + "'>" + header.innerHTML + "</a>";
      else if (this_level <= level){ // higher level than before; end parent ol
        for(i = this_level; i < level; i++) {
          html += "</li></"+settings.listType+">"
        }
        html += "<li><a class='anchor-link' href='javascript:void(0)' anchor='" + fixedEncodeURIComponent(header.id) + "'>" + header.innerHTML + "</a>";
      }
      else if (this_level > level) { // lower level than before; expand the previous to contain a ol
        for(i = this_level; i > level; i--) {
          html += "<"+settings.listType+"><li>"
        }
        html += "<a class='anchor-link' href='javascript:void(0)' anchor='" + fixedEncodeURIComponent(header.id) + "'>" + header.innerHTML + "</a>";
      }
      level = this_level; // update for the next one
    });
    html += "</"+settings.listType+">";
    if (!settings.noBackToTopLinks) {
      $(document).on('click', '.back-to-top', function() {
        $(window).scrollTop(0);
        window.location.hash = '';
      });
    }

    var pos = $(".header-placeholder").position();
    var placeholderHeight;
    function updatePlaceholderHeight(){
        placeholderHeight = $(".content header").height() + parseInt($(".content header").css("padding-top"))*2;
    };
    updatePlaceholderHeight();

	var c = "ontouchstart" in window || navigator.maxTouchPoints;
    if(c){
        $(document).bind("orientationchange", function(){
            pos = $(".header-placeholder").position();
            updatePlaceholderHeight();
        });
    } else {
        $(window).resize(function(){
            pos = $(".header-placeholder").position();
            updatePlaceholderHeight();
        });
    }

    $(window).scroll(function() {
        if (displayed) {
            renderOut[settings.hideEffect]();
            displayed = false;
        }
        if ($(window).scrollTop() > pos.top) {
            $(".content header").addClass("stick");
            $(".header-placeholder").css("height", placeholderHeight + "px");
        } else {
            $(".content header").removeClass("stick");
            $(".header-placeholder").css("height", "0");
        }
    });

    function scrollToAnchor(aid){
        var anchor = $("[id='"+ aid +"']");
        var tocHeight = $("#toc").height();
        placeholderHeight = $(".content header").height() + parseInt($(".content header").css("padding-top"))*2 - tocHeight - 8;
        if ($(window).scrollTop() > pos.top) {
            $('html,body').animate({scrollTop: anchor.offset().top - placeholderHeight - 20},'slow');
        } else {
            $('html,body').animate({scrollTop: anchor.offset().top - placeholderHeight - tocHeight - 8 - 20},'slow');
        }
    }

    $(".menu-button").animate({"opacity":"1"},500).click(function() {
        if (!displayed) {
            render[settings.showEffect]();
            $(".anchor-link").click(function () {
                renderOut[settings.hideEffect]();
                displayed = false;
                scrollToAnchor($(this).attr("anchor"));
            });
            displayed = true;
        } else {
            renderOut[settings.hideEffect]();
            displayed = false;
        }
    });

  };
})(jQuery);
