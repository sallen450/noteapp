/**
 * Created by jiqinghua on 15/7/2.
 */

// todo 需要sql入参  和  query之后的结果 的合理性进行判断处理
var mysql = require('mysql');

var connection = null;
var connect_options = {
    host: "127.0.0.1",
    port: "6666",
    user: "root",
    password: "qinghua",
    database: "GTD"
};

function connectMysql(req, res, next) {
    connection = mysql.createConnection(connect_options);
    connection.connect(function (err) {
        if (err) {
            next("error connecting mysql : " + err.stack);
        }

        console.log("connect id " + connection.threadId);
        next();
    });
}

function getTreeViewInitData(req, res, next) {
    function findParentNode(array, parentNodeName) {
        var ret = undefined;

        for (var i = 0; i < array.length; i++) {
            if (array[i].text === parentNodeName) {
                if (!array[i].nodes) {
                    array[i].nodes = [];
                }
                ret = array[i].nodes;

                break;
            }
            else if (array[i].nodes) {
                ret = findParentNode(array[i].nodes, parentNodeName);
            }
        }

        return ret;
    }

    // todo 这里可以将同一个parent的nodes数组缓存起来
    var sql = "select * from category order by level asc";
    var treeViewDefaultData = [];

    connection.query(sql, function (err, rows, fields) {
        rows.forEach(function (element, index) {
            var item = {
                id: element.id,
                subIds: element.subCategory,
                text: element.categoryName,
                tags: [element.unfinishCount.toString()]
            };
            if (element.subCategory) item.nodes = [];

            if (element.parentCategory === '') {
                treeViewDefaultData.push(item);
            }
            else {
                findParentNode(treeViewDefaultData, element.parentCategory).push(item);
            }
        });

        res.json(treeViewDefaultData);

    });

    connection.end();
}

function getTaskByCategoryName(req, res, next) {
    var sql = 'select * from task where categoryName = ? order by date desc';

    connection.query(sql, [req.params.name], function (err, rows, fields) {
        res.json(rows);
    });

    connection.end();
}

function getTaskByTaskId(req, res, next) {
    var sql = 'select * from task where id = ?';
    var values = [req.params.id];
    connection.query(sql, values, function (err, rows, fields) {
        res.json(rows);
    });


    connection.end();
}

function addTask(req, res, next) {
    var fields = ['taskName', 'categoryName', 'date', 'isFinish', 'detail'];
    var values = [];
    for (key in req.body) {
        values.push(req.body[key]);
    }

    var sql = 'insert into task(??) values(?)';
    connection.query(sql, [fields, values], function (err, rows, fields) {
        var retData = {
            isAdded: false
        };

        if (err) {
            res.json(retData);
            return;
        }

        if (rows.affectedRows > 0) {
            retData.isAdded = true;
        }

        res.json(retData);
    });

    connection.end();
}

function modifyTask(req, res, next) {
    var data = req.body;
    var sql = 'update task set categoryName="' + data.categoryName + '",date="' + data.date + '",detail="' + data.detail + '" where id=' + data.id;

    connection.query(sql, function (err, rows, fields) {
        var retData = {
            isModified: false
        };

        if (err) {
            res.json(retData);
            return;
        }

        if (rows.affectedRows > 0) {
            retData.isModified = true;
        }

        res.json(retData);
    });

    connection.end();
}

function addCategory(req, res, next) {
    var sql = 'select subCategory,level from category where categoryName="' + req.body.parentCategory + '"';

    var subCategory = "";
    var level;
    connection.query(sql, function (err, rows, fields) {
        // todo 这里要加上错误处理
        // todo 这里要考虑 level0 的分类添加
        if (rows[0].subCategory === "") {
            subCategory = [req.body.categoryName].toString();
        }
        else {
            subCategory = JSON.stringify(JSON.parse(rows[0].subCategory).push(req.body.categoryName));
        }
        level = parseInt(rows[0].level) + 1;

        // 这个sql 应该放到第三个位置执行
        sql = 'update category set subCategory="' + subCategory + '" where categoryName="' + req.body.parentCategory + '"';
        connection.query(sql, function (err, rows, fields) {
            if (!err) {
                var insertFields = ['categoryName', 'level', 'allCount', 'unfinishCount', 'subCategory', 'parentCategory'];
                var insertValues = [req.body.categoryName, level, 0, 0, "", req.body.parentCategory];
                sql = 'insert into category(??) values(?)';

                connection.query(sql, [insertFields, insertValues], function (err, rows, fields) {
                    if (!err) {
                        res.json({isAdded: true});
                    }
                });

                connection.end();
            }
        });
    });
}

function finishTask(req, res, next) {
    var sql = 'update task set isFinish="1" where id="' + req.body.id + '"';

    connection.query(sql, function (err, rows, fields) {
        if (err) {
            res.json({done: false});
            return;
        }

        if (rows.affectedRows > 0) {
            res.json({done: true});
        }
        else {
            res.json({done: false});
        }
    });

    connection.end();
}

function deleteCategory(req, res, next) {
    var sql = 'delete from category where id=?';

    // todo 还要删除分类下的任务，  删除子分类，  删除在父分类中的subCategories
    connection.query(sql, [req.body.id], function (err, rows, fields) {
        if (err) {
            res.json({done: false});
            return;
        }

        if (rows.affectedRows > 0) {
            res.json({done: true});
        }
        else {
            res.json({done: false});
        }
    });

    connection.end();
}

function errorHandle(err, req, res, next) {
    res.json({err: true, errMsg: err.message});
}

exports.getTreeViewInitData = getTreeViewInitData;
exports.getTaskByCategoryName = getTaskByCategoryName;
exports.getTaskByTaskId = getTaskByTaskId;
exports.deleteCategory = deleteCategory;
exports.addTask = addTask;
exports.modifyTask = modifyTask;
exports.addCategory = addCategory;
exports.finishTask = finishTask;
exports.connectMysql = connectMysql;
exports.errorHandle = errorHandle;