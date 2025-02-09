const Router = require('express');
const router = new Router();

const FileRouter = require('./file.router');

router.use('/files', FileRouter);

module.exports = router;