var express = require('express');
var router = express.Router();
var dbHandle = require('./db');

router.get('/api/initTreeView', dbHandle.getTreeViewInitData);
router.get('/api/gettask/:categoryId', dbHandle.getAllTaskByCategoryId);
router.post('/api/deleteCategory', dbHandle.deleteCategory);
router.post('/api/addtask', dbHandle.addTask);
router.post('/api/modifytask', dbHandle.modifyTask);
router.post('/api/addcategory', dbHandle.addCategory);
router.post('/api/deletetask', dbHandle.deleteTaskById);
router.post('/api/finishtask', dbHandle.finishTask);
router.post('/api/startask', dbHandle.starTask);


router.get('/', function (req, res, next) {
    res.render("index");
});


router.use('/api', dbHandle.errorHandle);

module.exports = router;
