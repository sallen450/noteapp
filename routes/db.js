var mongoose = require("mongoose");

mongoose.connect("mongodb://localhost/note");

var categorySchema = {
    categoryName: String,
    level: Number,
    parentCategoryId: mongoose.Schema.Types.ObjectId,
    allCount: Number,
    unfinishCount: Number,
    subCategoryIds: [mongoose.Schema.Types.ObjectId]
};

var taskSchema = {
    taskName: String,
    categoryId: mongoose.Schema.Types.ObjectId,
    createdDate: Date,
    deadlineDate: Date,
    isFinish: Boolean,
    isStar: Boolean,
    detail: String
};

function generateCategoryDocument(categoryName, parentLevel, parentCaregoryId) {
    var parentId = null;
    var level = Number(parentLevel) + 1;

    if (parentCaregoryId) {
        parentId = new mongoose.Types.ObjectId(parentCaregoryId);
    }

    return {
        categoryName: categoryName,
        level: level,
        parentCategoryId: parentId,
        allCount: 0,
        unfinishCount: 0,
        subCategoryIds: []
    }
}

function generateTaskDocument(taskName, categoryId, createdDate, deadlineDate) {
    var deadline = null;
    if (!isNaN(Date.parse(deadlineDate))) {
        deadline = new Date(deadlineDate);
    }

    return {
        taskName: taskName,
        categoryId: new mongoose.Types.ObjectId(categoryId),
        createdDate: new Date(createdDate),
        deadlineDate: deadline,
        isFinish: false,
        isStar: false,
        detail: ""
    }
}

var cschema = new mongoose.Schema(categorySchema, { strict: false });
var tschema = new mongoose.Schema(taskSchema);

var Category = mongoose.model('Category', cschema);
var Task = mongoose.model('Task', tschema);

/**
 * Description: 从数据库获取所有category数据
 * @param req
 * @param res
 * @param next
 */
function getTreeViewInitData(req, res, next) {
    Category.find({$query: {}, $orderby: {level: 1}}, function (err, result) {
        if (err) {
            next(err);
        }

        res.json(result);
    });
}

/**
 * Description: 获取分类ID下的所有任务
 * @param req - req.params中传入分类的id
 * @param res
 * @param next
 */
function getAllTaskByCategoryId(req, res, next) {
    Task.find({"categoryId": new mongoose.Types.ObjectId(req.params.categoryId)}, function (err, result) {
        if (err) {
            next(err);
        }

        res.json(result);
    });
}

/**
 * Description: 添加一个分类
 * @param req - 需要的参数（分类名称，level， 父分类id）
 * @param res
 * @param next
 */
function addCategory(req, res, next) {
    var categoryDoc = generateCategoryDocument(req.body.categoryName, req.body.parentLevel, req.body.parentCategoryId);

    Category.create(categoryDoc, function (err, result) {
        if (err) {
            next(err);
        }

        var _result = result;
        if (req.body.parentCategoryId) {
            Category.findById(req.body.parentCategoryId, function (err, result) {
                if (err) {
                    next(err);
                }

                result.subCategoryIds.push(_result._id);
                result.save(function (err) {
                    if (err) {
                        next(err);
                    }
                });

                res.json(_result);
            });
        }
        else {
            res.json(_result);
        }
    });
}

/**
 * Description: 删除分类（包括子分类），并且删除分类下的任务
 * @param req - 需要传入分类的ID
 * @param res
 * @param next
 */
function deleteCategory(req, res, next) {
    var deleteCategoryIds = req.body.ids;

    // 不是root分类，需要从父节点的subIds删除自己
    if (req.body.parentCategoryId) {
        Category.findById(req.body.parentCategoryId, function (err, result) {
            if (err) {
                next(err);
            }
            var index = result.subCategoryIds.indexOf(new mongoose.Types.ObjectId(deleteCategoryIds[0]));

            result.subCategoryIds.splice(index,1);
            result.save(function (err) {
                if (err) {
                    next(err);
                }
            });
        });

        Category.remove({"_id": {$in: deleteCategoryIds}}, function (err) {
            if (err) {
                next(err);
            }

        });

        Task.remove({"categoryId": {$in: deleteCategoryIds}}, function (err) {
            if (err) {
                next(err);
            }
            res.json({err: false});
        });
    }
}

