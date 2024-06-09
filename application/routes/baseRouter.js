const Router = require('express');
const router = new Router();

const FileRouter = require('./FileRouter');
const UserRouter = require('./UserRouter')

router.use('/files', FileRouter);
router.use('/users', UserRouter)

module.exports = router;