
const FileService = require("../services/file.service");
const { addToMain, deleteDuplicates } = require('../api');

class FileController {

    constructor() {
        this.folder = 'data/';
    }

    async fileUpload(req, res) {

        if (!req.file) {
            return res.status(400).send('No files were uploaded.');
        }

        const tableNamesInfo = await FileService.getTablenames(true);
        const MainTableStatus = tableNamesInfo.msg.files[0] ? true : false;
        const uploadedFile = req.file;
        console.log('file', uploadedFile);
        const tableDataInfo = FileService.convertExcelToJson(uploadedFile);
        console.log('tableDataInfo', tableDataInfo);
        if (tableDataInfo.msg?.tableData) {
            try {
                const answer = await deleteDuplicates(tableDataInfo.msg);
                if (answer.data) {
                    const groups = answer?.data?.groups;

                    const file = await FileService.fileUpload(groups, uploadedFile, MainTableStatus, false);
                    if (file?.msg?.tableInfo?.tableName) {
                        const tableName = file?.msg?.tableName;
                        await FileService.saveCash(answer?.data?.cash, tableName);
                        res.status(file.status).send(file.msg);
                    }

                } else res.status(500).send({ err: 'Что то пошло не так' });
            } catch (e) {
                console.log(e);
            }
        } else {
            res.status(tableDataInfo.status).send(tableDataInfo.msg);
        }
    }

    async getTablenames(req, res) {

        const tableNames = await FileService.getTablenames();
        const tableNamesMain = await FileService.getTablenames(true);
        const status = tableNames.status == 200 || tableNamesMain.status == 200 ? 200 : 500;
        const tablesAllInfo = { msg: { files: [tableNamesMain.msg?.files[0] ? tableNamesMain.msg?.files[0] : null, ...tableNames.msg?.files] }, status }
        res.status(tablesAllInfo.status).send(tablesAllInfo.msg);
    }

    async getTableJson(req, res) {

        const { tableName, main } = req.query;
        const data = FileService.convertExcelToJsonByFilePath(tableName, main)
        res.status(data.status).json(data.msg);
    }

    async deleteTable(req, res) {

        const { tableName, main } = req.body;
        const deleteTableInfo = await FileService.deleteTable(tableName, main);
        res.status(deleteTableInfo.status).send(deleteTableInfo.msg);
    }

    async getFile(req, res) {

        const tableNamesMain = await FileService.getTablenames(true);
        if (tableNamesMain.msg?.files[0]) {
            const filename = req.params.filename;
            const fileInfo = await FileService.getFile(filename, tableNamesMain.msg.files[0] == filename ? true : false);

            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`
            });

            res.status(fileInfo.status).send(fileInfo.msg);
        } else res.status(500).send('Ошибка при поиске таблицы');
    }

    async addToMainTable(req, res) {
        const tableNameMainInfo = await FileService.getTablenames(true);
        if (tableNameMainInfo.msg?.files[0]) {
            const tableNameForeign = req.body.tableName;
            const tableNameMain = tableNameMainInfo.msg.files[0];
            const answerTableForeign = FileService.convertExcelToJsonByFilePath(tableNameForeign, false);
            const answerMainTable = FileService.convertExcelToJsonByFilePath(tableNameMain, true);

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

                    const file = await FileService.fileUpload(groups, true, tableNameMain, false, true);
                    res.status(file.status).send(file.msg);
                }
            } catch (e) {
                console.log(e);
            }
        } else res.status(500).send({ err: 'Главная таблица не найдена' })
    }

    async switchMainTable(req, res) {

        const { tableName } = req.body;

        const tableAnswer = await FileService.getTablenames(true);
        const mainTableName = tableAnswer.msg?.files[0] ? tableAnswer.msg?.files[0] : null;

        const tableNameMainInfo = await FileService.switchMainTable(tableName, mainTableName);

        res.status(tableNameMainInfo.status).send(tableNameMainInfo.msg);
    }

}

module.exports = new FileController();