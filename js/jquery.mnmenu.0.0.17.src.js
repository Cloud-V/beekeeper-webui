(function($) {
    $.fn.mnmenu = function(op) {
        var tempLevelSettings = {};
        if (typeof op !== 'undefined' && typeof op.levelSettings !== 'undefined') {
            tempLevelSettings = op.levelSettings;
            delete op.levelSettings
        }
        var settings = $.extend({}, $.fn.mnmenu.defaults, op);
        settings.levelSettings = $.extend({}, settings.levelSettings, tempLevelSettings);
        var $this = $(this);
        $(window).resize(function() {
            $.fn.mnmenu.windowResize($this, settings)
        });
        this.each(function() {
            var $parentMenu = $(this);
            if ($parentMenu.prop("tagName").toUpperCase() !== "UL") {
                $.error("This function can only be called in <ul> elements.")
            }
            $parentMenu.addClass(settings.menuClassName);
            $.fn.mnmenu.levelRecursion(settings, $parentMenu, 0);
            $parentMenu.find("ul").each(function() {
                $(this).css("display", "none")
            })
        });
        $this.find("li").each(function() {
            var $this = $(this);
            $.fn.mnmenu.addEventListeners($this, settings)
        });
        $.fn.mnmenu.resetView($this, settings);
        return $this
    };
    $.fn.mnmenu.windowResize = function($menu, settings) {
        $.fn.mnmenu.resetView($menu, settings)
    };
    $.fn.mnmenu.mouseEnter = function($menu, settings) {
        var windowWidth = $(window).width();
        clearTimeout($menu.data('timer'));
        $.fn.mnmenu.elementsToHover($menu, settings).each(function() {
            $(this).addClass(settings.hoverClassName)
        });
        $menu.children("ul").each(function() {
            var $this = $(this);
            var $parent = $this.parent("li");
            var $parentContainer = $parent.closest("ul");
            if ($this.is(":animated")) {
                $this.stop(true, true).show()
            } else {
                var zindex = 100;
                var current = $this;
                while (current.get(0) !== $(document).get(0)) {
                    var temp = parseInt(current.css("z-index"));
                    if (!isNaN(temp) && temp > zindex) {
                        zindex = temp
                    }
                    current = current.parent()
                }
                $this.css("z-index", zindex + 1);
                var currentLevel = 0;
                var classList = $this[0].className.split(/\s+/);
                for (var i = 0; i < classList.length; i++) {
                    if (classList[i].indexOf([settings.levelClassPrefix, '-'].join('')) >= 0) {
                        currentLevel = parseInt(classList[i].substring(settings.levelClassPrefix.length + 1))
                    }
                }
                var customLevelSettings = settings.levelSettings[currentLevel];
                if (typeof customLevelSettings === "undefined") {
                    customLevelSettings = settings.levelSettings[0]
                }
                var left = "auto",
                    right = "auto",
                    top = "auto",
                    bottom = "auto";
                if (customLevelSettings.parentAttachmentPosition.toUpperCase().indexOf("W") >= 0 && customLevelSettings.attachmentPosition.toUpperCase().indexOf("E") >= 0) {
                    right = $parent.outerWidth() + "px";
                    if ($parent.offset().left - $this.outerWidth() < 0) {
                        left = $parent.outerWidth() + "px";
                        right = "auto"
                    }
                } else if (customLevelSettings.parentAttachmentPosition.toUpperCase().indexOf("E") >= 0 && customLevelSettings.attachmentPosition.toUpperCase().indexOf("E") >= 0) {
                    right = "0px"
                } else if (customLevelSettings.parentAttachmentPosition.toUpperCase().indexOf("E") >= 0 && customLevelSettings.attachmentPosition.toUpperCase().indexOf("W") >= 0) {
                    left = $parent.outerWidth() + "px";
                    if (($parentContainer.offset().left + $parentContainer.outerWidth() + $this.outerWidth()) > windowWidth) {
                        left = "auto";
                        right = $parent.outerWidth() + "px"
                    }
                } else if (customLevelSettings.parentAttachmentPosition.toUpperCase().indexOf("W") >= 0 && customLevelSettings.attachmentPosition.toUpperCase().indexOf("W") >= 0) {
                    left = "0px"
                }
                if (customLevelSettings.parentAttachmentPosition.toUpperCase().indexOf("N") >= 0 && customLevelSettings.attachmentPosition.toUpperCase().indexOf("S") >= 0) {
                    bottom = $parent.outerHeight() + "px"
                } else if (customLevelSettings.parentAttachmentPosition.toUpperCase().indexOf("S") >= 0 && customLevelSettings.attachmentPosition.toUpperCase().indexOf("S") >= 0) {
                    bottom = "0px"
                } else if (customLevelSettings.parentAttachmentPosition.toUpperCase().indexOf("S") >= 0 && customLevelSettings.attachmentPosition.toUpperCase().indexOf("N") >= 0) {
                    top = $parent.outerHeight() + "px"
                } else if (customLevelSettings.parentAttachmentPosition.toUpperCase().indexOf("N") >= 0 && customLevelSettings.attachmentPosition.toUpperCase().indexOf("N") >= 0) {
                    top = "0px"
                }
                $this.css("left", left);
                $this.css("right", right);
                $this.css("top", top);
                $this.css("bottom", bottom);
                $this.slideDown(settings.duration)
            }
        })
    };
    $.fn.mnmenu.mouseLeave = function($menu, settings) {
        clearTimeout($menu.data('timer'));
        $.fn.mnmenu.elementsToHover($menu, settings).each(function() {
            $(this).removeClass(settings.hoverClassName)
        });
        $menu.children("ul").each(function() {
            var $toHide = $(this);
            $menu.data('timer', setTimeout(function() {
                $toHide.hide(settings.duration)
            }, settings.delay))
        })
    };
    $.fn.mnmenu.resetView = function($menu, settings) {
        var responsiveSelector = ['li.' + settings.responsiveMenuButtonClass].join('');
        var $responsiveMenu = $menu.find(responsiveSelector).addBack(responsiveSelector);
        if ($responsiveMenu.length !== 0) {
            var $children = $responsiveMenu.children('ul').children();
            $menu.append($children);
            $responsiveMenu.remove();
            $.fn.mnmenu.levelRecursion(settings, $menu, 0)
        }
        var menuWidth = 0;
        $menu.find(['li.', settings.levelClassPrefix, '-0'].join('')).each(function() {
            menuWidth += $(this).outerWidth()
        });
        if ($(window).width() < (menuWidth + settings.responsiveMenuWindowWidthFudge) && settings.responsiveMenuEnabled === true) {
            var $children = $menu.children();
            var $responsiveMenu = $(["<li class='", settings.responsiveMenuButtonClass, " first'>", settings.responsiveMenuButtonLabel, "<ul></ul></li>"].join(''));
            $menu.append($responsiveMenu);
            $.fn.mnmenu.addEventListeners($responsiveMenu, settings);
            $responsiveMenu.children('ul').append($children);
            $.fn.mnmenu.levelRecursion(settings, $menu, 0)
        }
    };
    $.fn.mnmenu.levelRecursion = function(settings, $component, level) {
        if ($component.prop("tagName").toUpperCase() === "LI") {
            var middle = true;
            if ($component.parent().children().first().get(0) === $component.get(0) && level > 1) {
                $component.parent().closest("li").append($(["<span ", "class='", settings.arrowClassName, "'></span>"].join("")).append(settings.arrowCharacter));
                $component.addClass(settings.firstClassName);
                middle = false
            }
            if ($component.parent().children().last().get(0) === $component.get(0)) {
                $component.addClass(settings.lastClassName);
                middle = false
            }
            if (middle) {
                $component.addClass(settings.middleClassName)
            }
            level++
        }
        $component.children().each(function() {
            var $currentLevel = $(this);
            $currentLevel.removeClass([settings.levelClassPrefix, "-", level].join(''));
            $currentLevel.removeClass([settings.levelClassPrefix, "-", (level - 1)].join(''));
            $currentLevel.removeClass([settings.levelClassPrefix, "-", (level + 1)].join(''));
            $currentLevel.addClass([settings.levelClassPrefix, "-", level].join(''));
            $.fn.mnmenu.levelRecursion(settings, $currentLevel, level)
        })
    };
    $.fn.mnmenu.addEventListeners = function($li, settings) {
        if ($.fn.hoverIntent) {
            var $this = $li;
            $this.hoverIntent(function() {
                $.fn.mnmenu.mouseEnter($(this), settings)
            }, function() {
                $.fn.mnmenu.mouseLeave($(this), settings)
            })
        } else {
            var $this = $li;
            $this.mouseenter(function() {
                $.fn.mnmenu.mouseEnter($(this), settings)
            });
            $this.mouseleave(function() {
                $.fn.mnmenu.mouseLeave($(this), settings)
            })
        }
    };
    $.fn.mnmenu.elementsToHover = function($menu, settings) {
        return $([$menu, $menu.children(":not(ul)")])
    };
    $.fn.mnmenu.defaults = {
        menuClassName: "mnmenu",
        hoverClassName: "hover",
        levelClassPrefix: "level",
        arrowClassName: "arrow fa fa-caret-right",
        arrowCharacter: '',
        firstClassName: "first",
        middleClassName: "middle",
        lastClassName: "last",
        delay: 150,
        duration: 250,
        defaultParentAttachmentPosition: "NE",
        defaultAttachmentPosition: "NW",
        responsiveMenuEnabled: true,
        responsiveMenuWindowWidthFudge: 10,
        responsiveMenuButtonClass: "mnresponsive-button",
        responsiveMenuButtonLabel: "Menu"
    };
    $.fn.mnmenu.defaults.levelSettings = {};
    $.fn.mnmenu.defaults.levelSettings[0] = new MNLevelSettings();
    $.fn.mnmenu.defaults.levelSettings[1] = new MNLevelSettings();
    $.fn.mnmenu.defaults.levelSettings[1].parentAttachmentPosition = "SW";
    $.fn.mnmenu.defaults.levelSettings[1].attachmentPosition = "NW"
})(jQuery);

function MNLevelSettings() {
    this.parentAttachmentPosition = $.fn.mnmenu.defaults.defaultParentAttachmentPosition;
    this.attachmentPosition = $.fn.mnmenu.defaults.defaultAttachmentPosition;
    this.arrowCharacter = $.fn.mnmenu.defaults.arrowCharacter
}
