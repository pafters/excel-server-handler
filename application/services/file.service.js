const XLSX = require('xlsx');
const Excel = require('exceljs');
const fs = require('fs');
const path = require('path');
class FileService {

    units = [
        'мм', 'милиметр', 'см', 'сантиметр', 'м', 'метр', 'км', 'километр', 'д', 'дюйм', 'дюймов', 'дюйма', '"',
        'мл', 'милилитр', 'л', 'литр', 'литров', 'литра', 'барель',
        'шт', 'штука', 'штук', 'мм',
        'гр', 'грамм', 'кг', 'килограмм', 'т', 'тонн', 'г',
        'р', 'рубль', 'доллар', 'евро',
        'мл/гр', 'ед/г', 'кВт', 'мл/гр', 'лист', 'листов', 'в', 'v', 'ква', 'кв', 'киловатт', 'ватт', 'гц', 'герц', 'вольт',
        'хч', 'х', 'а', 'a', 'шт/рул', 'рул', 'рулон', 'шт/уп', 'об/мин', 'ч', 'оборот', 'об', 'оборотов', 'мин'
    ];
    folder = 'data/';
    folderMain = 'data/main'
    filePath = path.join(__dirname, '../../data');
    filePathMain = path.join(__dirname, '../../data/main');

    constructor() { }

