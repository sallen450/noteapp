/**
 * Created by qinghua on 15/6/21.
 */

$(function () {
    /**
     * Description: jQuery custom toggleClick
     *
     * @param {function} arguments
     */
    $.fn.toggleClick = function () {
        var functions = arguments;
        return this.each(function () {
            var iteration = 0;
            $(this).click(function () {
                functions[iteration].apply(this, arguments);
                iteration = (iteration + 1) % functions.length
            })
        })
    };

    var $categoryList = $('#category-list');
    var $taskList = $('#task-list');

    $.getJSON('/api/initTreeView', function (data) {
        $categoryList.treeview({
            color: "#428bca",
            expandIcon: 'glyphicon glyphicon-triangle-bottom',
            collapseIcon: 'glyphicon glyphicon-triangle-right',
            nodeIcon: "glyphicon glyphicon-folder-close",
            showTags: true,
            data: generateTreeData(data),

            onNodeSelected: categoryItemSelectHandler,
            onNodeDelete: categoryItemDeleteHandler
        });

    });

    /**
     * Description： 根据父节点ID获取TreeViewData父节点数据对象
     * @param array
     * @param parentCategoryId
     * @returns {undefined}
     */
    function getParentNode(array, parentCategoryId) {
        var ret = undefined;

        for (var i = 0; i < array.length; i++) {
            if (array[i].id === parentCategoryId) {
                if (!array[i].nodes) {
                    array[i].nodes = [];
                }
                ret = array[i].nodes;

                break;
            }
            else if (array[i].nodes) {
                ret = getParentNode(array[i].nodes, parentCategoryId);
            }
        }

        return ret;
    }

    /**
     * Description； 根据获取的数据，生成tree结构的数据
     * @param data
     * @returns {Array}
     */
    function generateTreeData(data) {
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }

        var treeViewDefaultData = [];

        data.forEach(function (element) {
            var item = {
                id: element._id,
                level: element.level,
                parentCategoryId: element.parentCategoryId,
                subIds: element.subCategoryIds,
                text: element.categoryName,
                tags: [element.unfinishCount.toString()]
            };
            if (element.subCategoryIds.length > 0) item.nodes = [];

            if (element.parentCategoryId === null) {
                treeViewDefaultData.push(item);
            }
            else {
                getParentNode(treeViewDefaultData, element.parentCategoryId).push(item);
            }
        });

        return treeViewDefaultData;
    }



    /**
     * Descriptions: 生成list的data
     *
     */
    function generateListData(data) {
        if ($.isArray(data)) {
            data.forEach(function (elememt) {
                elememt.text = elememt.taskName;
            })
        }

        return data;
    }

    /**
     * Description: 删除分类项目
     * @param event
     * @param itemData
     * @param deleteIds
     */
    function categoryItemDeleteHandler (event, itemData, deleteIds) {
        var data = {
            parentCategoryId: itemData.parentCategoryId,
            ids: deleteIds
        };

        $.post('/api/deleteCategory', data, function (rData) {
            if (rData.err) {
                window.location.reload();
                return;
            }

            $.getJSON('/api/initTreeView', function (data) {
                $categoryList.treeview({
                    color: "#428bca",
                    expandIcon: 'glyphicon glyphicon-triangle-bottom',
                    collapseIcon: 'glyphicon glyphicon-triangle-right',
                    nodeIcon: "glyphicon glyphicon-folder-close",
                    showTags: true,
                    data: generateTreeData(data),

                    onNodeSelected: categoryItemSelectHandler,
                    onNodeDelete: categoryItemDeleteHandler
                });
            });
        });
    }

    function taskAddHandler(itemData) {
        itemData.taskName = itemData.text;
        itemData.categoryId = $categoryList.treeview("getSelectedNodeData").id;

        $.post("/api/addtask", {
            taskName: itemData.text,
            categoryId: itemData.categoryId,
            createdDate: itemData.createdDate,
            deadlineDate: itemData.deadlineDate
        }, function (rData) {
            if (rData.err) {
                showFailMessage();
            }
        })
    }

    function taskDeleteHandler(itemData) {
        $.post("/api/deletetask", {taskId: itemData._id, categoryId: itemData.categoryId, isFinish: itemData.isFinish}, function (rData) {
            if (rData.err) {
                showFailMessage();
            }
        })
    }

    function taskStarHandler(itemData) {
        $.post("/api/startask", {id: itemData._id, isStar: itemData.isStar}, function (rData) {
            if (rData.err) {
                showFailMessage();
            }
        });
    }

    function taskFinishHandler(itemData) {
        $.post("/api/finishtask", {id: itemData._id, isFinish: itemData.isFinish, categoryId: itemData.categoryId}, function (rData) {
            if (rData.err) {
                showFailMessage();
            }


            $.getJSON('/api/initTreeView', function (data) {
                $categoryList.treeview({
                    color: "#428bca",
                    expandIcon: 'glyphicon glyphicon-triangle-bottom',
                    collapseIcon: 'glyphicon glyphicon-triangle-right',
                    nodeIcon: "glyphicon glyphicon-folder-close",
                    showTags: true,
                    data: generateTreeData(data),

                    onNodeSelected: categoryItemSelectHandler,
                    onNodeDelete: categoryItemDeleteHandler
                });
            });
        });
    }

    function taskDeadlineHandler(itemData) {
        $.post("/api/taskdeadline", {id: itemData._id, deadlineDate: itemData.deadlineDate}, function (rData) {
            if (rData.err) {
                showFailMessage();
            }

        })
    }


    /**
     * Description: click category item event handler, to create and display task list
     *
     * @param event
     * @param itemData
     */
    function categoryItemSelectHandler(event, itemData) {
        $.getJSON("/api/gettask/" + itemData.id, function (data) {
            if (data.err) {
                showFailMessage();
                return;
            }

            $taskList.listview({
                onAddItem: taskAddHandler,
                onDeleteItem: taskDeleteHandler,
                onStar: taskStarHandler,
                onFinish: taskFinishHandler,
                onDeadLineChange: taskDeadlineHandler,
                data: generateListData(data)
            });
        })
    }

    $(".category-head").on('click', function (event) {
        $categoryList.treeview("clearSelect");
    });


    /**
     * Description: add category event handle
     */
    $("#save-added-category").on('click', function (event) {
        var selectedCategory = $categoryList.treeview("getSelectedNodeData");
        var data;
        if (!selectedCategory) {
            data = {
                categoryName: $('#add-category-name').val(),
                parentCategoryId: selectedCategory.id,
                parentLevel: selectedCategory.level
            };
        }
        else {
            data = {
                categoryName: $('#add-category-name').val(),
                parentCategoryId: null,
                parentLevel: -1
            };
        }

        $.post('/api/addcategory', data, function (rData) {
            if (rData.err) {
                window.location.reload();
                return;
            }

            $.getJSON('/api/initTreeView', function (data) {
                $categoryList.html("");
                $categoryList.treeview({
                    color: "#428bca",
                    expandIcon: 'glyphicon glyphicon-triangle-bottom',
                    collapseIcon: 'glyphicon glyphicon-triangle-right',
                    nodeIcon: "glyphicon glyphicon-folder-close",
                    showTags: true,
                    data: generateTreeData(data),

                    onNodeSelected: categoryItemSelectHandler,
                    onNodeDelete: categoryItemDeleteHandler
                });
            });

            $('#add-category-dialog').modal('hide');
        })
    });


    /**
     * Description: clear modal dialog input's value before shown
     *
     */
    $('#add-category-dialog').on('show.bs.modal', function (event) {
        $('#add-category-name').val("");
    });


    function showFailMessage(msg) {
        msg = msg || "连接服务器失败！";
        $("#fail-alert").text(msg).slideDown("fast").delay(2000).slideUp("fast");
    }

});

