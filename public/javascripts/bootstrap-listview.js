/**
 * Created by jiqinghua on 15/7/5.
 */

//todo selected 的取消情形需要考虑
;
(function ($, window, document, undefined) {
    var pluginName = "listview";

    var _default = {};
    _default.options = {
        // functions
        // onAddItem(itemData)      return: addItemDataObject or null;
        onAddItem: undefined,

        // onDeleteItem(itemData)   return: true or false
        onDeleteItem: undefined,

        // onStar(itemData)         return: true or false
        onStar: undefined,

        // onFinish(itemData)       return: true or false
        onFinish: undefined,

        data: []
    };

    _default.template = {
        list: '<div class="list-wrapper"><div class="list-wrapper-scroll"><input class="add-list-item" type="text" name="name" value="" placeholder="添加新任务"><div class="todo-list-wrapper"></div><button type="button" class="btn btn-primary btn-sm toggle-finished-list">显示已完成任务</button><div class="finished-list-wrapper"></div></div></div>',
        aside: '<div class="detail-wrapper"><div class="item-group detail-item"><input type="checkbox" class="pull-left" value=""><span class="item-text detail-item-text"></span><span class="list-item-star glyphicon glyphicon-star-empty pull-right"></span></div><div class="container-fluid"><div class="row"><div class="form-group"><div class="input-group date" id="datetimepicker"><input type="text" class="form-control" placeholder="请选择到期日"/><span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span></span></div></div><script type="text/javascript">$(function () {$("#datetimepicker").datetimepicker();}); </script></div></div><textarea name="test" rows="10" cols="40" placeholder="备注" style="width: 100%; resize: none;"></textarea><div class="detail-footer"><span class="detail-operate-hide pull-left glyphicon glyphicon-expand"></span><div class="item-text detail-footer-text"></div><span class="detail-operate-delete pull-right glyphicon glyphicon-trash"></span></div></div>',
        item: '<div class="item-group list-item"><input type="checkbox" class="pull-left" value=""><span class="item-text list-item-text"></span><span class="list-item-star glyphicon glyphicon-star-empty pull-right"></span></div>'
    };

    /**
     * Description：ListView构造函数
     *
     * @param {Object} element - DOM元素
     * @param {Object} options - 包含设置和数据的对象
     * @returns {Object}
     * @constructor
     */
    var List = function (element, options) {
        this.$element = $(element);

        this.init(options);

        return {};
    };

    /**
     * Description: 初始化
     * @param {Object} options - 初始化设置信息和数据
     */
    List.prototype.init = function (options) {

        // todo  是否需要destory 和 initialed的状态标识

        this.items = [];

        this.options = $.extend(true, {}, _default.options, options);
        $.extend(true, this.items, options.data);

        this.subcribeEvents();
        this.setInitialStates();
        this.render();
    };

    /**
     * Description: 取消绑定事件
     *
     */
    List.prototype.unsubcribeEvents = function () {
        this.$element.off('click');
        this.$element.off('keyup');
    };

    /**
     * Description： 绑定事件
     */
    List.prototype.subcribeEvents = function () {
        this.unsubcribeEvents();

        this.$element.on('click', $.proxy(this.clickHandler, this));
        this.$element.on('keyup', $.proxy(this.keyupHandler, this));
    };

    List.prototype.setInitialStates = function () {
        this.state = {
            showAside: false,
            showFinished: false,
            selectedItemData: null
        };

        // todo  这里需要提供按照 star 和 日期 排序的方法
        var _this = this;
        $.each(this.items, function (index, item) {
            if (!item.hasOwnProperty("isStar")) {
                item.isStar = false;
            }

            if (!item.hasOwnProperty("isFinish")) {
                item.isFinish = false;
            }
        });
    };

    /**
     * Description： 清空并调用 buildList
     *
     */
    List.prototype.render = function () {

        if (!this.initialized) {
            this.$element.addClass(pluginName);

            this.initialized = true;
        }

        this.$element.empty();


        this.buildList();
    };

    /**
     * Description： 创建list
     *
     */
    List.prototype.buildList = function () {
        this.$list = $(_default.template.list);
        this.$aside = $(_default.template.aside).hide();
        this.$element.append(this.$list).append(this.$aside);
        this.$todoWrapper = this.$list.find(".todo-list-wrapper");
        this.$finishWrapper = this.$list.find(".finished-list-wrapper").toggle(this.state.showFinished);

        var _this = this; // 这个容易疏忽掉
        $.each(this.items, function (index, item) {
            var $item = $(_default.template.item);

            item.dataItemId = index;
            $item.attr("data-itemid", index);

            $item.find(".list-item-text").text(item.text);
            if (item.isStar) {
                $item.find(".list-item-star").addClass("list-item-stared");
            }

            if (item.isFinish) {
                $item.addClass("list-item-finished").find(':checkbox').attr("checked", "checked");
                _this.$finishWrapper.append($item);
            }
            else {
                _this.$todoWrapper.append($item);
            }
        });

        if (this.state.showAside) {
            // 设置文字
            this.$aside.find(".detail-item-text").text(this.state.selectedItemData.text);
            this.$aside.find(".detail-item").attr("data-itemid", this.state.selectedItemData.dataItemId);
            if (this.state.selectedItemData.isFinish) {
                this.$aside.find(".detail-item").addClass("list-item-finished").find(':checkbox').attr("checked", "checked");
            }

            this.$aside.find(".detail-footer-text").text("创建于 "+ moment(new Date(this.state.selectedItemData.createdDate)).format("YYYY/MM/DD"));

            if (this.state.selectedItemData.isStar) {
                this.$aside.find(".list-item-star").addClass("list-item-stared");
            }
            // 改变宽度
            this.$list.css("padding-right", "310px");
            // 显示侧边
            this.$aside.show();
        }

        if (this.state.selectedItemData) {
            $('.list-wrapper div[data-itemid=' + this.state.selectedItemData.dataItemId +']').closest("div.list-item").css("background-color", "#DCF1FE");
        }
    };

    /**
     * Description： 处理点击事件
     * @param event
     *
     * todo 是不是可以把showAside放到一个函数里面处理
     */
    List.prototype.clickHandler = function (event) {
        var $target = $(event.target);

        // 后面不用string.indexof的原因就是防止 "list-item-text" 和 "list-item" 混淆的问题
        var classList = $target.attr('class') ? $target.attr('class').split(" ") : [];
        //var itemDataOjb = this.findItem($target.closest(".item-group").attr("data-itemid"));
        var itemDataOjb = this.items[parseInt($target.closest(".item-group").attr("data-itemid"))];

        // 不需要重新渲染的情况（如点击输入框、adside的非操作按钮）
        if (classList.indexOf("add-list-item") !== -1 ||
            $target.closest(".date").attr("id") === "datetimepicker" ||
            $target.get(0).tagName === "TEXTAREA" ||
            classList.indexOf("detail-item-text") !== -1 ||
            classList.indexOf("detail-footer-text") !== -1) {
            return true;
        }

        // 选中一项任务
        if (classList.indexOf("list-item-text") !== -1) {
            // 在同一个元素上多次点击，切换aside显示状态
            if (this.state.selectedItemData && this.state.selectedItemData.dataItemId == itemDataOjb.dataItemId) {
                this.state.showAside = !this.state.showAside;
            }
            else {
                this.state.showAside = true;
                this.state.selectedItemData = itemDataOjb;
            }
        }
        else if ($target.attr("type") !== "checkbox" &&
            classList.indexOf("list-item-star") === -1 &&
            classList.indexOf("detail-footer-text") === -1 &&
            classList.indexOf("detail-operate-delete") === -1 &&
            classList.indexOf("toggle-finished-list") === -1) {
            // 不是以上的type或class的时候，取消选中item
            this.state.selectedItemData = null;
            this.state.showAside = false;
        }

        // 基于选中项的删除操作
        if (classList.indexOf("detail-operate-delete") !== -1 && this.state.selectedItemData) {
            if (typeof this.options.onDeleteItem === 'function') {
                this.options.onDeleteItem($.extend(true, {}, this.state.selectedItemData));
                this.deleteItem();
            }
        }

        // 星标操作
        if (classList.indexOf("list-item-star") !== -1) {
            itemDataOjb.isStar = !itemDataOjb.isStar;
            this.options.onStar(itemDataOjb);
        }

        // 完成操作
        if ($target.attr("type") === "checkbox") {
            itemDataOjb.isFinish = !itemDataOjb.isFinish;
            this.options.onFinish(itemDataOjb)
        }

        // 隐藏/显示 按钮
        if (classList.indexOf("toggle-finished-list") !== -1) {
            this.state.showFinished = !this.state.showFinished;
            this.$finishWrapper.toggle(this.state.showFinished);
            this.$list.find(".toggle-finished-list").text(this.state.showFinished ? "隐藏已完成任务" : "显示已完成任务");
            return true;
        }

        this.render();
    };

    /**
     * Description： 删除一项任务
     */
    List.prototype.deleteItem = function () {
        this.items.splice(this.state.selectedItemData.dataItemId, 1);
        this.state.selectedItemData = null;
        this.state.showAside = false;
    };

    /**
     * Description: 根据属性名称设置状态
     * @param {String} attr - 属性名称
     */
    List.prototype.setAllItemStateByAttrName = function (attr) {
        var items = this.items;

        items.forEach(function (element) {
            element[attr] = false;
        });
    };

    /**
     * Description: 寻找id节点的数据
     * @param {String|Number} id
     * @returns {Object}
     */
    List.prototype.findItem = function (id) {
        for (var i = 0, length = this.items.length; i < length; i++) {
            if (this.items[i].dataItemId == id) {
                return this.items[i];
            }
        }
    };

    /**
     * Description：按键抬起事件处理
     * @param event
     */
    List.prototype.keyupHandler = function (event) {
        // Enter抬起，添加item的处理
        if (event.keyCode == 13) {
            if (event.target.className.indexOf("add-list-item") !== -1) {
                if (typeof this.options.onAddItem === "function") {
                    var itemData = this.generateAddData();
                    this.options.onAddItem(itemData);
                    this.items.push(itemData);
                    this.render();
                }
            }
        }
    };

    // todo 之前的排序算法也要弄出来
    List.prototype.generateAddData = function() {
        var data = {};
        data.text = $(".add-list-item").val();
        data.createdDate = new Date().toString();
        data.deadlineDate = $("#datetimepicker").val();
        data.detail = "";
        data.isFinish = false;
        data.isStar = false;

        return data;
    };

    /**
     * Description: 增加item事件处理程序
     *
     * @param {Object} item - 要添加的数据
     */
    List.prototype.addItem = function (item) {
        if (item) {
            this.items.push(item);
            this.render();
        }
    };

    $.fn[pluginName] = function (options) {
        var result;

        this.each(function () {
            var _this = $.data(this, pluginName);

            // if 中放判断条件
            if (false) {
                // todo 可以放一些功能函数
            }
            else {
                $.data(this, pluginName, new List(this, $.extend(true, {}, options)));
            }
        });

        return result || this;
    }
})(jQuery, window, document);