const axios = require('axios');

async function sendPost(method, body, headers = {}, params = '') {
    const answer = await axios.post(`http://localhost:5060/api/${method}${params}`, body, { headers: headers })
    if (answer)
        return answer
}

const addToMain = async (mainTable, foreignTable) => {
    return await sendPost('files/add-to-main-table',
        {
            mainTable, foreignTable
        },
    );
}

const deleteDuplicates = async (body) => {
    return await sendPost('files/upload-file', body)
}

module.exports = { addToMain, deleteDuplicates };