const axios = require('axios');

async function sendPost(method, body, headers = {}, params = '') {
    const answer = await axios.post(`http://localhost:5060/api/${method}${params}`, body, { headers: headers })
    if (answer)
        return answer
}

async function sendGet(method, params = '', headers) {
    const answer = await axios.get(`http://localhost:5060/api/${method}${params}`, {
        headers: headers
    })
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

const deleteDuplicates = async (formData) => {
    return await sendPost('files/upload-file', formData,
        {
            'Content-Type': 'multipart/form-data',
        }
    )
}

module.exports = { addToMain, deleteDuplicates };