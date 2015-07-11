/**
 * Created by jiqinghua on 15/7/9.
 */

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

var cschema = new mongoose.Schema(categorySchema);
var tschema = new mongoose.Schema(taskSchema);

var Category = mongoose.model('Category', cschema);
var Task = mongoose.model('Task', tschema);


Category.findById(new mongoose.Types.ObjectId("559e1099572fb22d53b3c3d5"), function (err, result) {
    if (err) {
        next(err);
    }

    console.log(result);
    result.save(function (err) {
        if (err) {
            next(err);
        }
    });
});

Category.findById(new mongoose.Types.ObjectId(req.body.parentCategoryId), function (err, result) {
    if (err) {
        next(err);
    }

    console.log(req.body.parentCategoryId);
    result.subCategoryIds.push(_result._id);
    result.save(function (err) {
        if (err) {
            next(err);
        }
    });

    res.json(_result);
});