    saveCash = async (cash, name) => {
        try {
            const jsonString = JSON.stringify(cash);
            await fs.writeFileSync(`cash/${name}.json`, jsonString)
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    getTablenames = async (main) => {
        try {
            const files = fs.readdirSync(main ? this.filePathMain : this.filePath);
            return { msg: { files }, status: 200 };
        } catch (e) {
            console.log(e);
            return { msg: { err: 'Ошибка получения названий' }, status: 200 };
        }
    }

    deleteTable = async (tableName, main) => {
        try {
            fs.unlinkSync(`${main ? this.filePathMain : this.filePath}/${tableName}`)
            return { msg: {}, status: 200 };
        } catch (e) {
            console.log(e);
            return { msg: { err: 'Ошибка удаления таблицы' }, status: 500 };
        }
    }

    getUnitListFromStr = (str) => {
        const words = str.split(' ');
        let result = [];
        for (let i = 0; i < words.length; i++) {
            const word = words[i];

            this.units.some((unit) => {
                if (
                    (word.toLowerCase().indexOf(unit) >= 0)
                    && ((((word.length > unit.length && (!isNaN(parseInt(word[0]))
                        || (word[0] === '(' && !isNaN(parseInt(word[1])))))
                        || word.length == unit.length))
                        ||
                        ((!isNaN(parseInt(word[0]))) || (!isNaN(parseInt(words[i - 1])) && isNaN(parseInt(word[0])))
                        ))
                ) {
                    if (!isNaN(parseInt(word[0])) || (!isNaN(parseInt(word[1])) && word[0] === '(')) {
                        if (!result.find((el) => el.indexOf(word) >= 0)) {
                            result.push(word);
                        }
                    }

                    else if (
                        (words[i - 1]) &&
                        (!isNaN(parseInt(words[i - 1][0])) || (!isNaN(parseInt(words[i - 1][1])) && words[i - 1][0] === '('))
                        && isNaN(parseInt(word[0])))
                        if (!result.find((el) => el.indexOf(words[i - 1]) >= 0)) {
                            result.push(words[i - 1] + ' ' + word);
                        }
                }
            });
        }

        return result.join(' ');
    }

    convertExcelToJson = (table) => {
        try {
            const workbook = XLSX.readFile(Uint8Array.from(table.buffer).buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0]; // Получаем имя первого листа
            const worksheet = workbook.Sheets[sheetName];
            const tableData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (tableData)
                return { msg: { tableData }, status: 200 };
            else return { msg: { err: 'Что то пошло не так' }, status: 500 }
        } catch (e) {
            console.log(e);
            return { msg: { err: 'Что то пошло не так' }, status: 500 }
        }
    }

    convertExcelToJsonByFilePath = (tableName, main) => {
        try {
            const workbook = XLSX.readFile(`${`${main}` !== 'false' ? this.filePathMain : this.filePath}/${tableName}`);
            const sheetName = workbook.SheetNames[0]; // Получаем имя первого листа
            const worksheet = workbook.Sheets[sheetName];
            const tableData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (tableData)
                return { msg: { tableData }, status: 200 };
            else return { msg: { err: 'Что то пошло не так' }, status: 500 }
        } catch (e) {
            console.log(e);
            return { msg: { err: 'Что то пошло не так' }, status: 500 }
        }
    }

    fileUpload = async (groups, uploadedFile, MainTableStatus, isAddToMain) => {
        const newWorkbook = new Excel.Workbook();
        const worksheet = newWorkbook.addWorksheet('Products');
        let rowIndex = 1; // начальный индекс строки
        Object.keys(groups).forEach(section => {
            const sectionData = groups[section];
            worksheet.getCell(`A${rowIndex}`).value = section; // добавляем section в столбец A
            worksheet.getCell(`B${rowIndex}`).value = ''; // оставляем столбец B пустым
            rowIndex++; // увеличиваем индекс строки

            Object.keys(sectionData).forEach(subsection => {
                const subData = sectionData[subsection];
                worksheet.getCell(`A${rowIndex}`).value = ''; // оставляем столбец A пустым
                worksheet.getCell(`B${rowIndex}`).value = subsection; // добавляем subsection в столбец B
                rowIndex++; // увеличиваем индекс строки

                subData.forEach(item => {
                    const filename = isAddToMain ? '' : ` (${uploadedFile?.originalname?.replace(/\./g, '')}-${Date.now()}.xlsx)`; // добавляем item в столбец C
                    worksheet.getCell(`A${rowIndex}`).value = ''; // оставляем столбец A пустым
                    worksheet.getCell(`B${rowIndex}`).value = ''; // оставляем столбец B пустым
                    worksheet.getCell(`C${rowIndex}`).value = item + filename;
                    worksheet.getCell(`D${rowIndex}`).value = this.getUnitListFromStr(item); // добавляем item в столбец C
                    rowIndex++; // увеличиваем индекс строки
                });
            });
            rowIndex++; // добавляем пустую строку между разделами
        });

        let tableName = isAddToMain ? uploadedFile : `${uploadedFile?.originalname?.replace(/\./g, '')}-${Date.now()}`;
        const path2 = `${!MainTableStatus ? (this.folderMain + '/' + tableName + '.xlsx') : (this.folder + '/' + tableName + '.xlsx')}`

        const tableInfo = await newWorkbook.xlsx.writeFile(path2).then(() => {
            return {
                folder: MainTableStatus ? this.folderMain : this.folder,
                tableName: tableName + '.xlsx'
            }
        });
        if (tableInfo) {
            return { msg: { tableInfo, tableName }, status: 200 }
        } else
            return { msg: { err: 'Ошибка обработки таблицы' }, status: 500 }
    }

    getFile = async (filename, main) => {
        try {
            const file = fs.readFileSync(`${main ? this.filePathMain : this.filePath}/${filename}`);
            return { msg: { file }, status: 200 }
        } catch (e) {
            console.log(e);
            return { msg: { err: 'Ошибка при поиске файла' }, status: 500 }
        }

    }

    switchMainTable = async (foreignTable, mainTable) => {
        const sourcePath = this.filePath + '/' + foreignTable;
        const destinationPath = this.filePathMain;
        try {
            if (fs.existsSync(sourcePath) && fs.existsSync(destinationPath)) {
                // Получаем имя файла из исходного пути
                if (mainTable) {
                    const mainSourcePath = this.filePathMain + '/' + mainTable;
                    if (fs.existsSync(mainSourcePath) && fs.existsSync(this.filePath)) {
                        fs.copyFileSync(mainSourcePath, this.filePath + '/' + mainTable);
                        fs.unlinkSync(mainSourcePath);
                    }
                }
                // Копируем файл в папку назначения
                fs.copyFileSync(sourcePath, destinationPath + '/' + foreignTable);
                // Удаляем исходный файл
                fs.unlinkSync(sourcePath);
                return { msg: {}, status: 200 }
            }
        } catch (e) {
            return { msg: { err: 'Ошибка перемещения таблицы' }, status: 500 }
        }
    }

}

module.exports = new FileService();