/**
 * Description: 添加一个任务
 * @param req - 需要的参数（任务名称，任务所属分类id，创建日期，结束日期） 日期为时间戳
 * @param res
 * @param next
 */
function addTask(req, res, next) {
    var task = generateTaskDocument(req.body['taskName'], req.body['categoryId'], req.body['createdDate'], req.body['deadlineDate']);

    Task.create(task, function (err, result) {
        if (err) {
            next(err);
        }

        var _result = result;
        Category.findById(task.categoryId, function (err, result) {
            if (err) {
                next(err);
            }

            result.allCount++;
            result.unfinishCount++;

            result.save(function (err) {
                if (err) {
                    next(err);
                }

                res.json(result);
            })
        });
    });
}

/**
 * Description: 修改一个任务
 * @param req - 需要的参数（任务名称，任务的id，结束日期，详细内容）
 * @param res
 * @param next
 */
function modifyTask(req, res, next) {
    var modifyFields = {
        taskName: req.body.taskName,
        deadlineDate: req.body.deadlineDate,
        detail: req.body.detail
    };

    Task.update({"_id": new mongoose.Types.ObjectId(req.body.id)}, {$set: modifyFields}, function (err, result) {
        if (err) {
            next(err);
        }

        res.json({err: false});
    });
}

/**
 * Description: 改变任务完成状态
 * @param req - 需要参数（taskid， 完成状态）
 * @param res
 * @param next
 */
function finishTask(req, res, next) {
    Task.update({"_id": new mongoose.Types.ObjectId(req.body.id)}, {isFinish: req.body.isFinish}, function (err, result) {
        if (err) {
            next(err);
        }
    });

    Category.findById(req.body.categoryId, function (err, result) {
        if (err) {
            next(err);
        }

        result.unfinishCount += JSON.parse(req.body.isFinish) ? -1 : 1;
        result.save(function (err) {
            if (err) {
                next(err);
            }

            res.json({err: false});
        })
    });
}

/**
 * Description: 改变任务星标状态
 * @param req - 需要参数（taskid， 星标状态）
 * @param res
 * @param next
 */
function starTask(req, res, next) {
    Task.update({"_id": new mongoose.Types.ObjectId(req.body.id)}, {isStar: req.body.isStar}, function (err, result) {
        if (err) {
            next(err);
        }

        res.json({err: false});
    });
}


/**
 * Description: 删除任务
 * @param req - 需要参数（任务id, 是否完成 ,分类id）
 * @param res
 * @param next
 */
function deleteTaskById(req, res, next) {
    var taskId = new mongoose.Types.ObjectId(req.body.taskId);
    var categoryId = new mongoose.Types.ObjectId(req.body.categoryId);

    Task.remove({"_id": taskId}, function (err) {
        if (err) {
            next(err);
        }

        Category.findById({"_id": categoryId}, function (err, result) {
            if (err) {
                next(err);
            }

            result.allCount = result.allCount - 1;
            if (req.body.isFinish == "false") {
                result.unfinishCount = result.unfinishCount - 1;
            }

            result.save(function (err) {
                if (err) {
                    next(err);
                }

                res.json({err: false});
            })
        });
    });
}

function changeTaskDeadline(req, res, next) {
    var deadline = req.body.deadlineDate ? new Date(req.body.deadlineDate) : null;
    Task.update({"_id": req.body.id}, {deadlineDate: deadline}, function (err) {
        if (err) {
            next(err);
        }

        res.json({err: false});
    })
}

/**
 * Description: 错误处理
 * @param err
 * @param req
 * @param res
 * @param next
 */
function errorHandle(err, req, res, next) {
    console.log(err);
    //res.json({err: true, errMsg: err.message});
    res.json({err: true});
}

exports.getTreeViewInitData = getTreeViewInitData;
exports.addCategory = addCategory;
exports.deleteCategory = deleteCategory;

exports.getAllTaskByCategoryId = getAllTaskByCategoryId;
exports.deleteTaskById = deleteTaskById;
exports.addTask = addTask;
exports.modifyTask = modifyTask;
exports.finishTask = finishTask;
exports.starTask = starTask;
exports.changeTaskDeadline = changeTaskDeadline;

exports.errorHandle = errorHandle;