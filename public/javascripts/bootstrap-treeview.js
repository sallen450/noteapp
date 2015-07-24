/**
 * Created by jiqinghua on 15/7/3.
 */

;(function ($, window, document, undefined) {
    var pluginName = 'treeview';

    var _default = {};
    _default.options = {
        expandIcon: 'glyphicon glyphicon-triangle-bottom',
        collapseIcon: 'glyphicon glyphicon-triangle-right',
        emptyIcon: 'glyphicon',
        nodeIcon: '',   //'glyphicon glyphicon-folder-close',
        operaIcon: 'glyphicon glyphicon-align-justify',

        selectedColor: '#FFFFFF',
        selectedBackColor: '#428bca',

        showExpandIcon: true,
        showNodeIcon: true,
        showBadge: true,

        useOperation: true,
        // , {text: '重命名', className: "operation-rename"}
        operationData: [{text: '删除', className: "operation-delete"}],
        data: [],

        // event handler
        onNodeSelected: undefined,
        // 接口入参（itemData, ids - 要删除的所有节点的_id）
        onNodeDelete: undefined
    };

    _default.template = {
        list: '<ul class="list-group"></ul>',
        item: '<li class="list-group-item"></li>',
        name: '<span class="node-name"></span>',
        indent: '<span class="indent"></span>',
        badge: '<span class="badge"></span>',
        operaIcon: '<span class="opera-icon dropdown-toggle" id="node-opera-menu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></span>',
        operaWrapper: '<span class="opera-wrapper dropdown pull-right"></span>',
        operaList: '<ul class="dropdown-menu dropdown-menu-right" aria-labelledby="node-opera-menu"></ul>',
        operaItem: '<li><a href="#"></a></li>',
        icon: '<span class="icon"></span>'
    };

    var Tree = function (element, options) {
        this.$element = $(element);

        this.init(options);

        return {
            getSelectedNodeData: $.proxy(this.getSelectedNodeData, this),
            clearSelect: $.proxy(this.clearSelect, this),
            updateSelectedNodeBadge: $.proxy(this.updateSelectedNodeBadge, this)
        };
    };

    Tree.prototype.init = function (options) {
        this.tree = [];
        this.nodes = [];

        // 将TreeView Data数据绑定到指定的Dom对象上
        if (options.data) {
            if (typeof options.data === 'string') {
                options.data = JSON.parse(options.data);
            }

            this.tree = $.extend(true, [], options.data);
            delete options.data;
        }

        this.options = $.extend({}, _default.options, options);

        this.$element.addClass(pluginName);

        this.subcribeEvents();
        this.setInitialStates({nodes: this.tree});
        this.render();
    };

    /**
     * Description： 如果不取消事件，可能造成$element上绑定了n次同一个事件
     */
    Tree.prototype.unsubscribeEvents = function() {
        this.$element.off('click');
        this.$element.off('nodeSelected');
        this.$element.off('deleteNode');
    };

    /**
     * Description: 绑定事件
     */
    Tree.prototype.subcribeEvents = function () {
        this.unsubscribeEvents();
        this.$element.on('click', $.proxy(this.clickHandler, this));

        if (typeof this.options.onNodeSelected === 'function') {
            this.$element.on('nodeSelected', $.proxy(this.options.onNodeSelected, this));
        }

        if (typeof this.options.onNodeDelete === 'function') {
            this.$element.on('deleteNode', $.proxy(this.options.onNodeDelete, this));
        }
    };

    /**
     * Description: 处理数据，设置一些状态（展开、选中等）
     *
     * @param {Object} node - one treeview data item
     */
    Tree.prototype.setInitialStates = function (node) {
        // 校验第一次传入的数据
        if (!node.nodes) return;

        var parent = node;
        var _this = this;

        $.each(node.nodes, function (index, node) {

            node.nodeId = _this.nodes.length;

            node.parentId = parent.nodeId;

            // if not define, set to empty object
            node.state = node.state || {};


            // 注释这种写法会出现问题，设置为false的会被改成默认的true
            // node.state.selected = node.state.selected || true;
            if (!node.state.hasOwnProperty('selected')) {
                node.state.selected = false;
            }

            if (!node.state.hasOwnProperty('expanded')) {
                node.state.expanded = false;
            }

            if (!node.state.hasOwnProperty('disabled')) {
                node.state.disabled = false;
            }

            _this.nodes.push(node);

            if (node.nodes) {
                _this.setInitialStates(node);
            }
        });
    };

    /**
     * Description: 生成Treeview的HTML代码。
     *
     * @param {Number} level - 用来生成缩进的个数
     * @param {Array} node - 从服务器获取的treeview数据数组
     */
    Tree.prototype.buildTree = function (node, level) {
        var _this = this;
        $.each(node, function (index, node) {
            var treeItem = $(_default.template.item)
                .addClass(node.state.selected ? "node-selected" : "")
                .attr('data-nodeid', node.nodeId)
                .attr("data-nodelevel", node.level);

            // 缩进代码
            for (var i = 0; i < level; i++) {
                treeItem.append($(_default.template.indent));
            }

            // 折叠图标代码
            var classList = [];
            if (node.nodes) {
                classList.push('expand-icon');
                if (node.state.expanded) {
                    classList.push(_this.options.expandIcon);
                }
                else {
                    classList.push(_this.options.collapseIcon);
                }
            }
            else {
                classList.push(_this.options.emptyIcon);
            }
            treeItem.append($(_default.template.icon).addClass(classList.join(" ")));

            // 图标代码
            if (_this.options.showNodeIcon) {
                var classList = ['node-icon'];

                classList.push(_this.options.nodeIcon);

                treeItem.append($(_default.template.icon).addClass(classList.join(" ")))
            }

            // 分类名称代码
            treeItem.append($(_default.template.name).text(node.text));

            // 操作icon代码
            if (_this.options.useOperation && _this.options.operationData && node.state.selected) {
                treeItem.append(_this.buildOperation());
            }

            // 标签代码
            if (_this.options.showBadge && node.tags) {
                $.each(node.tags, function (index, tag) {
                    treeItem.append($(_default.template.badge).text(tag));
                });
            }

            _this.$wrapper.append(treeItem);

            if (node.nodes && node.state.expanded) {
                _this.buildTree(node.nodes, level + 1)
            }
        });
    };

    /**
     * Description: 渲染插件
     */
    Tree.prototype.render = function () {

        this.$wrapper = $(_default.template.list);
        this.$element.empty().append(this.$wrapper);
        this.buildTree(this.tree, 0);
    };

    /**
     * Description: 创建 item 操作的按钮
     */
    Tree.prototype.buildOperation = function () {
        var $wrapper = $(_default.template.operaWrapper);
        var $operaIcon = $(_default.template.operaIcon).addClass(this.options.operaIcon);
        var $operaList = $(_default.template.operaList);

        $wrapper.append($operaIcon).append($operaList);

        var _this = this;
        this.options.operationData.forEach(function (element, index) {
            var $operaListItem = $(_default.template.operaItem);
            $operaListItem.children().text(element.text).addClass(element.className);

            $operaList.append($operaListItem);
        });

        return $wrapper;
    };

    /**
     * Description: 清除所有选中项目
     *
     */
    Tree.prototype.clearAllSelected = function () {
        var nodes = this.nodes;
        for (var i = 0, length = nodes.length; i < length; i++) {
            nodes[i].state.selected = false;
        }
    };

    /**
     * Description: 列表点击事件
     * @param event
     */
    Tree.prototype.clickHandler = function (event) {
        var $target = $(event.target);
        var nodeId = $target.closest('li.list-group-item').attr('data-nodeid');
        var classList = $target.attr('class') ? $target.attr('class').split(" ") : [];

        var node = this.getNode(nodeId);
        if (node) {
            if (classList.indexOf('expand-icon') !== -1) {
                node.state.expanded = !node.state.expanded;

                this.render();
            }
            else if (classList.indexOf("operation-delete") !== -1) {
                this.deleteNode(nodeId);
            }
            else if (classList.indexOf('opera-icon') !== -1) {
                return true;
            }
            else {
                if (!node.state.selected) {
                    this.clearAllSelected();
                    node.state.selected = true;
                    if (this.options.onNodeSelected) {
                        this.$element.trigger("nodeSelected", $.extend(true, {}, node));
                    }

                    this.render();
                }
            }
        }
    };

    /**
     * Description: 根据点击对象的的nodeid属性获取节点数据
     *
     * @param {Number|String} nodeId - 在this.nodes数组中的索引
     * @return {Object|undefined}
     */
    Tree.prototype.getNode = function (nodeId) {
        var node = this.nodes[nodeId];

        if (!node) {
            console.log('Error: node does not exist');
        }
        return node;
    };

    /**
     * 获取要删除的id数组
     * @param deleteNode
     * @returns {Array}
     */
    function getDeletedIds(deleteNode) {
        var ids = [deleteNode.id];

        if (deleteNode.nodes && deleteNode.nodes.length > 0) {
            deleteNode.nodes.forEach(function (element) {
                ids = ids.concat(getDeletedIds(element));
            })
        }

        return ids;
    }

    /**
     * Description: 删除一个node的数据（tree 和 nodes中）
     * @param nodeId
     */
    Tree.prototype.deleteNode = function (nodeId) {
        // 先触发事件，防止this.nodes删除节点，无法获得被删除的节点
        this.$element.trigger("deleteNode", [$.extend(true, {}, this.nodes[nodeId]), $.extend(true, [], getDeletedIds(this.nodes[nodeId]))]);

        var id = this.nodes[nodeId].id;
        this.deleteNodeOfTree(id, {nodes: this.tree});

        this.nodes = [];
        this.setInitialStates({nodes: this.tree});
    };

    /**
     * Description： 从this.tree中删除节点
     * @param id
     * @param node
     */
    Tree.prototype.deleteNodeOfTree = function (id, node) {
        if (!node.nodes) {
            return;
        }

        var _this = this;
        node.nodes.forEach(function (element, index) {
            if (element.id == id) {
                node.nodes.splice(index, 1);

                if (node.nodes.length === 0) {
                    node.nodes = undefined;
                }
            }
            else {
                _this.deleteNodeOfTree(id, element);
            }
        });
    };

    /**
     * Description： 获取选中的节点的数据，返回一个新的对象
     */
    Tree.prototype.getSelectedNodeData = function () {
        for (var i = 0, length = this.nodes.length; i < length; i++) {
            if (this.nodes[i].state.selected) {
                return $.extend(true, {}, this.nodes[i]);
            }
        }

        return null;
    };

    /**
     * Description: 返回选中的节点数据，可以通过修改数据更新view； 或者返回null
     * @returns {Object}
     */
    Tree.prototype.getSelectedNode = function() {
        for (var i = 0, length = this.nodes.length; i < length; i++) {
            if (this.nodes[i].state.selected) {
                return this.nodes[i];
            }
        }

        return null;
    };

    /**
     * Description: 更新选中节点的未完成任务数量
     */
    Tree.prototype.updateSelectedNodeBadge = function () {
        var changeCount = arguments[0];
        var selectedNode = this.getSelectedNode();
        if (selectedNode) {
            selectedNode.tags[0] = Number(selectedNode.tags[0]) + changeCount;
        }

        this.render();
    };

    Tree.prototype.clearSelect = function () {
        this.clearAllSelected();
        this.render();
    };

    $.fn[pluginName] = function (options, args) {

        var result;
        this.each(function () {
            var _this = $.data(this, pluginName);

            if (typeof options === "string") {
                if (_this) {
                    if (!$.isArray(args)) {
                        args = [args];
                    }
                    result = _this[options].apply(_this, args);
                }
                else {
                    console.log("not init");
                }
            }
            else {
                $.data(this, pluginName, new Tree(this, $.extend(true, {}, options)));
            }
        });

        return result || this;
    };

})(jQuery, window, document);

