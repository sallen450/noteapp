var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var connect_options = {
    host: "127.0.0.1",
    port: "6666",
    user: "root",
    password: "qinghua",
    database: "GTD"
};

// todo 数据库连接可以放在一个公共路由里面
// todo 需要sql入参  和  query之后的结果 的合理性进行判断处理
// todo 处理函数要单独定义到另一个js文件中

// Get bootstrap tree-view data from mysql
router.get('/api/initTreeView', function (req, res, next) {
    var connection = mysql.createConnection(connect_options);
    connection.connect(function (err) {
        if (err) {
            console.error("error connecting mysql : " + err.stack);
            return;
        }

        console.log("connect id " + connection.threadId);
    });

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
});

router.get('/api/category/:name', function (req, res, next) {
    var connection = mysql.createConnection(connect_options);
    connection.connect(function (err) {
        if (err) {
            console.error("error connecting mysql : " + err.stack);
            return;
        }

        console.log("connect id " + connection.threadId);
    });

    var sql = 'select * from task where categoryName = "' + req.params.name + '"  order by date desc';

    connection.query(sql, function (err, rows, fields) {
        res.json(rows);
    });

    connection.end();
});

router.get('/api/task/:id', function (req, res, next) {
    var connection = mysql.createConnection(connect_options);
    connection.connect(function (err) {
        if (err) {
            console.error("error connecting mysql : " + err.stack);
            return;
        }

        console.log("connect id " + connection.threadId);
    });

    var sql = 'select * from task where id = "' + req.params.id + '"';

    connection.query(sql, function (err, rows, fields) {
        res.json(rows);
    });

    connection.end();
});

router.post('/api/addtask', function (req, res, next) {
    var connection = mysql.createConnection(connect_options);
    connection.connect(function (err) {
        if (err) {
            console.error("error connecting mysql : " + err.stack);
            return;
        }

        console.log("connect id " + connection.threadId);
    });

    var values = '';
    console.log(req.body);
    for (key in req.body) {
        values += '"' + req.body[key] + '",';
    }

    var sql = 'insert into task(taskName,categoryName,date,isFinish,detail) values(' + values.slice(0, -1) + ')';
    connection.query(sql, function (err, rows, fields) {
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
});

router.post('/api/modifytask', function (req, res, next) {
    var connection = mysql.createConnection(connect_options);
    connection.connect(function (err) {
        if (err) {
            console.error("error connecting mysql : " + err.stack);
            return;
        }

        console.log("connect id " + connection.threadId);
    });

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
});

router.post('/api/addcategory', function (req, res, next) {
    var connection = mysql.createConnection(connect_options);
    connection.connect(function (err) {
        if (err) {
            console.error("error connecting mysql : " + err.stack);
            return;
        }

        console.log("connect id " + connection.threadId);
    });

    var sql = 'select subCategory,level from category where categoryName="' + req.body.parentCategory + '"';

    var subCategory = "";
    var level;
    connection.query(sql, function (err, rows, fields) {
        // todo 这里要加上错误处理
        // todo 这里要考虑 level0 的分类添加
        if (rows[0].subCategory === "") {
            subCategory = req.body.categoryName;
        }
        else {
            subCategory = rows[0].subCategory + ',' + req.body.categoryName;
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


});

router.post('/api/finishtask', function (req, res, next) {
    var connection = mysql.createConnection(connect_options);
    connection.connect(function (err) {
        if (err) {
            console.error("error connecting mysql : " + err.stack);
            return;
        }

        console.log("connect id " + connection.threadId);
    });

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
});

router.get('/', function (req, res, next) {
    res.render("index");
});

module.exports = router;
