const FormData = require('form-data');

const FileManager = require("../modules/FileManager");
const { checkToken } = require('../modules/UserManager');
const { addToMain, deleteDuplicates } = require('../modules/router');

class FileController {

    constructor() {
        this.folder = 'data/';
    }

    async fileUpload(req, res) {
        const token = req.headers.authorizationtoken;
        const tokenInfo = checkToken(token);
        if (tokenInfo.status === 200) {
            if (!req.file) {
                return res.status(400).send('No files were uploaded.');
            }
            const tableNamesInfo = await FileManager.getTablenames(true);
            const MainTableStatus = tableNamesInfo.msg.files[0] ? true : false;
            const uploadedFile = req.file;
            const formData = new FormData();
            formData.append('file', uploadedFile.buffer, { filename: uploadedFile.originalname });
            try {
                const answer = await deleteDuplicates(formData);
                if (answer.data) {
                    const groups = answer?.data?.groups;

                    const file = await FileManager.fileUpload(groups, uploadedFile, MainTableStatus, false);
                    if (file?.msg?.tableInfo?.tableName) {
                        const tableName = file?.msg?.tableName;
                        await FileManager.saveCash(answer?.data?.cash, tableName);
                        res.status(file.status).send(file.msg);
                    }

                } else res.status(500).send({ err: 'Что то пошло не так' });
            } catch (e) {
                console.log(e);
            }
        } else res.status(tokenInfo.status).send({});
    }

    async getTablenames(req, res) {
        const token = req?.headers?.authorizationtoken;
        if (token) {
            const tokenInfo = checkToken(token);
            if (tokenInfo.status === 200) {
                const tableNames = await FileManager.getTablenames();
                const tableNamesMain = await FileManager.getTablenames(true);
                const status = tableNames.status == 200 || tableNamesMain.status == 200 ? 200 : 500;
                const tablesAllInfo = { msg: { files: [tableNamesMain.msg?.files[0] ? tableNamesMain.msg?.files[0] : null, ...tableNames.msg?.files] }, status }
                res.status(tablesAllInfo.status).send(tablesAllInfo.msg);
            } else res.status(tokenInfo.status).send(tokenInfo.msg);
        } else res.status(500).send({ err: 'Ошибка авторизации. Сессия прервана' });

    }

    async getTableJson(req, res) {
        const token = req?.headers?.authorizationtoken;
        if (token) {
            const tokenInfo = checkToken(token);
            if (tokenInfo.status === 200) {
                const { tableName, main } = req.query;
                const data = FileManager.convertExcelToJsonByFilePath(tableName, main)
                res.status(data.status).json(data.msg);
            } else res.status(tokenInfo.status).send(tokenInfo.msg);
        } else res.status(500).send({ err: 'Ошибка авторизации. Сессия прервана' });
    }

    async deleteTable(req, res) {
        const token = req?.headers?.authorizationtoken;
        if (token) {
            const tokenInfo = checkToken(token);
            if (tokenInfo.status === 200) {
                const { tableName, main } = req.body;
                const deleteTableInfo = await FileManager.deleteTable(tableName, main);
                res.status(deleteTableInfo.status).send(deleteTableInfo.msg);
            } else res.status(tokenInfo.status).send(tokenInfo.msg);
        } else res.status(500).send({ err: 'Ошибка авторизации. Сессия прервана' });
    }

    async getFile(req, res) {
        const token = req?.headers?.authorizationtoken;
        if (token) {
            const tokenInfo = checkToken(token);
            if (tokenInfo.status === 200) {
                const tableNamesMain = await FileManager.getTablenames(true);
                if (tableNamesMain.msg?.files[0]) {
                    const filename = req.params.filename;
                    const fileInfo = await FileManager.getFile(filename, tableNamesMain.msg.files[0] == filename ? true : false);

                    res.set({
                        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'Content-Disposition': `attachment; filename="${filename}"`
                    });

                    res.status(fileInfo.status).send(fileInfo.msg);
                } else res.status(500).send('Ошибка при поиске таблицы');
            } else res.status(tokenInfo.status).send(tokenInfo.msg);
        } else res.status(500).send({ err: 'Ошибка авторизации. Сессия прервана' });
    }

    async addToMainTable(req, res) {
        const token = req?.headers?.authorizationtoken;
        if (token) {
            const tokenInfo = checkToken(token);
            if (tokenInfo.status === 200) {
                const tableNameMainInfo = await FileManager.getTablenames(true);
                if (tableNameMainInfo.msg?.files[0]) {
                    const tableNameForeign = req.body.tableName;
                    const tableNameMain = tableNameMainInfo.msg.files[0];
                    const answerTableForeign = FileManager.convertExcelToJsonByFilePath(tableNameForeign, false);
                    const answerMainTable = FileManager.convertExcelToJsonByFilePath(tableNameMain, true);

                    const tableDataForeign = answerTableForeign.msg.tableData;
                    const tableDataMain = answerMainTable.msg.tableData;
                    try {
                        const answer = await addToMain(
                            {
                                tableNameMain,
                                tableDataMain
                            },
                            {
                                tableNameForeign,
                                tableDataForeign
                            }
                        );
                        if (answer.data) {
                            const groups = answer.data?.groups;

                            const file = await FileManager.fileUpload(groups, true, tableNameMain, false, true);
                            res.status(file.status).send(file.msg);
                        }
                    } catch (e) {
                        console.log(e);
                    }
                } else res.status(500).send({ err: 'Главная таблица не найдена' })

            } else res.status(tokenInfo.status).send(tokenInfo.msg);
        } else res.status(500).send({ err: 'Ошибка авторизации. Сессия прервана' });
    }

    async switchMainTable(req, res) {
        const token = req?.headers?.authorizationtoken;
        if (token) {
            const tokenInfo = checkToken(token);
            if (tokenInfo.status === 200) {
                const { tableName } = req.body;

                const tableAnswer = await FileManager.getTablenames(true);
                const mainTableName = tableAnswer.msg?.files[0] ? tableAnswer.msg?.files[0] : null;

                const tableNameMainInfo = await FileManager.switchMainTable(tableName, mainTableName);

                res.status(tableNameMainInfo.status).send(tableNameMainInfo.msg);
            } else res.status(tokenInfo.status).send(tokenInfo.msg);
        } else res.status(500).send({ err: 'Ошибка авторизации. Сессия прервана' });
    }

}

module.exports = new FileController();