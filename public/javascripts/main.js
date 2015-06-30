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

    var selectedCategoryName = '';
    var selectedTaskIndex = '';
    var $categoryList = $('#category-list');
    var $taskList = $('#task-list');

    $.getJSON('/api/initTreeView', function (data) {
        $categoryList.treeview({
            color: "#428bca",
            expandIcon: 'glyphicon glyphicon-triangle-right',
            collapseIcon: 'glyphicon glyphicon-triangle-bottom',
            nodeIcon: "glyphicon glyphicon-folder-close",
            showTags: true,
            showDeletes: false,     // custom add
            data: data
        });

        $categoryList.on('click', clickCategorybubbleHandle)
    });

    $categoryList.height(document.documentElement.clientHeight - 240 + "px");
    $taskList.height(document.documentElement.clientHeight - 186 + "px");

    function onResizeScrollHeight(event) {
        $categoryList.height(document.documentElement.clientHeight - 240 + "px");
        $taskList.height(document.documentElement.clientHeight - 186 + "px");
    }

    $(window).on('resize', onResizeScrollHeight);

    /**
     * Description: click category item event handler, to create and display task list
     *
     * @param event
     */
    function clickCategorybubbleHandle(event) {
        var target = event.target;
        var categoryName = undefined;

        // get clicked category name
        if (target !== $categoryList) {
            selectedCategoryName = categoryName = $(target).contents().filter(function () {
                return this.nodeType === 3;
            }).text();
        }

        renderTaskList(categoryName);
    }

    /**
     * Description: Render tasklist when click category list, through GET request
     *
     * @param {string} categoryName
     */
    function renderTaskList(categoryName) {
        if (!categoryName) return;

        $.getJSON("/api/category/" + categoryName, function (data) {
            $taskList.text("");             // 获取json数据后在清除原有内容，否则会有明显闪动。
            data.forEach(function (element) {
                var date = moment(element.date).format("YYYY-MM-DD");
                var selector = "#task-list:contains('" + date + "')";
                var $listGroupParent = $("#task-list");
                var $list = $(selector);
                var $listGroup = undefined;

                if ($list.length) {
                    $listGroup = $("ul.list-group:contains('" + date + "')", $list);
                }
                else {
                    $listGroup = $('<ul class="list-group"><li href="#" class="list-group-item bg-primary">' + date + '</li></ul>');
                    $listGroupParent.append($listGroup);
                }

                $listGroup.append($('<a href="#" class="list-group-item" data-index=' + element.id + ' data-is-finish=' + element.isFinish + '>' + element.taskName + '</a>'));
            })
        });
    }

    /**
     * Description: add task item click event; display task detail
     *
     */
    $taskList.on("click", function (event) {
        var target = event.target;
        selectedTaskIndex = target.dataset.index;
        var taskName = target.innerHTML;
        if (target.nodeName === "A") {
            $.getJSON("/api/task/" + selectedTaskIndex, function (data) {
                var taskName = data[0].taskName;
                var date = moment(data[0].date).format("YYYY-MM-DD");
                var detail = data[0].detail;
                $("#r-task-name").text(taskName);
                $("#r-task-date").text(date);
                $("#r-task-detail").text(detail);
            });
        }
    });


    /**
     * Description: task list filter button event handle
     *
     */
    $("#task-filter").on('click', function (event) {
        var showType = event.target.dataset.type;

        if (!showType) {
            $("a", $taskList).show();
        }
        else {
            $("a[data-is-finish!=" + showType + "]", $taskList).hide();
            $("a[data-is-finish=" + showType + "]", $taskList).show();
        }

        var taskGroupArray = $taskList.children();
        for (var i = 0; i < taskGroupArray.length; i++) {
            $(taskGroupArray[i]).show();    // 父元素如果是hidden的，则所有子元素都是隐藏的，下面的就length判断就一直为0，所以要先显示父元素。

            if ($(taskGroupArray[i]).children(":visible").length > 1) {
                $(taskGroupArray[i]).show();
            }
            else {
                $(taskGroupArray[i]).hide();
            }
        }
    });


    /**
     * Description: add task event handle
     *
     */
    $("#save-added-task").on('click', function (event) {
        var data = {
            taskName: $('#add-task-name').val(),
            categoryName: selectedCategoryName,
            date: $('#add-task-date').val(),
            isFinish: 0,
            detail: $('#ad-task-detail').val()
        };

        $.post('/api/addtask', data, function (rData) {
            $('#add-task-dialog').modal('hide');
            if (rData.isAdded) {
                renderTaskList(selectedCategoryName);
            }
        })
    });

    /**
     * Description: add category event handle
     */
    $("#save-added-category").on('click', function (event) {
        var data = {
            categoryName: $('#add-category-name').val(),
            parentCategory: selectedCategoryName
        };

        $.post('/api/addcategory', data, function (rData) {
            if (rData.isAdded) {
                $.getJSON('/api/initTreeView', function (data) {
                    $categoryList.html("");
                    $categoryList.treeview({
                        color: "#428bca",
                        expandIcon: 'glyphicon glyphicon-triangle-right',
                        collapseIcon: 'glyphicon glyphicon-triangle-bottom',
                        nodeIcon: "glyphicon glyphicon-folder-close",
                        showTags: true,
                        showDeletes: false,     // custom add
                        data: data
                    });
                });
            }

            $('#add-category-dialog').modal('hide');
        })
    });

    /**
     * Description: modify task event handle
     *
     */
    $('#save-modified-task').on('click', function (event) {
        var data = {
            id: selectedTaskIndex,
            taskName: $('#modify-task-name').val(),
            categoryName: selectedCategoryName,
            date: $('#modify-task-date').val(),
            detail: $('#modify-task-detail').val()
        };

        $.post('/api/modifytask', data, function (rData) {
            if (rData.isModified) {
                $("#r-task-name").text($('#modify-task-name').val());
                $("#r-task-date").text($('#modify-task-date').val());
                $("#r-task-detail").text($('#modify-task-detail').val());
            }
            $('#modify-task-dialog').modal('hide');
            renderTaskList(selectedCategoryName);
        })
    });


    /**
     * Description: finish a task
     */

    $('#finish-task').on('click', function (event) {
        // todo 没有taskIndex的处理，
        // todo 如果当前选中的是未完成，点击完成一个任务，目前点击后会切换成所有任务

        $.post('/api/finishtask', {id: selectedTaskIndex}, function (rData) {
            if (rData.done) {
                renderTaskList(selectedCategoryName);
            }
        })
    });


    /**
     * Description: clear modal dialog input's value after hidden
     *
     */
    $('#modify-task-dialog').on('hidden.bs.modal', function (event) {
        $('#modify-task-name').val("");
        $('#modify-task-date').val("");
        $('#modify-task-detail').val("");
    }).on('show.bs.modal', function (event) {
        $('#modify-task-name').val($("#r-task-name").text());
        $('#modify-task-date').val($("#r-task-date").text());
        $('#modify-task-detail').val($("#r-task-detail").text());
    });

    /**
     * Description: clear modal dialog input's value before shown
     *
     */
    $('#add-task-dialog').on('show.bs.modal', function (event) {
        $('#add-task-name').val("");
        $('#add-task-date').val("");
        $('#add-task-detail').val("");
    });

    $('#add-category-dialog').on('show.bs.modal', function (event) {
        $('#add-category-name').val("");
    });
});

